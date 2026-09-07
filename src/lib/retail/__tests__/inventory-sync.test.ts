import { describe, it, expect } from 'vitest';
import {
  createSku,
  availableToSell,
  applyEvent,
  type InventoryEvent,
  type SkuState,
} from '../inventory-sync';

const T = 1_000_000;
const sale = (id: string, qty: number, at = T): InventoryEvent =>
  ({ id, type: 'sale', sku: 'TEE-BLK-M', qty, at, channel: 'storefront' });
const restock = (id: string, qty: number, at = T): InventoryEvent =>
  ({ id, type: 'restock', sku: 'TEE-BLK-M', qty, at, channel: 'pos' });
const reserve = (id: string, qty: number, expiresAt: number, at = T): InventoryEvent =>
  ({ id, type: 'reserve', sku: 'TEE-BLK-M', qty, at, expiresAt, channel: 'storefront' });
const refund = (id: string, qty: number, refundOf: string, at = T): InventoryEvent =>
  ({ id, type: 'refund', sku: 'TEE-BLK-M', qty, at, refundOf, channel: 'pos' });

const ok = (r: ReturnType<typeof applyEvent>): SkuState => {
  if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
  return r.state;
};

describe('createSku', () => {
  it('starts with the given quantity on hand and nothing reserved', () => {
    const s = createSku('TEE-BLK-M', 10);
    expect(s.onHand).toBe(10);
    expect(s.reservations).toEqual([]);
  });
  it('defaults to zero on hand', () => {
    expect(createSku('TEE-BLK-M').onHand).toBe(0);
  });
});

describe('sales and restocks', () => {
  it('a sale decrements on hand', () => {
    const s = ok(applyEvent(createSku('TEE-BLK-M', 10), sale('e1', 3), T));
    expect(s.onHand).toBe(7);
  });
  it('a restock increments on hand', () => {
    const s = ok(applyEvent(createSku('TEE-BLK-M', 10), restock('e1', 5), T));
    expect(s.onHand).toBe(15);
  });
  it('rejects a non-positive quantity instead of silently no-oping', () => {
    const r = applyEvent(createSku('TEE-BLK-M', 10), sale('e1', 0), T);
    expect(r).toMatchObject({ ok: false, error: 'non-positive-qty' });
  });
});

describe('duplicate delivery (webhooks are at-least-once)', () => {
  it('applying the same event id twice does not decrement twice', () => {
    const first = ok(applyEvent(createSku('TEE-BLK-M', 10), sale('e1', 3), T));
    const second = applyEvent(first, sale('e1', 3), T);
    expect(second).toMatchObject({ ok: false, error: 'duplicate-event' });
    expect(second.state.onHand).toBe(7);
  });
  it('records every applied event id so redelivery is detectable', () => {
    const s = ok(applyEvent(createSku('TEE-BLK-M', 10), sale('e1', 1), T));
    expect(s.appliedEventIds).toContain('e1');
  });
});

describe('oversell', () => {
  it('refuses a sale larger than what is available', () => {
    const r = applyEvent(createSku('TEE-BLK-M', 2), sale('e1', 3), T);
    expect(r).toMatchObject({ ok: false, error: 'oversell' });
    expect(r.state.onHand).toBe(2);
  });
  it('allows a sale that exactly empties the shelf', () => {
    const s = ok(applyEvent(createSku('TEE-BLK-M', 2), sale('e1', 2), T));
    expect(s.onHand).toBe(0);
  });
  it('counts live reservations against availability', () => {
    const held = ok(applyEvent(createSku('TEE-BLK-M', 5), reserve('r1', 4, T + 900), T));
    const r = applyEvent(held, sale('e1', 2), T);
    expect(r).toMatchObject({ ok: false, error: 'oversell' });
  });
});

describe('reservations', () => {
  it('a live reservation reduces what is available to sell', () => {
    const s = ok(applyEvent(createSku('TEE-BLK-M', 5), reserve('r1', 2, T + 900), T));
    expect(availableToSell(s, T)).toBe(3);
    expect(s.onHand).toBe(5);
  });
  it('an expired reservation releases its stock', () => {
    const s = ok(applyEvent(createSku('TEE-BLK-M', 5), reserve('r1', 2, T + 900), T));
    expect(availableToSell(s, T + 901)).toBe(5);
  });
});

describe('out of order delivery (the POS was offline)', () => {
  it('rejects an event older than the last one applied', () => {
    const s = ok(applyEvent(createSku('TEE-BLK-M', 10), sale('e1', 1, T + 100), T));
    const r = applyEvent(s, sale('e2', 1, T - 100), T);
    expect(r).toMatchObject({ ok: false, error: 'stale-event' });
    expect(r.state.onHand).toBe(9);
  });
  it('accepts an event at the same timestamp (two registers, one second)', () => {
    const s = ok(applyEvent(createSku('TEE-BLK-M', 10), sale('e1', 1, T), T));
    expect(ok(applyEvent(s, sale('e2', 1, T), T)).onHand).toBe(8);
  });
});

describe('refunds', () => {
  it('a refund puts the unit back', () => {
    const sold = ok(applyEvent(createSku('TEE-BLK-M', 10), sale('e1', 2), T));
    expect(ok(applyEvent(sold, refund('e2', 2, 'e1', T + 1), T)).onHand).toBe(10);
  });
  it('refuses a refund against a sale it has never seen', () => {
    const r = applyEvent(createSku('TEE-BLK-M', 10), refund('e2', 2, 'nope', T), T);
    expect(r).toMatchObject({ ok: false, error: 'refund-without-sale' });
  });
});

describe('sku identity', () => {
  it('refuses an event for a different sku rather than creating one', () => {
    const evt = { ...sale('e1', 1), sku: 'MUG-WHT' } as InventoryEvent;
    const r = applyEvent(createSku('TEE-BLK-M', 10), evt, T);
    expect(r).toMatchObject({ ok: false, error: 'unknown-sku' });
  });
});
