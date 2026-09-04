import { describe, expect, it } from 'vitest';
import { TAROT_SEED } from '../data/tarotSeed';
import { analyzeTarotSelection } from '../lib/tarotValidator';
import type { TotymDeck } from '../types/totym';

function createDeck(
  cards: TotymDeck['cards'],
): TotymDeck {
  return {
    id: 'tarot-validator-test',
    name: 'Tarot Validator Test',
    format: 'traditional',
    playerMode: '1v1',
    cards,
  };
}

describe('analyzeTarotSelection', () => {
  it('counts selected Major and Minor Arcana cards', () => {
    const result = analyzeTarotSelection(
      createDeck([
        { cardId: 'T-001', quantity: 2 },
        { cardId: 'T-023', quantity: 3 },
        { cardId: 'T-037', quantity: 1 },
      ]),
      TAROT_SEED,
    );

    expect(result.totalTarot).toBe(6);
    expect(result.majorArcanaCount).toBe(2);
    expect(result.minorArcanaCount).toBe(4);
    expect(result.isValid).toBe(true);
  });

  it('rejects more than two copies of one Major Arcana card', () => {
    const result = analyzeTarotSelection(
      createDeck([{ cardId: 'T-001', quantity: 3 }]),
      TAROT_SEED,
    );

    expect(result.isValid).toBe(false);
    expect(result.copyLimitViolations).toEqual([
      {
        cardId: 'T-001',
        cardName: 'The Fool',
        arcanaType: 'major',
        quantity: 3,
        allowedQuantity: 2,
      },
    ]);
  });

  it('rejects more than three copies of one Minor Arcana card', () => {
    const result = analyzeTarotSelection(
      createDeck([{ cardId: 'T-023', quantity: 4 }]),
      TAROT_SEED,
    );

    expect(result.isValid).toBe(false);
    expect(result.copyLimitViolations).toEqual([
      {
        cardId: 'T-023',
        cardName: 'Ace of Wands',
        arcanaType: 'minor',
        quantity: 4,
        allowedQuantity: 3,
      },
    ]);
  });

  it('flags a selection with more than fifteen Major Arcana cards', () => {
    const result = analyzeTarotSelection(
      createDeck([
        { cardId: 'T-001', quantity: 2 },
        { cardId: 'T-002', quantity: 2 },
        { cardId: 'T-003', quantity: 2 },
        { cardId: 'T-004', quantity: 10 },
      ]),
      TAROT_SEED,
    );

    expect(result.majorArcanaCount).toBe(16);
    expect(result.hasTooManyMajorArcana).toBe(true);
    expect(result.isValid).toBe(false);
  });
});