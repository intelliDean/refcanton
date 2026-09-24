// backend/src/routes/closing.ts
import { Router, Response } from 'express';
import { ledger } from '../ledger';
import { authMiddleware, requireParty, AuthenticatedRequest } from '../middleware/auth';
import { cantonClient, CantonOfflineError } from '../services/cantonClient';
import { DEFAULT_PARTIES } from '../config/constants';

export const closingRouter = Router();

// Apply auth to all closing operations
closingRouter.use(authMiddleware);

// Borrower: Create Closing Request
closingRouter.post('/request', requireParty(DEFAULT_PARTIES.BORROWER), (req: AuthenticatedRequest, res: Response) => {
  try {
    const borrower = req.authenticatedParty || DEFAULT_PARTIES.BORROWER;
    const request = ledger.createClosingRequest(borrower);
    res.json({ success: true, request });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Borrower: Cancel Closing Request
closingRouter.post('/cancel', requireParty(DEFAULT_PARTIES.BORROWER), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId } = req.body;
    const borrower = req.authenticatedParty || DEFAULT_PARTIES.BORROWER;
    ledger.cancelClosingRequest(requestId, borrower);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Borrower: Execute Atomic Close
// Connects directly to Canton, returns committed update ID, and reports offline / rejects when Canton is unavailable
closingRouter.post('/execute', requireParty(DEFAULT_PARTIES.BORROWER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId } = req.body;
    const borrower = req.authenticatedParty || DEFAULT_PARTIES.BORROWER;

    // 1. Verify Canton node health first
    const health = await cantonClient.checkHealth();
    if (!health.online) {
      res.status(503).json({
        error: 'CANTON_OFFLINE',
        message: 'Canton ledger service is offline. Settlement rejected.',
      });
      return;
    }

    // 2. Submit live Canton settlement
    const result = await cantonClient.executeAtomicClosingOnCanton();

    // 3. Sync domain facade store for backward-compatible queries
    try {
      ledger.executeAtomicClose(requestId, borrower, result.updateId);
    } catch {
      // Canton transaction has precedence
    }

    res.json(result);
  } catch (error: any) {
    if (error instanceof CantonOfflineError) {
      res.status(503).json({ error: 'CANTON_OFFLINE', message: error.message });
      return;
    }
    res.status(400).json({ error: error.message });
  }
});
