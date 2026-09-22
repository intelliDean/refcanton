// frontend/js/views/borrowerView.js
// Borrower View: Balance cards, multi-stage approval stepper & atomic closing action

import { ApiClient } from '../api.js';
import { showToast } from '../components/toast.js';

export function renderBorrowerView(state) {
  const loanA = state.loansA[0];
  const loanB = state.loansB[0];
  const quote = state.payoffQuotes[0];
  const offer = state.replacementOffers[0];
  const receipt = state.receipts[0];

  // Cash holding
  const bCash = state.cash.find(c => c.owner === 'Borrower');
  const cashAmount = bCash ? bCash.amount : 0;
  const cashEl = document.getElementById('bCashAmount');
  if (cashEl) {
    cashEl.innerText = `$${cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  // Collateral
  const collat = state.collateral[0];
  if (collat) {
    const collatUnitsEl = document.getElementById('bCollatUnits');
    if (collatUnitsEl) collatUnitsEl.innerText = `${collat.amount.toFixed(2)} Units`;

    const lockerName = collat.locker === 'LenderA' ? 'Locked to A' : 'Locked to B';
    const tagClass = collat.locker === 'LenderA' ? 'tag-amber' : 'tag-emerald';
    const collatBadge = document.getElementById('bCollatStatusBadge');
    if (collatBadge) {
      collatBadge.className = `tag ${tagClass}`;
      collatBadge.innerText = lockerName;
    }

    const collatDetails = document.getElementById('bCollatDetails');
    if (collatDetails) {
      collatDetails.innerText = `${collat.instrument} · Context: ${collat.context}`;
    }
  }

  // Active Loan A
  const loanAAmountEl = document.getElementById('bLoanAAmount');
  const loanADetailsEl = document.getElementById('bLoanADetails');
  const loanABadge = document.getElementById('loanAStatusBadge');

  if (loanA) {
    if (loanAAmountEl) loanAAmountEl.innerText = `$${loanA.principal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (loanADetailsEl) loanADetailsEl.innerText = `${(loanA.annualRate * 100).toFixed(1)}% Bullet Rate · Matures ${loanA.maturityDate}`;
    if (loanABadge) {
      loanABadge.className = 'tag tag-amber';
      loanABadge.innerText = 'Active Secured';
    }
  } else {
    if (loanAAmountEl) loanAAmountEl.innerText = '$0.00';
    if (loanADetailsEl) loanADetailsEl.innerText = 'Paid off and closed via atomic refinancing';
    if (loanABadge) {
      loanABadge.className = 'tag tag-emerald';
      loanABadge.innerText = 'Archived / Closed';
    }
  }

  // Active Loan B (post-close)
  const newDebtEl = document.getElementById('bNewDebtAmount');
  const savingsSubEl = document.getElementById('bSavingsSub');
  const savingsTag = document.getElementById('refinanceSavingsTag');

  if (loanB) {
    if (newDebtEl) newDebtEl.innerText = `$${loanB.principal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (savingsSubEl) savingsSubEl.innerText = `Active Loan B · ${(loanB.capRate * 100).toFixed(1)}% Cap Rate · ${loanB.amortizationPeriods} mos`;
    if (savingsTag) {
      savingsTag.className = 'tag tag-emerald';
      savingsTag.innerText = 'Refinanced & Active';
    }
  } else {
    if (newDebtEl) newDebtEl.innerText = offer ? `$${offer.newPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$100,000.00';
    if (savingsSubEl) savingsSubEl.innerText = offer ? `${(offer.capRate * 100).toFixed(1)}% Cap Rate · ${offer.amortizationPeriods} mos amortizing` : 'Awaiting Lender B offer';
    if (savingsTag) {
      savingsTag.className = 'tag tag-purple';
      savingsTag.innerText = offer ? 'Offer Available' : 'Pending Offer';
    }
  }

  // Step 1: Payoff Quote Box
  const cardStep1 = document.getElementById('cardStep1');
  const step1Badge = document.getElementById('step1Badge');
  const quoteDetailsBox = document.getElementById('quoteDetailsBox');

  if (quote) {
    if (cardStep1) cardStep1.classList.add('completed');
    if (step1Badge) {
      step1Badge.className = 'step-badge ready';
      step1Badge.innerText = 'Received & Binding';
    }
    if (quoteDetailsBox) {
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
    }
  } else {
    if (cardStep1) cardStep1.classList.remove('completed');
    if (step1Badge) {
      step1Badge.className = 'step-badge';
      step1Badge.innerText = loanA ? 'Pending Lender A' : 'Satisfied';
    }
    if (quoteDetailsBox) {
      quoteDetailsBox.innerHTML = `<div class="empty-state-text">${loanA ? 'Waiting for Lender A to issue PayoffQuote...' : 'Loan A has already been fully settled and closed.'}</div>`;
    }
  }

  // Step 2: Replacement Offer Box
  const cardStep2 = document.getElementById('cardStep2');
  const step2Badge = document.getElementById('step2Badge');
  const offerDetailsBox = document.getElementById('offerDetailsBox');

  if (offer) {
    if (cardStep2) cardStep2.classList.add('completed');
    if (step2Badge) {
      step2Badge.className = 'step-badge ready';
      step2Badge.innerText = 'Committed & Funded';
    }
    if (offerDetailsBox) {
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
    }
  } else {
    if (cardStep2) cardStep2.classList.remove('completed');
    if (step2Badge) {
      step2Badge.className = 'step-badge';
      step2Badge.innerText = loanB ? 'Committed & Closed' : 'Pending Lender B';
    }
    if (offerDetailsBox) {
      offerDetailsBox.innerHTML = `<div class="empty-state-text">${loanB ? 'Loan B active on ledger.' : 'Waiting for Lender B to issue ReplacementOffer...'}</div>`;
    }
  }

  // Step 3: Execution Button
  const btnClose = document.getElementById('btnRequestClose');
  const pipelineStatusTag = document.getElementById('pipelineStatusTag');
  const step3Badge = document.getElementById('step3Badge');

  if (loanB) {
    if (btnClose) {
      btnClose.disabled = true;
      btnClose.innerText = '✓ Refinancing Completed';
    }
    if (step3Badge) {
      step3Badge.className = 'step-badge ready';
      step3Badge.innerText = 'Committed';
    }
    if (pipelineStatusTag) {
      pipelineStatusTag.className = 'tag tag-emerald';
      pipelineStatusTag.innerText = 'Settlement Finalized';
    }
  } else if (quote && offer && cashAmount >= 1000) {
    if (btnClose) {
      btnClose.disabled = false;
      btnClose.innerText = '⚡ Execute Atomic Close';
    }
    if (step3Badge) {
      step3Badge.className = 'step-badge ready';
      step3Badge.innerText = 'Ready to Settle';
    }
    if (pipelineStatusTag) {
      pipelineStatusTag.className = 'tag tag-emerald';
      pipelineStatusTag.innerText = 'All Approvals Verified';
    }
  } else {
    if (btnClose) {
      btnClose.disabled = true;
      btnClose.innerText = '⚡ Execute Atomic Close';
    }
    if (step3Badge) {
      step3Badge.className = 'step-badge';
      step3Badge.innerText = 'Waiting for Prerequisites';
    }
    if (pipelineStatusTag) {
      pipelineStatusTag.className = 'tag tag-amber';
      pipelineStatusTag.innerText = 'In Progress';
    }
  }

  // Step 4: Closing Receipt
  renderReceipt(receipt);
}

function renderReceipt(receipt) {
  const receiptSection = document.getElementById('receiptCard');
  const receiptDetails = document.getElementById('receiptDetails');
  if (!receiptSection || !receiptDetails) return;

  if (receipt) {
    receiptSection.style.display = 'block';
    const r = receipt.receipt;
    receiptDetails.innerHTML = `
      <div class="approval-stat-row">
        <span>Receipt Contract ID:</span>
        <strong class="text-mono">${receipt.contractId}</strong>
      </div>
      <div class="approval-stat-row">
        <span>Settlement Timestamp:</span>
        <span>${new Date(r.closedAt).toLocaleString()}</span>
      </div>
      <div class="approval-stat-row">
        <span>Payoff to Outgoing Lender A:</span>
        <strong class="text-amber">$${r.payoffAmount.toLocaleString()} USD-TEST</strong>
      </div>
      <div class="approval-stat-row">
        <span>Replacement Principal (Lender B):</span>
        <strong class="text-emerald">$${r.newPrincipal.toLocaleString()} USD-TEST</strong>
      </div>
      <div class="approval-stat-row">
        <span>Borrower Equity Applied:</span>
        <strong class="text-purple">$${r.borrowerContribution.toLocaleString()} USD-TEST</strong>
      </div>
      <div class="approval-stat-row">
        <span>Collateral Units Repledged:</span>
        <span>${r.collateralUnits} COLLAT-TEST units</span>
      </div>
      <div class="approval-stat-row">
        <span>Canton Ledger Atomicity:</span>
        <span class="text-emerald">Validated by Canton Domain</span>
      </div>
    `;
  } else {
    receiptSection.style.display = 'none';
  }
}

// Borrower: Request & Execute Close Action
export async function requestAndExecuteClose(onSuccess) {
  const btn = document.getElementById('btnRequestClose');
  if (btn) {
    btn.disabled = true;
    btn.innerText = '⏳ Committing Atomic Transaction to Canton...';
  }

  try {
    // 1. Create ClosingRequest
    const reqData = await ApiClient.createClosingRequest('Borrower');
    const requestId = reqData.request.contractId;

    // 2. Execute Atomic Close
    await ApiClient.executeAtomicClose(requestId, 'Borrower');

    showToast('Refinancing executed! One committed update: Paid A $101k, closed Loan A, repledged collateral, created Loan B.');
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerText = '⚡ Execute Atomic Close';
    }
  }
}
