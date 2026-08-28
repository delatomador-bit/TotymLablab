import { useMemo } from 'react';
import type { Clan, DeckCard, PlayerMode, TotymCard, ValidationResult } from '../types/totym';
import { CARD_BY_ID } from '../data/totymCards';
import { TOTYM_RULESET_V2 } from '../data/totymRuleset';
import { formatWarningsFor } from '../lib/formatRules';
import {
  CLAN_COLORS,
  CLAN_LABELS,
  PLAYER_MODES,
  PLAYER_MODE_LABELS,
} from '../lib/labels';
import LegalityPanel from './LegalityPanel';

interface Props {
  cards: DeckCard[];
  mode: PlayerMode;
  onModeChange: (mode: PlayerMode) => void;
  validationResult: ValidationResult;
}

const CLAN_ORDER: Clan[] = ['berserkers', 'druids', 'bards', 'zealots', 'mystics'];

export default function AnalysisPanel({ cards, mode, onModeChange, validationResult }: Props) {
  const fmtWarnings = useMemo(() => formatWarningsFor(cards, mode), [cards, mode]);

  const creatures = useMemo(
    () => cards
      .map((dc) => ({ dc, card: CARD_BY_ID[dc.cardId] }))
      .filter((r): r is { dc: DeckCard; card: TotymCard } => !!r.card && r.card.cardType === 'creature'),
    [cards],
  );

  const demand = useMemo(() => {
    const totals: Record<Clan, number> = {
      berserkers: 0, druids: 0, bards: 0, zealots: 0, mystics: 0,
    };
    for (const { card } of creatures) {
      if (card.creatureRequirements) {
        totals[card.creatureRequirements.left.clan] += card.creatureRequirements.left.required;
        totals[card.creatureRequirements.right.clan] += card.creatureRequirements.right.required;
      }
    }
    return totals;
  }, [creatures]);

  const maxDemand = Math.max(1, ...CLAN_ORDER.map((c) => demand[c]));
  const representedClans = CLAN_ORDER.filter((c) => demand[c] > 0);
  const mostDemanded = CLAN_ORDER.reduce<Clan | null>((top, c) => {
    if (demand[c] === 0) return top;
    if (!top || demand[c] > demand[top]) return c;
    return top;
  }, null);

  const creatureIncomplete = creatures.length < 5;

  return (
    <div className="col-body">
      <div className="subsection">
        <div className="subsection-head">Ruleset</div>
        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
          <div><strong style={{ color: 'var(--text-h)' }}>{TOTYM_RULESET_V2.name}</strong></div>
          <div style={{ color: 'var(--text-dim)' }}>
            Effective {TOTYM_RULESET_V2.effectiveDate} · {TOTYM_RULESET_V2.status}
          </div>
        </div>
      </div>

      <div className="subsection">
        <div className="subsection-head">Player mode</div>
        <div className="mode-tabs" role="tablist" aria-label="Player mode">
          {PLAYER_MODES.map((m) => (
            <button
              key={m}
              className="mode-tab"
              data-active={mode === m}
              onClick={() => onModeChange(m)}
              role="tab"
              aria-selected={mode === m}
            >
              {PLAYER_MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <LegalityPanel result={validationResult} cards={cards} />

      {fmtWarnings.length > 0 && (
        <div className="subsection">
          <div className="subsection-head" style={{ color: 'var(--info)' }}>
            Format warnings · {PLAYER_MODE_LABELS[mode]}
          </div>
          <div className="issue-list">
            {fmtWarnings.map((w, i) => (
              <div key={`${w.cardId}-${i}`} className={`issue ${w.severity === 'warning' ? 'issue-warning' : 'issue-info'}`}>
                <span className="issue-icon">{w.severity === 'warning' ? '!' : 'i'}</span>
                <span>
                  <strong style={{ color: 'var(--text-h)' }}>{w.cardName}</strong> — {w.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="subsection">
        <div className="subsection-head">
          Creature core {creatureIncomplete && '· Incomplete'}
        </div>
        {creatures.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No creatures selected.
          </p>
        ) : (
          <>
            {creatures.map(({ card }) => (
              <div key={card.id} className="creature-req-row">
                <span className="creature-req-name">{card.name}</span>
                <span style={{ flex: 1, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {card.creatureRequirements && (
                    <>
                      <span className="req-side">
                        <span className="clan-dot" style={{ background: CLAN_COLORS[card.creatureRequirements.left.clan] }} />
                        {CLAN_LABELS[card.creatureRequirements.left.clan]} {card.creatureRequirements.left.required}
                      </span>
                      <span className="req-side">
                        <span className="clan-dot" style={{ background: CLAN_COLORS[card.creatureRequirements.right.clan] }} />
                        {CLAN_LABELS[card.creatureRequirements.right.clan]} {card.creatureRequirements.right.required}
                      </span>
                    </>
                  )}
                </span>
              </div>
            ))}

            <div style={{ marginTop: 12 }}>
              <div className="section-label">Aggregate clan demand</div>
              {CLAN_ORDER.map((clan) => (
                <div key={clan} className="demand-bar-wrap">
                  <span className="demand-clan">
                    <span className="clan-dot" style={{ background: CLAN_COLORS[clan] }} />
                    {CLAN_LABELS[clan]}
                  </span>
                  <span className="demand-bar-track">
                    <span
                      className="demand-bar-fill"
                      style={{
                        width: `${(demand[clan] / maxDemand) * 100}%`,
                        background: CLAN_COLORS[clan],
                      }}
                    />
                  </span>
                  <span className="demand-val">{demand[clan]}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-dim)' }}>
              {creatureIncomplete ? (
                <span style={{ color: 'var(--warning)' }}>Incomplete creature core — {creatures.length} of 5 creatures selected.</span>
              ) : (
                <span>
                  Most demanded: <strong style={{ color: mostDemanded ? CLAN_COLORS[mostDemanded] : 'var(--text-h)' }}>
                    {mostDemanded ? CLAN_LABELS[mostDemanded] : '—'}
                  </strong> · {representedClans.length} clan{representedClans.length === 1 ? '' : 's'} represented.
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="subsection">
        <div className="subsection-head">Strategy scoring</div>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
          Strategy scoring is planned after the full card catalog and initial rules tests are loaded.
        </p>
        <div className="coming-soon">
          <div className="coming-soon-list">
            {['Ascension consistency', 'Disruption / control', 'Resilience / recovery', 'Swap suggestions'].map((label) => (
              <div key={label} className="coming-soon-item">
                <span className="coming-soon-badge">Soon</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
