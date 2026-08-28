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

export type TarotEffectTag =
  | 'draw'
  | 'redraw'
  | 'shuffle'
  | 'discard'
  | 'reveal'
  | 'block_draw'
  | 'block_tarot'
  | 'block_worship'
  | 'block_totem_lock'
  | 'block_imposter'
  | 'switch_creature'
  | 'curse'
  | 'convert_worship'
  | 'collapse_totem'
  | 'extra_tarot_action'
  | 'extra_worship_action'
  | 'extra_totem_lock_action'
  | 'skip_turn'
  | 'skip_turn_draw'
  | 'look_arrange'
  | 'coin_flip'
  | 'gamble'
  | 'reverse_turn_order'
  | 'other';

export type TarotTargetCategory = 'self' | 'opponent' | 'two_opponents' | 'any' | 'all';

export interface TarotTargetCount {
  target: TarotTargetCategory;
  count: number;
}

export type TarotSuitCategory = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export interface TarotSuitCount {
  suit: TarotSuitCategory;
  count: number;
}

export interface TarotCardAnalysis {
  cardId: string;
  cardNumber: string;
  name: string;
  quantity: number;
  arcanaType: 'major' | 'minor';
  suit: 'wands' | 'cups' | 'swords' | 'pentacles' | null;
  targetType: TarotTargetCategory;
  effectText: string;
  derivedTags: TarotEffectTag[];
  formatNotes: string[];
}

export interface TarotEffectTagCount {
  tag: TarotEffectTag;
  count: number;
}

export interface TarotPackageProfile {
  tarotCardCount: number;
  distinctTarotCount: number;
  majorArcanaCount: number;
  minorArcanaCount: number;
  suitCounts: TarotSuitCount[];
  targetCounts: TarotTargetCount[];
  effectTagCounts: TarotEffectTagCount[];
  entries: TarotCardAnalysis[];
  selectedMode: PlayerMode;
  formatWarnings: string[];
  formatNotes: string[];
  factualSummary: string[];
  analysisNotes: string[];
}
