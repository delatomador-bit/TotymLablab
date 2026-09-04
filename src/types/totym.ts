export type Clan =
  | 'berserkers'
  | 'druids'
  | 'bards'
  | 'zealots'
  | 'mystics';

export type CardType = 'creature' | 'tarot' | 'worship' | 'imposter';

export type DeckFormat = 'traditional';

export type PlayerMode = '1v1';

export interface WorshipRequirement {
  clan: Clan;
  required: number;
}

export interface CreatureRequirements {
  left: WorshipRequirement;
  right: WorshipRequirement;
}

export interface TotymCard {
  id: string;
  cardNumber: string;
  name: string;
  cardType: CardType;
arcanaType: ArcanaType;
  suit: string | null;
  targetType: string | null;
  effectText: string | null;
  immunity?: string;
  blessing?: string;
  creatureRequirements?: CreatureRequirements;
}

export interface DeckCard {
  cardId: string;
  quantity: number;
}

export interface TotymDeck {
  id: string;
  name: string;
  format: DeckFormat;
  playerMode: PlayerMode;
  cards: DeckCard[];
}

export interface CreatureCoreEntry {
  cardId: string;
  cardNumber: string;
  name: string;
  immunity: string;
  blessing: string;
  left: WorshipRequirement;
  right: WorshipRequirement;
  totalRequired: number;
}

export interface ClanDemand {
  clan: Clan;
  required: number;
  creatureCount: number;
}

export type RequirementProfile =
  | 'incomplete'
  | 'concentrated'
  | 'mixed'
  | 'broad';

export interface CreatureCoreProfile {
  selectedCreatureCount: number;
  distinctCreatureCount: number;
  isComplete: boolean;
  hasDuplicateCreatures: boolean;
  duplicateCreatureIds?: string[];
  entries: CreatureCoreEntry[];
  clanDemand: ClanDemand[];
  totalWorshipRequired: number;
  uniqueClanCount: number;
  requirementProfile: RequirementProfile;
  summary: string[];
  warnings: string[];
}

export interface GeneratedWorshipAllocation {
  clan: Clan;
  quantity: number;
  demand: number;
}

export interface GeneratedWorshipPackage {
  total: number;
  allocations: GeneratedWorshipAllocation[];
  usedClans: Clan[];
  algorithmVersion: 'v1-proportional-demand';
  isCompleteCreatureCore: boolean;
  explanation: string[];
  warnings: string[];
}
export interface TraditionalDeckCounts {
  manualCreatures: number;
  distinctCreatures: number;
  manualTarot: number;
  generatedWorship: number;
  reservedImposters: number;
  computedTotal: number;
}

export interface TraditionalDeckValidation {
  isValid: boolean;
  creatureCore: CreatureCoreProfile;
  worshipPackage: GeneratedWorshipPackage;
  counts: TraditionalDeckCounts;
  errors: string[];
  warnings: string[];
  summary: string[];
}

export interface PerfectTotemRequirement {
  clan: Clan;
  required: number;
  creatureName: string;
  side: 'left' | 'right';
}

export interface WorshipSufficiencyGap {
  clan: Clan;
  available: number;
  required: number;
  shortfall: number;
  affectedRequirements: PerfectTotemRequirement[];
}

export interface WorshipSufficiencyProfile {
  canPerfectlySupportEveryCreature: boolean;
  maximumRequirementByClan: Array<{
    clan: Clan;
    required: number;
  }>;
  gaps: WorshipSufficiencyGap[];
  warnings: string[];
}

export type ArcanaType = 'major' | 'minor' | 'placeholder' | null;

export interface TarotValidationProfile {
  totalTarot: number;
  majorArcanaCount: number;
  minorArcanaCount: number;
  copyLimitViolations: Array<{
    cardId: string;
    cardName: string;
    arcanaType: 'major' | 'minor';
    quantity: number;
    allowedQuantity: number;
  }>;
  hasTooManyMajorArcana: boolean;
  isValid: boolean;
}