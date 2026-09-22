// backend/src/routes/quotes.ts
import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';

export const quotesRouter = Router();

// Lender A: Issue Payoff Quote
quotesRouter.post('/create', (req: Request, res: Response) => {
  try {
    const { lenderA = 'LenderA', borrower = 'Borrower', payoffAmount = 101000.0 } = req.body;
    const quote = ledger.issuePayoffQuote(lenderA, borrower, Number(payoffAmount));
    res.json({ success: true, quote });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Lender A: Withdraw Payoff Quote
quotesRouter.post('/withdraw', (req: Request, res: Response) => {
  try {
    const { quoteId, lenderA = 'LenderA' } = req.body;
    ledger.withdrawPayoffQuote(quoteId, lenderA);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
