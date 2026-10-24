export type BoardType = 'cambridge' | 'edexcel' | 'oxford';

export interface SubjectBounds {
  max: number;
  marks: (number | null)[];
}

export interface SubjectSource {
  official: boolean;
  text?: string;
}

export interface Subject {
  id: string;
  name: string;
  board: BoardType;
  hue: number;
  bounds: SubjectBounds;
  mark: number | null;
  src?: SubjectSource;
}

export interface CustomMode {
  id: string;
  name: string;
  min: number;
  marks?: number;
}

export interface Exam {
  id: string;
  sid: string;
  subj: string;
  paper: string;
  when: string;
  ex?: boolean;
}

export type NoiseType = 'white' | 'pink' | 'brown' | 'rain' | 'tone';
export type ToneMode = 'pure' | 'pulse';

export interface NoiseConfig {
  type: NoiseType;
  vol: number;
  link: boolean;
  hz?: number;
  tmode?: ToneMode;
}

export interface UserAccount {
  username: string;
  claimed: boolean;
}

export interface Paper {
  id: string;
  sid: string;
  subj: string;
  name: string;
  date: string;
  mark: number;
  total: number;
  pts: number;
}

export interface FeedItem {
  t: number;
  n: number;
  w: string;
  k: string;
}

export interface Friend {
  id: string;
  u: string;
}

export interface LookConfig {
  mode: 'subject' | 'fixed' | 'tool';
  fixed: number;
  tools: Record<string, number>;
  bg: string;
  custom: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export interface WeekState {
  k: string;
  p: number;
}

export interface AppState {
  v: number;
  theme: 'auto' | 'light' | 'dark';
  active: string;
  mode: string;
  subjects: Subject[];
  customs: CustomMode[];
  exams: Exam[];
  noise: NoiseConfig;
  me: UserAccount;
  pts: number;
  wk: WeekState;
  log: Record<string, number>; // date "YYYY-MM-DD" -> minutes
  papers: Paper[];
  feed: FeedItem[];
  friends: Friend[];
  bonusDay: string;
  ts?: number;
  look: LookConfig;
}

export interface PlayerDoc {
  id: string;
  username: string;
  uname?: string;
  pts: number;
  wk?: { k: string; p: number };
  streak?: number;
  best?: number;
  focus?: number;
  papers?: number;
  avg?: number | null;
  day?: string;
  ts?: number;
}

export interface Lap {
  split: number;
  total: number;
}

export interface TimerModeItem {
  id: string;
  g: 'focus' | 'exam' | 'custom';
  name: string;
  min: number;
  brk?: boolean;
  subj?: string;
  detail?: string;
  marks?: number;
}
