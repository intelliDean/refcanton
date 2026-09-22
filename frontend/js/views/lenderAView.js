// frontend/js/views/lenderAView.js
// Outgoing Lender A View (LegacyBank): Loan portfolio, payoff quote issuance and revocation

import { ApiClient } from '../api.js';
import { showToast } from '../components/toast.js';

export function renderLenderAView(state) {
  const loanA = state.loansA[0];
  const quote = state.payoffQuotes[0];
  const cash = state.cash.find(c => c.owner === 'LenderA');
  const cashAmount = cash ? cash.amount : 0;

  const cashDisplay = document.getElementById('lenderACashDisplay');
  if (cashDisplay) {
    cashDisplay.innerText = `$${cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD-TEST`;
  }

  const panel = document.getElementById('lenderALoanPanel');
  const btnIssue = document.getElementById('btnIssueQuote');
  const btnWithdraw = document.getElementById('btnWithdrawQuote');

  if (loanA) {
    if (panel) {
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
    }

    if (quote) {
      if (btnIssue) btnIssue.style.display = 'none';
      if (btnWithdraw) {
        btnWithdraw.style.display = 'inline-flex';
        btnWithdraw.dataset.quoteId = quote.contractId;
      }
    } else {
      if (btnIssue) btnIssue.style.display = 'inline-flex';
      if (btnWithdraw) btnWithdraw.style.display = 'none';
    }
  } else {
    if (panel) {
      panel.innerHTML = `
        <div style="color: var(--accent-emerald); font-weight: 600; margin-bottom: 0.5rem;">
          ✓ Loan A Successfully Closed & Discharged
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">
          Received full payoff of <strong>$101,000.00 USD-TEST</strong>. The collateral lock has been released/repledged, and the loan contract is archived.
        </p>
      `;
    }
    if (btnIssue) btnIssue.style.display = 'none';
    if (btnWithdraw) btnWithdraw.style.display = 'none';
  }
}

// Lender A Actions
export async function issuePayoffQuote(onSuccess) {
  const input = document.getElementById('inputPayoffAmount');
  const amount = Number(input ? input.value : 101000) || 101000;

  try {
    await ApiClient.createPayoffQuote({
      lenderA: 'LenderA',
      borrower: 'Borrower',
      payoffAmount: amount,
    });
    showToast(`Payoff quote for $${amount.toLocaleString()} issued by Lender A!`);
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

export async function withdrawPayoffQuote(onSuccess) {
  const btnWithdraw = document.getElementById('btnWithdrawQuote');
  const quoteId = btnWithdraw ? btnWithdraw.dataset.quoteId : null;

  try {
    await ApiClient.withdrawPayoffQuote(quoteId, 'LenderA');
    showToast('Payoff quote withdrawn by Lender A');
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
