// frontend/js/api.js
// Centralized API Client with Cryptographically Verified Party Authentication

const API_BASE = '/api';

export class ApiClient {
  static tokens = {
    Borrower: sessionStorage.getItem('refcanton_token_Borrower') || '',
    LenderA: sessionStorage.getItem('refcanton_token_LenderA') || '',
    LenderB: sessionStorage.getItem('refcanton_token_LenderB') || '',
    Operator: sessionStorage.getItem('refcanton_token_Operator') || '',
  };
  static currentParty = 'Borrower';

  static isAuthenticated(party = this.currentParty) {
    return Boolean(this.tokens[party]);
  }

  static async authenticateParty(party, secret) {
    const res = await fetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ party, secret }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error(data.message || data.error || 'Authentication failed');
    }
    this.tokens[party] = data.token;
    sessionStorage.setItem(`refcanton_token_${party}`, data.token);
    return data.token;
  }

  static logout(party = this.currentParty) {
    this.tokens[party] = '';
    sessionStorage.removeItem(`refcanton_token_${party}`);
  }

  static setParty(party) {
    this.currentParty = party;
  }

  static async request(endpoint, options = {}) {
    try {

      // Determine required party identity for endpoint
      let actingParty = options.party || this.currentParty;
      if (endpoint.startsWith('/state/LenderA') || endpoint.startsWith('/quotes')) {
        actingParty = 'LenderA';
      } else if (endpoint.startsWith('/state/LenderB') || endpoint.startsWith('/offers')) {
        actingParty = 'LenderB';
      } else if (endpoint.startsWith('/state/Borrower') || endpoint.startsWith('/closing')) {
        actingParty = 'Borrower';
      } else if (endpoint.startsWith('/reset')) {
        actingParty = 'Operator';
      }

      const token = this.tokens[actingParty];
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Attach cryptographically verified Bearer token
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${API_BASE}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}: Request failed`);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  // Network status (Public)
  static getStatus() {
    return this.request('/status');
  }

  // State projection for a party
  static getState(party) {
    return this.request(`/state/${party}`, { party });
  }

  // Audit transaction trail
  static getTransactions() {
    return this.request('/transactions');
  }

  // Lender A Quote actions
  static createPayoffQuote(payload = {}) {
    return this.request('/quotes/create', {
      method: 'POST',
      party: 'LenderA',
      body: JSON.stringify(payload),
    });
  }

  static withdrawPayoffQuote(quoteId, lenderA = 'LenderA') {
    return this.request('/quotes/withdraw', {
      method: 'POST',
      party: 'LenderA',
      body: JSON.stringify({ quoteId, lenderA }),
    });
  }

  // Lender B Offer actions
  static createReplacementOffer(payload = {}) {
    return this.request('/offers/create', {
      method: 'POST',
      party: 'LenderB',
      body: JSON.stringify(payload),
    });
  }

  static withdrawReplacementOffer(offerId, lenderB = 'LenderB') {
    return this.request('/offers/withdraw', {
      method: 'POST',
      party: 'LenderB',
      body: JSON.stringify({ offerId, lenderB }),
    });
  }

  // Borrower Closing actions
  static createClosingRequest(borrower = 'Borrower') {
    return this.request('/closing/request', {
      method: 'POST',
      party: 'Borrower',
      body: JSON.stringify({ borrower }),
    });
  }

  static cancelClosingRequest(requestId, borrower = 'Borrower') {
    return this.request('/closing/cancel', {
      method: 'POST',
      party: 'Borrower',
      body: JSON.stringify({ requestId, borrower }),
    });
  }

  static executeAtomicClose(requestId, borrower = 'Borrower') {
    return this.request('/closing/execute', {
      method: 'POST',
      party: 'Borrower',
      body: JSON.stringify({ requestId, borrower }),
    });
  }

  // System Demo Reset
  static resetDemo() {
    return this.request('/reset', {
      method: 'POST',
      party: 'Operator',
    });
  }
}
