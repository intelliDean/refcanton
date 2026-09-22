// frontend/js/components/auditModal.js
// Transaction history & audit trail modal

import { ApiClient } from '../api.js';

export async function toggleTxModal() {
  const modal = document.getElementById('txModal');
  if (!modal) return;
  const isHidden = modal.style.display === 'none';

  if (isHidden) {
    modal.style.display = 'flex';
    try {
      const txs = await ApiClient.getTransactions();
      const container = document.getElementById('txListContainer');
      if (!container) return;

      if (!txs || txs.length === 0) {
        container.innerHTML = '<div class="empty-state-text">No transactions committed yet.</div>';
      } else {
        container.innerHTML = txs
          .map(
            tx => `
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
        `
          )
          .join('');
      }
    } catch (err) {
      console.error('Failed to load transaction audit history:', err);
    }
  } else {
    modal.style.display = 'none';
  }
}
