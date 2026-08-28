import type { DeckCard, ValidationResult } from '../types/totym';
import { TOTYM_RULESET_V2 } from '../data/totymRuleset';

interface Props {
  result: ValidationResult;
  cards: DeckCard[];
}

export default function LegalityPanel({ result }: Props) {
  const rules = TOTYM_RULESET_V2.legalDeckRules;

  const countRows = [
    { label: 'Total', current: result.counts.total, required: rules.deckSize },
    { label: 'Creatures', current: result.counts.creatures, required: rules.creatureCount },
    { label: 'Worship', current: result.counts.worship, required: rules.worshipCount },
    { label: 'Tarot', current: result.counts.tarot, required: rules.tarotCount },
    { label: 'Imposters', current: result.counts.imposters, required: rules.imposterCount },
    { label: 'Major Arcana', current: result.counts.majorArcana, required: rules.majorArcanaDeckLimit, isLimit: true },
  ];

  return (
    <div>
      <div className={`status-card ${result.valid ? 'status-card-legal' : 'status-card-error'}`}>
        <div className="status-head">
          <span className={`status-dot ${result.valid ? 'legal' : 'error'}`} />
          <span className="status-title">
            {result.valid ? 'Legal — Traditional Mode' : 'Not legal yet'}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          {result.valid
            ? 'Deck meets all Traditional Mode construction rules.'
            : `${result.errors.length} rule violation${result.errors.length === 1 ? '' : 's'} must be fixed.`}
        </p>
      </div>

      <div className="subsection">
        <div className="subsection-head">Card counts</div>
        <div className="count-grid">
          {countRows.map((row) => {
            const ok = row.isLimit
              ? row.current <= row.required
              : row.current === row.required;
            return (
              <div key={row.label} className="count-row">
                <span className="count-label">{row.label}</span>
                <span className="count-val" data-ok={ok}>
                  {row.current} / {row.required}{row.isLimit ? ' max' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="subsection">
          <div className="subsection-head" style={{ color: 'var(--error)' }}>Errors</div>
          <div className="issue-list">
            {result.errors.map((err, i) => (
              <div key={i} className="issue issue-error">
                <span className="issue-icon">✕</span>
                <span>{err}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="subsection">
          <div className="subsection-head" style={{ color: 'var(--warning)' }}>Warnings</div>
          <div className="issue-list">
            {result.warnings.map((w, i) => (
              <div key={i} className="issue issue-warning">
                <span className="issue-icon">!</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.valid && result.warnings.length === 0 && result.errors.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
          No issues detected.
        </p>
      )}
    </div>
  );
}
