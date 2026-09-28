// frontend/js/components/authModal.js
// Cryptographically Verified Party Credentials Authentication Modal

import { ApiClient } from '../api.js';
import { showToast } from './toast.js';

export function toggleAuthModal(show) {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  if (show === undefined) {
    modal.classList.toggle('active');
  } else if (show) {
    modal.classList.add('active');
  } else {
    modal.classList.remove('active');
  }

  // Pre-fill party based on active role
  const partySelect = document.getElementById('authPartySelect');
  if (partySelect) {
    partySelect.value = ApiClient.currentParty;
    updateSecretPlaceholder();
  }
}

export function updateSecretPlaceholder() {
  const partySelect = document.getElementById('authPartySelect');
  const secretInput = document.getElementById('authSecretInput');
  if (!partySelect || !secretInput) return;

  const party = partySelect.value;
  secretInput.placeholder = `Enter verified secret for ${party}`;
  secretInput.value = '';
}

export async function submitAuth(callback) {
  const partySelect = document.getElementById('authPartySelect');
  const secretInput = document.getElementById('authSecretInput');
  const errorEl = document.getElementById('authModalError');

  if (!partySelect || !secretInput) return;

  const party = partySelect.value;
  const secret = secretInput.value.trim();

  if (!secret) {
    if (errorEl) {
      errorEl.innerText = 'Please enter verified credential secret';
      errorEl.style.display = 'block';
    }
    return;
  }

  try {
    if (errorEl) errorEl.style.display = 'none';
    await ApiClient.authenticateParty(party, secret);
    showToast(`Successfully authenticated as ${party}`, 'success');
    toggleAuthModal(false);
    updateAuthBadge();
    if (typeof callback === 'function') callback();
  } catch (err) {
    if (errorEl) {
      errorEl.innerText = err.message || 'Authentication failed: Invalid credentials';
      errorEl.style.display = 'block';
    }
    showToast(`Authentication failed: ${err.message}`, 'error');
  }
}

export function updateAuthBadge() {
  const badge = document.getElementById('authStatusBadge');
  if (!badge) return;

  const isAuth = ApiClient.isAuthenticated(ApiClient.currentParty);
  if (isAuth) {
    badge.innerHTML = `<span class="status-dot green"></span> 🔒 Authenticated: ${ApiClient.currentParty}`;
    badge.className = 'network-tag auth-tag verified';
  } else {
    badge.innerHTML = `<span class="status-dot yellow"></span> 🔓 Unauthenticated (${ApiClient.currentParty})`;
    badge.className = 'network-tag auth-tag unverified';
  }
}

// Auto-fill test secret helper for seamless authorized testing
export function setTestSecret(secret) {
  const secretInput = document.getElementById('authSecretInput');
  if (secretInput) {
    secretInput.value = secret;
  }
}
