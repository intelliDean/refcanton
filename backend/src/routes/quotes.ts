// backend/src/routes/quotes.ts
import { Router, Response } from 'express';
import { ledger } from '../ledger';
import { authMiddleware, requireParty, AuthenticatedRequest } from '../middleware/auth';
import { DEFAULT_PARTIES } from '../config/constants';

export const quotesRouter = Router();

quotesRouter.use(authMiddleware);

// Lender A: Issue Payoff Quote
quotesRouter.post('/create', requireParty(DEFAULT_PARTIES.LENDER_A), (req: AuthenticatedRequest, res: Response) => {
  try {
    const lenderA = req.authenticatedParty || DEFAULT_PARTIES.LENDER_A;
    const { borrower = DEFAULT_PARTIES.BORROWER, payoffAmount = 101000.0 } = req.body;
    const quote = ledger.issuePayoffQuote(lenderA, borrower, Number(payoffAmount));
    res.json({ success: true, quote });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Lender A: Withdraw Payoff Quote
quotesRouter.post('/withdraw', requireParty(DEFAULT_PARTIES.LENDER_A), (req: AuthenticatedRequest, res: Response) => {
  try {
    const lenderA = req.authenticatedParty || DEFAULT_PARTIES.LENDER_A;
    const { quoteId } = req.body;
    ledger.withdrawPayoffQuote(quoteId, lenderA);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
