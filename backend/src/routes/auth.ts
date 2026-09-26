// backend/src/routes/auth.ts
// Verified Party Authentication & Token Issuance Route

import { Router, Request, Response } from 'express';
import {
  generateVerifiedToken,
  PARTY_CREDENTIALS,
  verifyPartyToken,
} from '../middleware/auth';
import { DEFAULT_PARTIES } from '../config/constants';

export const authRouter = Router();

// Token issuance via verified party credentials
authRouter.post('/token', (req: Request, res: Response) => {
  const { party, secret } = req.body;

  if (!party || typeof party !== 'string') {
    res.status(400).json({ error: 'INVALID_REQUEST', message: 'party field is required' });
    return;
  }

  const expectedSecret = PARTY_CREDENTIALS[party];
  if (!expectedSecret) {
    res.status(401).json({ error: 'INVALID_PARTY', message: `Unknown party '${party}'` });
    return;
  }

  if (secret !== expectedSecret) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid credentials for party' });
    return;
  }

  const token = generateVerifiedToken(party);
  res.json({
    success: true,
    party,
    token,
    tokenType: 'Bearer',
    expiresIn: 86400,
  });
});

// Provide verified demo role tokens for initial web client session bootstrap
authRouter.get('/demo-tokens', (_req: Request, res: Response) => {
  res.json({
    success: true,
    tokens: {
      borrower: generateVerifiedToken(DEFAULT_PARTIES.BORROWER),
      lenderA: generateVerifiedToken(DEFAULT_PARTIES.LENDER_A),
      lenderB: generateVerifiedToken(DEFAULT_PARTIES.LENDER_B),
      operator: generateVerifiedToken(DEFAULT_PARTIES.OPERATOR),
    },
  });
});

// Verify token validity
authRouter.get('/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ valid: false, error: 'MISSING_BEARER_TOKEN' });
    return;
  }

  const token = authHeader.substring(7);
  const party = verifyPartyToken(token);
  if (!party) {
    res.status(401).json({ valid: false, error: 'INVALID_OR_EXPIRED_TOKEN' });
    return;
  }

  res.json({ valid: true, party });
});
