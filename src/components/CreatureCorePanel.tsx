import { useState } from 'react';
import type { Clan, CreatureCoreEntry, CreatureCoreProfile } from '../types/totym';
import { CLAN_COLORS, CLAN_LABELS } from '../lib/labels';

interface Props {
  profile: CreatureCoreProfile;
}

const CLAN_ORDER: Clan[] = ['berserkers', 'druids', 'bards', 'zealots', 'mystics'];

export default function CreatureCorePanel({ profile }: Props) {
  const statusPill = () => {
    if (profile.hasDuplicateCreatures) return 'Duplicate Creature';
    if (profile.isComplete) return 'Complete';
    return `${profile.selectedCreatureCount} / 5 selected`;
  };

  const statusPillClass = profile.hasDuplicateCreatures
    ? 'badge'
    : profile.isComplete
      ? 'badge badge-gold'
      : 'badge badge-seed';

  const maxDemand = Math.max(1, ...profile.clanDemand.map((cd) => cd.required));

  return (
    <div className="subsection">
      <div className="creature-core-head">
        <div>
          <div className="subsection-head" style={{ marginBottom: 2 }}>
            Creature Core
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
            Factual requirement profile
          </span>
        </div>
        <span className={statusPillClass}>{statusPill()}</span>
      </div>

      {profile.entries.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
          Add Creature cards to inspect their exact left/right Worship
          requirements, Blessings, and Immunities.
        </p>
      ) : (
        <>
          {/* Creature entries */}
          <div className="creature-core-entries">
            {profile.entries.map((entry) => (
              <CreatureEntryCard key={entry.cardId} entry={entry} />
            ))}
          </div>

          {/* Worship demand visualization */}
          <div style={{ marginTop: 12 }}>
            <div className="section-label">Worship Demand</div>
            {CLAN_ORDER.map((clan) => {
              const demand = profile.clanDemand.find(
                (cd) => cd.clan === clan,
              )!;
              return (
                <div key={clan} className="demand-bar-wrap">
                  <span className="demand-clan">
                    <span
                      className="clan-dot"
                      style={{ background: CLAN_COLORS[clan] }}
                    />
                    {CLAN_LABELS[clan]}
                  </span>
                  <span className="demand-bar-track">
                    <span
                      className="demand-bar-fill"
                      style={{
                        width: `${(demand.required / maxDemand) * 100}%`,
                        background: CLAN_COLORS[clan],
                      }}
                    />
                  </span>
                  <span className="demand-val">{demand.required}</span>
                </div>
              );
            })}
          </div>

          {/* Summary chips */}
          <div className="core-summary-chips" style={{ marginTop: 12 }}>
            <div className="core-chip">
              <span className="core-chip-label">Total Worship</span>
              <span className="core-chip-val">{profile.totalWorshipRequired}</span>
            </div>
            <div className="core-chip">
              <span className="core-chip-label">Clans used</span>
              <span className="core-chip-val">{profile.uniqueClanCount}</span>
            </div>
            <div className="core-chip">
              <span className="core-chip-label">Highest demand</span>
              <span className="core-chip-val">
                {profile.mostDemandedClans
                  .map((cd) => CLAN_LABELS[cd.clan])
                  .join(', ') || '—'}
              </span>
            </div>
            <div className="core-chip">
              <span className="core-chip-label">Lowest active</span>
              <span className="core-chip-val">
                {profile.leastDemandedClans
                  .map((cd) => CLAN_LABELS[cd.clan])
                  .join(', ') || '—'}
              </span>
            </div>
            <div className="core-chip core-chip-wide">
              <span className="core-chip-label">Requirement profile</span>
              <span className="core-chip-val">
                {profile.requirementProfile === 'incomplete'
                  ? 'Incomplete'
                  : profile.requirementProfile === 'concentrated'
                    ? 'Concentrated'
                    : profile.requirementProfile === 'mixed'
                      ? 'Mixed'
                      : 'Broad'}
              </span>
            </div>
          </div>

          {/* Summary lines */}
          <div className="core-summary-lines" style={{ marginTop: 10 }}>
            {profile.summary.map((line, i) => (
              <p key={i} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, marginBottom: 3 }}>
                {line}
              </p>
            ))}
          </div>

          {/* Warnings */}
          {profile.warnings.length > 0 && (
            <div className="issue-list" style={{ marginTop: 8 }}>
              {profile.warnings.map((w, i) => (
                <div key={i} className="issue issue-warning">
                  <span className="issue-icon">!</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Contextual note */}
          <p
            style={{
              fontSize: 11,
              color: 'var(--text-dim)',
              fontStyle: 'italic',
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            Creature requirements are factual card data. Distribution labels
            describe clan concentration only and are not deck-strength ratings.
          </p>
        </>
      )}
    </div>
  );
}

function CreatureEntryCard({ entry }: { entry: CreatureCoreEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="creature-entry-card">
      <div className="creature-entry-header">
        <span className="creature-entry-id">{entry.cardNumber}</span>
        <span className="creature-entry-name">{entry.name}</span>
        <span className="creature-entry-total">
          {entry.totalRequired} Worship
        </span>
      </div>
      <div className="creature-entry-reqs">
        <span className="req-side">
          <span
            className="clan-dot"
            style={{ background: CLAN_COLORS[entry.left.clan] }}
          />
          {CLAN_LABELS[entry.left.clan]} {entry.left.required}
        </span>
        <span className="req-side">
          <span
            className="clan-dot"
            style={{ background: CLAN_COLORS[entry.right.clan] }}
          />
          {CLAN_LABELS[entry.right.clan]} {entry.right.required}
        </span>
      </div>
      <button
        className="creature-entry-toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={`creature-detail-${entry.cardId}`}
      >
        {expanded ? 'Hide details' : 'Show details'}
      </button>
      {expanded && (
        <div
          id={`creature-detail-${entry.cardId}`}
          className="creature-entry-detail"
        >
          <div className="creature-detail-row">
            <span className="creature-detail-label">Blessing</span>
            <span className="creature-detail-val">{entry.blessing}</span>
          </div>
          <div className="creature-detail-row">
            <span className="creature-detail-label">Immunity</span>
            <span className="creature-detail-val">{entry.immunity}</span>
          </div>
        </div>
      )}
    </div>
  );
}
