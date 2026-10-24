# Study Studio

Study Studio is a focused study companion application rewritten as a modern React SPA using TypeScript and Vite.

## Features

- **Study Timer**: Circular progress dial with visual ring, focus sessions, exam paper timing modes, custom session configuration, exam pacing tables (time checkpoints and marks distribution), and Web Audio synthesizer for focus sounds (White, Pink, Brown, Rain noise, and Pure/Pulsed frequency tones).
- **Stopwatch**: High-precision split timer with lap tracking, fastest/slowest lap detection, and keyboard controls (Spacebar).
- **Exam Countdown**: Real-time countdown clock (days, hours, minutes, seconds) to upcoming IGCSE/GCSE exams, with an all-exams schedule sorted by date.
- **Past Papers Tracker**:
  - Paper logging with automatic points calculation (10 points + 1 point per 5% score).
  - Interactive June 2026 Grade Threshold tables for Cambridge (A*-G), Pearson Edexcel (9-1), and OxfordAQA (9-1), including visual mark bar and editable thresholds.
  - Direct past paper links and question papers / mark schemes (QP/MS/MA) from PapaCambridge and Physics & Maths Tutor.
- **Leaderboards**: Filter by Everyone or Friends, ranked by all-time points, weekly points, or study streak.
- **My Subjects**: Manage exam subjects, boards, and 9 custom accent hues with autocomplete catalog of 30+ IGCSE subjects.
- **Settings & Progress**:
  - Google Account sync via Firebase Authentication & Firestore.
  - Username claiming and friend system.
  - 7 Rank levels (`Starter`, `Amateur`, `Popping Off`, `Hard Working`, `Gamed`, `Achiever`, `da7ee7`).
  - 14-day study focus bar charts and points activity feed.
  - Full color theme customization (Slate, Ink, Forest, Plum, Paper, Mono palettes, Dark/Light modes, and individual UI token color pickers).

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Bundler & Dev Server**: Vite (running on port 3000)
- **Audio**: Web Audio API (real-time noise synthesis and biquad filters)
- **Database & Auth**: Firebase Auth & Cloud Firestore
