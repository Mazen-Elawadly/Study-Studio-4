import React, { useState } from 'react';
import { AppState, FeedItem, Friend, LookConfig, Paper, Subject } from '../types';
import {
  ACCENT_SWATCHES,
  addDays,
  CC,
  CC_BG,
  dKey,
  defaultLook,
  fmtClock,
  fmtMin,
  GLASS_THEMES,
  GlassTheme,
  HUE_NAMES,
  HUES,
  PAL,
  RANKS,
  rankIdx,
  TOOLS,
} from '../constants/data';
import { FirebaseUser, SyncState } from '../services/firebase';
import { RankBadge } from './RankBadge';
import { gradeFor } from './PastPapersTab';

interface SettingsTabProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  streak: { cur: number; best: number; today: boolean };
  firebaseUser: FirebaseUser | null;
  syncState: SyncState;
  syncError: string;
  isConfigured: boolean;
  onSignIn: () => Promise<string | null>;
  onSignOut: () => Promise<void>;
  onClaimUsername: (name: string) => Promise<{ success: boolean; msg: string }>;
  onAddFriend: (name: string) => Promise<string | null>;
  onDeleteFriend: (id: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  state,
  onUpdateState,
  streak,
  firebaseUser,
  syncState,
  syncError,
  isConfigured,
  onSignIn,
  onSignOut,
  onClaimUsername,
  onAddFriend,
  onDeleteFriend,
}) => {
  const [subTab, setSubTab] = useState<'st-account' | 'st-progress' | 'st-colors'>('st-account');
  const [usernameInput, setUsernameInput] = useState<string>(state.me.username || '');
  const [usernameMsg, setUsernameMsg] = useState<string>('');
  const [friendInput, setFriendInput] = useState<string>('');
  const [friendMsg, setFriendMsg] = useState<string>('');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [editingDarkColors, setEditingDarkColors] = useState<boolean>(false);

  // Account claim
  const handleSaveUsername = async () => {
    const res = await onClaimUsername(usernameInput.trim());
    setUsernameMsg(res.msg);
  };

  // Add friend
  const handleAddFriendSubmit = async () => {
    if (!friendInput.trim()) {
      setFriendMsg("Type your friend's username.");
      return;
    }
    const err = await onAddFriend(friendInput.trim());
    if (err) {
      setFriendMsg(err);
    } else {
      setFriendMsg(`Added ${friendInput.trim()}.`);
      setFriendInput('');
    }
  };

  // Ranks computation
  const curRankIdx = rankIdx(state.pts);
  const curRank = RANKS[curRankIdx];
  const nextRank = RANKS[curRankIdx + 1];
  let rankProgress = 100;
  if (nextRank) {
    const span = nextRank.min - curRank.min;
    rankProgress = Math.min(100, Math.max(0, ((state.pts - curRank.min) / span) * 100));
  }

  // Progress computation
  const today = dKey();
  let totFocus = 0;
  let focusStudyDays = 0;
  for (const k in state.log) {
    totFocus += state.log[k] || 0;
    if (state.log[k] > 0) focusStudyDays++;
  }
  let last7Focus = 0;
  for (let i = 0; i < 7; i++) {
    last7Focus += state.log[addDays(today, -i)] || 0;
  }

  // 14 days focus bar chart
  const last14Days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    last14Days.push(addDays(today, -i));
  }
  const focusVals = last14Days.map((d) => state.log[d] || 0);
  const maxFocusBar = Math.max(...focusVals, 30);

  // Paper averages
  let allPapersAvg: number | null = null;
  if (state.papers.length) {
    let sm = 0;
    state.papers.forEach((p) => {
      sm += p.total > 0 ? (p.mark / p.total) * 100 : 0;
    });
    allPapersAvg = sm / state.papers.length;
  }

  // Subject paper groupings
  const groups: Record<
    string,
    { sid: string; name: string; sum: number; best: number; items: Paper[] }
  > = {};
  state.papers.forEach((p) => {
    if (!groups[p.sid]) {
      groups[p.sid] = { sid: p.sid, name: p.subj, sum: 0, best: 0, items: [] };
    }
    const pct = p.total > 0 ? (p.mark / p.total) * 100 : 0;
    groups[p.sid].sum += pct;
    groups[p.sid].best = Math.max(groups[p.sid].best, pct);
    groups[p.sid].items.push(p);
  });
  const sids = Object.keys(groups);

  // Palette & colors
  const activeMode = state.look.mode;
  const currentCustomMap =
    state.look.custom[editingDarkColors ? 'dark' : 'light'] || {};

  const handleSetLookMode = (m: 'subject' | 'fixed' | 'tool') => {
    onUpdateState((prev) => ({
      ...prev,
      look: { ...prev.look, mode: m },
    }));
  };

  const handleSetFixedHue = (h: number) => {
    onUpdateState((prev) => ({
      ...prev,
      look: { ...prev.look, fixed: h },
    }));
  };

  const handleSetToolHue = (toolId: string, h: number) => {
    onUpdateState((prev) => ({
      ...prev,
      look: {
        ...prev.look,
        tools: { ...prev.look.tools, [toolId]: h },
      },
    }));
  };

  const handleSelectPalette = (key: string) => {
    const p = PAL[key];
    if (!p) return;
    onUpdateState((prev) => {
      const nextCustom = {
        light: { ...prev.look.custom.light },
        dark: { ...prev.look.custom.dark },
      };
      if (p.l) {
        CC_BG.forEach((t, i) => {
          nextCustom.light[t] = p.l![i];
        });
      } else {
        CC_BG.forEach((t) => {
          delete nextCustom.light[t];
        });
      }
      if (p.d) {
        CC_BG.forEach((t, i) => {
          nextCustom.dark[t] = p.d![i];
        });
      } else {
        CC_BG.forEach((t) => {
          delete nextCustom.dark[t];
        });
      }
      return {
        ...prev,
        look: {
          ...prev.look,
          bg: key,
          custom: nextCustom,
        },
      };
    });
  };

  const handleCustomColorChange = (token: string, hex: string) => {
    onUpdateState((prev) => {
      const modeKey = editingDarkColors ? 'dark' : 'light';
      const updatedModeMap = {
        ...prev.look.custom[modeKey],
        [token]: hex,
      };
      return {
        ...prev,
        look: {
          ...prev.look,
          bg: CC_BG.includes(token) ? '' : prev.look.bg,
          custom: {
            ...prev.look.custom,
            [modeKey]: updatedModeMap,
          },
        },
      };
    });
  };

  const handleResetCustomColor = (token: string) => {
    onUpdateState((prev) => {
      const modeKey = editingDarkColors ? 'dark' : 'light';
      const updatedModeMap = { ...prev.look.custom[modeKey] };
      delete updatedModeMap[token];
      return {
        ...prev,
        look: {
          ...prev.look,
          custom: {
            ...prev.look.custom,
            [modeKey]: updatedModeMap,
          },
        },
      };
    });
  };

  const handleResetAllColors = () => {
    onUpdateState((prev) => ({
      ...prev,
      look: defaultLook(),
    }));
  };

  return (
    <section id="tab-settings">
      <div className="subnav" role="group" aria-label="Settings sections">
        <button
          type="button"
          className="chip"
          aria-pressed={subTab === 'st-account'}
          onClick={() => setSubTab('st-account')}
        >
          Account
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={subTab === 'st-progress'}
          onClick={() => setSubTab('st-progress')}
        >
          Progress
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={subTab === 'st-colors'}
          onClick={() => setSubTab('st-colors')}
        >
          Colors
        </button>
      </div>

      {/* Subpanel 1: Account */}
      {subTab === 'st-account' && (
        <div className="subpanel" id="st-account">
          <div className="split">
            <div className="col">
              {/* Account sync card */}
              <div className="card">
                <div className="card-head">
                  <h2>Your account</h2>
                  <span
                    className={`pill ${
                      syncState === 'saved'
                        ? 'good'
                        : syncState === 'syncing'
                        ? 'run'
                        : syncState === 'denied' || syncState === 'error'
                        ? 'warn'
                        : ''
                    }`}
                  >
                    {!isConfigured
                      ? 'On this device'
                      : !firebaseUser
                      ? 'Signed out'
                      : syncState === 'syncing'
                      ? 'Saving'
                      : syncState === 'saved'
                      ? 'Saved to account'
                      : 'Not saved'}
                  </span>
                </div>

                <div className="stack">
                  {!isConfigured ? (
                    <p className="muted">
                      Cloud sync is not set up yet, so everything is saved on this device only. Paste your Firebase project settings into <b>firebase-config.js</b> to turn on Google sign-in (steps are in SETUP.md).
                    </p>
                  ) : !firebaseUser ? (
                    <div>
                      <p className="muted" style={{ marginBottom: '14px' }}>
                        Sign in with Google to keep your points, streaks, subjects and colors on every device, and to join the leaderboards.
                      </p>
                      <button
                        type="button"
                        className="btn primary"
                        disabled={isSigningIn}
                        onClick={async () => {
                          setIsSigningIn(true);
                          await onSignIn();
                          setIsSigningIn(false);
                        }}
                      >
                        {isSigningIn ? 'Opening Google…' : 'Continue with Google'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="who">
                        {firebaseUser.avatarUrl && (
                          <img
                            className="ava"
                            alt=""
                            referrerPolicy="no-referrer"
                            src={firebaseUser.avatarUrl}
                          />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div className="t" style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                            {firebaseUser.name || firebaseUser.email || 'Signed in'}
                          </div>
                          <div className="muted" style={{ fontSize: '.85rem', overflowWrap: 'anywhere' }}>
                            {firebaseUser.email}
                          </div>
                        </div>
                      </div>
                      <p className="muted" style={{ fontSize: '.88rem', margin: '14px 0' }}>
                        Your progress follows you to any device where you sign in with this Google account.
                      </p>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => onSignOut()}
                      >
                        Sign out
                      </button>
                    </div>
                  )}

                  {syncError && <p className="err">{syncError}</p>}
                </div>

                <div className="row" style={{ marginTop: '16px' }}>
                  <label className="field" htmlFor="acName">
                    Username
                    <input
                      type="text"
                      id="acName"
                      maxLength={16}
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      placeholder="night_owl"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                    />
                  </label>
                  <button className="btn primary" type="button" onClick={handleSaveUsername}>
                    Save username
                  </button>
                </div>
                {usernameMsg && (
                  <p className="hint" style={{ marginTop: '8px' }}>
                    {usernameMsg}
                  </p>
                )}
                <p className="muted" style={{ fontSize: '.82rem', marginTop: '6px' }}>
                  3 to 16 letters, numbers or underscores. This is the only name other people see.
                </p>
              </div>

              {/* Rank Progression Card */}
              <div className="card">
                <div className="card-head">
                  <h2>Your rank</h2>
                </div>
                <div className="stack">
                  <div>
                    <RankBadge pts={state.pts} big />
                  </div>
                  {nextRank ? (
                    <>
                      <div
                        className="rk-bar"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(rankProgress)}
                      >
                        <i style={{ width: `${rankProgress.toFixed(1)}%` }} />
                      </div>
                      <p className="muted" style={{ fontSize: '.88rem' }}>
                        <b style={{ color: 'var(--ink)' }}>{nextRank.min - state.pts} pts</b> to{' '}
                        <RankBadge pts={nextRank.min} />
                      </p>
                    </>
                  ) : (
                    <p className="muted" style={{ fontSize: '.88rem' }}>
                      You have reached the top rank. Nothing left to unlock, just keep the streak.
                    </p>
                  )}
                  <ul className="rk-list">
                    {RANKS.map((r, k) => (
                      <li key={r.id} className={k === curRankIdx ? 'cur' : ''}>
                        <RankBadge pts={r.min} />
                        <small>{r.min ? `${r.min}+ pts` : '0 pts'}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Points Rules Card */}
              <div className="card">
                <div className="card-head">
                  <h2>How points work</h2>
                </div>
                <ul className="rules">
                  <li>
                    <b>1 point</b> for every minute of focus. Breaks do not count.
                  </li>
                  <li>
                    <b>+5</b> for finishing a full session, <b>+10</b> for finishing an exam paper timer.
                  </li>
                  <li>
                    <b>10 points + 1 per 5%</b> for every past paper you log.
                  </li>
                  <li>
                    <b>Streak bonus</b> of up to 10 points the first time you reach 10 focus minutes or log a paper each day.
                  </li>
                </ul>
              </div>
            </div>

            {/* Friends Card */}
            <div className="card">
              <div className="card-head">
                <h2>Friends</h2>
              </div>
              <div className="row">
                <label className="field" htmlFor="frName">
                  Friend's username
                  <input
                    type="text"
                    id="frName"
                    maxLength={16}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    value={friendInput}
                    onChange={(e) => setFriendInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFriendSubmit()}
                  />
                </label>
                <button className="btn primary" type="button" onClick={handleAddFriendSubmit}>
                  Add friend
                </button>
              </div>
              {friendMsg && (
                <p className="hint" style={{ marginTop: '8px' }}>
                  {friendMsg}
                </p>
              )}
              {state.friends.length === 0 ? (
                <p className="empty" style={{ marginTop: '12px' }}>
                  No friends yet. Ask a friend for their username and add it here, then switch the leaderboard to Friends.
                </p>
              ) : (
                <ul className="fr-list" style={{ marginTop: '12px' }}>
                  {state.friends.map((f) => (
                    <li key={f.id}>
                      <div style={{ minWidth: 0 }}>
                        <div className="t">{f.u}</div>
                      </div>
                      <button
                        type="button"
                        className="x"
                        aria-label="Remove friend"
                        onClick={() => onDeleteFriend(f.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subpanel 2: Progress */}
      {subTab === 'st-progress' && (
        <div className="subpanel" id="st-progress">
          <div className="stack">
            <div className="stat-grid">
              <div className="stat">
                <span className="eyebrow">Points</span>
                <b>{state.pts || 0}</b>
                <small>{state.wk.p} this week</small>
              </div>
              <div className="stat">
                <span className="eyebrow">Current streak</span>
                <b>{streak.cur} {streak.cur === 1 ? 'day' : 'days'}</b>
                <small>Best {streak.best} {streak.best === 1 ? 'day' : 'days'}</small>
              </div>
              <div className="stat">
                <span className="eyebrow">Focus, last 7 days</span>
                <b>{fmtMin(last7Focus)}</b>
                <small>{fmtMin(totFocus)} in total</small>
              </div>
              <div className="stat">
                <span className="eyebrow">Paper average</span>
                <b>{allPapersAvg === null ? '–' : `${Math.round(allPapersAvg)}%`}</b>
                <small>{state.papers.length} {state.papers.length === 1 ? 'paper' : 'papers'} logged</small>
              </div>
            </div>

            <div className="split">
              {/* 14 Days Chart */}
              <div className="card">
                <div className="card-head">
                  <h2>Focus, last 14 days</h2>
                  <span className="muted" style={{ fontSize: '.85rem' }}>
                    {focusStudyDays
                      ? `Average on study days: ${fmtMin(Math.round(totFocus / focusStudyDays))}`
                      : 'No focus time yet'}
                  </span>
                </div>
                <div className="bars">
                  {last14Days.map((d, j) => {
                    const mins = focusVals[j];
                    const dayNum = parseInt(d.slice(8), 10);
                    return (
                      <div key={d} className="bar" title={`${d}: ${mins} min`}>
                        <small>{mins > 0 ? mins : ''}</small>
                        <div className="col-wrap">
                          <i style={{ height: `${(mins / maxFocusBar) * 100}%` }} />
                        </div>
                        <small>{dayNum}</small>
                      </div>
                    );
                  })}
                </div>
                <p className="muted" style={{ fontSize: '.78rem', marginTop: '8px' }}>
                  Minutes of focus per day. The number under each bar is the day of the month.
                </p>
              </div>

              {/* Recent Points Feed */}
              <div className="card">
                <div className="card-head">
                  <h2>Recent points</h2>
                </div>
                {state.feed.length === 0 ? (
                  <p className="empty">Start a focus timer or log a paper to earn your first points.</p>
                ) : (
                  <ul className="feed">
                    {state.feed.slice(0, 10).map((x, idx) => {
                      const d = new Date(x.t);
                      const timeStr = `${d.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })} ${d.getHours()}:${d.getMinutes() < 10 ? '0' : ''}${d.getMinutes()}`;
                      return (
                        <li key={idx}>
                          <b>+{x.n}</b>
                          <span>{x.w}</span>
                          <span className="when">{timeStr}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Past Paper Averages Table */}
            <div className="card">
              <div className="card-head">
                <h2>Past paper averages</h2>
                {allPapersAvg !== null && sids.length > 0 && (
                  <span className="muted" style={{ fontSize: '.85rem' }}>
                    All papers {Math.round(allPapersAvg)}% · Subject average{' '}
                    {Math.round(
                      sids.reduce((acc, sid) => acc + groups[sid].sum / groups[sid].items.length, 0) /
                        sids.length
                    )}
                    %
                  </span>
                )}
              </div>

              {sids.length === 0 ? (
                <p className="empty">Log past papers to see your averages and the grade they point to.</p>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th className="num">Papers</th>
                          <th className="num">Average</th>
                          <th className="num">Best</th>
                          <th>Latest vs earlier</th>
                          <th className="num">Expected mark</th>
                          <th className="num">Expected grade</th>
                          <th>Next grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sids.map((sid) => {
                          const g = groups[sid];
                          const s = state.subjects.find((x) => x.id === sid);
                          const cnt = g.items.length;
                          const avg = g.sum / cnt;

                          let trend = '–';
                          if (cnt >= 2) {
                            const sortedItems = [...g.items].sort((a, b) =>
                              a.date < b.date ? -1 : a.date > b.date ? 1 : 0
                            );
                            const lastP = (sortedItems[cnt - 1].mark / sortedItems[cnt - 1].total) * 100;
                            let pv = 0;
                            for (let j = 0; j < cnt - 1; j++) {
                              pv += (sortedItems[j].mark / sortedItems[j].total) * 100;
                            }
                            pv /= cnt - 1;
                            const df = Math.round(lastP - pv);
                            trend = `${df > 0 ? '+' : ''}${df}%`;
                          }

                          let exp = '–';
                          let gr = '–';
                          let nx = '–';
                          if (s && s.bounds) {
                            const mk = Math.round((avg / 100) * s.bounds.max);
                            const gg = gradeFor({ board: s.board, bounds: s.bounds, mark: mk });
                            exp = `${mk} / ${s.bounds.max}`;
                            if (gg) {
                              gr = gg.grade;
                              nx =
                                gg.next && gg.next > 0
                                  ? `${gg.next} marks to ${s.board === 'cambridge' ? '' : 'grade '}${gg.nextName}`
                                  : gg.next === null
                                  ? 'Top grade'
                                  : '–';
                            }
                          }

                          return (
                            <tr
                              key={sid}
                              className="hued"
                              style={{ '--h': s ? s.hue : 215 } as React.CSSProperties}
                            >
                              <td>
                                <span className="dot" /> {s ? s.name : g.name}
                              </td>
                              <td className="num">{cnt}</td>
                              <td className="num">{Math.round(avg)}%</td>
                              <td className="num">{Math.round(g.best)}%</td>
                              <td>
                                {trend !== '–' ? (
                                  <span
                                    className={`pill ${
                                      trend.startsWith('+') ? 'good' : 'bad'
                                    }`}
                                  >
                                    {trend}
                                  </span>
                                ) : (
                                  trend
                                )}
                              </td>
                              <td className="num">{exp}</td>
                              <td className="num">
                                <b>{gr}</b>
                              </td>
                              <td>{nx}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="muted" style={{ fontSize: '.82rem', marginTop: '10px' }}>
                    Expected mark applies your average paper score to the subject's total marks and reads the grade from the boundaries in the Grade boundaries section of Past papers. It is a guide only. Real boundaries change every series.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subpanel 3: Colors (Revamped with Simplicity & Liquid Glass) */}
      {subTab === 'st-colors' && (
        <div className="subpanel color-revamp-wrap" id="st-colors">
          {/* Live Liquid Glass Preview Card */}
          <div className="live-preview-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                  Live Glass Preview
                </div>
                <h3 style={{ marginTop: '2px' }}>
                  {state.look.bg ? state.look.bg.charAt(0).toUpperCase() + state.look.bg.slice(1) : 'Custom'} · {state.theme === 'auto' ? 'Auto System' : state.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="pill run">
                  {state.look.mode === 'subject' ? 'Syncing to Active Subject' : `${state.look.fixed}° Hue`}
                </span>
                <span className="pill good">Frosted Reflection Active</span>
              </div>
            </div>

            <div className="mini-dial-preview" style={{ flexWrap: 'wrap', marginTop: '4px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'color-mix(in srgb, var(--surface) 50%, transparent)',
                  borderRadius: '50%',
                  border: '1px solid color-mix(in srgb, var(--line) 60%, white 40%)',
                  boxShadow: '0 6px 16px -2px hsl(var(--h) var(--acc-s) var(--acc-l) / 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.7)',
                }}
              >
                <svg width="68" height="68" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ring-track)" strokeWidth="6" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="6"
                    strokeDasharray={264}
                    strokeDashoffset={66}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span className="mono" style={{ position: 'absolute', fontWeight: 700, fontSize: '0.85rem' }}>
                  25:00
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn primary sm">
                    Sample Button
                  </button>
                  <button type="button" className="btn sm">
                    Secondary
                  </button>
                  <span className="pill">Sample Tag</span>
                </div>
                <p className="muted" style={{ fontSize: '0.82rem' }}>
                  Liquid glass cards refract the ambient glow of your accent color with silky smooth specular highlights and frosted blur.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Curated Liquid Glass Moods */}
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Curated Glass Moods</h2>
                <p className="muted" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                  One-tap complete visual themes with balanced palettes and liquid refraction.
                </p>
              </div>
            </div>

            <div className="glass-theme-grid">
              {GLASS_THEMES.map((gt) => {
                const isActive = state.look.bg === gt.bgKey && state.look.fixed === gt.hue && state.look.mode === 'fixed';
                return (
                  <button
                    key={gt.id}
                    type="button"
                    className="glass-theme-card"
                    aria-pressed={isActive}
                    onClick={() => {
                      handleSelectPalette(gt.bgKey);
                      handleSetLookMode('fixed');
                      handleSetFixedHue(gt.hue);
                    }}
                  >
                    <div
                      className="glass-theme-preview"
                      style={{ background: gt.previewGradient }}
                    >
                      <span>{gt.name}</span>
                      <i
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          boxShadow: '0 0 6px #FFFFFF',
                          display: 'inline-block',
                        }}
                      />
                    </div>
                    <b>{gt.name}</b>
                    <small>{gt.desc}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Appearance & Accent Picker */}
          <div className="split">
            {/* Appearance Mode */}
            <div className="card">
              <div className="card-head">
                <h2>Appearance</h2>
              </div>
              <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '14px' }}>
                Switch between frosted light crystal, deep obsidian glass, or automatic system sync.
              </p>

              <div className="mode-selector-glass">
                <button
                  type="button"
                  className="mode-glass-btn"
                  aria-pressed={state.theme === 'auto'}
                  onClick={() => onUpdateState((prev) => ({ ...prev, theme: 'auto' }))}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <span>Auto</span>
                </button>

                <button
                  type="button"
                  className="mode-glass-btn"
                  aria-pressed={state.theme === 'light'}
                  onClick={() => onUpdateState((prev) => ({ ...prev, theme: 'light' }))}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  className="mode-glass-btn"
                  aria-pressed={state.theme === 'dark'}
                  onClick={() => onUpdateState((prev) => ({ ...prev, theme: 'dark' }))}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Accent Color Chooser */}
            <div className="card">
              <div className="card-head">
                <h2>Accent Color</h2>
              </div>

              <div className="chip-row" role="group" aria-label="Accent mode" style={{ marginBottom: '14px' }}>
                <button
                  type="button"
                  className="chip"
                  aria-pressed={activeMode === 'subject'}
                  onClick={() => handleSetLookMode('subject')}
                >
                  Follow my subject
                </button>
                <button
                  type="button"
                  className="chip"
                  aria-pressed={activeMode === 'fixed'}
                  onClick={() => handleSetLookMode('fixed')}
                >
                  Custom color
                </button>
                <button
                  type="button"
                  className="chip"
                  aria-pressed={activeMode === 'tool'}
                  onClick={() => handleSetLookMode('tool')}
                >
                  Color per tool
                </button>
              </div>

              {activeMode === 'subject' && (
                <div style={{ background: 'var(--accent-soft)', padding: '14px', borderRadius: '10px' }}>
                  <p style={{ fontSize: '0.88rem' }}>
                    <b>Dynamic Adaptation Active:</b> The accent color automatically matches whichever subject you pick at the top (Physics, Chemistry, Maths, etc.). Set individual subject colors in <b>My subjects</b>.
                  </p>
                </div>
              )}

              {activeMode === 'fixed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div className="eyebrow" style={{ marginBottom: '8px' }}>
                      Quick Swatches
                    </div>
                    <div className="glass-swatch-grid">
                      {ACCENT_SWATCHES.map((sw) => {
                        const isSelected = state.look.fixed === sw.hue;
                        return (
                          <button
                            key={sw.name}
                            type="button"
                            className="glass-swatch"
                            aria-label={sw.name}
                            title={`${sw.name} (${sw.hue}°)`}
                            aria-pressed={isSelected}
                            style={{ background: sw.color }}
                            onClick={() => handleSetFixedHue(sw.hue)}
                          >
                            {isSelected && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="field" htmlFor="hue-fixed">
                      <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                        <span>Smooth Hue Spectrum</span>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                          {state.look.fixed}°
                        </span>
                      </span>
                      <input
                        type="range"
                        className="hue"
                        id="hue-fixed"
                        min={0}
                        max={360}
                        value={state.look.fixed}
                        onChange={(e) => handleSetFixedHue(parseInt(e.target.value, 10))}
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeMode === 'tool' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p className="muted" style={{ fontSize: '0.82rem' }}>
                    Each navigation tab illuminates with its own dedicated hue:
                  </p>
                  {TOOLS.map(([tId, tLabel]) => {
                    const val = state.look.tools[tId] ?? state.look.fixed;
                    return (
                      <label key={tId} className="field" htmlFor={`hue-${tId}`}>
                        <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <span>{tLabel}</span>
                          <span className="mono">{val}°</span>
                        </span>
                        <input
                          type="range"
                          className="hue"
                          id={`hue-${tId}`}
                          min={0}
                          max={360}
                          value={val}
                          onChange={(e) => handleSetToolHue(tId, parseInt(e.target.value, 10))}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Advanced Fine-Tuning Drawer (Collapsed by default so it's simple & unobtrusive) */}
          <details className="advanced-colors-drawer">
            <summary>
              <span>Fine-Tune Individual UI Tokens (Advanced)</span>
              <span className="pill sm">Optional</span>
            </summary>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p className="muted" style={{ fontSize: '0.85rem' }}>
                  Editing <b>{editingDarkColors ? 'dark mode' : 'light mode'}</b> tokens. Each mode preserves its own values.
                </p>
                <button
                  className="btn sm"
                  type="button"
                  onClick={() => setEditingDarkColors(!editingDarkColors)}
                >
                  Switch to {editingDarkColors ? 'light' : 'dark'} tokens
                </button>
              </div>

              <div>
                {CC.map(([groupName, tokens]) => (
                  <div key={groupName} className="cc-group">
                    <div className="eyebrow">{groupName}</div>
                    <div className="cc-grid">
                      {tokens.map(([tokenKey, tokenLabel]) => {
                        const customVal = currentCustomMap[tokenKey];
                        return (
                          <div key={tokenKey} className="cc-item">
                            <input
                              type="color"
                              value={customVal || '#888888'}
                              aria-label={tokenLabel}
                              onChange={(e) => handleCustomColorChange(tokenKey, e.target.value)}
                            />
                            <span>
                              {tokenLabel}
                              <small>{customVal ? 'Custom' : 'Default'}</small>
                            </span>
                            {customVal && (
                              <button
                                type="button"
                                className="x"
                                aria-label={`Reset ${tokenLabel}`}
                                title="Reset"
                                onClick={() => handleResetCustomColor(tokenKey)}
                              >
                                ↺
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>

          {/* Reset all button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button className="btn" type="button" onClick={handleResetAllColors}>
              Reset all colors to default
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
