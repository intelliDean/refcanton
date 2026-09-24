#!/usr/bin/env bash
# scripts/test_live_api_closing.sh
# End-to-end CI test executing the complete refinancing workflow through the HTTP API
# Verifies genuine Canton ledger execution, authentication, updateId, and privacy isolation

set -e

API_BASE="${API_BASE:-http://localhost:4000}"

echo "==================================================================="
echo " RefCanton End-to-End API Integration & Settlement Test"
echo " Target API: $API_BASE"
echo "==================================================================="

# 1. Health check
echo "[1/6] Checking API Gateway and Canton Health..."
STATUS_RES=$(curl -s -f "$API_BASE/api/status")
echo "  Status response: $STATUS_RES"
if ! echo "$STATUS_RES" | grep -q "ONLINE"; then
  echo "❌ Error: API status is not ONLINE"
  exit 1
fi
echo "  ✓ API Gateway & Canton Network Online"

# Reset ledger state to clean baseline fixtures before executing flow
curl -s -f -H "Authorization: Bearer operator" -X POST "$API_BASE/api/reset" >/dev/null 2>&1 || true


# 2. Verify Authentication Enforcement
echo "[2/6] Verifying Authentication Enforcement..."
UNAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/state/Borrower")
if [ "$UNAUTH_CODE" -ne 401 ]; then
  echo "❌ Error: Expected HTTP 401 for unauthenticated request, got $UNAUTH_CODE"
  exit 1
fi
echo "  ✓ Unauthenticated access rejected with HTTP 401"

SNOOP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer borrower" "$API_BASE/api/state/LenderA")
if [ "$SNOOP_CODE" -ne 403 ]; then
  echo "❌ Error: Expected HTTP 403 when Borrower accesses LenderA state, got $SNOOP_CODE"
  exit 1
fi
echo "  ✓ Cross-party state access rejected with HTTP 403"

# 3. Lender A issues PayoffQuote
echo "[3/6] Lender A issuing binding PayoffQuote ($101,000)..."
QUOTE_RES=$(curl -s -f -H "Authorization: Bearer lendera" \
  -H "Content-Type: application/json" \
  -X POST "$API_BASE/api/quotes/create" \
  -d '{"borrower":"Borrower","payoffAmount":101000}')
echo "  Quote response: $QUOTE_RES"
if ! echo "$QUOTE_RES" | grep -q '"success":true'; then
  echo "❌ Error: Failed to issue PayoffQuote"
  exit 1
fi
echo "  ✓ PayoffQuote issued"

# 4. Lender B issues ReplacementOffer
echo "[4/6] Lender B issuing binding ReplacementOffer ($100,000 @ 7.5% cap-rate)..."
OFFER_RES=$(curl -s -f -H "Authorization: Bearer lenderb" \
  -H "Content-Type: application/json" \
  -X POST "$API_BASE/api/offers/create" \
  -d '{"borrower":"Borrower","newPrincipal":100000,"capRate":0.075,"amortizationPeriods":24}')
echo "  Offer response: $OFFER_RES"
if ! echo "$OFFER_RES" | grep -q '"success":true'; then
  echo "❌ Error: Failed to issue ReplacementOffer"
  exit 1
fi
echo "  ✓ ReplacementOffer issued"

# 5. Borrower creates ClosingRequest and executes Atomic Close
echo "[5/6] Borrower initiating ClosingRequest and executing Atomic Close..."
REQ_RES=$(curl -s -f -H "Authorization: Bearer borrower" \
  -H "Content-Type: application/json" \
  -X POST "$API_BASE/api/closing/request" \
  -d '{}')
echo "  Request response: $REQ_RES"

EXEC_RES=$(curl -s -f -H "Authorization: Bearer borrower" \
  -H "Content-Type: application/json" \
  -X POST "$API_BASE/api/closing/execute" \
  -d '{}')
echo "  Closing execution response: $EXEC_RES"

if ! echo "$EXEC_RES" | grep -q '"success":true'; then
  echo "❌ Error: Atomic close execution failed"
  exit 1
fi

if ! echo "$EXEC_RES" | grep -q '"updateId":'; then
  echo "❌ Error: Response missing Canton updateId"
  exit 1
fi
echo "  ✓ Atomic Closing committed! Genuine Canton Update ID returned."

# 6. Post-Closing Privacy Audit Verification
echo "[6/6] Verifying Post-Closing Sub-Transaction Privacy..."
LENDER_A_STATE=$(curl -s -f -H "Authorization: Bearer lendera" "$API_BASE/api/state/LenderA")
if echo "$LENDER_A_STATE" | grep -q '"loansB":\[{'; then
  echo "❌ PRIVACY VIOLATION: Lender A has visibility into Loan B!"
  exit 1
fi
if echo "$LENDER_A_STATE" | grep -q '"replacementOffers":\[{'; then
  echo "❌ PRIVACY VIOLATION: Lender A has visibility into ReplacementOffer!"
  exit 1
fi
echo "  ✓ Lender A state verified: ZERO visibility into Lender B terms"

LENDER_B_STATE=$(curl -s -f -H "Authorization: Bearer lenderb" "$API_BASE/api/state/LenderB")
if echo "$LENDER_B_STATE" | grep -q '"loansA":\[{'; then
  echo "❌ PRIVACY VIOLATION: Lender B has visibility into Loan A!"
  exit 1
fi
if echo "$LENDER_B_STATE" | grep -q '"payoffQuotes":\[{'; then
  echo "❌ PRIVACY VIOLATION: Lender B has visibility into PayoffQuote!"
  exit 1
fi
echo "  ✓ Lender B state verified: ZERO visibility into Lender A terms"

echo ""
echo "==================================================================="
echo " END-TO-END REFINANCING & PRIVACY TEST PASSED 100%! ✓"
echo "==================================================================="
