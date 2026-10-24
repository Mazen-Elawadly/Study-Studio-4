import React from 'react';
import { Subject } from '../types';
import { RankBadge } from './RankBadge';

interface HeaderProps {
  pts: number;
  streak: { cur: number; best: number; today: boolean };
  subjects: Subject[];
  activeSubjectId: string;
  onActiveSubjectChange: (id: string) => void;
  theme: 'auto' | 'light' | 'dark';
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pts,
  streak,
  subjects,
  activeSubjectId,
  onActiveSubjectChange,
  theme,
  onThemeToggle,
}) => {
  const activeSubj = subjects.find((s) => s.id === activeSubjectId) || subjects[0];
  const activeHue = activeSubj ? activeSubj.hue : 215;

  return (
    <header className="top">
      <div className="brand">
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M15 7.5V15l5 3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Study Studio</span>
      </div>
      <div className="top-ctrl">
        <span className="pill lg run">
          <b>{pts}</b> pts
        </span>
        <RankBadge pts={pts} />
        <span
          className={`pill lg ${streak.cur > 0 ? (streak.today ? 'good' : 'warn') : ''}`}
          title={
            streak.today
              ? 'You have studied enough today.'
              : `Study 10 minutes or log a paper today to ${streak.cur > 0 ? 'keep' : 'start'} your streak.`
          }
        >
          <b>{streak.cur}</b> day streak
        </span>
        <label
          className="pick hued"
          title="Active subject"
          style={{ '--h': activeHue } as React.CSSProperties}
        >
          <span className="dot" />
          <select
            value={activeSubjectId}
            onChange={(e) => onActiveSubjectChange(e.target.value)}
            aria-label="Active subject"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" type="button" onClick={onThemeToggle} aria-label="Change theme">
          Theme: {theme === 'auto' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}
        </button>
      </div>
    </header>
  );
};
