import type {
  Clan,
  CreatureCoreProfile,
  GeneratedWorshipPackage,
  PerfectTotemRequirement,
  WorshipSufficiencyGap,
  WorshipSufficiencyProfile,
} from '../types/totym';

const CLAN_ORDER: Clan[] = [
  'berserkers',
  'druids',
  'bards',
  'zealots',
  'mystics',
];

export function analyzeWorshipSufficiency(
  creatureCore: CreatureCoreProfile,
  worshipPackage: GeneratedWorshipPackage,
): WorshipSufficiencyProfile {
  const emptyMaximums = CLAN_ORDER.map((clan) => ({
    clan,
    required: 0,
  }));

  if (!creatureCore.isComplete || !worshipPackage.isCompleteCreatureCore) {
    return {
      canPerfectlySupportEveryCreature: false,
      maximumRequirementByClan: emptyMaximums,
      gaps: [],
      warnings: [
        'Perfect-totem feasibility is unavailable until 5 distinct Creatures are selected.',
      ],
    };
  }

  const requirements: PerfectTotemRequirement[] = creatureCore.entries.flatMap(
    (entry) => [
      {
        clan: entry.left.clan,
        required: entry.left.required,
        creatureName: entry.name,
        side: 'left' as const,
      },
      {
        clan: entry.right.clan,
        required: entry.right.required,
        creatureName: entry.name,
        side: 'right' as const,
      },
    ],
  );

  const maximumRequirementByClan = CLAN_ORDER.map((clan) => ({
    clan,
    required: requirements
      .filter((requirement) => requirement.clan === clan)
      .reduce(
        (maximum, requirement) => Math.max(maximum, requirement.required),
        0,
      ),
  }));

  const gaps: WorshipSufficiencyGap[] = maximumRequirementByClan.flatMap(
    ({ clan, required }) => {
      if (required === 0) {
        return [];
      }

      const available =
        worshipPackage.allocations.find(
          (allocation) => allocation.clan === clan,
        )?.quantity ?? 0;

      if (available >= required) {
        return [];
      }

      const affectedRequirements = requirements.filter(
        (requirement) =>
          requirement.clan === clan && requirement.required > available,
      );

      return [
        {
          clan,
          available,
          required,
          shortfall: required - available,
          affectedRequirements,
        },
      ];
    },
  );

  const warnings = gaps.map((gap) => {
    const affectedCreatures = gap.affectedRequirements
      .map(
        (requirement) =>
          `${requirement.creatureName} (${requirement.side} needs ${requirement.required})`,
      )
      .join(', ');

    return `Only ${gap.available} ${gap.clan} Worship card${
      gap.available === 1 ? '' : 's'
    } are suggested, but ${gap.required} are needed for a Perfect Totem: ${affectedCreatures}.`;
  });

  return {
    canPerfectlySupportEveryCreature: gaps.length === 0,
    maximumRequirementByClan,
    gaps,
    warnings,
  };
}