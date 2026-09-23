// backend/src/routes/simulation.ts
// Interactive failure simulation endpoints for testing Canton transaction aborts

import { Router, Request, Response } from 'express';
import { ledger } from '../ledger';

export const simulationRouter = Router();

// Set Borrower Cash below equity contribution threshold ($500)
simulationRouter.post('/insufficient-funds', (req: Request, res: Response) => {
  try {
    const { amount = 500.0 } = req.body;
    ledger.simulateInsufficientFunds(Number(amount));
    res.json({
      success: true,
      message: `Borrower cash simulated to $${amount} USD-TEST (insufficient for $1,000 equity)`,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Expire current payoff quote (set expiresAt into the past)
simulationRouter.post('/expire-quote', (_req: Request, res: Response) => {
  try {
    ledger.simulateExpireQuote();
    res.json({
      success: true,
      message: 'Active PayoffQuote timestamp expired (set to 1 hour in the past)',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reset simulation modifications back to normal
simulationRouter.post('/reset', (_req: Request, res: Response) => {
  try {
    ledger.resetSimulation();
    res.json({
      success: true,
      message: 'Simulation parameters reset to normal (Borrower cash $5,000; valid quote timestamp)',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
