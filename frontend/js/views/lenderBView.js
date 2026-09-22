// frontend/js/views/lenderBView.js
// Incoming Lender B View (NeoCapital): Escrow allocation, offer commitment & Loan B facility

import { ApiClient } from '../api.js';
import { showToast } from '../components/toast.js';

export function renderLenderBView(state) {
  const loanB = state.loansB[0];
  const offer = state.replacementOffers[0];
  const cash = state.cash.find(c => c.owner === 'LenderB');
  const cashAmount = cash ? cash.amount : 0;

  const cashDisplay = document.getElementById('lenderBCashDisplay');
  if (cashDisplay) {
    cashDisplay.innerText = `$${cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD-TEST`;
  }

  const panel = document.getElementById('lenderBLoanPanel');
  const btnIssue = document.getElementById('btnIssueOffer');
  const btnWithdraw = document.getElementById('btnWithdrawOffer');

  if (loanB) {
    if (panel) {
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
    }
    if (btnIssue) btnIssue.style.display = 'none';
    if (btnWithdraw) btnWithdraw.style.display = 'none';
  } else if (offer) {
    if (panel) {
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
    }
    if (btnIssue) btnIssue.style.display = 'none';
    if (btnWithdraw) {
      btnWithdraw.style.display = 'inline-flex';
      btnWithdraw.dataset.offerId = offer.contractId;
    }
  } else {
    if (panel) {
      panel.innerHTML = `
        <p style="font-size: 0.85rem; color: var(--text-secondary);">
          Configure replacement terms below and commit $100,000 USD-TEST to structure the refinancing facility.
        </p>
      `;
    }
    if (btnIssue) btnIssue.style.display = 'inline-flex';
    if (btnWithdraw) btnWithdraw.style.display = 'none';
  }
}

// Lender B Actions
export async function issueReplacementOffer(onSuccess) {
  const principalEl = document.getElementById('inputNewPrincipal');
  const capRateEl = document.getElementById('inputCapRate');
  const periodsEl = document.getElementById('inputAmortization');

  const principal = Number(principalEl ? principalEl.value : 100000) || 100000;
  const capRate = (Number(capRateEl ? capRateEl.value : 7.5) || 7.5) / 100;
  const periods = Number(periodsEl ? periodsEl.value : 24) || 24;

  try {
    await ApiClient.createReplacementOffer({
      lenderB: 'LenderB',
      borrower: 'Borrower',
      newPrincipal: principal,
      capRate,
      amortizationPeriods: periods,
    });
    showToast(`Replacement offer for $${principal.toLocaleString()} committed by Lender B!`);
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

export async function withdrawReplacementOffer(onSuccess) {
  const btn = document.getElementById('btnWithdrawOffer');
  const offerId = btn ? btn.dataset.offerId : null;

  try {
    await ApiClient.withdrawReplacementOffer(offerId, 'LenderB');
    showToast('Replacement offer withdrawn; cash deallocated back to Lender B');
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
