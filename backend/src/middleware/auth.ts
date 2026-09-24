// backend/src/middleware/auth.ts
// Party Authentication and Access Control Middleware for RefCanton

import { Request, Response, NextFunction } from 'express';
import { DEFAULT_PARTIES } from '../config/constants';

export interface AuthenticatedRequest extends Request {
  authenticatedParty?: string;
}

const VALID_PARTIES = new Set([
  DEFAULT_PARTIES.BORROWER,
  DEFAULT_PARTIES.LENDER_A,
  DEFAULT_PARTIES.LENDER_B,
  DEFAULT_PARTIES.OPERATOR,
]);

// Map token to party identity
function resolvePartyFromToken(token: string): string | null {
  const normalized = token.trim().toLowerCase();
  if (normalized === 'borrower' || normalized === 'bearer-borrower-token') {
    return DEFAULT_PARTIES.BORROWER;
  }
  if (normalized === 'lendera' || normalized === 'bearer-lendera-token') {
    return DEFAULT_PARTIES.LENDER_A;
  }
  if (normalized === 'lenderb' || normalized === 'bearer-lenderb-token') {
    return DEFAULT_PARTIES.LENDER_B;
  }
  if (normalized === 'operator' || normalized === 'bearer-operator-token' || normalized === 'admin') {
    return DEFAULT_PARTIES.OPERATOR;
  }
  return null;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  let party: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    party = resolvePartyFromToken(token);
  }

  // 2. Check X-Party-Id header
  const partyHeader = req.headers['x-party-id'] as string | undefined;
  if (partyHeader && VALID_PARTIES.has(partyHeader as any)) {
    if (!party) {
      party = partyHeader;
    } else if (party !== partyHeader && party !== DEFAULT_PARTIES.OPERATOR) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Token identity (${party}) conflicts with X-Party-Id header (${partyHeader})`,
      });
      return;
    }
  }

  if (!party) {
    res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'Authentication required. Provide valid Authorization: Bearer <token> or X-Party-Id header.',
    });
    return;
  }

  req.authenticatedParty = party;
  next();
}

export function requireParty(...allowedParties: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const party = req.authenticatedParty;
    if (!party) {
      res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }

    if (party === DEFAULT_PARTIES.OPERATOR || allowedParties.includes(party)) {
      next();
      return;
    }

    res.status(403).json({
      error: 'FORBIDDEN',
      message: `Access denied. Party '${party}' is not authorized for this action. Required: ${allowedParties.join(', ')}`,
    });
  };
}
