import type {
  HeuristicAnalysis,
  PlayerMode,
  ScoreBand,
  StrategyScore,
  StrategyScoringWeights,
  TarotPackageProfile,
  TotymCard,
  TotymDeck,
  ValidationResult,
} from '../types/totym';
import { TOTYM_RULESET_V2 } from '../data/totymRuleset';
import { DEFAULT_STRATEGY_SCORING_WEIGHTS, PLAYER_MODE_ADJUSTMENTS } from '../config/strategyScoringWeights';
import { analyzeCreatureCore } from './creatureCoreAnalyzer';
import { analyzeTarotPackage } from './tarotPackageAnalyzer';
import { formatWarningsFor } from './formatRules';
import type { CardLookup } from './deckValidator';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function bandFor(score: number): ScoreBand {
  if (score <= 24) return 'early';
  if (score <= 49) return 'developing';
  if (score <= 74) return 'solid';
  return 'strong';
}

function bandLabel(band: ScoreBand): string {
  switch (band) {
    case 'early': return 'Early';
    case 'developing': return 'Developing';
    case 'solid': return 'Solid';
    case 'strong': return 'Strong';
  }
}

function tagCount(profile: TarotPackageProfile, tag: string): number {
  const entry = profile.effectTagCounts.find((tc) => tc.tag === tag);
  return entry ? entry.count : 0;
}

function targetCount(profile: TarotPackageProfile, target: string): number {
  const entry = profile.targetCounts.find((tc) => tc.target === target);
  return entry ? entry.count : 0;
}

function cappedAdd(perQty: number, qty: number, max: number): number {
  return Math.min(perQty * qty, max);
}

function cappedSub(perQty: number, qty: number, max: number): number {
  return Math.max(perQty * qty, max);
}

function makeScore(
  key: StrategyScore['key'],
  label: string,
  rawScore: number,
  explanation: string,
  contributingFactors: string[],
  cautionFactors: string[],
): StrategyScore {
  const score = Math.round(clamp(rawScore, 0, 100));
  return {
    key,
    label,
    score,
    band: bandFor(score),
    explanation,
    contributingFactors,
    cautionFactors,
  };
}

function makeRiskScore(
  key: StrategyScore['key'],
  label: string,
  rawScore: number,
  explanation: string,
  contributingFactors: string[],
  cautionFactors: string[],
): StrategyScore {
  const score = Math.round(clamp(rawScore, 0, 100));
  return {
    key,
    label,
    score,
    band: bandFor(score),
    explanation,
    contributingFactors,
    cautionFactors,
  };
}

export function scoreHeuristic(
  deck: TotymDeck,
  activeCards: TotymCard[],
  mode: PlayerMode,
  validationResult: ValidationResult,
  cardLookup: CardLookup,
  weights: StrategyScoringWeights = DEFAULT_STRATEGY_SCORING_WEIGHTS,
): HeuristicAnalysis {
  const creatureProfile = analyzeCreatureCore(deck, activeCards);
  const tarotProfile = analyzeTarotPackage(deck, activeCards, mode);
  const fmtWarnings = formatWarningsFor(deck.cards, mode, cardLookup);
  const counts = validationResult.counts;

  const w = weights;
  const aw = w.ascensionConsistency;
  const dw = w.disruptionControl;
  const rw = w.resilienceRecovery;
  const fw = w.formatFit;
  const ew = w.deadCardRisk;

  // ---- A. Ascension Consistency ----
  let ascScore = aw.base;
  const ascContrib: string[] = [];
  const ascCaution: string[] = [];

  if (creatureProfile.isComplete) {
    ascScore += aw.completeCreatureCore;
    ascContrib.push('Complete Creature Core with 5 unique Creatures (Rules v2.0 deck requirement).');
  }
  if (creatureProfile.isComplete && creatureProfile.uniqueClanCount <= 2) {
    ascScore += aw.clanConcentration12;
    ascContrib.push(`Creature Core uses ${creatureProfile.uniqueClanCount} clan(s), concentrating Worship demand.`);
  } else if (creatureProfile.isComplete && creatureProfile.uniqueClanCount === 3) {
    ascScore += aw.clanConcentration3;
    ascContrib.push('Creature Core uses 3 clans, a moderate clan spread.');
  } else if (creatureProfile.isComplete && creatureProfile.uniqueClanCount >= 4) {
    ascScore += aw.clanConcentration45;
    ascContrib.push('Creature Core uses 4+ clans, spreading Worship demand broadly.');
  }

  const lockBlessingCreatures = creatureProfile.entries.filter(
    (e) => e.blessing.toUpperCase().includes('TOTEM LOCK') || e.blessing.toUpperCase().includes('LOCK ACTION'),
  ).length;
  if (lockBlessingCreatures >= 2) {
    ascScore += Math.min(aw.blessingTotemLockPerCreature * lockBlessingCreatures, aw.blessingTotemLockMax);
    ascContrib.push(`${lockBlessingCreatures} Creature(s) with a Blessing that adds a totem lock action (factual card text).`);
  }

  const extraLockQty = tagCount(tarotProfile, 'extra_totem_lock_action');
  if (extraLockQty > 0) {
    const add = cappedAdd(aw.extraTotemLockPerQty, extraLockQty, aw.extraTotemLockMax);
    ascScore += add;
    ascContrib.push(`${extraLockQty} Tarot card(s) tagged extra_totem_lock_action (+${add}, capped at ${aw.extraTotemLockMax}).`);
  }
  const extraWorshipQty = tagCount(tarotProfile, 'extra_worship_action');
  if (extraWorshipQty > 0) {
    const add = cappedAdd(aw.extraWorshipActionPerQty, extraWorshipQty, aw.extraWorshipActionMax);
    ascScore += add;
    ascContrib.push(`${extraWorshipQty} Tarot card(s) tagged extra_worship_action (+${add}, capped at ${aw.extraWorshipActionMax}).`);
  }
  const extraTarotQty = tagCount(tarotProfile, 'extra_tarot_action');
  if (extraTarotQty > 0) {
    const add = cappedAdd(aw.extraTarotActionPerQty, extraTarotQty, aw.extraTarotActionMax);
    ascScore += add;
    ascContrib.push(`${extraTarotQty} Tarot card(s) tagged extra_tarot_action (+${add}, capped at ${aw.extraTarotActionMax}).`);
  }
  const drawQty = tagCount(tarotProfile, 'draw');
  if (drawQty > 0) {
    const add = cappedAdd(aw.drawPerQty, drawQty, aw.drawMax);
    ascScore += add;
    ascContrib.push(`${drawQty} Tarot card(s) tagged draw (+${add}, capped at ${aw.drawMax}).`);
  }
  const redrawQty = tagCount(tarotProfile, 'redraw');
  if (redrawQty > 0) {
    const add = cappedAdd(aw.redrawPerQty, redrawQty, aw.redrawMax);
    ascScore += add;
    ascContrib.push(`${redrawQty} Tarot card(s) tagged redraw (+${add}, capped at ${aw.redrawMax}).`);
  }
  const lookArrangeQty = tagCount(tarotProfile, 'look_arrange');
  if (lookArrangeQty > 0) {
    const add = cappedAdd(aw.lookArrangePerQty, lookArrangeQty, aw.lookArrangeMax);
    ascScore += add;
    ascContrib.push(`${lookArrangeQty} Tarot card(s) tagged look_arrange (+${add}, capped at ${aw.lookArrangeMax}).`);
  }

  const totalWorshipReq = creatureProfile.totalWorshipRequired;
  if (totalWorshipReq <= 25 && totalWorshipReq > 0) {
    ascScore += aw.worshipReq25OrLess;
    ascContrib.push(`Total Creature Worship requirement is ${totalWorshipReq} (25 or lower).`);
  } else if (totalWorshipReq >= 26 && totalWorshipReq <= 30) {
    ascScore += aw.worshipReq26To30;
    ascContrib.push(`Total Creature Worship requirement is ${totalWorshipReq} (26–30 range).`);
  } else if (totalWorshipReq > 30) {
    ascScore += aw.worshipReqOver30;
    ascCaution.push(`Total Creature Worship requirement is ${totalWorshipReq} (above 30).`);
  }

  if (creatureProfile.selectedCreatureCount < 5) {
    ascScore += aw.fewerThan5Creatures;
    ascCaution.push(`Only ${creatureProfile.selectedCreatureCount} of 5 unique Creatures selected (Rules v2.0 requires 5).`);
  }
  if (creatureProfile.hasDuplicateCreatures) {
    ascScore += aw.duplicateCreatures;
    ascCaution.push('Duplicate Creature quantities detected (Rules v2.0 disallows duplicate Creatures).');
  }
  if (creatureProfile.uniqueClanCount > 3) {
    const clansAbove = creatureProfile.uniqueClanCount - 3;
    ascScore += aw.perClanAbove3 * clansAbove;
    ascCaution.push(`${creatureProfile.uniqueClanCount} clans required, ${clansAbove} above 3.`);
  }
  if (creatureProfile.uniqueClanCount === 5) {
    ascScore += aw.fiveClansPenalty;
    ascCaution.push('Creature Core uses all 5 clans, spreading Worship demand widely.');
  }
  if (counts.tarot < 20) {
    ascScore += aw.tarotFewerThan20;
    ascCaution.push(`Tarot count is ${counts.tarot} (below 20).`);
  }
  if (counts.tarot < 10) {
    ascScore += aw.tarotFewerThan10;
    ascCaution.push(`Tarot count is ${counts.tarot} (below 10).`);
  }
  if (counts.worship < 20 && counts.worship > 0) {
    ascScore += aw.worshipFewerThan20;
    ascCaution.push(`Worship count is ${counts.worship} (below 20).`);
  }
  if (counts.worship === 0) {
    ascScore += aw.worshipZero;
    ascCaution.push('Worship count is zero.');
  }
  const unknownIds = deck.cards.filter((dc) => !cardLookup[dc.cardId]);
  if (unknownIds.length > 0) {
    ascScore += aw.unknownCardIds;
    ascCaution.push(`${unknownIds.length} unknown card ID(s) not found in the active catalog.`);
  }

  const ascensionConsistency = makeScore(
    'ascensionConsistency',
    'Ascension Consistency',
    ascScore,
    'Estimates how consistently the deck can progress toward locking and Ascending, based on transparent structural inputs.',
    ascContrib,
    ascCaution,
  );

  // ---- B. Disruption & Control ----
  let disScore = dw.base;
  const disContrib: string[] = [];
  const disCaution: string[] = [];

  const blockTags: [string, string, number, number][] = [
    ['block_draw', 'block_draw', dw.blockDrawPerQty, dw.blockDrawMax],
    ['block_tarot', 'block_tarot', dw.blockTarotPerQty, dw.blockTarotMax],
    ['block_worship', 'block_worship', dw.blockWorshipPerQty, dw.blockWorshipMax],
    ['block_totem_lock', 'block_totem_lock', dw.blockTotemLockPerQty, dw.blockTotemLockMax],
    ['block_imposter', 'block_imposter', dw.blockImposterPerQty, dw.blockImposterMax],
    ['discard', 'discard', dw.discardPerQty, dw.discardMax],
    ['reveal', 'reveal', dw.revealPerQty, dw.revealMax],
    ['collapse_totem', 'collapse_totem', dw.collapseTotemPerQty, dw.collapseTotemMax],
    ['curse', 'curse', dw.cursePerQty, dw.curseMax],
    ['switch_creature', 'switch_creature', dw.switchCreaturePerQty, dw.switchCreatureMax],
    ['skip_turn', 'skip_turn', dw.skipTurnPerQty, dw.skipTurnMax],
    ['skip_turn_draw', 'skip_turn_draw', dw.skipTurnDrawPerQty, dw.skipTurnDrawMax],
  ];
  for (const [tag, label, perQty, max] of blockTags) {
    const qty = tagCount(tarotProfile, tag);
    if (qty > 0) {
      const add = cappedAdd(perQty, qty, max);
      disScore += add;
      disContrib.push(`${qty} Tarot card(s) tagged ${label} (+${add}, capped at ${max}).`);
    }
  }

  // Creature factual capabilities
  let cannotBeBlockedCount = 0;
  let block1OpponentCount = 0;
  let protectedFromDiscardCount = 0;
  let cannotBeRevealedCount = 0;
  let cannotBeForcedToSwitchCount = 0;
  for (const entry of creatureProfile.entries) {
    const imm = entry.immunity.toUpperCase();
    const ble = entry.blessing.toUpperCase();
    if (imm.includes('CANNOT BE BLOCKED')) { cannotBeBlockedCount++; disScore += Math.min(dw.creatureImmunityCannotBeBlockedPer, dw.creatureImmunityCannotBeBlockedMax); }
    if (ble.includes('BLOCK 1 OPPONENT')) { block1OpponentCount++; disScore += Math.min(dw.creatureBlessingBlock1OpponentPer, dw.creatureBlessingBlock1OpponentMax); }
    if (imm.includes('PROTECTED FROM DISCARD') || imm.includes('CANNOT BE DISCARDED')) { protectedFromDiscardCount++; disScore += Math.min(dw.creatureImmunityProtectedFromDiscardPer, dw.creatureImmunityProtectedFromDiscardMax); }
    if (imm.includes('CANNOT BE REVEALED')) { cannotBeRevealedCount++; disScore += Math.min(dw.creatureImmunityCannotBeRevealedPer, dw.creatureImmunityCannotBeRevealedMax); }
    if (imm.includes('CANNOT BE FORCED TO SWITCH')) { cannotBeForcedToSwitchCount++; disScore += Math.min(dw.creatureImmunityCannotBeForcedToSwitchPer, dw.creatureImmunityCannotBeForcedToSwitchMax); }
  }
  if (cannotBeBlockedCount > 0) disContrib.push(`${cannotBeBlockedCount} Creature(s) with immunity "cannot be blocked" (factual card text).`);
  if (block1OpponentCount > 0) disContrib.push(`${block1OpponentCount} Creature(s) with blessing "Block 1 opponent" (factual card text).`);
  if (protectedFromDiscardCount > 0) disContrib.push(`${protectedFromDiscardCount} Creature(s) protected from discard (factual card text).`);
  if (cannotBeRevealedCount > 0) disContrib.push(`${cannotBeRevealedCount} Creature(s) that cannot be revealed (factual card text).`);
  if (cannotBeForcedToSwitchCount > 0) disContrib.push(`${cannotBeForcedToSwitchCount} Creature(s) that cannot be forced to switch (factual card text).`);

  if (counts.tarot < 10) {
    disScore += dw.tarotFewerThan10;
    disCaution.push(`Tarot count is ${counts.tarot} (below 10).`);
  }

  // Format-dead Tarot quantity
  let formatDeadQty = 0;
  for (const entry of tarotProfile.entries) {
    const isDead =
      (mode === '1v1' && entry.targetType === 'two_opponents') ||
      (mode === '1v1' && entry.derivedTags.includes('reverse_turn_order'));
    if (isDead) formatDeadQty += entry.quantity;
  }
  if (formatDeadQty > 0) {
    const sub = cappedSub(dw.perFormatDeadTarotQty, formatDeadQty, dw.formatDeadTarotMax);
    disScore += sub;
    disCaution.push(`${formatDeadQty} Tarot card(s) format-dead in ${mode} (capped at ${dw.formatDeadTarotMax}).`);
  }

  const disruptionControl = makeScore(
    'disruptionControl',
    'Disruption & Control',
    disScore,
    'Describes the density of visible disruption and action-denial tools, not their guaranteed quality.',
    disContrib,
    disCaution,
  );

  // ---- C. Resilience & Recovery ----
  let resScore = rw.base;
  const resContrib: string[] = [];
  const resCaution: string[] = [];

  const resTags: [string, number, number][] = [
    ['draw', rw.drawPerQty, rw.drawMax],
    ['redraw', rw.redrawPerQty, rw.redrawMax],
    ['shuffle', rw.shufflePerQty, rw.shuffleMax],
    ['look_arrange', rw.lookArrangePerQty, rw.lookArrangeMax],
    ['extra_tarot_action', rw.extraTarotActionPerQty, rw.extraTarotActionMax],
    ['extra_worship_action', rw.extraWorshipActionPerQty, rw.extraWorshipActionMax],
    ['extra_totem_lock_action', rw.extraTotemLockPerQty, rw.extraTotemLockMax],
    ['switch_creature', rw.switchCreaturePerQty, rw.switchCreatureMax],
    ['convert_worship', rw.convertWorshipPerQty, rw.convertWorshipMax],
  ];
  for (const [tag, perQty, max] of resTags) {
    const qty = tagCount(tarotProfile, tag);
    if (qty > 0) {
      const add = cappedAdd(perQty, qty, max);
      resScore += add;
      resContrib.push(`${qty} Tarot card(s) tagged ${tag} (+${add}, capped at ${max}).`);
    }
  }

  for (const entry of creatureProfile.entries) {
    const ble = entry.blessing.toUpperCase();
    const imm = entry.immunity.toUpperCase();
    if (ble.includes('REDRAW ENTIRE HAND')) { resScore += rw.blessingRedrawEntireHand; resContrib.push(`${entry.name}: Blessing "Redraw entire hand" (factual card text).`); }
    if (ble.includes('DRAW 3 CARDS FOR YOUR TURN DRAW')) { resScore += rw.blessingDraw3ForTurn; resContrib.push(`${entry.name}: Blessing "Draw 3 cards for your turn draw" (factual card text).`); }
    if (ble.includes('LOOK AT THE TOP')) { resScore += rw.blessingLookAtTop; resContrib.push(`${entry.name}: Blessing "Look at the top" (factual card text).`); }
    if (ble.includes('SHUFFLE 1 WORSHIP CARD')) { resScore += rw.blessingShuffle1Worship; resContrib.push(`${entry.name}: Blessing "Shuffle 1 worship card" (factual card text).`); }
    if (imm.includes('CARDS IN HAND PROTECTED FROM DISCARD')) { resScore += rw.immunityHandProtectedFromDiscard; resContrib.push(`${entry.name}: Immunity "Cards in hand protected from discard" (factual card text).`); }
    if (imm.includes('TAROT IN TOTEM PROTECTED FROM DISCARD')) { resScore += rw.immunityTarotTotemProtectedFromDiscard; resContrib.push(`${entry.name}: Immunity "Tarot in totem protected from discard" (factual card text).`); }
    if (imm.includes('WORSHIP IN TOTEM PROTECTED FROM DISCARD')) { resScore += rw.immunityWorshipTotemProtectedFromDiscard; resContrib.push(`${entry.name}: Immunity "Worship in totem protected from discard" (factual card text).`); }
    if (imm.includes('WORSHIP IN TOTEM CANNOT BE DISCARDED')) { resScore += rw.immunityWorshipTotemCannotBeDiscarded; resContrib.push(`${entry.name}: Immunity "Worship in totem cannot be discarded" (factual card text).`); }
    if (imm.includes('CARD DRAWS CANNOT BE BLOCKED')) { resScore += rw.immunityCardDrawsCannotBeBlocked; resContrib.push(`${entry.name}: Immunity "Card draws cannot be blocked" (factual card text).`); }
    if (imm.includes('TAROT ACTIONS CANNOT BE BLOCKED')) { resScore += rw.immunityTarotActionsCannotBeBlocked; resContrib.push(`${entry.name}: Immunity "Tarot actions cannot be blocked" (factual card text).`); }
    if (imm.includes('WORSHIP ACTIONS CANNOT BE BLOCKED')) { resScore += rw.immunityWorshipActionsCannotBeBlocked; resContrib.push(`${entry.name}: Immunity "Worship actions cannot be blocked" (factual card text).`); }
    if (imm.includes('TOTEM LOCKS CANNOT BE BLOCKED')) { resScore += rw.immunityTotemLocksCannotBeBlocked; resContrib.push(`${entry.name}: Immunity "Totem locks cannot be blocked" (factual card text).`); }
    if (imm.includes('TURN CANNOT BE SKIPPED')) { resScore += rw.immunityTurnCannotBeSkipped; resContrib.push(`${entry.name}: Immunity "Turn cannot be skipped" (factual card text).`); }
    if (imm.includes('CANNOT BE FORCED TO SWITCH')) { resScore += rw.immunityCannotBeForcedToSwitch; resContrib.push(`${entry.name}: Immunity "cannot be forced to switch" (factual card text).`); }
    if (imm.includes('CANNOT BE REVEALED')) { resScore += rw.immunityCannotBeRevealed; resContrib.push(`${entry.name}: Immunity "cannot be revealed" (factual card text).`); }
  }

  if (counts.tarot < 10) {
    resScore += rw.tarotFewerThan10;
    resCaution.push(`Tarot count is ${counts.tarot} (below 10).`);
  }
  const hasBlessing = creatureProfile.entries.some((e) => e.blessing.length > 0);
  if (!hasBlessing && creatureProfile.entries.length > 0) {
    resScore += rw.noBlessingCreature;
    resCaution.push('No selected Creature has a non-empty Blessing.');
  }
  const hasImmunity = creatureProfile.entries.some((e) => e.immunity.length > 0);
  if (!hasImmunity && creatureProfile.entries.length > 0) {
    resScore += rw.noImmunityCreature;
    resCaution.push('No selected Creature has a non-empty Immunity.');
  }

  const resilienceRecovery = makeScore(
    'resilienceRecovery',
    'Resilience & Recovery',
    resScore,
    'Describes visible recovery, protection, and adaptability tools.',
    resContrib,
    resCaution,
  );

  // ---- D. Format Fit ----
  let fmtScore = fw.base;
  const fmtContrib: string[] = [];
  const fmtCaution: string[] = [];

  if (mode === '1v1') {
    const twoOppQty = targetCount(tarotProfile, 'two_opponents');
    if (twoOppQty > 0) {
      const sub = cappedSub(fw.twoOpponents1v1PerQty, twoOppQty, fw.twoOpponents1v1Max);
      fmtScore += sub;
      fmtCaution.push(`${twoOppQty} Tarot card(s) with target "two opponents" in 1v1 (${sub} pts, capped at ${fw.twoOpponents1v1Max}).`);
    }
    const reverseQty = tagCount(tarotProfile, 'reverse_turn_order');
    if (reverseQty > 0) {
      const sub = cappedSub(fw.reverseTurnOrder1v1PerQty, reverseQty, fw.reverseTurnOrder1v1Max);
      fmtScore += sub;
      fmtCaution.push(`${reverseQty} Tarot card(s) with reverse_turn_order in 1v1 (${sub} pts, capped at ${fw.reverseTurnOrder1v1Max}).`);
    }
    const oppQty = targetCount(tarotProfile, 'opponent');
    if (oppQty > 0) {
      const add = cappedAdd(fw.opponent1v1PerQty, oppQty, fw.opponent1v1Max);
      fmtScore += add;
      fmtContrib.push(`${oppQty} Tarot card(s) targeting opponent in 1v1 (+${add}, capped at ${fw.opponent1v1Max}).`);
    }
    const selfQty = targetCount(tarotProfile, 'self');
    if (selfQty > 0) {
      const add = cappedAdd(fw.self1v1PerQty, selfQty, fw.self1v1Max);
      fmtScore += add;
      fmtContrib.push(`${selfQty} Tarot card(s) targeting self in 1v1 (+${add}, capped at ${fw.self1v1Max}).`);
    }
  } else {
    const twoOppQty = targetCount(tarotProfile, 'two_opponents');
    if (twoOppQty > 0) {
      const add = cappedAdd(fw.twoOpponentsMultiPerQty, twoOppQty, fw.twoOpponentsMultiMax);
      fmtScore += add;
      fmtContrib.push(`${twoOppQty} Tarot card(s) targeting two opponents in ${mode} (+${add}, capped at ${fw.twoOpponentsMultiMax}).`);
    }
    const allQty = targetCount(tarotProfile, 'all');
    if (allQty > 0) {
      const add = cappedAdd(fw.allTargetMultiPerQty, allQty, fw.allTargetMultiMax);
      fmtScore += add;
      fmtContrib.push(`${allQty} Tarot card(s) targeting all in ${mode} (+${add}, capped at ${fw.allTargetMultiMax}).`);
    }
    const anyQty = targetCount(tarotProfile, 'any');
    if (anyQty > 0) {
      const add = cappedAdd(fw.anyTargetMultiPerQty, anyQty, fw.anyTargetMultiMax);
      fmtScore += add;
      fmtContrib.push(`${anyQty} Tarot card(s) targeting any in ${mode} (+${add}, capped at ${fw.anyTargetMultiMax}).`);
    }
  }

  const fmtWarnCount = fmtWarnings.length;
  if (fmtWarnCount > 0) {
    const sub = Math.max(fw.perFormatWarning * fmtWarnCount, fw.formatWarningMax);
    fmtScore += sub;
    fmtCaution.push(`${fmtWarnCount} format warning(s) in ${mode} (${sub} pts, capped at ${fw.formatWarningMax}).`);
  }
  if (counts.tarot === 0) {
    fmtScore += fw.noTarot;
    fmtCaution.push('No Tarot cards selected.');
  }
  if (creatureProfile.selectedCreatureCount < 5) {
    fmtScore += fw.fewerThan5Creatures;
    fmtCaution.push(`Only ${creatureProfile.selectedCreatureCount} of 5 Creatures selected.`);
  }
  if (creatureProfile.hasDuplicateCreatures) {
    fmtScore += fw.duplicateCreatures;
    fmtCaution.push('Duplicate Creatures present (Rules v2.0 disallows).');
  }

  const formatFit = makeScore(
    'formatFit',
    'Format Fit',
    fmtScore,
    'Measures whether the selected Tarot package is structurally usable in the selected player mode.',
    fmtContrib,
    fmtCaution,
  );

  // ---- E. Dead-Card Risk ----
  let riskScore = ew.base;
  const riskContrib: string[] = [];
  const riskCaution: string[] = [];

  if (mode === '1v1') {
    const twoOppQty = targetCount(tarotProfile, 'two_opponents');
    if (twoOppQty > 0) {
      const add = Math.min(ew.twoOpponents1v1PerQty * twoOppQty, ew.twoOpponents1v1Max);
      riskScore += add;
      riskContrib.push(`${twoOppQty} Tarot card(s) targeting two opponents in 1v1 (+${add} risk, capped at ${ew.twoOpponents1v1Max}).`);
    }
    const reverseQty = tagCount(tarotProfile, 'reverse_turn_order');
    if (reverseQty > 0) {
      const add = Math.min(ew.reverseTurnOrder1v1PerQty * reverseQty, ew.reverseTurnOrder1v1Max);
      riskScore += add;
      riskContrib.push(`${reverseQty} Tarot card(s) with reverse_turn_order in 1v1 (+${add} risk, capped at ${ew.reverseTurnOrder1v1Max}).`);
    }
  }
  if (creatureProfile.selectedCreatureCount < 5) {
    riskScore += ew.fewerThan5UniqueCreatures;
    riskContrib.push(`Only ${creatureProfile.selectedCreatureCount} of 5 unique Creatures selected (+${ew.fewerThan5UniqueCreatures} risk).`);
  }
  if (creatureProfile.hasDuplicateCreatures) {
    riskScore += ew.duplicateCreatures;
    riskContrib.push(`Duplicate Creatures present (+${ew.duplicateCreatures} risk).`);
  }
  if (counts.worship < 20) {
    riskScore += ew.worshipBelow20;
    riskContrib.push(`Worship count is ${counts.worship} (below 20, +${ew.worshipBelow20} risk).`);
  }
  if (counts.tarot < 30) {
    riskScore += ew.tarotBelow30;
    riskContrib.push(`Tarot count is ${counts.tarot} (below 30, +${ew.tarotBelow30} risk).`);
  }
  if (counts.imposters < 5) {
    riskScore += ew.imposterBelow5;
    riskContrib.push(`Imposter count is ${counts.imposters} (below 5, +${ew.imposterBelow5} risk).`);
  }
  if (unknownIds.length > 0) {
    const add = Math.min(ew.perUnknownCardId * unknownIds.length, ew.unknownCardIdMax);
    riskScore += add;
    riskContrib.push(`${unknownIds.length} unknown card ID(s) (+${add} risk, capped at ${ew.unknownCardIdMax}).`);
  }
  if (counts.total !== 60) {
    riskScore += ew.deckSizeNot60;
    riskContrib.push(`Total deck size is ${counts.total} (not 60, +${ew.deckSizeNot60} risk).`);
  }
  if (creatureProfile.isComplete && creatureProfile.uniqueClanCount === 5) {
    riskScore += ew.fiveClansRisk;
    riskContrib.push('Complete Creature Core uses all 5 clans (+5 risk).');
  }
  const coinFlipQty = tagCount(tarotProfile, 'coin_flip');
  if (counts.tarot > 0 && coinFlipQty / counts.tarot > 0.5) {
    riskScore += ew.coinFlipMajorityRisk;
    riskContrib.push(`More than 50% of Tarot quantity includes coin_flip tag (+${ew.coinFlipMajorityRisk} risk).`);
  }
  const gambleQty = tagCount(tarotProfile, 'gamble');
  if (counts.tarot > 0 && gambleQty / counts.tarot > 0.5) {
    riskScore += ew.gambleMajorityRisk;
    riskContrib.push(`More than 50% of Tarot quantity includes gamble tag (+${ew.gambleMajorityRisk} risk).`);
  }

  const deadCardRisk = makeRiskScore(
    'deadCardRisk',
    'Dead-Card Risk',
    riskScore,
    'Surfaces known structural or rules-based risks. Higher means more identified structural risk.',
    riskContrib,
    riskCaution,
  );

  // ---- F. Overall Lab Score ----
  const modeAdj = PLAYER_MODE_ADJUSTMENTS[mode] ?? {};
  const ow = {
    ascensionConsistency: modeAdj.ascensionConsistency ?? w.overall.ascensionConsistency,
    disruptionControl: modeAdj.disruptionControl ?? w.overall.disruptionControl,
    resilienceRecovery: modeAdj.resilienceRecovery ?? w.overall.resilienceRecovery,
    formatFit: modeAdj.formatFit ?? w.overall.formatFit,
    deadCardRiskPenalty: modeAdj.deadCardRiskPenalty ?? w.overall.deadCardRiskPenalty,
  };

  const overallRaw =
    ascensionConsistency.score * ow.ascensionConsistency +
    disruptionControl.score * ow.disruptionControl +
    resilienceRecovery.score * ow.resilienceRecovery +
    formatFit.score * ow.formatFit -
    deadCardRisk.score * ow.deadCardRiskPenalty;

  const isLegal = validationResult.valid;
  const isProvisional = !isLegal;

  let overallClamped = clamp(overallRaw, 0, 100);
  if (isProvisional) {
    overallClamped = clamp(overallClamped, 0, 49);
  }
  const overallRounded = Math.round(overallClamped);

  const overallContrib: string[] = [
    `Weighted: Ascension ${ascensionConsistency.score}×${ow.ascensionConsistency}, Disruption ${disruptionControl.score}×${ow.disruptionControl}, Resilience ${resilienceRecovery.score}×${ow.resilienceRecovery}, Format ${formatFit.score}×${ow.formatFit}, minus Risk ${deadCardRisk.score}×${ow.deadCardRiskPenalty}.`,
  ];
  const overallCaution: string[] = [];
  if (isProvisional) {
    overallCaution.push('Provisional: illegal decks are capped at 49 until all Traditional Mode requirements are met.');
  }

  const overallLabScore: StrategyScore = {
    key: 'overallLabScore',
    label: 'Overall Lab Score',
    score: overallRounded,
    band: bandFor(overallRounded),
    explanation: 'Transparent weighted combination of the five supporting scores, reduced by Dead-Card Risk. Initial heuristic settings.',
    contributingFactors: overallContrib,
    cautionFactors: overallCaution,
  };

  const tarotTagCounts = tarotProfile.effectTagCounts
    .filter((tc) => tc.count > 0)
    .map((tc) => ({ tag: tc.tag, count: tc.count }));

  const globalNotes: string[] = [
    'Scoring factors are labeled as initial heuristic settings.',
    'Where a factor refers to official game behavior, it is identified as a Rules v2.0 format/legality consideration.',
    'Where a factor refers to card effects, it is based on factual card text.',
  ];

  const disclaimer =
    'TOTYM Lab scores are tunable heuristics based on Rules v2.0, factual card text, and the selected player mode. They are not official ratings, win-rate predictions, or guaranteed outcomes.';

  return {
    rulesetId: TOTYM_RULESET_V2.id,
    selectedMode: mode,
    isLegal,
    isProvisional,
    overallLabScore,
    scores: {
      ascensionConsistency,
      disruptionControl,
      resilienceRecovery,
      formatFit,
      deadCardRisk,
    },
    factualInputs: {
      creatureCount: counts.creatures,
      tarotCount: counts.tarot,
      worshipCount: counts.worship,
      imposterCount: counts.imposters,
      majorArcanaCount: counts.majorArcana,
      uniqueClanCount: creatureProfile.uniqueClanCount,
      totalCreatureWorshipRequired: creatureProfile.totalWorshipRequired,
      formatWarningCount: fmtWarnCount,
      tarotTagCounts,
    },
    globalNotes,
    disclaimer,
  };
}

export { bandLabel };
