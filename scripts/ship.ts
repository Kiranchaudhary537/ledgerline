// `pnpm ship`: verify, push, wait until production runs this commit, then smoke-test it.
// Render and Vercel auto-deploy `main`; optional deploy hooks cover auto-deploy being off.
import { execSync, spawnSync } from 'node:child_process';

const WEB_URL = process.env.SHIP_WEB_URL ?? 'https://ledgerline.vercel.app';
const POLL_INTERVAL_MS = 10_000;
// Free Render instances build slowly and cold-start in about a minute.
const DEPLOY_TIMEOUT_MS = 15 * 60_000;

function step(title: string) {
  console.log(`\n▸ ${title}`);
}

function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function run(command: string) {
  const { status } = spawnSync(command, { shell: true, stdio: 'inherit' });
  if (status !== 0) fail(`"${command}" failed`);
}

const output = (command: string) => execSync(command, { encoding: 'utf8' }).trim();

function assertReleasable() {
  if (output('git rev-parse --abbrev-ref HEAD') !== 'main') fail('Ship from the main branch.');
  if (output('git status --porcelain')) fail('Commit or stash your changes first.');
}

async function triggerHooks() {
  for (const name of ['RENDER_DEPLOY_HOOK_URL', 'VERCEL_DEPLOY_HOOK_URL']) {
    const url = process.env[name];
    if (!url) continue;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) fail(`${name} answered ${res.status}`);
    console.log(`  triggered ${name}`);
  }
}

async function readJson(url: string): Promise<Record<string, unknown> | undefined> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return res.ok ? ((await res.json()) as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

async function waitFor(label: string, url: string, key: string, commit: string) {
  const deadline = Date.now() + DEPLOY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const body = await readJson(url);
    if (body?.[key] === commit) return console.log(`  ${label} is live at ${commit.slice(0, 7)}`);
    console.log(`  ${label}: ${String(body?.[key] ?? 'not ready').slice(0, 7)}, waiting…`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  fail(`${label} did not reach ${commit.slice(0, 7)} within ${DEPLOY_TIMEOUT_MS / 60_000} min`);
}

async function expectStatus(path: string, status: number) {
  const res = await fetch(`${WEB_URL}${path}`, { redirect: 'manual' });
  if (res.status !== status) fail(`${path} answered ${res.status}, expected ${status}`);
  console.log(`  ${path} → ${status}`);
}

async function smokeLogin() {
  const email = process.env.SHIP_SMOKE_EMAIL;
  const password = process.env.SHIP_SMOKE_PASSWORD;
  if (!email || !password) return console.log('  login skipped (set SHIP_SMOKE_EMAIL/PASSWORD)');
  const res = await fetch(`${WEB_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const cookie = res.headers.get('set-cookie') ?? '';
  if (res.status !== 200) fail(`login answered ${res.status}`);
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax']) {
    if (!cookie.includes(flag)) fail(`session cookie is missing ${flag}`);
  }
  console.log('  login → 200, cookie HttpOnly; Secure; SameSite=Lax');
}

step('Checking branch and working tree');
assertReleasable();
step('Typecheck, lint, format, DB types, tests');
run('pnpm check');
step('Build');
run('pnpm build');
step('Push');
run('git push origin main');
const commit = output('git rev-parse HEAD');
await triggerHooks();
step(`Waiting for ${WEB_URL} to run ${commit.slice(0, 7)}`);
await waitFor('API', `${WEB_URL}/api/health`, 'version', commit);
await waitFor('Web', `${WEB_URL}/version.json`, 'commit', commit);
step('Smoke tests');
await expectStatus('/api/employees', 401);
await expectStatus('/employees', 200);
await smokeLogin();
console.log(`\n✔ Shipped ${commit.slice(0, 7)} to ${WEB_URL}`);
