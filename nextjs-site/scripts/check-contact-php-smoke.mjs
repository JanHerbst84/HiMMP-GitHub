import process from "node:process";

const args = process.argv.slice(2);

function readArg(name) {
  const prefix = `${name}=`;
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) {
    return args[index + 1];
  }

  const inline = args.find((arg) => arg.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : null;
}

const baseUrlInput = readArg("--base-url") ?? process.env.CONTACT_BASE_URL;
const submit = args.includes("--submit") || process.env.CONTACT_SMOKE_SUBMIT === "1";
// `--message-tag <text>` prepends a grep-able tag to the submission
// subject + message body so a deliberate production submission (e.g. the
// far-goal criterion 10 stability gate) can be identified and cleaned
// up after the fact. Without the flag, the legacy hardcoded copy is
// used.
const messageTag = readArg("--message-tag");
const allowProductionSubmit =
  args.includes("--allow-production-submit") ||
  process.env.CONTACT_SMOKE_ALLOW_PRODUCTION_SUBMIT === "1";
const allowMailFailure =
  args.includes("--allow-mail-failure") || process.env.CONTACT_SMOKE_ALLOW_MAIL_FAILURE === "1";

if (!baseUrlInput) {
  console.error(
    "Missing contact smoke-test target. Set CONTACT_BASE_URL=https://staging.example or pass --base-url."
  );
  process.exit(2);
}

const baseUrl = new URL(baseUrlInput);
const basePath = baseUrl.pathname.endsWith("/") ? baseUrl.pathname : `${baseUrl.pathname}/`;
const cookieJar = new Map();
const failures = [];
const warnings = [];

function endpoint(pathname) {
  const url = new URL(baseUrl);
  const relativePath = pathname.replace(/^\/+/, "");
  url.pathname = `${basePath}${relativePath}`.replace(/\/{2,}/g, "/");
  url.search = "";
  url.hash = "";
  return url.toString();
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function addCookies(headers) {
  const setCookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : splitCombinedSetCookieHeader(headers.get("set-cookie"));

  for (const cookie of setCookies) {
    const [pair] = cookie.split(";");
    const separator = pair.indexOf("=");
    if (separator > 0) {
      cookieJar.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
}

function splitCombinedSetCookieHeader(header) {
  if (!header) {
    return [];
  }

  return header.split(/,(?=\s*[^;,=\s]+=[^;,]*)/);
}

function cookieHeader() {
  return [...cookieJar].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function request(pathname, init = {}) {
  const headers = new Headers(init.headers ?? {});
  const cookies = cookieHeader();
  if (cookies) {
    headers.set("cookie", cookies);
  }

  const response = await fetch(endpoint(pathname), {
    ...init,
    headers,
    redirect: "manual",
  });
  addCookies(response.headers);
  return response;
}

async function readJson(response, label) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    fail(`${label}: expected JSON response, received ${JSON.stringify(text.slice(0, 120))}`);
    return null;
  }
}

async function checkTokenEndpoint() {
  const response = await request("/get-csrf-token.php");
  if (response.status !== 200) {
    fail(`get-csrf-token.php: expected HTTP 200, received ${response.status}`);
    return null;
  }

  const payload = await readJson(response, "get-csrf-token.php");
  const token = payload?.token;
  if (typeof token !== "string" || token.length < 32) {
    fail("get-csrf-token.php: JSON response did not include a plausible CSRF token");
    return null;
  }

  if (!cookieHeader()) {
    fail("get-csrf-token.php: no PHP session cookie was set for CSRF validation");
  }

  return token;
}

async function checkHandlerGet() {
  const response = await request("/contact-handler.php");
  if (response.status !== 200) {
    fail(`contact-handler.php GET: expected HTTP 200 JSON rejection, received ${response.status}`);
    return;
  }

  const payload = await readJson(response, "contact-handler.php GET");
  if (payload?.success !== false || typeof payload?.message !== "string") {
    fail("contact-handler.php GET: did not return the expected JSON rejection shape");
  }
}

async function checkInvalidCsrfRejection() {
  const body = new FormData();
  body.set("name", "HiMMP Smoke Test");
  body.set("email", "noreply@himmp.net");
  body.set("subject", "Invalid CSRF smoke test");
  body.set("message", "This message should be rejected before logging or mail delivery.");
  body.set("csrf_token", "invalid-smoke-token");

  const response = await request("/contact-handler.php", {
    method: "POST",
    body,
  });

  if (response.status !== 200) {
    fail(
      `contact-handler.php invalid CSRF POST: expected HTTP 200 JSON rejection, received ${response.status}`
    );
    return;
  }

  const payload = await readJson(response, "contact-handler.php invalid CSRF POST");
  if (payload?.success !== false || typeof payload?.message !== "string") {
    fail("contact-handler.php invalid CSRF POST: did not return the expected JSON rejection shape");
  }
}

async function checkSensitivePaths() {
  const configResponse = await request("/config.php");
  const configBody = await configResponse.text();
  if (/(<\?php|CONTACT_EMAIL|CONTACT_FROM_EMAIL|SUBMISSIONS_DIR|session_start)/i.test(configBody)) {
    fail("config.php: PHP source/configuration appears to be downloadable from the public web");
  } else if (configResponse.status === 200 && configBody.trim()) {
    warn("config.php: endpoint returned HTTP 200 with output; confirm this is intentional and not static leakage");
  }

  const submissionsResponse = await request("/contact_submissions/");
  const submissionsBody = await submissionsResponse.text();
  if (/Index of|submission_|rate_limit_/i.test(submissionsBody)) {
    fail("contact_submissions/: directory listing or stored submission markers are publicly visible");
  } else if (submissionsResponse.status === 200) {
    warn(
      "contact_submissions/: returned HTTP 200 without visible listing markers; confirm this is a safe fallback response, not a public directory"
    );
  }
}

async function checkRealSubmission(token) {
  const body = new FormData();
  const subjectPrefix = messageTag ? `${messageTag} ` : "";
  const bodyPrefix = messageTag ? `${messageTag}\n\n` : "";
  body.set("name", "HiMMP Staging Smoke Test");
  body.set("email", "noreply@himmp.net");
  body.set("subject", `${subjectPrefix}[staging smoke] ${new Date().toISOString()}`);
  body.set(
    "message",
    `${bodyPrefix}Automated staging smoke test for the HiMMP contact form. This checks the real PHP mail/log path.`
  );
  body.set("csrf_token", token);

  const response = await request("/contact-handler.php", {
    method: "POST",
    body,
  });

  if (response.status !== 200) {
    fail(`contact-handler.php real POST: expected HTTP 200 JSON response, received ${response.status}`);
    return;
  }

  const payload = await readJson(response, "contact-handler.php real POST");
  if (payload?.success === true) {
    return;
  }

  const message = typeof payload?.message === "string" ? payload.message : "";
  if (/too many submissions/i.test(message)) {
    fail("contact-handler.php real POST: staging rate limit was reached before mail/logging could be verified");
    return;
  }

  if (/security validation|csrf/i.test(message)) {
    fail("contact-handler.php real POST: CSRF validation failed during the real submission check");
    return;
  }

  if (/please correct|valid email|required|less than/i.test(message)) {
    fail("contact-handler.php real POST: validation failed during the real submission check");
    return;
  }

  if (allowMailFailure) {
    warn("contact-handler.php real POST: mail did not report success; treating as a staging-only exception");
    return;
  }

  fail(
    `contact-handler.php real POST: expected successful mail path, received ${JSON.stringify(
      payload?.message ?? payload
    )}`
  );
}

const token = await checkTokenEndpoint();
await checkHandlerGet();
await checkInvalidCsrfRejection();
await checkSensitivePaths();

if (submit) {
  const productionSubmitBlocked =
    /^(www\.)?himmp\.net$/i.test(baseUrl.hostname) && !allowProductionSubmit;

  if (productionSubmitBlocked) {
    fail(
      "contact-handler.php real POST: refusing to submit to production host without --allow-production-submit"
    );
  }

  if (!productionSubmitBlocked) {
    if (token) {
      await checkRealSubmission(token);
    } else {
      fail("contact-handler.php real POST: skipped because CSRF token acquisition failed");
    }
  }
}

if (failures.length > 0) {
  console.error(`Contact PHP smoke test failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

if (warnings.length > 0) {
  console.log(`Contact PHP smoke test warnings (${warnings.length}):`);
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

console.log(
  `Contact PHP smoke test passed for ${baseUrl.origin}${baseUrl.pathname === "/" ? "" : baseUrl.pathname}.`
);
console.log(
  submit
    ? "Real submission path: checked."
    : "Real submission path: skipped; pass --submit to test mail/logging."
);
