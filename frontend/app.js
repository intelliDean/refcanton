// frontend/app.js
// Client logic and Canton state synchronization

const API_BASE = 'http://localhost:4000/api';

let currentRole = 'Borrower';
let currentLedgerState = null;
let pollInterval = null;

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchState();
  pollInterval = setInterval(fetchState, 2500);
});

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠️'}</span> <div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE SWITCHING
// ─────────────────────────────────────────────────────────────────────────────
function setRole(role) {
  currentRole = role;

  // Update tabs
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`roleBtn${role}`).classList.add('active');

  // Update visible section
  document.querySelectorAll('.role-view').forEach(v => v.classList.remove('active-view'));
  document.getElementById(`view${role}`).classList.add('active-view');

  // Update banner text
  const badge = document.getElementById('bannerBadge');
  const desc = document.getElementById('bannerDesc');

  if (role === 'Borrower') {
    badge.innerText = 'Role: Borrower (Alice)';
    desc.innerHTML = 'You are refinancing your <strong>$101,000</strong> bullet loan with incoming capital from Lender B (<strong>$100,000</strong>) and your <strong>$1,000</strong> equity contribution.';
  } else if (role === 'LenderA') {
    badge.innerText = 'Role: Outgoing Lender A (LegacyBank)';
    desc.innerHTML = 'You hold the existing <strong>$101,000</strong> loan secured by <strong>150 collateral units</strong>. Issue your binding payoff quote to permit atomic release upon full satisfaction.';
  } else if (role === 'LenderB') {
    badge.innerText = 'Role: Incoming Lender B (NeoCapital)';
    desc.innerHTML = 'You are funding the <strong>$100,000</strong> replacement facility at a competitive <strong>7.5% cap-rate</strong>, secured by <strong>150 collateral units</strong> transferred atomically upon close.';
  }

  fetchState();
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE FETCHING & RENDERING
// ─────────────────────────────────────────────────────────────────────────────
async function fetchState() {
  try {
    const res = await fetch(`${API_BASE}/state/${currentRole}`);
    if (!res.ok) throw new Error('API request failed');
    const state = await res.json();
    currentLedgerState = state;
    renderCurrentState(state);
  } catch (err) {
    console.warn('Backend polling error:', err.message);
  }
}

function renderCurrentState(state) {
  if (currentRole === 'Borrower') {
    renderBorrowerView(state);
  } else if (currentRole === 'LenderA') {
    renderLenderAView(state);
  } else if (currentRole === 'LenderB') {
    renderLenderBView(state);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BORROWER VIEW RENDERING
// ─────────────────────────────────────────────────────────────────────────────
function renderBorrowerView(state) {
  const loanA = state.loansA[0];
  const loanB = state.loansB[0];
  const quote = state.payoffQuotes[0];
  const offer = state.replacementOffers[0];
  const receipt = state.receipts[0];

  // Cash holding
  const bCash = state.cash.find(c => c.owner === 'Borrower');
  const cashAmount = bCash ? bCash.amount : 0;
  document.getElementById('bCashAmount').innerText = `$${cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Collateral
  const collat = state.collateral[0];
  if (collat) {
    document.getElementById('bCollatUnits').innerText = `${collat.amount.toFixed(2)} Units`;
    const lockerName = collat.locker === 'LenderA' ? 'Locked to A' : 'Locked to B';
    const tagClass = collat.locker === 'LenderA' ? 'tag-amber' : 'tag-emerald';
    document.getElementById('bCollatStatusBadge').className = `tag ${tagClass}`;
    document.getElementById('bCollatStatusBadge').innerText = lockerName;
    document.getElementById('bCollatDetails').innerText = `${collat.instrument} · Context: ${collat.context}`;
  }

  // Active Loan A
  if (loanA) {
    document.getElementById('bLoanAAmount').innerText = `$${loanA.principal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('bLoanADetails').innerText = `${(loanA.annualRate * 100).toFixed(1)}% Bullet Rate · Matures ${loanA.maturityDate}`;
    document.getElementById('loanAStatusBadge').className = 'tag tag-amber';
    document.getElementById('loanAStatusBadge').innerText = 'Active Secured';
  } else {
    document.getElementById('bLoanAAmount').innerText = '$0.00';
    document.getElementById('bLoanADetails').innerText = 'Paid off and closed via atomic refinancing';
    document.getElementById('loanAStatusBadge').className = 'tag tag-emerald';
    document.getElementById('loanAStatusBadge').innerText = 'Archived / Closed';
  }

  // Active Loan B (post-close)
  if (loanB) {
    document.getElementById('bNewDebtAmount').innerText = `$${loanB.principal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('bSavingsSub').innerText = `Active Loan B · ${(loanB.capRate * 100).toFixed(1)}% Cap Rate · ${loanB.amortizationPeriods} mos`;
    document.getElementById('refinanceSavingsTag').className = 'tag tag-emerald';
    document.getElementById('refinanceSavingsTag').innerText = 'Refinanced & Active';
  } else {
    document.getElementById('bNewDebtAmount').innerText = offer ? `$${offer.newPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$100,000.00';
    document.getElementById('bSavingsSub').innerText = offer ? `${(offer.capRate * 100).toFixed(1)}% Cap Rate · ${offer.amortizationPeriods} mos amortizing` : 'Awaiting Lender B offer';
    document.getElementById('refinanceSavingsTag').className = 'tag tag-purple';
    document.getElementById('refinanceSavingsTag').innerText = offer ? 'Offer Available' : 'Pending Offer';
  }

  // Step 1: Payoff Quote Box
  const cardStep1 = document.getElementById('cardStep1');
  const step1Badge = document.getElementById('step1Badge');
  const quoteDetailsBox = document.getElementById('quoteDetailsBox');

  if (quote) {
    cardStep1.classList.add('completed');
    step1Badge.className = 'step-badge ready';
    step1Badge.innerText = 'Received & Binding';
    quoteDetailsBox.innerHTML = `
      <div class="approval-stat-row">
        <span>Payoff Amount:</span>
        <strong class="text-amber">$${quote.payoffAmount.toLocaleString()} USD-TEST</strong>
      </div>
      <div class="approval-stat-row">
        <span>Creditor:</span>
        <strong>${quote.lenderA}</strong>
      </div>
      <div class="approval-stat-row">
        <span>Contract ID:</span>
        <span class="text-mono">${quote.contractId}</span>
      </div>
    `;
  } else {
    cardStep1.classList.remove('completed');
    step1Badge.className = 'step-badge';
    step1Badge.innerText = loanA ? 'Pending Lender A' : 'Satisfied';
    quoteDetailsBox.innerHTML = `<div class="empty-state-text">${loanA ? 'Waiting for Lender A to issue PayoffQuote...' : 'Loan A has already been fully settled and closed.'}</div>`;
  }

  // Step 2: Replacement Offer Box
  const cardStep2 = document.getElementById('cardStep2');
  const step2Badge = document.getElementById('step2Badge');
  const offerDetailsBox = document.getElementById('offerDetailsBox');

  if (offer) {
    cardStep2.classList.add('completed');
    step2Badge.className = 'step-badge ready';
    step2Badge.innerText = 'Committed & Funded';
    offerDetailsBox.innerHTML = `
      <div class="approval-stat-row">
        <span>Funding Committed:</span>
        <strong class="text-emerald">$${offer.newPrincipal.toLocaleString()} USD-TEST</strong>
      </div>
      <div class="approval-stat-row">
        <span>Private Cap-Rate:</span>
        <strong class="text-purple">${(offer.capRate * 100).toFixed(1)}% (${offer.amortizationPeriods} periods)</strong>
      </div>
      <div class="approval-stat-row">
        <span>Contract ID:</span>
        <span class="text-mono">${offer.contractId}</span>
      </div>
    `;
  } else {
    cardStep2.classList.remove('completed');
    step2Badge.className = 'step-badge';
    step2Badge.innerText = loanB ? 'Committed & Closed' : 'Pending Lender B';
    offerDetailsBox.innerHTML = `<div class="empty-state-text">${loanB ? 'Loan B active on ledger.' : 'Waiting for Lender B to issue ReplacementOffer...'}</div>`;
  }

  // Step 3: Execution Button
  const btnClose = document.getElementById('btnRequestClose');
  const pipelineStatusTag = document.getElementById('pipelineStatusTag');
  const step3Badge = document.getElementById('step3Badge');

  if (loanB) {
    btnClose.disabled = true;
    btnClose.innerText = '✓ Refinancing Completed';
    step3Badge.className = 'step-badge ready';
    step3Badge.innerText = 'Committed';
    pipelineStatusTag.className = 'tag tag-emerald';
    pipelineStatusTag.innerText = 'Settlement Finalized';
  } else if (quote && offer && cashAmount >= 1000) {
    btnClose.disabled = false;
    btnClose.innerText = '⚡ Execute Atomic Close';
    step3Badge.className = 'step-badge ready';
    step3Badge.innerText = 'Ready to Settle';
    pipelineStatusTag.className = 'tag tag-emerald';
    pipelineStatusTag.innerText = 'All Approvals Verified';
  } else {
    btnClose.disabled = true;
    btnClose.innerText = '⚡ Execute Atomic Close (Waiting Approvals)';
    step3Badge.className = 'step-badge';
    step3Badge.innerText = 'Locked';
    pipelineStatusTag.className = 'tag tag-cyan';
    pipelineStatusTag.innerText = 'Awaiting Approvals';
  }

  // Receipt Section
  const receiptSection = document.getElementById('borrowerReceiptSection');
  if (receipt) {
    receiptSection.style.display = 'block';
    const r = receipt.receipt;
    document.getElementById('receiptDetailsGrid').innerHTML = `
      <div class="receipt-item">
        <strong>Receipt Contract ID</strong>
        <span>${receipt.contractId}</span>
      </div>
      <div class="receipt-item">
        <strong>New Loan B Contract</strong>
        <span>${r.loanBCid}</span>
      </div>
      <div class="receipt-item">
        <strong>Total Payoff to Lender A</strong>
        <span class="text-amber">$${r.payoffAmount.toLocaleString()} USD-TEST</span>
      </div>
      <div class="receipt-item">
        <strong>New Debt to Lender B</strong>
        <span class="text-emerald">$${r.newPrincipal.toLocaleString()} USD-TEST</span>
      </div>
      <div class="receipt-item">
        <strong>Borrower Contribution</strong>
        <span>$${r.borrowerContribution.toLocaleString()} USD-TEST</span>
      </div>
      <div class="receipt-item">
        <strong>Collateral Repledged</strong>
        <span>${r.collateralUnits} Units COLLAT-TEST</span>
      </div>
      <div class="receipt-item">
        <strong>Committed At</strong>
        <span>${new Date(r.closedAt).toLocaleTimeString()}</span>
      </div>
      <div class="receipt-item">
        <strong>Ledger Consensus</strong>
        <span class="text-emerald">Validated by Canton Domain</span>
      </div>
    `;
  } else {
    receiptSection.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LENDER A VIEW RENDERING
// ─────────────────────────────────────────────────────────────────────────────
function renderLenderAView(state) {
  const loanA = state.loansA[0];
  const quote = state.payoffQuotes[0];
  const cash = state.cash.find(c => c.owner === 'LenderA');
  const cashAmount = cash ? cash.amount : 0;

  document.getElementById('lenderACashDisplay').innerText = `$${cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD-TEST`;

  const panel = document.getElementById('lenderALoanPanel');
  const btnIssue = document.getElementById('btnIssueQuote');
  const btnWithdraw = document.getElementById('btnWithdrawQuote');

  if (loanA) {
    panel.innerHTML = `
      <div class="approval-stat-row">
        <span>Loan Contract:</span>
        <strong class="text-mono">${loanA.contractId}</strong>
      </div>
      <div class="approval-stat-row">
        <span>Agreed Payoff Principal:</span>
        <strong class="text-amber">$${loanA.principal.toLocaleString()} USD-TEST</strong>
      </div>
      <div class="approval-stat-row">
        <span>Historical Interest Rate:</span>
        <strong>${(loanA.annualRate * 100).toFixed(1)}% Bullet</strong>
      </div>
      <div class="approval-stat-row">
        <span>Origination / Maturity:</span>
        <span>${loanA.originationDate} → ${loanA.maturityDate}</span>
      </div>
      <div class="approval-stat-row">
        <span>Securing Collateral:</span>
        <span>150 Units Locked to Lender A</span>
      </div>
    `;

    if (quote) {
      btnIssue.style.display = 'none';
      btnWithdraw.style.display = 'inline-flex';
      btnWithdraw.dataset.quoteId = quote.contractId;
    } else {
      btnIssue.style.display = 'inline-flex';
      btnWithdraw.style.display = 'none';
    }
  } else {
    panel.innerHTML = `
      <div style="color: var(--accent-emerald); font-weight: 600; margin-bottom: 0.5rem;">
        ✓ Loan A Successfully Closed & Discharged
      </div>
      <p style="font-size: 0.85rem; color: var(--text-secondary);">
        Received full payoff of <strong>$101,000.00 USD-TEST</strong>. The collateral lock has been released/repledged, and the loan contract is archived.
      </p>
    `;
    btnIssue.style.display = 'none';
    btnWithdraw.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LENDER B VIEW RENDERING
// ─────────────────────────────────────────────────────────────────────────────
function renderLenderBView(state) {
  const loanB = state.loansB[0];
  const offer = state.replacementOffers[0];
  const cash = state.cash.find(c => c.owner === 'LenderB');
  const cashAmount = cash ? cash.amount : 0;

  document.getElementById('lenderBCashDisplay').innerText = `$${cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD-TEST`;

  const panel = document.getElementById('lenderBLoanPanel');
  const btnIssue = document.getElementById('btnIssueOffer');
  const btnWithdraw = document.getElementById('btnWithdrawOffer');

  if (loanB) {
    panel.innerHTML = `
      <div style="color: var(--accent-emerald); font-weight: 600; margin-bottom: 0.5rem;">
        ✓ Loan B Active Asset on Ledger
      </div>
      <div class="approval-stat-row">
        <span>Loan B Contract:</span>
        <strong class="text-mono">${loanB.contractId}</strong>
      </div>
      <div class="approval-stat-row">
        <span>Principal:</span>
        <strong class="text-emerald">$${loanB.principal.toLocaleString()} USD-TEST</strong>
      </div>
      <div class="approval-stat-row">
        <span>Cap-Rate & Amortization:</span>
        <strong class="text-purple">${(loanB.capRate * 100).toFixed(1)}% · ${loanB.amortizationPeriods} periods</strong>
      </div>
      <div class="approval-stat-row">
        <span>Securing Collateral:</span>
        <span>150 Units Locked to Lender B</span>
      </div>
    `;
    btnIssue.style.display = 'none';
    btnWithdraw.style.display = 'none';
  } else if (offer) {
    panel.innerHTML = `
      <div style="color: var(--accent-purple); font-weight: 600; margin-bottom: 0.5rem;">
        ⚡ Binding Offer Committed to Borrower
      </div>
      <div class="approval-stat-row">
        <span>Offer Contract ID:</span>
        <strong class="text-mono">${offer.contractId}</strong>
      </div>
      <div class="approval-stat-row">
        <span>Funding Allocated:</span>
        <strong class="text-emerald">$${offer.newPrincipal.toLocaleString()} USD-TEST</strong>
      </div>
      <div class="approval-stat-row">
        <span>Terms:</span>
        <span>${(offer.capRate * 100).toFixed(1)}% cap-rate · ${offer.amortizationPeriods} mos</span>
      </div>
    `;
    btnIssue.style.display = 'none';
    btnWithdraw.style.display = 'inline-flex';
    btnWithdraw.dataset.offerId = offer.contractId;
  } else {
    panel.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--text-secondary);">
        Configure replacement terms below and commit $100,000 USD-TEST to structure the refinancing facility.
      </p>
    `;
    btnIssue.style.display = 'inline-flex';
    btnWithdraw.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

// Lender A: Issue Payoff Quote
async function issuePayoffQuote() {
  const amount = Number(document.getElementById('inputPayoffAmount').value) || 101000;
  try {
    const res = await fetch(`${API_BASE}/quotes/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lenderA: 'LenderA', borrower: 'Borrower', payoffAmount: amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`Payoff quote for $${amount.toLocaleString()} issued by Lender A!`);
    fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Lender A: Withdraw Quote
async function withdrawPayoffQuote() {
  const quoteId = document.getElementById('btnWithdrawQuote').dataset.quoteId;
  try {
    const res = await fetch(`${API_BASE}/quotes/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId, lenderA: 'LenderA' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Payoff quote withdrawn by Lender A');
    fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Lender B: Issue Replacement Offer
async function issueReplacementOffer() {
  const principal = Number(document.getElementById('inputNewPrincipal').value) || 100000;
  const capRate = Number(document.getElementById('inputCapRate').value) / 100 || 0.075;
  const periods = Number(document.getElementById('inputAmortization').value) || 24;

  try {
    const res = await fetch(`${API_BASE}/offers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lenderB: 'LenderB',
        borrower: 'Borrower',
        newPrincipal: principal,
        capRate,
        amortizationPeriods: periods,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`Replacement offer for $${principal.toLocaleString()} committed by Lender B!`);
    fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Lender B: Withdraw Replacement Offer
async function withdrawReplacementOffer() {
  const offerId = document.getElementById('btnWithdrawOffer').dataset.offerId;
  try {
    const res = await fetch(`${API_BASE}/offers/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, lenderB: 'LenderB' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Replacement offer withdrawn; cash deallocated back to Lender B');
    fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Borrower: Request & Execute Close
async function requestAndExecuteClose() {
  const btn = document.getElementById('btnRequestClose');
  btn.disabled = true;
  btn.innerText = '⏳ Committing Atomic Transaction to Canton...';

  try {
    // 1. Create ClosingRequest
    const reqRes = await fetch(`${API_BASE}/closing/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrower: 'Borrower' }),
    });
    const reqData = await reqRes.json();
    if (!reqRes.ok) throw new Error(reqData.error);

    const requestId = reqData.request.contractId;

    // 2. Execute Atomic Close
    const execRes = await fetch(`${API_BASE}/closing/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, borrower: 'Borrower' }),
    });
    const execData = await execRes.json();
    if (!execRes.ok) throw new Error(execData.error);

    showToast('Refinancing executed! One committed update: Paid A $101k, closed Loan A, repledged collateral, created Loan B.');
    fetchState();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerText = '⚡ Execute Atomic Close';
  }
}

// Reset Demo Ledger
async function resetLedger() {
  try {
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    const data = await res.json();
    showToast('Ledger reset to initial baseline test state');
    fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVACY INSPECTOR MODAL
// ─────────────────────────────────────────────────────────────────────────────
async function togglePrivacyInspector() {
  const modal = document.getElementById('privacyModal');
  const isHidden = modal.style.display === 'none';

  if (isHidden) {
    modal.style.display = 'flex';
    // Fetch state for all 3 parties to show real comparison
    const [stateA, stateB, stateBorrower] = await Promise.all([
      fetch(`${API_BASE}/state/LenderA`).then(r => r.json()),
      fetch(`${API_BASE}/state/LenderB`).then(r => r.json()),
      fetch(`${API_BASE}/state/Borrower`).then(r => r.json()),
    ]);

    renderPrivacyColumn('inspectorLenderA', stateA);
    renderPrivacyColumn('inspectorBorrower', stateBorrower);
    renderPrivacyColumn('inspectorLenderB', stateB);
  } else {
    modal.style.display = 'none';
  }
}

function renderPrivacyColumn(elementId, state) {
  const container = document.getElementById(elementId);
  const { privacyAudits, loansA, loansB, payoffQuotes, replacementOffers } = state;

  const hasLoanA = loansA.length > 0;
  const hasLoanB = loansB.length > 0;
  const hasQuote = payoffQuotes.length > 0;
  const hasOffer = replacementOffers.length > 0;

  container.innerHTML = `
    <div class="matrix-line">
      <span>Loan A (Historical):</span>
      <strong class="${hasLoanA ? 'text-emerald' : 'text-red'}">${hasLoanA ? 'Visible' : 'HIDDEN'}</strong>
    </div>
    <div class="matrix-line">
      <span>Lender A Rate (8.5%):</span>
      <strong class="${privacyAudits.canSeeLenderARate ? 'text-emerald' : 'text-red'}">${privacyAudits.canSeeLenderARate ? 'Visible' : 'BLOCKED'}</strong>
    </div>
    <div class="matrix-line">
      <span>Payoff Quote ($101k):</span>
      <strong class="${hasQuote ? 'text-emerald' : 'text-muted'}">${hasQuote ? 'Visible' : 'No Access'}</strong>
    </div>
    <div class="matrix-line">
      <span>Loan B (New):</span>
      <strong class="${hasLoanB ? 'text-emerald' : 'text-red'}">${hasLoanB ? 'Visible' : 'HIDDEN'}</strong>
    </div>
    <div class="matrix-line">
      <span>Lender B Cap-Rate (7.5%):</span>
      <strong class="${privacyAudits.canSeeLenderBCapRate ? 'text-emerald' : 'text-red'}">${privacyAudits.canSeeLenderBCapRate ? 'Visible' : 'BLOCKED'}</strong>
    </div>
    <div class="matrix-line">
      <span>Replacement Offer:</span>
      <strong class="${hasOffer ? 'text-emerald' : 'text-muted'}">${hasOffer ? 'Visible' : 'No Access'}</strong>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG MODAL
// ─────────────────────────────────────────────────────────────────────────────
async function toggleTxModal() {
  const modal = document.getElementById('txModal');
  const isHidden = modal.style.display === 'none';

  if (isHidden) {
    modal.style.display = 'flex';
    const res = await fetch(`${API_BASE}/transactions`);
    const txs = await res.json();
    const container = document.getElementById('txListContainer');

    if (txs.length === 0) {
      container.innerHTML = '<div class="empty-state-text">No transactions committed yet.</div>';
    } else {
      container.innerHTML = txs.map(tx => `
        <div class="tx-item">
          <div class="tx-top">
            <span>TX ID: ${tx.txId}</span>
            <span>${new Date(tx.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="tx-title">
            <span class="tag tag-indigo">${tx.actingParty}</span> ${tx.action}
          </div>
          <div class="tx-desc">${tx.description}</div>
        </div>
      `).join('');
    }
  } else {
    modal.style.display = 'none';
  }
}
