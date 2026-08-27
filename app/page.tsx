'use client';

import { ArrowCounterClockwise } from '@phosphor-icons/react/ArrowCounterClockwise';
import { CheckSquareOffset } from '@phosphor-icons/react/CheckSquareOffset';
import { Check } from '@phosphor-icons/react/Check';
import { DownloadSimple } from '@phosphor-icons/react/DownloadSimple';
import { House } from '@phosphor-icons/react/House';
import { MagnifyingGlass } from '@phosphor-icons/react/MagnifyingGlass';
import { Moon } from '@phosphor-icons/react/Moon';
import { NotePencil } from '@phosphor-icons/react/NotePencil';
import { Pause } from '@phosphor-icons/react/Pause';
import { Play } from '@phosphor-icons/react/Play';
import { Plus } from '@phosphor-icons/react/Plus';
import { Repeat } from '@phosphor-icons/react/Repeat';
import { Sun } from '@phosphor-icons/react/Sun';
import { Timer } from '@phosphor-icons/react/Timer';
import { X } from '@phosphor-icons/react/X';
import type { ChangeEvent, CSSProperties, FormEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Task = {
  id: string;
  title: string;
  category: string;
  minutes: number;
  done: boolean;
};

type Habit = {
  id: string;
  label: string;
  mark: string;
  count: number;
  checkedToday: boolean;
};

type AppTab = 'today' | 'focus' | 'home' | 'habits' | 'notes';

const TABS: Array<{ id: AppTab; label: string; accent: string; wash: string; icon: typeof House }> = [
  { id: 'today', label: 'Today', accent: '#dfff64', wash: '#eef8bd', icon: CheckSquareOffset },
  { id: 'habits', label: 'Habits', accent: '#d8c1ff', wash: '#eee5fb', icon: Repeat },
  { id: 'home', label: 'Home', accent: '#fff1a8', wash: '#f7efd0', icon: House },
  { id: 'focus', label: 'Focus', accent: '#8be3e0', wash: '#d8f4f2', icon: Timer },
  { id: 'notes', label: 'Notes', accent: '#ffc6a3', wash: '#f7e3d6', icon: NotePencil },
];

const STORAGE_KEY = 'nook.local.v1';
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const initialTasks: Task[] = [];

const initialHabits: Habit[] = [
  { id: 'habit-1', label: 'Read', mark: 'R', count: 0, checkedToday: false },
  { id: 'habit-2', label: 'Move', mark: 'M', count: 0, checkedToday: false },
  { id: 'habit-3', label: 'Journal', mark: 'J', count: 0, checkedToday: false },
];

function uid(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}`;
}

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [note, setNote] = useState('## Today\n');
  const [selectedTaskId, setSelectedTaskId] = useState(initialTasks[0]?.id ?? '');
  const [timerPreset, setTimerPreset] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [weekMinutes, setWeekMinutes] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [dark, setDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Work');
  const [taskMinutes, setTaskMinutes] = useState(25);
  const [dateLabel, setDateLabel] = useState('Monday, 24 August');
  const [greeting, setGreeting] = useState('Good morning');
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [previewTab, setPreviewTab] = useState<AppTab | null>(null);
  const [lensPosition, setLensPosition] = useState<number | null>(null);
  const [navDragging, setNavDragging] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const dragStartRef = useRef<{ pointerId: number; x: number } | null>(null);
  const suppressClickRef = useRef(false);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks.find((task) => !task.done) ?? tasks[0],
    [selectedTaskId, tasks],
  );
  const remainingTasks = tasks.filter((task) => !task.done).length;
  const focusedTotal = weekMinutes.reduce((sum, minutes) => sum + minutes, 0);
  const chartMax = Math.max(...weekMinutes, 1);
  const habitsToday = habits.filter((habit) => habit.checkedToday).length;
  const noteWords = note.trim() ? note.trim().split(/\s+/).length : 0;
  const visualTab = previewTab ?? activeTab;
  const visualTabIndex = TABS.findIndex((tab) => tab.id === visualTab);
  const visualTabConfig = TABS[visualTabIndex];
  const appStyle = {
    '--active-tab-index': lensPosition ?? visualTabIndex,
    '--tab-accent': visualTabConfig.accent,
    '--tab-wash': visualTabConfig.wash,
  } as CSSProperties;

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved.tasks)) setTasks(saved.tasks);
          if (Array.isArray(saved.habits)) setHabits(saved.habits);
          if (typeof saved.note === 'string') setNote(saved.note);
          if (typeof saved.selectedTaskId === 'string') setSelectedTaskId(saved.selectedTaskId);
          if (typeof saved.timerPreset === 'number') setTimerPreset(saved.timerPreset);
          if (typeof saved.timerSeconds === 'number') setTimerSeconds(saved.timerSeconds);
          if (Array.isArray(saved.weekMinutes) && saved.weekMinutes.length === 7) setWeekMinutes(saved.weekMinutes);
          if (typeof saved.dark === 'boolean') setDark(saved.dark);
        } else {
          setDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
      } catch {
        setToast('Saved data could not be read. Fresh defaults are loaded.');
      }

      const now = new Date();
      setDateLabel(new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(now));
      const hour = now.getHours();
      setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
      setHydrated(true);
    }, 0);

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    return () => window.clearTimeout(initialize);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tasks, habits, note, selectedTaskId, timerPreset, timerSeconds, weekMinutes, dark }),
    );
  }, [dark, habits, hydrated, note, selectedTaskId, tasks, timerPreset, timerSeconds, weekMinutes]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => setTimerSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || timerSeconds !== 0) return;
    const finish = window.setTimeout(() => {
      setTimerRunning(false);
      setTimerSeconds(timerPreset * 60);
      setWeekMinutes((minutes) => {
        const next = [...minutes];
        const dayIndex = (new Date().getDay() + 6) % 7;
        next[dayIndex] += timerPreset;
        return next;
      });
      setToast('Focus session complete. Beautiful work.');
    }, 0);
    return () => window.clearTimeout(finish);
  }, [timerPreset, timerRunning, timerSeconds]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setTaskModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!paletteOpen) return;
    const focusCommand = window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>('[data-command-first="true"]')?.focus();
    });
    return () => window.cancelAnimationFrame(focusCommand);
  }, [paletteOpen]);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.slice(1) as AppTab;
      if (TABS.some((tab) => tab.id === hash)) setActiveTab(hash);
    };
    if (window.location.hash) syncFromHash();
    else window.history.replaceState(null, '', '#home');
    window.addEventListener('popstate', syncFromHash);
    return () => window.removeEventListener('popstate', syncFromHash);
  }, []);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    const task: Task = { id: uid('task'), title, category: taskCategory, minutes: taskMinutes, done: false };
    setTasks((current) => [task, ...current]);
    setSelectedTaskId(task.id);
    setTaskTitle('');
    setTaskModalOpen(false);
    setToast('Task added to today.');
  }

  function toggleTask(id: string) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
    setToast('Task removed.');
  }

  function toggleHabit(id: string) {
    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== id) return habit;
        const checkedToday = !habit.checkedToday;
        return { ...habit, checkedToday, count: Math.max(0, Math.min(7, habit.count + (checkedToday ? 1 : -1))) };
      }),
    );
  }

  function choosePreset(minutes: number) {
    setTimerRunning(false);
    setTimerPreset(minutes);
    setTimerSeconds(minutes * 60);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(timerPreset * 60);
  }

  function activateTab(tab: AppTab) {
    setActiveTab(tab);
    setPreviewTab(null);
    setLensPosition(null);
    if (window.location.hash !== `#${tab}`) window.history.pushState(null, '', `#${tab}`);
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>('.nook-scroll')?.scrollTo({ top: 0 }));
  }

  function lensPositionFromPointer(clientX: number) {
    const buttons = navRef.current?.querySelectorAll<HTMLButtonElement>('[data-tab]');
    if (!buttons?.length) return TABS.findIndex((tab) => tab.id === activeTab);
    const first = buttons[0].getBoundingClientRect();
    const last = buttons[buttons.length - 1].getBoundingClientRect();
    const firstCenter = first.left + first.width / 2;
    const lastCenter = last.left + last.width / 2;
    const rawPosition = ((clientX - firstCenter) / Math.max(1, lastCenter - firstCenter)) * (TABS.length - 1);
    return Math.max(0, Math.min(TABS.length - 1, rawPosition));
  }

  function handleNavPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const position = lensPositionFromPointer(event.clientX);
    const nearestTab = TABS[Math.round(position)].id;
    const drag = dragStartRef.current;
    if (drag?.pointerId === event.pointerId) {
      const crossedThreshold = Math.abs(event.clientX - drag.x) >= 6;
      if (crossedThreshold && !navDragging) {
        setNavDragging(true);
        suppressClickRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (crossedThreshold || navDragging) {
        setLensPosition(position);
        setPreviewTab(nearestTab);
      }
      return;
    }
    if (event.pointerType === 'mouse') {
      setLensPosition(position);
      setPreviewTab(nearestTab);
    }
  }

  function handleNavPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    dragStartRef.current = { pointerId: event.pointerId, x: event.clientX };
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleNavPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const wasDragging = navDragging || suppressClickRef.current;
    if (wasDragging) activateTab(TABS[Math.round(lensPositionFromPointer(event.clientX))].id);
    dragStartRef.current = null;
    setNavDragging(false);
    setLensPosition(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function resetNavPointer() {
    dragStartRef.current = null;
    setNavDragging(false);
    setPreviewTab(null);
    setLensPosition(null);
  }

  function handleNavKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? TABS.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    const nextTab = TABS[nextIndex].id;
    activateTab(nextTab);
    window.requestAnimationFrame(() => navRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${nextTab}"]`)?.focus());
  }

  function exportData() {
    const payload = JSON.stringify(
      { version: 1, exportedAt: new Date().toISOString(), tasks, habits, note, selectedTaskId, timerPreset, timerSeconds, weekMinutes, dark },
      null,
      2,
    );
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `nook-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast('Private backup exported.');
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const saved = JSON.parse(await file.text());
      if (!Array.isArray(saved.tasks) || !Array.isArray(saved.habits) || typeof saved.note !== 'string') {
        throw new Error('Invalid backup');
      }
      setTasks(saved.tasks);
      setHabits(saved.habits);
      setNote(saved.note);
      if (typeof saved.selectedTaskId === 'string') setSelectedTaskId(saved.selectedTaskId);
      if (typeof saved.timerPreset === 'number') setTimerPreset(saved.timerPreset);
      if (typeof saved.timerSeconds === 'number') setTimerSeconds(saved.timerSeconds);
      if (Array.isArray(saved.weekMinutes) && saved.weekMinutes.length === 7) setWeekMinutes(saved.weekMinutes);
      if (typeof saved.dark === 'boolean') setDark(saved.dark);
      setToast('Backup restored on this device.');
    } catch {
      setToast('That file is not a valid Nook backup.');
    } finally {
      event.target.value = '';
    }
  }

  const commands = [
    { label: 'Create a new task', icon: Plus, action: () => { activateTab('today'); setTaskModalOpen(true); } },
    { label: timerRunning ? 'Pause focus timer' : 'Start focus timer', icon: timerRunning ? Pause : Play, action: () => { activateTab('focus'); setTimerRunning((running) => !running); } },
    { label: dark ? 'Use light theme' : 'Use dark theme', icon: dark ? Sun : Moon, action: () => setDark((value) => !value) },
    { label: 'Open daily note', icon: NotePencil, action: () => activateTab('notes') },
    { label: 'Export private backup', icon: DownloadSimple, action: exportData },
  ];

  return (
    <main
      className={'nook-app ' + (dark ? 'is-dark ' : '') + (taskModalOpen || paletteOpen ? 'has-dialog ' : '') + 'min-h-screen p-3 text-[var(--ink)] sm:p-5'}
      style={appStyle}
    >
      <div className="nook-shell relative z-[1] mx-auto flex min-h-[calc(100vh-24px)] max-w-[1380px] flex-col overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--shell)] shadow-[0_24px_80px_rgba(37,39,32,0.08)] sm:min-h-[calc(100vh-40px)]">
        <header className="nook-header flex items-center gap-2 border-b border-[var(--line)] px-3 py-3 sm:gap-3 sm:px-7 sm:py-4">
          <button className="flex min-h-11 shrink-0 items-center gap-3 text-left" onClick={() => activateTab('home')} aria-label="Open Nook home">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#20231f] text-sm font-black text-[#dfff64] sm:h-10 sm:w-10">N</span>
            <span className="hidden text-lg font-semibold tracking-[-0.04em] sm:block">nook</span>
          </button>

          <div className="hidden min-w-0 items-center gap-3 text-sm md:flex">
            <span className="truncate text-[var(--muted)]">{dateLabel}</span>
            <span className="h-4 w-px bg-[var(--line)]" aria-hidden="true" />
            <span className="font-medium">{TABS.find((tab) => tab.id === activeTab)?.label}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] sm:flex sm:w-auto sm:gap-2 sm:px-3"
              aria-label="Open quick actions"
            >
              <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded-md bg-[var(--soft)] px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
            </button>
            <button
              onClick={() => setDark((value) => !value)}
              className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] bg-[var(--card)] sm:h-10 sm:w-10"
              aria-label={dark ? 'Use light theme' : 'Use dark theme'}
            >
              {dark ? <Sun size={20} weight="bold" aria-hidden="true" /> : <Moon size={20} weight="bold" aria-hidden="true" />}
            </button>
            <button
              onClick={() => { activateTab('today'); setTaskModalOpen(true); }}
              className="grid h-11 w-11 place-items-center rounded-full bg-[var(--ink)] text-sm font-medium text-[var(--reverse)] sm:flex sm:h-10 sm:w-auto sm:px-4"
              aria-label="Create a new task"
            >
              <Plus size={20} weight="bold" className="sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">New task</span>
            </button>
          </div>
        </header>

        <section className="nook-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-5 sm:px-7 sm:pt-7 lg:px-10">
          <div className="mx-auto w-full max-w-[1180px]">
            <section
              key={activeTab}
              id="nook-tab-panel"
              className="tab-stage"
              role="tabpanel"
              aria-labelledby={'nook-tab-' + activeTab}
              tabIndex={-1}
            >
              {activeTab === 'home' && (
                <div className="space-y-5">
                  <section className="home-hero nook-grid-pattern relative overflow-hidden rounded-[28px] bg-[#20231f] p-6 text-white sm:p-9 lg:min-h-[390px]">
                    <div className="home-hero-glow" aria-hidden="true" />
                    <div className="relative z-[1] flex h-full min-h-[300px] flex-col justify-between gap-10">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Home · {dateLabel}</p>
                        <h1 className="mt-4 max-w-3xl text-[clamp(2.7rem,7vw,5.7rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
                          {greeting}.
                          <span className="mt-2 block text-white/48">Make room for one good thing.</span>
                        </h1>
                      </div>

                      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
                        <div className="max-w-xl">
                          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-white/48">Next up</p>
                          <p className="mt-2 text-xl font-medium tracking-[-0.025em] sm:text-2xl">
                            {activeTask?.title ?? 'Your day is open.'}
                          </p>
                          <p className="mt-1 text-sm text-white/60">
                            {activeTask ? activeTask.category + ' · ' + activeTask.minutes + ' min' : 'Capture one clear action when you are ready.'}
                          </p>
                        </div>
                        <div className="home-actions flex w-full gap-2 sm:w-auto">
                          {activeTask ? (
                            <button
                              onClick={() => { setSelectedTaskId(activeTask.id); activateTab('focus'); }}
                              className="min-h-11 flex-1 rounded-full bg-[#dfff64] px-5 py-2.5 text-sm font-semibold text-[#20231f] sm:flex-none"
                            >
                              Start focus
                            </button>
                          ) : (
                            <button
                              onClick={() => { activateTab('today'); setTaskModalOpen(true); }}
                              className="min-h-11 flex-1 rounded-full bg-[#dfff64] px-5 py-2.5 text-sm font-semibold text-[#20231f] sm:flex-none"
                            >
                              Add a task
                            </button>
                          )}
                          <button onClick={() => activateTab('today')} className="min-h-11 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white/80 sm:flex-none">
                            View today
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <nav className="home-pulse grid overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--card)] sm:grid-cols-4" aria-label="Today at a glance">
                    {[
                      { label: 'Tasks left', value: remainingTasks, tab: 'today' as AppTab },
                      { label: 'Habits today', value: habitsToday + '/3', tab: 'habits' as AppTab },
                      { label: 'Focus this week', value: focusedTotal + 'm', tab: 'focus' as AppTab },
                      { label: 'Note words', value: noteWords, tab: 'notes' as AppTab },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => activateTab(item.tab)}
                        className="home-pulse-item flex items-center justify-between gap-4 px-5 py-4 text-left sm:block sm:py-5"
                      >
                        <span className="text-xs text-[var(--muted)]">{item.label}</span>
                        <strong className="font-mono text-xl font-medium tracking-[-0.04em] sm:mt-2 sm:block sm:text-2xl">{item.value}</strong>
                      </button>
                    ))}
                  </nav>
                </div>
              )}

              {activeTab === 'today' && (
                <div>
                  <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                      <p className="eyebrow">Today</p>
                      <h1 className="mt-2 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-[-0.055em]">Three things, no noise.</h1>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Choose what matters now. Everything stays on this device.</p>
                    </div>
                    <button onClick={() => setTaskModalOpen(true)} className="min-h-11 w-full rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--reverse)] sm:w-fit">New task</button>
                  </div>

                  <section className="rounded-[26px] border border-[var(--line)] bg-[var(--card)] p-5 sm:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium">Your list</p>
                      <span className="whitespace-nowrap rounded-full bg-[var(--soft)] px-3 py-1 text-xs text-[var(--muted)]">{remainingTasks} left</span>
                    </div>
                    <div className="mt-5 divide-y divide-[var(--line)]">
                      {tasks.length ? tasks.map((task) => (
                        <article key={task.id} className={'group flex items-center gap-3 py-4 first:pt-0 last:pb-0 ' + (activeTask?.id === task.id ? 'task-active' : '')}>
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="task-check grid h-11 w-11 shrink-0 place-items-center rounded-full"
                            aria-label={task.done ? 'Mark ' + task.title + ' incomplete' : 'Complete ' + task.title}
                          >
                            <span className={'grid h-7 w-7 place-items-center rounded-full border ' + (task.done ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--reverse)]' : 'border-[var(--strong-line)]')}>
                              {task.done && <Check size={15} weight="bold" aria-hidden="true" />}
                            </span>
                          </button>
                          <button onClick={() => setSelectedTaskId(task.id)} className="min-w-0 flex-1 text-left">
                            <h2 className={'truncate text-base font-medium ' + (task.done ? 'text-[var(--muted)] line-through' : '')}>{task.title}</h2>
                            <p className="mt-0.5 text-xs text-[var(--muted)]">{task.category} · {task.minutes} min</p>
                          </button>
                          {activeTask?.id === task.id && <span className="hidden rounded-full bg-[#dfff64] px-2.5 py-1 text-[10px] font-semibold text-[#20231f] sm:block">NEXT</span>}
                          <button onClick={() => deleteTask(task.id)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--muted)] opacity-70 transition hover:bg-[var(--soft)] hover:opacity-100" aria-label={'Delete ' + task.title}><X size={17} weight="bold" aria-hidden="true" /></button>
                        </article>
                      )) : (
                        <div className="py-16 text-center">
                          <p className="text-xl font-medium tracking-[-0.025em]">A quiet start.</p>
                          <p className="mt-2 text-sm text-[var(--muted)]">Add one clear action for today.</p>
                          <button onClick={() => setTaskModalOpen(true)} className="mt-5 min-h-11 rounded-full bg-[#dfff64] px-5 py-2.5 text-sm font-semibold text-[#20231f]">Add a task</button>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'habits' && (
                <div>
                  <div className="mb-6">
                    <p className="eyebrow">Habits</p>
                    <h1 className="mt-2 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-[-0.055em]">Keep the rhythm.</h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Small rituals, checked once today. No streak pressure.</p>
                  </div>

                  <section className="habit-world relative overflow-hidden rounded-[28px] bg-[#e7d9ff] p-5 text-[#20231f] sm:p-8">
                    <div className="habit-orbit" aria-hidden="true" />
                    <div className="relative z-[1] flex flex-col items-start justify-between gap-3 min-[380px]:flex-row min-[380px]:items-center">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#695f75]">This week</p>
                        <p className="mt-2 text-2xl font-semibold tracking-[-0.035em]">{habitsToday} of {habits.length} done today</p>
                      </div>
                      <span className="rounded-full bg-white/55 px-3 py-1 text-xs text-[#665c70]">Stored locally</span>
                    </div>
                    <div className="relative z-[1] mt-8 grid gap-3 sm:grid-cols-3">
                      {habits.map((habit) => (
                        <button
                          key={habit.id}
                          onClick={() => toggleHabit(habit.id)}
                          className="habit-tile flex min-h-[104px] items-center gap-4 rounded-[22px] bg-white/58 p-4 text-left transition hover:-translate-y-1 hover:bg-white/72 sm:block sm:min-h-[190px] sm:p-5"
                          aria-pressed={habit.checkedToday}
                        >
                          <div className={'grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold ' + (habit.checkedToday ? 'bg-[#dfff64] text-[#20231f]' : 'bg-[#20231f] text-white')}>
                            {habit.checkedToday ? <Check size={18} weight="bold" aria-hidden="true" /> : habit.mark}
                          </div>
                          <div>
                            <p className="text-xl font-semibold tracking-[-0.03em] sm:mt-8">{habit.label}</p>
                            <p className="mt-1 text-sm text-[#756a80]">{habit.count}/7 days</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'focus' && (
                <div>
                  <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow">Focus</p>
                      <h1 className="mt-2 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-[-0.055em]">One session at a time.</h1>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Deep Focus is the action. Focus Rhythm shows what it adds up to.</p>
                    </div>
                    {timerRunning && <span className="hidden rounded-full bg-[#dfff64] px-3 py-1 text-xs font-semibold text-[#20231f] sm:block">SESSION RUNNING</span>}
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                    <section className="focus-card nook-grid-pattern relative min-h-[350px] overflow-hidden rounded-[28px] bg-[#20231f] p-5 text-white sm:min-h-[420px] sm:p-8">
                      <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#dfff64]/15 blur-3xl" />
                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-white/55">Deep focus</p>
                          <div className="flex rounded-full bg-white/10 p-1 text-xs">
                            {[25, 50].map((minutes) => (
                              <button key={minutes} onClick={() => choosePreset(minutes)} className={'min-h-11 min-w-12 rounded-full px-3 py-1.5 ' + (timerPreset === minutes ? 'bg-white text-[#20231f]' : 'text-white/65')}>{minutes}m</button>
                            ))}
                          </div>
                        </div>
                        <p className="timer-digits mt-10 whitespace-nowrap font-mono text-[clamp(3rem,17vw,8.4rem)] leading-none tracking-[-0.06em] sm:text-[clamp(4.4rem,12vw,8.4rem)]" aria-live="off">{formatTimer(timerSeconds)}</p>
                        <label className="mt-5 block text-xs text-white/60" htmlFor="focus-task">Working on</label>
                        <select
                          id="focus-task"
                          value={activeTask?.id ?? ''}
                          onChange={(event) => setSelectedTaskId(event.target.value)}
                          className="mt-1 min-h-11 w-full max-w-md appearance-none truncate border-0 bg-transparent p-0 text-base text-white/82 outline-none"
                        >
                          {tasks.map((task) => <option key={task.id} value={task.id} className="text-black">{task.title}</option>)}
                          {!tasks.length && <option value="" className="text-black">A quiet focus session</option>}
                        </select>
                        <div className="mt-auto flex items-center gap-2 pt-10">
                          <button onClick={() => setTimerRunning((running) => !running)} className="min-h-11 flex-1 rounded-full bg-[#dfff64] px-6 py-3 text-sm font-semibold text-[#20231f] sm:flex-none">{timerRunning ? 'Pause' : 'Start focus'}</button>
                          <button onClick={resetTimer} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white/75" aria-label="Reset timer"><ArrowCounterClockwise size={20} weight="bold" aria-hidden="true" /></button>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--card-2)] p-6 sm:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="eyebrow">Focus rhythm</p>
                          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">A steady week.</h2>
                        </div>
                        <p className="text-sm font-medium text-[var(--muted)]">{focusedTotal ? focusedTotal + ' min' : 'No sessions yet'}</p>
                      </div>
                      <div className="mt-10 flex h-[210px] items-end gap-3" aria-label="Weekly focus minutes chart">
                        {weekMinutes.map((minutes, index) => (
                          <div key={index} className="flex flex-1 flex-col items-center gap-3" title={minutes + ' minutes'}>
                            <span
                              className={'w-full max-w-11 rounded-t-xl ' + (index === (new Date().getDay() + 6) % 7 ? 'bg-[var(--ink)]' : 'bg-[var(--bar)]')}
                              style={{ height: Math.max(18, (minutes / chartMax) * 165) + 'px' }}
                            />
                            <span className="text-[10px] text-[var(--muted)]">{DAY_LABELS[index]}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-6 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--muted)]">Completed sessions appear here automatically. Nothing is sent away from this device.</p>
                    </section>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <div className="mb-6">
                    <p className="eyebrow">Daily note</p>
                    <h1 className="mt-2 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-[-0.055em]">Leave a breadcrumb.</h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">A plain Markdown page for what should survive the day.</p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-5 sm:p-7">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-[var(--soft)] px-3 py-1 font-mono text-[10px] text-[var(--muted)]">TODAY.md</span>
                        <span className="text-xs text-[var(--muted)]">{noteWords} words</span>
                      </div>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        className="note-editor mt-5 min-h-[390px] w-full resize-y rounded-[18px] border border-[var(--line)] bg-[var(--soft)] p-4 font-mono text-base leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--strong-line)] sm:p-5 sm:text-sm"
                        aria-label="Daily note in Markdown"
                        spellCheck
                      />
                      <p className="mt-3 text-xs text-[var(--muted)]">Saved locally as you type</p>
                    </section>

                    <aside className="h-fit rounded-[26px] bg-[#20231f] p-6 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-white/50">Your data</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Private by default.</h2>
                      <p className="mt-3 text-sm leading-6 text-white/62">No account, cloud, analytics, or tracking. Export a JSON backup whenever you want one.</p>
                      <div className="mt-7 grid gap-2">
                        <button onClick={exportData} className="min-h-11 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#20231f]">Export backup</button>
                        <button onClick={() => importRef.current?.click()} className="min-h-11 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white/80">Import backup</button>
                      </div>
                    </aside>
                  </div>
                </div>
              )}
            </section>

            <footer className="flex items-center justify-between gap-4 py-5 text-[10px] text-[var(--muted)] sm:py-6">
              <p>No account. No cloud. No tracking.</p>
              <button onClick={() => setPaletteOpen(true)} className="min-h-11 shrink-0 px-2 text-xs hover:text-[var(--ink)]">
                <span className="sm:hidden">Quick actions</span>
                <span className="hidden sm:inline">Ctrl K · Commands</span>
              </button>
            </footer>
          </div>
        </section>
      </div>

      <nav
        ref={navRef}
        className={'liquid-nav fixed left-1/2 z-40 grid grid-cols-5 ' + (navDragging ? 'is-dragging' : '')}
        aria-label="Nook sections"
        role="tablist"
        onPointerMove={handleNavPointerMove}
        onPointerDown={handleNavPointerDown}
        onPointerUp={handleNavPointerUp}
        onPointerCancel={resetNavPointer}
        onLostPointerCapture={resetNavPointer}
        onPointerLeave={() => {
          if (!dragStartRef.current) {
            setPreviewTab(null);
            setLensPosition(null);
          }
        }}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = false;
        }}
        onKeyDown={handleNavKeyDown}
      >
        <span className="liquid-lens" aria-hidden="true"><span /></span>
        {TABS.map((tab, index) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              id={'nook-tab-' + tab.id}
              data-tab={tab.id}
              className={'liquid-tab ' + (tab.id === activeTab ? 'is-active' : '') + (tab.id === 'home' ? ' is-home' : '')}
              type="button"
              role="tab"
              aria-selected={tab.id === activeTab}
              aria-controls="nook-tab-panel"
              tabIndex={tab.id === activeTab ? 0 : -1}
              onClick={() => activateTab(tab.id)}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'mouse') return;
                setPreviewTab(tab.id);
                setLensPosition(index);
              }}
              onFocus={() => {
                setPreviewTab(tab.id);
                setLensPosition(index);
              }}
              onBlur={() => {
                if (dragStartRef.current) return;
                setPreviewTab(null);
                setLensPosition(null);
              }}
            >
              <span className="dock-icon" aria-hidden="true">
                <TabIcon size={22} weight="bold" />
              </span>
              <span className="dock-label">{tab.label}</span>
              {tab.id === 'focus' && timerRunning && <span className="focus-live-dot" aria-label="Focus timer is running" />}
            </button>
          );
        })}
      </nav>

      <input ref={importRef} type="file" accept="application/json" onChange={importData} className="hidden" aria-hidden="true" />

      {taskModalOpen && (
        <div className="modal-backdrop mobile-sheet-backdrop fixed inset-0 z-50 flex items-end justify-center sm:grid sm:place-items-center sm:p-4" onPointerDown={() => setTaskModalOpen(false)}>
          <form onSubmit={addTask} onPointerDown={(event) => event.stopPropagation()} className="mobile-sheet w-full max-w-md rounded-t-[28px] border border-[var(--line)] bg-[var(--card)] p-5 text-[var(--ink)] shadow-2xl sm:rounded-[24px] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="new-task-title">
            <span className="sheet-handle sm:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Capture</p>
                <h2 id="new-task-title" className="mt-1 text-2xl font-semibold tracking-[-0.04em]">What needs doing?</h2>
              </div>
              <button type="button" onClick={() => setTaskModalOpen(false)} className="grid h-11 w-11 place-items-center rounded-full bg-[var(--soft)]" aria-label="Close new task"><X size={18} weight="bold" aria-hidden="true" /></button>
            </div>
            <label className="mt-6 block text-xs font-medium text-[var(--muted)]" htmlFor="task-title">Task</label>
            <input id="task-title" autoFocus value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Write the next clear action" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-3 text-base outline-none focus:border-[var(--strong-line)] sm:text-sm" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-[var(--muted)]">Category
                <select value={taskCategory} onChange={(event) => setTaskCategory(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-3 text-base text-[var(--ink)] outline-none sm:text-sm">
                  {['Work', 'Design', 'Personal', 'Learning'].map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium text-[var(--muted)]">Estimate
                <select value={taskMinutes} onChange={(event) => setTaskMinutes(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-3 text-base text-[var(--ink)] outline-none sm:text-sm">
                  {[10, 20, 25, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
                </select>
              </label>
            </div>
            <button type="submit" className="mt-6 min-h-12 w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-[var(--reverse)]">Add to today</button>
          </form>
        </div>
      )}

      {paletteOpen && (
        <div className="modal-backdrop mobile-sheet-backdrop fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:p-4 sm:pt-[12vh]" onPointerDown={() => setPaletteOpen(false)}>
          <div onPointerDown={(event) => event.stopPropagation()} className="mobile-sheet h-fit w-full max-w-lg overflow-hidden rounded-t-[28px] border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] shadow-2xl sm:rounded-[22px]" role="dialog" aria-modal="true" aria-label="Quick actions">
            <span className="sheet-handle sm:hidden" aria-hidden="true" />
            <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
              <MagnifyingGlass size={20} weight="bold" className="text-[var(--muted)]" aria-hidden="true" />
              <p className="text-sm font-medium">Quick actions</p>
              <kbd className="ml-auto hidden rounded-md bg-[var(--soft)] px-2 py-1 text-[10px] text-[var(--muted)] sm:inline">ESC</kbd>
              <button type="button" onClick={() => setPaletteOpen(false)} className="ml-auto grid h-11 w-11 place-items-center rounded-full bg-[var(--soft)] sm:hidden" aria-label="Close quick actions"><X size={18} weight="bold" aria-hidden="true" /></button>
            </div>
            <div className="p-2">
              {commands.map((command, index) => {
                const CommandIcon = command.icon;
                return (
                  <button
                    data-command-first={index === 0 ? 'true' : undefined}
                    key={command.label}
                    onClick={() => { setPaletteOpen(false); command.action(); }}
                    className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-[var(--soft)]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--soft)] text-[var(--muted)]"><CommandIcon size={18} weight="bold" aria-hidden="true" /></span>
                    <span>{command.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {toast && <div role="status" className="mobile-toast fixed bottom-28 right-5 z-[60] max-w-sm rounded-full bg-[#20231f] px-4 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
    </main>
  );
}
