export const TOTYM_RULESET_V2 = {
  id: 'totym-v2-2026-07-22',
  name: 'TOTYM Rules v2.0',
  version: '2.0',
  effectiveDate: '2026-07-22',
  status: 'active',
  legalDeckRules: {
    deckSize: 60,
    creatureCount: 5,
    worshipCount: 20,
    tarotCount: 30,
    imposterCount: 5,
    uniqueCreatures: true,
    minorArcanaCopyLimit: 3,
    majorArcanaCopyLimit: 2,
    majorArcanaDeckLimit: 15,
  },
} as const;

export const CATALOG_DATA_STATUS = {
  state: 'seed-only',
  source: 'Card-Details_Revised.xlsx',
  message:
    'Prototype is using verified seed data only. Full 138-card factual catalog will be imported in a later data step.',
} as const;
