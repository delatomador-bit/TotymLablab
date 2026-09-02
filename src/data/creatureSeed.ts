import type { TotymCard } from '../types/totym';

/**
 * Verified Creature seed set from Card-Details_Revised.xlsx.
 *
 * Used only to prove the rules engine before importing the full catalog.
 * This is factual data, not an optimizer rating or a complete card catalog.
 */
export const CREATURE_SEED: TotymCard[] = [
  {
    id: 'C-001',
    cardNumber: 'C-001',
    name: 'Luna',
    cardType: 'creature',
    arcanaType: null,
    suit: null,
    targetType: null,
    effectText: null,
    immunity: 'Creature cannot be forced to switch',
    blessing: 'Add 1 totem lock action',
    creatureRequirements: {
      left: { clan: 'mystics', required: 3 },
      right: { clan: 'bards', required: 2 },
    },
  },
  {
    id: 'C-003',
    cardNumber: 'C-003',
    name: 'Lucky',
    cardType: 'creature',
    arcanaType: null,
    suit: null,
    targetType: null,
    effectText: null,
    immunity: 'Tarot actions cannot be blocked',
    blessing: 'Add 1 totem lock action',
    creatureRequirements: {
      left: { clan: 'druids', required: 4 },
      right: { clan: 'bards', required: 1 },
    },
  },
  {
    id: 'C-010',
    cardNumber: 'C-010',
    name: 'Daemon',
    cardType: 'creature',
    arcanaType: null,
    suit: null,
    targetType: null,
    effectText: null,
    immunity: 'Turn cannot be skipped',
    blessing: 'Add 1 tarot action by foregoing 1 worship action',
    creatureRequirements: {
      left: { clan: 'berserkers', required: 3 },
      right: { clan: 'zealots', required: 2 },
    },
  },
  {
    id: 'C-025',
    cardNumber: 'C-025',
    name: 'Nile',
    cardType: 'creature',
    arcanaType: null,
    suit: null,
    targetType: null,
    effectText: null,
    immunity: 'Worship actions cannot be blocked',
    blessing:
      'Block 1 opponent from swapping their creature on their next turn',
    creatureRequirements: {
      left: { clan: 'berserkers', required: 1 },
      right: { clan: 'zealots', required: 4 },
    },
  },
  {
    id: 'C-038',
    cardNumber: 'C-038',
    name: 'Robin',
    cardType: 'creature',
    arcanaType: null,
    suit: null,
    targetType: null,
    effectText: null,
    immunity: 'Totem locks cannot be blocked',
    blessing: 'Shuffle 1 worship card from your totem into your temple',
    creatureRequirements: {
      left: { clan: 'zealots', required: 2 },
      right: { clan: 'berserkers', required: 3 },
    },
  },
];