// backend/src/middleware/auth.ts
// Cryptographically Verified Party Authentication and Access Control Middleware for RefCanton

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
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

const AUTH_SECRET = process.env.AUTH_SECRET || 'refcanton-verified-secret-key-2026';

export const PARTY_CREDENTIALS: Record<string, string> = {
  [DEFAULT_PARTIES.BORROWER]: process.env.BORROWER_SECRET || 'borrower-canton-sec-2026',
  [DEFAULT_PARTIES.LENDER_A]: process.env.LENDER_A_SECRET || 'lendera-canton-sec-2026',
  [DEFAULT_PARTIES.LENDER_B]: process.env.LENDER_B_SECRET || 'lenderb-canton-sec-2026',
  [DEFAULT_PARTIES.OPERATOR]: process.env.OPERATOR_SECRET || 'operator-canton-sec-2026',
};

/**
 * Generates an HMAC-SHA256 cryptographically signed bearer token for a party.
 */
export function generateVerifiedToken(party: string, expiresInMs: number = 86400000): string {
  if (!VALID_PARTIES.has(party as any)) {
    throw new Error(`Cannot generate token for invalid party: ${party}`);
  }
  const expiry = Date.now() + expiresInMs;
  const payload = `${party}:${expiry}`;
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return `rfc.${payloadB64}.${sig}`;
}

/**
 * Verifies an HMAC-SHA256 signed token and extracts the authenticated party identity.
 * Rejects expired, tampered, or spoofed tokens.
 */
export function verifyPartyToken(token: string): string | null {
  if (!token || typeof token !== 'string') return null;
  const trimmed = token.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3 || parts[0] !== 'rfc') {
    return null;
  }

  const payloadB64 = parts[1];
  const sig = parts[2];
  let payload = '';
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const colonIdx = payload.indexOf(':');
  if (colonIdx === -1) return null;
  const party = payload.slice(0, colonIdx);
  const expiry = parseInt(payload.slice(colonIdx + 1), 10);

  if (isNaN(expiry) || Date.now() > expiry) {
    return null;
  }

  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  if (sig.length !== expectedSig.length) {
    return null;
  }

  try {
    const isMatch = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
    if (!isMatch) return null;
  } catch {
    return null;
  }

  if (!VALID_PARTIES.has(party as any)) {
    return null;
  }

  return party;
}

/**
 * Enforces cryptographic verification on all authenticated routes.
 * Rejects caller-selected identities, self-declared X-Party-Id headers, and backdoors.
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'Authentication required. Provide a valid cryptographically signed Authorization: Bearer <token>. Self-declared identities and unauthenticated X-Party-Id are rejected.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  const party = verifyPartyToken(token);

  if (!party) {
    res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'Invalid, expired, or untrusted authentication token. Caller-selected identities (such as "Bearer admin" or self-declared tokens) are rejected.',
    });
    return;
  }

  // Cross-check: If X-Party-Id was supplied, it must strictly match the verified credential party
  const partyHeader = req.headers['x-party-id'] as string | undefined;
  if (partyHeader && partyHeader !== party && party !== DEFAULT_PARTIES.OPERATOR) {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: `Self-declared X-Party-Id '${partyHeader}' does not match verified token identity '${party}'.`,
    });
    return;
  }

  req.authenticatedParty = party;
  next();
}

/**
 * Access control middleware ensuring only the specified parties can execute an action.
 */
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
