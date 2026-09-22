// backend/src/server.ts
// Express API gateway for Ref Canton

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { ledger } from './ledger';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// Status & Network Health
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    network: 'Canton Network LocalNet',
    damlSdkVersion: '3.4.11',
    tokenStandard: 'Splice Token Standard v1',
    timestamp: new Date().toISOString(),
  });
});

// Party-Filtered State (Strict Sub-Transaction Privacy Enforcement)
app.get('/api/state/:party', (req: Request, res: Response) => {
  try {
    const party = String(req.params.party);
    const state = ledger.getStateForParty(party);
    res.json(state);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Audit Transaction Log
app.get('/api/transactions', (_req: Request, res: Response) => {
  res.json(ledger.transactionHistory);
});

// Lender A: Issue Payoff Quote
app.post('/api/quotes/create', (req: Request, res: Response) => {
  try {
    const { lenderA = 'LenderA', borrower = 'Borrower', payoffAmount = 101000.0 } = req.body;
    const quote = ledger.issuePayoffQuote(lenderA, borrower, Number(payoffAmount));
    res.json({ success: true, quote });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Lender A: Withdraw Payoff Quote
app.post('/api/quotes/withdraw', (req: Request, res: Response) => {
  try {
    const { quoteId, lenderA = 'LenderA' } = req.body;
    ledger.withdrawPayoffQuote(quoteId, lenderA);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Lender B: Issue Replacement Offer & Allocate Cash
app.post('/api/offers/create', (req: Request, res: Response) => {
  try {
    const {
      lenderB = 'LenderB',
      borrower = 'Borrower',
      newPrincipal = 100000.0,
      capRate = 0.075,
      amortizationPeriods = 24,
    } = req.body;
    const offer = ledger.issueReplacementOffer(
      lenderB,
      borrower,
      Number(newPrincipal),
      Number(capRate),
      Number(amortizationPeriods)
    );
    res.json({ success: true, offer });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Lender B: Withdraw Replacement Offer
app.post('/api/offers/withdraw', (req: Request, res: Response) => {
  try {
    const { offerId, lenderB = 'LenderB' } = req.body;
    ledger.withdrawReplacementOffer(offerId, lenderB);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Borrower: Create Closing Request
app.post('/api/closing/request', (req: Request, res: Response) => {
  try {
    const { borrower = 'Borrower' } = req.body;
    const request = ledger.createClosingRequest(borrower);
    res.json({ success: true, request });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Borrower: Cancel Closing Request
app.post('/api/closing/cancel', (req: Request, res: Response) => {
  try {
    const { requestId, borrower = 'Borrower' } = req.body;
    ledger.cancelClosingRequest(requestId, borrower);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Borrower: Execute Atomic Close
app.post('/api/closing/execute', (req: Request, res: Response) => {
  try {
    const { requestId, borrower = 'Borrower' } = req.body;
    const result = ledger.executeAtomicClose(requestId, borrower);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// System: Reset Demo Ledger
app.post('/api/reset', (_req: Request, res: Response) => {
  ledger.resetToInitialState();
  res.json({ success: true, message: 'Ledger reset to baseline fixed test state' });
});

app.listen(PORT, () => {
  console.log(`[Canton Refinancing API] Server running on http://localhost:${PORT}`);
});
