import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AppState,
  BoardType,
  CustomMode,
  Exam,
  NoiseConfig,
  Paper,
  PlayerDoc,
  Subject,
  TimerModeItem,
} from './types';
import {
  addDays,
  applyBounds,
  defaultLook,
  dKey,
  freshState,
  KEY,
  MODES,
  seedState,
  weekKey,
} from './constants/data';
import { playBeep, startNoise, stopNoise } from './services/audio';
import {
  firebaseService,
  FirebaseUser,
  SyncState,
} from './services/firebase';
import { Header } from './components/Header';
import { TabsNav } from './components/TabsNav';
import { TimerTab } from './components/TimerTab';
import { StopwatchTab } from './components/StopwatchTab';
import { ExamsTab } from './components/ExamsTab';
import { PastPapersTab } from './components/PastPapersTab';
import { LeaderboardTab } from './components/LeaderboardTab';
import { SubjectsTab } from './components/SubjectsTab';
import { SettingsTab } from './components/SettingsTab';

export const App: React.FC = () => {
  // Load initial state from localStorage
  const [state, setState] = useState<AppState>(() => {
    const fresh = freshState();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const loaded = JSON.parse(raw);
        if (loaded && loaded.subjects && loaded.subjects.length) {
          const merged = { ...fresh, ...loaded };
          merged.noise = { ...fresh.noise, ...(loaded.noise || {}) };
          merged.look = { ...defaultLook(), ...(loaded.look || {}) };
          merged.look.tools = { ...defaultLook().tools, ...(loaded.look?.tools || {}) };
          merged.look.custom = {
            light: { ...(loaded.look?.custom?.light || {}) },
            dark: { ...(loaded.look?.custom?.dark || {}) },
          };
          if (loaded.v !== 2) {
            merged.subjects.forEach((x: Subject) => {
              const mk = x.mark;
              applyBounds(x, x.bounds && x.bounds.max);
              x.mark = mk;
            });
            merged.v = 2;
          }
          return merged;
        }
      }
    } catch {
      // fallback
    }
    return fresh;
  });

  const [currentTab, setCurrentTab] = useState<string>('timer');
  const [now, setNow] = useState<number>(Date.now());

  // Firebase auth & sync state
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [syncError, setSyncError] = useState<string>('');
  const [players, setPlayers] = useState<PlayerDoc[]>([]);

  // Timer internal state
  const [timerMode, setTimerMode] = useState<TimerModeItem>(() => {
    const foundMode = MODES.find((m) => m.id === state.mode);
    if (foundMode) return foundMode;
    const foundCustom = state.customs.find((c) => c.id === state.mode);
    if (foundCustom) {
      return {
        id: foundCustom.id,
        g: 'custom' as const,
        name: foundCustom.name,
        min: foundCustom.min,
        marks: foundCustom.marks,
        detail: foundCustom.marks ? `${foundCustom.marks} marks` : '',
      };
    }
    return MODES[5]; // Physics P4 default
  });

  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerElapsed, setTimerElapsed] = useState<number>(0);
  const [timerDone, setTimerDone] = useState<boolean>(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number>(0);
  const timerWarnedRef = useRef<boolean>(false);
  const timerCredMinRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);

  const timerDur = timerMode.min * 60000;
  const remMs = Math.max(
    0,
    timerDur - timerElapsed - (timerRunning ? now - timerStartedAt : 0)
  );

  // Active subject helper
  const activeSubj =
    state.subjects.find((s) => s.id === state.active) || state.subjects[0];

  // Effective Hue computation
  const getEffHue = useCallback(() => {
    const L = state.look;
    if (L.mode === 'fixed') return L.fixed;
    if (L.mode === 'tool') {
      const t = L.tools[currentTab];
      return t != null ? t : L.fixed;
    }
    return activeSubj ? activeSubj.hue : 215;
  }, [state.look, currentTab, activeSubj]);

  // Streak calculation
  const calcStreak = useCallback(() => {
    const a: Record<string, number> = {};
    for (const k in state.log) {
      if (state.log[k] >= 10) a[k] = 1;
    }
    state.papers.forEach((p) => {
      a[p.date] = 1;
    });

    const t = dKey();
    let cur = 0;
    let k = a[t] ? t : addDays(t, -1);
    while (a[k]) {
      cur++;
      k = addDays(k, -1);
    }

    const days = Object.keys(a).sort();
    let best = 0;
    let run = 0;
    let prev: string | null = null;
    days.forEach((d) => {
      run = prev && addDays(prev, 1) === d ? run + 1 : 1;
      if (run > best) best = run;
      prev = d;
    });

    return { cur, best: Math.max(best, cur), today: !!a[t] };
  }, [state.log, state.papers]);

  const streak = calcStreak();

  // Save to localStorage & queue Firebase sync
  const saveState = useCallback(
    (newState: AppState, immediateSync: boolean = false) => {
      const withTs = { ...newState, ts: Date.now() };
      setState(withTs);
      try {
        localStorage.setItem(KEY, JSON.stringify(withTs));
      } catch {
        // ignore
      }
      firebaseService.queueSync(withTs, streak, immediateSync);
    },
    [streak]
  );

  // Points awarding function
  const awardPoints = useCallback(
    (n: number, why: string, kind: string = '') => {
      if (!(n > 0)) return;
      setState((prev) => {
        const curWk = weekKey();
        const wk =
          prev.wk && prev.wk.k === curWk
            ? { ...prev.wk, p: prev.wk.p + n }
            : { k: curWk, p: n };

        const feed = [...prev.feed];
        const f0 = feed[0];
        const currentTime = Date.now();
        if (
          kind === 'focus' &&
          f0 &&
          f0.k === 'focus' &&
          f0.w === why &&
          currentTime - f0.t < 180000
        ) {
          feed[0] = { ...f0, n: f0.n + n, t: currentTime };
        } else {
          feed.unshift({ t: currentTime, n, w: why, k: kind });
          if (feed.length > 25) feed.length = 25;
        }

        const next = {
          ...prev,
          pts: (prev.pts || 0) + n,
          wk,
          feed,
          ts: Date.now(),
        };

        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        firebaseService.queueSync(next, streak, false);
        return next;
      });
    },
    [streak]
  );

  // Focus crediting
  const creditFocus = useCallback(() => {
    if (!timerMode || timerMode.brk || !timerRunning) return;
    const currentRem = Math.max(
      0,
      timerDur - timerElapsed - (Date.now() - timerStartedAt)
    );
    const done = Math.floor((timerDur - currentRem) / 60000);
    if (done > timerCredMinRef.current) {
      const diff = done - timerCredMinRef.current;
      timerCredMinRef.current = done;
      const k = dKey();
      setState((prev) => {
        const log = { ...prev.log, [k]: (prev.log[k] || 0) + diff };
        return { ...prev, log };
      });
      awardPoints(diff, `Focus · ${timerMode.name}`, 'focus');

      // Check daily streak bonus
      const kDay = dKey();
      if (state.bonusDay !== kDay && streak.today) {
        setState((prev) => ({ ...prev, bonusDay: kDay }));
        awardPoints(Math.min(streak.cur, 10), `${streak.cur}-day streak bonus`, 'streak');
      }
    }
  }, [timerMode, timerRunning, timerDur, timerElapsed, timerStartedAt, awardPoints, state.bonusDay, streak]);

  // Finish Timer
  const finishTimer = useCallback(() => {
    creditFocus();
    if (timerMode && !timerMode.brk) {
      awardPoints(timerMode.g === 'exam' ? 10 : 5, `Finished ${timerMode.name}`, 'bonus');
    }
    setTimerRunning(false);
    setTimerElapsed(timerDur);
    setTimerDone(true);
    stopNoise();
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch {
        // ignore
      }
    }
    playBeep(4, 880);
  }, [creditFocus, timerMode, timerDur, awardPoints]);

  // Main 250ms tick loop
  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      if (timerRunning) {
        creditFocus();
        const currentRem = Math.max(
          0,
          timerDur - timerElapsed - (currentNow - timerStartedAt)
        );

        if (currentRem <= 0) {
          finishTimer();
        } else {
          if (
            timerMode.g === 'exam' &&
            !timerWarnedRef.current &&
            currentRem <= 600000 &&
            timerDur > 600000
          ) {
            timerWarnedRef.current = true;
            playBeep(1, 660);
          }
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerRunning, timerDur, timerElapsed, timerStartedAt, timerMode, creditFocus, finishTimer]);

  // Title update
  useEffect(() => {
    const sec = Math.ceil(remMs / 1000);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const clockStr = `${pad(m)}:${pad(s)}`;
    document.title = `${timerRunning ? clockStr + ' · ' : ''}Study Studio`;
  }, [timerRunning, remMs]);

  // Theme & CSS variable synchronization
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', state.theme);
    }

    const effH = getEffHue();
    root.style.setProperty('--h', String(effH));

    // Custom palette overrides
    let el = document.getElementById('ccStyle') as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = 'ccStyle';
      document.head.appendChild(el);
    }

    const isDark =
      state.theme === 'dark' ||
      (state.theme !== 'light' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    const customMap = (state.look?.custom || {})[isDark ? 'dark' : 'light'] || {};
    let css = '';
    Object.keys(customMap).forEach((k) => {
      if (!/^#[0-9a-f]{6}$/i.test(customMap[k])) return;
      css += `--${k}:${
        k === 'accent-soft'
          ? `color-mix(in srgb,${customMap[k]} 18%,transparent)`
          : customMap[k]
      };`;
    });
    if (customMap.accent && !customMap['accent-soft']) {
      css += `--accent-soft:color-mix(in srgb,${customMap.accent} 16%,transparent);`;
    }
    el.textContent = css ? `:root:root:root,.hued.hued.hued{${css}}` : '';
  }, [state.theme, state.look, getEffHue]);

  // Keyboard shortcut listener (Spacebar for Timer or Stopwatch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code !== 'Space' ||
        (e.target as HTMLElement)?.closest('button,input,select,textarea,a')
      ) {
        return;
      }
      if (currentTab === 'timer') {
        e.preventDefault();
        handleStartPauseTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // WakeLock helper
  const acquireWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch {
      // ignore
    }
  };

  const releaseWakeLock = () => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {
      // ignore
    }
  };

  // Timer controls
  const handleStartPauseTimer = () => {
    if (timerDone) {
      handleResetTimer();
      return;
    }
    if (timerRunning) {
      // Pause
      creditFocus();
      setTimerElapsed((prev) => prev + (Date.now() - timerStartedAt));
      setTimerRunning(false);
      if (state.noise.link) stopNoise();
      releaseWakeLock();
    } else {
      // Start
      setTimerRunning(true);
      setTimerStartedAt(Date.now());
      if (state.noise.link) {
        const hzVal = state.noise.hz || 528;
        const currentToneMode =
          hzVal < 20
            ? 'pulse'
            : hzVal > 60
            ? 'pure'
            : state.noise.tmode === 'pulse'
            ? 'pulse'
            : 'pure';
        startNoise(state.noise.type, state.noise.vol, hzVal, currentToneMode);
      }
      acquireWakeLock();
    }
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerElapsed(0);
    setTimerDone(false);
    timerWarnedRef.current = false;
    timerCredMinRef.current = 0;
    if (state.noise.link) stopNoise();
    releaseWakeLock();
  };

  const handleSelectMode = (m: TimerModeItem) => {
    setTimerMode(m);
    setTimerElapsed(0);
    setTimerRunning(false);
    setTimerDone(false);
    timerWarnedRef.current = false;
    timerCredMinRef.current = 0;

    const nextState = { ...state };
    if (m.id !== 'tmp' && !m.id.startsWith('c-')) {
      nextState.mode = m.id;
    }
    if (m.subj) {
      const s = state.subjects.find((x) => x.name.toLowerCase() === m.subj?.toLowerCase());
      if (s) {
        nextState.active = s.id;
      }
    }
    saveState(nextState);
  };

  // Initialize Firebase sync on mount
  useEffect(() => {
    firebaseService.init(
      (user) => {
        setFbUser(user);
      },
      (remoteState) => {
        setState((prev) => {
          if (remoteState.ts && remoteState.ts <= (prev.ts || 0)) return prev;
          const merged = { ...prev, ...remoteState };
          try {
            localStorage.setItem(KEY, JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
      },
      (newPlayers) => {
        setPlayers(newPlayers);
      },
      (sState, sErr) => {
        setSyncState(sState);
        setSyncError(sErr);
      }
    );
  }, []);

  return (
    <div className="app">
      <Header
        pts={state.pts || 0}
        streak={streak}
        subjects={state.subjects}
        activeSubjectId={state.active}
        onActiveSubjectChange={(id) => saveState({ ...state, active: id })}
        theme={state.theme}
        onThemeToggle={() => {
          const next =
            state.theme === 'auto'
              ? 'light'
              : state.theme === 'light'
              ? 'dark'
              : 'auto';
          saveState({ ...state, theme: next });
        }}
      />

      <TabsNav currentTab={currentTab} onTabChange={setCurrentTab} />

      <main>
        {currentTab === 'timer' && (
          <TimerTab
            currentMode={timerMode}
            onSelectMode={handleSelectMode}
            timerRunning={timerRunning}
            timerElapsed={timerElapsed}
            timerDone={timerDone}
            timerDuration={timerDur}
            remMs={remMs}
            onStartPause={handleStartPauseTimer}
            onReset={handleResetTimer}
            subjects={state.subjects}
            customs={state.customs}
            onAddCustom={(c) => {
              const updated = [...state.customs, c];
              saveState({ ...state, customs: updated });
            }}
            onDeleteCustom={(id) => {
              const updated = state.customs.filter((c) => c.id !== id);
              saveState({ ...state, customs: updated });
              if (timerMode.id === id) {
                handleSelectMode(MODES[5]); // Physics P4 default
              }
            }}
            noise={state.noise}
            onNoiseChange={(noise) => saveState({ ...state, noise })}
          />
        )}

        {currentTab === 'stopwatch' && <StopwatchTab />}

        {currentTab === 'exams' && (
          <ExamsTab
            exams={state.exams}
            subjects={state.subjects}
            now={now}
            onAddExam={(examData) => {
              const newExam: Exam = {
                id: `e-${Math.random().toString(36).slice(2, 8)}`,
                ...examData,
              };
              saveState({ ...state, exams: [...state.exams, newExam] });
            }}
            onDeleteExam={(id) => {
              saveState({
                ...state,
                exams: state.exams.filter((x) => x.id !== id),
              });
            }}
          />
        )}

        {currentTab === 'papers' && (
          <PastPapersTab
            papers={state.papers}
            subjects={state.subjects}
            onAddPaper={(paperData) => {
              const pct = paperData.total > 0 ? (paperData.mark / paperData.total) * 100 : 0;
              const pts = 10 + Math.round(pct / 5);
              const newPaper: Paper = {
                id: `p-${Math.random().toString(36).slice(2, 8)}`,
                ...paperData,
                pts,
              };
              const updatedPapers = [...state.papers, newPaper];
              saveState({ ...state, papers: updatedPapers });
              awardPoints(
                pts,
                `${paperData.subj} · ${paperData.name} (${Math.round(pct)}%)`,
                'paper'
              );
            }}
            onDeletePaper={(id) => {
              const p = state.papers.find((x) => x.id === id);
              if (!p) return;
              const updatedPapers = state.papers.filter((x) => x.id !== id);
              const ptsToDeduct = p.pts || 0;
              const curWk = weekKey();
              setState((prev) => {
                const nextPts = Math.max(0, (prev.pts || 0) - ptsToDeduct);
                const nextWk =
                  prev.wk && prev.wk.k === curWk
                    ? { ...prev.wk, p: Math.max(0, prev.wk.p - ptsToDeduct) }
                    : { k: curWk, p: 0 };
                const nextState = {
                  ...prev,
                  papers: updatedPapers,
                  pts: nextPts,
                  wk: nextWk,
                  ts: Date.now(),
                };
                try {
                  localStorage.setItem(KEY, JSON.stringify(nextState));
                } catch {
                  // ignore
                }
                firebaseService.queueSync(nextState, streak, false);
                return nextState;
              });
            }}
            onUpdateSubjectBounds={(updatedSubj) => {
              const updated = state.subjects.map((s) =>
                s.id === updatedSubj.id ? updatedSubj : s
              );
              saveState({ ...state, subjects: updated });
            }}
          />
        )}

        {currentTab === 'board' && (
          <LeaderboardTab
            players={players}
            currentUserId={fbUser?.id}
            currentUserDoc={
              fbUser
                ? {
                    id: fbUser.id,
                    username: state.me.username || fbUser.name,
                    pts: state.pts || 0,
                    wk: state.wk,
                    streak: streak.cur,
                    best: streak.best,
                    focus: Object.values(state.log).reduce((a, b) => a + b, 0),
                    papers: state.papers.length,
                    avg:
                      state.papers.length > 0
                        ? Math.round(
                            (state.papers.reduce(
                              (acc, p) => acc + (p.total > 0 ? (p.mark / p.total) * 100 : 0),
                              0
                            ) /
                              state.papers.length) *
                              10
                          ) / 10
                        : null,
                  }
                : null
            }
            friends={state.friends}
            isSignedIn={!!fbUser}
            claimedUsername={state.me.claimed}
          />
        )}

        {currentTab === 'subjects' && (
          <SubjectsTab
            subjects={state.subjects}
            onAddSubject={(name, board, max) => {
              const newSubj: Subject = {
                id: `s-${Math.random().toString(36).slice(2, 8)}`,
                name,
                board,
                hue: state.subjects.length > 0 ? (state.subjects[state.subjects.length - 1].hue + 45) % 360 : 215,
                bounds: { max: max || 100, marks: [] },
                mark: null,
              };
              applyBounds(newSubj, max);
              saveState({ ...state, subjects: [...state.subjects, newSubj] });
            }}
            onUpdateSubject={(updated) => {
              const updatedSubjects = state.subjects.map((s) =>
                s.id === updated.id ? updated : s
              );
              // Also update exams with new name if renamed
              const updatedExams = state.exams.map((x) =>
                x.sid === updated.id ? { ...x, subj: updated.name } : x
              );
              saveState({
                ...state,
                subjects: updatedSubjects,
                exams: updatedExams,
              });
            }}
            onDeleteSubject={(id) => {
              if (state.subjects.length <= 1) return;
              const updated = state.subjects.filter((s) => s.id !== id);
              const nextActive = state.active === id ? updated[0].id : state.active;
              saveState({ ...state, subjects: updated, active: nextActive });
            }}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsTab
            state={state}
            onUpdateState={(fn) => {
              const next = fn(state);
              saveState(next);
            }}
            streak={streak}
            firebaseUser={fbUser}
            syncState={syncState}
            syncError={syncError}
            isConfigured={firebaseService.isConfigured}
            onSignIn={() => firebaseService.signIn()}
            onSignOut={() => firebaseService.signOut()}
            onClaimUsername={async (name) => {
              const res = await firebaseService.claimUsername(name, state.me.claimed);
              if (res.success) {
                saveState(
                  {
                    ...state,
                    me: { username: name, claimed: !!fbUser },
                  },
                  true
                );
              }
              return res;
            }}
            onAddFriend={async (uname) => {
              const found = await firebaseService.lookupFriend(uname);
              if (!found) {
                return 'No player found with that username.';
              }
              if (found.id === fbUser?.id) {
                return 'That is your own username.';
              }
              if (state.friends.some((f) => f.id === found.id)) {
                return 'Already in your friends.';
              }
              saveState({
                ...state,
                friends: [...state.friends, { id: found.id, u: found.name }],
              });
              return null;
            }}
            onDeleteFriend={(id) => {
              saveState({
                ...state,
                friends: state.friends.filter((f) => f.id !== id),
              });
            }}
          />
        )}
      </main>
    </div>
  );
};
export default App;
