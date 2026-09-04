import { describe, expect, it } from 'vitest';
import { CREATURE_SEED } from '../data/creatureSeed';
import { validateTraditionalDeck } from '../lib/traditionalDeckValidator';
import type { TotymCard, TotymDeck } from '../types/totym';

const TAROT_TEST_CARDS: TotymCard[] = Array.from(
  { length: 30 },
  (_, index) => ({
    id: `T-${String(index + 1).padStart(3, '0')}`,
    cardNumber: `T-${String(index + 1).padStart(3, '0')}`,
    name: `Test Tarot ${index + 1}`,
    cardType: 'tarot',
    arcanaType: 'major',
    suit: null,
    targetType: null,
    effectText: `Test Tarot effect ${index + 1}`,
  }),
);

const ALL_TEST_CARDS = [...CREATURE_SEED, ...TAROT_TEST_CARDS];

function createDeck(
  cardIds: string[],
  format: TotymDeck['format'] = 'traditional',
): TotymDeck {
  return {
    id: 'traditional-validator-test-deck',
    name: 'Traditional Validator Test',
    format,
    playerMode: '1v1',
    cards: cardIds.map((cardId) => ({
      cardId,
      quantity: 1,
    })),
  };
}

const VERIFIED_CREATURE_IDS = [
  'C-001',
  'C-003',
  'C-010',
  'C-025',
  'C-038',
];

const THIRTY_TAROT_IDS = TAROT_TEST_CARDS.map((card) => card.id);

describe('validateTraditionalDeck', () => {
  it('validates the full 5-Creature, 30-Tarot Traditional Mode shell', () => {
    const deck = createDeck([
      ...VERIFIED_CREATURE_IDS,
      ...THIRTY_TAROT_IDS,
    ]);

    const result = validateTraditionalDeck(deck, ALL_TEST_CARDS);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.counts).toEqual({
      manualCreatures: 5,
      distinctCreatures: 5,
      manualTarot: 30,
      generatedWorship: 20,
      reservedImposters: 5,
      computedTotal: 60,
    });
  });

  it('reports a missing Creature and withholds generated Worship', () => {
    const deck = createDeck([
      ...VERIFIED_CREATURE_IDS.slice(0, 4),
      ...THIRTY_TAROT_IDS,
    ]);

    const result = validateTraditionalDeck(deck, ALL_TEST_CARDS);

    expect(result.isValid).toBe(false);
    expect(result.counts.manualCreatures).toBe(4);
    expect(result.counts.generatedWorship).toBe(0);
    expect(result.counts.computedTotal).toBe(39);
    expect(
      result.errors.some((error) =>
        error.includes('Select 1 more Creature card'),
      ),
    ).toBe(true);
  });

  it('reports a Tarot shortfall', () => {
    const deck = createDeck([
      ...VERIFIED_CREATURE_IDS,
      ...THIRTY_TAROT_IDS.slice(0, 29),
    ]);

    const result = validateTraditionalDeck(deck, ALL_TEST_CARDS);

    expect(result.isValid).toBe(false);
    expect(result.counts.manualTarot).toBe(29);
    expect(result.counts.computedTotal).toBe(59);
    expect(
      result.errors.some((error) =>
        error.includes('Add 1 Tarot card'),
      ),
    ).toBe(true);
  });

  it('rejects duplicate Creature quantities', () => {
    const deck: TotymDeck = {
      id: 'duplicate-creature-test-deck',
      name: 'Duplicate Creature Test',
      format: 'traditional',
      playerMode: '1v1',
      cards: [
        {
          cardId: 'C-001',
          quantity: 2,
        },
        ...VERIFIED_CREATURE_IDS.slice(1).map((cardId) => ({
          cardId,
          quantity: 1,
        })),
        ...THIRTY_TAROT_IDS.map((cardId) => ({
          cardId,
          quantity: 1,
        })),
      ],
    };

    const result = validateTraditionalDeck(deck, ALL_TEST_CARDS);

    expect(result.isValid).toBe(false);
    expect(result.counts.manualCreatures).toBe(6);
    expect(result.counts.distinctCreatures).toBe(5);
    expect(result.counts.generatedWorship).toBe(0);
    expect(
      result.errors.some((error) =>
        error.includes('does not allow duplicate Creature quantities'),
      ),
    ).toBe(true);
  });
});