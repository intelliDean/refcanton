// backend/src/routes/state.ts
import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { cantonClient } from '../services/cantonClient';
import { DEFAULT_PARTIES } from '../config/constants';

export const stateRouter = Router();

// Status & Network Health (Public)
stateRouter.get('/status', async (_req: Request, res: Response) => {
  const health = await cantonClient.checkHealth();
  res.json({
    status: health.online ? 'ONLINE' : 'DEGRADED',
    cantonOnline: health.online,
    cantonVersion: health.version || '3.4.11',
    synchronizerId: health.synchronizerId || 'refsynchronizer',
    ledgerOffset: health.ledgerOffset,
    network: 'Canton Multi-Participant Synchronizer',
    tokenStandard: 'Splice Token Standard v1',
    timestamp: new Date().toISOString(),
  });
});

// Party-Filtered State (Enforces Authentication and Party Access Control)
stateRouter.get('/state/:party', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestedParty = String(req.params.party);
    const actingParty = req.authenticatedParty;

    // Prevent users from accessing other parties' private state
    if (actingParty !== requestedParty && actingParty !== DEFAULT_PARTIES.OPERATOR) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Access denied. Party '${actingParty}' is not authorized to inspect '${requestedParty}' state.`,
      });
      return;
    }

    const state = ledger.getStateForParty(requestedParty);
    res.json(state);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Party-Restricted Transaction Log
// Enforces: prevent reading unrestricted transaction logs
stateRouter.get('/transactions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const party = req.authenticatedParty;

  // Operator can inspect entire audit log; other parties only see their own transactions
  if (party === DEFAULT_PARTIES.OPERATOR) {
    res.json(ledger.transactionHistory);
    return;
  }

  const filtered = ledger.transactionHistory.filter(t => t.actingParty === party);
  res.json(filtered);
});

// Retrieve exact transaction by Canton Update ID
stateRouter.get('/transactions/:updateId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updateId = String(req.params.updateId);
    const party = req.authenticatedParty || DEFAULT_PARTIES.BORROWER;
    const tx = await cantonClient.getTransactionById(updateId, party);
    res.json(tx);
  } catch (error: any) {
    res.status(404).json({ error: 'TRANSACTION_NOT_FOUND', message: error.message });
  }
});

// System: Reset Demo Ledger (Restricted to Operator)
stateRouter.post('/reset', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.authenticatedParty !== DEFAULT_PARTIES.OPERATOR) {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Only the Operator party is authorized to reset ledger fixtures.',
    });
    return;
  }

  ledger.resetToInitialState();
  res.json({ success: true, message: 'Ledger reset to baseline fixed test state' });
});
