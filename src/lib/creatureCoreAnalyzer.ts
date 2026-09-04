import type {
  Clan,
  ClanDemand,
  CreatureCoreEntry,
  CreatureCoreProfile,
  TotymCard,
  TotymDeck,
} from '../types/totym';

const CLANS: Clan[] = [
  'berserkers',
  'druids',
  'bards',
  'zealots',
  'mystics',
];

function createEmptyDemand(): ClanDemand[] {
  return CLANS.map((clan) => ({
    clan,
    required: 0,
    creatureCount: 0,
  }));
}

function getRequirementProfile(
  isComplete: boolean,
  hasDuplicateCreatures: boolean,
  uniqueClanCount: number,
): CreatureCoreProfile['requirementProfile'] {
  if (!isComplete || hasDuplicateCreatures) {
    return 'incomplete';
  }

  if (uniqueClanCount <= 2) {
    return 'concentrated';
  }

  if (uniqueClanCount === 3) {
    return 'mixed';
  }

  return 'broad';
}

/**
 * Analyzes only factual Creature data from the selected deck.
 *
 * It does not evaluate strength, card effects, Tarot, player mode,
 * hidden information, or probability. It only calculates the worship
 * demand implied by selected Creature requirements.
 */
export function analyzeCreatureCore(
  deck: TotymDeck,
  activeCards: TotymCard[],
): CreatureCoreProfile {
  const cardById = new Map(activeCards.map((card) => [card.id, card]));

  const selectedCreatureRows = deck.cards
    .map((deckCard) => ({
      deckCard,
      card: cardById.get(deckCard.cardId),
    }))
    .filter(
      (
        entry,
      ): entry is {
        deckCard: TotymDeck['cards'][number];
        card: TotymCard;
      } => entry.card?.cardType === 'creature',
    );

  const duplicateCreatureIds = selectedCreatureRows
    .filter((entry) => entry.deckCard.quantity > 1)
    .map((entry) => entry.card.id);

  const entries: CreatureCoreEntry[] = selectedCreatureRows
    .filter((entry) => entry.deckCard.quantity > 0)
    .map(({ card }) => {
      const requirements = card.creatureRequirements;

      if (!requirements || !card.immunity || !card.blessing) {
        throw new Error(
          `Creature ${card.id} is missing required factual Creature data.`,
        );
      }

      return {
        cardId: card.id,
        cardNumber: card.cardNumber,
        name: card.name,
        immunity: card.immunity,
        blessing: card.blessing,
        left: requirements.left,
        right: requirements.right,
        totalRequired: requirements.left.required + requirements.right.required,
      };
    });

  const selectedCreatureCount = selectedCreatureRows.reduce(
    (total, entry) => total + entry.deckCard.quantity,
    0,
  );

  const distinctCreatureCount = entries.length;
  const hasDuplicateCreatures = duplicateCreatureIds.length > 0;

  const clanDemand = createEmptyDemand();

  entries.forEach((entry) => {
    const creatureClans = new Set<Clan>([
      entry.left.clan,
      entry.right.clan,
    ]);

    clanDemand.forEach((demand) => {
      if (creatureClans.has(demand.clan)) {
        demand.creatureCount += 1;
      }
    });

    clanDemand.find((demand) => demand.clan === entry.left.clan)!.required +=
      entry.left.required;

    clanDemand.find((demand) => demand.clan === entry.right.clan)!.required +=
      entry.right.required;
  });

  const totalWorshipRequired = clanDemand.reduce(
    (total, demand) => total + demand.required,
    0,
  );

  const uniqueClanCount = clanDemand.filter(
    (demand) => demand.required > 0,
  ).length;

  const isComplete =
    distinctCreatureCount === 5 &&
    selectedCreatureCount === 5 &&
    !hasDuplicateCreatures;

  const requirementProfile = getRequirementProfile(
    isComplete,
    hasDuplicateCreatures,
    uniqueClanCount,
  );

  const summary: string[] = [];
  const warnings: string[] = [];

  if (distinctCreatureCount === 0) {
    summary.push(
      'No Creature cards selected. Add up to five unique Creatures to inspect Worship requirements.',
    );
  } else if (!isComplete) {
    summary.push(
      `Incomplete Creature Core: ${distinctCreatureCount} of 5 unique Creatures selected.`,
    );
  } else {
    summary.push('Complete Creature Core: 5 unique Creatures selected.');
  }

  if (hasDuplicateCreatures) {
    warnings.push(
      'Traditional Mode requires five unique Creatures; duplicate Creature quantities are not allowed.',
    );
  }

  if (distinctCreatureCount > 5) {
    warnings.push(
      'Traditional Mode requires exactly 5 Creature cards; more than 5 distinct Creatures are selected.',
    );
  }

  if (distinctCreatureCount > 0) {
    summary.push(
      `Aggregate Worship requirement: ${totalWorshipRequired} total cards across ${uniqueClanCount} clan(s).`,
    );
  }

  if (uniqueClanCount > 0) {
    const positiveDemand = clanDemand.filter((demand) => demand.required > 0);
    const maxDemand = Math.max(...positiveDemand.map((demand) => demand.required));
    const minDemand = Math.min(...positiveDemand.map((demand) => demand.required));

    const highest = positiveDemand
      .filter((demand) => demand.required === maxDemand)
      .map((demand) => demand.clan)
      .join(', ');

    const lowest = positiveDemand
      .filter((demand) => demand.required === minDemand)
      .map((demand) => demand.clan)
      .join(', ');

    summary.push(
      `Highest demand: ${highest} at ${maxDemand} required Worship.`,
    );

    summary.push(
      `Lowest active demand: ${lowest} at ${minDemand} required Worship.`,
    );

    const unusedClans = clanDemand
      .filter((demand) => demand.required === 0)
      .map((demand) => demand.clan);

    if (unusedClans.length > 0) {
      summary.push(`Unused clans: ${unusedClans.join(', ')}.`);
    }
  }

  summary.push(
    `Requirement profile: ${requirementProfile}. This is a neutral distribution descriptor, not a strength rating.`,
  );

  return {
    selectedCreatureCount,
    distinctCreatureCount,
    isComplete,
    hasDuplicateCreatures,
    entries,
    clanDemand,
    totalWorshipRequired,
    uniqueClanCount,
    requirementProfile,
    summary,
    warnings,
  };
}