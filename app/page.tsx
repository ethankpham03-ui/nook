'use client';

import { ArrowCounterClockwise } from '@phosphor-icons/react/ArrowCounterClockwise';
import { Command as CommandIcon } from '@phosphor-icons/react/Command';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { X } from '@phosphor-icons/react/X';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackupDialog,
  CloseDayDialog,
  MorningPlanDialog,
  NookDock,
  NookHeader,
  type CloseDayValues,
  type MorningPlanValues,
} from './components/NookChrome';
import {
  FocusView,
  HabitsView,
  HomeView,
  NotesView,
  PremiumPreview,
  TodayView,
  type NewHabitInput,
  type NewTaskInput,
  type NoteTemplateId,
} from './components/NookViews';
import {
  DEFAULT_SNAPSHOT,
  NOOK_INPUT_LIMITS,
  addDays,
  createDailyRecord,
  createFocusTimer,
  deriveFocusCompletionTiming,
  isDayKey,
  parseBackup,
  remainingFocusSeconds,
  serializeBackup,
  toDayKey,
  type DailyRecord,
  type EnergyLevel,
  type FocusSession,
  type Habit,
  type NookSnapshot,
  type NoteEntry,
  type Tab,
  type TaskLane,
} from './lib/nook-state';

const STORAGE_KEY = 'nook.local.v2';
const LEGACY_STORAGE_KEY = 'nook.local.v1';
const ROLLBACK_KEY = 'nook.rollback.v2';

const TAB_META: ReadonlyArray<{ id: Tab; accent: string; wash: string }> = [
  { id: 'today', accent: '#dfff64', wash: '#eef8bd' },
  { id: 'habits', accent: '#d8c1ff', wash: '#eee5fb' },
  { id: 'home', accent: '#fff1a8', wash: '#f7efd0' },
  { id: 'focus', accent: '#8be3e0', wash: '#d8f4f2' },
  { id: 'notes', accent: '#ffc6a3', wash: '#f7e3d6' },
];

const NOTE_TEMPLATE_CONTENT: Record<NoteTemplateId, string> = {
  'morning-plan': '## Morning plan\n\n**Anchor**\n\n**Support**\n\n**What can wait**\n',
  'close-day': '## Close the day\n\n**What moved**\n\n**What felt difficult**\n\n**What I can release**\n',
  'weekly-reflection': '## Weekly reflection\n\n**What had momentum**\n\n**What asked for too much**\n\n**One adjustment for next week**\n',
};

const QUICK_ACTIONS = [
  { id: 'morning', label: 'Open Morning Plan' },
  { id: 'today', label: 'Review Today' },
  { id: 'focus', label: 'Start a Focus block' },
  { id: 'close', label: 'Close the Day' },
  { id: 'backup', label: 'Backup & privacy' },
] as const;

type QuickActionId = (typeof QUICK_ACTIONS)[number]['id'];

type SaveStatus = 'loading' | 'saving' | 'saved' | 'error';

type UndoState = {
  label: string;
  snapshot: NookSnapshot;
};

type ModalFrameProps = {
  children: ReactNode;
  descriptionId?: string;
  labelId: string;
  onClose: () => void;
};

function uid(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function boundedText(value: string, maximum: number) {
  return value.slice(0, maximum);
}

function upsertDailyRecord(
  snapshot: NookSnapshot,
  dayKey: string,
  patch: Partial<DailyRecord>,
  updatedAt: string,
): NookSnapshot {
  const existing = snapshot.dailyRecords.find((record) => record.dayKey === dayKey)
    ?? createDailyRecord(dayKey, updatedAt);
  const nextRecord = { ...existing, ...patch, dayKey, updatedAt };
  const hasRecord = snapshot.dailyRecords.some((record) => record.dayKey === dayKey);
  return {
    ...snapshot,
    dailyRecords: hasRecord
      ? snapshot.dailyRecords.map((record) => (record.dayKey === dayKey ? nextRecord : record))
      : [...snapshot.dailyRecords, nextRecord],
  };
}

function ensureCurrentDay(snapshot: NookSnapshot, dayKey: string, nowIso: string): NookSnapshot {
  let next = snapshot;
  if (!next.dailyRecords.some((record) => record.dayKey === dayKey)) {
    next = {
      ...next,
      dailyRecords: [...next.dailyRecords, createDailyRecord(dayKey, nowIso)],
    };
  }
  if (!next.notes.some((note) => note.dayKey === dayKey)) {
    next = {
      ...next,
      notes: [
        ...next.notes,
        {
          id: `note-${dayKey}`,
          dayKey,
          content: '',
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ],
    };
  }
  return next;
}

function ModalFrame({ children, descriptionId, labelId, onClose }: ModalFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !frameRef.current) return;
      const focusable = Array.from(frameRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div className="v2-dialog-backdrop" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={frameRef}
        className="v2-dialog v2-dialog--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <button ref={closeRef} className="v2-dialog-close" type="button" onClick={onClose} aria-label="Close dialog">
          <X size={20} weight="bold" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function NookPage() {
  const [snapshot, setSnapshot] = useState<NookSnapshot | null>(null);
  const [todayKey, setTodayKey] = useState('');
  const [selectedNoteDay, setSelectedNoteDay] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [nowMs, setNowMs] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading');
  const [toast, setToast] = useState('');
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [morningPlanOpen, setMorningPlanOpen] = useState(false);
  const [closeDayOpen, setCloseDayOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<NookSnapshot | null>(null);
  const dialogOpen = morningPlanOpen || closeDayOpen || backupOpen || quickOpen
    || resetConfirmOpen || pendingImport !== null;
  const scrollRef = useRef<HTMLElement>(null);
  const completedTimerRef = useRef<string | null>(null);
  const storageErrorShownRef = useRef(false);
  const storageRecoveryBlockedRef = useRef(false);

  const notify = useCallback((message: string, undo: UndoState | null = null) => {
    setToast(message);
    setUndoState(undo);
  }, []);

  const activateTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (window.location.hash !== `#${tab}`) window.history.pushState(null, '', `#${tab}`);
    window.requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }));
  }, []);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const now = new Date();
      const dayKey = toDayKey(now);
      const nowIso = now.toISOString();
      let next = DEFAULT_SNAPSHOT(now);
      let readError = false;

      try {
        const currentRaw = localStorage.getItem(STORAGE_KEY);
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (currentRaw) next = parseBackup(currentRaw, { now });
        else if (legacyRaw) next = parseBackup(legacyRaw, { now });
        else next = { ...next, settings: { dark: window.matchMedia('(prefers-color-scheme: dark)').matches } };
      } catch {
        readError = true;
      }

      storageRecoveryBlockedRef.current = readError;
      next = ensureCurrentDay(next, dayKey, nowIso);
      setSnapshot(next);
      setTodayKey(dayKey);
      setSelectedNoteDay(dayKey);
      setNowMs(now.getTime());
      setSaveStatus(readError ? 'error' : 'saved');
      if (readError) notify('Saved data could not be read. It is preserved; import a backup or reset to resume saving.');

      const appleNavigator = navigator as Navigator & { standalone?: boolean };
      setStandalone(
        window.matchMedia('(display-mode: standalone)').matches
        || appleNavigator.standalone === true,
      );

      const hash = window.location.hash.slice(1) as Tab;
      if (TAB_META.some((tab) => tab.id === hash)) setActiveTab(hash);
      else window.history.replaceState(null, '', '#home');

      setHydrated(true);
    }, 0);
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    return () => window.clearTimeout(initialize);
  }, [notify]);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.slice(1) as Tab;
      if (TAB_META.some((tab) => tab.id === hash)) setActiveTab(hash);
    };
    window.addEventListener('popstate', syncFromHash);
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.removeEventListener('popstate', syncFromHash);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !snapshot || storageRecoveryBlockedRef.current) return;
    const markSaving = window.setTimeout(() => setSaveStatus('saving'), 0);
    const save = window.setTimeout(() => {
      try {
        serializeBackup(snapshot, { pretty: false });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        setSaveStatus('saved');
        storageErrorShownRef.current = false;
      } catch {
        setSaveStatus('error');
        if (!storageErrorShownRef.current) {
          storageErrorShownRef.current = true;
          notify('Could not save on this device. Keep this tab open and export a backup.');
        }
      }
    }, 260);
    return () => {
      window.clearTimeout(markSaving);
      window.clearTimeout(save);
    };
  }, [hydrated, notify, snapshot]);

  useEffect(() => {
    if (!snapshot) return;
    document.documentElement.style.colorScheme = snapshot.settings.dark ? 'dark' : 'light';
  }, [snapshot]);

  useEffect(() => {
    const cadence = snapshot?.focusTimer.running ? 250 : 30_000;
    const updateClock = () => setNowMs(Date.now());
    updateClock();
    const interval = window.setInterval(updateClock, cadence);
    return () => window.clearInterval(interval);
  }, [snapshot?.focusTimer.running]);

  useEffect(() => {
    if (!hydrated || !nowMs) return;
    const nextDayKey = toDayKey(nowMs);
    if (nextDayKey === todayKey) return;
    const nowIso = new Date(nowMs).toISOString();
    const advanceDay = window.setTimeout(() => {
      setTodayKey(nextDayKey);
      setSelectedNoteDay(nextDayKey);
      setSnapshot((current) => (current ? ensureCurrentDay(current, nextDayKey, nowIso) : current));
    }, 0);
    return () => window.clearTimeout(advanceDay);
  }, [hydrated, nowMs, todayKey]);

  const displayedRemaining = snapshot && nowMs
    ? remainingFocusSeconds(snapshot.focusTimer, nowMs)
    : snapshot?.focusTimer.remainingSeconds ?? 0;

  useEffect(() => {
    if (!snapshot?.focusTimer.running || displayedRemaining > 0 || !snapshot.focusTimer.endsAt) return;
    if (completedTimerRef.current === snapshot.focusTimer.endsAt) return;
    completedTimerRef.current = snapshot.focusTimer.endsAt;
    const observedAt = new Date();
    setSnapshot((current) => {
      if (!current?.focusTimer.running || remainingFocusSeconds(current.focusTimer, observedAt) > 0) return current;
      const timer = current.focusTimer;
      const timing = deriveFocusCompletionTiming(timer);
      const session: FocusSession = {
        id: uid('focus'),
        taskId: timer.taskId,
        dayKey: timing.dayKey,
        status: 'completed',
        plannedMinutes: timer.presetMinutes,
        actualMinutes: timing.actualMinutes,
        intention: timer.intention.trim(),
        distractions: timer.distractions.length,
        sessionNote: timer.sessionNote.trim(),
        startedAt: timing.startedAt,
        endedAt: timing.endedAt,
      };
      return {
        ...current,
        focusSessions: [...current.focusSessions, session],
        focusTimer: createFocusTimer(timer.presetMinutes),
      };
    });
    notify('Focus session complete. The real minutes are in your rhythm.');
  }, [displayedRemaining, notify, snapshot?.focusTimer.endsAt, snapshot?.focusTimer.running]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (dialogOpen && !quickOpen) return;
        setQuickOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, quickOpen]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => {
      setToast('');
      setUndoState(null);
    }, undoState ? 8_000 : 4_800);
    return () => window.clearTimeout(timeout);
  }, [toast, undoState]);

  const dailyRecord = useMemo(
    () => snapshot?.dailyRecords.find((record) => record.dayKey === todayKey),
    [snapshot?.dailyRecords, todayKey],
  );
  const activeTabIndex = Math.max(0, TAB_META.findIndex((tab) => tab.id === activeTab));
  const activeMeta = TAB_META[activeTabIndex];
  const appStyle = {
    '--active-tab-index': activeTabIndex,
    '--tab-accent': activeMeta.accent,
    '--tab-wash': activeMeta.wash,
  } as CSSProperties;

  if (!snapshot || !todayKey || !hydrated) {
    return (
      <main className="nook-app v2-app" style={appStyle}>
        <div className="v2-loading" role="status">
          <span className="v2-loading__mark" aria-hidden="true" />
          <p>Opening your local Nook…</p>
        </div>
      </main>
    );
  }

  const readySnapshot: NookSnapshot = snapshot;
  const focusTimer = { ...readySnapshot.focusTimer, remainingSeconds: displayedRemaining };
  const todayTasks = readySnapshot.tasks.filter((task) => task.dayKey === todayKey);
  const plannedMinutes = todayTasks.reduce((total, task) => total + task.minutes, 0);
  const capacityMinutes = dailyRecord?.capacityMinutes ?? 240;
  const overCapacityBy = Math.max(0, plannedMinutes - capacityMinutes);

  function captureUndo(label: string) {
    return { label, snapshot: readySnapshot } satisfies UndoState;
  }

  function addTask(input: NewTaskInput) {
    const nowIso = new Date().toISOString();
    const taskId = uid('task');
    const title = boundedText(input.title.trim(), NOOK_INPUT_LIMITS.taskTitle);
    const category = boundedText(input.category.trim() || 'Personal', NOOK_INPUT_LIMITS.taskCategory);
    if (!title) return;
    setSnapshot((current) => {
      if (!current) return current;
      const tasks = input.lane === 'anchor'
        ? current.tasks.map((task) => (
          task.dayKey === todayKey && task.lane === 'anchor' && !task.done
            ? { ...task, lane: 'support' as TaskLane, updatedAt: nowIso }
            : task
        ))
        : current.tasks;
      return {
        ...current,
        tasks: [{
          id: taskId,
          title,
          category,
          minutes: input.minutes,
          done: false,
          lane: input.lane,
          dayKey: todayKey,
          createdAt: nowIso,
          updatedAt: nowIso,
          completedAt: null,
          checklist: [],
        }, ...tasks],
        selectedTaskId: taskId,
      };
    });
    notify(input.lane === 'anchor' ? 'Anchor set. Previous anchor moved to Support.' : 'Task added to today.');
  }

  function toggleTask(taskId: string) {
    const nowIso = new Date().toISOString();
    setSnapshot((current) => current ? {
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId
        ? { ...task, done: !task.done, completedAt: task.done ? null : nowIso, updatedAt: nowIso }
        : task),
    } : current);
  }

  function deleteTask(taskId: string) {
    const previous = captureUndo('Task restored.');
    setSnapshot((current) => current ? {
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
      selectedTaskId: current.selectedTaskId === taskId ? null : current.selectedTaskId,
    } : current);
    notify('Task removed. Undo is available for a moment.', previous);
  }

  function changeTaskLane(taskId: string, lane: TaskLane) {
    const nowIso = new Date().toISOString();
    setSnapshot((current) => {
      if (!current) return current;
      return {
        ...current,
        tasks: current.tasks.map((task) => {
          if (lane === 'anchor' && task.id !== taskId && task.dayKey === todayKey && task.lane === 'anchor') {
            return { ...task, lane: 'support' as TaskLane, updatedAt: nowIso };
          }
          return task.id === taskId ? { ...task, lane, updatedAt: nowIso } : task;
        }),
      };
    });
  }

  function focusTask(taskId: string) {
    const task = readySnapshot.tasks.find((item) => item.id === taskId);
    setSnapshot((current) => current ? {
      ...current,
      selectedTaskId: taskId,
      focusTimer: {
        ...current.focusTimer,
        taskId,
        intention: current.focusTimer.intention.trim() || task?.title || '',
      },
    } : current);
    activateTab('focus');
  }

  function setCapacity(minutes: number) {
    const safeMinutes = Math.max(0, Math.min(1_440, Math.round(minutes)));
    const nowIso = new Date().toISOString();
    setSnapshot((current) => current
      ? upsertDailyRecord(current, todayKey, { capacityMinutes: safeMinutes }, nowIso)
      : current);
  }

  function submitMorningPlan(values: MorningPlanValues) {
    const nowIso = new Date().toISOString();
    setSnapshot((current) => current
      ? upsertDailyRecord(current, todayKey, {
        energy: values.energy as EnergyLevel,
        capacityMinutes: values.capacityMinutes,
        openedAt: current.dailyRecords.find((record) => record.dayKey === todayKey)?.openedAt ?? nowIso,
      }, nowIso)
      : current);
    setMorningPlanOpen(false);
    notify('Morning plan saved on this device.');
  }

  function submitCloseDay(values: CloseDayValues) {
    const nowIso = new Date().toISOString();
    setSnapshot((current) => current
      ? upsertDailyRecord(current, todayKey, {
        closingEnergy: values.closingEnergy as EnergyLevel,
        closingNote: values.closingNote,
        closedAt: nowIso,
      }, nowIso)
      : current);
    setCloseDayOpen(false);
    notify('Today is closed. Nothing else needs to be optimized.');
  }

  function addHabit(input: NewHabitInput) {
    const nowIso = new Date().toISOString();
    const label = boundedText(input.label.trim(), NOOK_INPUT_LIMITS.habitLabel);
    const minimum = boundedText(input.minimum.trim(), NOOK_INPUT_LIMITS.habitMinimum);
    if (!label || !minimum) return;
    const habit: Habit = {
      id: uid('habit'),
      label,
      mark: Array.from(label)[0]?.toLocaleUpperCase() ?? 'H',
      minimum,
      cadence: 'Daily',
      createdAt: nowIso,
      updatedAt: nowIso,
      archivedAt: null,
      legacyCount: null,
      legacyCheckedToday: null,
    };
    setSnapshot((current) => current ? { ...current, habits: [...current.habits, habit] } : current);
    notify('Habit added with a minimum version.');
  }

  function toggleHabitToday(habitId: string, nextValue: number) {
    const nowIso = new Date().toISOString();
    const value = Math.max(0, Math.round(nextValue));
    setSnapshot((current) => {
      if (!current) return current;
      const existing = current.habitLogs.find((log) => log.habitId === habitId && log.dayKey === todayKey);
      const nextLog = {
        id: existing?.id ?? uid('habit-log'),
        habitId,
        dayKey: todayKey,
        value,
        completedAt: value > 0 ? nowIso : null,
        note: existing?.note ?? '',
        createdAt: existing?.createdAt ?? nowIso,
        updatedAt: nowIso,
      };
      return {
        ...current,
        habitLogs: existing
          ? current.habitLogs.map((log) => log.id === existing.id ? nextLog : log)
          : [...current.habitLogs, nextLog],
      };
    });
  }

  function updateHabitMinimum(habitId: string, minimum: string) {
    const nextMinimum = boundedText(minimum.trim(), NOOK_INPUT_LIMITS.habitMinimum);
    if (!nextMinimum) return;
    const nowIso = new Date().toISOString();
    setSnapshot((current) => current ? {
      ...current,
      habits: current.habits.map((habit) => habit.id === habitId
        ? { ...habit, minimum: nextMinimum, updatedAt: nowIso }
        : habit),
    } : current);
  }

  function setFocusPreset(minutes: number) {
    setSnapshot((current) => {
      if (!current) return current;
      const next = createFocusTimer(minutes);
      return {
        ...current,
        focusTimer: {
          ...next,
          taskId: current.focusTimer.taskId,
          intention: current.focusTimer.intention,
          distractions: current.focusTimer.distractions,
          sessionNote: current.focusTimer.sessionNote,
        },
      };
    });
    completedTimerRef.current = null;
  }

  function toggleTimer() {
    const now = new Date();
    setSnapshot((current) => {
      if (!current) return current;
      const timer = current.focusTimer;
      if (timer.running) {
        return {
          ...current,
          focusTimer: {
            ...timer,
            running: false,
            remainingSeconds: remainingFocusSeconds(timer, now),
            endsAt: null,
            pausedAt: now.toISOString(),
          },
        };
      }
      const remainingSeconds = timer.remainingSeconds > 0
        ? timer.remainingSeconds
        : timer.presetMinutes * 60;
      const elapsedSeconds = Math.max(
        0,
        timer.presetMinutes * 60 - remainingSeconds,
      );
      completedTimerRef.current = null;
      return {
        ...current,
        focusTimer: {
          ...timer,
          running: true,
          remainingSeconds,
          // Rebuild the active start time from focused seconds so paused time
          // never inflates the completed session duration.
          startedAt: new Date(now.getTime() - elapsedSeconds * 1_000).toISOString(),
          endsAt: new Date(now.getTime() + remainingSeconds * 1_000).toISOString(),
          pausedAt: null,
        },
      };
    });
  }

  function resetTimer() {
    setSnapshot((current) => {
      if (!current) return current;
      const next = createFocusTimer(current.focusTimer.presetMinutes);
      return {
        ...current,
        focusTimer: {
          ...next,
          taskId: current.focusTimer.taskId,
          intention: current.focusTimer.intention,
          distractions: current.focusTimer.distractions,
          sessionNote: current.focusTimer.sessionNote,
        },
      };
    });
    completedTimerRef.current = null;
  }

  function replanOverflow() {
    if (!overCapacityBy) {
      notify('Today already fits inside the capacity you set.');
      return;
    }
    const candidates = todayTasks
      .filter((task) => !task.done && task.lane !== 'anchor')
      .sort((left, right) => {
        const laneWeight = (lane: TaskLane) => lane === 'optional' ? 0 : 1;
        return laneWeight(left.lane) - laneWeight(right.lane) || right.minutes - left.minutes;
      });
    let movedMinutes = 0;
    const movedIds = new Set<string>();
    for (const task of candidates) {
      if (movedMinutes >= overCapacityBy) break;
      movedIds.add(task.id);
      movedMinutes += task.minutes;
    }
    if (!movedIds.size) {
      notify('The overload is in the Anchor. Nook will not move it without your choice.');
      return;
    }
    const tomorrow = addDays(todayKey, 1);
    const nowIso = new Date().toISOString();
    const previous = captureUndo('Previous day plan restored.');
    setSnapshot((current) => current ? {
      ...current,
      tasks: current.tasks.map((task) => movedIds.has(task.id)
        ? { ...task, dayKey: tomorrow, updatedAt: nowIso }
        : task),
    } : current);
    notify(`Local Replan moved ${movedIds.size} ${movedIds.size === 1 ? 'task' : 'tasks'} to tomorrow.`, previous);
  }

  function changeNoteContent(dayKey: string, content: string) {
    if (!isDayKey(dayKey)) return;
    const nowIso = new Date().toISOString();
    const nextContent = boundedText(content, NOOK_INPUT_LIMITS.noteContent);
    setSnapshot((current) => {
      if (!current) return current;
      const existing = current.notes.find((note) => note.dayKey === dayKey);
      const note: NoteEntry = {
        id: existing?.id ?? `note-${dayKey}`,
        dayKey,
        content: nextContent,
        createdAt: existing?.createdAt ?? nowIso,
        updatedAt: nowIso,
      };
      return {
        ...current,
        notes: existing
          ? current.notes.map((entry) => entry.id === existing.id ? note : entry)
          : [...current.notes, note],
      };
    });
  }

  function selectNoteDay(dayKey: string) {
    if (isDayKey(dayKey)) setSelectedNoteDay(dayKey);
  }

  function applyNoteTemplate(dayKey: string, templateId: NoteTemplateId) {
    const existing = readySnapshot.notes.find((note) => note.dayKey === dayKey)?.content ?? '';
    const template = NOTE_TEMPLATE_CONTENT[templateId];
    changeNoteContent(dayKey, existing.trim() ? `${existing.trimEnd()}\n\n${template}` : template);
    notify('Template added to this local note.');
  }

  function exportBackup() {
    const blob = new Blob([serializeBackup(readySnapshot, { pretty: true })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nook-backup-${todayKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Private backup exported.');
  }

  async function readImport(file: File) {
    try {
      const imported = parseBackup(await file.text(), { now: new Date() });
      setPendingImport(imported);
      setBackupOpen(false);
    } catch {
      notify('That file is not a valid Nook backup. Choose an exported JSON backup.');
    }
  }

  function confirmImport() {
    if (!pendingImport) return;
    const previous = captureUndo('Previous local data restored.');
    try {
      localStorage.setItem(ROLLBACK_KEY, serializeBackup(readySnapshot));
    } catch {
      // In-memory undo still works for this session.
    }
    const imported = ensureCurrentDay(pendingImport, todayKey, new Date().toISOString());
    storageRecoveryBlockedRef.current = false;
    setSnapshot(imported);
    setPendingImport(null);
    setSelectedNoteDay(todayKey);
    notify('Backup imported. Undo is available for a moment.', previous);
  }

  function confirmReset() {
    const previous = captureUndo('Previous local data restored.');
    try {
      localStorage.setItem(ROLLBACK_KEY, serializeBackup(readySnapshot));
    } catch {
      // In-memory undo still works for this session.
    }
    const fresh = DEFAULT_SNAPSHOT(new Date());
    storageRecoveryBlockedRef.current = false;
    setSnapshot({ ...fresh, settings: readySnapshot.settings });
    setSelectedNoteDay(todayKey);
    setResetConfirmOpen(false);
    notify('Local Nook data reset. Undo is available for a moment.', previous);
  }

  function undoLastAction() {
    if (!undoState) return;
    setSnapshot(undoState.snapshot);
    setUndoState(null);
    setToast(undoState.label);
  }

  function runQuickAction(actionId: QuickActionId) {
    setQuickOpen(false);
    if (actionId === 'morning') setMorningPlanOpen(true);
    else if (actionId === 'today') activateTab('today');
    else if (actionId === 'focus') activateTab('focus');
    else if (actionId === 'close') setCloseDayOpen(true);
    else setBackupOpen(true);
  }

  return (
    <main
      className={`nook-app v2-app${snapshot.settings.dark ? ' is-dark' : ''}${standalone ? ' is-standalone' : ''}${dialogOpen ? ' has-dialog' : ''}`}
      style={appStyle}
    >
      <div className="nook-shell v2-shell">
        <NookHeader
          activeTab={activeTab}
          isDark={snapshot.settings.dark}
          onGoHome={() => activateTab('home')}
          onToggleTheme={() => setSnapshot((current) => current ? {
            ...current,
            settings: { ...current.settings, dark: !current.settings.dark },
          } : current)}
          onOpenSettings={() => setBackupOpen(true)}
        />

        <section
          ref={scrollRef}
          className="nook-scroll v2-scroll"
          aria-hidden={dialogOpen ? true : undefined}
          inert={dialogOpen ? true : undefined}
        >
          <div className="v2-content">
            <section
              id="nook-tab-panel"
              className="tab-stage"
              role="tabpanel"
              aria-labelledby={`v2-dock-tab-${activeTab}`}
            >
              {activeTab === 'home' && (
                <HomeView
                  dayKey={todayKey}
                  dailyRecords={snapshot.dailyRecords}
                  tasks={snapshot.tasks}
                  habits={snapshot.habits}
                  habitLogs={snapshot.habitLogs}
                  focusSessions={snapshot.focusSessions}
                  notes={snapshot.notes}
                  onNavigate={activateTab}
                  onFocusTask={focusTask}
                  onOpenMorningPlan={() => setMorningPlanOpen(true)}
                  onCloseDay={() => setCloseDayOpen(true)}
                />
              )}

              {activeTab === 'today' && (
                <>
                  <TodayView
                    dayKey={todayKey}
                    dailyRecord={dailyRecord}
                    tasks={snapshot.tasks}
                    onAddTask={addTask}
                    onToggleTask={toggleTask}
                    onDeleteTask={deleteTask}
                    onChangeTaskLane={changeTaskLane}
                    onSetCapacity={setCapacity}
                    onFocusTask={focusTask}
                  />
                  <PremiumPreview
                    className="v2-owner-tool"
                    title="Local Replan"
                    description="Nook explains the overload, then moves Optional work first and Support work second. The Anchor stays put."
                  >
                    <div className="v2-replan">
                      <p>
                        {overCapacityBy
                          ? `${overCapacityBy} minutes over today’s capacity. No calendar or cloud service is involved.`
                          : 'Today fits the capacity you set. Replan will wait until it has a real reason.'}
                      </p>
                      <button className="v2-button v2-button--primary" type="button" onClick={replanOverflow} disabled={!overCapacityBy}>
                        Replan overflow
                      </button>
                    </div>
                  </PremiumPreview>
                </>
              )}

              {activeTab === 'habits' && (
                <>
                  <HabitsView
                    dayKey={todayKey}
                    habits={snapshot.habits.filter((habit) => !habit.archivedAt)}
                    habitLogs={snapshot.habitLogs}
                    onAddHabit={addHabit}
                    onToggleToday={toggleHabitToday}
                  />
                  <PremiumPreview
                    className="v2-owner-tool"
                    title="Routine Designer"
                    description="Tune the version of each habit that still works on a low-energy day. Changes stay local."
                  >
                    <div className="v2-routine-designer">
                      {snapshot.habits.filter((habit) => !habit.archivedAt).map((habit) => (
                        <label key={habit.id} className="v2-routine-row">
                          <span>{habit.label}</span>
                          <input
                            className="v2-field"
                            defaultValue={habit.minimum}
                            maxLength={NOOK_INPUT_LIMITS.habitMinimum}
                            onBlur={(event) => updateHabitMinimum(habit.id, event.currentTarget.value)}
                            aria-label={`Minimum version for ${habit.label}`}
                          />
                        </label>
                      ))}
                    </div>
                  </PremiumPreview>
                </>
              )}

              {activeTab === 'focus' && (
                <>
                  <FocusView
                    dayKey={todayKey}
                    timer={focusTimer}
                    sessions={snapshot.focusSessions}
                    onSetPreset={setFocusPreset}
                    onToggleTimer={toggleTimer}
                    onResetTimer={resetTimer}
                    onChangeIntention={(intention) => setSnapshot((current) => current ? {
                      ...current,
                      focusTimer: {
                        ...current.focusTimer,
                        intention: boundedText(intention, NOOK_INPUT_LIMITS.focusIntention),
                      },
                    } : current)}
                    onAddDistraction={(distraction) => setSnapshot((current) => {
                      if (!current || current.focusTimer.distractions.length >= NOOK_INPUT_LIMITS.distractions) {
                        return current;
                      }
                      const nextDistraction = boundedText(distraction.trim(), NOOK_INPUT_LIMITS.distraction);
                      if (!nextDistraction) return current;
                      return {
                        ...current,
                        focusTimer: {
                          ...current.focusTimer,
                          distractions: [...current.focusTimer.distractions, nextDistraction],
                        },
                      };
                    })}
                    onRemoveDistraction={(index) => setSnapshot((current) => current ? {
                      ...current,
                      focusTimer: {
                        ...current.focusTimer,
                        distractions: current.focusTimer.distractions.filter((_, itemIndex) => itemIndex !== index),
                      },
                    } : current)}
                    onChangeSessionNote={(sessionNote) => setSnapshot((current) => current ? {
                      ...current,
                      focusTimer: {
                        ...current.focusTimer,
                        sessionNote: boundedText(sessionNote, NOOK_INPUT_LIMITS.sessionNote),
                      },
                    } : current)}
                  />
                  <PremiumPreview
                    className="v2-owner-tool"
                    title="Focus profiles"
                    description="Choose a repeatable local profile. Native app shielding and offline soundscapes come in the mobile wave."
                  >
                    <div className="v2-profile-list" aria-label="Premium focus profiles">
                      {[
                        { label: 'Reset', minutes: 15 },
                        { label: 'Steady', minutes: 25 },
                        { label: 'Deep', minutes: 50 },
                        { label: 'Immersion', minutes: 90 },
                      ].map((profile) => (
                        <button
                          key={profile.label}
                          className="v2-profile"
                          type="button"
                          onClick={() => setFocusPreset(profile.minutes)}
                          aria-pressed={snapshot.focusTimer.presetMinutes === profile.minutes}
                        >
                          <strong>{profile.label}</strong>
                          <span>{profile.minutes} min</span>
                        </button>
                      ))}
                    </div>
                  </PremiumPreview>
                </>
              )}

              {activeTab === 'notes' && (
                <NotesView
                  notes={snapshot.notes}
                  selectedDayKey={selectedNoteDay}
                  onSelectDay={selectNoteDay}
                  onChangeContent={changeNoteContent}
                  onApplyTemplate={applyNoteTemplate}
                />
              )}
            </section>

            <footer className="v2-footer">
              <p>No account. No cloud. No tracking.</p>
              <p className={saveStatus === 'error' ? 'is-error' : ''} role="status" aria-live="polite">
                {saveStatus === 'loading' && 'Checking local storage…'}
                {saveStatus === 'saving' && 'Saving on this device…'}
                {saveStatus === 'saved' && 'Saved on this device'}
                {saveStatus === 'error' && 'Save unavailable · export a backup'}
              </p>
              <button className="v2-footer-action" type="button" onClick={() => setQuickOpen(true)}>
                Ctrl/⌘ K · Quick actions
              </button>
            </footer>
          </div>
        </section>
      </div>

      <NookDock
        activeTab={activeTab}
        onTabChange={activateTab}
        focusRunning={snapshot.focusTimer.running}
      />

      <MorningPlanDialog
        open={morningPlanOpen}
        record={dailyRecord ?? createDailyRecord(todayKey)}
        onClose={() => setMorningPlanOpen(false)}
        onSubmit={submitMorningPlan}
      />
      <CloseDayDialog
        open={closeDayOpen}
        record={dailyRecord ?? createDailyRecord(todayKey)}
        onClose={() => setCloseDayOpen(false)}
        onSubmit={submitCloseDay}
      />
      <BackupDialog
        open={backupOpen}
        onClose={() => setBackupOpen(false)}
        onExport={exportBackup}
        onImportFile={readImport}
        onReset={() => {
          setBackupOpen(false);
          setResetConfirmOpen(true);
        }}
      />

      {quickOpen && (
        <ModalFrame labelId="quick-actions-title" onClose={() => setQuickOpen(false)}>
          <div className="v2-dialog-heading">
            <p className="v2-dialog-kicker">Quick actions</p>
            <h2 className="v2-dialog-title" id="quick-actions-title">Where should the day move?</h2>
          </div>
          <div className="v2-command-list">
            {QUICK_ACTIONS.map((command) => (
              <button
                key={command.label}
                className="v2-command"
                type="button"
                onClick={() => runQuickAction(command.id)}
              >
                <CommandIcon size={19} weight="bold" aria-hidden="true" />
                <span>{command.label}</span>
              </button>
            ))}
          </div>
        </ModalFrame>
      )}

      {pendingImport && (
        <ModalFrame
          labelId="confirm-import-title"
          descriptionId="confirm-import-description"
          onClose={() => setPendingImport(null)}
        >
          <div className="v2-dialog-heading">
            <p className="v2-dialog-kicker">Review backup</p>
            <h2 className="v2-dialog-title" id="confirm-import-title">Replace data on this device?</h2>
            <p className="v2-dialog-description" id="confirm-import-description">
              Nook will keep a recovery copy first. The imported file contains {pendingImport.tasks.length} tasks,
              {' '}{pendingImport.habits.length} habits, and {pendingImport.notes.length} dated notes.
            </p>
          </div>
          <div className="v2-dialog-actions">
            <button className="v2-button-secondary" type="button" onClick={() => setPendingImport(null)}>Keep current data</button>
            <button className="v2-button-primary" type="button" onClick={confirmImport}>Replace with backup</button>
          </div>
        </ModalFrame>
      )}

      {resetConfirmOpen && (
        <ModalFrame
          labelId="confirm-reset-title"
          descriptionId="confirm-reset-description"
          onClose={() => setResetConfirmOpen(false)}
        >
          <div className="v2-dialog-heading">
            <p className="v2-dialog-kicker">Local reset</p>
            <h2 className="v2-dialog-title" id="confirm-reset-title">Start with an empty Nook?</h2>
            <p className="v2-dialog-description" id="confirm-reset-description">
              This removes the current tasks, history, habits, and notes from this browser. Export first if you need a durable copy.
            </p>
          </div>
          <div className="v2-dialog-actions">
            <button className="v2-button-secondary" type="button" onClick={() => setResetConfirmOpen(false)}>Keep my data</button>
            <button className="v2-button-danger" type="button" onClick={confirmReset}>Reset local data</button>
          </div>
        </ModalFrame>
      )}

      {toast && (
        <div className="v2-toast" role="status" aria-live="polite">
          <span>{toast}</span>
          {undoState && (
            <button type="button" onClick={undoLastAction}>
              <ArrowCounterClockwise size={16} weight="bold" aria-hidden="true" />
              Undo
            </button>
          )}
        </div>
      )}

      <span className="v2-owner-preview-note" aria-hidden="true">
        <Sparkle size={13} weight="bold" /> Owner preview
      </span>
    </main>
  );
}
