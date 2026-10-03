import { assetUrl } from './urls';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Globe2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Layers3,
  ArrowUpRight,
  X,
  MoveUpRight,
  ChevronDown,
  Crosshair,
  Info,
  Keyboard,
  ArrowRight,
  LoaderCircle,
} from 'lucide-react';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import GlobeView from './GlobeView';
import type { Manifest, Snapshot, Territory } from './types';
import {
  START_YEAR,
  END_YEAR,
  clampYear,
  snapshotForYear,
  adjacentSnapshot,
  advanceTime,
  nearestSnapshot,
} from './timeline.mjs';

async function json<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
  return response.json();
}
const SPEEDS = [0.5, 1, 4, 12];
const formatYear = (year: number) => String(Math.floor(year));

export default function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [land, setLand] = useState<Feature<Polygon | MultiPolygon>[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [year, setYear] = useState(1880);
  const [yearDraft, setYearDraft] = useState('1880');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [borders, setBorders] = useState(true);
  const [panel, setPanel] = useState<'sources' | 'layers' | 'help' | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedYear, setLoadedYear] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef(new Map<number, Territory[]>());
  const yearRef = useRef(year);
  const timeline = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const snapshot = useMemo<Snapshot | null>(
    () => (manifest ? snapshotForYear(manifest.snapshots, year) : null),
    [manifest, Math.floor(year)],
  );
  const yearInteger = Math.floor(year);
  useEffect(() => setYearDraft(String(yearInteger)), [yearInteger]);
  useEffect(() => {
    yearRef.current = year;
  }, [year]);
  const boot = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      json<Manifest>(assetUrl('data/manifest.json')),
      json<{ features: Feature<Polygon | MultiPolygon>[] }>(assetUrl('data/land.geojson')),
    ])
      .then(([m, l]) => {
        setManifest(m);
        setLand(l.features);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);
  useEffect(boot, [boot]);
  useEffect(() => {
    if (!manifest) return;
    const abort = new AbortController();
    setHover(null);
    setFocus(null);
    setError(null);
    if (!snapshot) {
      setTerritories([]);
      setLoadedYear(null);
      setLoading(false);
      return () => abort.abort();
    }
    const cached = cache.current.get(snapshot.year);
    if (cached) {
      setTerritories(cached);
      setLoadedYear(snapshot.year);
      setLoading(false);
      return () => abort.abort();
    }
    // Clear stale territory while a new date loads: mismatched date/geometry is never shown.
    setTerritories([]);
    setLoadedYear(null);
    setLoading(true);
    json<{ features: Territory[] }>(assetUrl(`data/${snapshot.file}`), abort.signal)
      .then((data) => {
        cache.current.set(snapshot.year, data.features);
        setTerritories(data.features);
        setLoadedYear(snapshot.year);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setError(e.message);
          setLoading(false);
          setPlaying(false);
        }
      });
    return () => abort.abort();
  }, [manifest, snapshot]);
  useEffect(() => {
    if (!manifest || !snapshot) return;
    const next =
      manifest.snapshots[manifest.snapshots.findIndex((s) => s.year === snapshot.year) + 1];
    if (next && !cache.current.has(next.year))
      json<{ features: Territory[] }>(assetUrl(`data/${next.file}`))
        .then((d) => cache.current.set(next.year, d.features))
        .catch(() => {});
  }, [manifest, snapshot]);
  useEffect(() => {
    if (!playing || loading || !ready) return;
    let frame: number;
    let previous = 0;
    const tick = (time: number) => {
      if (previous) {
        // Hidden tabs do not cause a jump on return.
        const delta = Math.min((time - previous) / 1000, 0.1);
        const next = advanceTime(yearRef.current, delta, speed);
        yearRef.current = next;
        setYear(next);
        if (next >= END_YEAR) {
          setPlaying(false);
          return;
        }
      }
      previous = time;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, loading, ready]);
  const seek = useCallback((value: number) => {
    const next = clampYear(value);
    setPlaying(false);
    yearRef.current = next;
    setYear(next);
  }, []);
  const step = useCallback(
    (direction: number) => {
      if (!manifest) return;
      const next = adjacentSnapshot(manifest.snapshots, yearRef.current, direction);
      if (next !== null) seek(next);
    },
    [manifest, seek],
  );
  const togglePlayback = useCallback(() => {
    if (error || !ready || loading) return;
    if (yearRef.current >= END_YEAR) {
      yearRef.current = START_YEAR;
      setYear(START_YEAR);
    }
    setPlaying((p) => !p);
  }, [error, ready, loading]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('input, select, textarea, button, dialog')
      )
        return;
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayback();
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        seek(yearRef.current + (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1));
      }
      if (event.key === '[') step(-1);
      if (event.key === ']') step(1);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [seek, step, togglePlayback]);
  useEffect(() => {
    const element = timeline.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const factor = event.deltaMode === 1 ? 10 : event.deltaMode === 2 ? 100 : 1;
      seek(yearRef.current + amount * factor * (event.shiftKey ? 0.25 : 0.04));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [seek]);
  useEffect(() => {
    if (panel) {
      if (!dialog.current?.open) dialog.current?.showModal();
    } else if (dialog.current?.open) dialog.current.close();
  }, [panel]);
  const onReady = useCallback(() => setReady(true), []);
  const distinct = useMemo(() => {
    const order = ['usa', 'canada', 'mexico', 'hawaii', 'newfoundland'];
    return territories
      .filter((f, i, all) => all.findIndex((a) => a.properties.id === f.properties.id) === i)
      .sort((a, b) => order.indexOf(a.properties.id) - order.indexOf(b.properties.id));
  }, [territories]);
  const progress = ((year - START_YEAR) / (END_YEAR - START_YEAR)) * 100;
  const available = manifest?.snapshots.map((s) => s.year) ?? [];
  const previousDisabled = !manifest || adjacentSnapshot(manifest.snapshots, year, -1) === null;
  const nextDisabled = !manifest || adjacentSnapshot(manifest.snapshots, year, 1) === null;
  const currentSources =
    manifest?.sources.filter((s) => territories.some((f) => f.properties.sourceId === s.id)) ?? [];
  return (
    <main
      className="app"
      data-playing={playing}
      data-loaded-year={loadedYear ?? ''}
      data-loading={loading}
      data-error={error ?? ''}
      data-year={yearInteger}
      data-coverage={snapshot ? 'snapshot' : 'gap'}
    >
      <header className="topbar">
        <a className="brand" href={assetUrl('')} aria-label="World Borders home">
          <span className="brand-icon">
            <Globe2 size={25} strokeWidth={1.3} />
          </span>
          <span>
            WORLD <b>BORDERS</b>
          </span>
        </a>
        <div className="region-tag">
          <span className="tiny-dot" /> NORTH AMERICA <span className="pilot-tag">PILOT</span>
        </div>
        <button className="sources-button" onClick={() => setPanel('sources')}>
          Sources & coverage <ArrowUpRight size={14} />
        </button>
      </header>
      <section className="globe-stage" aria-label="Historical globe">
        <div className="space-glow" />
        <div className="orbit-ring ring-one" />
        <div className="orbit-ring ring-two" />
        {land.length > 0 && (
          <GlobeView
            territories={territories}
            land={land}
            resetToken={resetToken}
            focus={focus}
            borders={borders}
            onHover={setHover}
            onReady={onReady}
          />
        )}
        <aside className="date-panel">
          <div className="eyebrow">
            <span className="short-line" /> THROUGH TIME
          </div>
          <div className="year-display" aria-live={playing ? 'off' : 'polite'}>
            {formatYear(year)}
            <span>CE</span>
          </div>
          <div className="coverage-status">
            <span className={snapshot ? 'status-dot' : 'status-dot dim'} />
            {loading
              ? 'Loading borders'
              : snapshot
                ? 'Sourced snapshot'
                : 'No snapshot for this year'}
          </div>
          <div className="date-rule" />
          {snapshot && !loading && (
            <>
              <div className="legend-title">TERRITORIES</div>
              <div className="territory-legend">
                {distinct.map((f) => (
                  <button
                    key={f.properties.id}
                    className={focus === f.properties.id ? 'legend-item selected' : 'legend-item'}
                    onClick={() => setFocus(focus === f.properties.id ? null : f.properties.id)}
                    aria-pressed={focus === f.properties.id}
                    title={`Highlight ${f.properties.name}`}
                  >
                    <span style={{ background: f.properties.color }} />
                    {f.properties.name}
                  </button>
                ))}
              </div>
              <button className="precision-note" onClick={() => setPanel('sources')}>
                <Info size={12} /> Generalized boundaries
              </button>
              {yearInteger < 1880 && (
                <div className="claim-note">Territorial claims · control unverified</div>
              )}
            </>
          )}
          {!snapshot && !loading && manifest && (
            <button
              className="nearest-button"
              onClick={() => {
                const next = nearestSnapshot(manifest.snapshots, year);
                if (next !== null) seek(next);
              }}
            >
              View nearest snapshot <ArrowRight size={14} />
            </button>
          )}
        </aside>
        <div className="globe-tools">
          <button
            aria-label="Reset North America view"
            title="Reset North America view"
            onClick={() => setResetToken((n) => n + 1)}
          >
            <Crosshair size={18} />
          </button>
          <button
            aria-label="Open layer controls"
            title="Layers"
            onClick={() => setPanel('layers')}
          >
            <Layers3 size={18} />
          </button>
          <span />
          <button
            aria-label="Open keyboard shortcuts"
            title="Controls"
            onClick={() => setPanel('help')}
          >
            <Keyboard size={18} />
          </button>
        </div>
        <div className="globe-caption">
          <span className="caption-cross">+</span>
          {hover ?? 'DRAG TO ORBIT'}
          <span className="caption-separator" />
          SCROLL TO ZOOM
        </div>
        {(!ready || loading) && !error && (
          <div className="loading-indicator" role="status">
            <LoaderCircle size={17} className="spin" />
            {!ready ? 'Preparing globe' : 'Loading borders'}
          </div>
        )}
        {error && (
          <div className="error-box" role="alert">
            <p>{error}</p>
            <button onClick={boot}>Retry loading</button>
          </div>
        )}
      </section>
      <footer className="timeline-panel">
        <div className="timeline-topline">
          <div className="timeline-heading">
            <span className="tiny-dot" /> THE TIMELINE{' '}
            <span className="range-caption">1776 — PRESENT</span>
          </div>
          <div className="snapshot-caption">
            {available.length} sourced snapshots{' '}
            <button aria-label="Show historical coverage" onClick={() => setPanel('sources')}>
              <Info size={13} />
            </button>
          </div>
        </div>
        <div className="timeline" ref={timeline} aria-label="Scrollable historical timeline">
          <div className="timeline-track">
            <div className="timeline-progress" style={{ width: `${progress}%` }} />
            {available.map((y) => (
              <button
                key={y}
                className={`snapshot-tick ${y === yearInteger ? 'active' : ''}`}
                style={{ left: `${((y - START_YEAR) / (END_YEAR - START_YEAR)) * 100}%` }}
                title={`View ${y} snapshot`}
                aria-label={`View ${y} snapshot`}
                onClick={() => seek(y)}
              >
                <span />
              </button>
            ))}
            <div className="timeline-playhead" style={{ left: `${progress}%` }}>
              <span>{yearInteger}</span>
              <i />
            </div>
          </div>
          <input
            className="timeline-input"
            type="range"
            min={START_YEAR}
            max={END_YEAR}
            step="0.1"
            value={year}
            onChange={(e) => seek(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                seek(Math.floor(year) + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 10 : 1));
              }
            }}
            aria-label="Timeline year"
            aria-valuetext={`${yearInteger}${snapshot ? ', sourced snapshot' : ', no snapshot available'}`}
          />
          <div className="timeline-labels">
            {[1776, 1800, 1850, 1900, 1950, 2000, 2026].map((y) => (
              <span
                key={y}
                style={{ left: `${((y - START_YEAR) / (END_YEAR - START_YEAR)) * 100}%` }}
              >
                {y === 2026 ? 'PRESENT' : y}
              </span>
            ))}
          </div>
        </div>
        <div className="playback-row">
          <div className="playback-controls">
            <button
              className="step-button"
              aria-label="Previous snapshot"
              title="Previous snapshot ["
              onClick={() => step(-1)}
              disabled={previousDisabled}
            >
              <SkipBack size={16} />
            </button>
            <button
              className="play-button"
              aria-label={playing ? 'Pause timeline' : 'Play timeline'}
              title="Play or pause (Space)"
              onClick={togglePlayback}
              disabled={!ready || loading || !!error}
            >
              {playing ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" />
              )}
            </button>
            <button
              className="step-button"
              aria-label="Next snapshot"
              title="Next snapshot ]"
              onClick={() => step(1)}
              disabled={nextDisabled}
            >
              <SkipForward size={16} />
            </button>
            <span className="control-divider" />
            <label className="speed-control">
              <span className="sr-only">Playback speed</span>
              <select
                aria-label="Playback speed"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                {SPEEDS.map((s) => (
                  <option value={s} key={s}>
                    {s} yr/s
                  </option>
                ))}
              </select>
              <ChevronDown size={12} />
            </label>
          </div>
          <div className="scrub-hint">
            Scroll or drag to travel through time <MoveUpRight size={13} />
          </div>
          <label className="jump-to">
            <span>JUMP TO</span>
            <input
              aria-label="Jump to year"
              type="number"
              min={START_YEAR}
              max={END_YEAR}
              value={yearDraft}
              onFocus={() => setPlaying(false)}
              onChange={(e) => setYearDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              onBlur={() => {
                const value = Number(yearDraft);
                if (yearDraft && Number.isFinite(value)) {
                  const next = Math.floor(clampYear(value));
                  seek(next);
                  setYearDraft(String(next));
                } else setYearDraft(String(yearInteger));
              }}
            />
          </label>
        </div>
      </footer>
      <dialog
        ref={dialog}
        className="detail-dialog"
        onCancel={() => setPanel(null)}
        onClose={() => setPanel(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setPanel(null);
        }}
      >
        <div className="dialog-body">
          <div className="dialog-top">
            <span className="eyebrow">WORLD BORDERS</span>
            <button aria-label="Close panel" onClick={() => setPanel(null)}>
              <X size={20} />
            </button>
          </div>
          {panel === 'sources' && (
            <>
              <h2>Sources & coverage</h2>
              <p className="dialog-intro">
                {available.length} historical snapshots. No borders are inferred for the years
                between them.
              </p>
              <div className="coverage-years">
                {available.map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      seek(y);
                      setPanel(null);
                    }}
                    className={y === yearInteger ? 'current' : ''}
                  >
                    {y}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
              <div className="data-notice">
                <Info size={16} />
                <p>
                  1880 Canada and Newfoundland use official historical polygons. Other territories
                  use generalized reference geometry and still need independent boundary review.
                  Early colonial shapes represent claims, not established effective control.
                </p>
              </div>
              {snapshot && (
                <div className="current-snapshot">
                  <h3>Current snapshot · {snapshot.year}</h3>
                  <p>{currentSources.map((s) => s.name).join(' + ') || 'Loading source details'}</p>
                  {snapshot.corrections.map((c) => (
                    <p key={c}>{c}</p>
                  ))}
                </div>
              )}
              {manifest?.sources.map((s) => (
                <a key={s.id} className="source-card" href={s.url} target="_blank" rel="noreferrer">
                  <div>
                    <h3>
                      {s.name} <ArrowUpRight size={14} />
                    </h3>
                    <span>
                      {s.author} · {s.license}
                    </span>
                    <p>{s.note}</p>
                  </div>
                </a>
              ))}
              <h3 className="limitations-heading">Pilot limits</h3>
              <ul className="limitations">
                {manifest?.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <div className="license-note">
                Application code: GPL-3.0. Data retains its source licenses.
              </div>
            </>
          )}
          {panel === 'layers' && (
            <>
              <h2>Layers</h2>
              <div className="layer-row">
                <div>
                  <h3>Territorial borders</h3>
                  <p>Outline the visible historical regions.</p>
                </div>
                <button
                  role="switch"
                  aria-checked={borders}
                  aria-label="Territorial borders"
                  className={`switch ${borders ? 'on' : ''}`}
                  onClick={() => setBorders((b) => !b)}
                >
                  <span />
                </button>
              </div>
              <div className="layer-row">
                <div>
                  <h3>Physical land</h3>
                  <p>Modern land context, always visible.</p>
                </div>
                <span className="fixed-label">ON</span>
              </div>
              <div className="layer-row muted">
                <div>
                  <h3>Disputed areas</h3>
                  <p>No verified dispute geometry in this pilot.</p>
                </div>
                <span className="fixed-label">PENDING</span>
              </div>
              <div className="layer-row muted">
                <div>
                  <h3>Internal & Indigenous boundaries</h3>
                  <p>Reserved for future independent layers.</p>
                </div>
                <span className="fixed-label">LATER</span>
              </div>
            </>
          )}
          {panel === 'help' && (
            <>
              <h2>Make your own orbit.</h2>
              <div className="shortcut-list">
                {[
                  ['Drag globe', 'Orbit camera'],
                  ['Scroll on globe', 'Zoom'],
                  ['Drag or scroll timeline', 'Scrub & pause'],
                  ['Space', 'Play / pause'],
                  ['← / →', 'Step one year'],
                  ['Shift + ← / →', 'Step ten years'],
                  ['[ / ]', 'Previous / next snapshot'],
                ].map(([a, b]) => (
                  <div key={a}>
                    <kbd>{a}</kbd>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <p className="dialog-intro">
                Playback changes time only. Your camera stays where you put it.
              </p>
              <button
                className="dialog-reset"
                onClick={() => {
                  setResetToken((n) => n + 1);
                  setPanel(null);
                }}
              >
                <RotateCcw size={15} /> Reset North America view
              </button>
            </>
          )}
        </div>
      </dialog>
    </main>
  );
}
