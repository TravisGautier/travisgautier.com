/**
 * Inventory sync between a retail POS and a storefront.
 *
 * The failure list came before the code. Every branch below exists because a
 * real retail operation loses money when it is missing: an oversell that has
 * to be apologised for, a webhook delivered twice, a refund that never puts
 * the unit back on the shelf.
 */

export type Channel = 'pos' | 'storefront';

export type InventoryEvent =
  | { id: string; type: 'restock'; sku: string; qty: number; at: number; channel: Channel }
  | { id: string; type: 'sale'; sku: string; qty: number; at: number; channel: Channel }
  | { id: string; type: 'refund'; sku: string; qty: number; at: number; channel: Channel; refundOf: string }
  | { id: string; type: 'reserve'; sku: string; qty: number; at: number; channel: Channel; expiresAt: number };

export interface Reservation { eventId: string; qty: number; expiresAt: number }

export interface SkuState {
  sku: string;
  onHand: number;
  reservations: Reservation[];
  appliedEventIds: string[];
  lastAppliedAt: number;
}

export type ApplyError =
  | 'unknown-sku'
  | 'duplicate-event'
  | 'stale-event'
  | 'oversell'
  | 'refund-without-sale'
  | 'non-positive-qty';

export type ApplyResult =
  | { ok: true; state: SkuState }
  | { ok: false; error: ApplyError; state: SkuState };

export function createSku(sku: string, onHand = 0): SkuState {
  return { sku, onHand, reservations: [], appliedEventIds: [], lastAppliedAt: 0 };
}

/** On-hand minus stock held by reservations that have not expired yet. */
export function availableToSell(state: SkuState, now: number): number {
  const held = state.reservations
    .filter((r) => r.expiresAt > now)
    .reduce((sum, r) => sum + r.qty, 0);
  return state.onHand - held;
}

export function applyEvent(state: SkuState, event: InventoryEvent, now: number): ApplyResult {
  const reject = (error: ApplyError): ApplyResult => ({ ok: false, error, state });

  // Order matters. Identity before idempotency before arithmetic, so a
  // redelivered event can never be judged against the wrong SKU's numbers.
  if (event.sku !== state.sku) return reject('unknown-sku');
  if (state.appliedEventIds.includes(event.id)) return reject('duplicate-event');
  if (event.qty <= 0) return reject('non-positive-qty');
  if (event.at < state.lastAppliedAt) return reject('stale-event');

  const next: SkuState = {
    ...state,
    reservations: [...state.reservations],
    appliedEventIds: [...state.appliedEventIds, event.id],
    lastAppliedAt: Math.max(state.lastAppliedAt, event.at),
  };

  switch (event.type) {
    case 'restock':
      next.onHand = state.onHand + event.qty;
      break;
    case 'sale':
      if (event.qty > availableToSell(state, now)) return reject('oversell');
      next.onHand = state.onHand - event.qty;
      break;
    case 'refund':
      if (!state.appliedEventIds.includes(event.refundOf)) return reject('refund-without-sale');
      next.onHand = state.onHand + event.qty;
      break;
    case 'reserve':
      if (event.qty > availableToSell(state, now)) return reject('oversell');
      next.reservations.push({ eventId: event.id, qty: event.qty, expiresAt: event.expiresAt });
      break;
  }

  return { ok: true, state: next };
}
