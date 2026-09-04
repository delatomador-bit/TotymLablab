import type {
  PlayerMode,
  TarotCardAnalysis,
  TarotEffectTag,
  TarotEffectTagCount,
  TarotPackageProfile,
  TarotSuitCategory,
  TarotSuitCount,
  TarotTargetCategory,
  TarotTargetCount,
  TotymCard,
  TotymDeck,
} from '../types/totym';
import { TOTYM_RULESET_V2 } from '../data/totymRuleset';

const TARGET_CATEGORIES: TarotTargetCategory[] = [
  'self',
  'opponent',
  'two_opponents',
  'any',
  'all',
];

const SUIT_CATEGORIES: TarotSuitCategory[] = [
  'major',
  'wands',
  'cups',
  'swords',
  'pentacles',
];

const TARGET_LABELS: Record<TarotTargetCategory, string> = {
  self: 'Self',
  opponent: 'Opponent',
  two_opponents: 'Two opponents',
  any: 'Any',
  all: 'All',
};

const SUIT_LABELS: Record<TarotSuitCategory, string> = {
  major: 'Major Arcana',
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pentacles',
};

const TAG_LABELS: Record<TarotEffectTag, string> = {
  draw: 'Draw',
  redraw: 'Redraw',
  shuffle: 'Shuffle',
  discard: 'Discard',
  reveal: 'Reveal',
  block_draw: 'Block draw',
  block_tarot: 'Block tarot',
  block_worship: 'Block worship',
  block_totem_lock: 'Block totem lock',
  block_imposter: 'Block imposter',
  switch_creature: 'Switch creature',
  curse: 'Curse',
  convert_worship: 'Convert worship',
  collapse_totem: 'Collapse totem',
  extra_tarot_action: 'Extra tarot action',
  extra_worship_action: 'Extra worship action',
  extra_totem_lock_action: 'Extra totem lock action',
  skip_turn: 'Skip turn',
  skip_turn_draw: 'Skip turn draw',
  look_arrange: 'Look / arrange',
  coin_flip: 'Coin flip',
  gamble: 'Gamble',
  reverse_turn_order: 'Reverse turn order',
  other: 'Other',
};

export const TAROT_TAG_LABELS = TAG_LABELS;

function classifyEffect(text: string): TarotEffectTag[] {
  const upper = text.toUpperCase();
  const tags: TarotEffectTag[] = [];

  if (upper.includes('DRAW')) {
    if (
      upper.includes("SKIP 1 'TURN DRAW'") ||
      upper.includes('SKIP 1 TURN DRAW')
    ) {
      // skip_turn_draw handles this; do not also tag as draw
    } else {
      tags.push('draw');
    }
  }
  if (upper.includes('REDRAW')) tags.push('redraw');
  if (upper.includes('SHUFFLE')) tags.push('shuffle');
  if (upper.includes('DISCARD')) tags.push('discard');
  if (upper.includes('REVEAL')) tags.push('reveal');
  if (upper.includes('BLOCK DRAW')) tags.push('block_draw');
  if (upper.includes('BLOCK TAROT')) tags.push('block_tarot');
  if (upper.includes('BLOCK WORSHIP')) tags.push('block_worship');
  if (upper.includes('BLOCK LOCK TOTEM') || upper.includes('BLOCK TOTEM-LOCK') || upper.includes('BLOCK TOTEM LOCK'))
    tags.push('block_totem_lock');
  if (upper.includes('BLOCK IMPOSTER')) tags.push('block_imposter');
  if (upper.includes('SWITCH CREATURE') || upper.includes('SWAPPING THEIR CREATURE'))
    tags.push('switch_creature');
  if (upper.includes('CURSE')) tags.push('curse');
  if (upper.includes('CONVERT TYPE OF ALL REAL WORSHIP'))
    tags.push('convert_worship');
  if (upper.includes('COLLAPSE A TOTEM')) tags.push('collapse_totem');
  if (upper.includes('ADD 1 TAROT ACTION')) tags.push('extra_tarot_action');
  if (upper.includes('ADD 1 WORSHIP ACTION')) tags.push('extra_worship_action');
  if (upper.includes('ADD 1 TOTEM LOCK ACTION') || upper.includes('ADD 1 TOTEM-LOCK ACTION'))
    tags.push('extra_totem_lock_action');
  if (upper.includes('SKIP NEXT TURN')) tags.push('skip_turn');
  if (upper.includes("SKIP 1 'TURN DRAW'") || upper.includes('SKIP 1 TURN DRAW'))
    tags.push('skip_turn_draw');
  if (upper.includes('LOOK AT TOP') || upper.includes('ARRANGE'))
    tags.push('look_arrange');
  if (upper.includes('FLIP A COIN')) tags.push('coin_flip');
  if (upper.includes('GAMBLE')) tags.push('gamble');
  if (upper.includes('REVERSE TURN ORDER')) tags.push('reverse_turn_order');

  if (tags.length === 0) tags.push('other');

  return tags;
}

function buildFormatNotes(
  card: TotymCard,
  quantity: number,
  mode: PlayerMode,
): string[] {
  const notes: string[] = [];
  const tags = classifyEffect(card.effectText ?? '');

  if (mode === '1v1' && card.targetType === 'two_opponents') {
    notes.push(
      `No valid resolution in 1v1: requires 2 opponents. (${quantity}x ${card.name})`,
    );
  }

  if (mode === '1v1' && tags.includes('reverse_turn_order')) {
    notes.push(
      `No material strategic value in 1v1: reversing turn order does not change turn sequence with two players. (${quantity}x ${card.name})`,
    );
  }

  if (card.targetType === 'all') {
    if (mode === '1v1') {
      notes.push(
        `All includes the active player; this effect also applies to you. (${quantity}x ${card.name})`,
      );
    } else {
      notes.push(
        `All includes the active player and every opponent. (${quantity}x ${card.name})`,
      );
    }
  }

  return notes;
}

export function analyzeTarotPackage(
  deck: TotymDeck,
  activeCards: TotymCard[],
  mode: PlayerMode,
): TarotPackageProfile {
  const cardById: Record<string, TotymCard> = Object.fromEntries(
    activeCards.map((c) => [c.id, c]),
  );

  const entries: TarotCardAnalysis[] = [];
  const formatWarnings: string[] = [];
  const formatNotes: string[] = [];

  for (const dc of deck.cards) {
    const card = cardById[dc.cardId];
    if (!card || card.cardType !== 'tarot') continue;

    const effectText = card.effectText ?? '';
    const derivedTags = classifyEffect(effectText);
    const cardFormatNotes = buildFormatNotes(card, dc.quantity, mode);

    for (const note of cardFormatNotes) {
      if (note.includes('No valid resolution') || note.includes('No material strategic value')) {
        formatWarnings.push(note);
      } else {
        formatNotes.push(note);
      }
    }

    entries.push({
      cardId: card.id,
      cardNumber: card.cardNumber,
      name: card.name,
      quantity: dc.quantity,
      arcanaType: card.arcanaType as 'major' | 'minor',
      suit: card.suit as 'wands' | 'cups' | 'swords' | 'pentacles' | null,
      targetType: (card.targetType ?? 'self') as TarotTargetCategory,
      effectText,
      derivedTags,
      formatNotes: cardFormatNotes,
    });
  }

  const tarotCardCount = entries.reduce((sum, e) => sum + e.quantity, 0);
  const distinctTarotCount = entries.length;
  const majorArcanaCount = entries
    .filter((e) => e.arcanaType === 'major')
    .reduce((sum, e) => sum + e.quantity, 0);
  const minorArcanaCount = entries
    .filter((e) => e.arcanaType === 'minor')
    .reduce((sum, e) => sum + e.quantity, 0);

  const suitCounts: TarotSuitCount[] = SUIT_CATEGORIES.map((suit) => ({
    suit,
    count: 0,
  }));

  const suitIndex: Record<TarotSuitCategory, number> = {
    major: 0,
    wands: 1,
    cups: 2,
    swords: 3,
    pentacles: 4,
  };

  for (const entry of entries) {
    if (entry.arcanaType === 'major') {
      suitCounts[suitIndex.major].count += entry.quantity;
    } else if (entry.suit) {
      suitCounts[suitIndex[entry.suit]].count += entry.quantity;
    }
  }

  const targetCounts: TarotTargetCount[] = TARGET_CATEGORIES.map((target) => ({
    target,
    count: 0,
  }));

  const targetIndex: Record<TarotTargetCategory, number> = {
    self: 0,
    opponent: 1,
    two_opponents: 2,
    any: 3,
    all: 4,
  };

  for (const entry of entries) {
    targetCounts[targetIndex[entry.targetType]].count += entry.quantity;
  }

  const tagCountMap: Record<string, number> = {};
  for (const entry of entries) {
    for (const tag of entry.derivedTags) {
      tagCountMap[tag] = (tagCountMap[tag] ?? 0) + entry.quantity;
    }
  }

  const effectTagCounts: TarotEffectTagCount[] = (
    Object.keys(TAG_LABELS) as TarotEffectTag[]
  )
    .filter((tag) => tagCountMap[tag] !== undefined)
    .map((tag) => ({ tag, count: tagCountMap[tag] }))
    .sort((a, b) => b.count - a.count);

  const factualSummary: string[] = [];
  const analysisNotes: string[] = [];

  if (entries.length === 0) {
    factualSummary.push(
      'No Tarot cards selected. Add Tarot cards to inspect targets, suits, and text-derived effect categories.',
    );
  } else {
    factualSummary.push(
      `Tarot package: ${tarotCardCount} cards across ${distinctTarotCount} distinct Tarot.`,
    );
    factualSummary.push(
      `Arcana mix: ${majorArcanaCount} Major Arcana and ${minorArcanaCount} Minor Arcana.`,
    );

    const maxTarget = Math.max(...targetCounts.map((tc) => tc.count));
    if (maxTarget > 0) {
      const topTargets = targetCounts
        .filter((tc) => tc.count === maxTarget)
        .map((tc) => TARGET_LABELS[tc.target]);
      factualSummary.push(
        `Most common target: ${topTargets.join(', ')} at ${maxTarget} card${maxTarget === 1 ? '' : 's'}.`,
      );
    }

    const maxSuit = Math.max(...suitCounts.map((sc) => sc.count));
    if (maxSuit > 0) {
      const topSuits = suitCounts
        .filter((sc) => sc.count === maxSuit)
        .map((sc) => SUIT_LABELS[sc.suit]);
      factualSummary.push(
        `Most represented suit/category: ${topSuits.join(', ')} at ${maxSuit} card${maxSuit === 1 ? '' : 's'}.`,
      );
    }

    factualSummary.push(
      'Text-derived categories summarize card text and are not power ratings.',
    );
    factualSummary.push(`Selected format: ${mode}.`);
  }

  if (majorArcanaCount > TOTYM_RULESET_V2.legalDeckRules.majorArcanaDeckLimit) {
    analysisNotes.push(
      `Traditional Mode limit exceeded: ${majorArcanaCount} Major Arcana selected; maximum is ${TOTYM_RULESET_V2.legalDeckRules.majorArcanaDeckLimit}.`,
    );
  }

  return {
    tarotCardCount,
    distinctTarotCount,
    majorArcanaCount,
    minorArcanaCount,
    suitCounts,
    targetCounts,
    effectTagCounts,
    entries,
    selectedMode: mode,
    formatWarnings,
    formatNotes,
    factualSummary,
    analysisNotes,
  };
}
