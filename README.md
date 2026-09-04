# TOTYM Lab

A private, local-first deckbuilding and rules-analysis workbench for TOTYM.

## Phase 1

Phase 1 supports Traditional Mode deck analysis.

The user manually selects:

- 5 unique Creatures
- 30 Tarot cards

The engine automatically completes the deck with:

- 20 generated Worship cards, allocated by Creature clan demand
- 5 reserved Imposter cards

A completed Traditional Mode deck therefore has 60 cards.

## Source hierarchy

1. `TOTYM-Rules-v2.1.md` is the governing gameplay source.
2. `Card-Details_Revised.xlsx` is the factual source for Creature and Tarot information.
3. `TOTYM_How_to_Play_V2_Tutorial.pdf` and visual references support learning and explanation.
4. Older rules files, card-detail files, and binder photos are archived references only.

## Development status

- No authentication
- No Supabase
- No external AI
- No cloud persistence
- No public sharing
- Local development port: `5174`

## Planned engine modules

- Traditional Mode deck validator
- Creature Core analyzer
- Suggested Worship package generator
- Tarot Package analyzer
- Player-mode rules for 1v1, 3-player, and 4-player games
- Explainable heuristic scoring
- Scenario-resolution engine