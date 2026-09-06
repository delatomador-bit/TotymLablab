import { useMemo, useState } from 'react';
import type { ArcanaType, TarotSuit, TargetType, TotymCard } from '../types/totym';
import { isGenericCard } from '../data/totymCards';
import {
  CLAN_COLORS,
  CLAN_LABELS,
  SUIT_LABELS,
  TARGET_LABELS,
} from '../lib/labels';

interface Props {
  catalogCards: TotymCard[];
  genericCards: TotymCard[];
  catalogStatus: string;
  onAddCard: (cardId: string) => void;
  onOpenCatalogImport: () => void;
}

type TypeFilter = 'all' | 'creature' | 'tarot' | 'utility';

const getSuitLabel = (suit: string | null): string =>
  suit && suit in SUIT_LABELS
    ? SUIT_LABELS[suit as keyof typeof SUIT_LABELS]
    : suit ?? '—';

const getTargetLabel = (targetType: string | null): string =>
  targetType && targetType in TARGET_LABELS
    ? TARGET_LABELS[targetType as keyof typeof TARGET_LABELS]
    : targetType ?? '—';

export default function CardLibrary({
  catalogCards,
  genericCards,
  catalogStatus,
  onAddCard,
  onOpenCatalogImport,
}: Props) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [arcanaFilter, setArcanaFilter] = useState<ArcanaType | 'all'>('all');
  const [suitFilter, setSuitFilter] = useState<TarotSuit | 'all'>('all');
  const [targetFilter, setTargetFilter] = useState<TargetType | 'any'>('any');
  const [detailCard, setDetailCard] = useState<TotymCard | null>(null);

  const allCards = useMemo(
    () => [...catalogCards, ...genericCards],
    [catalogCards, genericCards],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allCards.filter((card) => {
      if (q && !card.name.toLowerCase().includes(q)) return false;

      if (typeFilter === 'creature' && card.cardType !== 'creature') {
        return false;
      }

      if (typeFilter === 'tarot' && card.cardType !== 'tarot') {
        return false;
      }

      if (typeFilter === 'utility' && !isGenericCard(card)) {
        return false;
      }

      if (typeFilter === 'all' && isGenericCard(card)) {
        return false;
      }

      if (card.cardType === 'tarot') {
        if (arcanaFilter !== 'all' && card.arcanaType !== arcanaFilter) {
          return false;
        }

        if (suitFilter !== 'all' && card.suit !== suitFilter) {
          return false;
        }

        if (targetFilter !== 'any' && card.targetType !== targetFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    allCards,
    query,
    typeFilter,
    arcanaFilter,
    suitFilter,
    targetFilter,
  ]);

  return (
    <>
      <div className="col-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="search">
            <svg
              className="search-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>

            <input
              className="input"
              type="search"
              placeholder="Search card name…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search cards by name"
            />
          </div>

          <div>
            <div className="section-label">Filter</div>

            <div className="filter-row">
              <button
                className="chip"
                data-active={typeFilter === 'all'}
                onClick={() => setTypeFilter('all')}
              >
                All
              </button>

              <button
                className="chip"
                data-active={typeFilter === 'creature'}
                onClick={() => setTypeFilter('creature')}
              >
                Creatures
              </button>

              <button
                className="chip"
                data-active={typeFilter === 'tarot'}
                onClick={() => setTypeFilter('tarot')}
              >
                Tarot
              </button>

              <button
                className="chip"
                data-active={typeFilter === 'utility'}
                onClick={() => setTypeFilter('utility')}
              >
                Deck-count utility
              </button>
            </div>
          </div>

          {typeFilter === 'tarot' || typeFilter === 'all' ? (
            <>
              <div>
                <div className="section-label">Arcana</div>

                <div className="filter-row">
                  <button
                    className="chip"
                    data-active={arcanaFilter === 'all'}
                    onClick={() => setArcanaFilter('all')}
                  >
                    Any
                  </button>

                  <button
                    className="chip"
                    data-active={arcanaFilter === 'major'}
                    onClick={() => setArcanaFilter('major')}
                  >
                    Major
                  </button>

                  <button
                    className="chip"
                    data-active={arcanaFilter === 'minor'}
                    onClick={() => setArcanaFilter('minor')}
                  >
                    Minor
                  </button>
                </div>
              </div>

              <div>
                <div className="section-label">Suit</div>

                <div className="filter-row">
                  <button
                    className="chip"
                    data-active={suitFilter === 'all'}
                    onClick={() => setSuitFilter('all')}
                  >
                    Any
                  </button>

                  <button
                    className="chip"
                    data-active={suitFilter === 'wands'}
                    onClick={() => setSuitFilter('wands')}
                  >
                    Wands
                  </button>

                  <button
                    className="chip"
                    data-active={suitFilter === 'cups'}
                    onClick={() => setSuitFilter('cups')}
                  >
                    Cups
                  </button>

                  <button
                    className="chip"
                    data-active={suitFilter === 'swords'}
                    onClick={() => setSuitFilter('swords')}
                  >
                    Swords
                  </button>

                  <button
                    className="chip"
                    data-active={suitFilter === 'pentacles'}
                    onClick={() => setSuitFilter('pentacles')}
                  >
                    Pentacles
                  </button>
                </div>
              </div>

              <div>
                <div className="section-label">Target</div>

                <div className="filter-row">
                  <button
                    className="chip"
                    data-active={targetFilter === 'any'}
                    onClick={() => setTargetFilter('any')}
                  >
                    Any
                  </button>

                  <button
                    className="chip"
                    data-active={targetFilter === 'self'}
                    onClick={() => setTargetFilter('self')}
                  >
                    Self
                  </button>

                  <button
                    className="chip"
                    data-active={targetFilter === 'opponent'}
                    onClick={() => setTargetFilter('opponent')}
                  >
                    Opponent
                  </button>

                  <button
                    className="chip"
                    data-active={targetFilter === 'two_opponents'}
                    onClick={() => setTargetFilter('two_opponents')}
                  >
                    Two opp.
                  </button>

                  <button
                    className="chip"
                    data-active={targetFilter === 'all'}
                    onClick={() => setTargetFilter('all')}
                  >
                    All
                  </button>
                </div>
              </div>
            </>
          ) : null}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 4,
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <span className="badge badge-seed">{catalogStatus}</span>

            <button
              className="btn btn-sm btn-ghost"
              onClick={onOpenCatalogImport}
            >
              Import Full Catalog JSON
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {filtered.length} shown
            </span>
          </div>

          <div className="card-list" style={{ marginTop: 4 }}>
            {filtered.length === 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-dim)',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                No cards match these filters.
              </p>
            ) : (
              filtered.map((card) => (
                <div key={card.id} className="card-row">
                  <button
                    className="card-row-info"
                    onClick={() => setDetailCard(card)}
                    style={{
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                    aria-label={`View details for ${card.name}`}
                  >
                    <div className="card-row-name">{card.name}</div>

                    <div className="card-row-meta">
                      <span className="type-tag">{card.cardType}</span>

                      {card.cardType === 'tarot' && card.arcanaType && (
                        <span>
                          {card.arcanaType === 'major' ? 'Major' : 'Minor'}
                          {card.suit ? ` · ${getSuitLabel(card.suit)}` : ''}
                        </span>
                      )}

                      {card.cardType === 'tarot' && card.targetType && (
                        <span>· {getTargetLabel(card.targetType)}</span>
                      )}

                      {isGenericCard(card) && (
                        <span className="util-flag">— placeholder</span>
                      )}
                    </div>
                  </button>

                  <button
                    className="btn btn-sm btn-gold"
                    onClick={() => onAddCard(card.id)}
                    aria-label={`Add ${card.name} to deck`}
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {detailCard && (
        <CardDetailModal
          card={detailCard}
          onClose={() => setDetailCard(null)}
        />
      )}
    </>
  );
}

function CardDetailModal({
  card,
  onClose,
}: {
  card: TotymCard;
  onClose: () => void;
}) {
  const generic = isGenericCard(card);

  const sourceCategory = generic
    ? 'Deck-count placeholder — not a catalog card.'
    : 'Revised card workbook';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} details`}
    >
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 className="modal-title">{card.name}</h3>

            <div
              style={{
                fontSize: 11,
                color: 'var(--text-dim)',
                marginTop: 2,
              }}
            >
              {card.cardNumber} · {card.cardType}
            </div>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close details"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {generic && (
            <div className="issue issue-warning" style={{ marginBottom: 10 }}>
              <span className="issue-icon">!</span>
              <span>Deck-count placeholder — not a catalog card.</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Source</span>
            <span className="detail-val">{sourceCategory}</span>
          </div>

          {card.cardType === 'tarot' && (
            <>
              <div className="detail-row">
                <span className="detail-label">Arcana</span>

                <span className="detail-val">
                  {card.arcanaType === 'major'
                    ? 'Major'
                    : card.arcanaType === 'minor'
                      ? 'Minor'
                      : '—'}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Suit</span>
                <span className="detail-val">
                  {getSuitLabel(card.suit)}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Target</span>
                <span className="detail-val">
                  {getTargetLabel(card.targetType)}
                </span>
              </div>
            </>
          )}

          {card.effectText && (
            <div style={{ marginTop: 8 }}>
              <div className="section-label">Effect text</div>
              <div className="effect-text">{card.effectText}</div>
            </div>
          )}

          {card.cardType === 'creature' && card.creatureRequirements && (
            <>
              <div style={{ marginTop: 12 }}>
                <div className="section-label">Worship requirements</div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <ReqSide
                    label="Left"
                    req={card.creatureRequirements.left}
                  />

                  <ReqSide
                    label="Right"
                    req={card.creatureRequirements.right}
                  />
                </div>
              </div>

              {card.immunity && (
                <div className="detail-row" style={{ marginTop: 8 }}>
                  <span className="detail-label">Immunity</span>
                  <span className="detail-val">{card.immunity}</span>
                </div>
              )}

              {card.blessing && (
                <div className="detail-row">
                  <span className="detail-label">Blessing</span>
                  <span className="detail-val">{card.blessing}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReqSide({
  label,
  req,
}: {
  label: string;
  req: {
    clan: string;
    required: number;
  };
}) {
  const clan = req.clan as keyof typeof CLAN_LABELS;

  return (
    <div className="req-side">
      <span style={{ color: 'var(--text-dim)' }}>{label}:</span>

      <span
        className="clan-dot"
        style={{ background: CLAN_COLORS[clan] }}
      />

      <span>
        {CLAN_LABELS[clan]} {req.required}
      </span>
    </div>
  );
}