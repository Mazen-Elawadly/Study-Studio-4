import React, { useState } from 'react';
import { Paper, Subject } from '../types';
import {
  BOARD_NAME,
  CAIE_FILES,
  dKey,
  PL,
  PMT_FILES,
  PMT_PAGES,
  SCALE,
  applyBounds,
} from '../constants/data';

interface PastPapersTabProps {
  papers: Paper[];
  subjects: Subject[];
  onAddPaper: (p: Omit<Paper, 'id' | 'pts'>) => void;
  onDeletePaper: (id: string) => void;
  onUpdateSubjectBounds: (s: Subject) => void;
}

export function gradeFor(s: { board: string; bounds: { max: number; marks: (number | null)[] }; mark: number | null }) {
  const m = s.mark;
  if (m === null || m === undefined || isNaN(m)) return null;
  const sc = SCALE[s.board as keyof typeof SCALE] || [];
  const mk = s.bounds.marks;
  let i: number, j: number;
  for (i = 0; i < sc.length; i++) {
    if (mk[i] == null) continue;
    if (m >= mk[i]!) {
      j = i - 1;
      while (j >= 0 && mk[j] == null) j--;
      return {
        grade: sc[i],
        idx: i,
        next: j >= 0 ? mk[j]! - m : null,
        nextName: j >= 0 ? sc[j] : null,
      };
    }
  }
  for (i = sc.length - 1; i >= 0; i--) {
    if (mk[i] != null) {
      return { grade: 'U', idx: sc.length, next: mk[i]! - m, nextName: sc[i] };
    }
  }
  return { grade: 'U', idx: sc.length, next: null, nextName: null };
}

export const PastPapersTab: React.FC<PastPapersTabProps> = ({
  papers,
  subjects,
  onAddPaper,
  onDeletePaper,
  onUpdateSubjectBounds,
}) => {
  const [subTab, setSubTab] = useState<'pp-log' | 'pp-grades' | 'pp-links'>('pp-log');

  // Log form state
  const [logSubjId, setLogSubjId] = useState<string>(subjects[0]?.id || '');
  const [logName, setLogName] = useState<string>('');
  const [logDate, setLogDate] = useState<string>(dKey());
  const [logMark, setLogMark] = useState<string>('');
  const [logTotal, setLogTotal] = useState<number>(80);
  const [logMsg, setLogMsg] = useState<string>('');

  // Past paper links state
  const [plSubjId, setPlSubjId] = useState<string>('c-phys');
  const [selectedPapers, setSelectedPapers] = useState<string[]>(['2', '4', '6']);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const activeSubj = subjects.find((s) => s.id === logSubjId) || subjects[0];

  const handleLogPaper = () => {
    if (!activeSubj) {
      setLogMsg('Add a subject first.');
      return;
    }
    const markNum = parseFloat(logMark);
    if (!(logTotal > 0)) {
      setLogMsg('Enter the total marks.');
      return;
    }
    if (isNaN(markNum) || markNum < 0 || markNum > logTotal) {
      setLogMsg(`Your mark must be between 0 and ${logTotal}.`);
      return;
    }
    if (logDate > dKey()) {
      setLogMsg('Pick today or an earlier date.');
      return;
    }

    onAddPaper({
      sid: activeSubj.id,
      subj: activeSubj.name,
      name: logName.trim() || 'Past paper',
      date: logDate || dKey(),
      mark: markNum,
      total: logTotal,
    });
    setLogName('');
    setLogMark('');
    const pct = logTotal > 0 ? (markNum / logTotal) * 100 : 0;
    const pts = 10 + Math.round(pct / 5);
    setLogMsg(`Logged. +${pts} points.`);
  };

  // Grade helper for paper item
  const getPaperGrade = (p: Paper) => {
    const s = subjects.find((x) => x.id === p.sid);
    if (!s || !s.bounds) return null;
    const pct = p.total > 0 ? (p.mark / p.total) * 100 : 0;
    const markEquiv = Math.round((pct / 100) * s.bounds.max);
    const g = gradeFor({ board: s.board, bounds: s.bounds, mark: markEquiv });
    return g ? g.grade : null;
  };

  // Past paper link generation helpers
  const currentPlItem = PL.find((x) => x.id === plSubjId) || PL[0];

  const handleSelectPlSubject = (id: string) => {
    const s = PL.find((x) => x.id === id) || PL[0];
    setPlSubjId(s.id);
    setSelectedPapers((s.def || []).slice());
    setSelectedYear('all');
  };

  const togglePaperVariant = (pNum: string) => {
    setSelectedPapers((prev) =>
      prev.includes(pNum)
        ? prev.length > 1
          ? prev.filter((x) => x !== pNum)
          : prev
        : [...prev, pNum]
    );
  };

  const getPlGroups = (sj: typeof currentPlItem) => {
    const cy = new Date().getFullYear();
    const now = new Date();
    const g: { y: string; yy?: string; rows: any[] }[] = [];

    if (sj.kind === 'caie') {
      for (let y = cy; y >= 2016; y--) {
        const rows: { k: string; m: string }[] = [];
        [
          ['w', 'Oct/Nov'],
          ['s', 'May/June'],
          ['m', 'Feb/March'],
        ].forEach((s) => {
          if (y === cy && s[0] === 'w' && now.getMonth() < 11) return;
          rows.push({ k: s[0], m: s[1] });
        });
        g.push({ y: String(y), yy: String(y).slice(2), rows });
      }
      return g;
    }

    const L: any[] = [];
    if (sj.kind === 'em') {
      for (let y = 2012; y <= 2023; y++) {
        L.push({ y, m: 'January', std: `January ${y}`, r: y >= 2014 ? `January ${y} (R)` : null, ma: y >= 2019 });
      }
      for (let y = 2011; y <= 2025; y++) {
        L.push({ y, m: 'June', std: `June ${y}`, r: y >= 2013 && y !== 2021 ? `June ${y} (R)` : null, ma: y >= 2018 && y <= 2023 });
      }
      L.push({ y: 2021, m: 'November', std: 'November 2021', r: null, ma: false });
      L.push({ y: 'Specimen', m: 'Specimen', std: 'Specimen', r: null, ma: true });
    } else {
      for (let y = 2020; y <= 2023; y++) {
        L.push({ y, m: 'January', std: `January ${y}`, r: `January ${y} (R)` });
      }
      for (let y = 2019; y <= 2025; y++) {
        L.push({ y, m: 'June', std: `June ${y}`, r: y !== 2021 ? `June ${y} (R)` : null });
      }
      if (sj.nov20) {
        L.push({ y: 2020, m: 'November', std: 'November 2020', r: 'November 2020 (R)' });
      }
      L.push({ y: 2021, m: 'November', std: 'November 2021', r: null });
      L.push({ y: 2017, m: 'Specimen', std: 'Specimen 2017', r: null });
    }

    const map: Record<string, any[]> = {};
    const order = ['January', 'June', 'November', 'Specimen'];
    L.forEach((r) => {
      const k = String(r.y);
      if (!map[k]) map[k] = [];
      map[k].push(r);
    });

    return Object.keys(map)
      .sort((a, b) => {
        const na = +a;
        const nb = +b;
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        return nb - na;
      })
      .map((k) => ({
        y: k,
        rows: map[k].sort((a, b) => order.indexOf(a.m) - order.indexOf(b.m)),
      }));
  };

  const plGroupsList = getPlGroups(currentPlItem);
  const shownGroups = plGroupsList.filter((g) => selectedYear === 'all' || g.y === selectedYear);

  return (
    <section id="tab-papers">
      <div className="subnav" role="group" aria-label="Past papers sections">
        <button
          type="button"
          className="chip"
          aria-pressed={subTab === 'pp-log'}
          onClick={() => setSubTab('pp-log')}
        >
          Log papers
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={subTab === 'pp-grades'}
          onClick={() => setSubTab('pp-grades')}
        >
          Grade boundaries
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={subTab === 'pp-links'}
          onClick={() => setSubTab('pp-links')}
        >
          Past paper links
        </button>
      </div>

      {/* Subpanel 1: Log Papers */}
      {subTab === 'pp-log' && (
        <div className="subpanel" id="pp-log">
          <div className="split">
            <div className="col">
              <div className="card">
                <div className="card-head">
                  <h2>Log a past paper</h2>
                </div>
                <div className="row">
                  <label className="field" htmlFor="pSubj">
                    Subject
                    <select
                      className="sel"
                      id="pSubj"
                      value={logSubjId}
                      onChange={(e) => setLogSubjId(e.target.value)}
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field" htmlFor="pName">
                    Paper
                    <input
                      type="text"
                      id="pName"
                      placeholder="May/June 2024 Paper 42"
                      maxLength={60}
                      value={logName}
                      onChange={(e) => setLogName(e.target.value)}
                    />
                  </label>
                </div>
                <div className="row" style={{ marginTop: '10px' }}>
                  <label className="field" htmlFor="pDate">
                    Date
                    <input
                      type="date"
                      id="pDate"
                      max={dKey()}
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                    />
                  </label>
                  <label className="field" htmlFor="pMark">
                    My mark
                    <input
                      type="number"
                      id="pMark"
                      min={0}
                      step={0.5}
                      inputMode="decimal"
                      value={logMark}
                      onChange={(e) => setLogMark(e.target.value)}
                    />
                  </label>
                  <label className="field" htmlFor="pTotal">
                    Out of
                    <input
                      type="number"
                      id="pTotal"
                      min={1}
                      inputMode="decimal"
                      value={logTotal}
                      onChange={(e) => setLogTotal(parseFloat(e.target.value) || 0)}
                    />
                  </label>
                </div>
                <div className="row" style={{ marginTop: '12px', alignItems: 'center' }}>
                  <button className="btn primary" type="button" onClick={handleLogPaper}>
                    Log paper
                  </button>
                  <span className="hint">{logMsg}</span>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <h2>Points for papers</h2>
                </div>
                <p className="muted">
                  Every paper earns 10 points, plus 1 point for each 5% you score. A 75% paper earns 25 points. Logging a paper also counts as a study day for your streak.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h2>Your papers</h2>
                <span className="muted" style={{ fontSize: '.85rem' }}>
                  {papers.length ? `${papers.length} ${papers.length === 1 ? 'paper' : 'papers'}` : ''}
                </span>
              </div>
              {papers.length === 0 ? (
                <p className="empty">
                  No papers logged yet. Add your first one to see averages and expected grades in Settings, under Progress.
                </p>
              ) : (
                <ul className="plist">
                  {[...papers]
                    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
                    .map((p) => {
                      const s = subjects.find((x) => x.id === p.sid);
                      const g = getPaperGrade(p);
                      const pct = p.total > 0 ? (p.mark / p.total) * 100 : 0;
                      const d = new Date(`${p.date}T12:00:00`);
                      const dateStr = d.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });

                      return (
                        <li
                          key={p.id}
                          className="hued"
                          style={{ '--h': s ? s.hue : 215 } as React.CSSProperties}
                        >
                          <span className="dot" />
                          <div style={{ minWidth: 0 }}>
                            <div className="t">
                              {s ? s.name : p.subj} · {p.name}
                            </div>
                            <div className="when">
                              {dateStr} · +{p.pts} pts
                            </div>
                          </div>
                          <div className="score">
                            {p.mark}/{p.total}
                            <br />
                            <span className="muted">
                              {Math.round(pct)}%{g ? ` · ${g}` : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="x"
                            aria-label="Delete paper"
                            onClick={() => onDeletePaper(p.id)}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subpanel 2: Grade Boundaries */}
      {subTab === 'pp-grades' && (
        <div className="subpanel" id="pp-grades">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <h2 style={{ marginBottom: '6px' }}>Grade boundaries</h2>
              <p className="muted" style={{ maxWidth: '68ch' }}>
                Subjects marked Official use the June 2026 tables from Cambridge, Pearson Edexcel and OxfordAQA. Subjects marked Estimate are placeholders. Boundaries change every series, so edit any number to match your own sheet, then enter your mark to see the grade.
              </p>
              <p className="notice" style={{ marginTop: '10px' }}>
                <a
                  href="https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/grade-threshold-tables/june-2026/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cambridge thresholds
                </a>
                <a
                  href="https://qualifications.pearson.com/content/dam/pdf/Support/Grade-boundaries/International-GCSE/grade-boundaries-june-2026-international-gcse.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pearson Edexcel boundaries
                </a>
                <a
                  href="https://www.oxfordaqa.com/exams-admin/results/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OxfordAQA results
                </a>
              </p>
            </div>

            <div className="grade-list">
              {subjects.map((s) => {
                const sc = SCALE[s.board] || [];
                const res = gradeFor(s);
                const max = Math.max(1, s.bounds.max);

                // Build segments for visual grade bar
                const mk = s.bounds.marks;
                const v: number[] = [];
                for (let i = sc.length - 1; i >= 0; i--) {
                  if (mk[i] != null) v.push(i);
                }

                const segs: { l: string; lo: number; hi: number; i: number }[] = [];
                if (v.length > 0) {
                  segs.push({ l: 'U', lo: 0, hi: mk[v[0]]!, i: sc.length });
                  v.forEach((gIdx, k) => {
                    segs.push({
                      l: sc[gIdx],
                      lo: mk[gIdx]!,
                      hi: k + 1 < v.length ? mk[v[k + 1]]! : max,
                      i: gIdx,
                    });
                  });
                }

                let resultNote = '';
                if (res) {
                  resultNote =
                    res.next === null
                      ? 'Top grade'
                      : res.next > 0
                      ? `${res.next} ${res.next === 1 ? 'mark' : 'marks'} to ${s.board === 'edexcel' ? 'grade ' : ''}${res.nextName}`
                      : '';
                }

                return (
                  <article
                    key={s.id}
                    className="card gcard hued"
                    style={{ '--h': s.hue } as React.CSSProperties}
                  >
                    <header>
                      <span className="dot" />
                      <h3>{s.name}</h3>
                      <span className="pill">{BOARD_NAME[s.board]}</span>
                    </header>

                    {s.src && s.src.official ? (
                      <p className="src">
                        <span className="pill good">Official</span>
                        <span>{s.src.text}</span>
                      </p>
                    ) : (
                      <p className="src">
                        <span className="pill warn">Estimate</span>
                        <span>No June 2026 table for this subject in my sources. Replace with your board's figures.</span>
                      </p>
                    )}

                    <div className="g-top">
                      <label className="field">
                        Total marks
                        <input
                          type="number"
                          min={1}
                          value={s.bounds.max}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 1;
                            const updated = {
                              ...s,
                              bounds: { ...s.bounds, max: val },
                            };
                            onUpdateSubjectBounds(updated);
                          }}
                        />
                      </label>
                      <label className="field">
                        My mark
                        <input
                          type="number"
                          min={0}
                          value={s.mark === null || s.mark === undefined ? '' : s.mark}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseFloat(e.target.value);
                            const updated = { ...s, mark: val };
                            onUpdateSubjectBounds(updated);
                          }}
                        />
                      </label>
                      <div className="g-result">
                        {res ? (
                          <>
                            <small>Grade</small>
                            <b>{res.grade}</b>
                            <small>{resultNote}</small>
                          </>
                        ) : (
                          <>
                            <small>Enter your mark</small>
                            <b>–</b>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="g-bar">
                      {segs.map((g, idx) => {
                        const w = Math.max(0, ((Math.min(g.hi, max) - Math.min(g.lo, max)) / max) * 100);
                        const a = g.i >= sc.length ? 0.04 : 0.1 + 0.5 * (1 - g.i / sc.length);
                        return (
                          <span
                            key={idx}
                            style={{
                              flex: `${w} 1 0%`,
                              background: `hsl(var(--h) var(--acc-s) var(--acc-l) / ${a.toFixed(2)})`,
                            }}
                          >
                            {w > 5 ? g.l : ''}
                          </span>
                        );
                      })}
                      {s.mark !== null && s.mark !== undefined && !isNaN(s.mark) && (
                        <i
                          style={{
                            left: `${Math.min(100, Math.max(0, (s.mark / max) * 100))}%`,
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <div className="eyebrow" style={{ marginBottom: '6px' }}>
                        Marks needed for each grade
                      </div>
                      <div className="g-inputs">
                        {sc.map((gName, idx) => (
                          <label key={idx}>
                            {gName}
                            <input
                              type="number"
                              min={0}
                              value={s.bounds.marks[idx] == null ? '' : s.bounds.marks[idx]!}
                              onChange={(e) => {
                                const newMarks = [...s.bounds.marks];
                                newMarks[idx] = e.target.value === '' ? null : parseFloat(e.target.value);
                                const updated = {
                                  ...s,
                                  bounds: { ...s.bounds, marks: newMarks },
                                };
                                onUpdateSubjectBounds(updated);
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => {
                          const updated = { ...s };
                          applyBounds(updated, updated.bounds.max);
                          onUpdateSubjectBounds(updated);
                        }}
                      >
                        {s.src && s.src.official ? 'Reset to June 2026 figures' : 'Reset to estimates'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Subpanel 3: Past Paper Links */}
      {subTab === 'pp-links' && (
        <div className="subpanel" id="pp-links">
          <div className="pl-grid">
            <div className="pl-side">
              <div className="card">
                <div className="card-head">
                  <h2>Find a paper</h2>
                </div>
                <div className="stack">
                  <label className="field" htmlFor="plSubj">
                    Subject
                    <select
                      className="sel"
                      id="plSubj"
                      value={plSubjId}
                      onChange={(e) => handleSelectPlSubject(e.target.value)}
                    >
                      {Array.from(new Set(PL.map((x) => x.grp))).map((grp) => (
                        <optgroup key={grp} label={grp}>
                          {PL.filter((x) => x.grp === grp).map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                              {x.code ? ` · ${x.code}` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>

                  {currentPlItem.kind !== 'idx' && (
                    <>
                      <div className="group">
                        <div className="eyebrow">Papers</div>
                        <div className="chip-row" role="group" aria-label="Papers">
                          {(currentPlItem.papers || []).map((p) => (
                            <button
                              key={p.n}
                              type="button"
                              className="chip"
                              aria-pressed={selectedPapers.includes(p.n)}
                              title={p.t}
                              onClick={() => togglePaperVariant(p.n)}
                            >
                              {p.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="field" htmlFor="plYear">
                        Year
                        <select
                          className="sel"
                          id="plYear"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                        >
                          <option value="all">All years</option>
                          {plGroupsList.map((g) => (
                            <option key={g.y} value={g.y}>
                              {g.y}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <h2>Sites</h2>
                </div>
                <div className="src-list">
                  {currentPlItem.src.map(([siteName, url], idx) => (
                    <a
                      key={idx}
                      className="lk src"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{siteName}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
                <p className="muted" style={{ fontSize: '.8rem', marginTop: '10px' }}>
                  {currentPlItem.kind === 'idx'
                    ? "These subjects open on the site's own index page, where you can pick a year."
                    : currentPlItem.kind === 'caie'
                    ? 'Direct PDF links open on PapaCambridge. They are third-party copies of the Cambridge papers.'
                    : 'Direct PDF links open on Physics & Maths Tutor.'}
                </p>
              </div>
            </div>

            {/* Results stack */}
            <div className="stack">
              {currentPlItem.kind === 'idx' ? (
                <div className="pl-paper">
                  <div className="pl-head">
                    <div>
                      <h2>{currentPlItem.name}</h2>
                      <small>{currentPlItem.grp}</small>
                    </div>
                  </div>
                  <p className="muted">
                    Use the buttons on the left to open the past paper index for this subject.
                  </p>
                </div>
              ) : (
                <>
                  <p className="muted" style={{ fontSize: '.85rem' }}>
                    {currentPlItem.kind === 'caie'
                      ? 'Each number is the paper and variant, so 42 is Paper 4, variant 2. QP is the question paper and MS is the mark scheme. Feb/March series only have variant 2, and not every variant exists in every series.'
                      : `QP is the question paper, MS the mark scheme${
                          currentPlItem.kind === 'em' ? ' and MA the model answers' : ''
                        }. Std is the standard paper and R is the regional version some countries sit.`}{' '}
                    If a link does not open, try the sites on the left.
                  </p>

                  {(currentPlItem.papers || [])
                    .filter((p) => selectedPapers.includes(p.n))
                    .map((p) => {
                      const pmtPage =
                        currentPlItem.kind === 'caie'
                          ? `${PMT_PAGES}${currentPlItem.pmt}/cie-igcse-paper-${p.n}/`
                          : currentPlItem.kind === 'em'
                          ? `${PMT_PAGES}gcse-maths/edexcel-igcse-a-paper-${p.n.charAt(0)}/`
                          : `${PMT_PAGES}${currentPlItem.pmt}/edexcel-igcse-paper-${p.n}/`;

                      return (
                        <div key={p.n} className="pl-paper">
                          <div className="pl-head">
                            <div>
                              <h2>{p.l}</h2>
                              <small>
                                {p.t} · {currentPlItem.name} {currentPlItem.code}
                              </small>
                            </div>
                            <a
                              className="lk"
                              href={pmtPage}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Paper page on PMT ↗
                            </a>
                          </div>

                          {shownGroups.map((gr, idx) => (
                            <details
                              key={gr.y}
                              className="pl-year"
                              open={selectedYear !== 'all' || idx < 2}
                            >
                              <summary>{gr.y}</summary>
                              {gr.rows.map((r, rIdx) => {
                                if (currentPlItem.kind === 'caie') {
                                  const vars = r.k === 'm' ? [2] : [1, 2, 3];
                                  return (
                                    <div key={rIdx} className="pl-row">
                                      <span className="pl-ses">{r.m}</span>
                                      <span className="pl-vars">
                                        {vars.map((v) => {
                                          const pv = `${p.n}${v}`;
                                          const yy = (gr as { y: string; yy?: string }).yy || gr.y.slice(2);
                                          const base = `${CAIE_FILES}${currentPlItem.code}_${r.k}${yy}_`;
                                          return (
                                            <span key={v} className="pl-var">
                                              <b>{pv}</b>
                                              <a
                                                className="lk"
                                                href={`${base}qp_${pv}.pdf`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                QP
                                              </a>
                                              <a
                                                className="lk"
                                                href={`${base}ms_${pv}.pdf`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                MS
                                              </a>
                                            </span>
                                          );
                                        })}
                                      </span>
                                    </div>
                                  );
                                }

                                // Edexcel links
                                const types = ['QP', 'MS'];
                                if (currentPlItem.kind === 'em' && r.ma) types.push('MA');

                                const makeUrl = (T: string, seriesStr: string) => {
                                  let file = `${seriesStr} ${T}.pdf`;
                                  if (currentPlItem.kind === 'em') {
                                    if (T === 'MA' && p.n.slice(-1) === 'H' && seriesStr === 'January 2019 (R)') {
                                      file = 'January 2019 (R).pdf';
                                    }
                                    return `${PMT_FILES}Maths/GCSE/Past-Papers/Edexcel-IGCSE-A/Paper-${p.n}/${T}/${encodeURIComponent(file)}`;
                                  }
                                  return `${PMT_FILES}${currentPlItem.dir}/GCSE/Past-Papers/Edexcel-IGCSE/New-Spec-Paper-${p.n}/${T}/${encodeURIComponent(file)}`;
                                };

                                return (
                                  <div key={rIdx} className="pl-row">
                                    <span className="pl-ses">{r.m}</span>
                                    <span className="pl-vars">
                                      {r.std && (
                                        <span className="pl-var">
                                          <b>Std</b>
                                          {types.map((T) => (
                                            <a
                                              key={T}
                                              className="lk"
                                              href={makeUrl(T, r.std)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              {T}
                                            </a>
                                          ))}
                                        </span>
                                      )}
                                      {r.r && (
                                        <span className="pl-var">
                                          <b>R</b>
                                          {types.map((T) => (
                                            <a
                                              key={T}
                                              className="lk"
                                              href={makeUrl(T, r.r)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              {T}
                                            </a>
                                          ))}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </details>
                          ))}
                        </div>
                      );
                    })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
