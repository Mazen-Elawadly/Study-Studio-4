import React, { useState } from 'react';
import { Friend, PlayerDoc } from '../types';
import { fmtMin, weekKey } from '../constants/data';
import { RankBadge } from './RankBadge';

interface LeaderboardTabProps {
  players: PlayerDoc[];
  currentUserId?: string | null;
  currentUserDoc?: PlayerDoc | null;
  friends: Friend[];
  isSignedIn: boolean;
  claimedUsername: boolean;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  players,
  currentUserId,
  currentUserDoc,
  friends,
  isSignedIn,
  claimedUsername,
}) => {
  const [scope, setScope] = useState<'all' | 'friends'>('all');
  const [metric, setMetric] = useState<'pts' | 'wk' | 'streak'>('pts');

  const curWk = weekKey();
  const today = new Date().toISOString().slice(0, 10);

  const effStreak = (d: PlayerDoc) => {
    // If studied today or yesterday, streak is active
    if (!d.day) return 0;
    const dayDate = new Date(d.day);
    const nowDate = new Date(today);
    const diff = (nowDate.getTime() - dayDate.getTime()) / (1000 * 3600 * 24);
    return diff <= 1.5 ? d.streak || 0 : 0;
  };

  const getMetricVal = (d: PlayerDoc) => {
    if (metric === 'wk') {
      return d.wk && d.wk.k === curWk ? d.wk.p || 0 : 0;
    }
    if (metric === 'streak') {
      return effStreak(d);
    }
    return d.pts || 0;
  };

  let list: PlayerDoc[] = [...players];
  if (
    isSignedIn &&
    claimedUsername &&
    currentUserDoc &&
    !list.some((p) => p.id === currentUserId)
  ) {
    list.push(currentUserDoc);
  }

  if (scope === 'friends') {
    const friendIds = new Set(friends.map((f) => f.id));
    if (currentUserId) friendIds.add(currentUserId);
    list = list.filter((p) => friendIds.has(p.id));
  }

  list.sort((a, b) => {
    const diff = getMetricVal(b) - getMetricVal(a);
    if (diff !== 0) return diff;
    return (a.username || '').localeCompare(b.username || '');
  });

  const metricLabel = metric === 'streak' ? 'days' : 'pts';

  return (
    <section id="tab-board">
      <div className="card" style={{ maxWidth: '780px' }}>
        <div className="card-head">
          <h2>Leaderboard</h2>
          <span className="pill">
            {list.length} {list.length === 1 ? 'player' : 'players'}
          </span>
        </div>

        <div className="chip-row" role="group" aria-label="Who to show">
          <button
            type="button"
            className="chip"
            aria-pressed={scope === 'all'}
            onClick={() => setScope('all')}
          >
            Everyone
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={scope === 'friends'}
            onClick={() => setScope('friends')}
          >
            Friends
          </button>
        </div>

        <div className="chip-row" role="group" aria-label="Rank by" style={{ marginTop: '8px' }}>
          <button
            type="button"
            className="chip"
            aria-pressed={metric === 'pts'}
            onClick={() => setMetric('pts')}
          >
            All-time points
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={metric === 'wk'}
            onClick={() => setMetric('wk')}
          >
            This week
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={metric === 'streak'}
            onClick={() => setMetric('streak')}
          >
            Streak
          </button>
        </div>

        {list.length > 0 ? (
          <ul className="lb" style={{ marginTop: '14px' }}>
            {list.slice(0, 50).map((p, i) => {
              const isMe = p.id === currentUserId;
              const val = getMetricVal(p);
              return (
                <li key={p.id} className={isMe ? 'me' : ''}>
                  <span className="rk">{i + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="t">
                      {p.username} <RankBadge pts={p.pts} />
                      {isMe && <span className="pill run">You</span>}
                    </div>
                    <div className="when">
                      {p.pts || 0} pts · {effStreak(p)} day streak · {fmtMin(p.focus || 0)} focus
                      {p.avg != null ? ` · ${Math.round(p.avg)}% papers` : ''}
                    </div>
                  </div>
                  <span className="val">
                    {val} <small>{metricLabel}</small>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty" style={{ marginTop: '14px' }}>
            {!isSignedIn
              ? 'Sign in with Google in Settings, under Account to join the leaderboards. Until then your points are saved on this device only.'
              : scope === 'friends'
              ? 'No friends here yet. Add friends by username in Settings, under Account.'
              : 'No players yet. Save a username in Settings, under Account to be the first.'}
          </p>
        )}

        <p className="muted" style={{ fontSize: '.82rem', marginTop: '12px' }}>
          {isSignedIn && !claimedUsername
            ? 'Save a username in Settings, under Account to appear on the leaderboard. '
            : ''}
          Everyone who has signed in and saved a username appears here. Scores are reported by each player's own browser.
        </p>
      </div>
    </section>
  );
};
