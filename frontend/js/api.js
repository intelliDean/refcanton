// frontend/js/api.js
// Centralized API Client for RefCanton Gateway

const API_BASE = '/api';

export class ApiClient {
  static async request(endpoint, options = {}) {
    try {
      const url = `${API_BASE}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Request failed`);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  // Network status
  static getStatus() {
    return this.request('/status');
  }

  // State projection for a party
  static getState(party) {
    return this.request(`/state/${party}`);
  }

  // Audit transaction trail
  static getTransactions() {
    return this.request('/transactions');
  }

  // Lender A Quote actions
  static createPayoffQuote(payload = {}) {
    return this.request('/quotes/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static withdrawPayoffQuote(quoteId, lenderA = 'LenderA') {
    return this.request('/quotes/withdraw', {
      method: 'POST',
      body: JSON.stringify({ quoteId, lenderA }),
    });
  }

  // Lender B Offer actions
  static createReplacementOffer(payload = {}) {
    return this.request('/offers/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static withdrawReplacementOffer(offerId, lenderB = 'LenderB') {
    return this.request('/offers/withdraw', {
      method: 'POST',
      body: JSON.stringify({ offerId, lenderB }),
    });
  }

  // Borrower Closing actions
  static createClosingRequest(borrower = 'Borrower') {
    return this.request('/closing/request', {
      method: 'POST',
      body: JSON.stringify({ borrower }),
    });
  }

  static cancelClosingRequest(requestId, borrower = 'Borrower') {
    return this.request('/closing/cancel', {
      method: 'POST',
      body: JSON.stringify({ requestId, borrower }),
    });
  }

  static executeAtomicClose(requestId, borrower = 'Borrower') {
    return this.request('/closing/execute', {
      method: 'POST',
      body: JSON.stringify({ requestId, borrower }),
    });
  }

  // System Demo Reset
  static resetDemo() {
    return this.request('/reset', {
      method: 'POST',
    });
  }
}
