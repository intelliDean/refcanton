// backend/src/routes/offers.ts
import { Router, Response } from 'express';
import { ledger } from '../ledger';
import { authMiddleware, requireParty, AuthenticatedRequest } from '../middleware/auth';
import { DEFAULT_PARTIES } from '../config/constants';

import { cantonClient } from '../services/cantonClient';

export const offersRouter = Router();

offersRouter.use(authMiddleware);

// Lender B: Issue Replacement Offer & Allocate Cash
offersRouter.post('/create', requireParty(DEFAULT_PARTIES.LENDER_B), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lenderB = req.authenticatedParty || DEFAULT_PARTIES.LENDER_B;
    const {
      borrower = DEFAULT_PARTIES.BORROWER,
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
    try {
      const cantonOfferCid = await cantonClient.createReplacementOfferOnCanton(
        borrower,
        Number(newPrincipal),
        Number(capRate),
        Number(amortizationPeriods)
      );
      if (cantonOfferCid) {
        offer.contractId = cantonOfferCid;
      }
    } catch (e: any) {
      console.warn('Canton live replacement offer creation deferred:', e.message);
    }
    res.json({ success: true, offer });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Lender B: Withdraw Replacement Offer & Deallocate Cash
offersRouter.post('/withdraw', requireParty(DEFAULT_PARTIES.LENDER_B), (req: AuthenticatedRequest, res: Response) => {
  try {
    const lenderB = req.authenticatedParty || DEFAULT_PARTIES.LENDER_B;
    const { offerId } = req.body;
    ledger.withdrawReplacementOffer(offerId, lenderB);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
