import { useRef, useState } from 'react';
import type { CatalogImportResult } from '../lib/catalogValidator';
import { parseCatalogJsonFile } from '../lib/catalogImport';
import { validateImportedCatalog } from '../lib/catalogValidator';

interface Props {
  onClose: () => void;
  onApply: (cards: import('../types/totym').TotymCard[]) => void;
  onReturnToSeed: () => void;
}

export default function CatalogImportDialog({
  onClose,
  onApply,
  onReturnToSeed,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<CatalogImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    setResult(null);
    setBusy(true);
    try {
      const parsed = await parseCatalogJsonFile(file);
      const res = validateImportedCatalog(parsed);
      setResult(res);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setBusy(false);
    }
  };

  const handleApply = () => {
    if (result?.valid && result.cards) {
      onApply(result.cards);
    }
  };

  const handleReturnToSeed = () => {
    onReturnToSeed();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Import full catalog JSON"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">Import Full Catalog JSON</h3>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close catalog import dialog"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-dim)',
              lineHeight: 1.5,
              marginBottom: 14,
            }}
          >
            Upload the official local JSON export generated from
            Card-Details_Revised.xlsx. This replaces the seed catalog only for
            this browser session.
          </p>

          <div style={{ marginBottom: 12 }}>
            <label
              htmlFor="catalog-file-input"
              style={{
                fontSize: 12,
                color: 'var(--text-dim)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Select catalog JSON file (.json only)
            </label>
            <input
              id="catalog-file-input"
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              aria-label="Choose catalog JSON file"
              disabled={busy}
            />
          </div>

          {fileName && (
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 10 }}>
              Selected: <strong>{fileName}</strong>
            </div>
          )}

          {busy && (
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Validating…
            </p>
          )}

          {parseError && (
            <div className="dialog-error">{parseError}</div>
          )}

          {result && !result.valid && (
            <div className="subsection" style={{ marginTop: 10 }}>
              <div
                className="subsection-head"
                style={{ color: 'var(--error)' }}
              >
                Validation failed — {result.issues.length} issue
                {result.issues.length === 1 ? '' : 's'}
              </div>
              <div className="issue-list">
                {result.issues.slice(0, 50).map((issue, i) => (
                  <div key={i} className="issue issue-error">
                    <span className="issue-icon">✕</span>
                    <span>{issue.message}</span>
                  </div>
                ))}
                {result.issues.length > 50 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-dim)',
                      padding: '4px 10px',
                    }}
                  >
                    …and {result.issues.length - 50} more issues.
                  </div>
                )}
              </div>
            </div>
          )}

          {result && result.valid && (
            <div className="subsection" style={{ marginTop: 10 }}>
              <div
                className="status-card status-card-legal"
                style={{ marginBottom: 10 }}
              >
                <div className="status-head">
                  <span className="status-dot legal" />
                  <span className="status-title">
                    Full factual catalog loaded: 138 records. Session-only;
                    refresh returns to seed data.
                  </span>
                </div>
              </div>
              <div className="count-grid">
                <div className="count-row">
                  <span className="count-label">Total</span>
                  <span className="count-val" data-ok="true">
                    {result.counts.total}
                  </span>
                </div>
                <div className="count-row">
                  <span className="count-label">Creatures</span>
                  <span className="count-val" data-ok="true">
                    {result.counts.creatures}
                  </span>
                </div>
                <div className="count-row">
                  <span className="count-label">Tarot</span>
                  <span className="count-val" data-ok="true">
                    {result.counts.tarot}
                  </span>
                </div>
                <div className="count-row">
                  <span className="count-label">Major Arcana</span>
                  <span className="count-val" data-ok="true">
                    {result.counts.majorArcana}
                  </span>
                </div>
                <div className="count-row">
                  <span className="count-label">Minor Arcana</span>
                  <span className="count-val" data-ok="true">
                    {result.counts.minorArcana}
                  </span>
                </div>
                <div className="count-row">
                  <span className="count-label">Wands</span>
                  <span className="count-val" data-ok="true">
                    {result.counts.wands}
                  </span>
                </div>
                <div className="count-row">
                  <span className="count-label">Cups</span>
                  <span className="count-val" data-ok="true">
                    {result.counts.cups}
                  </span>
                </div>
                <div className="count-row">
                  <span className="count-label">Swords</span>
                  <span className="count-val" data-ok="true">
                    {result.counts.swords}
                  </span>
                </div>
                <div className="count-row">
                  <span className="count-label">Pentacles</span>
                  <span className="count-val" data-ok="true">
                    {result.counts.pentacles}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div
            className="dialog-actions"
            style={{ justifyContent: 'space-between' }}
          >
            <button
              className="btn btn-ghost"
              onClick={handleReturnToSeed}
              aria-label="Return to seed catalog"
            >
              Return to Seed Catalog
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-gold"
                onClick={handleApply}
                disabled={!result?.valid || busy}
              >
                Apply Catalog
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
