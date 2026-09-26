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

    // 1. Verify Canton node health (Fail-closed: reject settlement when Canton is unavailable)
    const health = await cantonClient.checkHealth();
    if (!health.online) {
      res.status(503).json({
        error: 'CANTON_OFFLINE',
        message: 'Canton ledger service is offline. Settlement rejected.',
      });
      return;
    }

    // 2. Enforce required, non-empty requestId
    if (!requestId || typeof requestId !== 'string') {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Valid requestId string is required to execute atomic closing.',
      });
      return;
    }

    // 3. Look up closing request: reject nonexistent requests
    const closingReq = ledger.getClosingRequest(requestId);
    if (!closingReq) {
      res.status(400).json({
        error: 'REQUEST_NOT_FOUND',
        message: `Closing request '${requestId}' does not exist on the ledger. Settlement rejected.`,
      });
      return;
    }

    if (closingReq.borrower !== borrower) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Party '${borrower}' is not authorized to execute closing request '${requestId}' for borrower '${closingReq.borrower}'.`,
      });
      return;
    }

    // 4. Validate contract preconditions (sufficient equity, active quotes, unexpired terms)
    ledger.validateClosingPrerequisites(requestId, borrower);

    // 5. Submit live Canton settlement (strictly confirms genuine Canton update ID)
    const result = await cantonClient.executeAtomicClosingOnCanton(requestId, borrower);

    // 6. Sync domain facade store
    ledger.executeAtomicClose(requestId, borrower, result.updateId);

    res.json(result);
  } catch (error: any) {
    if (error instanceof CantonOfflineError) {
      res.status(503).json({ error: 'CANTON_OFFLINE', message: error.message });
      return;
    }
    res.status(400).json({ error: error.message || 'Settlement failed' });
  }
});
