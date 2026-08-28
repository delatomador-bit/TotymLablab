import type {
  Clan,
  ClanDemand,
  CreatureCoreEntry,
  CreatureCoreProfile,
  RequirementProfile,
  TotymCard,
  TotymDeck,
} from '../types/totym';

const CLAN_ORDER: Clan[] = [
  'berserkers',
  'druids',
  'bards',
  'zealots',
  'mystics',
];

const CLAN_LABELS: Record<Clan, string> = {
  berserkers: 'Berserkers',
  druids: 'Druids',
  bards: 'Bards',
  zealots: 'Zealots',
  mystics: 'Mystics',
};

function profileLabel(profile: RequirementProfile): string {
  switch (profile) {
    case 'incomplete':
      return 'Incomplete';
    case 'concentrated':
      return 'Concentrated';
    case 'mixed':
      return 'Mixed';
    case 'broad':
      return 'Broad';
  }
}

export function analyzeCreatureCore(
  deck: TotymDeck,
  activeCards: TotymCard[],
): CreatureCoreProfile {
  const cardById: Record<string, TotymCard> = Object.fromEntries(
    activeCards.map((c) => [c.id, c]),
  );

  const creatureEntries: CreatureCoreEntry[] = [];
  const duplicateIds: string[] = [];
  const missingIds: string[] = [];

  for (const dc of deck.cards) {
    const card = cardById[dc.cardId];
    if (!card) {
      missingIds.push(dc.cardId);
      continue;
    }
    if (card.cardType !== 'creature') continue;
    if (!card.creatureRequirements) continue;

    if (dc.quantity > 1) {
      duplicateIds.push(card.id);
    }

    const left = card.creatureRequirements.left;
    const right = card.creatureRequirements.right;

    creatureEntries.push({
      cardId: card.id,
      cardNumber: card.cardNumber,
      name: card.name,
      immunity: card.immunity ?? '',
      blessing: card.blessing ?? '',
      left: { clan: left.clan, required: left.required },
      right: { clan: right.clan, required: right.required },
      totalRequired: left.required + right.required,
    });
  }

  const distinctIds = new Set(creatureEntries.map((e) => e.cardId));
  const selectedCreatureCount = distinctIds.size;
  const hasDuplicateCreatures = duplicateIds.length > 0;

  const clanDemand: ClanDemand[] = CLAN_ORDER.map((clan) => ({
    clan,
    required: 0,
    creatureCount: 0,
  }));

  const clanIndex: Record<Clan, number> = {
    berserkers: 0,
    druids: 1,
    bards: 2,
    zealots: 3,
    mystics: 4,
  };

  for (const entry of creatureEntries) {
    clanDemand[clanIndex[entry.left.clan]].required += entry.left.required;
    clanDemand[clanIndex[entry.right.clan]].required += entry.right.required;

    const clansForThisCreature = new Set<Clan>([
      entry.left.clan,
      entry.right.clan,
    ]);
    for (const clan of clansForThisCreature) {
      clanDemand[clanIndex[clan]].creatureCount += 1;
    }
  }

  const totalWorshipRequired = clanDemand.reduce(
    (sum, cd) => sum + cd.required,
    0,
  );

  const positiveDemandClans = clanDemand.filter((cd) => cd.required > 0);
  const uniqueClanCount = positiveDemandClans.length;

  const isComplete =
    selectedCreatureCount === 5 && !hasDuplicateCreatures;

  let requirementProfile: RequirementProfile;
  if (selectedCreatureCount < 5 || hasDuplicateCreatures) {
    requirementProfile = 'incomplete';
  } else if (uniqueClanCount <= 2) {
    requirementProfile = 'concentrated';
  } else if (uniqueClanCount === 3) {
    requirementProfile = 'mixed';
  } else {
    requirementProfile = 'broad';
  }

  const maxRequired = clanDemand.reduce(
    (max, cd) => Math.max(max, cd.required),
    0,
  );

  const mostDemandedClans: ClanDemand[] =
    maxRequired > 0
      ? clanDemand.filter((cd) => cd.required === maxRequired)
      : [];

  const minAmongPositive = positiveDemandClans.reduce(
    (min, cd) => Math.min(min, cd.required),
    Infinity,
  );

  let leastDemandedClans: ClanDemand[];
  if (!isComplete && positiveDemandClans.length === 0) {
    leastDemandedClans = clanDemand.filter((cd) => cd.required === 0);
  } else if (isComplete) {
    leastDemandedClans = positiveDemandClans.filter(
      (cd) => cd.required === minAmongPositive,
    );
  } else {
    leastDemandedClans = positiveDemandClans.filter(
      (cd) => cd.required === minAmongPositive,
    );
  }

  const zeroDemandClans = clanDemand.filter((cd) => cd.required === 0);

  const summary: string[] = [];
  const warnings: string[] = [];

  if (creatureEntries.length === 0) {
    summary.push(
      'No Creature cards selected. Add up to five unique Creatures to inspect Worship requirements.',
    );
  } else if (selectedCreatureCount < 5) {
    summary.push(
      `Incomplete Creature Core: ${selectedCreatureCount} of 5 unique Creatures selected.`,
    );
  }

  if (hasDuplicateCreatures) {
    summary.push(
      'Traditional Mode requires five unique Creatures; duplicate Creature quantities are not allowed.',
    );
    warnings.push(
      `Duplicate Creature quantity detected for: ${duplicateIds.join(', ')}.`,
    );
  }

  if (isComplete) {
    summary.push('Complete Creature Core: 5 unique Creatures selected.');
  }

  if (creatureEntries.length > 0) {
    summary.push(
      `Aggregate Worship requirement: ${totalWorshipRequired} total cards across ${uniqueClanCount} clan${uniqueClanCount === 1 ? '' : 's'}.`,
    );

    if (mostDemandedClans.length > 0) {
      const names = mostDemandedClans.map((cd) => CLAN_LABELS[cd.clan]).join(', ');
      summary.push(
        `Highest demand: ${names} at ${maxRequired} required Worship.`,
      );
    }

    if (leastDemandedClans.length > 0) {
      const names = leastDemandedClans
        .map((cd) => CLAN_LABELS[cd.clan])
        .join(', ');
      summary.push(
        `Lowest active demand: ${names} at ${minAmongPositive === Infinity ? 0 : minAmongPositive} required Worship.`,
      );
    }

    if (isComplete && zeroDemandClans.length > 0) {
      const names = zeroDemandClans
        .map((cd) => CLAN_LABELS[cd.clan])
        .join(', ');
      summary.push(`Unused clans: ${names}.`);
    }
  }

  summary.push(
    `Requirement profile: ${profileLabel(requirementProfile)}. This is a neutral distribution descriptor, not a strength rating.`,
  );

  if (selectedCreatureCount < 5 && creatureEntries.length > 0) {
    warnings.push(
      `Incomplete Creature Core: only ${selectedCreatureCount} of 5 unique Creatures selected.`,
    );
  }

  for (const missingId of missingIds) {
    warnings.push(
      `Unknown Creature record in deck: card ID "${missingId}" not found in the active catalog.`,
    );
  }

  return {
    selectedCreatureCount,
    isComplete,
    hasDuplicateCreatures,
    entries: creatureEntries,
    clanDemand,
    totalWorshipRequired,
    uniqueClanCount,
    mostDemandedClans,
    leastDemandedClans,
    requirementProfile,
    summary,
    warnings,
  };
}
