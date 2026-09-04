import type {
  TarotValidationProfile,
  TotymCard,
  TotymDeck,
} from '../types/totym';

const MAX_MAJOR_ARCANA = 15;
const MAX_MAJOR_COPIES = 2;
const MAX_MINOR_COPIES = 3;

type ValidTarotCard = TotymCard & {
  arcanaType: 'major' | 'minor';
};

export function analyzeTarotSelection(
  deck: TotymDeck,
  cards: TotymCard[],
): TarotValidationProfile {
  const cardById = new Map(cards.map((card) => [card.id, card]));

  const selectedTarot: Array<{
    card: ValidTarotCard;
    quantity: number;
  }> = [];

  deck.cards.forEach((deckCard) => {
    const card = cardById.get(deckCard.cardId);

    if (
      card?.cardType === 'tarot' &&
      (card.arcanaType === 'major' || card.arcanaType === 'minor')
    ) {
      selectedTarot.push({
        card: card as ValidTarotCard,
        quantity: deckCard.quantity,
      });
    }
  });

  const totalTarot = selectedTarot.reduce(
    (total, entry) => total + entry.quantity,
    0,
  );

  const majorArcanaCount = selectedTarot
    .filter((entry) => entry.card.arcanaType === 'major')
    .reduce((total, entry) => total + entry.quantity, 0);

  const minorArcanaCount = totalTarot - majorArcanaCount;

  const copyLimitViolations = selectedTarot.flatMap((entry) => {
    const allowedQuantity =
      entry.card.arcanaType === 'major'
        ? MAX_MAJOR_COPIES
        : MAX_MINOR_COPIES;

    if (entry.quantity <= allowedQuantity) {
      return [];
    }

    return [
      {
        cardId: entry.card.id,
        cardName: entry.card.name,
        arcanaType: entry.card.arcanaType,
        quantity: entry.quantity,
        allowedQuantity,
      },
    ];
  });

  const hasTooManyMajorArcana = majorArcanaCount > MAX_MAJOR_ARCANA;

  return {
    totalTarot,
    majorArcanaCount,
    minorArcanaCount,
    copyLimitViolations,
    hasTooManyMajorArcana,
    isValid:
      copyLimitViolations.length === 0 &&
      !hasTooManyMajorArcana,
  };
}