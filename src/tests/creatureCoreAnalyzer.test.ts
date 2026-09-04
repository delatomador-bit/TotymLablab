import { describe, expect, it } from 'vitest';
import { CREATURE_SEED } from '../data/creatureSeed';
import { analyzeCreatureCore } from '../lib/creatureCoreAnalyzer';
import type { TotymDeck } from '../types/totym';

function createDeck(cardIds: string[]): TotymDeck {
  return {
    id: 'test-deck',
    name: 'Creature Core Test',
    format: 'traditional',
    playerMode: '1v1',
    cards: cardIds.map((cardId) => ({
      cardId,
      quantity: 1,
    })),
  };
}

describe('analyzeCreatureCore', () => {
  it('returns an incomplete profile when no Creatures are selected', () => {
    const profile = analyzeCreatureCore(createDeck([]), CREATURE_SEED);

    expect(profile.isComplete).toBe(false);
    expect(profile.distinctCreatureCount).toBe(0);
    expect(profile.totalWorshipRequired).toBe(0);
    expect(profile.requirementProfile).toBe('incomplete');
  });

  it('reads Luna’s factual requirements correctly', () => {
    const profile = analyzeCreatureCore(createDeck(['C-001']), CREATURE_SEED);

    expect(profile.entries).toHaveLength(1);
    expect(profile.entries[0].name).toBe('Luna');
    expect(profile.entries[0].left).toEqual({
      clan: 'mystics',
      required: 3,
    });
    expect(profile.entries[0].right).toEqual({
      clan: 'bards',
      required: 2,
    });
    expect(profile.totalWorshipRequired).toBe(5);
  });

  it('calculates the verified five-Creature demand profile', () => {
    const profile = analyzeCreatureCore(
      createDeck(['C-001', 'C-003', 'C-010', 'C-025', 'C-038']),
      CREATURE_SEED,
    );

    const demandByClan = Object.fromEntries(
      profile.clanDemand.map((demand) => [demand.clan, demand.required]),
    );

    expect(profile.isComplete).toBe(true);
    expect(profile.distinctCreatureCount).toBe(5);
    expect(profile.totalWorshipRequired).toBe(25);
    expect(profile.uniqueClanCount).toBe(5);
    expect(profile.requirementProfile).toBe('broad');

    expect(demandByClan).toEqual({
      berserkers: 7,
      druids: 4,
      bards: 3,
      zealots: 8,
      mystics: 3,
    });
  });

  it('flags a duplicate Creature quantity', () => {
    const deck: TotymDeck = {
      id: 'duplicate-test',
      name: 'Duplicate Creature Test',
      format: 'traditional',
      playerMode: '1v1',
      cards: [
        { cardId: 'C-001', quantity: 2 },
        { cardId: 'C-003', quantity: 1 },
        { cardId: 'C-010', quantity: 1 },
        { cardId: 'C-025', quantity: 1 },
      ],
    };

    const profile = analyzeCreatureCore(deck, CREATURE_SEED);

    expect(profile.hasDuplicateCreatures).toBe(true);
    expect(profile.isComplete).toBe(false);
    expect(profile.requirementProfile).toBe('incomplete');
    expect(profile.warnings).toContain(
      'Traditional Mode requires five unique Creatures; duplicate Creature quantities are not allowed.',
    );
  });
});