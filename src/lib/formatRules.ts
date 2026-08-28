import type { DeckCard, FormatWarning, PlayerMode } from '../types/totym';
import { CARD_BY_ID } from '../data/totymCards';

export function formatWarningsFor(
  cards: DeckCard[],
  mode: PlayerMode,
): FormatWarning[] {
  const warnings: FormatWarning[] = [];

  for (const dc of cards) {
    const card = CARD_BY_ID[dc.cardId];
    if (!card || card.cardType !== 'tarot') continue;

    if (mode === '1v1' && card.targetType === 'two_opponents') {
      warnings.push({
        cardId: card.id,
        cardName: card.name,
        severity: 'warning',
        message: 'No valid resolution in 1v1.',
      });
    }

    if (
      mode === '1v1' &&
      card.effectText &&
      card.effectText.includes('REVERSE turn order')
    ) {
      warnings.push({
        cardId: card.id,
        cardName: card.name,
        severity: 'warning',
        message: 'No material strategic value in 1v1.',
      });
    }

    if (card.targetType === 'all') {
      warnings.push({
        cardId: card.id,
        cardName: card.name,
        severity: 'info',
        message: 'All includes the active player.',
      });
    }
  }

  return warnings;
}
