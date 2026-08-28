import { useCallback, useMemo, useState } from 'react';
import type { DeckCard, PlayerMode } from './types/totym';
import { TOTYM_RULESET_V2, CATALOG_DATA_STATUS } from './data/totymRuleset';
import { TEST_DECK_CARDS, TEST_DECK_NAME } from './data/testDeck';
import { validateDeck } from './lib/deckValidator';
import CardLibrary from './components/CardLibrary';
import DeckBuilder from './components/DeckBuilder';
import AnalysisPanel from './components/AnalysisPanel';

const DEFAULT_DECK_NAME = 'Untitled Lab Deck';

type MobileTab = 'library' | 'deck' | 'analysis';

export default function App() {
  const [deckName, setDeckName] = useState(DEFAULT_DECK_NAME);
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [mode, setMode] = useState<PlayerMode>('1v1');
  const [mobileTab, setMobileTab] = useState<MobileTab>('library');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const addCard = useCallback((cardId: string) => {
    setCards((prev) => {
      const existing = prev.find((c) => c.cardId === cardId);
      if (existing) {
        return prev.map((c) =>
          c.cardId === cardId ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { cardId, quantity: 1 }];
    });
  }, []);

  const setQuantity = useCallback((cardId: string, quantity: number) => {
    if (quantity < 0) return;
    setCards((prev) => {
      if (quantity === 0) {
        return prev.filter((c) => c.cardId !== cardId);
      }
      return prev.map((c) =>
        c.cardId === cardId ? { ...c, quantity } : c,
      );
    });
  }, []);

  const removeCard = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.cardId !== cardId));
  }, []);

  const resetDeck = useCallback(() => {
    setCards([]);
    setDeckName(DEFAULT_DECK_NAME);
    showToast('Deck reset');
  }, [showToast]);

  const loadTestDeck = useCallback(() => {
    setCards(TEST_DECK_CARDS.map((c) => ({ ...c })));
    setDeckName(TEST_DECK_NAME);
    setMobileTab('deck');
    showToast('Test deck loaded (invalid demo)');
  }, [showToast]);

  const importDeck = useCallback((name: string, importedCards: DeckCard[]) => {
    setCards(importedCards);
    setDeckName(name);
    showToast('Deck imported');
  }, [showToast]);

  const validationResult = useMemo(() => validateDeck(cards), [cards]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <svg className="header-logo" viewBox="0 0 200 24" width="160" height="20" aria-label="TOTYM LAB">
            <text x="0" y="18" fontFamily="var(--mono)" fontSize="20" fontWeight="700" letterSpacing="4">TOTYM LAB</text>
          </svg>
          <span className="header-sub">Deck intelligence for Traditional Mode.</span>
        </div>
        <div className="header-meta">
          <span className="badge badge-gold">
            Rules v{TOTYM_RULESET_V2.version} · {TOTYM_RULESET_V2.effectiveDate}
          </span>
          <span className="badge" title={CATALOG_DATA_STATUS.message}>Private prototype</span>
          <button className="btn btn-ghost btn-sm" onClick={resetDeck}>Reset Deck</button>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Workspace view">
        <button className="tab" role="tab" aria-selected={mobileTab === 'library'} data-active={mobileTab === 'library'} onClick={() => setMobileTab('library')}>Library</button>
        <button className="tab" role="tab" aria-selected={mobileTab === 'deck'} data-active={mobileTab === 'deck'} onClick={() => setMobileTab('deck')}>Deck</button>
        <button className="tab" role="tab" aria-selected={mobileTab === 'analysis'} data-active={mobileTab === 'analysis'} onClick={() => setMobileTab('analysis')}>Analysis</button>
      </nav>

      <main className="workspace">
        <section className="col" data-active={mobileTab === 'library'} aria-label="Card library">
          <div className="col-head">
            <h2>Card Library</h2>
          </div>
          <CardLibrary onAddCard={addCard} />
        </section>

        <section className="col" data-active={mobileTab === 'deck'} aria-label="Active deck">
          <div className="col-head">
            <h2>Active Deck</h2>
          </div>
          <DeckBuilder
            deckName={deckName}
            cards={cards}
            onRename={setDeckName}
            onSetQuantity={setQuantity}
            onRemove={removeCard}
            onReset={resetDeck}
            onLoadTestDeck={loadTestDeck}
            onImport={importDeck}
            onToast={showToast}
          />
        </section>

        <section className="col" data-active={mobileTab === 'analysis'} aria-label="Legality and analysis">
          <div className="col-head">
            <h2>Legality &amp; Analysis</h2>
          </div>
          <AnalysisPanel
            cards={cards}
            mode={mode}
            onModeChange={setMode}
            validationResult={validationResult}
          />
        </section>
      </main>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
