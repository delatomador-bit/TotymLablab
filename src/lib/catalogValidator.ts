import type {
  Clan,
  TarotSuit,
  TargetType,
  TotymCard,
} from '../types/totym';

export interface ImportedCatalogFile {
  schemaVersion: string;
  catalogName: string;
  source: string;
  rulesetId: string;
  generatedAt: string;
  cards: unknown[];
}

export interface CatalogValidationIssue {
  field: string;
  message: string;
}

export interface CatalogCounts {
  total: number;
  creatures: number;
  tarot: number;
  majorArcana: number;
  minorArcana: number;
  wands: number;
  cups: number;
  swords: number;
  pentacles: number;
}

export interface CatalogImportResult {
  valid: boolean;
  cards: TotymCard[] | null;
  issues: CatalogValidationIssue[];
  counts: CatalogCounts;
}

const VALID_CLANS: ReadonlySet<string> = new Set([
  'berserkers',
  'druids',
  'bards',
  'zealots',
  'mystics',
]);

const VALID_SUITS: ReadonlySet<string> = new Set([
  'wands',
  'cups',
  'swords',
  'pentacles',
]);

const VALID_TARGETS: ReadonlySet<string> = new Set([
  'self',
  'opponent',
  'two_opponents',
  'any',
  'all',
]);

const REJECTED_CARD_TYPES: ReadonlySet<string> = new Set([
  'worship',
  'imposter',
  'relic',
]);

const REJECTED_IDS: ReadonlySet<string> = new Set([
  'GEN-WORSHIP',
  'GEN-IMPOSTER',
]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isClan(v: unknown): v is Clan {
  return typeof v === 'string' && VALID_CLANS.has(v);
}

function isSuit(v: unknown): v is TarotSuit {
  return typeof v === 'string' && VALID_SUITS.has(v);
}

function isTarget(v: unknown): v is TargetType {
  return typeof v === 'string' && VALID_TARGETS.has(v);
}

function isNonNegNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

export function validateImportedCatalog(input: unknown): CatalogImportResult {
  const issues: CatalogValidationIssue[] = [];
  const counts: CatalogCounts = {
    total: 0,
    creatures: 0,
    tarot: 0,
    majorArcana: 0,
    minorArcana: 0,
    wands: 0,
    cups: 0,
    swords: 0,
    pentacles: 0,
  };

  if (typeof input !== 'object' || input === null) {
    return {
      valid: false,
      cards: null,
      issues: [{ field: 'root', message: 'Catalog JSON must be a JSON object.' }],
      counts,
    };
  }

  const obj = input as Record<string, unknown>;

  if (obj.schemaVersion !== '1.0') {
    issues.push({
      field: 'schemaVersion',
      message: `schemaVersion must be "1.0" (got ${JSON.stringify(obj.schemaVersion)}).`,
    });
  }

  if (obj.source !== 'Card-Details_Revised.xlsx') {
    issues.push({
      field: 'source',
      message: `source must be "Card-Details_Revised.xlsx" (got ${JSON.stringify(obj.source)}).`,
    });
  }

  if (obj.rulesetId !== 'totym-v2-2026-07-22') {
    issues.push({
      field: 'rulesetId',
      message: `rulesetId must be "totym-v2-2026-07-22" (got ${JSON.stringify(obj.rulesetId)}).`,
    });
  }

  if (!Array.isArray(obj.cards)) {
    issues.push({
      field: 'cards',
      message: 'cards must be an array of card records.',
    });
    return { valid: false, cards: null, issues, counts };
  }

  const rawCards = obj.cards;
  counts.total = rawCards.length;

  const validatedCards: TotymCard[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < rawCards.length; i++) {
    const raw = rawCards[i];
    const prefix = `Card #${i + 1}`;

    if (typeof raw !== 'object' || raw === null) {
      issues.push({ field: `cards[${i}]`, message: `${prefix}: record is not an object.` });
      continue;
    }

    const c = raw as Record<string, unknown>;

    if (REJECTED_IDS.has(String(c.id ?? ''))) {
      issues.push({
        field: `cards[${i}].id`,
        message: `${prefix}: Generic Worship / Generic Imposter placeholders are not allowed in catalog imports.`,
      });
      continue;
    }

    if (typeof c.cardType === 'string' && REJECTED_CARD_TYPES.has(c.cardType)) {
      issues.push({
        field: `cards[${i}].cardType`,
        message: `${prefix}: cardType "${c.cardType}" is not a factual catalog card type. Only "creature" and "tarot" are accepted.`,
      });
      continue;
    }

    if (typeof c.cardType !== 'string' || (c.cardType !== 'creature' && c.cardType !== 'tarot')) {
      issues.push({
        field: `cards[${i}].cardType`,
        message: `${prefix}: cardType must be "creature" or "tarot" (got ${JSON.stringify(c.cardType)}).`,
      });
      continue;
    }

    if (!isNonEmptyString(c.id)) {
      issues.push({ field: `cards[${i}].id`, message: `${prefix}: id must be a non-empty string.` });
      continue;
    }

    if (seenIds.has(c.id)) {
      issues.push({ field: `cards[${i}].id`, message: `${prefix}: duplicate id "${c.id}".` });
      continue;
    }
    seenIds.add(c.id);

    if (!isNonEmptyString(c.name)) {
      issues.push({ field: `cards[${i}].name`, message: `${prefix} (${c.id}): name must be a non-empty string.` });
      continue;
    }

    const cardNumber = isNonEmptyString(c.cardNumber) ? c.cardNumber : c.id;

    if (c.cardType === 'creature') {
      if (!c.id.startsWith('C-')) {
        issues.push({ field: `cards[${i}].id`, message: `${prefix} (${c.id}): Creature id must begin with "C-".` });
      }
      if (!isNonEmptyString(c.immunity)) {
        issues.push({ field: `cards[${i}].immunity`, message: `${prefix} (${c.id}): immunity must be a non-empty string.` });
      }
      if (!isNonEmptyString(c.blessing)) {
        issues.push({ field: `cards[${i}].blessing`, message: `${prefix} (${c.id}): blessing must be a non-empty string.` });
      }

      const req = c.creatureRequirements;
      if (typeof req !== 'object' || req === null) {
        issues.push({
          field: `cards[${i}].creatureRequirements`,
          message: `${prefix} (${c.id}): creatureRequirements must be an object with left and right.`,
        });
      } else {
        const r = req as Record<string, unknown>;
        for (const side of ['left', 'right'] as const) {
          const sideObj = r[side];
          if (typeof sideObj !== 'object' || sideObj === null) {
            issues.push({
              field: `cards[${i}].creatureRequirements.${side}`,
              message: `${prefix} (${c.id}): creatureRequirements.${side} must be an object.`,
            });
            continue;
          }
          const s = sideObj as Record<string, unknown>;
          if (!isClan(s.clan)) {
            issues.push({
              field: `cards[${i}].creatureRequirements.${side}.clan`,
              message: `${prefix} (${c.id}): creatureRequirements.${side}.clan must be one of: berserkers, druids, bards, zealots, mystics.`,
            });
          }
          if (!isNonNegNumber(s.required)) {
            issues.push({
              field: `cards[${i}].creatureRequirements.${side}.required`,
              message: `${prefix} (${c.id}): creatureRequirements.${side}.required must be a non-negative number.`,
            });
          }
        }
      }

      counts.creatures += 1;
    } else if (c.cardType === 'tarot') {
      if (!c.id.startsWith('T-')) {
        issues.push({ field: `cards[${i}].id`, message: `${prefix} (${c.id}): Tarot id must begin with "T-".` });
      }
      if (c.arcanaType !== 'major' && c.arcanaType !== 'minor') {
        issues.push({
          field: `cards[${i}].arcanaType`,
          message: `${prefix} (${c.id}): arcanaType must be "major" or "minor" (got ${JSON.stringify(c.arcanaType)}).`,
        });
        continue;
      }
      if (!isTarget(c.targetType)) {
        issues.push({
          field: `cards[${i}].targetType`,
          message: `${prefix} (${c.id}): targetType must be one of: self, opponent, two_opponents, any, all.`,
        });
      }
      if (!isNonEmptyString(c.effectText)) {
        issues.push({
          field: `cards[${i}].effectText`,
          message: `${prefix} (${c.id}): effectText must be a non-empty string.`,
        });
      }

      if (c.arcanaType === 'major') {
        if (c.suit !== null) {
          issues.push({
            field: `cards[${i}].suit`,
            message: `${prefix} (${c.id}): Major Arcana must have suit null.`,
          });
        }
        counts.majorArcana += 1;
      } else {
        if (!isSuit(c.suit)) {
          issues.push({
            field: `cards[${i}].suit`,
            message: `${prefix} (${c.id}): Minor Arcana suit must be wands, cups, swords, or pentacles.`,
          });
        } else {
          if (c.suit === 'wands') counts.wands += 1;
          if (c.suit === 'cups') counts.cups += 1;
          if (c.suit === 'swords') counts.swords += 1;
          if (c.suit === 'pentacles') counts.pentacles += 1;
        }
        counts.minorArcana += 1;
      }

      counts.tarot += 1;
    }

    const card: TotymCard = {
      id: c.id,
      cardNumber,
      name: c.name,
      cardType: c.cardType,
      arcanaType: c.cardType === 'tarot' ? (c.arcanaType as 'major' | 'minor') : null,
      suit: c.cardType === 'tarot' ? (isSuit(c.suit) ? c.suit : null) : null,
      targetType: c.cardType === 'tarot' ? (isTarget(c.targetType) ? c.targetType : null) : null,
      effectText: c.cardType === 'tarot' && isNonEmptyString(c.effectText) ? c.effectText : null,
      immunity: c.cardType === 'creature' && isNonEmptyString(c.immunity) ? c.immunity : null,
      blessing: c.cardType === 'creature' && isNonEmptyString(c.blessing) ? c.blessing : null,
      creatureRequirements:
        c.cardType === 'creature' && typeof c.creatureRequirements === 'object' && c.creatureRequirements !== null
          ? (c.creatureRequirements as TotymCard['creatureRequirements'])
          : null,
      effectTags: Array.isArray(c.effectTags) ? (c.effectTags as string[]) : [],
    };
    validatedCards.push(card);
  }

  if (counts.total !== 138) {
    issues.push({
      field: 'cards.length',
      message: `Catalog must contain exactly 138 records (got ${counts.total}).`,
    });
  }
  if (counts.creatures !== 60) {
    issues.push({
      field: 'cards.creatures',
      message: `Catalog must contain exactly 60 Creature records (got ${counts.creatures}).`,
    });
  }
  if (counts.tarot !== 78) {
    issues.push({
      field: 'cards.tarot',
      message: `Catalog must contain exactly 78 Tarot records (got ${counts.tarot}).`,
    });
  }
  if (counts.majorArcana !== 22) {
    issues.push({
      field: 'cards.majorArcana',
      message: `Catalog must contain exactly 22 Major Arcana Tarot records (got ${counts.majorArcana}).`,
    });
  }
  if (counts.minorArcana !== 56) {
    issues.push({
      field: 'cards.minorArcana',
      message: `Catalog must contain exactly 56 Minor Arcana Tarot records (got ${counts.minorArcana}).`,
    });
  }
  if (counts.wands !== 14) {
    issues.push({
      field: 'cards.wands',
      message: `Catalog must contain exactly 14 Wands (got ${counts.wands}).`,
    });
  }
  if (counts.cups !== 14) {
    issues.push({
      field: 'cards.cups',
      message: `Catalog must contain exactly 14 Cups (got ${counts.cups}).`,
    });
  }
  if (counts.swords !== 14) {
    issues.push({
      field: 'cards.swords',
      message: `Catalog must contain exactly 14 Swords (got ${counts.swords}).`,
    });
  }
  if (counts.pentacles !== 14) {
    issues.push({
      field: 'cards.pentacles',
      message: `Catalog must contain exactly 14 Pentacles (got ${counts.pentacles}).`,
    });
  }

  return {
    valid: issues.length === 0,
    cards: issues.length === 0 ? validatedCards : null,
    issues,
    counts,
  };
}
