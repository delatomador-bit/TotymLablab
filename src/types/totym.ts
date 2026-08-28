export type Clan =
  | 'berserkers'
  | 'druids'
  | 'bards'
  | 'zealots'
  | 'mystics';

export type CardType =
  | 'creature'
  | 'worship'
  | 'tarot'
  | 'imposter'
  | 'relic';

export type ArcanaType = 'major' | 'minor' | null;

export type TarotSuit =
  | 'wands'
  | 'cups'
  | 'swords'
  | 'pentacles'
  | null;

export type TargetType =
  | 'self'
  | 'opponent'
  | 'two_opponents'
  | 'any'
  | 'all'
  | null;

export type PlayerMode = '1v1' | '3-player' | '4-player';

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
  suit: TarotSuit;
  targetType: TargetType;
  effectText: string | null;
  immunity: string | null;
  blessing: string | null;
  creatureRequirements: CreatureRequirements | null;
  effectTags: string[];
}

export interface DeckCard {
  cardId: string;
  quantity: number;
}

export interface TotymDeck {
  name: string;
  format: 'traditional';
  cards: DeckCard[];
}

export interface CountSummary {
  total: number;
  creatures: number;
  worship: number;
  tarot: number;
  imposters: number;
  majorArcana: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  counts: CountSummary;
}

export interface FormatWarning {
  cardId: string;
  cardName: string;
  severity: 'warning' | 'info';
  message: string;
}

export interface ClanDemand {
  clan: Clan;
  required: number;
  creatureCount: number;
}

export interface CreatureCoreEntry {
  cardId: string;
  cardNumber: string;
  name: string;
  immunity: string;
  blessing: string;
  left: {
    clan: Clan;
    required: number;
  };
  right: {
    clan: Clan;
    required: number;
  };
  totalRequired: number;
}

export type RequirementProfile = 'incomplete' | 'concentrated' | 'mixed' | 'broad';

export interface CreatureCoreProfile {
  selectedCreatureCount: number;
  isComplete: boolean;
  hasDuplicateCreatures: boolean;
  entries: CreatureCoreEntry[];
  clanDemand: ClanDemand[];
  totalWorshipRequired: number;
  uniqueClanCount: number;
  mostDemandedClans: ClanDemand[];
  leastDemandedClans: ClanDemand[];
  requirementProfile: RequirementProfile;
  summary: string[];
  warnings: string[];
}
