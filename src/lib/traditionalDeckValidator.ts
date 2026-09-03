import type {
  TotymCard,
  TotymDeck,
  TraditionalDeckValidation,
} from '../types/totym';
import { analyzeCreatureCore } from './creatureCoreAnalyzer';
import { generateWorshipPackage } from './worshipPackageGenerator';

const REQUIRED_CREATURE_COUNT = 5;
const REQUIRED_TAROT_COUNT = 30;
const RESERVED_IMPOSTER_COUNT = 5;
const REQUIRED_TRADITIONAL_TOTAL = 60;

export function validateTraditionalDeck(
  deck: TotymDeck,
  cards: TotymCard[],
): TraditionalDeckValidation {
  const creatureCore = analyzeCreatureCore(deck, cards);
  const worshipPackage = generateWorshipPackage(creatureCore);

  const cardById = new Map(cards.map((card) => [card.id, card]));

  const manualTarot = deck.cards.reduce((total, deckCard) => {
    const card = cardById.get(deckCard.cardId);

    return card?.cardType === 'tarot'
      ? total + deckCard.quantity
      : total;
  }, 0);

  const manualCreatures = creatureCore.selectedCreatureCount;
  const distinctCreatures = creatureCore.distinctCreatureCount;

  const generatedWorship = worshipPackage.isCompleteCreatureCore
    ? worshipPackage.total
    : 0;

  const reservedImposters = RESERVED_IMPOSTER_COUNT;

  const computedTotal =
    manualCreatures +
    manualTarot +
    generatedWorship +
    reservedImposters;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (manualCreatures !== REQUIRED_CREATURE_COUNT) {
    const difference = REQUIRED_CREATURE_COUNT - manualCreatures;

    errors.push(
      difference > 0
        ? `Select ${difference} more Creature card${difference === 1 ? '' : 's'} to reach ${REQUIRED_CREATURE_COUNT}.`
        : `Remove ${Math.abs(difference)} Creature card${Math.abs(difference) === 1 ? '' : 's'} to return to ${REQUIRED_CREATURE_COUNT}.`,
    );
  }

  if (distinctCreatures !== REQUIRED_CREATURE_COUNT) {
    errors.push(
      `Traditional Mode requires ${REQUIRED_CREATURE_COUNT} distinct Creature cards; this deck has ${distinctCreatures}.`,
    );
  }

  if (creatureCore.hasDuplicateCreatures) {
    errors.push(
      'Traditional Mode does not allow duplicate Creature quantities.',
    );
  }

  if (manualTarot !== REQUIRED_TAROT_COUNT) {
    const difference = REQUIRED_TAROT_COUNT - manualTarot;

    errors.push(
      difference > 0
        ? `Add ${difference} Tarot card${difference === 1 ? '' : 's'} to reach ${REQUIRED_TAROT_COUNT}.`
        : `Remove ${Math.abs(difference)} Tarot card${Math.abs(difference) === 1 ? '' : 's'} to return to ${REQUIRED_TAROT_COUNT}.`,
    );
  }

  if (!creatureCore.isComplete) {
    warnings.push(
      'The 20-card Worship package will be generated after you select exactly 5 distinct Creature cards.',
    );
  }

  if (
    creatureCore.isComplete &&
    worshipPackage.total !== 20
  ) {
    errors.push(
      `The generated Worship package must contain 20 cards; received ${worshipPackage.total}.`,
    );
  }

  if (computedTotal !== REQUIRED_TRADITIONAL_TOTAL) {
    errors.push(
      `Computed Traditional Mode deck size is ${computedTotal}; it must equal ${REQUIRED_TRADITIONAL_TOTAL}.`,
    );
  }

  if (deck.format !== 'traditional') {
    warnings.push(
      'This validator applies Traditional Mode rules only.',
    );
  }

  const isValid =
    deck.format === 'traditional' &&
    creatureCore.isComplete &&
    manualCreatures === REQUIRED_CREATURE_COUNT &&
    distinctCreatures === REQUIRED_CREATURE_COUNT &&
    !creatureCore.hasDuplicateCreatures &&
    manualTarot === REQUIRED_TAROT_COUNT &&
    generatedWorship === 20 &&
    reservedImposters === RESERVED_IMPOSTER_COUNT &&
    computedTotal === REQUIRED_TRADITIONAL_TOTAL;

  const summary = [
    `Manual shell: ${manualCreatures} Creature cards and ${manualTarot} Tarot cards.`,
    `Automatic package: ${generatedWorship} Worship cards and ${reservedImposters} reserved Imposters.`,
    `Computed Traditional Mode total: ${computedTotal} of ${REQUIRED_TRADITIONAL_TOTAL} cards.`,
  ];

  return {
    isValid,
    creatureCore,
    worshipPackage,
    counts: {
      manualCreatures,
      distinctCreatures,
      manualTarot,
      generatedWorship,
      reservedImposters,
      computedTotal,
    },
    errors,
    warnings,
    summary,
  };
}