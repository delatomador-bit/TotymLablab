import type {
  DeckCard,
  PlayerMode,
  TotymCard,
  TotymDeck,
} from '../types/totym';
import type { CardLookup } from './deckValidator';

function isPlayerMode(value: unknown): value is PlayerMode {
  return value === '1v1' || value === '3-player' || value === '4-player';
}

export function exportDeckJSON(
  name: string,
  cards: DeckCard[],
  playerMode: PlayerMode = '1v1',
): string {
  const deck: TotymDeck = {
    id: `export-${Date.now()}`,
    name,
    format: 'traditional',
    playerMode,
    cards,
  };

  return JSON.stringify(deck, null, 2);
}

export interface ImportResult {
  ok: boolean;
  id?: string;
  name?: string;
  playerMode?: PlayerMode;
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
    return {
      ok: false,
      error: 'Only Traditional Mode decks can be imported.',
    };
  }

  const id =
    typeof obj.id === 'string' && obj.id.trim().length > 0
      ? obj.id
      : `import-${Date.now()}`;

  const name =
    typeof obj.name === 'string' && obj.name.trim().length > 0
      ? obj.name
      : 'Imported Deck';

  const playerMode = isPlayerMode(obj.playerMode)
    ? obj.playerMode
    : '1v1';

  const cardsRaw = obj.cards;

  if (!Array.isArray(cardsRaw)) {
    return { ok: false, error: 'Deck is missing a cards array.' };
  }

  const cards: DeckCard[] = [];

  for (const entry of cardsRaw) {
    if (typeof entry !== 'object' || entry === null) {
      return {
        ok: false,
        error: 'A deck entry is not a valid object.',
      };
    }

    const deckEntry = entry as Record<string, unknown>;

    if (
      typeof deckEntry.cardId !== 'string' ||
      typeof deckEntry.quantity !== 'number'
    ) {
      return {
        ok: false,
        error: 'A deck entry is missing cardId or quantity.',
      };
    }

    if (
      !Number.isInteger(deckEntry.quantity) ||
      deckEntry.quantity < 0
    ) {
      return {
        ok: false,
        error: `Quantity for ${deckEntry.cardId} must be a non-negative integer.`,
      };
    }

    if (!cardLookup[deckEntry.cardId]) {
      return {
        ok: false,
        error: `Unknown card ID "${deckEntry.cardId}" — not in the active catalog.`,
      };
    }

    cards.push({
      cardId: deckEntry.cardId,
      quantity: deckEntry.quantity,
    });
  }

  return {
    ok: true,
    id,
    name,
    playerMode,
    cards,
  };
}

export function decklistText(
  name: string,
  cards: DeckCard[],
  cardLookup: CardLookup,
  playerMode?: PlayerMode,
  worshipAllocations?: Array<{ clan: string; quantity: number }>,
  impostersCount?: number,
): string {
  const lines: string[] = [
    `// ${name}`,
    '// Traditional Mode',
  ];

  if (playerMode) {
    lines.push(`// Player Mode: ${playerMode}`);
  }

  lines.push('');

  const order: Record<string, number> = {
    creature: 0,
    tarot: 1,
    relic: 2,
  };

  const rows = cards
    .map((deckCard) => ({
      deckCard,
      card: cardLookup[deckCard.cardId],
    }))
    .filter(
      (
        row,
      ): row is {
        deckCard: DeckCard;
        card: TotymCard;
      } => Boolean(row.card),
    )
    .sort(
      (a, b) =>
        (order[a.card.cardType] ?? 9) -
        (order[b.card.cardType] ?? 9),
    );

  let lastType = '';

  for (const { deckCard, card } of rows) {
    if (card.cardType !== lastType) {
      lines.push(`// ${card.cardType.toUpperCase()}`);
      lastType = card.cardType;
    }

    lines.push(
      `${deckCard.quantity}x ${card.name} (${card.id})`,
    );
  }

  if (worshipAllocations && worshipAllocations.length > 0) {
    lines.push('// WORSHIP');
    for (const alloc of worshipAllocations) {
      lines.push(`${alloc.quantity}x ${alloc.clan} Worship`);
    }
  }

  if (impostersCount && impostersCount > 0) {
    lines.push('// IMPOSTER');
    lines.push(`${impostersCount}x Reserved Imposter`);
  }

  return lines.join('\n');
}