import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..");
const phpConfig = path.join(repoRoot, "config.php");
const phpHandler = path.join(repoRoot, "contact-handler.php");
const nginxConfig = path.join(repoRoot, "deploy/hostinger/himmp.net.nginx");
const storageHardeningScript = path.join(repoRoot, "deploy/hostinger/harden-contact-storage.sh");
const rateLimitCleanupScript = path.join(repoRoot, "deploy/hostinger/cleanup-contact-rate-limits.php");
const rateLimitCleanupCron = path.join(repoRoot, "deploy/hostinger/himmp-rate-limit-cleanup.cron");
const tempRoot = mkdtempSync(path.join(tmpdir(), "himmp-hardening-"));

function phpLiteral(value) {
  return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

function runPhp(source) {
  const result = spawnSync("php", ["-d", "display_errors=1", "-r", source], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `PHP exited ${result.status}`);
  }
  return result.stdout.trim();
}

function phpBootstrap(directory, ip = "192.0.2.10") {
  return [
    `define('SUBMISSIONS_DIR', ${phpLiteral(directory)});`,
    "define('RATE_LIMIT_SUBMISSIONS', 5);",
    "define('RATE_LIMIT_WINDOW', 3600);",
    "define('HIMMP_CONTACT_TEST_MODE', true);",
    `$_SERVER['REMOTE_ADDR'] = ${phpLiteral(ip)};`,
    `require ${phpLiteral(phpHandler)};`
  ].join("");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function nginxServerBlocks(source) {
  const blocks = [];
  const marker = /\bserver\s*\{/g;
  let match;
  while ((match = marker.exec(source)) !== null) {
    let depth = 1;
    let index = marker.lastIndex;
    while (index < source.length && depth > 0) {
      if (source[index] === "{") depth += 1;
      if (source[index] === "}") depth -= 1;
      index += 1;
    }
    blocks.push(source.slice(match.index, index));
    marker.lastIndex = index;
  }
  return blocks;
}

async function concurrentRateLimitTest() {
  const directory = path.join(tempRoot, "concurrent");
  runPhp(`define('SUBMISSIONS_DIR', ${phpLiteral(directory)}); require ${phpLiteral(phpConfig)};`);
  const worker = `${phpBootstrap(directory)} echo consumeRateLimitAttempt() ? '1' : '0';`;
  const results = await Promise.all(
    Array.from({ length: 12 }, () => new Promise((resolve, reject) => {
      const child = spawn("php", ["-r", worker]);
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("error", reject);
      child.on("close", (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr)));
    }))
  );
  assert(results.filter((value) => value === "1").length === 5, "concurrent limit admitted other than five attempts");
  const rateFile = path.join(directory, `rate_limit_${runPhp("echo md5('192.0.2.10');")}.json`);
  const stored = JSON.parse(readFileSync(rateFile, "utf8"));
  assert(stored.count === 5, `concurrent rate count is ${stored.count}, expected 5`);
  assert((statSync(rateFile).mode & 0o777) === 0o600, "rate-limit file mode is not 0600");
  const maintenanceLock = path.join(directory, ".rate_limit_cleanup.lock");
  assert((statSync(maintenanceLock).mode & 0o777) === 0o600, "maintenance lock mode is not 0600");
}

async function cleanupLockContentionTest(directory, staleFile) {
  const lockFile = path.join(directory, ".rate_limit_cleanup.lock");
  const source = `$h=fopen(${phpLiteral(lockFile)},'c');flock($h,LOCK_SH);echo "locked\\n";` +
    `fflush(STDOUT);fgets(STDIN);flock($h,LOCK_UN);fclose($h);`;
  const holder = spawn("php", ["-r", source], { stdio: ["pipe", "pipe", "pipe"] });
  await new Promise((resolve, reject) => {
    let output = "";
    holder.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.includes("locked\n")) resolve();
    });
    holder.on("error", reject);
    holder.on("exit", (code) => reject(new Error(`maintenance lock holder exited early with ${code}`)));
  });

  const skipped = spawnSync("php", [rateLimitCleanupScript, directory, "7200"], { encoding: "utf8" });
  assert(skipped.status === 0, skipped.stderr || "locked cleanup did not exit successfully");
  assert(skipped.stdout.includes("deleted=0 deferred=150 failed=0"), `cleanup did not defer locked state: ${skipped.stdout.trim()}`);
  assert(existsSync(staleFile), "cleanup deleted state while the contact-handler lock was held");

  holder.stdin.write("\n");
  await new Promise((resolve, reject) => {
    holder.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`maintenance lock holder exited ${code}`)));
  });
}

try {
  const sessionDirectory = path.join(tempRoot, "session");
  const sessionResult = JSON.parse(runPhp(
    `define('SUBMISSIONS_DIR', ${phpLiteral(sessionDirectory)}); require ${phpLiteral(phpConfig)}; echo json_encode(session_get_cookie_params());`
  ));
  assert(sessionResult.secure === true, "session cookie is not Secure");
  assert(sessionResult.httponly === true, "session cookie is not HttpOnly");
  assert(sessionResult.samesite === "Lax", "session cookie SameSite is not Lax");

  const csrfDirectory = path.join(tempRoot, "csrf");
  const csrfResult = runPhp(
    `${phpBootstrap(csrfDirectory)}` +
    `$_SESSION[CSRF_TOKEN_NAME]='valid'; $_SESSION[CSRF_TOKEN_NAME.'_time']=time(); $_POST['csrf_token']='valid';` +
    `$first=validateCSRFToken(); $removed=!isset($_SESSION[CSRF_TOKEN_NAME]);` +
    `$_SESSION[CSRF_TOKEN_NAME]='expired'; $_SESSION[CSRF_TOKEN_NAME.'_time']=time()-CSRF_TOKEN_EXPIRY-1; $_POST['csrf_token']='expired';` +
    `echo ($first && $removed && !validateCSRFToken()) ? 'ok' : 'fail';`
  );
  assert(csrfResult === "ok", "CSRF rotation or expiry behavior failed");

  const sequentialDirectory = path.join(tempRoot, "sequential");
  const sequential = runPhp(
    `${phpBootstrap(sequentialDirectory)}` +
    `$accepted=[]; for($i=0;$i<6;$i++){$accepted[]=consumeRateLimitAttempt();}` +
    `echo json_encode($accepted);`
  );
  assert(JSON.stringify(JSON.parse(sequential)) === JSON.stringify([true, true, true, true, true, false]), "sequential rate limit failed");

  const cleanupDirectory = path.join(tempRoot, "cleanup");
  runPhp(`define('SUBMISSIONS_DIR', ${phpLiteral(cleanupDirectory)}); require ${phpLiteral(phpConfig)};`);
  const staleRateFiles = [];
  for (let index = 0; index < 150; index++) {
    const file = path.join(cleanupDirectory, `rate_limit_${index.toString(16).padStart(32, "0")}.json`);
    writeFileSync(file, JSON.stringify({ count: 1, timestamp: 1 }));
    utimesSync(file, 0, 0);
    staleRateFiles.push(file);
  }
  const freshRateFile = path.join(cleanupDirectory, `rate_limit_${"a".repeat(32)}.json`);
  const unrelatedFile = path.join(cleanupDirectory, "submission_retained.txt");
  const symlinkRateFile = path.join(cleanupDirectory, `rate_limit_${"b".repeat(32)}.json`);
  const nonRegularRatePath = path.join(cleanupDirectory, `rate_limit_${"c".repeat(32)}.json`);
  writeFileSync(freshRateFile, JSON.stringify({ count: 1, timestamp: Math.floor(Date.now() / 1000) }));
  writeFileSync(unrelatedFile, "retained fixture");
  utimesSync(unrelatedFile, 0, 0);
  symlinkSync(unrelatedFile, symlinkRateFile);
  mkdirSync(nonRegularRatePath);
  utimesSync(nonRegularRatePath, 0, 0);

  await cleanupLockContentionTest(cleanupDirectory, staleRateFiles[0]);
  const cleanup = spawnSync("php", [rateLimitCleanupScript, cleanupDirectory, "7200"], { encoding: "utf8" });
  assert(cleanup.status === 0, cleanup.stderr || "rate-limit cleanup failed");
  assert(cleanup.stdout.includes("examined=151 deleted=150 deferred=0 failed=0"), `unexpected cleanup report: ${cleanup.stdout.trim()}`);
  assert(staleRateFiles.every((file) => !existsSync(file)), "full cleanup left expired state beyond the former 100-entry boundary");
  assert(existsSync(freshRateFile), "cleanup deleted fresh rate-limit state");
  assert(existsSync(unrelatedFile), "cleanup deleted an unrelated submission file");
  assert(existsSync(symlinkRateFile), "cleanup followed or deleted a symbolic link");
  assert(existsSync(nonRegularRatePath), "cleanup deleted a matching-name non-regular entry");

  const cleanupCron = readFileSync(rateLimitCleanupCron, "utf8");
  assert(cleanupCron.includes("17 * * * * www-data"), "hourly rate-limit cleanup schedule is missing");
  assert(cleanupCron.includes("/usr/bin/nice -n 10"), "cleanup schedule is not low priority");
  assert(cleanupCron.includes("cleanup-contact-rate-limits.php"), "cleanup schedule does not invoke the collector");
  assert(cleanupCron.includes(" 7200 "), "cleanup schedule does not enforce two-window retention");

  const invalidStoragePath = path.join(tempRoot, "invalid-storage");
  runPhp(`define('SUBMISSIONS_DIR', ${phpLiteral(invalidStoragePath)}); require ${phpLiteral(phpConfig)};`);
  mkdirSync(path.join(invalidStoragePath, `rate_limit_${runPhp("echo md5('192.0.2.10');")}.json`));
  const failClosed = runPhp(`${phpBootstrap(invalidStoragePath)} echo consumeRateLimitAttempt() ? 'open' : 'closed';`);
  assert(failClosed === "closed", "rate limiting did not fail closed when storage was unavailable");

  const malformedDirectory = path.join(tempRoot, "malformed-storage");
  runPhp(`define('SUBMISSIONS_DIR', ${phpLiteral(malformedDirectory)}); require ${phpLiteral(phpConfig)};`);
  const malformedRateFile = path.join(malformedDirectory, `rate_limit_${runPhp("echo md5('192.0.2.10');")}.json`);
  writeFileSync(malformedRateFile, "{truncated");
  const malformedClosed = runPhp(`${phpBootstrap(malformedDirectory)} echo consumeRateLimitAttempt() ? 'open' : 'closed';`);
  assert(malformedClosed === "closed", "malformed rate-limit state did not fail closed");
  writeFileSync(malformedRateFile, "{}");
  const schemaClosed = runPhp(`${phpBootstrap(malformedDirectory)} echo consumeRateLimitAttempt() ? 'open' : 'closed';`);
  assert(schemaClosed === "closed", "schema-invalid rate-limit state did not fail closed");

  const mailFailureDirectory = path.join(tempRoot, "mail-failure");
  const mailFailureResponse = JSON.parse(runPhp(
    `define('SUBMISSIONS_DIR', ${phpLiteral(mailFailureDirectory)});` +
    `define('CONTACT_MAIL_TRANSPORT', 'invalid-test-transport');` +
    `define('HIMMP_CONTACT_TEST_MODE', true);` +
    `$_SERVER['REMOTE_ADDR']='192.0.2.20'; $_SERVER['REQUEST_METHOD']='POST';` +
    `require ${phpLiteral(phpHandler)};` +
    `$_SESSION[CSRF_TOKEN_NAME]='mail-failure-token'; $_SESSION[CSRF_TOKEN_NAME.'_time']=time();` +
    `$_POST=['name'=>'Test Sender','email'=>'sender@example.test','subject'=>'Mail failure test',` +
    `'message'=>'This accepted request must count even when mail delivery fails.','csrf_token'=>'mail-failure-token'];` +
    `handleContactRequest();`
  ));
  assert(mailFailureResponse.success === false, "mail-failure fixture unexpectedly succeeded");
  const mailFailureRateFile = path.join(mailFailureDirectory, `rate_limit_${runPhp("echo md5('192.0.2.20');")}.json`);
  assert(JSON.parse(readFileSync(mailFailureRateFile, "utf8")).count === 1, "accepted mail failure was not rate-limited");

  const logDirectory = path.join(tempRoot, "logging");
  const logFile = runPhp(
    `${phpBootstrap(logDirectory)}` +
    `logSubmission('Name','person@example.test','Subject','A sufficiently long message');` +
    `$files=glob(SUBMISSIONS_DIR.'/submission_*.txt'); echo $files[0] ?? '';`
  );
  assert(logFile !== "", "submission log was not created");
  assert((statSync(logFile).mode & 0o777) === 0o600, "submission log mode is not 0600");
  assert((statSync(logDirectory).mode & 0o777) === 0o700, "submission directory mode is not 0700");

  await concurrentRateLimitTest();

  const nginx = readFileSync(nginxConfig, "utf8");
  const serverBlocks = nginxServerBlocks(nginx);
  const wwwBlocks = serverBlocks.filter((block) => /server_name\s+www\.himmp\.net;/.test(block));
  assert(wwwBlocks.length === 2, `expected two www server blocks, found ${wwwBlocks.length}`);
  assert(wwwBlocks.every((block) => block.includes("return 301 https://himmp.net$request_uri;")), "www canonical redirect missing from a server block");
  const tlsBlocks = serverBlocks.filter((block) => /listen\s+443\s+ssl;/.test(block));
  assert(tlsBlocks.length === 2, `expected two TLS server blocks, found ${tlsBlocks.length}`);
  for (const block of tlsBlocks) {
    assert(block.includes('Strict-Transport-Security "max-age=31536000; includeSubDomains" always'), "HSTS header missing from a TLS server block");
    assert(block.includes('Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always'), "Permissions-Policy header missing from a TLS server block");
    assert(block.includes('add_header Content-Security-Policy "'), "enforcing CSP missing from a TLS server block");
    assert(block.includes("server_tokens off;"), "server token suppression missing from a TLS server block");
  }
  assert(!nginx.includes("Content-Security-Policy-Report-Only"), "report-only CSP remained after enforcement promotion");
  assert(nginx.includes("zone=himmp_csrf:10m rate=30r/m"), "CSRF endpoint rate zone missing");
  assert(nginx.includes("zone=himmp_contact:10m rate=10r/m"), "contact endpoint rate zone missing");
  assert(nginx.includes("limit_req zone=himmp_csrf burst=10 nodelay;"), "CSRF endpoint rate limit missing");
  assert(nginx.includes("limit_req zone=himmp_contact burst=10 nodelay;"), "contact endpoint rate limit missing");

  const migrationDirectory = path.join(tempRoot, "permission-migration");
  mkdirSync(migrationDirectory, { mode: 0o750 });
  const legacyFile = path.join(migrationDirectory, "submission_legacy.txt");
  writeFileSync(legacyFile, "legacy fixture", { mode: 0o644 });
  const currentUser = spawnSync("id", ["-un"], { encoding: "utf8" }).stdout.trim();
  const currentGroup = spawnSync("id", ["-gn"], { encoding: "utf8" }).stdout.trim();
  const migration = spawnSync(
    "bash",
    [storageHardeningScript, migrationDirectory, currentUser, currentGroup],
    { encoding: "utf8" }
  );
  assert(migration.status === 0, migration.stderr || "contact permission migration failed");
  assert((statSync(migrationDirectory).mode & 0o777) === 0o700, "migration did not secure directory mode");
  assert((statSync(legacyFile).mode & 0o777) === 0o600, "migration did not secure existing file mode");
  assert(statSync(migrationDirectory).uid === process.getuid(), "migration did not set directory ownership");
  assert(statSync(legacyFile).uid === process.getuid(), "migration did not set file ownership");

  console.log("Hardening tests passed: sessions, CSRF, rate limiting, file modes, and Nginx policy.");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
