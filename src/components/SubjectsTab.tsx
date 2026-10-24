import React, { useState } from 'react';
import { BoardType, Subject } from '../types';
import { CATALOG, HUE_NAMES, HUES, applyBounds } from '../constants/data';

interface SubjectsTabProps {
  subjects: Subject[];
  onAddSubject: (name: string, board: BoardType, max?: number) => void;
  onUpdateSubject: (s: Subject) => void;
  onDeleteSubject: (id: string) => void;
}

export const SubjectsTab: React.FC<SubjectsTabProps> = ({
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
}) => {
  const [newName, setNewName] = useState<string>('');
  const [newBoard, setNewBoard] = useState<BoardType>('cambridge');
  const [msg, setMsg] = useState<string>('');

  const handleNameChange = (val: string) => {
    setNewName(val);
    const cat = CATALOG.find((c) => c.n.toLowerCase() === val.trim().toLowerCase());
    if (cat) {
      setNewBoard(cat.b);
    }
  };

  const handleAdd = () => {
    const clean = newName.trim();
    if (!clean) {
      setMsg('Type a subject name.');
      return;
    }
    if (subjects.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
      setMsg('Already added.');
      return;
    }
    const cat = CATALOG.find((c) => c.n.toLowerCase() === clean.toLowerCase());
    onAddSubject(cat ? cat.n : clean, newBoard, cat ? cat.m : 100);
    setNewName('');
    setMsg('');
  };

  const handleQuickAdd = (c: (typeof CATALOG)[0]) => {
    onAddSubject(c.n, c.b, c.m);
  };

  const availableQuick = CATALOG.filter(
    (c) => !subjects.some((s) => s.name.toLowerCase() === c.n.toLowerCase())
  );

  return (
    <section id="tab-subjects">
      <div className="split">
        {/* Your Subjects List */}
        <div className="card">
          <div className="card-head">
            <h2>Your subjects</h2>
            <span className="muted" style={{ fontSize: '.85rem' }}>
              Each subject has its own color
            </span>
          </div>

          <ul className="subj-list">
            {subjects.map((s) => (
              <li
                key={s.id}
                className="hued"
                style={{ '--h': s.hue } as React.CSSProperties}
              >
                <span className="dot" />
                <input
                  type="text"
                  value={s.name}
                  maxLength={40}
                  aria-label="Subject name"
                  onChange={(e) => {
                    const updated = { ...s, name: e.target.value };
                    applyBounds(updated, updated.bounds.max);
                    onUpdateSubject(updated);
                  }}
                />
                <div className="subj-opts">
                  <select
                    className="sel"
                    value={s.board}
                    aria-label="Exam board"
                    style={{ width: 'auto' }}
                    onChange={(e) => {
                      const updated = { ...s, board: e.target.value as BoardType };
                      applyBounds(updated, updated.bounds.max);
                      onUpdateSubject(updated);
                    }}
                  >
                    <option value="cambridge">Cambridge</option>
                    <option value="edexcel">Edexcel</option>
                    <option value="oxford">OxfordAQA</option>
                  </select>

                  <div className="sw-row" role="group" aria-label="Color">
                    {HUES.map((h, i) => (
                      <button
                        key={h}
                        type="button"
                        className="sw"
                        aria-label={HUE_NAMES[i]}
                        aria-pressed={s.hue === h}
                        style={{ background: `hsl(${h} 70% 45%)` }}
                        onClick={() => onUpdateSubject({ ...s, hue: h })}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="x"
                    aria-label={`Remove ${s.name}`}
                    disabled={subjects.length <= 1}
                    onClick={() => onDeleteSubject(s.id)}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Add Subject & Quick Add */}
        <div className="col">
          <div className="card">
            <div className="card-head">
              <h2>Add a subject</h2>
            </div>
            <div className="row">
              <label className="field" htmlFor="subjName">
                Name
                <input
                  type="text"
                  id="subjName"
                  list="catalogList"
                  placeholder="Chemistry"
                  maxLength={40}
                  autoComplete="off"
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </label>
              <label className="field" htmlFor="subjBoard">
                Exam board
                <select
                  className="sel"
                  id="subjBoard"
                  value={newBoard}
                  onChange={(e) => setNewBoard(e.target.value as BoardType)}
                >
                  <option value="cambridge">Cambridge (A* to G)</option>
                  <option value="edexcel">Edexcel (9 to 1)</option>
                  <option value="oxford">OxfordAQA (9 to 1)</option>
                </select>
              </label>
            </div>
            <div className="row" style={{ marginTop: '10px' }}>
              <button className="btn primary" type="button" onClick={handleAdd}>
                Add subject
              </button>
              {msg && <span className="hint">{msg}</span>}
            </div>

            <datalist id="catalogList">
              {CATALOG.map((c) => (
                <option key={c.n} value={c.n} />
              ))}
            </datalist>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Quick add</h2>
            </div>
            <div className="chip-row">
              {availableQuick.length > 0 ? (
                availableQuick.map((c) => (
                  <button
                    key={c.n}
                    type="button"
                    className="chip"
                    onClick={() => handleQuickAdd(c)}
                  >
                    + {c.n}
                  </button>
                ))
              ) : (
                <span className="muted">Every listed subject is added.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
