// frontend/app.js
// Main Application Orchestrator for RefCanton

import { ApiClient } from './js/api.js';
import { showToast } from './js/components/toast.js';
import { togglePrivacyInspector } from './js/components/privacyModal.js';
import { toggleTxModal } from './js/components/auditModal.js';
import {
  toggleSimulationModal,
  triggerInsufficientFunds,
  triggerExpireQuote,
  triggerResetSimulation,
} from './js/components/simulationModal.js';
import { renderBorrowerView, requestAndExecuteClose } from './js/views/borrowerView.js';
import { renderLenderAView, issuePayoffQuote, withdrawPayoffQuote } from './js/views/lenderAView.js';
import { renderLenderBView, issueReplacementOffer, withdrawReplacementOffer } from './js/views/lenderBView.js';

let currentRole = 'Borrower';
let currentLedgerState = null;
let pollInterval = null;

// Attach handlers to window for inline onclick handlers in HTML
window.setRole = setRole;
window.togglePrivacyInspector = togglePrivacyInspector;
window.toggleTxModal = toggleTxModal;
window.toggleSimulationModal = toggleSimulationModal;
window.triggerInsufficientFunds = () => triggerInsufficientFunds(fetchState);
window.triggerExpireQuote = () => triggerExpireQuote(fetchState);
window.triggerResetSimulation = () => triggerResetSimulation(fetchState);
window.issuePayoffQuote = () => issuePayoffQuote(fetchState);
window.withdrawPayoffQuote = () => withdrawPayoffQuote(fetchState);
window.issueReplacementOffer = () => issueReplacementOffer(fetchState);
window.withdrawReplacementOffer = () => withdrawReplacementOffer(fetchState);
window.requestAndExecuteClose = () => requestAndExecuteClose(fetchState);
window.resetLedger = resetLedger;

// Lifecycle Initialization
document.addEventListener('DOMContentLoaded', () => {
  fetchState();
  pollInterval = setInterval(fetchState, 2500);
});

// Role Switcher
export function setRole(role) {
  currentRole = role;

  // Update tabs
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(`roleBtn${role}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update visible view section
  document.querySelectorAll('.role-view').forEach(v => v.classList.remove('active-view'));
  const activeView = document.getElementById(`view${role}`);
  if (activeView) activeView.classList.add('active-view');

  // Update banner text
  const badge = document.getElementById('bannerBadge');
  const desc = document.getElementById('bannerDesc');

  if (role === 'Borrower') {
    if (badge) badge.innerText = 'Role: Borrower (Alice)';
    if (desc) {
      desc.innerHTML =
        'You are refinancing your <strong>$101,000</strong> bullet loan with incoming capital from Lender B (<strong>$100,000</strong>) and your <strong>$1,000</strong> equity contribution.';
    }
  } else if (role === 'LenderA') {
    if (badge) badge.innerText = 'Role: Outgoing Lender A (LegacyBank)';
    if (desc) {
      desc.innerHTML =
        'You hold the existing <strong>$101,000</strong> loan secured by <strong>150 collateral units</strong>. Issue your binding payoff quote to permit atomic release upon full satisfaction.';
    }
  } else if (role === 'LenderB') {
    if (badge) badge.innerText = 'Role: Incoming Lender B (NeoCapital)';
    if (desc) {
      desc.innerHTML =
        'You are funding the <strong>$100,000</strong> replacement facility at a competitive <strong>7.5% cap-rate</strong>, secured by <strong>150 collateral units</strong> transferred atomically upon close.';
    }
  }

  fetchState();
}

// Fetch State & Dispatch to Views
export async function fetchState() {
  try {
    const state = await ApiClient.getState(currentRole);
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

// Reset Demo State
export async function resetLedger() {
  try {
    await ApiClient.resetDemo();
    showToast('Ledger reset to initial baseline test state');
    fetchState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
