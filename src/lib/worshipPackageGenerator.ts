import type {
  Clan,
  CreatureCoreProfile,
  GeneratedWorshipAllocation,
  GeneratedWorshipPackage,
} from '../types/totym';

const CLAN_ORDER: Clan[] = [
  'berserkers',
  'druids',
  'bards',
  'zealots',
  'mystics',
];

const TOTAL_WORSHIP_CARDS = 20;

/**
 * Builds a transparent 20-card Worship allocation from factual Creature-Core
 * clan demand.
 *
 * Algorithm:
 * 1. Wait for a complete, unique five-Creature core.
 * 2. Give every used clan one base Worship card.
 * 3. Distribute the remaining slots proportionally to aggregate clan demand.
 * 4. Resolve rounding ties in stable clan order.
 *
 * This is an initial deckbuilding heuristic. It is not an official optimal
 * decklist and it cannot guarantee support for every possible Creature order.
 */
export function generateWorshipPackage(
  creatureCore: CreatureCoreProfile,
): GeneratedWorshipPackage {
  const emptyAllocations: GeneratedWorshipAllocation[] = CLAN_ORDER.map(
    (clan) => ({
      clan,
      quantity: 0,
      demand:
        creatureCore.clanDemand.find((entry) => entry.clan === clan)
          ?.required ?? 0,
    }),
  );

  if (!creatureCore.isComplete) {
    return {
      total: 0,
      allocations: emptyAllocations,
      usedClans: [],
      algorithmVersion: 'v1-proportional-demand',
      isCompleteCreatureCore: false,
      explanation: [
        'Suggested Worship Package is unavailable until 5 unique Creatures are selected.',
      ],
      warnings: [
        'Select exactly 5 unique Creatures before generating the 20-card Worship package.',
      ],
    };
  }

  const usedAllocations = emptyAllocations.filter(
    (allocation) => allocation.demand > 0,
  );

  const usedClans = usedAllocations.map((allocation) => allocation.clan);
  const totalDemand = usedAllocations.reduce(
    (sum, allocation) => sum + allocation.demand,
    0,
  );

  if (usedAllocations.length === 0 || totalDemand === 0) {
    return {
      total: 0,
      allocations: emptyAllocations,
      usedClans: [],
      algorithmVersion: 'v1-proportional-demand',
      isCompleteCreatureCore: true,
      explanation: [
        'No positive Worship demand was found in the selected Creature Core.',
      ],
      warnings: [
        'The Creature Core is complete but has no usable Worship requirements.',
      ],
    };
  }

  usedAllocations.forEach((allocation) => {
    allocation.quantity = 1;
  });

  const remainingSlots = TOTAL_WORSHIP_CARDS - usedAllocations.length;

  const shares = usedAllocations.map((allocation) => {
    const exactShare = (remainingSlots * allocation.demand) / totalDemand;
    const baseShare = Math.floor(exactShare);

    allocation.quantity += baseShare;

    return {
      allocation,
      remainder: exactShare - baseShare,
    };
  });

  let cardsAllocated = emptyAllocations.reduce(
    (sum, allocation) => sum + allocation.quantity,
    0,
  );

  let leftoverSlots = TOTAL_WORSHIP_CARDS - cardsAllocated;

  const byLargestRemainder = [...shares].sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }

    return (
      CLAN_ORDER.indexOf(a.allocation.clan) -
      CLAN_ORDER.indexOf(b.allocation.clan)
    );
  });

  let index = 0;

  while (leftoverSlots > 0) {
    byLargestRemainder[index % byLargestRemainder.length].allocation.quantity +=
      1;

    leftoverSlots -= 1;
    index += 1;
  }

  cardsAllocated = emptyAllocations.reduce(
    (sum, allocation) => sum + allocation.quantity,
    0,
  );

  return {
    total: cardsAllocated,
    allocations: emptyAllocations,
    usedClans,
    algorithmVersion: 'v1-proportional-demand',
    isCompleteCreatureCore: true,
    explanation: [
      'This suggested 20-card Worship package is generated from the selected Creature Core’s aggregate clan requirements.',
      'Each used clan receives one base card; remaining slots are distributed proportionally by total clan demand.',
      'This is a starting heuristic. It does not guarantee the cards needed for every possible Creature sequence.',
    ],
    warnings:
      cardsAllocated === TOTAL_WORSHIP_CARDS
        ? []
        : [
            `Generated package contains ${cardsAllocated} Worship cards instead of ${TOTAL_WORSHIP_CARDS}.`,
          ],
  };
}