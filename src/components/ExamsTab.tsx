import React, { useState } from 'react';
import { Exam, Subject } from '../types';
import { pad } from '../constants/data';

interface ExamsTabProps {
  exams: Exam[];
  subjects: Subject[];
  onAddExam: (e: Omit<Exam, 'id'>) => void;
  onDeleteExam: (id: string) => void;
  now: number;
}

function examTime(e: Exam): number {
  return new Date(e.when).getTime();
}

function fmtLeft(ms: number): string {
  if (ms <= 0) return 'Finished';
  const d = Math.floor(ms / 864e5);
  const h = Math.floor((ms % 864e5) / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  const s = Math.floor((ms % 6e4) / 1e3);
  return d > 0 ? `${d} d ${h} h` : h > 0 ? `${h} h ${m} m` : `${m} m ${s} s`;
}

function fmtWhen(e: Exam): string {
  const d = new Date(e.when);
  if (isNaN(d.getTime())) return '';
  const dateStr = d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${dateStr} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const ExamsTab: React.FC<ExamsTabProps> = ({
  exams,
  subjects,
  onAddExam,
  onDeleteExam,
  now,
}) => {
  const [examSubjId, setExamSubjId] = useState<string>(subjects[0]?.id || '');
  const [examPaper, setExamPaper] = useState<string>('');
  const [examWhen, setExamWhen] = useState<string>('');
  const [examMsg, setExamMsg] = useState<string>('');

  const sorted = [...exams].sort((a, b) => examTime(a) - examTime(b));
  const upcoming = sorted.filter((e) => examTime(e) > now);
  const past = sorted.filter((e) => examTime(e) <= now);
  const ordered = [...upcoming, ...past];
  const nextExam = upcoming[0];

  const getSubjHue = (sid: string): number => {
    const s = subjects.find((x) => x.id === sid);
    return s ? s.hue : 215;
  };

  const handleAdd = () => {
    if (!examWhen || isNaN(new Date(examWhen).getTime())) {
      setExamMsg('Pick a date and start time.');
      return;
    }
    const s = subjects.find((x) => x.id === examSubjId) || subjects[0];
    if (!s) {
      setExamMsg('Add a subject first.');
      return;
    }

    onAddExam({
      sid: s.id,
      subj: s.name,
      paper: examPaper.trim() || 'Paper',
      when: examWhen,
    });
    setExamPaper('');
    setExamWhen('');
    setExamMsg('');
  };

  // Next exam countdown numbers
  let cdD = 0;
  let cdH = '00';
  let cdM = '00';
  let cdS = '00';
  if (nextExam) {
    const ms = Math.max(0, examTime(nextExam) - now);
    cdD = Math.floor(ms / 864e5);
    cdH = pad(Math.floor((ms % 864e5) / 36e5));
    cdM = pad(Math.floor((ms % 36e5) / 6e4));
    cdS = pad(Math.floor((ms % 6e4) / 1e3));
  }

  return (
    <section id="tab-exams">
      <div className="split">
        <div className="col">
          {/* Featured Next Exam Card */}
          {nextExam ? (
            <div
              className="card next hued"
              style={{ '--h': getSubjHue(nextExam.sid) } as React.CSSProperties}
            >
              <div>
                <div className="eyebrow">Next exam</div>
                <h2 style={{ marginTop: '2px' }}>
                  {nextExam.subj} · {nextExam.paper || 'Paper'}
                </h2>
                <p className="muted" style={{ fontSize: '.9rem' }}>
                  {fmtWhen(nextExam)}
                  {nextExam.ex ? ' · example date' : ''}
                </p>
              </div>
              <div className="cd">
                <div>
                  <b>{cdD}</b>
                  <span>days</span>
                </div>
                <div>
                  <b>{cdH}</b>
                  <span>hours</span>
                </div>
                <div>
                  <b>{cdM}</b>
                  <span>mins</span>
                </div>
                <div>
                  <b>{cdS}</b>
                  <span>secs</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="card next">
              <div>
                <div className="eyebrow">Next exam</div>
                <h2 style={{ marginTop: '2px' }}>Nothing coming up</h2>
                <p className="muted" style={{ fontSize: '.9rem' }}>
                  Add an exam and the countdown starts here.
                </p>
              </div>
            </div>
          )}

          {/* Add Exam Form */}
          <div className="card">
            <div className="card-head">
              <h2>Add an exam</h2>
            </div>
            <div className="row">
              <label className="field" htmlFor="examSubj">
                Subject
                <select
                  className="sel"
                  id="examSubj"
                  value={examSubjId}
                  onChange={(e) => setExamSubjId(e.target.value)}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" htmlFor="examPaper">
                Paper
                <input
                  type="text"
                  id="examPaper"
                  placeholder="Paper 4"
                  maxLength={40}
                  value={examPaper}
                  onChange={(e) => setExamPaper(e.target.value)}
                />
              </label>
            </div>
            <div className="row" style={{ marginTop: '10px' }}>
              <label className="field" htmlFor="examWhen">
                Date and start time
                <input
                  type="datetime-local"
                  id="examWhen"
                  value={examWhen}
                  onChange={(e) => setExamWhen(e.target.value)}
                />
              </label>
              <button className="btn primary" type="button" onClick={handleAdd}>
                Add exam
              </button>
            </div>
            {examMsg && (
              <p className="hint" style={{ marginTop: '8px' }}>
                {examMsg}
              </p>
            )}
          </div>
        </div>

        {/* All Exams List Card */}
        <div className="card">
          <div className="card-head">
            <h2>All exams</h2>
            <span className="muted" style={{ fontSize: '.85rem' }}>
              Sorted by date
            </span>
          </div>
          <ul className="exam-list">
            {ordered.length > 0 ? (
              ordered.map((e) => {
                const isPast = examTime(e) <= now;
                const msLeft = examTime(e) - now;
                return (
                  <li
                    key={e.id}
                    className={`hued ${isPast ? 'past' : ''}`}
                    style={{ '--h': getSubjHue(e.sid) } as React.CSSProperties}
                  >
                    <span className="dot" />
                    <div style={{ minWidth: 0 }}>
                      <div className="t">
                        {e.subj} · {e.paper || 'Paper'}
                        {e.ex ? ' ' : ''}
                        {e.ex && <span className="pill">Example</span>}
                      </div>
                      <div className="when">{fmtWhen(e)}</div>
                    </div>
                    <span className="left">{fmtLeft(msLeft)}</span>
                    <button
                      type="button"
                      className="x"
                      aria-label="Remove exam"
                      onClick={() => onDeleteExam(e.id)}
                    >
                      ×
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="empty" style={{ display: 'block' }}>
                No exams yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};
