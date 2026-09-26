// frontend/js/api.js
// Centralized API Client with Cryptographically Verified Party Authentication

const API_BASE = '/api';

export class ApiClient {
  static tokens = {};
  static currentParty = 'Borrower';
  static authInitPromise = null;

  static async initAuth() {
    if (this.authInitPromise) return this.authInitPromise;
    this.authInitPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/demo-tokens`);
        if (res.ok) {
          const data = await res.json();
          this.tokens = {
            Borrower: data.tokens.borrower,
            LenderA: data.tokens.lenderA,
            LenderB: data.tokens.lenderB,
            Operator: data.tokens.operator,
          };
        }
      } catch (err) {
        console.warn('Could not bootstrap demo tokens:', err.message);
      }
    })();
    return this.authInitPromise;
  }

  static setParty(party) {
    this.currentParty = party;
  }

  static async request(endpoint, options = {}) {
    try {
      // Ensure verified authentication credentials are initialized
      if (!this.tokens.Borrower) {
        await this.initAuth();
      }

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
