import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { loadCatalog } from './lib/catalog';
import { validateTraditionalDeck } from './lib/traditionalDeckValidator';
import { analyzeTarotSelection } from './lib/tarotValidator';
import { analyzeWorshipSufficiency } from './lib/worshipSufficiencyAnalyzer';
import type { TotymCard, TotymDeck } from './types/totym';

type TarotFilter = 'all' | 'major' | 'minor';

const VERIFIED_CREATURE_IDS = [
  'C-001',
  'C-003',
  'C-010',
  'C-025',
  'C-038',
];

function App() {
  const [allCards, setAllCards] = useState<TotymCard[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogLoadVersion, setCatalogLoadVersion] = useState(0);

  const [selectedCreatureIds, setSelectedCreatureIds] = useState<string[]>([]);
  const [tarotQuantities, setTarotQuantities] = useState<Record<string, number>>(
    {},
  );
  const [tarotFilter, setTarotFilter] = useState<TarotFilter>('all');
  const [tarotSearch, setTarotSearch] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadRemoteCatalog() {
      setIsCatalogLoading(true);
      setCatalogError(null);

      try {
        const cards = await loadCatalog();

        if (!isCurrent) {
          return;
        }

        setAllCards(cards);
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setAllCards([]);
        setCatalogError(
          error instanceof Error
            ? error.message
            : 'Could not load the TOTYM catalog.',
        );
      } finally {
        if (isCurrent) {
          setIsCatalogLoading(false);
        }
      }
    }

    void loadRemoteCatalog();

    return () => {
      isCurrent = false;
    };
  }, [catalogLoadVersion]);

  const creatureCards = useMemo(
    () => allCards.filter((card) => card.cardType === 'creature'),
    [allCards],
  );

  const tarotCards = useMemo(
    () => allCards.filter((card) => card.cardType === 'tarot'),
    [allCards],
  );

  const deck = useMemo<TotymDeck>(() => {
    const creatureCardsInDeck = selectedCreatureIds.map((cardId) => ({
      cardId,
      quantity: 1,
    }));

    const tarotCardsInDeck = Object.entries(tarotQuantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([cardId, quantity]) => ({
        cardId,
        quantity,
      }));

    return {
      id: 'traditional-deck-builder',
      name: 'Untitled Traditional Deck',
      format: 'traditional',
      playerMode: '1v1',
      cards: [...creatureCardsInDeck, ...tarotCardsInDeck],
    };
  }, [selectedCreatureIds, tarotQuantities]);

  const validation = useMemo(
    () => validateTraditionalDeck(deck, allCards),
    [deck, allCards],
  );

  const tarotValidation = useMemo(
    () => analyzeTarotSelection(deck, allCards),
    [deck, allCards],
  );

  const worshipSufficiency = useMemo(
    () =>
      analyzeWorshipSufficiency(
        validation.creatureCore,
        validation.worshipPackage,
      ),
    [validation.creatureCore, validation.worshipPackage],
  );

  const filteredTarot = useMemo(() => {
    const normalizedSearch = tarotSearch.trim().toLowerCase();

    return tarotCards.filter((card) => {
      const filterMatches =
        tarotFilter === 'all' || card.arcanaType === tarotFilter;

      const searchMatches =
        normalizedSearch.length === 0 ||
        card.name.toLowerCase().includes(normalizedSearch) ||
        card.cardNumber.toLowerCase().includes(normalizedSearch) ||
        card.suit?.toLowerCase().includes(normalizedSearch);

      return filterMatches && searchMatches;
    });
  }, [tarotCards, tarotFilter, tarotSearch]);

  const selectedTarot = useMemo(
    () =>
      tarotCards.filter((card) => (tarotQuantities[card.id] ?? 0) > 0),
    [tarotCards, tarotQuantities],
  );

  const isCatalogUnavailable = isCatalogLoading || Boolean(catalogError);

  function toggleCreature(cardId: string) {
    if (isCatalogUnavailable) {
      return;
    }

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

  function updateTarotQuantity(card: TotymCard, change: number) {
    if (isCatalogUnavailable) {
      return;
    }

    setTarotQuantities((currentQuantities) => {
      const currentQuantity = currentQuantities[card.id] ?? 0;
      const totalTarot = Object.values(currentQuantities).reduce(
        (total, quantity) => total + quantity,
        0,
      );

      const maximumCopies = card.arcanaType === 'major' ? 2 : 3;
      const maximumMajorCards =
        card.arcanaType === 'major' ? 15 : Number.POSITIVE_INFINITY;

      const currentMajorCards = tarotCards
        .filter((tarot) => tarot.arcanaType === 'major')
        .reduce(
          (total, tarot) => total + (currentQuantities[tarot.id] ?? 0),
          0,
        );

      if (change > 0) {
        if (totalTarot >= 30) {
          return currentQuantities;
        }

        if (currentQuantity >= maximumCopies) {
          return currentQuantities;
        }

        if (
          card.arcanaType === 'major' &&
          currentMajorCards >= maximumMajorCards
        ) {
          return currentQuantities;
        }
      }

      const nextQuantity = Math.max(
        0,
        Math.min(maximumCopies, currentQuantity + change),
      );

      const nextQuantities = { ...currentQuantities };

      if (nextQuantity === 0) {
        delete nextQuantities[card.id];
      } else {
        nextQuantities[card.id] = nextQuantity;
      }

      return nextQuantities;
    });
  }

  function resetDeck() {
    setSelectedCreatureIds([]);
    setTarotQuantities({});
    setTarotFilter('all');
    setTarotSearch('');
  }

  function loadVerifiedExample() {
    if (isCatalogUnavailable) {
      return;
    }

    const availableCreatureIds = new Set(
      creatureCards.map((card) => card.id),
    );

    const availableTarotIds = new Set(tarotCards.map((card) => card.id));

    setSelectedCreatureIds(
      VERIFIED_CREATURE_IDS.filter((cardId) =>
        availableCreatureIds.has(cardId),
      ),
    );

    const starterQuantities: Record<string, number> = {
      'T-001': 2,
      'T-002': 2,
      'T-003': 2,
      'T-004': 2,
      'T-023': 3,
      'T-024': 3,
      'T-037': 3,
      'T-050': 3,
      'T-063': 3,
    };

    const verifiedQuantities = Object.fromEntries(
      Object.entries(starterQuantities).filter(([cardId]) =>
        availableTarotIds.has(cardId),
      ),
    );

    setTarotQuantities(verifiedQuantities);
  }

  function copyLimitFor(card: TotymCard) {
    return card.arcanaType === 'major' ? 2 : 3;
  }

  function retryCatalogLoad() {
    setCatalogLoadVersion((version) => version + 1);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">TOTYM Lab</p>
          <h1>Traditional Deck Builder</h1>
          <p className="hero-copy">
            Choose 5 distinct Creatures and 30 Tarot cards. The app
            automatically calculates the Worship package and reserves five
            Imposters.
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

      {isCatalogLoading && (
        <section className="rule-banner" aria-live="polite">
          Loading the live TOTYM catalog…
        </section>
      )}

      {catalogError && (
        <section className="rule-banner" aria-live="assertive">
          <strong>Catalog unavailable:</strong> {catalogError}{' '}
          <button
            className="button-secondary"
            onClick={retryCatalogLoad}
            type="button"
          >
            Retry
          </button>
        </section>
      )}

      {!isCatalogLoading && !catalogError && allCards.length === 0 && (
        <section className="rule-banner" aria-live="assertive">
          <strong>Catalog unavailable:</strong> No playable Creature or Tarot
          cards were returned from the database.{' '}
          <button
            className="button-secondary"
            onClick={retryCatalogLoad}
            type="button"
          >
            Retry
          </button>
        </section>
      )}

      <section className="rule-banner">
        <strong>Traditional Mode:</strong> 5 unique Creatures, 30 Tarot, 20
        Worship, and 5 Imposters. Major Arcana are limited to 2 copies each
        and 15 total; Minor Arcana are limited to 3 copies each.
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
            {tarotValidation.totalTarot}
            <small>/ 30</small>
          </strong>
          <p>
            {tarotValidation.majorArcanaCount} Major ·{' '}
            {tarotValidation.minorArcanaCount} Minor
          </p>
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
              {creatureCards.map((card) => {
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
                        disabled={selectionLimitReached || isCatalogUnavailable}
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

            {!isCatalogLoading && !catalogError && creatureCards.length === 0 && (
              <p className="empty-state">
                No playable Creature cards are available from the catalog.
              </p>
            )}
          </article>

          <article className="panel tarot-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Step 2</p>
                <h2>Tarot Shell</h2>
                <p>Select up to 30 Tarot cards from the live TOTYM catalog.</p>
              </div>

              <span className="count-badge">
                {tarotValidation.totalTarot} / 30
              </span>
            </div>

            <div className="tarot-stat-row">
              <span>
                Major Arcana:{' '}
                <strong>{tarotValidation.majorArcanaCount} / 15</strong>
              </span>
              <span>
                Minor Arcana: <strong>{tarotValidation.minorArcanaCount}</strong>
              </span>
            </div>

            <div className="tarot-toolbar">
              <label className="tarot-search">
                <span>Search Tarot</span>
                <input
                  disabled={isCatalogUnavailable}
                  onChange={(event) => setTarotSearch(event.target.value)}
                  placeholder="Name, card number, or suit"
                  type="search"
                  value={tarotSearch}
                />
              </label>

              <div
                aria-label="Filter Tarot cards"
                className="tarot-filter-group"
                role="group"
              >
                {(['all', 'major', 'minor'] as TarotFilter[]).map((filter) => (
                  <button
                    className={
                      tarotFilter === filter
                        ? 'tarot-filter tarot-filter-active'
                        : 'tarot-filter'
                    }
                    disabled={isCatalogUnavailable}
                    key={filter}
                    onClick={() => setTarotFilter(filter)}
                    type="button"
                  >
                    {filter === 'all'
                      ? 'All'
                      : filter === 'major'
                        ? 'Major'
                        : 'Minor'}
                  </button>
                ))}
              </div>
            </div>

            <div className="tarot-catalog">
              {filteredTarot.map((card) => {
                const quantity = tarotQuantities[card.id] ?? 0;
                const copyLimit = copyLimitFor(card);
                const totalLimitReached = tarotValidation.totalTarot >= 30;
                const copyLimitReached = quantity >= copyLimit;
                const majorLimitReached =
                  card.arcanaType === 'major' &&
                  tarotValidation.majorArcanaCount >= 15;

                const addDisabled =
                  totalLimitReached ||
                  copyLimitReached ||
                  majorLimitReached ||
                  isCatalogUnavailable;

                return (
                  <article className="tarot-card" key={card.id}>
                    <div className="tarot-card-details">
                      <div className="tarot-card-heading">
                        <p className="card-number">{card.cardNumber}</p>
                        <span
                          className={`arcana-badge arcana-${card.arcanaType}`}
                        >
                          {card.arcanaType === 'major'
                            ? 'Major Arcana'
                            : `Minor · ${card.suit}`}
                        </span>
                      </div>

                      <h3>{card.name}</h3>
                      <p>{card.effectText}</p>
                      <small>
                        Copy limit: {copyLimit}
                        {card.arcanaType === 'major'
                          ? ' · Counts toward 15 Major limit'
                          : ''}
                      </small>
                    </div>

                    <div className="tarot-quantity-control">
                      <button
                        aria-label={`Remove one ${card.name}`}
                        className="tarot-quantity-button"
                        disabled={quantity === 0 || isCatalogUnavailable}
                        onClick={() => updateTarotQuantity(card, -1)}
                        type="button"
                      >
                        −
                      </button>

                      <span aria-label={`${quantity} copies selected`}>
                        {quantity}
                      </span>

                      <button
                        aria-label={`Add one ${card.name}`}
                        className="tarot-quantity-button"
                        disabled={addDisabled}
                        onClick={() => updateTarotQuantity(card, 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {!isCatalogLoading &&
              !catalogError &&
              tarotCards.length > 0 &&
              filteredTarot.length === 0 && (
                <p className="empty-state">
                  No Tarot cards match your current search or filter.
                </p>
              )}

            {!isCatalogLoading && !catalogError && tarotCards.length === 0 && (
              <p className="empty-state">
                No playable Tarot cards are available from the catalog.
              </p>
            )}

            {tarotValidation.copyLimitViolations.length > 0 && (
              <div className="message-group message-errors">
                <h3>Tarot copy-limit issues</h3>
                {tarotValidation.copyLimitViolations.map((violation) => (
                  <p key={violation.cardId}>
                    {violation.cardName}: {violation.quantity} selected, but{' '}
                    {violation.allowedQuantity} allowed.
                  </p>
                ))}
              </div>
            )}

            {tarotValidation.hasTooManyMajorArcana && (
              <div className="message-group message-errors">
                <h3>Too many Major Arcana</h3>
                <p>
                  Traditional Mode allows at most 15 Major Arcana Tarot cards.
                </p>
              </div>
            )}

            <div className="selected-tarot-section">
              <div className="selected-tarot-heading">
                <h3>Selected Tarot</h3>
                <span>{selectedTarot.length} unique cards</span>
              </div>

              {selectedTarot.length === 0 ? (
                <p className="empty-state">
                  Select Tarot cards from the catalog above.
                </p>
              ) : (
                <div className="selected-tarot-list">
                  {selectedTarot.map((card) => (
                    <div className="selected-tarot-row" key={card.id}>
                      <span>
                        {card.name}
                        <small>
                          {card.arcanaType === 'major'
                            ? 'Major Arcana'
                            : `Minor · ${card.suit}`}
                        </small>
                      </span>
                      <strong>×{tarotQuantities[card.id]}</strong>
                    </div>
                  ))}
                </div>
              )}
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
        <button
          className="button-secondary"
          disabled={isCatalogUnavailable}
          onClick={resetDeck}
          type="button"
        >
          Reset deck
        </button>

        <button
          className="button-primary"
          disabled={isCatalogUnavailable}
          onClick={loadVerifiedExample}
          type="button"
        >
          Load starter example
        </button>
      </footer>
    </main>
  );
}

export default App;