import { useMemo, useState } from 'react';
import './App.css';
import { CREATURE_SEED } from './data/creatureSeed';
import { validateTraditionalDeck } from './lib/traditionalDeckValidator';
import { analyzeWorshipSufficiency } from './lib/worshipSufficiencyAnalyzer';
import type { TotymCard, TotymDeck } from './types/totym';

const TAROT_PLACEHOLDER_ID = 'T-UI-PLACEHOLDER';

function App() {
  const [selectedCreatureIds, setSelectedCreatureIds] = useState<string[]>([]);
  const [tarotCount, setTarotCount] = useState(0);

  const deck = useMemo<TotymDeck>(() => {
    const cards = selectedCreatureIds.map((cardId) => ({
      cardId,
      quantity: 1,
    }));

    if (tarotCount > 0) {
      cards.push({
        cardId: TAROT_PLACEHOLDER_ID,
        quantity: tarotCount,
      });
    }

    return {
      id: 'traditional-deck-builder',
      name: 'Untitled Traditional Deck',
      format: 'traditional',
      playerMode: '1v1',
      cards,
    };
  }, [selectedCreatureIds, tarotCount]);

  const tarotPlaceholder = useMemo<TotymCard>(
    () => ({
      id: TAROT_PLACEHOLDER_ID,
      cardNumber: 'T-UI',
      name: 'Tarot Shell Placeholder',
      cardType: 'tarot',
      arcanaType: 'placeholder',
      suit: null,
      targetType: null,
      effectText:
        'Temporary Tarot counter used until the Tarot catalog is imported.',
    }),
    [],
  );

  const validation = useMemo(
    () => validateTraditionalDeck(deck, [...CREATURE_SEED, tarotPlaceholder]),
    [deck, tarotPlaceholder],
  );

  const worshipSufficiency = useMemo(
    () =>
      analyzeWorshipSufficiency(
        validation.creatureCore,
        validation.worshipPackage,
      ),
    [validation.creatureCore, validation.worshipPackage],
  );

  function toggleCreature(cardId: string) {
    setSelectedCreatureIds((currentIds) => {
      if (currentIds.includes(cardId)) {
        return currentIds.filter((id) => id !== cardId);
      }

      if (currentIds.length >= 5) {
        return currentIds;
      }

      return [...currentIds, cardId];
    });
  }

  function updateTarotCount(change: number) {
    setTarotCount((currentCount) =>
      Math.min(30, Math.max(0, currentCount + change)),
    );
  }

  function resetDeck() {
    setSelectedCreatureIds([]);
    setTarotCount(0);
  }

  function loadVerifiedExample() {
    setSelectedCreatureIds([
      'C-001',
      'C-003',
      'C-010',
      'C-025',
      'C-038',
    ]);
    setTarotCount(30);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">TOTYM Binder</p>
          <h1>Traditional Deck Builder</h1>
          <p className="hero-copy">
            Build the 35-card manual shell. TOTYM Binder calculates the
            20-card Worship package and reserves five Imposters automatically.
          </p>
        </div>

        <div
          className={`status-pill ${
            validation.isValid ? 'status-valid' : 'status-pending'
          }`}
        >
          <span className="status-dot" />
          {validation.isValid ? 'Traditional deck valid' : 'Deck in progress'}
        </div>
      </header>

      <section className="rule-banner">
        <strong>Traditional Mode:</strong> Choose 5 distinct Creatures and 30
        Tarot cards. The app then adds 20 generated Worship cards and 5
        reserved Imposters for a 60-card deck.
      </section>

      <section className="summary-grid" aria-label="Deck summary">
        <article className="summary-card">
          <span>Creatures</span>
          <strong>
            {validation.counts.manualCreatures}
            <small>/ 5</small>
          </strong>
          <p>{validation.counts.distinctCreatures} distinct selected</p>
        </article>

        <article className="summary-card">
          <span>Tarot</span>
          <strong>
            {validation.counts.manualTarot}
            <small>/ 30</small>
          </strong>
          <p>Manual card shell</p>
        </article>

        <article className="summary-card summary-card-auto">
          <span>Generated Worship</span>
          <strong>
            {validation.counts.generatedWorship}
            <small>/ 20</small>
          </strong>
          <p>Automatic package</p>
        </article>

        <article className="summary-card summary-card-auto">
          <span>Reserved Imposters</span>
          <strong>
            {validation.counts.reservedImposters}
            <small>/ 5</small>
          </strong>
          <p>Automatic component</p>
        </article>

        <article
          className={`summary-card summary-card-total ${
            validation.isValid ? 'summary-valid' : ''
          }`}
        >
          <span>Computed Deck</span>
          <strong>
            {validation.counts.computedTotal}
            <small>/ 60</small>
          </strong>
          <p>
            {validation.isValid
              ? 'Ready for Traditional Mode'
              : 'Complete the manual shell'}
          </p>
        </article>
      </section>

      <section className="builder-grid">
        <div className="builder-column">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Step 1</p>
                <h2>Creature Core</h2>
                <p>Select exactly five different Creatures.</p>
              </div>

              <span className="count-badge">
                {selectedCreatureIds.length} / 5
              </span>
            </div>

            <div className="creature-list">
              {CREATURE_SEED.map((card) => {
                const isSelected = selectedCreatureIds.includes(card.id);
                const selectionLimitReached =
                  selectedCreatureIds.length >= 5 && !isSelected;

                return (
                  <article
                    className={`creature-card ${
                      isSelected ? 'creature-selected' : ''
                    }`}
                    key={card.id}
                  >
                    <div className="creature-card-top">
                      <div>
                        <p className="card-number">{card.cardNumber}</p>
                        <h3>{card.name}</h3>
                      </div>

                      <button
                        className={isSelected ? 'button-remove' : 'button-add'}
                        disabled={selectionLimitReached}
                        onClick={() => toggleCreature(card.id)}
                        type="button"
                      >
                        {isSelected ? 'Remove' : 'Select'}
                      </button>
                    </div>

                    <div className="requirement-row">
                      <span>
                        {card.creatureRequirements?.left.required}{' '}
                        {card.creatureRequirements?.left.clan}
                      </span>
                      <span>+</span>
                      <span>
                        {card.creatureRequirements?.right.required}{' '}
                        {card.creatureRequirements?.right.clan}
                      </span>
                    </div>

                    <p className="card-text">
                      <strong>Immunity:</strong> {card.immunity}
                    </p>

                    <p className="card-text">
                      <strong>Blessing:</strong> {card.blessing}
                    </p>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="panel tarot-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Step 2</p>
                <h2>Tarot Shell</h2>
                <p>
                  Set the number of manual Tarot cards. Individual Tarot card
                  selection will come with the full Tarot catalog import.
                </p>
              </div>

              <span className="count-badge">{tarotCount} / 30</span>
            </div>

            <div className="tarot-control">
              <button
                aria-label="Remove one Tarot card"
                className="quantity-button"
                disabled={tarotCount === 0}
                onClick={() => updateTarotCount(-1)}
                type="button"
              >
                −
              </button>

              <div>
                <strong>{tarotCount}</strong>
                <span>Tarot cards selected</span>
              </div>

              <button
                aria-label="Add one Tarot card"
                className="quantity-button"
                disabled={tarotCount === 30}
                onClick={() => updateTarotCount(1)}
                type="button"
              >
                +
              </button>
            </div>
          </article>
        </div>

        <aside className="builder-column side-column">
          <article className="panel automatic-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Automatic</p>
                <h2>Worship Package</h2>
                <p>
                  Derived from the aggregate requirements of your Creature
                  Core.
                </p>
              </div>

              <span className="count-badge">
                {validation.counts.generatedWorship} / 20
              </span>
            </div>

            <div className="worship-list">
              {validation.worshipPackage.allocations.map((allocation) => (
                <div className="worship-row" key={allocation.clan}>
                  <span className="clan-name">{allocation.clan}</span>
                  <span className="clan-demand">
                    Demand: {allocation.demand}
                  </span>
                  <strong>{allocation.quantity}</strong>
                </div>
              ))}
            </div>

            <p className="automatic-note">
              {validation.worshipPackage.isCompleteCreatureCore
                ? 'This is a suggested proportional allocation. It is not automatically guaranteed to support a Perfect Totem for every selected Creature.'
                : 'Finish the five-Creature core to generate this package.'}
            </p>

            {worshipSufficiency.gaps.length > 0 && (
              <div className="message-group message-errors worship-gap-warning">
                <h3>Perfect Totem coverage gap</h3>
                {worshipSufficiency.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}

            {validation.worshipPackage.isCompleteCreatureCore &&
              worshipSufficiency.canPerfectlySupportEveryCreature && (
                <div className="message-group message-success">
                  <h3>Perfect Totem coverage</h3>
                  <p>
                    This Worship package contains at least the highest
                    single-Creature requirement for every clan used by the
                    Creature Core.
                  </p>
                </div>
              )}
          </article>

          <article className="panel imposter-panel">
            <p className="panel-kicker">Automatic</p>
            <h2>Reserved Imposters</h2>

            <div className="imposter-count">
              <strong>5</strong>
              <span>
                Reserved for the completed Traditional Mode deck. These are
                not manually selected.
              </span>
            </div>
          </article>

          <article
            className={`panel validation-panel ${
              validation.isValid ? 'validation-valid' : ''
            }`}
          >
            <p className="panel-kicker">Validation</p>
            <h2>{validation.isValid ? 'Deck is ready' : 'Finish your deck'}</h2>

            <div className="validation-summary">
              {validation.summary.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

            {validation.errors.length > 0 && (
              <div className="message-group message-errors">
                <h3>Required fixes</h3>
                {validation.errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="message-group message-warnings">
                <h3>Notes</h3>
                {validation.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}
          </article>
        </aside>
      </section>

      <footer className="actions">
        <button className="button-secondary" onClick={resetDeck} type="button">
          Reset deck
        </button>

        <button
          className="button-primary"
          onClick={loadVerifiedExample}
          type="button"
        >
          Load verified example
        </button>
      </footer>
    </main>
  );
}

export default App;