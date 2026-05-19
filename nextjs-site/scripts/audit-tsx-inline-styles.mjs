/*
 * TSX inline-style snapshot audit.
 *
 * Recursively scans src/site/components/pages and app for every
 * `style={...}` inline expression, lists the literal colour / font /
 * size values inside them, and emits a canonical snapshot at
 * `nextjs-site/scripts/audit-tsx-inline-styles.snapshot.json`.
 *
 * Modes:
 *   default   — compute snapshot and compare against committed file.
 *   --update  — overwrite the committed snapshot with the fresh one.
 *
 * The snapshot is the load-bearing reference for the D-10 inline-style
 * modernisation workstream (post-D-1, gated on a revised content-
 * preservation contract). The far-goal does NOT require these inline
 * styles to be modernised; it requires only that they are inventoried,
 * the snapshot is current, and any new `style=` expression added to
 * route code is captured.
 *
 * Exit codes: 0 OK, 1 drift / missing, 2 usage.
 *
 * See `docs/nextjs-phase-2-far-goal.md` criterion 4.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NEXT_ROOT = resolve(__dirname, '..');
const SNAPSHOT_PATH = join(NEXT_ROOT, 'scripts', 'audit-tsx-inline-styles.snapshot.json');

const args = process.argv.slice(2);
const update = args.includes('--update');
for (const a of args) {
  if (a !== '--update') {
    console.error(`Unknown argument: ${a}`);
    process.exit(2);
  }
}

function walk(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, ext, out);
    else if (entry.endsWith(ext)) out.push(full);
  }
  return out;
}

const targets = [
  ...walk(join(NEXT_ROOT, 'src', 'site', 'components', 'pages'), '.tsx'),
  ...walk(join(NEXT_ROOT, 'app'), '.tsx')
].sort();

function findStyleExpressions(src) {
  const hits = [];
  const re = /style\s*=\s*\{/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const startIdx = m.index;
    let i = m.index + m[0].length;
    let depth = 1;
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      i++;
    }
    if (depth !== 0) continue;
    const expr = src.slice(m.index + m[0].length, i - 1);
    const line = src.slice(0, startIdx).split('\n').length;
    hits.push({ line, expr: expr.trim() });
  }
  return hits;
}

function extractEntries(expr) {
  let body = expr.trim();
  if (body.startsWith('{') && body.endsWith('}')) {
    body = body.slice(1, -1).trim();
  } else {
    return [{ kind: 'complex', text: expr }];
  }
  const entries = [];
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /[\s,]/.test(body[i])) i++;
    if (i >= body.length) break;
    if (body[i] === '.' && body.slice(i, i + 3) === '...') {
      const start = i;
      let depth = 0;
      while (i < body.length && (body[i] !== ',' || depth > 0)) {
        if (/[{(\[]/.test(body[i])) depth++;
        else if (/[})\]]/.test(body[i])) depth--;
        i++;
      }
      entries.push({ kind: 'spread', text: body.slice(start, i).trim() });
      continue;
    }
    const keyStart = i;
    if (body[i] === '"' || body[i] === "'" || body[i] === '`') {
      const quote = body[i];
      i++;
      while (i < body.length && body[i] !== quote) {
        if (body[i] === '\\') i++;
        i++;
      }
      i++;
    } else if (body[i] === '[') {
      // Computed-key expression `[expr]: value`. Skip past the matching
      // `]` (respecting depth) so the rest of the loop can read the
      // `:` and value. Capture the bracket expression as the key text
      // verbatim — D-10 modernisation may rework these.
      i++;
      let depth = 1;
      while (i < body.length && depth > 0) {
        if (body[i] === '[') depth++;
        else if (body[i] === ']') depth--;
        i++;
      }
    } else {
      while (i < body.length && /[A-Za-z0-9_$\-]/.test(body[i])) i++;
    }
    const key = body.slice(keyStart, i).trim();
    while (i < body.length && /\s/.test(body[i])) i++;
    if (body[i] !== ':') {
      entries.push({ kind: 'complex', text: body.slice(keyStart).trim() });
      break;
    }
    i++;
    while (i < body.length && /\s/.test(body[i])) i++;
    const valStart = i;
    let depth = 0;
    while (i < body.length && (body[i] !== ',' || depth > 0)) {
      const c = body[i];
      if (c === '"' || c === "'" || c === '`') {
        const quote = c;
        i++;
        while (i < body.length && body[i] !== quote) {
          if (body[i] === '\\') i++;
          i++;
        }
      } else if (/[{(\[]/.test(c)) depth++;
      else if (/[})\]]/.test(c)) depth--;
      i++;
    }
    const value = body.slice(valStart, i).trim();
    entries.push({ kind: 'kv', key, value });
  }
  return entries;
}

const snapshot = [];
for (const path of targets) {
  const rel = relative(NEXT_ROOT, path);
  const src = readFileSync(path, 'utf8');
  const hits = findStyleExpressions(src);
  for (const hit of hits) {
    const entries = extractEntries(hit.expr);
    snapshot.push({
      file: rel,
      line: hit.line,
      expr: hit.expr.replace(/\s+/g, ' ').trim(),
      entries
    });
  }
}

const fresh = JSON.stringify(snapshot, null, 2) + '\n';

if (update) {
  writeFileSync(SNAPSHOT_PATH, fresh);
  console.log(`Snapshot updated: ${SNAPSHOT_PATH}`);
  console.log(`  Files scanned: ${targets.length}`);
  console.log(`  style={} expressions captured: ${snapshot.length}`);
  process.exit(0);
}

console.log('TSX inline-styles snapshot audit');
console.log(`  Files scanned: ${targets.length}`);
console.log(`  style={} expressions found: ${snapshot.length}`);

if (!existsSync(SNAPSHOT_PATH)) {
  console.error(`  Snapshot file not committed: ${SNAPSHOT_PATH}`);
  console.error(`  Run with --update to create it.`);
  process.exit(1);
}

const committed = readFileSync(SNAPSHOT_PATH, 'utf8');
if (committed === fresh) {
  console.log('  Result: OK (snapshot matches committed file).');
  process.exit(0);
}

console.log('  Result: DRIFT (committed snapshot is stale).');
console.log('  Run `node scripts/audit-tsx-inline-styles.mjs --update` to refresh.');
process.exit(1);
