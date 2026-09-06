/**
 * Governing TOTYM ruleset used by the first TOTYM Lab engine.
 *
 * Source: TOTYM Rules v2.1
 * Updated: 2026-08-30
 *
 * This module deliberately stores only the structured values needed for
 * deck construction and early validation. Detailed scenario resolution,
 * timing rules, and card-specific clarifications will be added later.
 */

export const TOTYM_RULESET_V2_1 = {
  id: 'totym-v2-1-2026-08-30',
  name: 'TOTYM Rules v2.1',
  version: '2.1',
  effectiveDate: '2026-08-30',
  status: 'active' as const,

  sourceDocument: 'TOTYM-Rules-v2.1.md',
  cardDataDocument: 'Card-Details_Revised.xlsx',
  tutorialDocument: 'TOTYM_How_to_Play_V2_Tutorial.pdf',

  traditionalMode: {
    deckSize: 60,

    /**
     * Manual deckbuilding selections in TOTYM Lab.
     */
    creatureCount: 5,
    tarotCount: 30,

    /**
     * Automatically completed deck components.
     */
    worshipCount: 20,
    imposterCount: 5,

    /**
     * Traditional Mode restrictions.
     */
    uniqueCreatures: true,
    minorArcanaCopyLimit: 3,
    majorArcanaCopyLimit: 2,
    majorArcanaDeckLimit: 15,
  },

  engineModel: {
    /**
     * Phase 1 product decision:
     * users select the five unique Creatures and thirty Tarot cards.
     */
    manualCardTypes: ['creature', 'tarot'] as const,

    /**
     * Generated only after a complete valid Creature Core is selected.
     */
    worshipGeneration: 'v1-proportional-demand' as const,

    /**
     * Reserved automatically; Imposters are not manually selected in Phase 1.
     */
    reserveImpostersAutomatically: true,
  },
} as const;

export type TotymRuleset = typeof TOTYM_RULESET_V2_1;

/**
 * Compatibility view for existing analysis modules.
 *
 * The app’s earlier deck analyzer uses `legalDeckRules`; newer ruleset
 * configuration uses `traditionalMode`. Both reference the same v2.1 values.
 */
export const TOTYM_RULESET_V2 = {
  ...TOTYM_RULESET_V2_1,
  legalDeckRules: TOTYM_RULESET_V2_1.traditionalMode,
} as const;