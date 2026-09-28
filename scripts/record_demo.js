// scripts/record_demo.js
// Automated 1080p Screen Capture of Live RefCanton Application for Demo Video

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');

const SCREENSHOT_DIR = '/tmp/refcanton_demo_frames';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resetLedger() {
  return new Promise((resolve, reject) => {
    const tokenReq = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const token = JSON.parse(body).token;
        const resetReq = http.request({
          hostname: 'localhost',
          port: 4000,
          path: '/api/reset',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }, (resetRes) => {
          let rBody = '';
          resetRes.on('data', c => rBody += c);
          resetRes.on('end', () => resolve(JSON.parse(rBody)));
        });
        resetReq.on('error', reject);
        resetReq.end();
      });
    });
    tokenReq.on('error', reject);
    tokenReq.write(JSON.stringify({ party: 'Operator', secret: 'operator-canton-sec-2026' }));
    tokenReq.end();
  });
}

async function run() {
  console.log('[Demo Recorder] Resetting ledger state to baseline...');
  await resetLedger();
  await sleep(2000);

  console.log('[Demo Recorder] Launching headless Chrome (1920x1080)...');
  const browser = await puppeteer.launch({
    executablePath: '/opt/google/chrome/chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:4000', { waitUntil: 'networkidle0' });
  await sleep(1500);

  // 1. Borrower Overview
  console.log('[Frame 1] Initial Borrower Dashboard...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_borrower_initial.png') });

  // 2. Open Auth Modal & Authenticate as Borrower
  console.log('[Frame 2] Authenticating as Borrower...');
  await page.evaluate(() => { window.toggleAuthModal(true); });
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_auth_modal.png') });

  await page.evaluate(() => {
    document.getElementById('authSecretInput').value = 'borrower-canton-sec-2026';
    window.submitAuth();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_borrower_authenticated.png') });

  // 3. Switch to Lender A and Authenticate
  console.log('[Frame 3] Switching to Lender A & Authenticating...');
  await page.evaluate(() => { window.setRole('LenderA'); });
  await sleep(800);
  await page.evaluate(() => {
    document.getElementById('authPartySelect').value = 'LenderA';
    document.getElementById('authSecretInput').value = 'lendera-canton-sec-2026';
    window.submitAuth();
  });
  await sleep(1500);

  // Issue Payoff Quote
  console.log('[Frame 4] Lender A Issuing Payoff Quote on Canton Participant 2...');
  await page.evaluate(() => { window.issuePayoffQuote(); });
  await sleep(4000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_lendera_quote_issued.png') });

  // 4. Switch to Lender B and Authenticate
  console.log('[Frame 5] Switching to Lender B & Authenticating...');
  await page.evaluate(() => { window.setRole('LenderB'); });
  await sleep(800);
  await page.evaluate(() => {
    document.getElementById('authPartySelect').value = 'LenderB';
    document.getElementById('authSecretInput').value = 'lenderb-canton-sec-2026';
    window.submitAuth();
  });
  await sleep(1500);

  // Commit Replacement Offer
  console.log('[Frame 6] Lender B Committing Replacement Offer on Canton Participant 3...');
  await page.evaluate(() => { window.issueReplacementOffer(); });
  await sleep(4000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_lenderb_offer_committed.png') });

  // 5. Switch back to Borrower - Ready to Close
  console.log('[Frame 7] Borrower Reviewing Pipeline Ready to Close...');
  await page.evaluate(() => { window.setRole('Borrower'); });
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_borrower_ready_to_close.png') });

  // 6. Execute Atomic Close on Canton
  console.log('[Frame 8] Executing Atomic Closing choice on Canton...');
  await page.evaluate(() => { window.requestAndExecuteClose(); });
  await sleep(5000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_atomic_closing_committed.png') });

  // 7. Open Privacy Inspector Modal
  console.log('[Frame 9] Inspecting Canton Sub-Transaction Privacy...');
  await page.evaluate(() => { window.togglePrivacyInspector(true); });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_privacy_inspector.png') });
  await page.evaluate(() => { window.togglePrivacyInspector(false); });
  await sleep(600);

  // 8. Open Audit Log Modal
  console.log('[Frame 10] Inspecting Canton Ledger Audit Trail...');
  await page.evaluate(() => { window.toggleTxModal(true); });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_audit_log.png') });
  await page.evaluate(() => { window.toggleTxModal(false); });
  await sleep(500);

  await browser.close();
  console.log('[Demo Recorder] All frames captured successfully in', SCREENSHOT_DIR);
}

run().catch(err => {
  console.error('[Demo Recorder Error]', err);
  process.exit(1);
});
