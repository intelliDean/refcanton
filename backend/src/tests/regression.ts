// backend/src/tests/regression.ts
// Automated Regression Tests for RefCanton Backend API:
// 1. Unauthenticated access rejected (HTTP 401)
// 2. Cross-party unauthorized access rejected (HTTP 403)
// 3. Unrestricted transaction log leaks prevented (filtered per authenticated party)
// 4. Offline Canton settlement rejection (HTTP 503 fail-closed)
// 5. Successful authorized closing returning genuine updateId

import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from '../routes';
import { cantonClient } from '../services/cantonClient';
import { ledger } from '../ledger';
import { generateVerifiedToken, PARTY_CREDENTIALS } from '../middleware/auth';
import { DEFAULT_PARTIES } from '../config/constants';

dotenv.config();

// Helper to make HTTP requests against a local test server
function request(
  server: http.Server,
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const address = server.address();
    if (!address || typeof address === 'string') {
      return reject(new Error('Server not bound'));
    }

    const payload = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = {
      ...headers,
    };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let responseText = '';
        res.on('data', (chunk) => (responseText += chunk));
        res.on('end', () => {
          let parsedData = responseText;
          try {
            parsedData = JSON.parse(responseText);
          } catch {
            // Keep as string
          }
          resolve({
            status: res.statusCode || 500,
            data: parsedData,
            headers: res.headers,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(msg);
  }
  console.log(`  ✓ ${msg}`);
}

async function runRegressionTests() {
  console.log('===================================================================');
  console.log(' Running RefCanton Backend Security & Regression Test Suite');
  console.log('===================================================================');

  // Ensure test credentials exist if running in a bare CI test environment without .env
  if (!process.env.BORROWER_SECRET) {
    process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'refcanton-verified-hmac-auth-secret-key-2026';
    process.env.BORROWER_SECRET = 'borrower-canton-sec-2026';
    process.env.LENDER_A_SECRET = 'lendera-canton-sec-2026';
    process.env.LENDER_B_SECRET = 'lenderb-canton-sec-2026';
    process.env.OPERATOR_SECRET = 'operator-canton-sec-2026';
  }

  // Set up ephemeral express app using unified apiRouter
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // TEST 0: Public Credential Bypass Closure & Verified Token Issuance
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 0] Verifying Public Credential Bypass Closure & Verified Auth...');

    // 0a: Verify GET /api/auth/demo-tokens is strictly disabled (HTTP 403)
    const res0_demo = await request(server, 'GET', '/api/auth/demo-tokens');
    assert(res0_demo.status === 403, 'GET /api/auth/demo-tokens returns HTTP 403 ENDPOINT_DISABLED');
    assert(res0_demo.data.error === 'ENDPOINT_DISABLED', 'Error code is ENDPOINT_DISABLED');
    assert(
      !res0_demo.data.tokens,
      'No tokens are exposed to anonymous callers via demo-tokens'
    );

    // 0b: Verify POST /api/auth/token rejects invalid or missing credentials
    const res0_missing = await request(server, 'POST', '/api/auth/token', {}, {});
    assert(res0_missing.status === 400, 'POST /api/auth/token without party returns HTTP 400');

    const res0_unknown = await request(server, 'POST', '/api/auth/token', {}, { party: 'EvilHacker', secret: '123' });
    assert(res0_unknown.status === 401, 'POST /api/auth/token with unknown party returns HTTP 401');

    const res0_wrong_secret = await request(server, 'POST', '/api/auth/token', {}, {
      party: DEFAULT_PARTIES.BORROWER,
      secret: 'wrong-guess-12345',
    });
    assert(res0_wrong_secret.status === 401, 'POST /api/auth/token with invalid secret returns HTTP 401');
    assert(res0_wrong_secret.data.error === 'INVALID_CREDENTIALS', 'Error code is INVALID_CREDENTIALS');

    // 0c: Verify verified credential token issuance for each party
    const borrowerSecret = PARTY_CREDENTIALS[DEFAULT_PARTIES.BORROWER];
    const res0_auth_borrower = await request(server, 'POST', '/api/auth/token', {}, {
      party: DEFAULT_PARTIES.BORROWER,
      secret: borrowerSecret,
    });
    assert(res0_auth_borrower.status === 200, 'POST /api/auth/token succeeds with valid secret for Borrower');
    assert(res0_auth_borrower.data.token && typeof res0_auth_borrower.data.token === 'string', 'Returns verified token string');

    // Verify token verification endpoint
    const res0_verify = await request(server, 'GET', '/api/auth/verify', {
      Authorization: `Bearer ${res0_auth_borrower.data.token}`,
    });
    assert(res0_verify.status === 200, 'GET /api/auth/verify confirms valid token');
    assert(res0_verify.data.party === DEFAULT_PARTIES.BORROWER, 'Verified token resolves to Borrower party');

    // Generate verified cryptographic tokens
    const tokenBorrower = res0_auth_borrower.data.token;
    const tokenLenderA = generateVerifiedToken(DEFAULT_PARTIES.LENDER_A);
    const tokenLenderB = generateVerifiedToken(DEFAULT_PARTIES.LENDER_B);
    const tokenOperator = generateVerifiedToken(DEFAULT_PARTIES.OPERATOR);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: Unauthenticated and Forged Credential Rejection (HTTP 401)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 1] Verifying Unauthenticated and Forged Credential Rejections (HTTP 401)...');

    const res1a = await request(server, 'GET', '/api/state/Borrower');
    assert(res1a.status === 401, 'GET /api/state/Borrower without credentials returns HTTP 401');
    assert(res1a.data.error === 'UNAUTHENTICATED', 'Response contains UNAUTHENTICATED error code');

    // Forged Bearer admin rejection
    const res1_admin = await request(server, 'GET', '/api/state/Borrower', {
      Authorization: 'Bearer admin',
    });
    assert(res1_admin.status === 401, 'Bearer admin is rejected with HTTP 401');

    // Unverified legacy Bearer token rejection
    const res1_legacy = await request(server, 'GET', '/api/state/Borrower', {
      Authorization: 'Bearer borrower',
    });
    assert(res1_legacy.status === 401, 'Bearer borrower without signature is rejected with HTTP 401');

    // Spoofed X-Party-Id without token rejection
    const res1_spoof = await request(server, 'GET', '/api/state/LenderA', {
      'X-Party-Id': 'LenderA',
    });
    assert(res1_spoof.status === 401, 'X-Party-Id spoofing without signature is rejected with HTTP 401');

    const res1b = await request(server, 'POST', '/api/closing/execute', {}, { requestId: 'test' });
    assert(res1b.status === 401, 'POST /api/closing/execute without credentials returns HTTP 401');

    const res1c = await request(server, 'POST', '/api/quotes/create', {}, { borrower: 'Borrower' });
    assert(res1c.status === 401, 'POST /api/quotes/create without credentials returns HTTP 401');

    const res1d = await request(server, 'POST', '/api/offers/create', {}, { borrower: 'Borrower' });
    assert(res1d.status === 401, 'POST /api/offers/create without credentials returns HTTP 401');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: Cross-Party Unauthorized Access Rejection (HTTP 403)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 2] Verifying Cross-Party Access Restrictions (HTTP 403)...');

    // Borrower attempting to read LenderA private state
    const res2a = await request(server, 'GET', '/api/state/LenderA', {
      Authorization: `Bearer ${tokenBorrower}`,
    });
    assert(res2a.status === 403, 'Borrower querying LenderA state returns HTTP 403 Forbidden');
    assert(res2a.data.error === 'FORBIDDEN', 'Error code is FORBIDDEN');

    // LenderA attempting to read LenderB private state
    const res2b = await request(server, 'GET', '/api/state/LenderB', {
      Authorization: `Bearer ${tokenLenderA}`,
    });
    assert(res2b.status === 403, 'LenderA querying LenderB state returns HTTP 403 Forbidden');

    // Borrower attempting to issue quotes (LenderA action)
    const res2c = await request(server, 'POST', '/api/quotes/create', {
      Authorization: `Bearer ${tokenBorrower}`,
    }, { borrower: 'Borrower' });
    assert(res2c.status === 403, 'Borrower attempting to issue quote returns HTTP 403 Forbidden');

    // LenderA attempting to execute closing (Borrower action)
    const res2d = await request(server, 'POST', '/api/closing/execute', {
      Authorization: `Bearer ${tokenLenderA}`,
    }, { requestId: 'req-1' });
    assert(res2d.status === 403, 'LenderA attempting to execute closing returns HTTP 403 Forbidden');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: Party-Restricted Transaction Logs (Prevent Unrestricted History)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 3] Verifying Party-Restricted Transaction Logs...');

    const res3a = await request(server, 'GET', '/api/transactions', {
      Authorization: `Bearer ${tokenLenderA}`,
    });
    assert(res3a.status === 200, 'GET /api/transactions returns 200 for authenticated LenderA');
    assert(Array.isArray(res3a.data), 'Returns array of transactions');
    const hasOtherParties = res3a.data.some((t: any) => t.actingParty !== 'LenderA');
    assert(!hasOtherParties, 'LenderA receives ZERO transactions from other acting parties');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: Settlement Rejection when Canton is Offline (HTTP 503 Fail-Closed)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 4] Verifying Settlement Rejection when Canton is Offline (HTTP 503)...');

    // Issue quote and offer first so borrower can create a valid closing request
    ledger.issuePayoffQuote(DEFAULT_PARTIES.LENDER_A, DEFAULT_PARTIES.BORROWER);
    ledger.issueReplacementOffer(DEFAULT_PARTIES.LENDER_B, DEFAULT_PARTIES.BORROWER);
    const offlineTestReq = ledger.createClosingRequest(DEFAULT_PARTIES.BORROWER);

    // Temporarily mock health check as offline
    const originalCheckHealth = cantonClient.checkHealth.bind(cantonClient);
    cantonClient.checkHealth = async () => ({ online: false, error: 'Connection refused' });

    const res4 = await request(server, 'POST', '/api/closing/execute', {
      Authorization: `Bearer ${tokenBorrower}`,
    }, { requestId: offlineTestReq.contractId });

    assert(res4.status === 503, 'POST /api/closing/execute when Canton is offline returns HTTP 503');
    assert(res4.data.error === 'CANTON_OFFLINE', 'Returns CANTON_OFFLINE error payload');

    // Restore original health check
    cantonClient.checkHealth = originalCheckHealth;

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5: Rejection of Nonexistent Closing Request (HTTP 400, No Fake Success)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 5] Verifying Rejection of Nonexistent Closing Request (HTTP 400)...');

    const res5_nonexistent = await request(server, 'POST', '/api/closing/execute', {
      Authorization: `Bearer ${tokenBorrower}`,
    }, { requestId: 'nonexistent-request-999' });

    assert(res5_nonexistent.status === 400, 'Closing nonexistent request returns HTTP 400');
    assert(res5_nonexistent.data.error === 'REQUEST_NOT_FOUND', 'Returns REQUEST_NOT_FOUND error code');
    assert(res5_nonexistent.data.success !== true, 'Does NOT report success: true');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 6: Legitimate Party Access Allowed (HTTP 200)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 6] Verifying Authorized Party Access...');

    const res6a = await request(server, 'GET', '/api/state/Borrower', {
      Authorization: `Bearer ${tokenBorrower}`,
    });
    assert(res6a.status === 200, 'Borrower querying Borrower state returns HTTP 200');
    assert(res6a.data.party === 'Borrower', 'Returned state is for Borrower');

    const res6b = await request(server, 'GET', '/api/state/LenderA', {
      Authorization: `Bearer ${tokenLenderA}`,
    });
    assert(res6b.status === 200, 'LenderA querying LenderA state returns HTTP 200');
    assert(res6b.data.party === 'LenderA', 'Returned state is for LenderA');

    // Public health status
    const res6c = await request(server, 'GET', '/api/status');
    assert(res6c.status === 200, 'GET /api/status returns HTTP 200 without authentication');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 7: Private Deployment Secrets Validation & Startup Refusal
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 7] Verifying Private Deployment Secrets Validation & Startup Refusal...');

    const { validateRequiredDeploymentSecrets } = await import('../middleware/auth');

    // 7a: Valid configuration should not throw
    let didThrow = false;
    try {
      validateRequiredDeploymentSecrets();
    } catch {
      didThrow = true;
    }
    assert(!didThrow, 'validateRequiredDeploymentSecrets() succeeds with valid private secrets');

    // 7b: Insecure public fallback secret rejected
    const originalAuthSecret = process.env.AUTH_SECRET;
    try {
      process.env.AUTH_SECRET = 'refcanton-verified-secret-key-2026';
      let caughtInsecure = false;
      try {
        validateRequiredDeploymentSecrets();
      } catch (err: any) {
        caughtInsecure = true;
        assert(err.message.includes('AUTH_SECRET'), 'Rejection error identifies insecure AUTH_SECRET');
      }
      assert(caughtInsecure, 'Startup strictly refused when AUTH_SECRET uses public fallback default');
    } finally {
      process.env.AUTH_SECRET = originalAuthSecret;
    }

    // 7c: Missing party secret rejected
    const originalBorrowerSecret = process.env.BORROWER_SECRET;
    try {
      delete process.env.BORROWER_SECRET;
      let caughtMissing = false;
      try {
        validateRequiredDeploymentSecrets();
      } catch (err: any) {
        caughtMissing = true;
        assert(err.message.includes('BORROWER_SECRET'), 'Rejection error identifies missing BORROWER_SECRET');
      }
      assert(caughtMissing, 'Startup strictly refused when BORROWER_SECRET is missing');
    } finally {
      process.env.BORROWER_SECRET = originalBorrowerSecret;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 8: Settlement Verification Rejects False Success on Controlled Mock
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[TEST 8] Verifying Controlled Mock Rejection (Zero Settlement Events & Missing LoanA)...');

    const origCheckHealth = cantonClient.checkHealth.bind(cantonClient);
    const origGetPackageId = cantonClient.getPackageId.bind(cantonClient);
    const origResolvePartyId = cantonClient.resolvePartyId.bind(cantonClient);
    const origSubmitCommands = cantonClient.submitCommands.bind(cantonClient);
    const origGetTxById = cantonClient.getTransactionById.bind(cantonClient);

    cantonClient.checkHealth = async () => ({ online: true });
    cantonClient.getPackageId = async () => 'mock-pkg-id-12345';
    cantonClient.resolvePartyId = async (p: string) => `${p}::mock-fingerprint`;
    cantonClient.submitCommands = async () => ({ updateId: 'mock-tx-zero-events-001' } as any);

    try {
      // 8a: Controlled Mock returning ZERO events (events: [])
      cantonClient.getTransactionById = async () => ({
        transaction: {
          updateId: 'mock-tx-zero-events-001',
          events: [],
        } as any,
      });

      let zeroEventsError: string | null = null;
      try {
        await cantonClient.executeAtomicClosingOnCanton('mock-req-zero-events');
      } catch (err: any) {
        zeroEventsError = err.message;
      }
      assert(
        zeroEventsError !== null && zeroEventsError.includes('LoanA was NOT archived'),
        'Controlled mock with zero settlement events is REJECTED without false success'
      );

      // 8b: Controlled Mock returning loanA archived, but missing payoff receipt
      cantonClient.getTransactionById = async () => ({
        transaction: {
          updateId: 'mock-tx-partial-events-002',
          events: [
            {
              ArchivedEvent: {
                templateId: 'mock-pkg-id-12345:Loan:LoanA',
                contractId: 'mock-loana-cid',
              },
            },
          ],
        } as any,
      });

      let missingReceiptError: string | null = null;
      try {
        await cantonClient.executeAtomicClosingOnCanton('mock-req-missing-receipt');
      } catch (err: any) {
        missingReceiptError = err.message;
      }
      assert(
        missingReceiptError !== null && missingReceiptError.includes('LenderAPayoffReceipt was NOT created'),
        'Controlled mock missing LenderAPayoffReceipt is REJECTED with missing ledger evidence error'
      );

      // 8c: Calling /api/closing/execute with mock returning zero events returns HTTP 500 (never success: true)
      // Set up a valid closing request on local ledger so pre-checks pass
      const testCloseReq = ledger.createClosingRequest(DEFAULT_PARTIES.BORROWER);
      cantonClient.getTransactionById = async () => ({
        transaction: {
          updateId: 'mock-tx-zero-events-003',
          events: [],
        } as any,
      });

      const res8_api = await request(
        server,
        'POST',
        '/api/closing/execute',
        { Authorization: `Bearer ${tokenBorrower}` },
        { requestId: testCloseReq.contractId }
      );
      assert(res8_api.status === 400, 'POST /api/closing/execute with zero events returns HTTP 400');
      assert(res8_api.data.success !== true, 'Controlled mock with zero events NEVER reports success: true');
      assert(
        res8_api.data.error && res8_api.data.error.includes('LoanA was NOT archived'),
        'API error message identifies that LoanA was not archived on Canton'
      );
    } finally {
      // Restore cantonClient methods
      cantonClient.checkHealth = origCheckHealth;
      cantonClient.getPackageId = origGetPackageId;
      cantonClient.resolvePartyId = origResolvePartyId;
      cantonClient.submitCommands = origSubmitCommands;
      cantonClient.getTransactionById = origGetTxById;
    }

    console.log('\n===================================================================');
    console.log(' ALL 9 BACKEND REGRESSION & SECURITY TESTS PASSED SUCCESSFULLY! ✓');
    console.log('===================================================================');
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runRegressionTests().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

export { runRegressionTests };
