import { useState } from 'react';
import type { DeckCard, TotymCard } from '../types/totym';
import { CARD_BY_ID, isGenericCard } from '../data/totymCards';
import {
  decklistText,
  exportDeckJSON,
  importDeckJSON,
  type ImportResult,
} from '../lib/deckExport';
import { summarizeDeck } from '../lib/deckValidator';
import { TOTYM_RULESET_V2 } from '../data/totymRuleset';
import { CLAN_COLORS, CLAN_LABELS } from '../lib/labels';

interface Props {
  deckName: string;
  cards: DeckCard[];
  onRename: (name: string) => void;
  onSetQuantity: (cardId: string, quantity: number) => void;
  onRemove: (cardId: string) => void;
  onReset: () => void;
  onLoadTestDeck: () => void;
  onImport: (name: string, cards: DeckCard[]) => void;
  onToast: (msg: string) => void;
}

const GROUP_ORDER: TotymCard['cardType'][] = ['creature', 'tarot', 'worship', 'imposter'];
const GROUP_LABELS: Record<TotymCard['cardType'], string> = {
  creature: 'Creatures',
  tarot: 'Tarot',
  worship: 'Worship',
  imposter: 'Imposters',
  relic: 'Relics',
};

export default function DeckBuilder({
  deckName,
  cards,
  onRename,
  onSetQuantity,
  onRemove,
  onReset,
  onLoadTestDeck,
  onImport,
  onToast,
}: Props) {
  const [showImport, setShowImport] = useState(false);
  const counts = summarizeDeck(cards);

  const grouped = GROUP_ORDER.map((type) => ({
    type,
    items: cards
      .map((dc) => ({ dc, card: CARD_BY_ID[dc.cardId] }))
      .filter((r) => r.card && r.card.cardType === type),
  })).filter((g) => g.items.length > 0);

  const handleCopy = async () => {
    const text = decklistText(deckName, cards);
    try {
      await navigator.clipboard.writeText(text);
      onToast('Decklist copied to clipboard');
    } catch {
      onToast('Could not copy to clipboard');
    }
  };

  const handleExport = () => {
    const json = exportDeckJSON(deckName, cards);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deckName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Deck exported as JSON');
  };

  return (
    <div className="col-body">
      <div className="deck-name-row">
        <input
          className="input"
          value={deckName}
          onChange={(e) => onRename(e.target.value)}
          aria-label="Deck name"
        />
      </div>

      <div className="deck-actions">
        <button className="btn btn-gold" onClick={onLoadTestDeck}>Load Test Deck</button>
        <button className="btn" onClick={handleCopy}>Copy Decklist</button>
        <button className="btn" onClick={handleExport}>Export JSON</button>
        <button className="btn" onClick={() => setShowImport(true)}>Import JSON</button>
        <button className="btn btn-ghost" onClick={onReset}>Reset Deck</button>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: 7,
        border: '1px solid var(--border)',
        background: 'var(--panel)',
        marginBottom: 14,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Total cards</span>
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          color: counts.total === TOTYM_RULESET_V2.legalDeckRules.deckSize ? 'var(--gold)' : 'var(--text-h)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {counts.total} / {TOTYM_RULESET_V2.legalDeckRules.deckSize}
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="4" width="14" height="18" rx="2" />
            <path d="M7 4V2h10a2 2 0 0 1 2 2v14" />
          </svg>
          <p className="empty-title">Build a deck to begin validation.</p>
          <p className="empty-text">Add verified cards from the library, then inspect legality and player-count considerations.</p>
          <button className="btn btn-gold" style={{ marginTop: 8 }} onClick={onLoadTestDeck}>Load Test Deck</button>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.type} className="deck-group">
            <div className="deck-group-head">
              <span className="deck-group-title">{GROUP_LABELS[group.type]}</span>
              <span className="deck-group-count">
                {group.items.reduce((sum, r) => sum + r.dc.quantity, 0)} cards
              </span>
            </div>
            {group.items.map(({ dc, card }) => (
              <div key={dc.cardId} className="deck-item">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="deck-item-name">
                    {card.name}
                    {isGenericCard(card) && (
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 6, fontStyle: 'italic' }}>placeholder</span>
                    )}
                  </div>
                  <div className="deck-item-meta">
                    {card.cardNumber}
                    {card.cardType === 'creature' && card.creatureRequirements && (
                      <span style={{ marginLeft: 6 }}>
                        ·{' '}
                        <span className="clan-dot" style={{ background: CLAN_COLORS[card.creatureRequirements.left.clan], display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }} />
                        {CLAN_LABELS[card.creatureRequirements.left.clan]} {card.creatureRequirements.left.required}
                        {' / '}
                        <span className="clan-dot" style={{ background: CLAN_COLORS[card.creatureRequirements.right.clan], display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }} />
                        {CLAN_LABELS[card.creatureRequirements.right.clan]} {card.creatureRequirements.right.required}
                      </span>
                    )}
                  </div>
                </div>
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => onSetQuantity(dc.cardId, dc.quantity - 1)}
                    disabled={dc.quantity <= 0}
                    aria-label={`Decrease ${card.name} quantity`}
                  >−</button>
                  <span className="qty-val">{dc.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => onSetQuantity(dc.cardId, dc.quantity + 1)}
                    aria-label={`Increase ${card.name} quantity`}
                  >+</button>
                  <button
                    className="qty-btn"
                    onClick={() => onRemove(dc.cardId)}
                    style={{ marginLeft: 4, color: 'var(--error)' }}
                    aria-label={`Remove ${card.name} from deck`}
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {showImport && (
        <ImportDialog
          onClose={() => setShowImport(false)}
          onImport={(result) => {
            onImport(result.name!, result.cards!);
            setShowImport(false);
            onToast('Deck imported');
          }}
        />
      )}
    </div>
  );
}

function ImportDialog({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (result: ImportResult) => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    const result = importDeckJSON(text);
    if (!result.ok) {
      setError(result.error ?? 'Unknown error');
      return;
    }
    onImport(result);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Import deck JSON">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">Import Deck JSON</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close import dialog">×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
              Load from file
            </label>
            <input type="file" accept=".json,application/json" onChange={handleFile} aria-label="Choose JSON file" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
              Or paste deck JSON
            </label>
            <textarea
              className="dialog-textarea"
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null); }}
              placeholder='{"name":"…","format":"traditional","cards":[…]}' 
              aria-label="Paste deck JSON"
            />
          </div>
          {error && <div className="dialog-error">{error}</div>}
          <div className="dialog-actions">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold" onClick={handleImport} disabled={!text.trim()}>Import</button>
          </div>
        </div>
      </div>
    </div>
  );
}
