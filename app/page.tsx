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
import { NookLaunch } from './components/NookLaunch';
import { NookOnboarding } from './components/NookOnboarding';
import { getNookCopy, NookI18nProvider, useNookI18n } from './lib/i18n';
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
  type Language,
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

const QUICK_ACTION_IDS = ['morning', 'today', 'focus', 'close', 'backup'] as const;

type QuickActionId = (typeof QUICK_ACTION_IDS)[number];

type SaveStatus = 'loading' | 'saving' | 'saved' | 'error';
type ActivationStep = 'idle' | 'morning' | 'anchor' | 'home';

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
  const { copy } = useNookI18n();
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
        <button
          ref={closeRef}
          className="v2-dialog-close"
          type="button"
          onClick={onClose}
          aria-label={copy.common.actions.closeDialog}
        >
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
  const [activationStep, setActivationStep] = useState<ActivationStep>('idle');
  const [tabDirection, setTabDirection] = useState<'backward' | 'forward' | 'neutral'>('neutral');
  const [launchPhase, setLaunchPhase] = useState<'active' | 'leaving'>('active');
  const [launchVisible, setLaunchVisible] = useState(true);
  const launchStartedAtRef = useRef<number | null>(null);
  const onboardingOpen = Boolean(
    hydrated && snapshot && !snapshot.settings.onboardingCompleted && !launchVisible,
  );
  const dialogOpen = morningPlanOpen || closeDayOpen || backupOpen || quickOpen
    || resetConfirmOpen || pendingImport !== null || onboardingOpen;
  const backgroundBlocked = dialogOpen || launchVisible;
  const scrollRef = useRef<HTMLElement>(null);
  const completedTimerRef = useRef<string | null>(null);
  const storageErrorShownRef = useRef(false);
  const storageRecoveryBlockedRef = useRef(false);
  const language = snapshot?.settings.language ?? 'en';
  const copy = getNookCopy(language);

  const notify = useCallback((message: string, undo: UndoState | null = null) => {
    setToast(message);
    setUndoState(undo);
  }, []);

  const activateTab = useCallback((tab: Tab) => {
    setActiveTab((current) => {
      const currentIndex = TAB_META.findIndex((item) => item.id === current);
      const nextIndex = TAB_META.findIndex((item) => item.id === tab);
      setTabDirection(nextIndex === currentIndex ? 'neutral' : nextIndex > currentIndex ? 'forward' : 'backward');
      return tab;
    });
    if (window.location.hash !== `#${tab}`) window.history.pushState(null, '', `#${tab}`);
    const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: scrollBehavior }));
  }, []);

  useEffect(() => {
    launchStartedAtRef.current = performance.now();
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
        else next = {
          ...next,
          settings: {
            ...next.settings,
            dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
          },
        };
      } catch {
        readError = true;
      }

      if (readError) {
        next = {
          ...next,
          settings: { ...next.settings, onboardingCompleted: true },
        };
      }
      storageRecoveryBlockedRef.current = readError;
      next = ensureCurrentDay(next, dayKey, nowIso);
      setSnapshot(next);
      setTodayKey(dayKey);
      setSelectedNoteDay(dayKey);
      setNowMs(now.getTime());
      setSaveStatus(readError ? 'error' : 'saved');
      if (readError) notify(getNookCopy(next.settings.language).messages.readError);

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
    if (!hydrated || !launchVisible) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elapsed = launchStartedAtRef.current === null
      ? 0
      : performance.now() - launchStartedAtRef.current;
    const waitForAuthoredMoment = Math.max(0, (reducedMotion ? 0 : 720) - elapsed);
    let finishTimer = 0;
    const leaveTimer = window.setTimeout(() => {
      setLaunchPhase('leaving');
      finishTimer = window.setTimeout(
        () => setLaunchVisible(false),
        reducedMotion ? 150 : 270,
      );
    }, waitForAuthoredMoment);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(finishTimer);
    };
  }, [hydrated, launchVisible]);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.slice(1) as Tab;
      if (TAB_META.some((tab) => tab.id === hash)) {
        setActiveTab((current) => {
          if (current === hash) return current;
          const currentIndex = TAB_META.findIndex((item) => item.id === current);
          const nextIndex = TAB_META.findIndex((item) => item.id === hash);
          setTabDirection(nextIndex > currentIndex ? 'forward' : 'backward');
          return hash;
        });
      }
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
          notify(copy.messages.saveError);
        }
      }
    }, 260);
    return () => {
      window.clearTimeout(markSaving);
      window.clearTimeout(save);
    };
  }, [copy.messages.saveError, hydrated, notify, snapshot]);

  useEffect(() => {
    if (!snapshot) return;
    document.documentElement.style.colorScheme = snapshot.settings.dark ? 'dark' : 'light';
    document.documentElement.dataset.nookTheme = snapshot.settings.dark ? 'dark' : 'light';
    document.documentElement.lang = snapshot.settings.language;
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
    notify(copy.messages.focusComplete);
  }, [copy.messages.focusComplete, displayedRemaining, notify, snapshot?.focusTimer.endsAt, snapshot?.focusTimer.running]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (backgroundBlocked && !quickOpen) return;
        setQuickOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [backgroundBlocked, quickOpen]);

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
      <NookI18nProvider language={language}>
        <main className="nook-app v2-app" style={appStyle}>
          {launchVisible && <NookLaunch language={language} phase={launchPhase} ready={false} />}
        </main>
      </NookI18nProvider>
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
    const category = boundedText(input.category.trim(), NOOK_INPUT_LIMITS.taskCategory);
    if (!title) return;
    const replacesAnchor = input.lane === 'anchor' && readySnapshot.tasks.some((task) => (
      task.dayKey === todayKey && task.lane === 'anchor' && !task.done
    ));
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
    if (activationStep === 'anchor' && input.lane === 'anchor') {
      setActivationStep('home');
      activateTab('home');
      notify(copy.messages.anchorReady);
      return;
    }
    notify(input.lane === 'anchor' ? copy.messages.anchorSet(replacesAnchor) : copy.messages.taskAdded);
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
    const previous = captureUndo(copy.messages.taskRestored);
    setSnapshot((current) => current ? {
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
      selectedTaskId: current.selectedTaskId === taskId ? null : current.selectedTaskId,
    } : current);
    notify(copy.messages.taskRemoved, previous);
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
    setActivationStep('idle');
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
    const continuesActivation = activationStep === 'morning';
    const nowIso = new Date().toISOString();
    setSnapshot((current) => current
      ? upsertDailyRecord(current, todayKey, {
        energy: values.energy as EnergyLevel,
        capacityMinutes: values.capacityMinutes,
        openedAt: current.dailyRecords.find((record) => record.dayKey === todayKey)?.openedAt ?? nowIso,
      }, nowIso)
      : current);
    setMorningPlanOpen(false);
    if (continuesActivation) {
      setActivationStep('anchor');
      activateTab('today');
      notify(copy.messages.morningNextAnchor);
    } else {
      notify(copy.messages.morningSaved);
    }
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
    notify(copy.messages.dayClosed);
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
    notify(copy.messages.habitAdded);
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
      notify(copy.messages.alreadyFits);
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
      notify(copy.messages.anchorOverload);
      return;
    }
    const tomorrow = addDays(todayKey, 1);
    const nowIso = new Date().toISOString();
    const previous = captureUndo(copy.messages.previousPlanRestored);
    setSnapshot((current) => current ? {
      ...current,
      tasks: current.tasks.map((task) => movedIds.has(task.id)
        ? { ...task, dayKey: tomorrow, updatedAt: nowIso }
        : task),
    } : current);
    notify(copy.messages.replanMoved(movedIds.size), previous);
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
    const template = {
      'morning-plan': copy.notes.templates.morningPlan.content,
      'close-day': copy.notes.templates.closeDay.content,
      'weekly-reflection': copy.notes.templates.weeklyReflection.content,
    }[templateId];
    changeNoteContent(dayKey, existing.trim() ? `${existing.trimEnd()}\n\n${template}` : template);
    notify(copy.messages.templateAdded);
  }

  function exportBackup() {
    const blob = new Blob([serializeBackup(readySnapshot, { pretty: true })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nook-backup-${todayKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify(copy.messages.backupExported);
  }

  async function readImport(file: File) {
    try {
      const imported = parseBackup(await file.text(), { now: new Date() });
      setPendingImport(imported);
      setBackupOpen(false);
    } catch {
      notify(copy.messages.invalidBackup);
    }
  }

  function confirmImport() {
    if (!pendingImport) return;
    const previous = captureUndo(copy.messages.previousDataRestored);
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
    notify(getNookCopy(imported.settings.language).messages.backupImported, previous);
  }

  function confirmReset() {
    const previous = captureUndo(copy.messages.previousDataRestored);
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
    notify(copy.messages.dataReset, previous);
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

  function changeLanguage(language: Language) {
    setSnapshot((current) => current ? {
      ...current,
      settings: { ...current.settings, language },
    } : current);
  }

  function completeOnboarding({ openMorningPlan }: { openMorningPlan: boolean }) {
    const shouldGuideFirstPlan = openMorningPlan
      && !dailyRecord?.openedAt
      && !readySnapshot.tasks.some((task) => task.dayKey === todayKey);
    setSnapshot((current) => current ? {
      ...current,
      settings: { ...current.settings, onboardingCompleted: true },
    } : current);
    setActivationStep(shouldGuideFirstPlan ? 'morning' : 'idle');
    if (openMorningPlan) setMorningPlanOpen(true);
    else {
      window.requestAnimationFrame(() => {
        document.getElementById(`v2-dock-tab-${activeTab}`)?.focus();
      });
    }
  }

  function replayOnboarding() {
    setBackupOpen(false);
    setActivationStep('idle');
    setSnapshot((current) => current ? {
      ...current,
      settings: { ...current.settings, onboardingCompleted: false },
    } : current);
  }

  const quickActionLabels: Record<QuickActionId, string> = {
    morning: copy.dialogs.quickActions.openMorning,
    today: copy.dialogs.quickActions.reviewToday,
    focus: copy.dialogs.quickActions.startFocus,
    close: copy.dialogs.quickActions.closeDay,
    backup: copy.dialogs.quickActions.backup,
  };

  return (
    <NookI18nProvider language={language}>
      <main
        className={`nook-app v2-app${snapshot.settings.dark ? ' is-dark' : ''}${standalone ? ' is-standalone' : ''}${dialogOpen ? ' has-dialog' : ''}`}
        style={appStyle}
      >
      {launchVisible && (
      <NookLaunch
        language={snapshot.settings.language}
        phase={launchPhase}
        dark={snapshot.settings.dark}
      />
      )}

      <div
        className="nook-shell v2-shell"
        aria-hidden={backgroundBlocked ? true : undefined}
        inert={backgroundBlocked ? true : undefined}
      >
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
              key={activeTab}
              id="nook-tab-panel"
              className="tab-stage"
              role="tabpanel"
              aria-labelledby={`v2-dock-tab-${activeTab}`}
              data-direction={tabDirection}
            >
              {activeTab === 'home' && (
                <HomeView
                  dayKey={todayKey}
                  dailyRecords={snapshot.dailyRecords}
                  tasks={snapshot.tasks}
                  habits={snapshot.habits}
                  habitLogs={snapshot.habitLogs}
                  focusSessions={snapshot.focusSessions}
                  guideNextMove={activationStep === 'home'}
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
                    guideAnchor={activationStep === 'anchor'}
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
                    title={copy.premium.replan.title}
                    description={copy.premium.replan.description}
                  >
                    <div className="v2-replan">
                      <p>
                        {overCapacityBy
                          ? copy.premium.replan.overCapacity(overCapacityBy)
                          : copy.premium.replan.fits}
                      </p>
                      <button className="v2-button v2-button--primary" type="button" onClick={replanOverflow} disabled={!overCapacityBy}>
                        {copy.premium.replan.action}
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
                    title={copy.premium.routine.title}
                    description={copy.premium.routine.description}
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
                            aria-label={copy.premium.routine.minimumFor(habit.label)}
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
                    title={copy.premium.profiles.title}
                    description={copy.premium.profiles.description}
                  >
                    <div className="v2-profile-list" aria-label={copy.premium.profiles.groupLabel}>
                      {[
                        { label: copy.premium.profiles.reset, minutes: 15 },
                        { label: copy.premium.profiles.steady, minutes: 25 },
                        { label: copy.premium.profiles.deep, minutes: 50 },
                        { label: copy.premium.profiles.immersion, minutes: 90 },
                      ].map((profile) => (
                        <button
                          key={profile.label}
                          className="v2-profile"
                          type="button"
                          onClick={() => setFocusPreset(profile.minutes)}
                          aria-pressed={snapshot.focusTimer.presetMinutes === profile.minutes}
                        >
                          <strong>{profile.label}</strong>
                          <span>{profile.minutes} {copy.common.units.minuteShort}</span>
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
              <p>{copy.footer.privacy}</p>
              <p className={saveStatus === 'error' ? 'is-error' : ''} role="status" aria-live="polite">
                {copy.footer.save[saveStatus]}
              </p>
              <button className="v2-footer-action" type="button" onClick={() => setQuickOpen(true)}>
                {copy.footer.quickActions}
              </button>
            </footer>
          </div>
        </section>
      </div>

      <div
        aria-hidden={backgroundBlocked ? true : undefined}
        inert={backgroundBlocked ? true : undefined}
      >
        <NookDock
          activeTab={activeTab}
          onTabChange={activateTab}
          focusRunning={snapshot.focusTimer.running}
        />
      </div>

      <MorningPlanDialog
        open={morningPlanOpen}
        record={dailyRecord ?? createDailyRecord(todayKey)}
        onClose={() => {
          setMorningPlanOpen(false);
          if (activationStep === 'morning') setActivationStep('idle');
        }}
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
        language={snapshot.settings.language}
        onClose={() => setBackupOpen(false)}
        onLanguageChange={changeLanguage}
        onReplayOnboarding={replayOnboarding}
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
            <p className="v2-dialog-kicker">{copy.dialogs.quickActions.kicker}</p>
            <h2 className="v2-dialog-title" id="quick-actions-title">{copy.dialogs.quickActions.title}</h2>
          </div>
          <div className="v2-command-list">
            {QUICK_ACTION_IDS.map((actionId) => (
              <button
                key={actionId}
                className="v2-command"
                type="button"
                onClick={() => runQuickAction(actionId)}
              >
                <CommandIcon size={19} weight="bold" aria-hidden="true" />
                <span>{quickActionLabels[actionId]}</span>
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
            <p className="v2-dialog-kicker">{copy.dialogs.importConfirm.kicker}</p>
            <h2 className="v2-dialog-title" id="confirm-import-title">{copy.dialogs.importConfirm.title}</h2>
            <p className="v2-dialog-description" id="confirm-import-description">
              {copy.dialogs.importConfirm.description(
                pendingImport.tasks.length,
                pendingImport.habits.length,
                pendingImport.notes.length,
              )}
            </p>
          </div>
          <div className="v2-dialog-actions">
            <button className="v2-button-secondary" type="button" onClick={() => setPendingImport(null)}>
              {copy.dialogs.importConfirm.keep}
            </button>
            <button className="v2-button-primary" type="button" onClick={confirmImport}>
              {copy.dialogs.importConfirm.replace}
            </button>
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
            <p className="v2-dialog-kicker">{copy.dialogs.resetConfirm.kicker}</p>
            <h2 className="v2-dialog-title" id="confirm-reset-title">{copy.dialogs.resetConfirm.title}</h2>
            <p className="v2-dialog-description" id="confirm-reset-description">
              {copy.dialogs.resetConfirm.description}
            </p>
          </div>
          <div className="v2-dialog-actions">
            <button className="v2-button-secondary" type="button" onClick={() => setResetConfirmOpen(false)}>
              {copy.dialogs.resetConfirm.keep}
            </button>
            <button className="v2-button-danger" type="button" onClick={confirmReset}>
              {copy.dialogs.resetConfirm.reset}
            </button>
          </div>
        </ModalFrame>
      )}

      {toast && (
        <div className="v2-toast" role="status" aria-live="polite">
          <span>{toast}</span>
          {undoState && (
            <button type="button" onClick={undoLastAction}>
              <ArrowCounterClockwise size={16} weight="bold" aria-hidden="true" />
              {copy.common.actions.undo}
            </button>
          )}
        </div>
      )}

      <span className="v2-owner-preview-note" aria-hidden="true">
        <Sparkle size={13} weight="bold" /> {copy.common.ownerPreview}
      </span>

      {onboardingOpen && (
        <NookOnboarding
          language={snapshot.settings.language}
          onLanguageChange={changeLanguage}
          onComplete={completeOnboarding}
        />
      )}
      </main>
    </NookI18nProvider>
  );
}
