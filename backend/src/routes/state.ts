// backend/src/routes/state.ts
import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';

export const stateRouter = Router();

// Status & Network Health
stateRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    network: 'Canton Network LocalNet',
    damlSdkVersion: '3.4.11',
    tokenStandard: 'Splice Token Standard v1',
    timestamp: new Date().toISOString(),
  });
});

// Party-Filtered State (Strict Sub-Transaction Privacy Enforcement)
stateRouter.get('/state/:party', (req: Request, res: Response) => {
  try {
    const party = String(req.params.party);
    const state = ledger.getStateForParty(party);
    res.json(state);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Audit Transaction Log
stateRouter.get('/transactions', (_req: Request, res: Response) => {
  res.json(ledger.transactionHistory);
});

// System: Reset Demo Ledger
stateRouter.post('/reset', (_req: Request, res: Response) => {
  ledger.resetToInitialState();
  res.json({ success: true, message: 'Ledger reset to baseline fixed test state' });
});
