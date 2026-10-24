import React, { useState } from 'react';
import { CustomMode, NoiseConfig, Subject, TimerModeItem, ToneMode } from '../types';
import { fmtClock, fmtMin, MODES, NOISE_NAMES, TONES } from '../constants/data';
import { isNoiseActive, startNoise, stopNoise, updateNoiseVolume } from '../services/audio';

interface TimerTabProps {
  currentMode: TimerModeItem;
  onSelectMode: (mode: TimerModeItem) => void;
  timerRunning: boolean;
  timerElapsed: number;
  timerDone: boolean;
  timerDuration: number;
  remMs: number;
  onStartPause: () => void;
  onReset: () => void;
  subjects: Subject[];
  customs: CustomMode[];
  onAddCustom: (c: CustomMode) => void;
  onDeleteCustom: (id: string) => void;
  noise: NoiseConfig;
  onNoiseChange: (noise: NoiseConfig) => void;
}

const C = 2 * Math.PI * 88;

export const TimerTab: React.FC<TimerTabProps> = ({
  currentMode,
  onSelectMode,
  timerRunning,
  timerElapsed,
  timerDone,
  timerDuration,
  remMs,
  onStartPause,
  onReset,
  subjects,
  customs,
  onAddCustom,
  onDeleteCustom,
  noise,
  onNoiseChange,
}) => {
  const [lockHint, setLockHint] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customMin, setCustomMin] = useState<number>(45);
  const [customMarks, setCustomMarks] = useState<string>('');
  const [customHz, setCustomHz] = useState<string>('');
  const [toneMsg, setToneMsg] = useState<string>('');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(isNoiseActive());

  const isLocked = timerRunning || timerElapsed > 0;

  // Progress circle
  const sec = Math.ceil(remMs / 1000);
  const strokeOffset = C * (1 - (timerDuration ? remMs / timerDuration : 0));

  // State pill text & class
  let stateText = 'Ready';
  let stateClass = 'pill';
  if (timerDone) {
    stateText = "Time's up";
    stateClass += ' bad';
  } else if (timerRunning) {
    if (currentMode.g === 'exam' && remMs <= 600000) {
      stateText = 'Last 10 min';
      stateClass += ' warn';
    } else {
      stateText = 'Running';
      stateClass += ' run';
    }
  } else if (timerElapsed > 0) {
    stateText = 'Paused';
  }

  // All modes list
  const allModesList: TimerModeItem[] = [
    ...MODES,
    ...customs.map((c) => ({
      id: c.id,
      g: 'custom' as const,
      name: c.name,
      min: c.min,
      marks: c.marks,
      detail: c.marks ? `${c.marks} marks` : '',
    })),
  ];

  const handleModeClick = (mode: TimerModeItem) => {
    if (isLocked) {
      setLockHint('Reset the timer to change mode.');
      return;
    }
    setLockHint('');
    onSelectMode(mode);
  };

  const handleUseCustomOnce = () => {
    if (isLocked) return;
    if (!(customMin > 0)) {
      setLockHint('Enter the minutes first.');
      return;
    }
    setLockHint('');
    const marksNum = parseInt(customMarks, 10);
    const mItem: TimerModeItem = {
      id: 'tmp',
      g: 'custom',
      name: customName.trim() || `${customMin} min session`,
      min: Math.min(customMin, 600),
      marks: marksNum > 0 ? marksNum : undefined,
      detail: marksNum > 0 ? `${marksNum} marks` : '',
    };
    onSelectMode(mItem);
  };

  const handleSaveCustomMode = () => {
    if (isLocked) return;
    if (!(customMin > 0)) {
      setLockHint('Enter the minutes first.');
      return;
    }
    setLockHint('');
    const marksNum = parseInt(customMarks, 10);
    const newId = `c-${Math.random().toString(36).slice(2, 8)}`;
    const newCustom: CustomMode = {
      id: newId,
      name: customName.trim() || `${customMin} min session`,
      min: Math.min(customMin, 600),
      marks: marksNum > 0 ? marksNum : undefined,
    };
    onAddCustom(newCustom);
    setCustomName('');
    const mItem: TimerModeItem = {
      id: newId,
      g: 'custom',
      name: newCustom.name,
      min: newCustom.min,
      marks: newCustom.marks,
      detail: newCustom.marks ? `${newCustom.marks} marks` : '',
    };
    onSelectMode(mItem);
  };

  // Sound handlers
  const hzVal = noise.hz && noise.hz > 0 ? noise.hz : 528;
  const currentToneMode: ToneMode =
    hzVal < 20 ? 'pulse' : hzVal > 60 ? 'pure' : noise.tmode === 'pulse' ? 'pulse' : 'pure';

  const handleNoiseTypeChange = (type: string) => {
    const updated: NoiseConfig = { ...noise, type: type as NoiseConfig['type'] };
    onNoiseChange(updated);
    if (isAudioPlaying) {
      startNoise(type, updated.vol, hzVal, currentToneMode);
    }
  };

  const handleToneSelect = (hz: number) => {
    const tmode: ToneMode = hz < 20 ? 'pulse' : hz > 60 ? 'pure' : noise.tmode || 'pure';
    const updated: NoiseConfig = { ...noise, type: 'tone', hz, tmode };
    onNoiseChange(updated);
    setToneMsg('');
    if (isAudioPlaying) {
      startNoise('tone', updated.vol, hz, tmode);
    }
  };

  const handleToneModeSelect = (mode: ToneMode) => {
    const updated: NoiseConfig = { ...noise, type: 'tone', tmode: mode };
    onNoiseChange(updated);
    if (isAudioPlaying) {
      startNoise('tone', updated.vol, hzVal, mode);
    }
  };

  const handleCustomHzSubmit = () => {
    const val = parseFloat(customHz);
    if (!(val >= 1 && val <= 20000)) {
      setToneMsg('Enter a number from 1 to 20000.');
      return;
    }
    const cleanHz = Math.round(val * 100) / 100;
    handleToneSelect(cleanHz);
  };

  const handleVolumeChange = (vol: number) => {
    onNoiseChange({ ...noise, vol });
    updateNoiseVolume(vol);
  };

  const handleToggleSound = () => {
    if (isAudioPlaying) {
      stopNoise();
      setIsAudioPlaying(false);
    } else {
      startNoise(noise.type, noise.vol, hzVal, currentToneMode);
      setIsAudioPlaying(true);
    }
  };

  // Pacing highlight calculation
  let activeQuarter = 1;
  if (timerDuration > 0) {
    const elapsedRatio = (timerDuration - remMs) / timerDuration;
    activeQuarter = Math.min(4, Math.max(1, Math.ceil(elapsedRatio * 4)));
  }

  // Group exam papers by subject
  const examSubjects: string[] = [];
  allModesList
    .filter((m) => m.g === 'exam' && m.subj)
    .forEach((m) => {
      if (m.subj && !examSubjects.includes(m.subj)) {
        examSubjects.push(m.subj);
      }
    });

  // Sound note string
  let toneNote =
    'These are only sounds. No study shows that a particular frequency improves focus or memory, so pick whatever you find pleasant.';
  if (noise.type === 'tone') {
    if (hzVal < 20) {
      toneNote = `A pure tone below 20 Hz is too low to hear, so this plays a 220 Hz tone that pulses ${hzVal} times a second. ${toneNote}`;
    } else if (hzVal <= 60) {
      toneNote = `Tones this low are quiet on phone and laptop speakers. Headphones work best. Pulsed plays a 220 Hz tone that beats at this rate. ${toneNote}`;
    }
  }

  const noisePillText = !isAudioPlaying
    ? 'Off'
    : noise.type === 'tone'
    ? `${hzVal} Hz${currentToneMode === 'pulse' ? ' pulse' : ''} on`
    : `${NOISE_NAMES[noise.type] || noise.type} noise on`;

  return (
    <section id="tab-timer">
      <div className="split">
        {/* Left Column: Dial Card */}
        <div className="card dial-card">
          <div className="dial-top">
            <div>
              <div className="eyebrow" id="modeGroup">
                {currentMode.g === 'exam' ? 'Exam paper' : currentMode.g === 'focus' ? 'Focus session' : 'Custom'}
              </div>
              <h2 id="modeName">{currentMode.name}</h2>
            </div>
            <span className={stateClass} id="statePill">
              {stateText}
            </span>
          </div>

          <div className={`dial ${timerDone ? 'done' : ''}`} id="dial">
            <svg className="ring" viewBox="0 0 200 200" aria-hidden="true">
              <circle className="track" cx="100" cy="100" r="88" fill="none" strokeWidth="8" />
              <circle
                className="prog"
                cx="100"
                cy="100"
                r="88"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{ strokeDasharray: C, strokeDashoffset: strokeOffset }}
              />
              <g className="tick" strokeWidth="2">
                <line x1="100" y1="2" x2="100" y2="12" />
                <line x1="188" y1="100" x2="198" y2="100" />
                <line x1="100" y1="188" x2="100" y2="198" />
                <line x1="2" y1="100" x2="12" y2="100" />
              </g>
            </svg>
            <div className="dial-read">
              <div className="dial-time" id="timeText">
                {fmtClock(sec)}
              </div>
              <div className="dial-sub" id="timeSub">
                {timerDone ? 'Finished' : `of ${fmtMin(currentMode.min)}`}
              </div>
            </div>
          </div>

          <div className="ctrls">
            <button className="btn primary" type="button" onClick={onStartPause}>
              {timerDone ? 'Restart' : timerRunning ? 'Pause' : timerElapsed > 0 ? 'Resume' : 'Start'}
            </button>
            <button
              className="btn"
              type="button"
              onClick={onReset}
              disabled={!(timerRunning || timerElapsed > 0 || timerDone)}
            >
              Reset
            </button>
          </div>

          <p className="dial-sub">
            {currentMode.brk
              ? 'Breaks do not earn points.'
              : 'Earn 1 point for every minute of focus, plus a bonus for finishing.'}
          </p>

          {/* Pacing Table for Exam Papers */}
          {currentMode.marks && currentMode.marks > 0 && (
            <div className="paper">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'baseline' }}>
                <h3>Pacing for {currentMode.marks} marks</h3>
                <span className="muted mono" style={{ fontSize: '.85rem' }}>
                  {(currentMode.min / currentMode.marks).toFixed(2)} min per mark
                </span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Checkpoint</th>
                    <th className="num">Elapsed</th>
                    <th className="num">Marks done</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4].map((q) => {
                    const em = (currentMode.min * q) / 4;
                    const mk = Math.round((currentMode.marks! * q) / 4);
                    const isNow =
                      (timerRunning || timerElapsed > 0) && !timerDone && activeQuarter === q;
                    return (
                      <tr key={q} className={isNow ? 'now' : ''}>
                        <td>{q === 4 ? 'Finish' : `${q}/4 of the time`}</td>
                        <td className="num mono">{fmtClock(Math.round(em * 60))}</td>
                        <td className="num mono">{mk} marks</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {currentMode.min >= 45 && (
                <p className="muted" style={{ fontSize: '.85rem' }}>
                  Aim to finish writing by {fmtClock((currentMode.min - 10) * 60)} elapsed. That leaves 10 minutes to check.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Modes & Sound */}
        <div className="col">
          {/* Mode Selector Card */}
          <div className="card">
            <div className="card-head">
              <h2>Mode</h2>
              <span className="hint">{lockHint}</span>
            </div>
            <div>
              {/* Focus modes */}
              <div className="group">
                <div className="eyebrow">Focus</div>
                <div className="mode-grid">
                  {allModesList
                    .filter((m) => m.g === 'focus')
                    .map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`mode ${isLocked ? 'locked' : ''}`}
                        aria-pressed={currentMode.id === m.id}
                        onClick={() => handleModeClick(m)}
                      >
                        <b>{m.name}</b>
                        <small>{fmtMin(m.min)}</small>
                      </button>
                    ))}
                </div>
              </div>

              {/* Exam paper modes by subject */}
              {examSubjects.map((sn) => (
                <div key={sn} className="group">
                  <div className="eyebrow">{sn} papers</div>
                  <div className="mode-grid">
                    {allModesList
                      .filter((m) => m.subj === sn)
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`mode ${isLocked ? 'locked' : ''}`}
                          aria-pressed={currentMode.id === m.id}
                          onClick={() => handleModeClick(m)}
                        >
                          <b>{m.name}</b>
                          <small>
                            {fmtMin(m.min)}
                            {m.detail ? ` · ${m.detail}` : ''}
                          </small>
                        </button>
                      ))}
                  </div>
                </div>
              ))}

              {/* Custom modes */}
              <div className="group">
                <div className="eyebrow">Custom</div>
                {customs.length > 0 && (
                  <div className="mode-grid">
                    {customs.map((c) => {
                      const item = allModesList.find((m) => m.id === c.id);
                      if (!item) return null;
                      return (
                        <div key={c.id} className="custom-saved">
                          <button
                            type="button"
                            className={`mode ${isLocked ? 'locked' : ''}`}
                            aria-pressed={currentMode.id === c.id}
                            onClick={() => handleModeClick(item)}
                          >
                            <b>{c.name}</b>
                            <small>
                              {fmtMin(c.min)}
                              {c.marks ? ` · ${c.marks} marks` : ''}
                            </small>
                          </button>
                          <button
                            type="button"
                            className="x"
                            aria-label={`Delete ${c.name}`}
                            disabled={isLocked}
                            onClick={() => onDeleteCustom(c.id)}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="row" style={{ marginTop: '8px' }}>
                  <label className="field" htmlFor="cName">
                    Name
                    <input
                      type="text"
                      id="cName"
                      placeholder="History essay"
                      maxLength={30}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </label>
                  <label className="field" htmlFor="cMin" style={{ flex: '0 1 90px' }}>
                    Minutes
                    <input
                      type="number"
                      id="cMin"
                      min={1}
                      max={600}
                      value={customMin}
                      onChange={(e) => setCustomMin(parseInt(e.target.value, 10) || 0)}
                    />
                  </label>
                  <label className="field" htmlFor="cMarks" style={{ flex: '0 1 90px' }}>
                    Marks
                    <input
                      type="number"
                      id="cMarks"
                      min={0}
                      max={500}
                      placeholder="optional"
                      value={customMarks}
                      onChange={(e) => setCustomMarks(e.target.value)}
                    />
                  </label>
                </div>
                <div className="row">
                  <button
                    type="button"
                    className="btn sm"
                    disabled={isLocked}
                    onClick={handleUseCustomOnce}
                  >
                    Use once
                  </button>
                  <button
                    type="button"
                    className="btn sm"
                    disabled={isLocked}
                    onClick={handleSaveCustomMode}
                  >
                    Save mode
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sound Card */}
          <div className="card">
            <div className="card-head">
              <h2>Sound</h2>
              <span className={`pill ${isAudioPlaying ? 'run' : ''}`}>{noisePillText}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="group">
                <div className="eyebrow">Noise</div>
                <div className="chip-row" role="group" aria-label="Noise type">
                  {Object.keys(NOISE_NAMES).map((k) => (
                    <button
                      key={k}
                      type="button"
                      className="chip"
                      aria-pressed={noise.type === k}
                      onClick={() => handleNoiseTypeChange(k)}
                    >
                      {NOISE_NAMES[k]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="group">
                <div className="eyebrow">Tones in Hz</div>
                <div className="chip-row" role="group" aria-label="Tone frequency">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="chip"
                      aria-pressed={noise.type === 'tone' && hzVal === t}
                      onClick={() => handleToneSelect(t)}
                    >
                      {t} Hz
                    </button>
                  ))}
                </div>
              </div>

              <div className="row">
                <label className="field" htmlFor="toneHz" style={{ flex: '0 1 190px' }}>
                  Your own frequency (Hz)
                  <input
                    type="number"
                    id="toneHz"
                    min={1}
                    max={20000}
                    step="any"
                    inputMode="decimal"
                    placeholder="for example 7.83"
                    value={customHz}
                    onChange={(e) => setCustomHz(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomHzSubmit()}
                  />
                </label>
                <button className="btn" type="button" onClick={handleCustomHzSubmit}>
                  Use
                </button>
                <div className="chip-row" role="group" aria-label="Tone type" style={{ alignSelf: 'center' }}>
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={noise.type === 'tone' && currentToneMode === 'pure'}
                    disabled={hzVal < 20}
                    style={hzVal < 20 ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                    onClick={() => handleToneModeSelect('pure')}
                  >
                    Pure tone
                  </button>
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={noise.type === 'tone' && currentToneMode === 'pulse'}
                    disabled={hzVal > 60}
                    style={hzVal > 60 ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                    onClick={() => handleToneModeSelect('pulse')}
                  >
                    Pulsed
                  </button>
                </div>
              </div>

              {toneMsg && <p className="hint">{toneMsg}</p>}
              <p className="muted" style={{ fontSize: '.8rem', marginTop: '-8px' }}>
                {toneNote}
              </p>

              <label className="field" htmlFor="noiseVol">
                Volume
                <input
                  type="range"
                  id="noiseVol"
                  min={0}
                  max={1}
                  step={0.01}
                  value={noise.vol}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                />
              </label>

              <div className="row" style={{ alignItems: 'center' }}>
                <button className="btn" type="button" onClick={handleToggleSound}>
                  {isAudioPlaying ? 'Stop sound' : 'Play sound'}
                </button>
                <label className="check" htmlFor="noiseLink">
                  <input
                    type="checkbox"
                    id="noiseLink"
                    checked={noise.link}
                    onChange={(e) => onNoiseChange({ ...noise, link: e.target.checked })}
                  />
                  Start and stop with the timer
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
