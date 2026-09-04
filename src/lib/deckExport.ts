import type { DeckCard, TotymCard, TotymDeck } from '../types/totym';
import type { CardLookup } from './deckValidator';

export function exportDeckJSON(name: string, cards: DeckCard[]): string {
  const deck: TotymDeck = {
    name,
    format: 'traditional',
    cards,
  };
  return JSON.stringify(deck, null, 2);
}

export interface ImportResult {
  ok: boolean;
  name?: string;
  cards?: DeckCard[];
  error?: string;
}

export function importDeckJSON(
  raw: string,
  cardLookup: CardLookup,
): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid JSON — could not parse input.' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Imported data is not a valid deck object.' };
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.format !== 'traditional') {
    return { ok: false, error: 'Only Traditional Mode decks can be imported.' };
  }

  const name = typeof obj.name === 'string' ? obj.name : 'Imported Deck';
  const cardsRaw = obj.cards;
  if (!Array.isArray(cardsRaw)) {
    return { ok: false, error: 'Deck is missing a cards array.' };
  }

  const cards: DeckCard[] = [];
  for (const entry of cardsRaw) {
    if (typeof entry !== 'object' || entry === null) {
      return { ok: false, error: 'A deck entry is not a valid object.' };
    }
    const e = entry as Record<string, unknown>;
    if (typeof e.cardId !== 'string' || typeof e.quantity !== 'number') {
      return { ok: false, error: 'A deck entry is missing cardId or quantity.' };
    }
    if (!Number.isInteger(e.quantity) || e.quantity < 0) {
      return {
        ok: false,
        error: `Quantity for ${e.cardId} must be a non-negative integer.`,
      };
    }
    if (!cardLookup[e.cardId]) {
      return {
        ok: false,
        error: `Unknown card ID "${e.cardId}" — not in the active catalog.`,
      };
    }
    cards.push({ cardId: e.cardId, quantity: e.quantity });
  }

  return { ok: true, name, cards };
}

export function decklistText(
  name: string,
  cards: DeckCard[],
  cardLookup: CardLookup,
): string {
  const lines: string[] = [`// ${name}`, '// Traditional Mode', ''];
  const order: Record<string, number> = {
    creature: 0,
    tarot: 1,
    worship: 2,
    imposter: 3,
  };
  const rows = cards
    .map((dc) => ({ dc, card: cardLookup[dc.cardId] }))
    .filter((r): r is { dc: DeckCard; card: TotymCard } => !!r.card)
    .sort((a, b) => (order[a.card.cardType] ?? 9) - (order[b.card.cardType] ?? 9));

  let lastType = '';
  for (const { dc, card } of rows) {
    if (card.cardType !== lastType) {
      lines.push(`// ${card.cardType.toUpperCase()}`);
      lastType = card.cardType;
    }
    lines.push(`${dc.quantity}x ${card.name} (${card.id})`);
  }
  return lines.join('\n');
}
