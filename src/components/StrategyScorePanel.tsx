import { useState } from 'react';
import type { HeuristicAnalysis, StrategyScore } from '../types/totym';
import { bandLabel } from '../lib/strategyScorer';

interface Props {
  analysis: HeuristicAnalysis;
}

export default function StrategyScorePanel({ analysis }: Props) {
  const [showInputs, setShowInputs] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const statusLabel = analysis.isProvisional ? 'Provisional' : 'Rules-aware heuristic';
  const statusClass = analysis.isProvisional ? 'badge' : 'badge badge-gold';

  const overall = analysis.overallLabScore;
  const bandColor =
    overall.band === 'strong'
      ? 'var(--gold)'
      : overall.band === 'solid'
        ? 'var(--green)'
        : overall.band === 'developing'
          ? 'var(--blue)'
          : 'var(--text-dim)';

  return (
    <div className="subsection">
      <div className="creature-core-head">
        <div>
          <div className="subsection-head" style={{ marginBottom: 2 }}>
            Strategy Profile
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
            Initial heuristic settings
          </span>
        </div>
        <span className={statusClass}>{statusLabel}</span>
      </div>

      {/* Overall Lab Score */}
      <div className="strategy-overall-card">
        <div className="strategy-overall-score" style={{ color: bandColor }}>
          {overall.score}
        </div>
        <div className="strategy-overall-meta">
          <span className="strategy-overall-band" style={{ color: bandColor }}>
            {bandLabel(overall.band)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Overall Lab Score · 0–100
          </span>
        </div>
      </div>

      {analysis.isProvisional && (
        <div className="issue issue-warning" style={{ marginTop: 8 }}>
          <span className="issue-icon">!</span>
          <span>
            Provisional: illegal decks are capped at 49 until all Traditional
            Mode requirements are met.
          </span>
        </div>
      )}

      {/* Supporting scores */}
      <div className="strategy-score-list" style={{ marginTop: 10 }}>
        <ScoreRow score={analysis.scores.ascensionConsistency} />
        <ScoreRow score={analysis.scores.disruptionControl} />
        <ScoreRow score={analysis.scores.resilienceRecovery} />
        <ScoreRow score={analysis.scores.formatFit} />
        <ScoreRow score={analysis.scores.deadCardRisk} isRisk />
      </div>

      {/* Factual inputs */}
      <div style={{ marginTop: 10 }}>
        <button
          className="creature-entry-toggle"
          onClick={() => setShowInputs((s) => !s)}
          aria-expanded={showInputs}
          aria-controls="strategy-factual-inputs"
        >
          {showInputs ? 'Hide factual inputs' : 'Show factual inputs'}
        </button>
        {showInputs && (
          <div id="strategy-factual-inputs" className="strategy-factual-inputs">
            <div className="core-summary-chips">
              <div className="core-chip">
                <span className="core-chip-label">Creatures</span>
                <span className="core-chip-val">{analysis.factualInputs.creatureCount}</span>
              </div>
              <div className="core-chip">
                <span className="core-chip-label">Tarot</span>
                <span className="core-chip-val">{analysis.factualInputs.tarotCount}</span>
              </div>
              <div className="core-chip">
                <span className="core-chip-label">Worship</span>
                <span className="core-chip-val">{analysis.factualInputs.worshipCount}</span>
              </div>
              <div className="core-chip">
                <span className="core-chip-label">Imposters</span>
                <span className="core-chip-val">{analysis.factualInputs.imposterCount}</span>
              </div>
              <div className="core-chip">
                <span className="core-chip-label">Major Arcana</span>
                <span className="core-chip-val">{analysis.factualInputs.majorArcanaCount}</span>
              </div>
              <div className="core-chip">
                <span className="core-chip-label">Clans used</span>
                <span className="core-chip-val">{analysis.factualInputs.uniqueClanCount}</span>
              </div>
              <div className="core-chip">
                <span className="core-chip-label">Worship req.</span>
                <span className="core-chip-val">{analysis.factualInputs.totalCreatureWorshipRequired}</span>
              </div>
              <div className="core-chip">
                <span className="core-chip-label">Format warnings</span>
                <span className="core-chip-val">{analysis.factualInputs.formatWarningCount}</span>
              </div>
            </div>
            {analysis.factualInputs.tarotTagCounts.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="section-label">Non-zero Tarot effect categories</div>
                <div className="tarot-tag-list">
                  {analysis.factualInputs.tarotTagCounts.map((tc) => (
                    <div key={tc.tag} className="tarot-tag-row">
                      <span className="tarot-tag-name">{tc.tag}</span>
                      <span className="tarot-tag-count">{tc.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={{ marginTop: 8 }}>
        <button
          className="creature-entry-toggle"
          onClick={() => setShowNotes((s) => !s)}
          aria-expanded={showNotes}
          aria-controls="strategy-notes"
        >
          {showNotes ? 'Hide notes' : 'Show notes'}
        </button>
        {showNotes && (
          <div id="strategy-notes" className="strategy-notes">
            {analysis.globalNotes.map((note, i) => (
              <p key={i} style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 2 }}>
                {note}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p
        style={{
          fontSize: 10,
          color: 'var(--text-dim)',
          fontStyle: 'italic',
          marginTop: 10,
          lineHeight: 1.5,
        }}
      >
        {analysis.disclaimer}
      </p>
    </div>
  );
}

function ScoreRow({ score, isRisk }: { score: StrategyScore; isRisk?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor = isRisk
    ? score.score >= 50
      ? 'var(--error)'
      : score.score >= 25
        ? 'var(--warning)'
        : 'var(--green)'
    : score.band === 'strong'
      ? 'var(--gold)'
      : score.band === 'solid'
        ? 'var(--green)'
        : score.band === 'developing'
          ? 'var(--blue)'
          : 'var(--text-dim)';

  return (
    <div className="strategy-score-row">
      <button
        className="strategy-score-header"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={`strategy-detail-${score.key}`}
      >
        <span className="strategy-score-label">{score.label}</span>
        <span className="strategy-score-value" style={{ color: scoreColor }}>
          {score.score}
          <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 4 }}>
            {bandLabel(score.band)}
          </span>
          {isRisk && (
            <span style={{ fontSize: 9, color: 'var(--text-dim)', marginLeft: 4 }}>
              risk
            </span>
          )}
        </span>
      </button>
      {expanded && (
        <div id={`strategy-detail-${score.key}`} className="strategy-score-detail">
          <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 6 }}>
            {score.explanation}
          </p>
          {isRisk && (
            <p style={{ fontSize: 10, color: 'var(--warning)', fontStyle: 'italic', marginBottom: 4 }}>
              Higher means more identified structural risk.
            </p>
          )}
          {score.contributingFactors.length > 0 && (
            <div className="section-label">Contributing factors</div>
          )}
          {score.contributingFactors.map((f, i) => (
            <div key={i} className="strategy-factor strategy-factor-contrib">
              <span className="strategy-factor-icon">+</span>
              <span>{f}</span>
            </div>
          ))}
          {score.cautionFactors.length > 0 && (
            <div className="section-label" style={{ marginTop: 4 }}>Caution factors</div>
          )}
          {score.cautionFactors.map((f, i) => (
            <div key={i} className="strategy-factor strategy-factor-caution">
              <span className="strategy-factor-icon">−</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
