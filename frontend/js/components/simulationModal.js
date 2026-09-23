// frontend/js/components/simulationModal.js
// Interactive failure simulation controls demonstrating Canton atomic aborts

import { ApiClient } from '../api.js';
import { showToast } from './toast.js';

let activeScenario = null;

export function toggleSimulationModal() {
  const modal = document.getElementById('simulationModal');
  if (!modal) return;
  const isHidden = modal.style.display === 'none';
  modal.style.display = isHidden ? 'flex' : 'none';
}

export async function triggerInsufficientFunds(onSuccess) {
  try {
    const res = await ApiClient.simulateInsufficientFunds(500.0);
    activeScenario = 'Insufficient Borrower Equity ($500 vs $1,000)';
    updateSimulationBadge();
    showToast(res.message, 'warning');
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

export async function triggerExpireQuote(onSuccess) {
  try {
    const res = await ApiClient.simulateExpireQuote();
    activeScenario = 'Expired Payoff Quote';
    updateSimulationBadge();
    showToast(res.message, 'warning');
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

export async function triggerResetSimulation(onSuccess) {
  try {
    const res = await ApiClient.resetSimulation();
    activeScenario = null;
    updateSimulationBadge();
    showToast(res.message, 'success');
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function updateSimulationBadge() {
  const banner = document.getElementById('simulationActiveBanner');
  const text = document.getElementById('simulationActiveText');
  if (!banner || !text) return;

  if (activeScenario) {
    banner.style.display = 'flex';
    text.innerText = `Active Test Mode: ${activeScenario} — Canton will abort closing if triggered!`;
  } else {
    banner.style.display = 'none';
  }
}
