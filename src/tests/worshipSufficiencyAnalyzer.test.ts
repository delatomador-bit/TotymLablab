import { describe, expect, it } from 'vitest';
import { CREATURE_SEED } from '../data/creatureSeed';
import { analyzeCreatureCore } from '../lib/creatureCoreAnalyzer';
import { generateWorshipPackage } from '../lib/worshipPackageGenerator';
import { analyzeWorshipSufficiency } from '../lib/worshipSufficiencyAnalyzer';
import type { TotymDeck } from '../types/totym';

function createDeck(cardIds: string[]): TotymDeck {
  return {
    id: 'worship-sufficiency-test',
    name: 'Worship Sufficiency Test',
    format: 'traditional',
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

describe('analyzeWorshipSufficiency', () => {
  it('waits for a complete five-Creature core', () => {
    const creatureCore = analyzeCreatureCore(
      createDeck(['C-001']),
      CREATURE_SEED,
    );

    const worshipPackage = generateWorshipPackage(creatureCore);
    const result = analyzeWorshipSufficiency(
      creatureCore,
      worshipPackage,
    );

    expect(result.canPerfectlySupportEveryCreature).toBe(false);
    expect(result.warnings[0]).toContain(
      'unavailable until 5 distinct Creatures',
    );
  });

  it('identifies Lucky’s Druid shortfall in the proportional package', () => {
    const creatureCore = analyzeCreatureCore(
      createDeck(VERIFIED_CREATURE_IDS),
      CREATURE_SEED,
    );

    const worshipPackage = generateWorshipPackage(creatureCore);
    const result = analyzeWorshipSufficiency(
      creatureCore,
      worshipPackage,
    );

    expect(result.canPerfectlySupportEveryCreature).toBe(false);

    expect(result.gaps).toEqual([
      {
        clan: 'druids',
        available: 3,
        required: 4,
        shortfall: 1,
        affectedRequirements: [
          {
            clan: 'druids',
            required: 4,
            creatureName: 'Lucky',
            side: 'left',
          },
        ],
      },
    ]);
  });

  it('shows the highest one-Creature requirement for each clan', () => {
    const creatureCore = analyzeCreatureCore(
      createDeck(VERIFIED_CREATURE_IDS),
      CREATURE_SEED,
    );

    const worshipPackage = generateWorshipPackage(creatureCore);
    const result = analyzeWorshipSufficiency(
      creatureCore,
      worshipPackage,
    );

    expect(result.maximumRequirementByClan).toEqual([
      { clan: 'berserkers', required: 3 },
      { clan: 'druids', required: 4 },
      { clan: 'bards', required: 2 },
      { clan: 'zealots', required: 4 },
      { clan: 'mystics', required: 3 },
    ]);
  });
});