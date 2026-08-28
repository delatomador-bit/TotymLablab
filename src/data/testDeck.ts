import type { DeckCard } from '../types/totym';

// A clearly invalid demo deck to demonstrate validation and format warnings.
// Intentionally violates several rules: wrong counts, duplicate creature,
// over-limit copies.
export const TEST_DECK_CARDS: DeckCard[] = [
  // Creatures — 6 (too many) + duplicate Luna
  { cardId: 'C-001', quantity: 1 },
  { cardId: 'C-001', quantity: 1 },
  { cardId: 'C-003', quantity: 1 },
  { cardId: 'C-010', quantity: 1 },
  { cardId: 'C-025', quantity: 1 },
  { cardId: 'C-038', quantity: 1 },
  // Tarot — over-limit copies
  { cardId: 'T-001', quantity: 3 },
  { cardId: 'T-006', quantity: 2 },
  { cardId: 'T-018', quantity: 2 },
  { cardId: 'T-024', quantity: 4 },
  { cardId: 'T-033', quantity: 2 },
  { cardId: 'T-052', quantity: 3 },
  { cardId: 'T-055', quantity: 3 },
  { cardId: 'T-063', quantity: 3 },
  { cardId: 'T-066', quantity: 3 },
  { cardId: 'T-071', quantity: 3 },
  { cardId: 'T-072', quantity: 3 },
  { cardId: 'T-075', quantity: 3 },
  // Worship
  { cardId: 'GEN-WORSHIP', quantity: 18 },
  // Imposters
  { cardId: 'GEN-IMPOSTER', quantity: 4 },
];

export const TEST_DECK_NAME = 'Test Lab Deck (invalid demo)';
