import type {
  CountSummary,
  DeckCard,
  TotymCard,
  ValidationResult,
} from '../types/totym';
import { TOTYM_RULESET_V2 } from '../data/totymRuleset';
import { CARD_BY_ID } from '../data/totymCards';

const rules = TOTYM_RULESET_V2.legalDeckRules;

const resolveCard = (dc: DeckCard): TotymCard | undefined => CARD_BY_ID[dc.cardId];

export function summarizeDeck(cards: DeckCard[]): CountSummary {
  const counts: CountSummary = {
    total: 0,
    creatures: 0,
    worship: 0,
    tarot: 0,
    imposters: 0,
    majorArcana: 0,
  };

  for (const dc of cards) {
    const card = resolveCard(dc);
    if (!card) continue;
    counts.total += dc.quantity;
    switch (card.cardType) {
      case 'creature':
        counts.creatures += dc.quantity;
        break;
      case 'worship':
        counts.worship += dc.quantity;
        break;
      case 'tarot':
        counts.tarot += dc.quantity;
        if (card.arcanaType === 'major') counts.majorArcana += dc.quantity;
        break;
      case 'imposter':
        counts.imposters += dc.quantity;
        break;
    }
  }

  return counts;
}

export function validateDeck(cards: DeckCard[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = summarizeDeck(cards);

  if (counts.total !== rules.deckSize) {
    errors.push(
      `Deck must contain exactly ${rules.deckSize} cards (currently ${counts.total}).`,
    );
  }
  if (counts.creatures !== rules.creatureCount) {
    errors.push(
      `Deck must contain exactly ${rules.creatureCount} Creature cards (currently ${counts.creatures}).`,
    );
  }
  if (counts.worship !== rules.worshipCount) {
    errors.push(
      `Deck must contain exactly ${rules.worshipCount} Worship cards (currently ${counts.worship}).`,
    );
  }
  if (counts.tarot !== rules.tarotCount) {
    errors.push(
      `Deck must contain exactly ${rules.tarotCount} Tarot cards (currently ${counts.tarot}).`,
    );
  }
  if (counts.imposters !== rules.imposterCount) {
    errors.push(
      `Deck must contain exactly ${rules.imposterCount} Imposter cards (currently ${counts.imposters}).`,
    );
  }

  const seenCreatures = new Set<string>();
  let duplicateCreatures = 0;
  for (const dc of cards) {
    const card = resolveCard(dc);
    if (!card) continue;
    if (card.cardType === 'creature') {
      if (seenCreatures.has(card.id)) {
        duplicateCreatures += 1;
      }
      seenCreatures.add(card.id);
    }
  }
  if (duplicateCreatures > 0) {
    errors.push(
      `Duplicate Creature IDs are not allowed (${duplicateCreatures} duplicate creature entry/entries).`,
    );
  }

  for (const dc of cards) {
    const card = resolveCard(dc);
    if (!card || card.cardType !== 'tarot') continue;
    if (card.arcanaType === 'minor' && dc.quantity > rules.minorArcanaCopyLimit) {
      errors.push(
        `Minor Arcana "${card.name}" exceeds the ${rules.minorArcanaCopyLimit}-copy limit (currently ${dc.quantity}).`,
      );
    }
    if (card.arcanaType === 'major' && dc.quantity > rules.majorArcanaCopyLimit) {
      errors.push(
        `Major Arcana "${card.name}" exceeds the ${rules.majorArcanaCopyLimit}-copy limit (currently ${dc.quantity}).`,
      );
    }
  }

  if (counts.majorArcana > rules.majorArcanaDeckLimit) {
    errors.push(
      `Major Arcana Tarot cards must not exceed ${rules.majorArcanaDeckLimit} total (currently ${counts.majorArcana}).`,
    );
  }

  if (counts.creatures < rules.creatureCount) {
    warnings.push('Incomplete creature core — fewer than 5 creatures selected.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts,
  };
}
