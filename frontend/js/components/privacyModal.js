// frontend/js/components/privacyModal.js
// Canton Sub-Transaction Privacy Inspector Modal

import { ApiClient } from '../api.js';

export async function togglePrivacyInspector() {
  const modal = document.getElementById('privacyModal');
  if (!modal) return;
  const isHidden = modal.style.display === 'none';

  if (isHidden) {
    modal.style.display = 'flex';
    try {
      const [stateA, stateB, stateBorrower] = await Promise.all([
        ApiClient.getState('LenderA'),
        ApiClient.getState('LenderB'),
        ApiClient.getState('Borrower'),
      ]);

      renderPrivacyColumn('inspectorLenderA', stateA);
      renderPrivacyColumn('inspectorBorrower', stateBorrower);
      renderPrivacyColumn('inspectorLenderB', stateB);
    } catch (err) {
      console.error('Failed to load privacy snapshot:', err);
    }
  } else {
    modal.style.display = 'none';
  }
}

export function renderPrivacyColumn(elementId, state) {
  const container = document.getElementById(elementId);
  if (!container) return;

  const { privacyAudits, loansA, loansB, payoffQuotes, replacementOffers } = state;
  const hasLoanA = loansA && loansA.length > 0;
  const hasLoanB = loansB && loansB.length > 0;
  const hasQuote = payoffQuotes && payoffQuotes.length > 0;
  const hasOffer = replacementOffers && replacementOffers.length > 0;

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
