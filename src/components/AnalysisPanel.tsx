import { useMemo } from 'react';
import type { PlayerMode, TotymCard, TotymDeck, ValidationResult } from '../types/totym';
import { TOTYM_RULESET_V2 } from '../data/totymRuleset';
import { formatWarningsFor } from '../lib/formatRules';
import { analyzeCreatureCore } from '../lib/creatureCoreAnalyzer';
import { analyzeTarotPackage } from '../lib/tarotPackageAnalyzer';
import type { CardLookup } from '../lib/deckValidator';
import {
  PLAYER_MODES,
  PLAYER_MODE_LABELS,
} from '../lib/labels';
import LegalityPanel from './LegalityPanel';
import CreatureCorePanel from './CreatureCorePanel';
import TarotPackagePanel from './TarotPackagePanel';

interface Props {
  deck: TotymDeck;
  mode: PlayerMode;
  onModeChange: (mode: PlayerMode) => void;
  validationResult: ValidationResult;
  cardLookup: CardLookup;
  activeCards: TotymCard[];
}

export default function AnalysisPanel({
  deck,
  mode,
  onModeChange,
  validationResult,
  cardLookup,
  activeCards,
}: Props) {
  const fmtWarnings = useMemo(
    () => formatWarningsFor(deck.cards, mode, cardLookup),
    [deck.cards, mode, cardLookup],
  );

  const creatureProfile = useMemo(
    () => analyzeCreatureCore(deck, activeCards),
    [deck, activeCards],
  );

  const tarotProfile = useMemo(
    () => analyzeTarotPackage(deck, activeCards, mode),
    [deck, activeCards, mode],
  );

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

      <LegalityPanel result={validationResult} cards={deck.cards} />

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

      <CreatureCorePanel profile={creatureProfile} />

      <TarotPackagePanel profile={tarotProfile} />

      <div className="subsection">
        <div className="subsection-head">Strategy scoring</div>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
          Next: Strategy scoring will combine the factual Creature Core and
          text-derived Tarot Package profiles with player-count rules and
          confirmed scenario tests.
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
