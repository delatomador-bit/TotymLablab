export type Clan =
  | 'berserkers'
  | 'druids'
  | 'bards'
  | 'zealots'
  | 'mystics';

export type CardType =
  | 'creature'
  | 'tarot'
  | 'worship'
  | 'imposter'
  | 'relic';

export type DeckFormat = 'traditional';

export type PlayerMode = '1v1' | '3-player' | '4-player';

export type ArcanaType = 'major' | 'minor' | 'placeholder' | null;

export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles' | null;

export type TargetType =
  | 'self'
  | 'opponent'
  | 'two_opponents'
  | 'any'
  | 'all'
  | null;

export type TarotSuitCategory =
  | 'major'
  | 'wands'
  | 'cups'
  | 'swords'
  | 'pentacles';

export type TarotTargetCategory =
  | 'self'
  | 'opponent'
  | 'two_opponents'
  | 'any'
  | 'all';

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
  suit: TarotSuit | string | null;
  targetType: TargetType | string | null;
  effectText: string | null;
  immunity?: string | null;
  blessing?: string | null;
  creatureRequirements?: CreatureRequirements | null;
  effectTags?: TarotEffectTag[] | string[];
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
  mostDemandedClans: ClanDemand[];
  leastDemandedClans: ClanDemand[];
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

export interface TarotEffectTagCount {
  tag: TarotEffectTag;
  count: number;
}

export interface TarotSuitCount {
  suit: TarotSuitCategory;
  count: number;
}

export interface TarotTargetCount {
  target: TarotTargetCategory;
  count: number;
}

export interface TarotCardAnalysis {
  cardId: string;
  cardNumber: string;
  name: string;
  quantity: number;
  arcanaType: 'major' | 'minor';
  suit: TarotSuitCategory | null;
  targetType: TarotTargetCategory;
  effectText: string;
  derivedTags: TarotEffectTag[];
  formatNotes: string[];
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

export type ScoreBand = 'early' | 'developing' | 'solid' | 'strong';

export interface StrategyScore {
  key:
    | 'ascensionConsistency'
    | 'disruptionControl'
    | 'resilienceRecovery'
    | 'formatFit'
    | 'deadCardRisk'
    | 'overallLabScore';
  label: string;
  score: number;
  band: ScoreBand;
  explanation: string;
  contributingFactors: string[];
  cautionFactors: string[];
}

export interface StrategyScoringWeights {
  ascensionConsistency: Record<string, number>;
  disruptionControl: Record<string, number>;
  resilienceRecovery: Record<string, number>;
  formatFit: Record<string, number>;
  deadCardRisk: Record<string, number>;
  overall: {
    ascensionConsistency: number;
    disruptionControl: number;
    resilienceRecovery: number;
    formatFit: number;
    deadCardRiskPenalty: number;
  };
}

export interface HeuristicAnalysis {
  rulesetId: string;
  selectedMode: PlayerMode;
  isLegal: boolean;
  isProvisional: boolean;
  overallLabScore: StrategyScore;
  scores: {
    ascensionConsistency: StrategyScore;
    disruptionControl: StrategyScore;
    resilienceRecovery: StrategyScore;
    formatFit: StrategyScore;
    deadCardRisk: StrategyScore;
  };
  factualInputs: {
    creatureCount: number;
    tarotCount: number;
    worshipCount: number;
    imposterCount: number;
    majorArcanaCount: number;
    uniqueClanCount: number;
    totalCreatureWorshipRequired: number;
    formatWarningCount: number;
    tarotTagCounts: TarotEffectTagCount[];
  };
  globalNotes: string[];
  disclaimer: string;
}