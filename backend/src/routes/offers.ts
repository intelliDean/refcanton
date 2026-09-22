// backend/src/routes/offers.ts
import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';

export const offersRouter = Router();

// Lender B: Issue Replacement Offer & Allocate Cash
offersRouter.post('/create', (req: Request, res: Response) => {
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

// Lender B: Withdraw Replacement Offer & Deallocate Cash
offersRouter.post('/withdraw', (req: Request, res: Response) => {
  try {
    const { offerId, lenderB = 'LenderB' } = req.body;
    ledger.withdrawReplacementOffer(offerId, lenderB);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
