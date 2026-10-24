import React, { useState, useEffect, useRef } from 'react';
import { Lap } from '../types';
import { pad } from '../constants/data';

function fmtSW(ms: number) {
  const cs = Math.floor(ms / 10) % 100;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const main = h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  return { main, cs: pad(cs) };
}

export const StopwatchTab: React.FC = () => {
  const [running, setRunning] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [laps, setLaps] = useState<Lap[]>([]);

  const baseRef = useRef<number>(0);
  const t0Ref = useRef<number>(0);
  const lastLapRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const current = baseRef.current + (now - t0Ref.current);
      setElapsed(current);
      rafRef.current = requestAnimationFrame(loop);
    };

    if (running) {
      t0Ref.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(rafRef.current);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  const handleStartStop = () => {
    if (running) {
      baseRef.current += performance.now() - t0Ref.current;
      setRunning(false);
    } else {
      setRunning(true);
    }
  };

  const handleLap = () => {
    if (!running) return;
    const now = baseRef.current + (performance.now() - t0Ref.current);
    const split = now - lastLapRef.current;
    lastLapRef.current = now;
    setLaps((prev) => [...prev, { split, total: now }]);
  };

  const handleReset = () => {
    setRunning(false);
    baseRef.current = 0;
    lastLapRef.current = 0;
    setElapsed(0);
    setLaps([]);
  };

  const { main, cs } = fmtSW(elapsed);

  // Fastest and slowest calculation (only when >= 3 laps)
  let bestIdx = -1;
  let worstIdx = -1;
  if (laps.length >= 3) {
    let minSplit = Infinity;
    let maxSplit = -1;
    laps.forEach((l, i) => {
      if (l.split < minSplit) {
        minSplit = l.split;
        bestIdx = i;
      }
      if (l.split > maxSplit) {
        maxSplit = l.split;
        worstIdx = i;
      }
    });
  }

  return (
    <section id="tab-stopwatch">
      <div className="split">
        <div className="card">
          <div className="eyebrow">Stopwatch</div>
          <div className="sw-read">
            {main}
            <small>.{cs}</small>
          </div>
          <div className="ctrls">
            <button className="btn primary" type="button" onClick={handleStartStop}>
              {running ? 'Stop' : baseRef.current > 0 ? 'Resume' : 'Start'}
            </button>
            <button className="btn" type="button" onClick={handleLap} disabled={!running}>
              Lap
            </button>
            <button
              className="btn"
              type="button"
              onClick={handleReset}
              disabled={!(running || baseRef.current > 0 || laps.length > 0)}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Laps</h2>
            <span className="muted" style={{ fontSize: '.85rem' }}>
              {laps.length ? `${laps.length} ${laps.length === 1 ? 'lap' : 'laps'}` : ''}
            </span>
          </div>

          {laps.length === 0 ? (
            <p className="empty">Press Lap to log a question or section. Splits show here.</p>
          ) : (
            <ul className="laps">
              {laps
                .map((l, i) => {
                  const sFmt = fmtSW(l.split);
                  const tFmt = fmtSW(l.total);
                  const isBest = i === bestIdx;
                  const isWorst = i === worstIdx;

                  return (
                    <li key={i}>
                      <span className="muted mono">#{i + 1}</span>
                      <span className="mono">
                        {sFmt.main}.{sFmt.cs}
                      </span>
                      <span className="mono muted">
                        {tFmt.main}.{tFmt.cs}
                      </span>
                      {isBest ? (
                        <span className="pill good">Fastest</span>
                      ) : isWorst ? (
                        <span className="pill warn">Slowest</span>
                      ) : (
                        <span />
                      )}
                    </li>
                  );
                })
                .reverse()}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
