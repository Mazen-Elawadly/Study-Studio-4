import { AppState, BoardType, CustomMode, LookConfig, Subject, SubjectBounds, TimerModeItem } from '../types';

export const KEY = 'studystudio.v1';

export const HUES = [215, 175, 150, 45, 28, 8, 330, 290, 255];
export const HUE_NAMES = ['Blue', 'Teal', 'Green', 'Amber', 'Orange', 'Red', 'Pink', 'Purple', 'Indigo'];

export const NINE = ['9', '8', '7', '6', '5', '4', '3', '2', '1'];

export const SCALE: Record<BoardType, string[]> = {
  cambridge: ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G'],
  edexcel: NINE,
  oxford: NINE,
};

export const PCT: Record<BoardType, number[]> = {
  cambridge: [78, 66, 54, 42, 32, 22, 12, 6],
  edexcel: [80, 70, 60, 51, 42, 33, 24, 15, 6],
  oxford: [80, 70, 60, 51, 42, 33, 24, 15, 6],
};

export const BOARD_NAME: Record<BoardType, string> = {
  cambridge: 'Cambridge · A* to G',
  edexcel: 'Edexcel · 9 to 1',
  oxford: 'OxfordAQA · 9 to 1',
};

export const SRC_NAME: Record<BoardType, string> = {
  cambridge: 'Cambridge',
  edexcel: 'Pearson Edexcel',
  oxford: 'OxfordAQA',
};

export const TOOLS: [string, string][] = [
  ['timer', 'Timer'],
  ['stopwatch', 'Stopwatch'],
  ['exams', 'Exam countdown'],
  ['papers', 'Past papers'],
  ['board', 'Leaderboard'],
  ['subjects', 'My subjects'],
  ['settings', 'Settings'],
];

export interface PalettePreset {
  n: string;
  l?: string[];
  d?: string[];
}

export const PAL: Record<string, PalettePreset> = {
  slate: { n: 'Slate' },
  ink: { n: 'Ink', l: ['#E9EEF7', '#FFFFFF', '#DDE5F2', '#C3CEE2'], d: ['#0A1020', '#121B30', '#1A2640', '#27344F'] },
  forest: { n: 'Forest', l: ['#E8F0EA', '#FFFFFF', '#DAE6DD', '#BFD0C4'], d: ['#0C1511', '#131E19', '#1B2A23', '#2A3B32'] },
  plum: { n: 'Plum', l: ['#F1EAF2', '#FFFFFF', '#E6DAE8', '#D2C2D5'], d: ['#160E19', '#1F1524', '#2B1D31', '#3B2A43'] },
  paper: { n: 'Paper', l: ['#F1EEE8', '#FFFFFF', '#E7E2D8', '#D3CCBE'], d: ['#14120E', '#1D1A15', '#27231C', '#383228'] },
  mono: { n: 'Mono', l: ['#EFEFEF', '#FFFFFF', '#E2E2E2', '#CFCFCF'], d: ['#0B0B0B', '#151515', '#1F1F1F', '#2D2D2D'] },
};

export interface GlassTheme {
  id: string;
  name: string;
  desc: string;
  hue: number;
  bgKey: string;
  previewGradient: string;
}

export const GLASS_THEMES: GlassTheme[] = [
  {
    id: 'oceanic',
    name: 'Oceanic Frost',
    desc: 'Crystal azure glass with electric sapphire water refraction',
    hue: 215,
    bgKey: 'slate',
    previewGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.45) 0%, rgba(37, 99, 235, 0.7) 100%)',
  },
  {
    id: 'sage',
    name: 'Alpine Sage',
    desc: 'Frosted botanical emerald with calming organic moss',
    hue: 150,
    bgKey: 'forest',
    previewGradient: 'linear-gradient(135deg, rgba(74, 222, 128, 0.45) 0%, rgba(16, 185, 129, 0.7) 100%)',
  },
  {
    id: 'amethyst',
    name: 'Cosmic Amethyst',
    desc: 'Deep smoked obsidian glass with luminous violet refraction',
    hue: 285,
    bgKey: 'plum',
    previewGradient: 'linear-gradient(135deg, rgba(192, 132, 252, 0.45) 0%, rgba(147, 51, 234, 0.7) 100%)',
  },
  {
    id: 'amber',
    name: 'Golden Dawn',
    desc: 'Warm sunbeam gold filtered through acoustic textured glass',
    hue: 42,
    bgKey: 'paper',
    previewGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.45) 0%, rgba(217, 119, 6, 0.7) 100%)',
  },
  {
    id: 'crimson',
    name: 'Ruby Crystal',
    desc: 'Focused laser crimson with graphite refraction',
    hue: 8,
    bgKey: 'ink',
    previewGradient: 'linear-gradient(135deg, rgba(248, 113, 113, 0.45) 0%, rgba(220, 38, 38, 0.7) 100%)',
  },
  {
    id: 'teal',
    name: 'Laguna Mist',
    desc: 'Bioluminescent tropical cyan and frosted glacial turquoise',
    hue: 175,
    bgKey: 'forest',
    previewGradient: 'linear-gradient(135deg, rgba(45, 212, 191, 0.45) 0%, rgba(13, 148, 136, 0.7) 100%)',
  },
  {
    id: 'minimal',
    name: 'Smoked Onyx',
    desc: 'Architectural monochrome glass & titanium specular luster',
    hue: 215,
    bgKey: 'mono',
    previewGradient: 'linear-gradient(135deg, rgba(200, 200, 200, 0.45) 0%, rgba(60, 60, 60, 0.8) 100%)',
  },
];

export const ACCENT_SWATCHES = [
  { name: 'Sapphire', hue: 215, color: 'hsl(215 80% 50%)' },
  { name: 'Teal', hue: 175, color: 'hsl(175 80% 40%)' },
  { name: 'Emerald', hue: 150, color: 'hsl(150 75% 40%)' },
  { name: 'Lime', hue: 90, color: 'hsl(90 75% 42%)' },
  { name: 'Amber', hue: 45, color: 'hsl(45 90% 48%)' },
  { name: 'Orange', hue: 25, color: 'hsl(25 85% 50%)' },
  { name: 'Ruby', hue: 8, color: 'hsl(8 80% 50%)' },
  { name: 'Rose', hue: 335, color: 'hsl(335 80% 55%)' },
  { name: 'Violet', hue: 285, color: 'hsl(285 75% 55%)' },
  { name: 'Indigo', hue: 255, color: 'hsl(255 75% 55%)' },
];

export const CC_BG = ['bg', 'surface', 'surface-2', 'line'];

export const CC: [string, [string, string][]][] = [
  ['Page', [['bg', 'Page background'], ['surface', 'Cards and panels'], ['surface-2', 'Raised areas and pills'], ['line', 'Borders and dividers'], ['ink', 'Main text'], ['heading', 'Headings'], ['muted', 'Secondary text']]],
  ['Accent', [['accent', 'Accent'], ['on-accent', 'Text on accent'], ['accent-soft', 'Highlight tint'], ['link', 'Links']]],
  ['Buttons', [['btn-bg', 'Button fill'], ['btn-ink', 'Button text'], ['primary-bg', 'Main button fill'], ['primary-ink', 'Main button text']]],
  ['Tabs and fields', [['tab-ink', 'Tab text'], ['tab-active', 'Active tab line'], ['input-bg', 'Field fill'], ['input-line', 'Field border'], ['card-line', 'Card border']]],
  ['Timer', [['ring', 'Timer ring'], ['ring-track', 'Ring track'], ['digits', 'Timer digits'], ['done', 'Time up'], ['countdown', 'Exam countdown digits']]],
  ['Charts and ranks', [['chart', 'Chart bars'], ['rank', 'Top 3 ranks']]],
  ['Status', [['good', 'Good'], ['warn', 'Warning'], ['bad', 'Bad']]],
];

export interface CatalogItem {
  n: string;
  b: BoardType;
  m: number;
}

export const CATALOG: CatalogItem[] = [
  { n: 'Physics', b: 'cambridge', m: 160 },
  { n: 'Chemistry', b: 'cambridge', m: 160 },
  { n: 'Biology', b: 'cambridge', m: 160 },
  { n: 'Combined Science', b: 'edexcel', m: 240 },
  { n: 'Mathematics', b: 'edexcel', m: 200 },
  { n: 'Additional Mathematics', b: 'cambridge', m: 120 },
  { n: 'Further Pure Mathematics', b: 'edexcel', m: 200 },
  { n: 'English Language', b: 'cambridge', m: 100 },
  { n: 'English Literature', b: 'cambridge', m: 100 },
  { n: 'Computer Science', b: 'cambridge', m: 150 },
  { n: 'ICT', b: 'cambridge', m: 100 },
  { n: 'Business Studies', b: 'cambridge', m: 160 },
  { n: 'Economics', b: 'cambridge', m: 130 },
  { n: 'Accounting', b: 'cambridge', m: 100 },
  { n: 'Geography', b: 'cambridge', m: 120 },
  { n: 'History', b: 'cambridge', m: 100 },
  { n: 'Sociology', b: 'cambridge', m: 100 },
  { n: 'Arabic', b: 'cambridge', m: 100 },
  { n: 'French', b: 'cambridge', m: 100 },
  { n: 'Spanish', b: 'cambridge', m: 100 },
  { n: 'German', b: 'cambridge', m: 100 },
  { n: 'Islamic Studies', b: 'cambridge', m: 100 },
  { n: 'Art and Design', b: 'cambridge', m: 100 },
  { n: 'Physical Education', b: 'cambridge', m: 100 },
  { n: 'Psychology', b: 'oxford', m: 200 },
  { n: 'Media Studies', b: 'oxford', m: 200 },
  { n: 'Urdu', b: 'oxford', m: 140 },
  { n: 'Pakistan Studies', b: 'edexcel', m: 150 },
  { n: 'Commerce', b: 'edexcel', m: 160 },
  { n: 'Human Biology', b: 'edexcel', m: 180 },
  { n: 'Religious Studies', b: 'edexcel', m: 167 },
  { n: 'Chinese', b: 'edexcel', m: 160 },
  { n: 'Science (Single Award)', b: 'edexcel', m: 180 },
];

export const MODES: TimerModeItem[] = [
  { id: 'f25', g: 'focus', name: 'Focus', min: 25 },
  { id: 'f50', g: 'focus', name: 'Deep focus', min: 50 },
  { id: 'b5', g: 'focus', name: 'Short break', min: 5, brk: true },
  { id: 'b15', g: 'focus', name: 'Long break', min: 15, brk: true },
  { id: 'phys-p2', g: 'exam', subj: 'Physics', name: 'Physics P2', detail: 'Extended multiple choice', min: 45, marks: 40 },
  { id: 'phys-p4', g: 'exam', subj: 'Physics', name: 'Physics P4', detail: 'Extended theory', min: 75, marks: 80 },
  { id: 'phys-p6', g: 'exam', subj: 'Physics', name: 'Physics P6', detail: 'Alternative to practical', min: 60, marks: 40 },
  { id: 'chem-p2', g: 'exam', subj: 'Chemistry', name: 'Chemistry P2', detail: 'Extended multiple choice', min: 45, marks: 40 },
  { id: 'chem-p4', g: 'exam', subj: 'Chemistry', name: 'Chemistry P4', detail: 'Extended theory', min: 75, marks: 80 },
  { id: 'chem-p6', g: 'exam', subj: 'Chemistry', name: 'Chemistry P6', detail: 'Alternative to practical', min: 60, marks: 40 },
  { id: 'bio-p2', g: 'exam', subj: 'Biology', name: 'Biology P2', detail: 'Extended multiple choice', min: 45, marks: 40 },
  { id: 'bio-p4', g: 'exam', subj: 'Biology', name: 'Biology P4', detail: 'Extended theory', min: 75, marks: 80 },
  { id: 'bio-p6', g: 'exam', subj: 'Biology', name: 'Biology P6', detail: 'Alternative to practical', min: 60, marks: 40 },
  { id: 'math-p1', g: 'exam', subj: 'Mathematics', name: 'Maths Paper 1', detail: 'Edexcel 4MA1', min: 120, marks: 100 },
  { id: 'math-p2', g: 'exam', subj: 'Mathematics', name: 'Maths Paper 2', detail: 'Edexcel 4MA1', min: 120, marks: 100 },
];

export const NF: Record<string, number> = {
  white: 0.22,
  pink: 0.5,
  brown: 0.9,
  rain: 0.45,
  tone: 0.3,
};

export const TONES = [10, 16, 40, 174, 285, 396, 417, 432, 440, 512, 528, 639, 741, 852, 963];

export const NOISE_NAMES: Record<string, string> = {
  white: 'White',
  pink: 'Pink',
  brown: 'Brown',
  rain: 'Rain',
};

export function defaultBounds(board: BoardType, max: number): SubjectBounds {
  return {
    max,
    marks: PCT[board].map((p) => Math.round((max * p) / 100)),
  };
}

export const DB: Record<BoardType, Record<string, [string, number, (number | null)[], string?]>> = {
  cambridge: {
    'Physics': ['0625', 200, [162, 137, 112, 88, 77, 67, 57, 47], 'Extended, routes 21+41+51. Core and other routes differ'],
    'Chemistry': ['0620', 200, [173, 147, 119, 91, 78, 66, 53, 40], 'Extended, routes 21+41+51. Core and other routes differ'],
    'Mathematics': ['0580', 200, [162, 138, 114, 90, 73, 56, null, null], 'Extended, routes 21+41. No F or G on extended'],
    'English Language': ['0500', 160, [116, 103, 90, 78, 65, 53, 41, 29], 'First Language, routes 11+21'],
  },
  edexcel: {
    'Accounting': ['4AC1', 150, [133, 121, 109, 98, 87, 76, 57, 39, 21]],
    'Arabic': ['4AA1', 125, [87, 78, 69, 61, 53, 45, 35, 25, 16], 'First Language'],
    'Art and Design': ['4FA1', 144, [122, 112, 102, 90, 79, 68, 53, 38, 24], 'Fine Art, Graphic Communication, Photography, 3D, Textiles'],
    'Biology': ['4BI1', 180, [142, 127, 112, 97, 82, 67, 55, 43, 32]],
    'Business Studies': ['4BS1', 160, [133, 124, 115, 103, 92, 81, 70, 59, 48]],
    'Chemistry': ['4CH1', 180, [141, 122, 103, 90, 78, 66, 53, 41, 29]],
    'Chinese': ['4CN1', 160, [146, 133, 121, 113, 106, 99, 77, 55, 34]],
    'Commerce': ['4CM1', 160, [125, 118, 111, 104, 97, 91, 81, 71, 61]],
    'Computer Science': ['4CP0', 160, [140, 130, 121, 108, 95, 82, 60, 39, 18]],
    'Economics': ['4EC1', 160, [122, 112, 102, 93, 85, 77, 64, 51, 38]],
    'English Language': ['4EA1', 150, [113, 105, 98, 88, 78, 69, 51, 34, 17], 'Language A'],
    'English Literature': ['4ET1', 150, [121, 113, 106, 93, 81, 69, 52, 36, 20]],
    'French': ['4FR1', 160, [130, 116, 103, 93, 83, 74, 56, 38, 20]],
    'Further Pure Mathematics': ['4PM1', 200, [180, 166, 152, 122, 92, 62, 47, null, null]],
    'Geography': ['4GE1', 175, [138, 126, 114, 100, 87, 74, 59, 44, 29]],
    'German': ['4GN1', 160, [139, 123, 108, 92, 76, 61, 51, 41, 31]],
    'History': ['4HI1', 120, [99, 91, 83, 74, 66, 58, 43, 28, 14]],
    'Human Biology': ['4HB1', 180, [156, 143, 131, 117, 103, 89, 71, 53, 36]],
    'ICT': ['4IT1', 200, [153, 139, 125, 109, 93, 78, 60, 42, 24]],
    'Islamic Studies': ['4IS1', 90, [79, 76, 74, 69, 64, 59, 52, 45, 39]],
    'Mathematics': ['4MA1', 200, [165, 138, 111, 87, 64, 41, 29, null, null], 'Higher tier. Foundation tier: 5 = 148, 4 = 125, 3 = 90, 2 = 56, 1 = 22'],
    'Pakistan Studies': ['4PA1', 150, [129, 117, 106, 95, 85, 75, 59, 43, 27]],
    'Physics': ['4PH1', 180, [138, 121, 105, 94, 83, 72, 60, 49, 38]],
    'Religious Studies': ['4RS1', 167, [115, 106, 98, 89, 81, 73, 61, 49, 37]],
    'Science (Single Award)': ['4SS0', 180, [161, 145, 130, 115, 100, 86, 70, 54, 38]],
    'Spanish': ['4SP1', 160, [138, 119, 101, 88, 76, 64, 51, 38, 25]],
  },
  oxford: {
    'Accounting': ['9215', 150, [111, 98, 85, 72, 59, 46, 36, 27, 18]],
    'Biology': ['9201', 180, [126, 115, 105, 92, 80, 68, 51, 35, 19]],
    'Business Studies': ['9225', 180, [138, 128, 118, 104, 91, 78, 60, 42, 24]],
    'Chemistry': ['9202', 180, [148, 133, 118, 101, 84, 68, 51, 34, 18]],
    'Computer Science': ['9210', 160, [138, 124, 111, 94, 78, 62, 47, 33, 19]],
    'Economics': ['9214', 160, [126, 118, 111, 98, 86, 74, 56, 38, 20]],
    'English Language': ['9270W', 200, [164, 147, 130, 112, 95, 78, 58, 39, 20], 'Written route'],
    'English Literature': ['9275A', 150, [119, 106, 93, 81, 69, 58, 43, 29, 15], 'Route A'],
    'French': ['9265', 240, [186, 166, 147, 132, 117, 103, 76, 50, 24]],
    'Geography': ['9230', 220, [155, 141, 127, 113, 99, 85, 62, 39, 16]],
    'Islamic Studies': ['9237', 100, [81, 73, 65, 57, 49, 42, 31, 20, 10], 'Islamiat'],
    'Mathematics': ['9260E', 200, [166, 136, 106, 84, 63, 42, 31, null, null], 'Extension. Core (9260C, out of 160): 102, 82, 62, 42, 22 for grades 5 to 1'],
    'Media Studies': ['9257', 200, [156, 143, 131, 115, 99, 83, 62, 41, 20]],
    'Pakistan Studies': ['9236', 154, [116, 105, 94, 83, 72, 61, 45, 30, 15]],
    'Physics': ['9203', 180, [144, 132, 121, 110, 99, 88, 69, 50, 31]],
    'Psychology': ['9218', 200, [158, 144, 130, 111, 92, 74, 53, 32, 11]],
    'Spanish': ['9269', 240, [178, 163, 148, 133, 119, 105, 78, 51, 24]],
    'Urdu': ['9264', 140, [130, 121, 112, 101, 90, 80, 58, 36, 14]],
  },
};

export function lookupBounds(board: BoardType, name: string) {
  const t = DB[board];
  if (!t) return null;
  let n = name.trim().toLowerCase();
  if (n === 'maths') n = 'mathematics';
  if (n === 'business') n = 'business studies';
  for (const k in t) {
    if (k.toLowerCase() === n) {
      const d = t[k];
      return { code: d[0], max: d[1], m: d[2], note: d[3] || '' };
    }
  }
  return null;
}

export function applyBounds(s: Subject, mx?: number) {
  const d = lookupBounds(s.board, s.name);
  const n = SCALE[s.board].length;
  const cat = CATALOG.find((c) => c.n.toLowerCase() === s.name.toLowerCase());
  if (d) {
    s.bounds = { max: d.max, marks: d.m.slice(0, n) };
    s.src = { official: true, text: `${SRC_NAME[s.board]} · June 2026 · ${d.code}${d.note ? ' · ' + d.note : ''}` };
  } else {
    s.bounds = defaultBounds(s.board, mx || (cat ? cat.m : 100));
    s.src = { official: false };
  }
}

export function defaultLook(): LookConfig {
  return {
    mode: 'subject',
    fixed: 215,
    tools: { timer: 215, stopwatch: 175, exams: 28, papers: 330, board: 45, subjects: 150, settings: 255 },
    bg: 'slate',
    custom: { light: {}, dark: {} },
  };
}

export function freshState(): AppState {
  const s = seedState();
  s.v = 2;
  s.look = defaultLook();
  s.subjects.forEach((x) => {
    applyBounds(x);
  });
  return s;
}

export function seedState(): AppState {
  const phys: Subject = {
    id: 'phys',
    name: 'Physics',
    board: 'cambridge',
    hue: 215,
    bounds: { max: 100, marks: [] },
    mark: null,
  };
  const math: Subject = {
    id: 'math',
    name: 'Mathematics',
    board: 'edexcel',
    hue: 28,
    bounds: { max: 100, marks: [] },
    mark: null,
  };
  applyBounds(phys);
  applyBounds(math);

  return {
    v: 2,
    theme: 'auto',
    active: 'phys',
    mode: 'phys-p4',
    subjects: [phys, math],
    customs: [],
    exams: [
      { id: 'e1', sid: 'phys', subj: 'Physics', paper: 'Paper 4', when: '2027-05-13T09:00', ex: true },
      { id: 'e2', sid: 'math', subj: 'Mathematics', paper: 'Paper 1', when: '2027-05-20T09:00', ex: true },
      { id: 'e3', sid: 'phys', subj: 'Physics', paper: 'Paper 6', when: '2027-05-26T09:00', ex: true },
    ],
    noise: { type: 'brown', vol: 0.5, link: true },
    me: { username: '', claimed: false },
    pts: 0,
    wk: { k: weekKey(), p: 0 },
    log: {},
    papers: [],
    feed: [],
    friends: [],
    bonusDay: '',
    look: defaultLook(),
  };
}

export const RANKS = [
  { min: 0, id: 'starter', name: 'Starter' },
  { min: 100, id: 'amateur', name: 'Amateur' },
  { min: 250, id: 'popping', name: 'Popping Off' },
  { min: 500, id: 'hard', name: 'Hard Working' },
  { min: 1000, id: 'gamed', name: 'Gamed' },
  { min: 1500, id: 'achiever', name: 'Achiever' },
  { min: 2000, id: 'da7ee7', name: 'da7ee7' },
];

export function rankIdx(pts?: number): number {
  const p = pts || 0;
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) {
    if (p >= RANKS[k].min) i = k;
  }
  return i;
}

export function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

export function fmtClock(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

export function dKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(k: string, n: number): string {
  const p = k.split('-');
  return dKey(new Date(+p[0], +p[1] - 1, +p[2] + n));
}

export function weekKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dKey(d);
}

/* Past paper links data */
export const CAIE_FILES = 'https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/';
export const PMT_FILES = 'https://pmt.physicsandmathstutor.com/download/';
export const PMT_PAGES = 'https://www.physicsandmathstutor.com/past-papers/';
export const PAPA = 'https://pastpapers.papacambridge.com/papers/caie/';
export const DYN_C = 'https://dynamicpapers.com/past-papers/cambridge-past-papers/o-level/';
export const DYN_E = 'https://dynamicpapers.com/past-papers/edexcel-past-papers/o-level/';

export const SCI = [
  { n: '1', l: 'Paper 1', t: 'Multiple choice (Core)' },
  { n: '2', l: 'Paper 2', t: 'Multiple choice (Extended)' },
  { n: '3', l: 'Paper 3', t: 'Theory (Core)' },
  { n: '4', l: 'Paper 4', t: 'Theory (Extended)' },
  { n: '5', l: 'Paper 5', t: 'Practical test' },
  { n: '6', l: 'Paper 6', t: 'Alternative to practical' },
];

export function esci(a: string, b: string) {
  return [
    { n: '1', l: 'Paper 1', t: 'Paper ' + a },
    { n: '2', l: 'Paper 2', t: 'Paper ' + b },
  ];
}

export interface PastPaperItem {
  id: string;
  grp: string;
  name: string;
  code?: string;
  keys?: string[];
  kind: 'caie' | 'em' | 'es' | 'idx';
  papers?: { n: string; l: string; t: string }[];
  def?: string[];
  pmt?: string;
  dir?: string;
  nov20?: boolean;
  src: [string, string][];
}

export const PL: PastPaperItem[] = [
  {
    id: 'c-phys',
    grp: 'Cambridge IGCSE',
    name: 'Physics',
    code: '0625',
    keys: ['physics'],
    kind: 'caie',
    papers: SCI,
    def: ['2', '4', '6'],
    pmt: 'gcse-physics',
    src: [
      ['PapaCambridge', PAPA + 'igcse-physics-0625'],
      ['Dynamic Papers', DYN_C + 'subjects-f-z/physics/'],
      ['Demerdash', 'https://demerdash.uk/physics/igcse-cambridge-past-papers/'],
      ['Physics & Maths Tutor', PMT_PAGES + 'gcse-physics/'],
    ],
  },
  {
    id: 'c-chem',
    grp: 'Cambridge IGCSE',
    name: 'Chemistry',
    code: '0620',
    keys: ['chemistry'],
    kind: 'caie',
    papers: SCI,
    def: ['2', '4', '6'],
    pmt: 'gcse-chemistry',
    src: [
      ['PapaCambridge', PAPA + 'igcse-chemistry-0620'],
      ['Dynamic Papers', DYN_C + 'subjects-a-e/chemistry/'],
      ['Demerdash', 'https://demerdash.uk/chemistry/igcse-cambridge-past-papers/'],
      ['Physics & Maths Tutor', PMT_PAGES + 'gcse-chemistry/'],
    ],
  },
  {
    id: 'c-bio',
    grp: 'Cambridge IGCSE',
    name: 'Biology',
    code: '0610',
    keys: ['biology'],
    kind: 'caie',
    papers: SCI,
    def: ['2', '4', '6'],
    pmt: 'gcse-biology',
    src: [
      ['PapaCambridge', PAPA + 'igcse-biology-0610'],
      ['Dynamic Papers', DYN_C + 'subjects-a-e/biology/'],
      ['Demerdash', 'https://demerdash.uk/biology/igcse-cambridge-past-papers/'],
      ['Physics & Maths Tutor', PMT_PAGES + 'gcse-biology/'],
    ],
  },
  {
    id: 'c-math',
    grp: 'Cambridge IGCSE',
    name: 'Mathematics',
    code: '0580',
    keys: ['mathematics', 'maths'],
    kind: 'caie',
    papers: [
      { n: '1', l: 'Paper 1', t: 'Core' },
      { n: '2', l: 'Paper 2', t: 'Extended' },
      { n: '3', l: 'Paper 3', t: 'Core' },
      { n: '4', l: 'Paper 4', t: 'Extended' },
    ],
    def: ['2', '4'],
    pmt: 'gcse-maths',
    src: [
      ['PapaCambridge', PAPA + 'igcse-mathematics-0580'],
      ['Dynamic Papers', DYN_C + 'subjects-f-z/maths/'],
      ['Demerdash (may ask for a password)', 'https://demerdash.uk/math/igcse-cambridge/past-papers/'],
      ['Physics & Maths Tutor', PMT_PAGES + 'gcse-maths/'],
    ],
  },
  {
    id: 'e-math',
    grp: 'Edexcel International GCSE',
    name: 'Mathematics A',
    code: '4MA1',
    keys: ['mathematics', 'maths', 'mathematics a'],
    kind: 'em',
    papers: [
      { n: '1H', l: 'Paper 1H', t: 'Higher tier' },
      { n: '2H', l: 'Paper 2H', t: 'Higher tier' },
      { n: '1F', l: 'Paper 1F', t: 'Foundation tier' },
      { n: '2F', l: 'Paper 2F', t: 'Foundation tier' },
    ],
    def: ['1H', '2H'],
    src: [
      ['Physics & Maths Tutor, Paper 1', PMT_PAGES + 'gcse-maths/edexcel-igcse-a-paper-1/'],
      ['Physics & Maths Tutor, Paper 2', PMT_PAGES + 'gcse-maths/edexcel-igcse-a-paper-2/'],
      ['Dynamic Papers', DYN_E + 'maths-2/'],
      ['Demerdash (may ask for a password)', 'https://demerdash.uk/math/igcse-edexcel/past-papers/'],
      ['Save My Exams', 'https://www.savemyexams.com/igcse/maths/edexcel/a/past-papers/'],
      ['ExamPapersPractice', 'https://www.exampaperspractice.co.uk/igcse-maths-edexcel'],
    ],
  },
  {
    id: 'e-phys',
    grp: 'Edexcel International GCSE',
    name: 'Physics',
    code: '4PH1',
    keys: ['physics'],
    kind: 'es',
    dir: 'Physics',
    papers: esci('1P', '2P'),
    def: ['1', '2'],
    pmt: 'gcse-physics',
    src: [
      ['Physics & Maths Tutor, Paper 1', PMT_PAGES + 'gcse-physics/edexcel-igcse-paper-1/'],
      ['Physics & Maths Tutor, Paper 2', PMT_PAGES + 'gcse-physics/edexcel-igcse-paper-2/'],
      ['Dynamic Papers', DYN_E + 'physics/'],
      ['Demerdash', 'https://demerdash.uk/physics/igcse-edexcel-past-papers/'],
    ],
  },
  {
    id: 'e-chem',
    grp: 'Edexcel International GCSE',
    name: 'Chemistry',
    code: '4CH1',
    keys: ['chemistry'],
    kind: 'es',
    dir: 'Chemistry',
    papers: esci('1C', '2C'),
    def: ['1', '2'],
    pmt: 'gcse-chemistry',
    src: [
      ['Physics & Maths Tutor, Paper 1', PMT_PAGES + 'gcse-chemistry/edexcel-igcse-paper-1/'],
      ['Physics & Maths Tutor, Paper 2', PMT_PAGES + 'gcse-chemistry/edexcel-igcse-paper-2/'],
      ['Dynamic Papers', DYN_E + 'chemistry/'],
      ['Demerdash', 'https://demerdash.uk/chemistry/igcse-edexcel-past-papers/'],
    ],
  },
  {
    id: 'e-bio',
    grp: 'Edexcel International GCSE',
    name: 'Biology',
    code: '4BI1',
    keys: ['biology'],
    kind: 'es',
    dir: 'Biology',
    nov20: true,
    papers: esci('1B', '2B'),
    def: ['1', '2'],
    pmt: 'gcse-biology',
    src: [
      ['Physics & Maths Tutor, Paper 1', PMT_PAGES + 'gcse-biology/edexcel-igcse-paper-1/'],
      ['Physics & Maths Tutor, Paper 2', PMT_PAGES + 'gcse-biology/edexcel-igcse-paper-2/'],
      ['Dynamic Papers', DYN_E + 'biology/'],
      ['Demerdash', 'https://demerdash.uk/biology/igcse-edexcel-past-papers/'],
    ],
  },
  {
    id: 'i-addm',
    grp: 'More Cambridge subjects (index pages)',
    name: 'Additional Mathematics 0606',
    kind: 'idx',
    keys: ['additional mathematics'],
    src: [['PapaCambridge', PAPA + 'igcse-mathematics-0606']],
  },
  {
    id: 'i-eng',
    grp: 'More Cambridge subjects (index pages)',
    name: 'English First Language 0500',
    kind: 'idx',
    keys: ['english language', 'english'],
    src: [['PapaCambridge', PAPA + 'igcse-english-0500']],
  },
  {
    id: 'i-bus',
    grp: 'More Cambridge subjects (index pages)',
    name: 'Business Studies 0450',
    kind: 'idx',
    keys: ['business studies'],
    src: [['PapaCambridge', PAPA + 'igcse-business-studies-0450']],
  },
  {
    id: 'i-eco',
    grp: 'More Cambridge subjects (index pages)',
    name: 'Economics 0455',
    kind: 'idx',
    keys: ['economics'],
    src: [['PapaCambridge', PAPA + 'igcse-economics-0455']],
  },
  {
    id: 'i-cs',
    grp: 'More Cambridge subjects (index pages)',
    name: 'Computer Science 0478',
    kind: 'idx',
    keys: ['computer science'],
    src: [['PapaCambridge', PAPA + 'igcse-computer-science-0478']],
  },
  {
    id: 'i-ict',
    grp: 'More Cambridge subjects (index pages)',
    name: 'ICT 0417',
    kind: 'idx',
    keys: ['ict'],
    src: [['PapaCambridge', PAPA + 'igcse-ict0417']],
  },
  {
    id: 'i-geo',
    grp: 'More Cambridge subjects (index pages)',
    name: 'Geography 0460',
    kind: 'idx',
    keys: ['geography'],
    src: [['PapaCambridge', PAPA + 'igcse-geography-0460']],
  },
  {
    id: 'i-his',
    grp: 'More Cambridge subjects (index pages)',
    name: 'History 0470',
    kind: 'idx',
    keys: ['history'],
    src: [['PapaCambridge', PAPA + 'igcse-history-0470']],
  },
  {
    id: 'i-acc',
    grp: 'More Cambridge subjects (index pages)',
    name: 'Accounting 0452',
    kind: 'idx',
    keys: ['accounting'],
    src: [['PapaCambridge', PAPA + 'igcse-accounting-0452']],
  },
  {
    id: 'i-isl',
    grp: 'More Cambridge subjects (index pages)',
    name: 'Islamiyat 0493',
    kind: 'idx',
    keys: ['islamic studies'],
    src: [['PapaCambridge', PAPA + 'igcse-islamiyat-0493']],
  },
  {
    id: 'i-ara',
    grp: 'More Cambridge subjects (index pages)',
    name: 'Arabic',
    kind: 'idx',
    keys: ['arabic'],
    src: [
      ['PapaCambridge, 0508', PAPA + 'igcse-arabic-0508'],
      ['PapaCambridge, 0527', PAPA + 'igcse-arabic-0527'],
      ['PapaCambridge, 0544', PAPA + 'igcse-arabic-0544'],
    ],
  },
  {
    id: 'i-sci',
    grp: 'More Cambridge subjects (index pages)',
    name: 'Combined and Co-ordinated Sciences',
    kind: 'idx',
    keys: ['combined science'],
    src: [
      ['PapaCambridge, Science 0653', PAPA + 'igcse-science-0653'],
      ['PapaCambridge, Sciences 0654', PAPA + 'igcse-sciences-0654'],
    ],
  },
  {
    id: 'a-esl',
    grp: 'Oxford AQA International GCSE',
    name: 'English as a Second Language 9280',
    kind: 'idx',
    keys: ['english as a second language', 'esl'],
    src: [
      ['Save My Exams, past papers', 'https://www.savemyexams.com/igcse/english/oxford-aqa/english-as-a-second-language/past-papers/'],
      ['Oxford AQA Exams (official site)', 'https://www.oxfordaqaexams.org.uk/'],
    ],
  },
  {
    id: 'i-edx',
    grp: 'More Edexcel subjects (index pages)',
    name: 'Other Edexcel subjects',
    kind: 'idx',
    keys: [],
    src: [
      ['Dynamic Papers, all Edexcel IGCSE subjects', DYN_E],
      ['Save My Exams, Edexcel IGCSE', 'https://www.savemyexams.com/igcse/boards/edexcel/past-papers/'],
    ],
  },
];
