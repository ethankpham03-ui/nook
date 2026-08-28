import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_SNAPSHOT,
  NOOK_BACKUP_FORMAT,
  NookStateError,
  addDays,
  createFocusTimer,
  deriveFocusCompletionTiming,
  deriveDailyMetrics,
  isDayKey,
  isFocusTimerComplete,
  migrateV1Snapshot,
  parseBackup,
  parseV2Snapshot,
  remainingFocusSeconds,
  serializeBackup,
  toDayKey,
  weekDayKeys,
  weekStartDayKey,
// @ts-expect-error Node's --experimental-strip-types ESM loader requires the explicit .ts extension.
} from './nook-state.ts';
import type {
  FocusSession,
  FocusTimer,
  HabitLog,
  LegacyV1Snapshot,
  Task,
} from './nook-state.ts';

const NOW = new Date(2026, 7, 27, 12, 0, 0, 0);
const NOW_ISO = NOW.toISOString();
const TODAY = '2026-08-27';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Ship a calm release',
    category: 'Work',
    minutes: 30,
    done: false,
    lane: 'support',
    dayKey: TODAY,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
    completedAt: null,
    checklist: [],
    ...overrides,
  };
}

test('DEFAULT_SNAPSHOT creates an honest, deterministic v2 starting point', () => {
  const snapshot = DEFAULT_SNAPSHOT(NOW);

  assert.equal(snapshot.schemaVersion, 2);
  assert.equal(snapshot.tasks.length, 0);
  assert.deepEqual(snapshot.habits, []);
  assert.equal(snapshot.habitLogs.length, 0);
  assert.equal(snapshot.notes[0]?.dayKey, TODAY);
  assert.equal(snapshot.notes[0]?.content, '');
  assert.equal(snapshot.dailyRecords[0]?.dayKey, TODAY);
  assert.equal(snapshot.dailyRecords[0]?.openedAt, null);
  assert.equal(snapshot.dailyRecords[0]?.capacityMinutes, 240);
  assert.equal(snapshot.focusTimer.running, false);
  assert.equal(snapshot.focusTimer.remainingSeconds, 25 * 60);
  assert.deepEqual(snapshot.settings, {
    dark: false,
    language: 'en',
    onboardingCompleted: false,
  });
  assert.equal(snapshot.legacyWeekMinutes, null);
});

test('legacy v2 snapshots default to English without replaying onboarding', () => {
  const legacyV2 = structuredClone(DEFAULT_SNAPSHOT(NOW)) as unknown as {
    settings: Record<string, unknown>;
  };
  delete legacyV2.settings.language;
  delete legacyV2.settings.onboardingCompleted;

  const parsed = parseV2Snapshot(legacyV2);

  assert.equal(parsed.settings.language, 'en');
  assert.equal(parsed.settings.onboardingCompleted, true);
});

test('Vietnamese language and onboarding state survive a backup round-trip', () => {
  const snapshot = DEFAULT_SNAPSHOT(NOW);
  snapshot.settings.language = 'vi';
  snapshot.settings.onboardingCompleted = true;

  const payload = serializeBackup(snapshot, { exportedAt: NOW, pretty: false });
  const restored = parseBackup(payload);

  assert.equal(restored.settings.language, 'vi');
  assert.equal(restored.settings.onboardingCompleted, true);
});

test('parser rejects invalid provided language and onboarding values', () => {
  const snapshot = DEFAULT_SNAPSHOT(NOW) as unknown as {
    settings: Record<string, unknown>;
  };
  snapshot.settings.language = 'fr';

  assert.throws(
    () => parseV2Snapshot(snapshot),
    (error: unknown) => error instanceof NookStateError && error.code === 'invalid-backup',
  );

  snapshot.settings.language = 'en';
  snapshot.settings.onboardingCompleted = 'yes';
  assert.throws(
    () => parseV2Snapshot(snapshot),
    (error: unknown) => error instanceof NookStateError && error.code === 'invalid-backup',
  );
});

test('day and Monday-based week helpers use local calendar arithmetic', () => {
  assert.equal(toDayKey(NOW), TODAY);
  assert.equal(isDayKey('2024-02-29'), true);
  assert.equal(isDayKey('2023-02-29'), false);
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2024-02-29', 1), '2024-03-01');
  assert.equal(weekStartDayKey(TODAY), '2026-08-24');
  assert.deepEqual(weekDayKeys(TODAY), [
    '2026-08-24',
    '2026-08-25',
    '2026-08-26',
    '2026-08-27',
    '2026-08-28',
    '2026-08-29',
    '2026-08-30',
  ]);
});

test('running focus timer derives remaining time from endsAt rather than interval ticks', () => {
  const timer: FocusTimer = {
    ...createFocusTimer(25),
    running: true,
    startedAt: '2026-08-27T10:00:00.000Z',
    endsAt: '2026-08-27T10:25:00.000Z',
  };

  assert.equal(remainingFocusSeconds(timer, '2026-08-27T10:10:00.000Z'), 900);
  assert.equal(remainingFocusSeconds(timer, '2026-08-27T10:24:59.250Z'), 1);
  assert.equal(isFocusTimerComplete(timer, '2026-08-27T10:25:00.000Z'), true);
  assert.equal(isFocusTimerComplete(timer, '2026-08-27T10:30:00.000Z'), true);
});

test('delayed focus completion uses the scheduled end instead of background wake time', () => {
  const timer: FocusTimer = {
    ...createFocusTimer(25),
    running: true,
    startedAt: '2026-08-27T10:00:00.000Z',
    endsAt: '2026-08-27T10:25:00.000Z',
  };

  assert.deepEqual(deriveFocusCompletionTiming(timer), {
    actualMinutes: 25,
    dayKey: toDayKey('2026-08-27T10:25:00.000Z'),
    endedAt: '2026-08-27T10:25:00.000Z',
    startedAt: '2026-08-27T10:00:00.000Z',
  });
});

test('daily metrics derive planned capacity, completed focus, and habit completion', () => {
  const snapshot = DEFAULT_SNAPSHOT(NOW);
  snapshot.tasks = [
    task({ id: 'anchor', lane: 'anchor', minutes: 50, done: true, completedAt: NOW_ISO }),
    task({ id: 'support', lane: 'support', minutes: 30 }),
    task({ id: 'optional', lane: 'optional', minutes: 20 }),
  ];
  snapshot.habits = ['Read', 'Move', 'Journal'].map((label, index) => ({
    id: `habit-${index + 1}`,
    label,
    mark: label[0],
    minimum: 'One small version',
    cadence: 'Daily',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
    archivedAt: null,
    legacyCount: null,
    legacyCheckedToday: null,
  }));
  snapshot.dailyRecords[0] = {
    ...snapshot.dailyRecords[0],
    capacityMinutes: 120,
  };
  const sessions: FocusSession[] = [
    {
      id: 'session-1',
      taskId: 'anchor',
      dayKey: TODAY,
      status: 'completed',
      plannedMinutes: 25,
      actualMinutes: 25,
      intention: 'Ship the release',
      distractions: 0,
      sessionNote: '',
      startedAt: '2026-08-27T08:00:00.000Z',
      endedAt: '2026-08-27T08:25:00.000Z',
    },
    {
      id: 'session-2',
      taskId: 'support',
      dayKey: TODAY,
      status: 'interrupted',
      plannedMinutes: 25,
      actualMinutes: 10,
      intention: 'Review the release',
      distractions: 1,
      sessionNote: 'Stopped intentionally.',
      startedAt: '2026-08-27T09:00:00.000Z',
      endedAt: '2026-08-27T09:10:00.000Z',
    },
  ];
  snapshot.focusSessions = sessions;
  const log: HabitLog = {
    id: 'habit-1:2026-08-27',
    habitId: 'habit-1',
    dayKey: TODAY,
    value: 1,
    completedAt: NOW_ISO,
    note: '',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  };
  snapshot.habitLogs = [log];

  const metrics = deriveDailyMetrics(snapshot, TODAY);
  assert.deepEqual(metrics.planned, {
    totalTasks: 3,
    completedTasks: 1,
    openTasks: 2,
    anchorTasks: 1,
    supportTasks: 1,
    optionalTasks: 1,
    plannedMinutes: 100,
    completedMinutes: 50,
    capacityMinutes: 120,
    remainingCapacityMinutes: 20,
  });
  assert.deepEqual(metrics.focus, {
    totalSessions: 2,
    completedSessions: 1,
    interruptedSessions: 1,
    focusedSeconds: 2_100,
    focusedMinutes: 35,
    plannedMinutes: 50,
  });
  assert.equal(metrics.habits.totalHabits, 3);
  assert.equal(metrics.habits.completedHabits, 1);
  assert.equal(metrics.habits.completionRate, 1 / 3);
  assert.deepEqual(metrics.habits.completedHabitIds, ['habit-1']);
});

test('backup envelope serializes and parses a validated v2 snapshot', () => {
  const snapshot = DEFAULT_SNAPSHOT(NOW);
  snapshot.tasks = [task()];
  snapshot.selectedTaskId = 'task-1';

  const payload = serializeBackup(snapshot, { exportedAt: NOW, pretty: false });
  const envelope = JSON.parse(payload) as Record<string, unknown>;
  assert.equal(envelope.format, NOOK_BACKUP_FORMAT);
  assert.equal(envelope.schemaVersion, 2);

  const restored = parseBackup(payload);
  assert.deepEqual(restored, parseV2Snapshot(snapshot));
  assert.notEqual(restored, snapshot);
});

test('v1 migration preserves current values without inventing dated history', () => {
  const legacy: LegacyV1Snapshot = {
    version: 1,
    exportedAt: '2026-08-26T22:00:00.000Z',
    tasks: [
      { id: 'old-task', title: 'Existing task', category: 'Work', minutes: 25, done: true },
    ],
    habits: [
      { id: 'old-habit', label: 'Read', mark: 'R', count: 6, checkedToday: true },
    ],
    note: '## Existing note\nKept intact.',
    selectedTaskId: 'old-task',
    timerPreset: 25,
    timerSeconds: 600,
    weekMinutes: [10, 20, 30, 40, 50, 60, 70],
    dark: true,
  };
  const original = JSON.stringify(legacy);

  const migrated = migrateV1Snapshot(legacy, { now: NOW });

  assert.equal(JSON.stringify(legacy), original, 'migration must not mutate its input');
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.tasks[0]?.lane, 'support');
  assert.equal(migrated.tasks[0]?.dayKey, TODAY);
  assert.equal(migrated.tasks[0]?.createdAt, null);
  assert.equal(migrated.tasks[0]?.completedAt, null);
  assert.equal(migrated.notes[0]?.content, legacy.note);
  assert.equal(migrated.habits[0]?.legacyCount, 6);
  assert.equal(migrated.habits[0]?.legacyCheckedToday, true);
  assert.deepEqual(migrated.habitLogs, []);
  assert.deepEqual(migrated.focusSessions, []);
  assert.deepEqual(migrated.legacyWeekMinutes, legacy.weekMinutes);
  assert.equal(migrated.focusTimer.running, false);
  assert.equal(migrated.focusTimer.remainingSeconds, 600);
  assert.equal(migrated.focusTimer.taskId, 'old-task');
  assert.equal(migrated.selectedTaskId, 'old-task');
  assert.equal(migrated.settings.dark, true);
  assert.equal(migrated.settings.language, 'en');
  assert.equal(migrated.settings.onboardingCompleted, true);
});

test('parseBackup recognizes the current nook.local.v1 shape without a version field', () => {
  const migrated = parseBackup({
    tasks: [],
    habits: [],
    note: '## Today\n',
    selectedTaskId: '',
    timerPreset: 50,
    timerSeconds: 3_000,
    weekMinutes: [0, 0, 0, 0, 0, 0, 0],
    dark: false,
  }, { now: NOW });

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.focusTimer.presetMinutes, 50);
  assert.equal(migrated.focusTimer.running, false);
  assert.equal(migrated.selectedTaskId, null);
  assert.deepEqual(migrated.legacyWeekMinutes, [0, 0, 0, 0, 0, 0, 0]);
});

test('parser fails closed for malformed JSON, unknown versions, and invalid v2 invariants', () => {
  assert.throws(
    () => parseBackup('{not json'),
    (error: unknown) => error instanceof NookStateError && error.code === 'invalid-json',
  );
  assert.throws(
    () => parseBackup({ version: 99, tasks: [], habits: [], note: '' }),
    (error: unknown) => error instanceof NookStateError && error.code === 'unsupported-version',
  );

  const badDay = DEFAULT_SNAPSHOT(NOW);
  badDay.notes[0] = { ...badDay.notes[0], dayKey: '2026-02-30' };
  assert.throws(
    () => parseV2Snapshot(badDay),
    (error: unknown) => error instanceof NookStateError && error.code === 'invalid-backup',
  );

  const badTimer = DEFAULT_SNAPSHOT(NOW);
  badTimer.focusTimer = {
    ...badTimer.focusTimer,
    running: true,
    startedAt: NOW_ISO,
    endsAt: null,
  };
  assert.throws(
    () => parseV2Snapshot(badTimer),
    (error: unknown) => error instanceof NookStateError && error.code === 'invalid-backup',
  );
});

test('parser rejects duplicate per-day records that would double-count metrics', () => {
  const snapshot = DEFAULT_SNAPSHOT(NOW);
  snapshot.habitLogs = [
    {
      id: 'log-1',
      habitId: 'habit-1',
      dayKey: TODAY,
      value: 1,
      completedAt: NOW_ISO,
      note: '',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
    {
      id: 'log-2',
      habitId: 'habit-1',
      dayKey: TODAY,
      value: 0,
      completedAt: null,
      note: '',
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    },
  ];

  assert.throws(
    () => parseV2Snapshot(snapshot),
    (error: unknown) => error instanceof NookStateError && error.code === 'invalid-backup',
  );
});
