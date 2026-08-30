export const NOOK_SCHEMA_VERSION = 2 as const;
export const NOOK_BACKUP_FORMAT = 'nook-backup' as const;

const MAX_BACKUP_CHARACTERS = 5_000_000;
const MAX_TASKS = 10_000;
const MAX_HABITS = 2_000;
const MAX_HABIT_LOGS = 100_000;
const MAX_NOTES = 20_000;
const MAX_DAILY_RECORDS = 20_000;
const MAX_FOCUS_SESSIONS = 100_000;
const MAX_CHECKLIST_ITEMS = 1_000;
const MAX_TIMER_SECONDS = 7 * 24 * 60 * 60;

export const NOOK_INPUT_LIMITS = {
  taskTitle: 1_000,
  taskCategory: 100,
  habitLabel: 500,
  habitMinimum: 1_000,
  focusIntention: 1_000,
  distraction: 1_000,
  distractions: 1_000,
  sessionNote: 50_000,
  noteContent: 100_000,
} as const;

export const TASK_MINUTES_INPUT = {
  defaultValue: 25,
  minimum: 5,
  maximum: 720,
  step: 5,
} as const;

export function normalizeTaskMinutesInput(value: unknown): number {
  const candidate = typeof value === 'string' ? value.trim() : value;
  if (candidate === '') return TASK_MINUTES_INPUT.minimum;

  const minutes = Number(candidate);
  const isValidStep = Number.isInteger(minutes)
    && (minutes - TASK_MINUTES_INPUT.minimum) % TASK_MINUTES_INPUT.step === 0;

  return isValidStep
    && minutes >= TASK_MINUTES_INPUT.minimum
    && minutes <= TASK_MINUTES_INPUT.maximum
    ? minutes
    : TASK_MINUTES_INPUT.minimum;
}

export type DateInput = Date | string | number;
export type Tab = 'today' | 'habits' | 'home' | 'focus' | 'notes';
export type TaskLane = 'anchor' | 'support' | 'optional';
export type FocusSessionStatus = 'completed' | 'interrupted';
export type FocusTimerStatus = 'idle' | 'running' | 'paused';
export type EnergyLevel = 'low' | 'steady' | 'bright';
export type Language = 'en' | 'vi';

export type ChecklistItem = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
};

export type Task = {
  id: string;
  title: string;
  category: string;
  minutes: number;
  done: boolean;
  lane: TaskLane;
  dayKey: string;
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
  checklist: ChecklistItem[];
};

export type Habit = {
  id: string;
  label: string;
  mark: string;
  minimum: string;
  cadence: string;
  createdAt: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
  /** Preserved v1 aggregate only. It is never expanded into invented daily logs. */
  legacyCount: number | null;
  /** Preserved because v1 did not store the date to which checkedToday belonged. */
  legacyCheckedToday: boolean | null;
};

export type HabitLog = {
  id: string;
  habitId: string;
  dayKey: string;
  value: number;
  completedAt: string | null;
  note: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type NoteEntry = {
  id: string;
  dayKey: string;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DailyRecord = {
  dayKey: string;
  energy: EnergyLevel | null;
  capacityMinutes: number;
  openedAt: string | null;
  closedAt: string | null;
  closingEnergy: EnergyLevel | null;
  closingNote: string;
  updatedAt: string | null;
};

export type FocusSession = {
  id: string;
  taskId: string | null;
  dayKey: string;
  status: FocusSessionStatus;
  plannedMinutes: number;
  actualMinutes: number;
  intention: string;
  distractions: number;
  sessionNote: string;
  startedAt: string;
  endedAt: string;
};

export type FocusTimer = {
  running: boolean;
  presetMinutes: number;
  remainingSeconds: number;
  taskId: string | null;
  intention: string;
  distractions: string[];
  sessionNote: string;
  startedAt: string | null;
  endsAt: string | null;
  pausedAt: string | null;
};

export type NookSettings = {
  dark: boolean;
  language: Language;
  onboardingCompleted: boolean;
};

export type NookSnapshot = {
  schemaVersion: typeof NOOK_SCHEMA_VERSION;
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  notes: NoteEntry[];
  dailyRecords: DailyRecord[];
  focusSessions: FocusSession[];
  focusTimer: FocusTimer;
  selectedTaskId: string | null;
  settings: NookSettings;
  /** Raw Monday-to-Sunday v1 totals. They have no week anchor and remain legacy-only. */
  legacyWeekMinutes: [number, number, number, number, number, number, number] | null;
};

export type NookBackupEnvelope = {
  format: typeof NOOK_BACKUP_FORMAT;
  schemaVersion: typeof NOOK_SCHEMA_VERSION;
  exportedAt: string;
  data: NookSnapshot;
};

export type LegacyV1Task = {
  id: string;
  title: string;
  category: string;
  minutes: number;
  done: boolean;
};

export type LegacyV1Habit = {
  id: string;
  label: string;
  mark: string;
  count: number;
  checkedToday: boolean;
};

export type LegacyV1Snapshot = {
  version?: 1;
  exportedAt?: string;
  tasks: LegacyV1Task[];
  habits: LegacyV1Habit[];
  note: string;
  selectedTaskId?: string;
  timerPreset?: number;
  timerSeconds?: number;
  weekMinutes?: number[];
  dark?: boolean;
};

export type PlannedMetrics = {
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  anchorTasks: number;
  supportTasks: number;
  optionalTasks: number;
  plannedMinutes: number;
  completedMinutes: number;
  capacityMinutes: number | null;
  remainingCapacityMinutes: number | null;
};

export type FocusMetrics = {
  totalSessions: number;
  completedSessions: number;
  interruptedSessions: number;
  focusedSeconds: number;
  focusedMinutes: number;
  plannedMinutes: number;
};

export type HabitMetrics = {
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
  completedHabitIds: string[];
};

export type DailyMetrics = {
  planned: PlannedMetrics;
  focus: FocusMetrics;
  habits: HabitMetrics;
};

export type NookStateErrorCode =
  | 'invalid-json'
  | 'invalid-backup'
  | 'unsupported-version'
  | 'limit-exceeded';

export class NookStateError extends Error {
  readonly code: NookStateErrorCode;

  constructor(code: NookStateErrorCode, message: string) {
    super(message);
    this.name = 'NookStateError';
    this.code = code;
  }
}

type ParseOptions = {
  now?: DateInput;
};

type SerializeOptions = {
  exportedAt?: DateInput;
  pretty?: boolean;
};

function fail(message: string): never {
  throw new NookStateError('invalid-backup', message);
}

function limit(message: string): never {
  throw new NookStateError('limit-exceeded', message);
}

function asDate(input: DateInput = new Date()): Date {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (!Number.isFinite(date.getTime())) fail('Invalid date or timestamp');
  return date;
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

export function isDayKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const candidate = new Date(year, month - 1, day, 12);
  return candidate.getFullYear() === year
    && candidate.getMonth() === month - 1
    && candidate.getDate() === day;
}

/** Returns the local calendar day, avoiding UTC date shifts. */
export function toDayKey(input: DateInput = new Date()): string {
  if (typeof input === 'string' && isDayKey(input)) return input;
  const date = asDate(input);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Parses a day key at local noon so date arithmetic remains stable across DST changes. */
export function parseDayKey(dayKey: string): Date {
  if (!isDayKey(dayKey)) fail(`Invalid day key: ${String(dayKey)}`);
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(dayKey: string, amount: number): string {
  if (!Number.isInteger(amount)) fail('Day offset must be an integer');
  const date = parseDayKey(dayKey);
  date.setDate(date.getDate() + amount);
  return toDayKey(date);
}

/**
 * Counts the current consecutive habit check-ins, capped for bounded UI such as
 * the seven-fruit rhythm tree. An unchecked current day does not break the
 * previous streak while that day's check-in window is still open.
 */
export function currentHabitStreak(
  habitId: string,
  habitLogs: readonly HabitLog[],
  dayKey: string,
  maximumDays = 7,
): number {
  if (!isDayKey(dayKey)) fail(`Invalid day key: ${String(dayKey)}`);
  if (!Number.isInteger(maximumDays) || maximumDays < 1) {
    fail('maximumDays must be a positive integer');
  }

  const checkedDays = new Set(
    habitLogs
      .filter((log) => log.habitId === habitId && log.value > 0 && isDayKey(log.dayKey))
      .map((log) => log.dayKey),
  );
  let cursor = checkedDays.has(dayKey) ? dayKey : addDays(dayKey, -1);
  let streak = 0;

  while (streak < maximumDays && checkedDays.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

/** weekStartsOn follows JavaScript weekday numbering: Sunday=0, Monday=1. */
export function weekStartDayKey(dayKey: string, weekStartsOn = 1): string {
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) {
    fail('weekStartsOn must be an integer from 0 to 6');
  }
  const date = parseDayKey(dayKey);
  const distance = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(dayKey, -distance);
}

export function weekDayKeys(dayKey: string, weekStartsOn = 1): [string, string, string, string, string, string, string] {
  const start = weekStartDayKey(dayKey, weekStartsOn);
  return [
    start,
    addDays(start, 1),
    addDays(start, 2),
    addDays(start, 3),
    addDays(start, 4),
    addDays(start, 5),
    addDays(start, 6),
  ];
}

export function toIsoTimestamp(input: DateInput = new Date()): string {
  return asDate(input).toISOString();
}

export function createDailyRecord(dayKey: string, now?: DateInput): DailyRecord {
  if (!isDayKey(dayKey)) fail(`Invalid day key: ${String(dayKey)}`);
  return {
    dayKey,
  energy: null,
    capacityMinutes: 240,
    openedAt: null,
    closedAt: null,
    closingEnergy: null,
    closingNote: '',
    updatedAt: now === undefined ? null : toIsoTimestamp(now),
  };
}

export function createFocusTimer(presetMinutes = 25): FocusTimer {
  if (!Number.isInteger(presetMinutes) || presetMinutes < 1 || presetMinutes > 1_440) {
    fail('Focus preset must be an integer from 1 to 1440 minutes');
  }
  return {
    running: false,
    presetMinutes,
    remainingSeconds: presetMinutes * 60,
    taskId: null,
    intention: '',
    distractions: [],
    sessionNote: '',
    startedAt: null,
    endsAt: null,
    pausedAt: null,
  };
}

export function remainingFocusSeconds(timer: FocusTimer, at: DateInput = new Date()): number {
  if (!timer.running) return Math.max(0, timer.remainingSeconds);
  if (!timer.endsAt) return 0;
  const remainingMilliseconds = asDate(timer.endsAt).getTime() - asDate(at).getTime();
  return Math.max(0, Math.ceil(remainingMilliseconds / 1_000));
}

export function isFocusTimerComplete(timer: FocusTimer, at: DateInput = new Date()): boolean {
  return remainingFocusSeconds(timer, at) === 0;
}

export function DEFAULT_SNAPSHOT(now: DateInput = new Date()): NookSnapshot {
  const timestamp = toIsoTimestamp(now);
  const dayKey = toDayKey(now);

  return {
    schemaVersion: NOOK_SCHEMA_VERSION,
    tasks: [],
    habits: [],
    habitLogs: [],
    notes: [{
      id: `note-${dayKey}`,
      dayKey,
      content: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    }],
    dailyRecords: [createDailyRecord(dayKey, now)],
    focusSessions: [],
    focusTimer: createFocusTimer(25),
    selectedTaskId: null,
    settings: {
      dark: false,
      language: 'en',
      onboardingCompleted: false,
    },
    legacyWeekMinutes: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${path} must be an object`);
  return value;
}

function readArray(value: unknown, path: string, maximum: number): unknown[] {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  if (value.length > maximum) limit(`${path} contains too many items`);
  return value;
}

function readString(value: unknown, path: string, maximum: number, allowEmpty = true): string {
  if (typeof value !== 'string') fail(`${path} must be a string`);
  if (value.length > maximum) limit(`${path} is too long`);
  if (!allowEmpty && value.trim().length === 0) fail(`${path} must not be empty`);
  return value;
}

function readNullableString(value: unknown, path: string, maximum: number): string | null {
  if (value === null || value === undefined) return null;
  return readString(value, path, maximum);
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(`${path} must be a boolean`);
  return value;
}

function readLanguage(value: unknown, path: string): Language {
  if (value !== 'en' && value !== 'vi') fail(`${path} must be either en or vi`);
  return value;
}

function readInteger(value: unknown, path: string, minimum: number, maximum: number): number {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    fail(`${path} must be an integer from ${minimum} to ${maximum}`);
  }
  return value as number;
}

function readFiniteNumber(value: unknown, path: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    fail(`${path} must be a finite number from ${minimum} to ${maximum}`);
  }
  return value;
}

function readDayKey(value: unknown, path: string): string {
  if (!isDayKey(value)) fail(`${path} must be a valid YYYY-MM-DD day key`);
  return value;
}

function readNullableTimestamp(value: unknown, path: string): string | null {
  if (value === null || value === undefined) return null;
  return readTimestamp(value, path);
}

function readTimestamp(value: unknown, path: string): string {
  const raw = readString(value, path, 64, false);
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) fail(`${path} must be a valid timestamp`);
  return date.toISOString();
}

function ensureUniqueIds<T extends { id: string }>(items: T[], path: string): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) fail(`${path} contains duplicate id ${item.id}`);
    ids.add(item.id);
  }
}

function parseChecklistItem(value: unknown, path: string): ChecklistItem {
  const item = readRecord(value, path);
  const done = readBoolean(item.done, `${path}.done`);
  const completedAt = readNullableTimestamp(item.completedAt, `${path}.completedAt`);
  if (!done && completedAt !== null) fail(`${path}.completedAt requires done=true`);
  return {
    id: readString(item.id, `${path}.id`, 128, false),
    title: readString(item.title, `${path}.title`, 1_000, false),
    done,
    createdAt: readNullableTimestamp(item.createdAt, `${path}.createdAt`),
    updatedAt: readNullableTimestamp(item.updatedAt, `${path}.updatedAt`),
    completedAt,
  };
}

function parseTask(value: unknown, path: string): Task {
  const task = readRecord(value, path);
  const lane = readString(task.lane, `${path}.lane`, 16, false);
  if (lane !== 'anchor' && lane !== 'support' && lane !== 'optional') fail(`${path}.lane is invalid`);
  const checklist = readArray(task.checklist, `${path}.checklist`, MAX_CHECKLIST_ITEMS)
    .map((item, index) => parseChecklistItem(item, `${path}.checklist[${index}]`));
  ensureUniqueIds(checklist, `${path}.checklist`);
  const done = readBoolean(task.done, `${path}.done`);
  const completedAt = readNullableTimestamp(task.completedAt, `${path}.completedAt`);
  if (!done && completedAt !== null) fail(`${path}.completedAt requires done=true`);
  return {
    id: readString(task.id, `${path}.id`, 128, false),
    title: readString(task.title, `${path}.title`, 1_000, false),
    category: readString(task.category, `${path}.category`, 100),
    minutes: readInteger(task.minutes, `${path}.minutes`, 1, 1_440),
    done,
    lane,
    dayKey: readDayKey(task.dayKey, `${path}.dayKey`),
    createdAt: readNullableTimestamp(task.createdAt, `${path}.createdAt`),
    updatedAt: readNullableTimestamp(task.updatedAt, `${path}.updatedAt`),
    completedAt,
    checklist,
  };
}

function parseHabit(value: unknown, path: string): Habit {
  const habit = readRecord(value, path);
  return {
    id: readString(habit.id, `${path}.id`, 128, false),
    label: readString(habit.label, `${path}.label`, 500, false),
    mark: readString(habit.mark, `${path}.mark`, 32),
    minimum: readString(habit.minimum, `${path}.minimum`, 1_000),
    cadence: readString(habit.cadence, `${path}.cadence`, 100),
    createdAt: readNullableTimestamp(habit.createdAt, `${path}.createdAt`),
    updatedAt: readNullableTimestamp(habit.updatedAt, `${path}.updatedAt`),
    archivedAt: readNullableTimestamp(habit.archivedAt, `${path}.archivedAt`),
    legacyCount: habit.legacyCount === null || habit.legacyCount === undefined
      ? null
      : readInteger(habit.legacyCount, `${path}.legacyCount`, 0, 1_000_000),
    legacyCheckedToday: habit.legacyCheckedToday === null || habit.legacyCheckedToday === undefined
      ? null
      : readBoolean(habit.legacyCheckedToday, `${path}.legacyCheckedToday`),
  };
}

function parseHabitLog(value: unknown, path: string): HabitLog {
  const log = readRecord(value, path);
  const valueNumber = readFiniteNumber(log.value, `${path}.value`, 0, 1_000_000);
  const completedAt = readNullableTimestamp(log.completedAt, `${path}.completedAt`);
  if (valueNumber === 0 && completedAt !== null) fail(`${path}.completedAt requires value > 0`);
  return {
    id: readString(log.id, `${path}.id`, 128, false),
    habitId: readString(log.habitId, `${path}.habitId`, 128, false),
    dayKey: readDayKey(log.dayKey, `${path}.dayKey`),
    value: valueNumber,
    completedAt,
    note: readString(log.note, `${path}.note`, 10_000),
    createdAt: readNullableTimestamp(log.createdAt, `${path}.createdAt`),
    updatedAt: readNullableTimestamp(log.updatedAt, `${path}.updatedAt`),
  };
}

function parseNoteEntry(value: unknown, path: string): NoteEntry {
  const note = readRecord(value, path);
  return {
    id: readString(note.id, `${path}.id`, 128, false),
    dayKey: readDayKey(note.dayKey, `${path}.dayKey`),
    content: readString(note.content, `${path}.content`, MAX_BACKUP_CHARACTERS),
    createdAt: readNullableTimestamp(note.createdAt, `${path}.createdAt`),
    updatedAt: readNullableTimestamp(note.updatedAt, `${path}.updatedAt`),
  };
}

function parseDailyRecord(value: unknown, path: string): DailyRecord {
  const record = readRecord(value, path);
  const parseEnergy = (value: unknown, energyPath: string): EnergyLevel | null => {
    if (value === null || value === undefined) return null;
    const energy = readString(value, energyPath, 16, false);
    if (energy !== 'low' && energy !== 'steady' && energy !== 'bright') fail(`${energyPath} is invalid`);
    return energy;
  };
  return {
    dayKey: readDayKey(record.dayKey, `${path}.dayKey`),
    energy: parseEnergy(record.energy, `${path}.energy`),
    capacityMinutes: readInteger(record.capacityMinutes, `${path}.capacityMinutes`, 0, 1_440),
    openedAt: readNullableTimestamp(record.openedAt, `${path}.openedAt`),
    closedAt: readNullableTimestamp(record.closedAt, `${path}.closedAt`),
    closingEnergy: parseEnergy(record.closingEnergy, `${path}.closingEnergy`),
    closingNote: readString(record.closingNote, `${path}.closingNote`, 50_000),
    updatedAt: readNullableTimestamp(record.updatedAt, `${path}.updatedAt`),
  };
}

function parseFocusSession(value: unknown, path: string): FocusSession {
  const session = readRecord(value, path);
  const status = readString(session.status, `${path}.status`, 16, false);
  if (status !== 'completed' && status !== 'interrupted') fail(`${path}.status is invalid`);
  const startedAt = readTimestamp(session.startedAt, `${path}.startedAt`);
  const endedAt = readTimestamp(session.endedAt, `${path}.endedAt`);
  if (new Date(endedAt).getTime() < new Date(startedAt).getTime()) fail(`${path}.endedAt precedes startedAt`);
  return {
    id: readString(session.id, `${path}.id`, 128, false),
    taskId: readNullableString(session.taskId, `${path}.taskId`, 128),
    dayKey: readDayKey(session.dayKey, `${path}.dayKey`),
    status,
    plannedMinutes: readInteger(session.plannedMinutes, `${path}.plannedMinutes`, 1, 1_440),
    actualMinutes: readFiniteNumber(session.actualMinutes, `${path}.actualMinutes`, 0, MAX_TIMER_SECONDS / 60),
    intention: readString(session.intention, `${path}.intention`, 1_000),
    distractions: readInteger(session.distractions, `${path}.distractions`, 0, 1_000_000),
    sessionNote: readString(session.sessionNote, `${path}.sessionNote`, 50_000),
    startedAt,
    endedAt,
  };
}

function parseFocusTimer(value: unknown, path: string): FocusTimer {
  const timer = readRecord(value, path);
  const running = readBoolean(timer.running, `${path}.running`);
  const startedAt = readNullableTimestamp(timer.startedAt, `${path}.startedAt`);
  const endsAt = readNullableTimestamp(timer.endsAt, `${path}.endsAt`);
  const pausedAt = readNullableTimestamp(timer.pausedAt, `${path}.pausedAt`);
  if (running) {
    if (!startedAt || !endsAt) fail(`${path} running timer requires startedAt and endsAt`);
    if (new Date(endsAt).getTime() <= new Date(startedAt).getTime()) fail(`${path}.endsAt must follow startedAt`);
  } else if (endsAt !== null) {
    fail(`${path}.endsAt is only valid for a running timer`);
  }
  return {
    running,
    presetMinutes: readInteger(timer.presetMinutes, `${path}.presetMinutes`, 1, 1_440),
    remainingSeconds: readInteger(timer.remainingSeconds, `${path}.remainingSeconds`, 0, MAX_TIMER_SECONDS),
    taskId: readNullableString(timer.taskId, `${path}.taskId`, 128),
    intention: readString(timer.intention, `${path}.intention`, 1_000),
    distractions: readArray(timer.distractions, `${path}.distractions`, 1_000)
      .map((entry, index) => readString(entry, `${path}.distractions[${index}]`, 1_000, false)),
    sessionNote: readString(timer.sessionNote, `${path}.sessionNote`, 50_000),
    startedAt,
    endsAt,
    pausedAt,
  };
}

function parseLegacyWeekMinutes(value: unknown, path: string): NookSnapshot['legacyWeekMinutes'] {
  if (value === null || value === undefined) return null;
  const minutes = readArray(value, path, 7);
  if (minutes.length !== 7) fail(`${path} must contain exactly seven values`);
  return minutes.map((entry, index) => readFiniteNumber(entry, `${path}[${index}]`, 0, 10_000_000)) as NookSnapshot['legacyWeekMinutes'];
}

export function parseV2Snapshot(value: unknown): NookSnapshot {
  const snapshot = readRecord(value, 'snapshot');
  if (snapshot.schemaVersion !== NOOK_SCHEMA_VERSION) {
    throw new NookStateError('unsupported-version', `Unsupported schema version: ${String(snapshot.schemaVersion)}`);
  }

  const tasks = readArray(snapshot.tasks, 'snapshot.tasks', MAX_TASKS)
    .map((task, index) => parseTask(task, `snapshot.tasks[${index}]`));
  const habits = readArray(snapshot.habits, 'snapshot.habits', MAX_HABITS)
    .map((habit, index) => parseHabit(habit, `snapshot.habits[${index}]`));
  const habitLogs = readArray(snapshot.habitLogs, 'snapshot.habitLogs', MAX_HABIT_LOGS)
    .map((log, index) => parseHabitLog(log, `snapshot.habitLogs[${index}]`));
  const notes = readArray(snapshot.notes, 'snapshot.notes', MAX_NOTES)
    .map((note, index) => parseNoteEntry(note, `snapshot.notes[${index}]`));
  const dailyRecords = readArray(snapshot.dailyRecords, 'snapshot.dailyRecords', MAX_DAILY_RECORDS)
    .map((record, index) => parseDailyRecord(record, `snapshot.dailyRecords[${index}]`));
  const focusSessions = readArray(snapshot.focusSessions, 'snapshot.focusSessions', MAX_FOCUS_SESSIONS)
    .map((session, index) => parseFocusSession(session, `snapshot.focusSessions[${index}]`));

  ensureUniqueIds(tasks, 'snapshot.tasks');
  ensureUniqueIds(habits, 'snapshot.habits');
  ensureUniqueIds(habitLogs, 'snapshot.habitLogs');
  ensureUniqueIds(notes, 'snapshot.notes');
  ensureUniqueIds(focusSessions, 'snapshot.focusSessions');

  const habitDays = new Set<string>();
  for (const log of habitLogs) {
    const key = `${log.habitId}\u0000${log.dayKey}`;
    if (habitDays.has(key)) fail(`snapshot.habitLogs contains more than one log for ${log.habitId} on ${log.dayKey}`);
    habitDays.add(key);
  }
  const noteDays = new Set<string>();
  for (const note of notes) {
    if (noteDays.has(note.dayKey)) fail(`snapshot.notes contains more than one note for ${note.dayKey}`);
    noteDays.add(note.dayKey);
  }
  const recordDays = new Set<string>();
  for (const record of dailyRecords) {
    if (recordDays.has(record.dayKey)) fail(`snapshot.dailyRecords contains more than one record for ${record.dayKey}`);
    recordDays.add(record.dayKey);
  }

  const selectedTaskId = snapshot.selectedTaskId === null || snapshot.selectedTaskId === undefined
    ? null
    : readString(snapshot.selectedTaskId, 'snapshot.selectedTaskId', 128);
  const settings = readRecord(snapshot.settings, 'snapshot.settings');

  return {
    schemaVersion: NOOK_SCHEMA_VERSION,
    tasks,
    habits,
    habitLogs,
    notes,
    dailyRecords,
    focusSessions,
    focusTimer: parseFocusTimer(snapshot.focusTimer, 'snapshot.focusTimer'),
    selectedTaskId: selectedTaskId && tasks.some((task) => task.id === selectedTaskId) ? selectedTaskId : null,
    settings: {
      dark: readBoolean(settings.dark, 'snapshot.settings.dark'),
      // These settings were added without changing the v2 schema. Missing values
      // identify an existing installation, which should not be sent through onboarding.
      language: settings.language === undefined
        ? 'en'
        : readLanguage(settings.language, 'snapshot.settings.language'),
      onboardingCompleted: settings.onboardingCompleted === undefined
        ? true
        : readBoolean(settings.onboardingCompleted, 'snapshot.settings.onboardingCompleted'),
    },
    legacyWeekMinutes: parseLegacyWeekMinutes(snapshot.legacyWeekMinutes, 'snapshot.legacyWeekMinutes'),
  };
}

function parseLegacyTask(value: unknown, path: string, dayKey: string, migratedAt: string): Task {
  const task = readRecord(value, path);
  const done = readBoolean(task.done, `${path}.done`);
  return {
    id: readString(task.id, `${path}.id`, 128, false),
    title: readString(task.title, `${path}.title`, 1_000, false),
    category: readString(task.category, `${path}.category`, 100),
    minutes: readInteger(task.minutes, `${path}.minutes`, 1, 1_440),
    done,
    // v1 had no priority lane. Support is the neutral lane and avoids inventing an anchor.
    lane: 'support',
    dayKey,
    createdAt: null,
    updatedAt: migratedAt,
    completedAt: null,
    checklist: [],
  };
}

function parseLegacyHabit(value: unknown, path: string, migratedAt: string): Habit {
  const habit = readRecord(value, path);
  return {
    id: readString(habit.id, `${path}.id`, 128, false),
    label: readString(habit.label, `${path}.label`, 500, false),
    mark: readString(habit.mark, `${path}.mark`, 32),
    minimum: '',
    cadence: 'Daily',
    createdAt: null,
    updatedAt: migratedAt,
    archivedAt: null,
    legacyCount: readInteger(habit.count, `${path}.count`, 0, 1_000_000),
    legacyCheckedToday: readBoolean(habit.checkedToday, `${path}.checkedToday`),
  };
}

export function migrateV1Snapshot(value: unknown, options: ParseOptions = {}): NookSnapshot {
  const legacy = readRecord(value, 'v1');
  if (legacy.version !== undefined && legacy.version !== 1) {
    throw new NookStateError('unsupported-version', `Unsupported backup version: ${String(legacy.version)}`);
  }
  const now = options.now ?? new Date();
  const migratedAt = toIsoTimestamp(now);
  const dayKey = toDayKey(now);
  const tasks = readArray(legacy.tasks, 'v1.tasks', MAX_TASKS)
    .map((task, index) => parseLegacyTask(task, `v1.tasks[${index}]`, dayKey, migratedAt));
  const habits = readArray(legacy.habits, 'v1.habits', MAX_HABITS)
    .map((habit, index) => parseLegacyHabit(habit, `v1.habits[${index}]`, migratedAt));
  ensureUniqueIds(tasks, 'v1.tasks');
  ensureUniqueIds(habits, 'v1.habits');

  const note = readString(legacy.note, 'v1.note', MAX_BACKUP_CHARACTERS);
  const selectedTaskId = legacy.selectedTaskId === undefined
    ? null
    : readString(legacy.selectedTaskId, 'v1.selectedTaskId', 128);
  const presetMinutes = legacy.timerPreset === undefined
    ? 25
    : readInteger(legacy.timerPreset, 'v1.timerPreset', 1, 1_440);
  const remainingSeconds = legacy.timerSeconds === undefined
    ? presetMinutes * 60
    : readInteger(legacy.timerSeconds, 'v1.timerSeconds', 0, MAX_TIMER_SECONDS);
  const legacyWeekMinutes = legacy.weekMinutes === undefined
    ? [0, 0, 0, 0, 0, 0, 0] as NookSnapshot['legacyWeekMinutes']
    : parseLegacyWeekMinutes(legacy.weekMinutes, 'v1.weekMinutes');

  return {
    schemaVersion: NOOK_SCHEMA_VERSION,
    tasks,
    habits,
    // count and checkedToday have no reliable dates in v1, so they stay on Habit as legacy fields.
    habitLogs: [],
    notes: [{
      id: `note-${dayKey}`,
      dayKey,
      content: note,
      createdAt: null,
      updatedAt: migratedAt,
    }],
    dailyRecords: [],
    // v1 weekly totals have no week anchor, so no FocusSession records are fabricated.
    focusSessions: [],
    focusTimer: {
      running: false,
      presetMinutes,
      remainingSeconds,
      taskId: selectedTaskId && tasks.some((task) => task.id === selectedTaskId) ? selectedTaskId : null,
      intention: '',
      distractions: [],
      sessionNote: '',
      startedAt: null,
      endsAt: null,
      pausedAt: null,
    },
    selectedTaskId: selectedTaskId && tasks.some((task) => task.id === selectedTaskId) ? selectedTaskId : null,
    settings: {
      dark: legacy.dark === undefined ? false : readBoolean(legacy.dark, 'v1.dark'),
      language: 'en',
      onboardingCompleted: true,
    },
    legacyWeekMinutes,
  };
}

function decodeBackupInput(input: string | unknown): unknown {
  if (typeof input !== 'string') return input;
  if (input.length > MAX_BACKUP_CHARACTERS) limit('Backup is too large');
  try {
    return JSON.parse(input) as unknown;
  } catch {
    throw new NookStateError('invalid-json', 'Backup is not valid JSON');
  }
}

export function parseBackup(input: string | unknown, options: ParseOptions = {}): NookSnapshot {
  const decoded = decodeBackupInput(input);
  const record = readRecord(decoded, 'backup');

  if (record.format !== undefined) {
    if (record.format !== NOOK_BACKUP_FORMAT) fail(`Unsupported backup format: ${String(record.format)}`);
    if (record.schemaVersion !== NOOK_SCHEMA_VERSION) {
      throw new NookStateError('unsupported-version', `Unsupported schema version: ${String(record.schemaVersion)}`);
    }
    readTimestamp(record.exportedAt, 'backup.exportedAt');
    return parseV2Snapshot(record.data);
  }

  if (record.schemaVersion !== undefined) {
    if (record.schemaVersion !== NOOK_SCHEMA_VERSION) {
      throw new NookStateError('unsupported-version', `Unsupported schema version: ${String(record.schemaVersion)}`);
    }
    return parseV2Snapshot(record);
  }

  if (record.version !== undefined && record.version !== 1) {
    throw new NookStateError('unsupported-version', `Unsupported backup version: ${String(record.version)}`);
  }
  if (!Array.isArray(record.tasks) || !Array.isArray(record.habits) || typeof record.note !== 'string') {
    fail('Backup is neither a v2 snapshot nor a recognizable v1 snapshot');
  }
  return migrateV1Snapshot(record, options);
}

export function serializeBackup(snapshot: NookSnapshot, options: SerializeOptions = {}): string {
  const data = parseV2Snapshot(snapshot);
  const envelope: NookBackupEnvelope = {
    format: NOOK_BACKUP_FORMAT,
    schemaVersion: NOOK_SCHEMA_VERSION,
    exportedAt: toIsoTimestamp(options.exportedAt ?? new Date()),
    data,
  };
  const serialized = JSON.stringify(envelope, null, options.pretty === false ? undefined : 2);
  if (serialized.length > MAX_BACKUP_CHARACTERS) limit('Backup is too large');
  return serialized;
}

export function deriveFocusCompletionTiming(timer: FocusTimer): {
  actualMinutes: number;
  dayKey: string;
  endedAt: string;
  startedAt: string;
} {
  if (!timer.endsAt) fail('A running focus timer requires an end time');
  const endedAt = asDate(timer.endsAt);
  const fallbackStart = new Date(endedAt.getTime() - timer.presetMinutes * 60_000);
  const startedAt = timer.startedAt ? asDate(timer.startedAt) : fallbackStart;
  const scheduledMinutes = Math.max(
    1,
    Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000),
  );

  return {
    actualMinutes: Math.min(timer.presetMinutes, scheduledMinutes),
    dayKey: toDayKey(endedAt),
    endedAt: endedAt.toISOString(),
    startedAt: startedAt.toISOString(),
  };
}

export function derivePlannedMetrics(snapshot: NookSnapshot, dayKey: string): PlannedMetrics {
  if (!isDayKey(dayKey)) fail(`Invalid day key: ${String(dayKey)}`);
  const tasks = snapshot.tasks.filter((task) => task.dayKey === dayKey);
  const dailyRecord = snapshot.dailyRecords.find((record) => record.dayKey === dayKey);
  const plannedMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0);
  const completedMinutes = tasks.reduce((sum, task) => sum + (task.done ? task.minutes : 0), 0);
  const capacityMinutes = dailyRecord?.capacityMinutes ?? null;
  return {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.done).length,
    openTasks: tasks.filter((task) => !task.done).length,
    anchorTasks: tasks.filter((task) => task.lane === 'anchor').length,
    supportTasks: tasks.filter((task) => task.lane === 'support').length,
    optionalTasks: tasks.filter((task) => task.lane === 'optional').length,
    plannedMinutes,
    completedMinutes,
    capacityMinutes,
    remainingCapacityMinutes: capacityMinutes === null ? null : capacityMinutes - plannedMinutes,
  };
}

export function deriveFocusMetrics(snapshot: NookSnapshot, dayKey: string): FocusMetrics {
  if (!isDayKey(dayKey)) fail(`Invalid day key: ${String(dayKey)}`);
  const sessions = snapshot.focusSessions.filter((session) => session.dayKey === dayKey);
  const focusedMinutes = sessions.reduce((sum, session) => sum + session.actualMinutes, 0);
  return {
    totalSessions: sessions.length,
    completedSessions: sessions.filter((session) => session.status === 'completed').length,
    interruptedSessions: sessions.filter((session) => session.status === 'interrupted').length,
    focusedSeconds: focusedMinutes * 60,
    focusedMinutes,
    plannedMinutes: sessions.reduce((sum, session) => sum + session.plannedMinutes, 0),
  };
}

function habitWasActiveOnDay(habit: Habit, dayKey: string): boolean {
  if (habit.createdAt && toDayKey(habit.createdAt) > dayKey) return false;
  if (habit.archivedAt && toDayKey(habit.archivedAt) <= dayKey) return false;
  return true;
}

export function deriveHabitMetrics(snapshot: NookSnapshot, dayKey: string): HabitMetrics {
  if (!isDayKey(dayKey)) fail(`Invalid day key: ${String(dayKey)}`);
  const habits = snapshot.habits.filter((habit) => habitWasActiveOnDay(habit, dayKey));
  const activeIds = new Set(habits.map((habit) => habit.id));
  const completedHabitIds = snapshot.habitLogs
    .filter((log) => log.dayKey === dayKey && log.value > 0 && activeIds.has(log.habitId))
    .map((log) => log.habitId);
  return {
    totalHabits: habits.length,
    completedHabits: completedHabitIds.length,
    completionRate: habits.length === 0 ? 0 : completedHabitIds.length / habits.length,
    completedHabitIds,
  };
}

export function deriveDailyMetrics(snapshot: NookSnapshot, dayKey: string): DailyMetrics {
  return {
    planned: derivePlannedMetrics(snapshot, dayKey),
    focus: deriveFocusMetrics(snapshot, dayKey),
    habits: deriveHabitMetrics(snapshot, dayKey),
  };
}
