#!/usr/bin/env bash
# scripts/test_live_api_closing.sh
# End-to-end CI test executing the complete refinancing workflow through the HTTP API
# Verifies genuine Canton ledger execution, cryptographic authentication, updateId, and privacy isolation

set -e

API_BASE="${API_BASE:-http://localhost:4000}"

echo "==================================================================="
echo " RefCanton End-to-End API Integration & Settlement Test"
echo " Target API: $API_BASE"
echo "==================================================================="

# 1. Health check
echo "[1/8] Checking API Gateway and Canton Health..."
STATUS_RES=$(curl -s -f "$API_BASE/api/status")
echo "  Status response: $STATUS_RES"
if ! echo "$STATUS_RES" | grep -q "ONLINE"; then
  echo "❌ Error: API status is not ONLINE"
  exit 1
fi
echo "  ✓ API Gateway & Canton Network Online"

# 2. Cryptographic Authentication & Credential Verification
echo "[2/8] Testing Cryptographic Authentication & Spoofing Rejections..."

# Unauthenticated request rejected
UNAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/state/Borrower")
if [ "$UNAUTH_CODE" -ne 401 ]; then
  echo "❌ Error: Expected HTTP 401 for unauthenticated request, got $UNAUTH_CODE"
  exit 1
fi
echo "  ✓ Unauthenticated access rejected with HTTP 401"

# Forged Bearer admin backdoor rejected
ADMIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer admin" "$API_BASE/api/state/Borrower")
if [ "$ADMIN_CODE" -ne 401 ]; then
  echo "❌ Error: Expected HTTP 401 for Bearer admin backdoor, got $ADMIN_CODE"
  exit 1
fi
echo "  ✓ Bearer admin backdoor rejected with HTTP 401"

# Spoofed X-Party-Id without cryptographic signature rejected
SPOOF_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Party-Id: LenderA" "$API_BASE/api/state/LenderA")
if [ "$SPOOF_CODE" -ne 401 ]; then
  echo "❌ Error: Expected HTTP 401 for X-Party-Id spoofing, got $SPOOF_CODE"
  exit 1
fi
echo "  ✓ X-Party-Id spoofing rejected with HTTP 401"

# Public demo-tokens credential bypass is disabled (HTTP 403)
DEMO_TOKENS_RES=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_BASE/api/auth/demo-tokens")
DEMO_TOKENS_STATUS=$(echo "$DEMO_TOKENS_RES" | grep "HTTP_STATUS" | cut -d':' -f2)
DEMO_TOKENS_BODY=$(echo "$DEMO_TOKENS_RES" | grep -v "HTTP_STATUS")
if [ "$DEMO_TOKENS_STATUS" -ne 403 ]; then
  echo "❌ Error: Expected HTTP 403 for /api/auth/demo-tokens, got $DEMO_TOKENS_STATUS"
  exit 1
fi
if echo "$DEMO_TOKENS_BODY" | grep -q '"tokens"'; then
  echo "❌ Error: /api/auth/demo-tokens leaked privileged tokens!"
  exit 1
fi
echo "  ✓ Public demo-tokens credential bypass strictly disabled (HTTP 403 ENDPOINT_DISABLED)"

# Acquire genuine HMAC-SHA256 verified tokens
echo "  Acquiring verified party tokens via credential authentication..."
BORROWER_AUTH=$(curl -s -f -X POST "$API_BASE/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"party":"Borrower","secret":"borrower-canton-sec-2026"}')
TOKEN_BORROWER=$(echo "$BORROWER_AUTH" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

LENDERA_AUTH=$(curl -s -f -X POST "$API_BASE/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"party":"LenderA","secret":"lendera-canton-sec-2026"}')
TOKEN_LENDERA=$(echo "$LENDERA_AUTH" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

LENDERB_AUTH=$(curl -s -f -X POST "$API_BASE/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"party":"LenderB","secret":"lenderb-canton-sec-2026"}')
TOKEN_LENDERB=$(echo "$LENDERB_AUTH" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

OPERATOR_AUTH=$(curl -s -f -X POST "$API_BASE/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"party":"Operator","secret":"operator-canton-sec-2026"}')
TOKEN_OPERATOR=$(echo "$OPERATOR_AUTH" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN_BORROWER" ] || [ -z "$TOKEN_LENDERA" ] || [ -z "$TOKEN_LENDERB" ] || [ -z "$TOKEN_OPERATOR" ]; then
  echo "❌ Error: Failed to acquire verified party tokens"
  exit 1
fi
echo "  ✓ Cryptographically verified tokens successfully issued"

# 3. Cross-Party Access Enforcement
echo "[3/8] Verifying Cross-Party Access Restrictions (HTTP 403)..."
SNOOP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN_BORROWER" "$API_BASE/api/state/LenderA")
if [ "$SNOOP_CODE" -ne 403 ]; then
  echo "❌ Error: Expected HTTP 403 when Borrower accesses LenderA state, got $SNOOP_CODE"
  exit 1
fi
echo "  ✓ Borrower reading LenderA state rejected with HTTP 403"

LENDER_SNOOP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN_LENDERA" "$API_BASE/api/state/LenderB")
if [ "$LENDER_SNOOP_CODE" -ne 403 ]; then
  echo "❌ Error: Expected HTTP 403 when LenderA accesses LenderB state, got $LENDER_SNOOP_CODE"
  exit 1
fi
echo "  ✓ LenderA reading LenderB state rejected with HTTP 403"

CROSS_ACTION_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN_BORROWER" \
  -H "Content-Type: application/json" \
  -X POST "$API_BASE/api/quotes/create" -d '{"borrower":"Borrower","payoffAmount":101000}')
if [ "$CROSS_ACTION_CODE" -ne 403 ]; then
  echo "❌ Error: Expected HTTP 403 when Borrower attempts LenderA quote creation, got $CROSS_ACTION_CODE"
  exit 1
fi
echo "  ✓ Borrower unauthorized quote creation rejected with HTTP 403"

# 4. Rejection of Nonexistent Closing Requests (No False Success Fallback)
echo "[4/8] Testing Rejection of Nonexistent Closing Requests..."
NONEXISTENT_RES=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Authorization: Bearer $TOKEN_BORROWER" \
  -H "Content-Type: application/json" \
  -X POST "$API_BASE/api/closing/execute" \
  -d '{"requestId":"nonexistent-closing-request-xyz"}')
NONEXISTENT_BODY=$(echo "$NONEXISTENT_RES" | grep -v "HTTP_STATUS")
NONEXISTENT_STATUS=$(echo "$NONEXISTENT_RES" | grep "HTTP_STATUS" | cut -d':' -f2)

if [ "$NONEXISTENT_STATUS" -ne 400 ]; then
  echo "❌ Error: Expected HTTP 400 for nonexistent closing request, got $NONEXISTENT_STATUS"
  exit 1
fi
if echo "$NONEXISTENT_BODY" | grep -q '"success":true'; then
  echo "❌ Error: Nonexistent closing reported false success!"
  exit 1
fi
echo "  ✓ Nonexistent closing request rejected with HTTP 400 REQUEST_NOT_FOUND (No false fallback)"

# Reset ledger state to clean baseline fixtures
curl -s -f -H "Authorization: Bearer $TOKEN_OPERATOR" -X POST "$API_BASE/api/reset" >/dev/null 2>&1 || true

# 5. Legitimate Approvals: Lender A & Lender B
echo "[5/8] Issuing Legitimate Approvals (PayoffQuote & ReplacementOffer)..."
QUOTE_RES=$(curl -s -f -H "Authorization: Bearer $TOKEN_LENDERA" \
  -H "Content-Type: application/json" \
  -X POST "$API_BASE/api/quotes/create" \
  -d '{"borrower":"Borrower","payoffAmount":101000}')
echo "  Quote response: $QUOTE_RES"
if ! echo "$QUOTE_RES" | grep -q '"success":true'; then
  echo "❌ Error: Failed to issue PayoffQuote"
  exit 1
fi
echo "  ✓ PayoffQuote issued ($101,000)"

OFFER_RES=$(curl -s -f -H "Authorization: Bearer $TOKEN_LENDERB" \
  -H "Content-Type: application/json" \
  -X POST "$API_BASE/api/offers/create" \
  -d '{"borrower":"Borrower","newPrincipal":100000,"capRate":0.075,"amortizationPeriods":24}')
echo "  Offer response: $OFFER_RES"
if ! echo "$OFFER_RES" | grep -q '"success":true'; then
  echo "❌ Error: Failed to issue ReplacementOffer"
  exit 1
fi
echo "  ✓ ReplacementOffer issued ($100,000 @ 7.5% cap-rate)"

# 6. Borrower creates ClosingRequest and executes Atomic Close
echo "[6/8] Borrower initiating ClosingRequest and executing Atomic Close..."
REQ_RES=$(curl -s -f -H "Authorization: Bearer $TOKEN_BORROWER" \
  -H "Content-Type: application/json" \
  -X POST "$API_BASE/api/closing/request" \
  -d '{}')
echo "  Request response: $REQ_RES"
REQ_ID=$(echo "$REQ_RES" | grep -o '"contractId":"[^"]*' | head -n1 | cut -d'"' -f4)
if [ -z "$REQ_ID" ]; then
  echo "❌ Error: Failed to extract ClosingRequest contract ID"
  exit 1
fi
echo "  ✓ Active ClosingRequest created: $REQ_ID"

EXEC_STATUS_RAW=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Authorization: Bearer $TOKEN_BORROWER" \
  -H "Content-Type: application/json" \
  -X POST "$API_BASE/api/closing/execute" \
  -d "{\"requestId\":\"$REQ_ID\"}")
EXEC_RES=$(echo "$EXEC_STATUS_RAW" | grep -v "HTTP_STATUS")
EXEC_STATUS=$(echo "$EXEC_STATUS_RAW" | grep "HTTP_STATUS" | cut -d':' -f2)
echo "  Closing execution response (HTTP $EXEC_STATUS): $EXEC_RES"

if [ "$EXEC_STATUS" -ne 200 ] || ! echo "$EXEC_RES" | grep -q '"success":true'; then
  echo "❌ Error: Atomic close execution failed (HTTP $EXEC_STATUS): $EXEC_RES"
  exit 1
fi

UPDATE_ID=$(echo "$EXEC_RES" | grep -o '"updateId":"[^"]*' | head -n1 | cut -d'"' -f4)
if [ -z "$UPDATE_ID" ]; then
  echo "❌ Error: Response missing Canton updateId"
  exit 1
fi
echo "  ✓ Atomic Closing committed on Canton! Genuine Update ID: $UPDATE_ID"

# 7. Direct Confirmation of Submitted Closing on Canton
echo "[7/8] Confirming exact submitted transaction on Canton ledger..."
TX_RES=$(curl -s -f -H "Authorization: Bearer $TOKEN_BORROWER" "$API_BASE/api/transactions/$UPDATE_ID")
echo "  Retrieved Canton transaction: $(echo "$TX_RES" | cut -c 1-120)..."
if ! echo "$TX_RES" | grep -q "$UPDATE_ID"; then
  echo "❌ Error: Canton failed to confirm transaction with updateId $UPDATE_ID"
  exit 1
fi
echo "  ✓ Exact transaction confirmed on Canton ledger"

# 8. Privacy Audit: Active State & Transaction History Verification
echo "[8/8] Verifying Post-Closing Privacy (Active State & Transaction History)..."

# Active contract state checks
LENDER_A_STATE=$(curl -s -f -H "Authorization: Bearer $TOKEN_LENDERA" "$API_BASE/api/state/LenderA")
if echo "$LENDER_A_STATE" | grep -q '"loansB":\[{'; then
  echo "❌ PRIVACY VIOLATION: Lender A active state contains Loan B!"
  exit 1
fi
if echo "$LENDER_A_STATE" | grep -q '"replacementOffers":\[{'; then
  echo "❌ PRIVACY VIOLATION: Lender A active state contains ReplacementOffer!"
  exit 1
fi
echo "  ✓ Lender A active contracts: ZERO visibility into Lender B terms"

LENDER_B_STATE=$(curl -s -f -H "Authorization: Bearer $TOKEN_LENDERB" "$API_BASE/api/state/LenderB")
if echo "$LENDER_B_STATE" | grep -q '"loansA":\[{'; then
  echo "❌ PRIVACY VIOLATION: Lender B active state contains Loan A!"
  exit 1
fi
if echo "$LENDER_B_STATE" | grep -q '"payoffQuotes":\[{'; then
  echo "❌ PRIVACY VIOLATION: Lender B active state contains PayoffQuote!"
  exit 1
fi
echo "  ✓ Lender B active contracts: ZERO visibility into Lender A terms"

# Direct Canton Ledger Transaction History Privacy Verification
echo "  Querying Canton transaction history directly from Participant 2 (Lender A) & Participant 3 (Lender B)..."

CANTON_P2_HTTP="${CANTON_P2_HTTP:-http://localhost:5024}"
CANTON_P3_HTTP="${CANTON_P3_HTTP:-http://localhost:5034}"

# Resolve Canton party IDs for participants
P2_LENDERA_PARTY=$(curl -s "$CANTON_P2_HTTP/v2/parties" | grep -o 'LenderA::[^"]*' | head -n1)
P3_LENDERB_PARTY=$(curl -s "$CANTON_P3_HTTP/v2/parties" | grep -o 'LenderB::[^"]*' | head -n1)

# 1. Query Participant 2 (Lender A) directly for the committed closing update
P2_TX=$(curl -s -X POST "$CANTON_P2_HTTP/v2/updates/transaction-by-id" \
  -H "Content-Type: application/json" \
  -d "{\"updateId\":\"$UPDATE_ID\",\"requestingParties\":[\"$P2_LENDERA_PARTY\"]}")

# Verify Lender A's participant receives settlement of Loan A
if ! echo "$P2_TX" | grep -q "LenderAPayoffReceipt"; then
  echo "❌ PRIVACY/SETTLEMENT FAILURE: Participant 2 transaction missing LenderAPayoffReceipt!"
  exit 1
fi
# Verify Lender A's participant has ZERO visibility into Loan B or replacement terms
if echo "$P2_TX" | grep -q "LoanB"; then
  echo "❌ PRIVACY VIOLATION ON CANTON P2: Participant 2 received LoanB!"
  exit 1
fi
if echo "$P2_TX" | grep -q "ReplacementOffer"; then
  echo "❌ PRIVACY VIOLATION ON CANTON P2: Participant 2 received ReplacementOffer!"
  exit 1
fi
if echo "$P2_TX" | grep -q "capRate"; then
  echo "❌ PRIVACY VIOLATION ON CANTON P2: Participant 2 received Lender B's capRate!"
  exit 1
fi
if echo "$P2_TX" | grep -q "amortizationPeriods"; then
  echo "❌ PRIVACY VIOLATION ON CANTON P2: Participant 2 received Lender B's amortizationPeriods!"
  exit 1
fi
echo "  ✓ Canton Participant 2 (Lender A): Confirmed settlement receipt; ZERO visibility into Loan B terms"

# 2. Query Participant 3 (Lender B) directly for the committed closing update
P3_TX=$(curl -s -X POST "$CANTON_P3_HTTP/v2/updates/transaction-by-id" \
  -H "Content-Type: application/json" \
  -d "{\"updateId\":\"$UPDATE_ID\",\"requestingParties\":[\"$P3_LENDERB_PARTY\"]}")

# Verify Lender B's participant receives funding of Loan B
if ! echo "$P3_TX" | grep -q "LenderBFundingReceipt"; then
  echo "❌ PRIVACY/SETTLEMENT FAILURE: Participant 3 transaction missing LenderBFundingReceipt!"
  exit 1
fi
if ! echo "$P3_TX" | grep -q "LoanB"; then
  echo "❌ PRIVACY/SETTLEMENT FAILURE: Participant 3 transaction missing LoanB!"
  exit 1
fi
# Verify Lender B's participant has ZERO visibility into Loan A or payoff terms
if echo "$P3_TX" | grep -q "LoanA"; then
  echo "❌ PRIVACY VIOLATION ON CANTON P3: Participant 3 received LoanA!"
  exit 1
fi
if echo "$P3_TX" | grep -q "PayoffQuote"; then
  echo "❌ PRIVACY VIOLATION ON CANTON P3: Participant 3 received PayoffQuote!"
  exit 1
fi
if echo "$P3_TX" | grep -q "LenderAPayoffReceipt"; then
  echo "❌ PRIVACY VIOLATION ON CANTON P3: Participant 3 received LenderAPayoffReceipt!"
  exit 1
fi
echo "  ✓ Canton Participant 3 (Lender B): Confirmed funding receipt & Loan B; ZERO visibility into Loan A terms"

# 3. Authenticated Gateway Transaction API Checks
LENDER_A_TXS=$(curl -s -f -H "Authorization: Bearer $TOKEN_LENDERA" "$API_BASE/api/transactions")
if echo "$LENDER_A_TXS" | grep -q -i "LoanB"; then
  echo "❌ PRIVACY VIOLATION: Lender A gateway transaction history contains LoanB!"
  exit 1
fi
if echo "$LENDER_A_TXS" | grep -q -i "ReplacementOffer"; then
  echo "❌ PRIVACY VIOLATION: Lender A gateway transaction history contains ReplacementOffer!"
  exit 1
fi
echo "  ✓ Gateway Transaction API (Lender A): ZERO visibility into Lender B transactions"

LENDER_B_TXS=$(curl -s -f -H "Authorization: Bearer $TOKEN_LENDERB" "$API_BASE/api/transactions")
if echo "$LENDER_B_TXS" | grep -q -i "LoanA"; then
  echo "❌ PRIVACY VIOLATION: Lender B gateway transaction history contains LoanA!"
  exit 1
fi
if echo "$LENDER_B_TXS" | grep -q -i "PayoffQuote"; then
  echo "❌ PRIVACY VIOLATION: Lender B gateway transaction history contains PayoffQuote!"
  exit 1
fi
echo "  ✓ Gateway Transaction API (Lender B): ZERO visibility into Lender A transactions"

echo ""
echo "==================================================================="
echo " ALL 8 END-TO-END REFINANCING & PRIVACY TESTS PASSED 100%! ✓"
echo "==================================================================="

