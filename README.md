# TOTYM Lab

A private, single-user deck-building and deck-analysis workbench for the TOTYM card game. This is a Phase 1 prototype — useful immediately, but deliberately small and stable.

TOTYM Lab is separate from CardWad. It is not a collector binder, marketplace, public deck-sharing site, social product, or AI chatbot.

## What it does

- Build and validate Traditional Mode decks against TOTYM Rules v2.0.
- Browse a verified seed card catalog (17 factual cards).
- Import a full 138-card factual catalog from a local JSON file.
- Analyze deck legality, player-count format warnings, and creature-core clan demand.
- Export and import deck lists as JSON.

## Catalog modes

### Seed catalog mode (default)

The app starts with a small, clearly labeled verified seed catalog of 17 factual cards (5 Creatures, 12 Tarot) plus two deck-count placeholder utilities (Generic Worship and Generic Imposter). The seed data is drawn from Card-Details_Revised.xlsx and verified against the official rules.

The header and library show: **Seed data only · 17 factual cards**.

### Full catalog JSON import mode

You can import the complete 138-card factual catalog from a local JSON file generated from Card-Details_Revised.xlsx. This is a **separate** feature from deck JSON import/export:

- **Deck import/export** is for a user's deck list (small JSON with `cardId`/`quantity` pairs).
- **Catalog import** is for authoritative factual card data (full JSON with the schema below).

Catalog import replaces the seed catalog only for the current browser session. No data is persisted — refreshing the page returns to seed data. The import does not delete or overwrite your current deck cards.

After a successful import, the header and library show: **Full factual catalog · 138 cards · Session only**.

A "Return to Seed Catalog" control is available inside the import dialog to reset to seed cards at any time.

## Catalog JSON schema

The uploaded JSON must have this exact top-level structure:

```json
{
  "schemaVersion": "1.0",
  "catalogName": "TOTYM Revised Card Details",
  "source": "Card-Details_Revised.xlsx",
  "rulesetId": "totym-v2-2026-07-22",
  "generatedAt": "2026-08-27",
  "cards": [
    {
      "id": "T-001",
      "cardNumber": "T-001",
      "name": "The Fool",
      "cardType": "tarot",
      "arcanaType": "major",
      "suit": null,
      "targetType": "opponent",
      "effectText": "FLIP a coin; win: DRAW 3 cards; choice: GAMBLE (infinite)",
      "immunity": null,
      "blessing": null,
      "creatureRequirements": null,
      "effectTags": []
    }
  ]
}
```

`.xlsx` files are not uploaded directly. The JSON is generated from the workbook offline and then imported here.

## Source hierarchy

1. **How-to-Play-Totym-Rules-V2.docx** is the governing official rules source (TOTYM Rules v2.0, effective 2026-07-22). It controls deck legality, turn structure, totems, locking, Imposters, targeting, blocking, immunity, gambling, curses, Ascension, Creature switching, and edge cases.
2. **Card-Details_Revised.xlsx** is the authoritative factual card source. It controls card IDs, names, card type, Tarot targets/effects, Creature Immunities, Creature Blessings, and left/right Worship requirements.
3. **TOTYM_How_to_Play_V2_Tutorial.pdf** and reference images are explanatory and visual companions only. If they conflict with the rules document, the rules document wins.
4. Old binder photos and Card-Details-1.pdf are not used as card-data sources.

## What it does not do yet

- Does not auto-generate decks.
- Does not persist data across browser sessions.
- Does not connect to external APIs, AI, or Supabase.
- Does not support `.xlsx` uploads directly.

## Heuristic Strategy Scoring

The Strategy Profile section in the Analysis panel provides transparent, deterministic heuristic scores based on:

- Current deck composition (Creature, Tarot, Worship, Imposter counts).
- Official TOTYM Rules v2.0 format and legality considerations.
- Factual Creature requirements, Blessings, and Immunities from the active catalog.
- Factual Tarot targets and effect text, classified into text-derived categories.
- Selected player mode (1v1, 3-player, 4-player).

Five supporting scores are computed:

1. **Ascension Consistency** — estimates progress toward locking and Ascending.
2. **Disruption & Control** — density of visible disruption and action-denial tools.
3. **Resilience & Recovery** — visible recovery, protection, and adaptability tools.
4. **Format Fit** — whether the Tarot package is structurally usable in the selected mode.
5. **Dead-Card Risk** — known structural or rules-based risks (higher is worse).

An Overall Lab Score combines these with player-mode-adjusted weights, reduced by Dead-Card Risk. Illegal decks are labeled "Provisional" and capped at 49.

All weights are editable in `src/config/strategyScoringWeights.ts`. Scores are tunable heuristics, not official ratings, win-rate predictions, or guaranteed outcomes.
