import { supabase } from '../integrations/supabase/client';
import type {
  ArcanaType,
  Clan,
  CreatureRequirements,
  TotymCard,
} from '../types/totym';

type CardRow = {
  id: string;
  card_code: string;
  name: string;
  card_type: string;
  arcana_type: string | null;
  suit: string | null;
  target_type: string | null;
  effect_text: string | null;
  blessing: string | null;
  immunity: string | null;
};

type RequirementRow = {
  creature_card_id: string;
  side: string;
  clan: string;
  required_quantity: number;
};

function isClan(value: string): value is Clan {
  return [
    'berserkers',
    'druids',
    'bards',
    'zealots',
    'mystics',
  ].includes(value);
}

function isArcanaType(value: string | null): value is ArcanaType {
  return value === 'major' || value === 'minor';
}

function mapCreatureRequirements(
  requirements: RequirementRow[],
): CreatureRequirements | undefined {
  const left = requirements.find((requirement) => requirement.side === 'left');
  const right = requirements.find(
    (requirement) => requirement.side === 'right',
  );

  if (!left || !right || !isClan(left.clan) || !isClan(right.clan)) {
    return undefined;
  }

  return {
    left: {
      clan: left.clan,
      required: left.required_quantity,
    },
    right: {
      clan: right.clan,
      required: right.required_quantity,
    },
  };
}

export async function loadCatalog(): Promise<TotymCard[]> {
  const [{ data: cards, error: cardsError }, { data: requirements, error: requirementsError }] =
    await Promise.all([
      supabase
        .from('cards')
        .select(
          'id, card_code, name, card_type, arcana_type, suit, target_type, effect_text, blessing, immunity',
        )
        .eq('is_playable', true)
        .in('card_type', ['creature', 'tarot'])
        .order('card_type')
        .order('card_number'),
      supabase
        .from('creature_requirements')
        .select('creature_card_id, side, clan, required_quantity'),
    ]);

  if (cardsError) {
    throw new Error(`Could not load cards: ${cardsError.message}`);
  }

  if (requirementsError) {
    throw new Error(
      `Could not load Creature requirements: ${requirementsError.message}`,
    );
  }

  const requirementsByCreatureId = new Map<string, RequirementRow[]>();

  for (const requirement of requirements ?? []) {
    const rows = requirementsByCreatureId.get(requirement.creature_card_id) ?? [];
    rows.push(requirement);
    requirementsByCreatureId.set(requirement.creature_card_id, rows);
  }

return (cards ?? []).flatMap<TotymCard>((card: CardRow): TotymCard[] => {
  if (card.card_type !== 'creature' && card.card_type !== 'tarot') {
      return [];
    }

if (card.card_type === 'tarot') {
  if (!isArcanaType(card.arcana_type)) {
    return [];
  }

  return [
    {
      id: card.card_code,
      cardNumber: card.card_code,
      name: card.name,
      cardType: 'tarot',
      arcanaType: card.arcana_type,
      suit: card.suit,
      targetType: card.target_type,
      effectText: card.effect_text,
      immunity: card.immunity ?? undefined,
      blessing: card.blessing ?? undefined,
    } satisfies TotymCard,
  ];
}

const creatureRequirements = mapCreatureRequirements(
  requirementsByCreatureId.get(card.id) ?? [],
);

if (!creatureRequirements) {
  return [];
}

return [
  {
    id: card.card_code,
    cardNumber: card.card_code,
    name: card.name,
    cardType: 'creature',
    arcanaType: null,
    suit: null,
    targetType: null,
    effectText: null,
    immunity: card.immunity ?? undefined,
    blessing: card.blessing ?? undefined,
    creatureRequirements,
  } satisfies TotymCard,
];

});
}