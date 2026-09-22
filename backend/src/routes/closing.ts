// backend/src/routes/closing.ts
import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';

export const closingRouter = Router();

// Borrower: Create Closing Request
closingRouter.post('/request', (req: Request, res: Response) => {
  try {
    const { borrower = 'Borrower' } = req.body;
    const request = ledger.createClosingRequest(borrower);
    res.json({ success: true, request });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Borrower: Cancel Closing Request
closingRouter.post('/cancel', (req: Request, res: Response) => {
  try {
    const { requestId, borrower = 'Borrower' } = req.body;
    ledger.cancelClosingRequest(requestId, borrower);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Borrower: Execute Atomic Close
closingRouter.post('/execute', (req: Request, res: Response) => {
  try {
    const { requestId, borrower = 'Borrower' } = req.body;
    const result = ledger.executeAtomicClose(requestId, borrower);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
