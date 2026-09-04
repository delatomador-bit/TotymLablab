import { useState } from 'react';
import type {
  TarotCardAnalysis,
  TarotEffectTag,
  TarotPackageProfile,
  TarotSuitCategory,
  TarotTargetCategory,
} from '../types/totym';
import { TAROT_TAG_LABELS } from '../lib/tarotPackageAnalyzer';
import { TARGET_LABELS } from '../lib/labels';

interface Props {
  profile: TarotPackageProfile;
}

const SUIT_ORDER: TarotSuitCategory[] = ['major', 'wands', 'cups', 'swords', 'pentacles'];
const TARGET_ORDER: TarotTargetCategory[] = ['self', 'opponent', 'two_opponents', 'any', 'all'];

const SUIT_ACCENT: Record<TarotSuitCategory, string> = {
  major: '#d4a93a',
  wands: '#e0533c',
  cups: '#4f8fd9',
  swords: '#8b93a3',
  pentacles: '#3fae6b',
};

const SUIT_CATEGORY_LABELS: Record<TarotSuitCategory, string> = {
  major: 'Major Arcana',
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pentacles',
};

export default function TarotPackagePanel({ profile }: Props) {
  const [showAllTags, setShowAllTags] = useState(false);
  const [showIncluded, setShowIncluded] = useState(false);

  const maxSuit = Math.max(1, ...profile.suitCounts.map((sc) => sc.count));
  const maxTarget = Math.max(1, ...profile.targetCounts.map((tc) => tc.count));

  const visibleTagCounts = showAllTags
    ? profile.effectTagCounts
    : profile.effectTagCounts.filter((tc) => tc.count > 0);

  return (
    <div className="subsection">
      <div className="creature-core-head">
        <div>
          <div className="subsection-head" style={{ marginBottom: 2 }}>
            Tarot Package
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
            Text-derived format profile
          </span>
        </div>
        <span className="badge badge-seed">
          {profile.tarotCardCount} Tarot · {profile.distinctTarotCount} distinct
        </span>
      </div>

      {profile.entries.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
          Add Tarot cards to inspect targets, Arcana mix, suits, and
          text-derived effect categories.
        </p>
      ) : (
        <>
          {/* Summary metric chips */}
          <div className="core-summary-chips">
            <div className="core-chip">
              <span className="core-chip-label">Total Tarot</span>
              <span className="core-chip-val">{profile.tarotCardCount}</span>
            </div>
            <div className="core-chip">
              <span className="core-chip-label">Distinct</span>
              <span className="core-chip-val">{profile.distinctTarotCount}</span>
            </div>
            <div className="core-chip">
              <span className="core-chip-label">Major / 15 max</span>
              <span
                className="core-chip-val"
                style={{
                  color:
                    profile.majorArcanaCount > 15
                      ? 'var(--error)'
                      : 'var(--text-h)',
                }}
              >
                {profile.majorArcanaCount}
              </span>
            </div>
            <div className="core-chip">
              <span className="core-chip-label">Minor</span>
              <span className="core-chip-val">{profile.minorArcanaCount}</span>
            </div>
            <div className="core-chip">
              <span className="core-chip-label">Mode</span>
              <span className="core-chip-val">{profile.selectedMode}</span>
            </div>
          </div>

          {/* Arcana / suit readout */}
          <div style={{ marginTop: 12 }}>
            <div className="section-label">Arcana &amp; Suits</div>
            {SUIT_ORDER.map((suit) => {
              const sc = profile.suitCounts.find((s) => s.suit === suit)!;
              return (
                <div key={suit} className="demand-bar-wrap">
                  <span className="demand-clan" style={{ width: 100 }}>
                    <span
                      className="clan-dot"
                      style={{ background: SUIT_ACCENT[suit] }}
                    />
                    {SUIT_CATEGORY_LABELS[suit]}
                  </span>
                  <span className="demand-bar-track">
                    <span
                      className="demand-bar-fill"
                      style={{
                        width: `${(sc.count / maxSuit) * 100}%`,
                        background: SUIT_ACCENT[suit],
                      }}
                    />
                  </span>
                  <span className="demand-val">{sc.count}</span>
                </div>
              );
            })}
          </div>

          {/* Target profile */}
          <div style={{ marginTop: 12 }}>
            <div className="section-label">Target Profile</div>
            {TARGET_ORDER.map((target) => {
              const tc = profile.targetCounts.find((t) => t.target === target)!;
              return (
                <div key={target} className="demand-bar-wrap">
                  <span className="demand-clan" style={{ width: 100 }}>
                    {TARGET_LABELS[target]}
                  </span>
                  <span className="demand-bar-track">
                    <span
                      className="demand-bar-fill"
                      style={{
                        width: `${(tc.count / maxTarget) * 100}%`,
                        background: 'var(--text-dim)',
                      }}
                    />
                  </span>
                  <span className="demand-val">{tc.count}</span>
                </div>
              );
            })}
          </div>

          {/* Effect categories */}
          <div style={{ marginTop: 12 }}>
            <div className="section-label">Effect Categories</div>
            <div className="tarot-tag-list">
              {visibleTagCounts.map((tc) => (
                <div key={tc.tag} className="tarot-tag-row">
                  <span className="tarot-tag-name">
                    {TAROT_TAG_LABELS[tc.tag as TarotEffectTag]}
                  </span>
                  <span className="tarot-tag-count">{tc.count}</span>
                </div>
              ))}
            </div>
            <button
              className="creature-entry-toggle"
              onClick={() => setShowAllTags((s) => !s)}
              aria-expanded={showAllTags}
            >
              {showAllTags ? 'Show non-zero only' : 'Show all categories'}
            </button>
            <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>
              These are direct text classifications, not power ratings.
            </p>
          </div>

          {/* Format warnings */}
          {profile.formatWarnings.length > 0 && (
            <div className="issue-list" style={{ marginTop: 8 }}>
              {profile.formatWarnings.map((w, i) => (
                <div key={i} className="issue issue-warning">
                  <span className="issue-icon">!</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Format notes */}
          {profile.formatNotes.length > 0 && (
            <div className="issue-list" style={{ marginTop: 4 }}>
              {profile.formatNotes.map((n, i) => (
                <div key={i} className="issue issue-info">
                  <span className="issue-icon">i</span>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          )}

          {/* Analysis notes */}
          {profile.analysisNotes.length > 0 && (
            <div className="issue-list" style={{ marginTop: 4 }}>
              {profile.analysisNotes.map((n, i) => (
                <div key={i} className="issue issue-warning">
                  <span className="issue-icon">!</span>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          )}

          {/* Factual summary */}
          <div className="core-summary-lines" style={{ marginTop: 10 }}>
            {profile.factualSummary.map((line, i) => (
              <p
                key={i}
                style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, marginBottom: 3 }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Included Tarot list */}
          <div style={{ marginTop: 10 }}>
            <button
              className="creature-entry-toggle"
              onClick={() => setShowIncluded((s) => !s)}
              aria-expanded={showIncluded}
              aria-controls="tarot-included-list"
            >
              {showIncluded ? 'Hide included Tarot' : 'Show included Tarot'}
            </button>
            {showIncluded && (
              <div id="tarot-included-list" className="creature-core-entries" style={{ marginTop: 6 }}>
                {profile.entries.map((entry) => (
                  <TarotEntryCard key={entry.cardId} entry={entry} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TarotEntryCard({ entry }: { entry: TarotCardAnalysis }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="creature-entry-card">
      <div className="creature-entry-header">
        <span className="creature-entry-id">{entry.cardNumber}</span>
        <span className="creature-entry-name">{entry.name}</span>
        <span className="creature-entry-total">{entry.quantity}x</span>
      </div>
      <div className="creature-entry-reqs">
        <span className="req-side">
          {entry.arcanaType === 'major' ? 'Major' : 'Minor'}
          {entry.suit ? ` · ${SUIT_CATEGORY_LABELS[entry.suit]}` : ''}
        </span>
        <span className="req-side">· {TARGET_LABELS[entry.targetType]}</span>
      </div>
      <button
        className="creature-entry-toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={`tarot-detail-${entry.cardId}`}
      >
        {expanded ? 'Hide details' : 'Show details'}
      </button>
      {expanded && (
        <div id={`tarot-detail-${entry.cardId}`} className="creature-entry-detail">
          <div className="creature-detail-row">
            <span className="creature-detail-label">Effect</span>
            <span className="creature-detail-val">{entry.effectText}</span>
          </div>
          <div className="creature-detail-row">
            <span className="creature-detail-label">Categories</span>
            <span className="creature-detail-val">
              {entry.derivedTags.map((t) => TAROT_TAG_LABELS[t]).join(', ')}
            </span>
          </div>
          {entry.formatNotes.length > 0 && (
            <div className="creature-detail-row">
              <span className="creature-detail-label">Format</span>
              <span className="creature-detail-val">
                {entry.formatNotes.join(' ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
