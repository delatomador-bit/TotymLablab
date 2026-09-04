import { describe, expect, it } from 'vitest';
import { CREATURE_SEED } from '../data/creatureSeed';
import { analyzeCreatureCore } from '../lib/creatureCoreAnalyzer';
import { generateWorshipPackage } from '../lib/worshipPackageGenerator';
import type { TotymDeck } from '../types/totym';

function createDeck(cardIds: string[]): TotymDeck {
  return {
    id: 'worship-test-deck',
    name: 'Worship Generator Test',
    format: 'traditional',
    playerMode: '1v1',
    cards: cardIds.map((cardId) => ({
      cardId,
      quantity: 1,
    })),
  };
}

describe('generateWorshipPackage', () => {
  it('returns no allocation for an incomplete Creature Core', () => {
    const creatureCore = analyzeCreatureCore(
      createDeck(['C-001']),
      CREATURE_SEED,
    );

    const worshipPackage = generateWorshipPackage(creatureCore);

    expect(worshipPackage.isCompleteCreatureCore).toBe(false);
    expect(worshipPackage.total).toBe(0);
    expect(
      worshipPackage.warnings.some((warning) =>
        warning.includes('exactly 5 unique Creatures'),
      ),
    ).toBe(true);
  });

  it('generates exactly 20 Worship cards for the verified five-Creature core', () => {
    const creatureCore = analyzeCreatureCore(
      createDeck(['C-001', 'C-003', 'C-010', 'C-025', 'C-038']),
      CREATURE_SEED,
    );

    const worshipPackage = generateWorshipPackage(creatureCore);

    expect(worshipPackage.isCompleteCreatureCore).toBe(true);
    expect(worshipPackage.total).toBe(20);

    const allocationByClan = Object.fromEntries(
      worshipPackage.allocations.map((allocation) => [
        allocation.clan,
        allocation.quantity,
      ]),
    );

    expect(allocationByClan).toEqual({
      berserkers: 5,
      druids: 3,
      bards: 3,
      zealots: 6,
      mystics: 3,
    });
  });

  it('gives every used clan at least one Worship card', () => {
    const creatureCore = analyzeCreatureCore(
      createDeck(['C-001', 'C-003', 'C-010', 'C-025', 'C-038']),
      CREATURE_SEED,
    );

    const worshipPackage = generateWorshipPackage(creatureCore);

    worshipPackage.allocations
      .filter((allocation) => allocation.demand > 0)
      .forEach((allocation) => {
        expect(allocation.quantity).toBeGreaterThanOrEqual(1);
      });
  });

  it('keeps all clan rows visible in stable order', () => {
    const creatureCore = analyzeCreatureCore(
      createDeck(['C-001', 'C-003', 'C-010', 'C-025', 'C-038']),
      CREATURE_SEED,
    );

    const worshipPackage = generateWorshipPackage(creatureCore);

    expect(worshipPackage.allocations.map((entry) => entry.clan)).toEqual([
      'berserkers',
      'druids',
      'bards',
      'zealots',
      'mystics',
    ]);
  });
});