'use client';

import { Archive } from '@phosphor-icons/react/Archive';
import { ArrowCounterClockwise } from '@phosphor-icons/react/ArrowCounterClockwise';
import { ArrowRight } from '@phosphor-icons/react/ArrowRight';
import { CalendarBlank } from '@phosphor-icons/react/CalendarBlank';
import { Check } from '@phosphor-icons/react/Check';
import { Circle } from '@phosphor-icons/react/Circle';
import { Clock } from '@phosphor-icons/react/Clock';
import { Compass } from '@phosphor-icons/react/Compass';
import { Gauge } from '@phosphor-icons/react/Gauge';
import { Leaf } from '@phosphor-icons/react/Leaf';
import { MagnifyingGlass } from '@phosphor-icons/react/MagnifyingGlass';
import { Minus } from '@phosphor-icons/react/Minus';
import { NotePencil } from '@phosphor-icons/react/NotePencil';
import { Pause } from '@phosphor-icons/react/Pause';
import { Play } from '@phosphor-icons/react/Play';
import { Plus } from '@phosphor-icons/react/Plus';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { Timer } from '@phosphor-icons/react/Timer';
import { Trash } from '@phosphor-icons/react/Trash';
import type { FormEvent, ReactNode } from 'react';
import { useId, useMemo, useState } from 'react';
import { NOOK_INPUT_LIMITS } from '../lib/nook-state';
import type {
  DailyRecord,
  FocusSession,
  FocusTimer,
  Habit,
  HabitLog,
  NoteEntry,
  Tab,
  Task,
  TaskLane,
} from '../lib/nook-state';

const TASK_LANES: ReadonlyArray<{
  id: TaskLane;
  label: string;
  description: string;
}> = [
  { id: 'anchor' as TaskLane, label: 'Anchor', description: 'The work that would make today count.' },
  { id: 'support' as TaskLane, label: 'Support', description: 'Useful work that keeps the day moving.' },
  { id: 'optional' as TaskLane, label: 'Optional', description: 'Good to do only if there is room.' },
];

const FOCUS_PRESETS = [15, 25, 50, 90] as const;
const COMPASS_MINIMUM_DAYS = 3;

const NOTE_TEMPLATES = [
  { id: 'morning-plan', label: 'Morning plan', description: 'Name the anchor, the support, and what can wait.' },
  { id: 'close-day', label: 'Close the day', description: 'Record what moved, what did not, and what to release.' },
  { id: 'weekly-reflection', label: 'Weekly reflection', description: 'Review the week using only what was recorded.' },
] as const;

export type NoteTemplateId = (typeof NOTE_TEMPLATES)[number]['id'];

export interface NewTaskInput {
  title: string;
  category: string;
  minutes: number;
  lane: TaskLane;
}

export interface NewHabitInput {
  label: string;
  minimum: string;
}

export interface PremiumPreviewProps {
  children: ReactNode;
  className?: string;
  description?: string;
  title?: string;
}

export interface HomeViewProps {
  dailyRecords: readonly DailyRecord[];
  dayKey: string;
  focusSessions: readonly FocusSession[];
  habitLogs: readonly HabitLog[];
  habits: readonly Habit[];
  notes: readonly NoteEntry[];
  onCloseDay: () => void;
  onFocusTask?: (taskId: string) => void;
  onNavigate: (tab: Tab) => void;
  onOpenMorningPlan: () => void;
  tasks: readonly Task[];
}

export interface TodayViewProps {
  dailyRecord?: DailyRecord;
  dayKey: string;
  onAddTask: (task: NewTaskInput) => void;
  onChangeTaskLane: (taskId: string, lane: TaskLane) => void;
  onDeleteTask: (taskId: string) => void;
  onFocusTask?: (taskId: string) => void;
  onSetCapacity: (minutes: number) => void;
  onToggleTask: (taskId: string) => void;
  tasks: readonly Task[];
}

export interface HabitsViewProps {
  dayKey: string;
  habitLogs: readonly HabitLog[];
  habits: readonly Habit[];
  onAddHabit: (habit: NewHabitInput) => void;
  onToggleToday: (habitId: string, nextValue: number) => void;
}

export interface FocusViewProps {
  dayKey: string;
  onAddDistraction: (distraction: string) => void;
  onChangeIntention: (intention: string) => void;
  onChangeSessionNote: (note: string) => void;
  onRemoveDistraction?: (index: number) => void;
  onResetTimer: () => void;
  onSetPreset: (minutes: number) => void;
  onToggleTimer: () => void;
  sessions: readonly FocusSession[];
  timer: FocusTimer;
}

export interface NotesViewProps {
  notes: readonly NoteEntry[];
  onApplyTemplate: (dayKey: string, templateId: NoteTemplateId) => void;
  onChangeContent: (dayKey: string, content: string) => void;
  onSelectDay: (dayKey: string) => void;
  selectedDayKey: string;
}

type DayArcState = 'complete' | 'current' | 'waiting';

function parseDayKey(dayKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function toDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function lastSevenDayKeys(dayKey: string) {
  const end = parseDayKey(dayKey);
  if (!end) return [dayKey];

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (6 - index));
    return toDayKey(date);
  });
}

function formatDay(dayKey: string, options: Intl.DateTimeFormatOptions) {
  const date = parseDayKey(dayKey);
  if (!date) return dayKey;
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

function formatLongDay(dayKey: string) {
  return formatDay(dayKey, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatArchiveDay(dayKey: string) {
  return formatDay(dayKey, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatWeekday(dayKey: string) {
  return formatDay(dayKey, { weekday: 'short' }).slice(0, 2);
}

function formatTimer(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const seconds = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function minutesLabel(minutes: number) {
  const rounded = Math.max(0, Math.round(minutes));
  return `${rounded} min`;
}

function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function hasNoteContent(note?: NoteEntry) {
  return Boolean(note && meaningfulMarkdown(note.content));
}

function logValueFor(habitLogs: readonly HabitLog[], habitId: string, dayKey: string) {
  return habitLogs.reduce((value, log) => (
    log.habitId === habitId && log.dayKey === dayKey ? Math.max(value, log.value) : value
  ), 0);
}

type HabitRhythmState = 'checked' | 'not-checked' | 'unknown';

function habitRhythmState(
  habit: Habit,
  habitLogs: readonly HabitLog[],
  dayKey: string,
): HabitRhythmState {
  const log = habitLogs.find((entry) => entry.habitId === habit.id && entry.dayKey === dayKey);
  if (log) return log.value > 0 ? 'checked' : 'not-checked';
  if (!habit.createdAt) return 'unknown';

  const createdAt = new Date(habit.createdAt);
  if (!Number.isFinite(createdAt.getTime())) return 'unknown';
  return toDayKey(createdAt) > dayKey ? 'unknown' : 'not-checked';
}

function meaningfulMarkdown(value: string) {
  if (/^#{1,6}\s+today\s*$/i.test(value.trim())) return '';
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`>\[\]()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function taskLaneLabel(lane: TaskLane) {
  return TASK_LANES.find((item) => item.id === lane)?.label ?? 'Task lane';
}

export function PremiumPreview({ children, className = '', description, title }: PremiumPreviewProps) {
  return (
    <section
      className={`v2-premium-preview ${className}`.trim()}
      aria-label={title ? `${title}, premium preview` : 'Premium preview'}
    >
      <div className="v2-premium-preview__header">
        <span className="v2-premium-preview__badge">
          <Sparkle size={15} weight="bold" aria-hidden="true" />
          Premium preview · local
        </span>
        {title && <h2 className="v2-premium-preview__title">{title}</h2>}
        {description && <p className="v2-premium-preview__description">{description}</p>}
      </div>
      <div className="v2-premium-preview__content">{children}</div>
    </section>
  );
}

export function HomeView({
  dailyRecords,
  dayKey,
  focusSessions,
  habitLogs,
  habits,
  notes,
  onCloseDay,
  onFocusTask,
  onNavigate,
  onOpenMorningPlan,
  tasks,
}: HomeViewProps) {
  const todayTasks = tasks.filter((task) => task.dayKey === dayKey);
  const pendingTasks = todayTasks.filter((task) => !task.done);
  const pendingAnchor = pendingTasks.find((task) => task.lane === ('anchor' as TaskLane));
  const todayRecord = dailyRecords.find((record) => record.dayKey === dayKey);
  const todayNote = notes.find((note) => note.dayKey === dayKey);
  const activeHabits = habits.filter((habit) => !habit.archivedAt);
  const todayFocusMinutes = focusSessions
    .filter((session) => session.dayKey === dayKey)
    .reduce((total, session) => total + Math.max(0, session.actualMinutes), 0);
  const habitsCheckedToday = activeHabits.filter((habit) => logValueFor(habitLogs, habit.id, dayKey) > 0).length;
  const hasMorningPlan = Boolean(todayRecord?.openedAt) || todayTasks.length > 0;
  const hasReflection = Boolean(todayRecord?.closedAt) || hasNoteContent(todayNote);

  const arcFacts = [
    {
      id: 'plan',
      label: 'Shape',
      complete: hasMorningPlan,
      detail: todayTasks.length ? `${todayTasks.length} ${todayTasks.length === 1 ? 'task' : 'tasks'} placed` : 'No plan recorded',
    },
    {
      id: 'focus',
      label: 'Focus',
      complete: todayFocusMinutes > 0,
      detail: todayFocusMinutes > 0 ? `${minutesLabel(todayFocusMinutes)} recorded` : 'No session recorded',
    },
    {
      id: 'tend',
      label: 'Tend',
      complete: habitsCheckedToday > 0,
      detail: activeHabits.length ? `${habitsCheckedToday} of ${activeHabits.length} habits checked` : 'No habits added',
    },
    {
      id: 'close',
      label: 'Close',
      complete: hasReflection,
      detail: todayRecord?.closedAt ? 'Day closed' : hasNoteContent(todayNote) ? 'A note is waiting' : 'No closing note yet',
    },
  ];
  const firstOpenStage = arcFacts.findIndex((stage) => !stage.complete);
  const arcStages = arcFacts.map((stage, index) => ({
    ...stage,
    state: (stage.complete ? 'complete' : index === firstOpenStage ? 'current' : 'waiting') as DayArcState,
  }));

  let quietMoveTitle = 'The day is ready to close.';
  let quietMoveDetail = 'Leave one honest line while the shape of the day is still clear.';
  let quietMoveAction = 'Close the day';
  let handleQuietMove = onCloseDay;

  if (todayRecord?.closedAt) {
    quietMoveTitle = 'The day is closed.';
    quietMoveDetail = 'Nothing else needs to be optimized. Your note remains available when you want it.';
    quietMoveAction = 'Open today’s note';
    handleQuietMove = () => onNavigate('notes' as Tab);
  } else if (!hasMorningPlan) {
    quietMoveTitle = 'Give the day a believable shape.';
    quietMoveDetail = 'Set a capacity and choose one anchor before adding more.';
    quietMoveAction = 'Morning plan';
    handleQuietMove = onOpenMorningPlan;
  } else if (pendingAnchor) {
    quietMoveTitle = pendingAnchor.title;
    quietMoveDetail = `${pendingAnchor.category} · ${minutesLabel(pendingAnchor.minutes)} · today’s anchor`;
    quietMoveAction = 'Focus this anchor';
    handleQuietMove = () => {
      if (onFocusTask) onFocusTask(pendingAnchor.id);
      else onNavigate('focus' as Tab);
    };
  } else if (pendingTasks.length) {
    quietMoveTitle = 'Choose the next useful task.';
    quietMoveDetail = `${pendingTasks.length} ${pendingTasks.length === 1 ? 'task remains' : 'tasks remain'}, with no unfinished anchor.`;
    quietMoveAction = 'Review today';
    handleQuietMove = () => onNavigate('today' as Tab);
  } else if (habitsCheckedToday < activeHabits.length) {
    quietMoveTitle = 'Tend one small thing.';
    quietMoveDetail = 'The task list is clear. A minimum version is enough.';
    quietMoveAction = 'Open habits';
    handleQuietMove = () => onNavigate('habits' as Tab);
  } else if (!hasNoteContent(todayNote)) {
    quietMoveTitle = 'Leave a breadcrumb.';
    quietMoveDetail = 'One line is enough to make the day easier to remember.';
    quietMoveAction = 'Open today’s note';
    handleQuietMove = () => onNavigate('notes' as Tab);
  }

  const weekKeys = lastSevenDayKeys(dayKey);
  const weekKeySet = new Set(weekKeys);
  const observedDays = new Set<string>();
  tasks.forEach((task) => weekKeySet.has(task.dayKey) && observedDays.add(task.dayKey));
  dailyRecords.forEach((record) => {
    const hasRecordedState = Boolean(
      record.openedAt
      || record.closedAt
      || record.closingNote.trim()
      || record.energy
      || record.closingEnergy,
    );
    if (weekKeySet.has(record.dayKey) && hasRecordedState) observedDays.add(record.dayKey);
  });
  focusSessions.forEach((session) => weekKeySet.has(session.dayKey) && observedDays.add(session.dayKey));
  habitLogs.forEach((log) => weekKeySet.has(log.dayKey) && log.value > 0 && observedDays.add(log.dayKey));
  notes.forEach((note) => weekKeySet.has(note.dayKey) && meaningfulMarkdown(note.content) && observedDays.add(note.dayKey));

  const weeklyCompletedTasks = tasks.filter((task) => weekKeySet.has(task.dayKey) && task.done).length;
  const weeklyFocusMinutes = focusSessions
    .filter((session) => weekKeySet.has(session.dayKey))
    .reduce((total, session) => total + Math.max(0, session.actualMinutes), 0);
  const weeklyHabitChecks = habitLogs.filter((log) => weekKeySet.has(log.dayKey) && log.value > 0).length;
  const weeklyNoteDays = new Set(
    notes.filter((note) => weekKeySet.has(note.dayKey) && meaningfulMarkdown(note.content)).map((note) => note.dayKey),
  ).size;
  const daysStillNeeded = Math.max(0, COMPASS_MINIMUM_DAYS - observedDays.size);

  return (
    <div className="v2-view v2-home-view">
      <header className="v2-view-header v2-home-view__header">
        <div className="v2-view-header__copy">
          <p className="v2-view-header__date">{formatLongDay(dayKey)}</p>
          <h1 className="v2-view-header__title">A day with room to breathe.</h1>
          <p className="v2-view-header__description">See what is true, then make one quiet move.</p>
        </div>
        <div className="v2-home-view__ritual-actions" aria-label="Daily rituals">
          <button type="button" className="v2-button v2-button--secondary" onClick={onOpenMorningPlan}>
            <CalendarBlank size={18} weight="bold" aria-hidden="true" />
            {todayRecord?.openedAt ? 'Review morning plan' : 'Morning plan'}
          </button>
          <button
            type="button"
            className="v2-button v2-button--primary"
            onClick={onCloseDay}
            disabled={Boolean(todayRecord?.closedAt)}
          >
            <Check size={18} weight="bold" aria-hidden="true" />
            {todayRecord?.closedAt ? 'Day closed' : 'Close day'}
          </button>
        </div>
      </header>

      <div className="v2-home-view__primary-grid">
        <section className="v2-day-arc" aria-labelledby="v2-day-arc-title">
          <div className="v2-section-heading">
            <div>
              <h2 id="v2-day-arc-title" className="v2-section-heading__title">Day Arc</h2>
              <p className="v2-section-heading__description">A factual trace of today, not a score.</p>
            </div>
            <span className="v2-measure">{arcFacts.filter((stage) => stage.complete).length} of 4</span>
          </div>
          <progress
            className="v2-day-arc__progress"
            max={arcFacts.length}
            value={arcFacts.filter((stage) => stage.complete).length}
            aria-label="Completed stages in today’s arc"
          />
          <ol className="v2-day-arc__steps">
            {arcStages.map((stage) => (
              <li
                key={stage.id}
                className="v2-day-arc__step"
                data-state={stage.state}
                aria-current={stage.state === 'current' ? 'step' : undefined}
              >
                <span className="v2-day-arc__marker" aria-hidden="true">
                  {stage.complete ? <Check size={15} weight="bold" /> : <Circle size={12} weight="bold" />}
                </span>
                <span className="v2-day-arc__step-copy">
                  <strong>{stage.label}</strong>
                  <span>{stage.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="v2-quiet-move" aria-labelledby="v2-quiet-move-title">
          <div className="v2-quiet-move__icon" aria-hidden="true">
            <ArrowRight size={22} weight="bold" />
          </div>
          <p className="v2-quiet-move__label">Next quiet move</p>
          <h2 id="v2-quiet-move-title" className="v2-quiet-move__title">{quietMoveTitle}</h2>
          <p className="v2-quiet-move__description">{quietMoveDetail}</p>
          <button type="button" className="v2-button v2-button--focus" onClick={handleQuietMove}>
            {quietMoveAction}
            <ArrowRight size={17} weight="bold" aria-hidden="true" />
          </button>
        </section>
      </div>

      <PremiumPreview
        className="v2-weekly-compass"
        title="Weekly Compass"
        description="A seven-day view assembled only from records on this device."
      >
        {daysStillNeeded > 0 ? (
          <div className="v2-weekly-compass__waiting" role="status">
            <Compass size={25} weight="bold" aria-hidden="true" />
            <div>
              <p className="v2-weekly-compass__waiting-title">
                Add {daysStillNeeded} more {daysStillNeeded === 1 ? 'day' : 'days'} to reveal a weekly pattern.
              </p>
              <p className="v2-weekly-compass__waiting-copy">
                {observedDays.size} of {COMPASS_MINIMUM_DAYS} recorded days available. Nook will not infer a pattern early.
              </p>
            </div>
          </div>
        ) : (
          <div className="v2-weekly-compass__facts">
            <p className="v2-weekly-compass__summary">
              {observedDays.size} active days are represented in this seven-day window.
            </p>
            <dl className="v2-weekly-compass__measures">
              <div>
                <dt>Tasks completed</dt>
                <dd>{weeklyCompletedTasks}</dd>
              </div>
              <div>
                <dt>Focus recorded</dt>
                <dd>{minutesLabel(weeklyFocusMinutes)}</dd>
              </div>
              <div>
                <dt>Habit check-ins</dt>
                <dd>{weeklyHabitChecks}</dd>
              </div>
              <div>
                <dt>Note days</dt>
                <dd>{weeklyNoteDays}</dd>
              </div>
            </dl>
          </div>
        )}
      </PremiumPreview>
    </div>
  );
}

export function TodayView({
  dailyRecord,
  dayKey,
  onAddTask,
  onChangeTaskLane,
  onDeleteTask,
  onFocusTask,
  onSetCapacity,
  onToggleTask,
  tasks,
}: TodayViewProps) {
  const titleId = useId();
  const categoryId = useId();
  const minutesId = useId();
  const laneId = useId();
  const capacityId = useId();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Personal');
  const [taskMinutes, setTaskMinutes] = useState(25);
  const [taskLane, setTaskLane] = useState<TaskLane>('anchor' as TaskLane);

  const todayTasks = tasks.filter((task) => task.dayKey === dayKey);
  const plannedMinutes = todayTasks.reduce((total, task) => total + Math.max(0, task.minutes), 0);
  const completedMinutes = todayTasks
    .filter((task) => task.done)
    .reduce((total, task) => total + Math.max(0, task.minutes), 0);
  const capacityMinutes = Math.max(0, dailyRecord?.capacityMinutes ?? 0);
  const overCapacityBy = capacityMinutes ? Math.max(0, plannedMinutes - capacityMinutes) : 0;

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;

    onAddTask({
      title,
      category: taskCategory.trim() || 'Personal',
      minutes: Math.max(5, Math.round(taskMinutes)),
      lane: taskLane,
    });
    setTaskTitle('');
    setTaskMinutes(25);
  }

  return (
    <div className="v2-view v2-today-view">
      <header className="v2-view-header">
        <div className="v2-view-header__copy">
          <p className="v2-view-header__date">{formatLongDay(dayKey)}</p>
          <h1 className="v2-view-header__title">Make the day believable.</h1>
          <p className="v2-view-header__description">One anchor, useful support, and optional work only if there is room.</p>
        </div>
      </header>

      <section className="v2-capacity" aria-labelledby="v2-capacity-title">
        <div className="v2-capacity__copy">
          <Gauge size={24} weight="bold" aria-hidden="true" />
          <div>
            <h2 id="v2-capacity-title" className="v2-capacity__title">Daily capacity</h2>
            <p className="v2-capacity__status" role="status">
              {!capacityMinutes && 'Set a capacity to keep the plan honest.'}
              {capacityMinutes > 0 && overCapacityBy === 0 && `${minutesLabel(plannedMinutes)} planned inside ${minutesLabel(capacityMinutes)}.`}
              {overCapacityBy > 0 && `${minutesLabel(overCapacityBy)} over the capacity you set.`}
            </p>
          </div>
        </div>
        <div className="v2-capacity__control">
          <label htmlFor={capacityId}>Available minutes</label>
          <input
            id={capacityId}
            className="v2-field v2-capacity__input"
            type="number"
            min={0}
            max={1440}
            step={15}
            inputMode="numeric"
            value={capacityMinutes}
            onChange={(event) => onSetCapacity(Math.max(0, Number(event.target.value) || 0))}
          />
        </div>
        <progress
          className="v2-capacity__progress"
          max={Math.max(capacityMinutes, plannedMinutes, 1)}
          value={Math.min(plannedMinutes, Math.max(capacityMinutes, plannedMinutes, 1))}
          aria-label={`${minutesLabel(plannedMinutes)} planned, ${minutesLabel(capacityMinutes)} available`}
        />
        <p className="v2-capacity__completed">{minutesLabel(completedMinutes)} completed today</p>
      </section>

      <form className="v2-quick-capture" onSubmit={submitTask} aria-labelledby="v2-quick-capture-title">
        <div className="v2-quick-capture__heading">
          <Plus size={20} weight="bold" aria-hidden="true" />
          <h2 id="v2-quick-capture-title">Quick capture</h2>
        </div>
        <div className="v2-quick-capture__fields">
          <div className="v2-field-group v2-field-group--wide">
            <label htmlFor={titleId}>Task</label>
            <input
              id={titleId}
              className="v2-field"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              maxLength={NOOK_INPUT_LIMITS.taskTitle}
              placeholder="What needs a place today?"
              autoComplete="off"
            />
          </div>
          <div className="v2-field-group">
            <label htmlFor={categoryId}>Category</label>
            <input
              id={categoryId}
              className="v2-field"
              value={taskCategory}
              onChange={(event) => setTaskCategory(event.target.value)}
              maxLength={NOOK_INPUT_LIMITS.taskCategory}
              placeholder="Personal"
              autoComplete="off"
            />
          </div>
          <div className="v2-field-group">
            <label htmlFor={minutesId}>Minutes</label>
            <input
              id={minutesId}
              className="v2-field"
              type="number"
              min={5}
              max={720}
              step={5}
              inputMode="numeric"
              value={taskMinutes}
              onChange={(event) => setTaskMinutes(Number(event.target.value) || 5)}
            />
          </div>
          <div className="v2-field-group">
            <label htmlFor={laneId}>Lane</label>
            <select
              id={laneId}
              className="v2-field"
              value={taskLane}
              onChange={(event) => setTaskLane(event.target.value as TaskLane)}
            >
              {TASK_LANES.map((lane) => <option key={lane.id} value={lane.id}>{lane.label}</option>)}
            </select>
          </div>
          <button type="submit" className="v2-button v2-button--primary" disabled={!taskTitle.trim()}>
            Add to today
          </button>
        </div>
      </form>

      <div className="v2-task-lanes">
        {TASK_LANES.map((lane) => {
          const laneTasks = todayTasks.filter((task) => task.lane === lane.id);
          const unfinishedCount = laneTasks.filter((task) => !task.done).length;

          return (
            <section key={lane.id} className="v2-task-lane" data-lane={lane.id} aria-labelledby={`v2-lane-${lane.id}`}>
              <div className="v2-task-lane__heading">
                <div>
                  <h2 id={`v2-lane-${lane.id}`}>{lane.label}</h2>
                  <p>{lane.description}</p>
                </div>
                <span className="v2-measure">{unfinishedCount} open</span>
              </div>

              {laneTasks.length ? (
                <ul className="v2-task-list">
                  {laneTasks.map((task) => (
                    <li key={task.id} className="v2-task-row" data-complete={task.done ? 'true' : 'false'}>
                      <button
                        type="button"
                        className="v2-icon-button v2-task-row__toggle"
                        onClick={() => onToggleTask(task.id)}
                        aria-label={task.done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                        aria-pressed={task.done}
                      >
                        {task.done
                          ? <Check size={17} weight="bold" aria-hidden="true" />
                          : <Circle size={17} weight="bold" aria-hidden="true" />}
                      </button>
                      <div className="v2-task-row__body">
                        <p className="v2-task-row__title">{task.title}</p>
                        <p className="v2-task-row__meta">
                          {task.category} · {minutesLabel(task.minutes)}
                          {task.checklist.length > 0 && ` · ${task.checklist.length} checklist ${task.checklist.length === 1 ? 'item' : 'items'}`}
                        </p>
                      </div>
                      <label className="v2-task-row__lane-control">
                        <span className="v2-visually-hidden">Move {task.title} to another lane</span>
                        <select
                          className="v2-field v2-field--compact"
                          value={task.lane}
                          onChange={(event) => onChangeTaskLane(task.id, event.target.value as TaskLane)}
                          aria-label={`Lane for ${task.title}: ${taskLaneLabel(task.lane)}`}
                        >
                          {TASK_LANES.map((option) => (
                            <option key={option.id} value={option.id}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      {onFocusTask && !task.done && (
                        <button
                          type="button"
                          className="v2-icon-button"
                          onClick={() => onFocusTask(task.id)}
                          aria-label={`Focus on ${task.title}`}
                        >
                          <Play size={17} weight="bold" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="v2-icon-button v2-icon-button--danger"
                        onClick={() => onDeleteTask(task.id)}
                        aria-label={`Delete ${task.title}`}
                      >
                        <Trash size={17} weight="bold" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="v2-empty-state">Nothing placed here today.</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function HabitsView({
  dayKey,
  habitLogs,
  habits,
  onAddHabit,
  onToggleToday,
}: HabitsViewProps) {
  const habitNameId = useId();
  const minimumId = useId();
  const [habitName, setHabitName] = useState('');
  const [minimum, setMinimum] = useState('');
  const rhythmDays = lastSevenDayKeys(dayKey);
  const activeHabits = habits.filter((habit) => !habit.archivedAt);
  const checkedToday = activeHabits.filter((habit) => logValueFor(habitLogs, habit.id, dayKey) > 0).length;

  function submitHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = habitName.trim();
    const minimumVersion = minimum.trim();
    if (!label || !minimumVersion) return;
    onAddHabit({ label, minimum: minimumVersion });
    setHabitName('');
    setMinimum('');
  }

  return (
    <div className="v2-view v2-habits-view">
      <header className="v2-view-header">
        <div className="v2-view-header__copy">
          <p className="v2-view-header__date">{formatLongDay(dayKey)}</p>
          <h1 className="v2-view-header__title">Small enough to keep.</h1>
          <p className="v2-view-header__description">Track the rhythm without turning a missed day into a verdict.</p>
        </div>
        <p className="v2-habits-view__today-count" aria-live="polite">{checkedToday} of {activeHabits.length} checked today</p>
      </header>

      <section className="v2-habit-world" aria-labelledby="v2-habits-today-title">
        <div className="v2-section-heading">
          <div>
            <h2 id="v2-habits-today-title" className="v2-section-heading__title">Today’s minimum versions</h2>
            <p className="v2-section-heading__description">The smallest honest version still counts.</p>
          </div>
          <span className="v2-local-label"><Leaf size={15} weight="bold" aria-hidden="true" /> Stored locally</span>
        </div>

        {activeHabits.length ? (
          <ul className="v2-habit-list">
            {activeHabits.map((habit) => {
              const todayValue = logValueFor(habitLogs, habit.id, dayKey);
              const isChecked = todayValue > 0;
              return (
                <li key={habit.id} className="v2-habit-row" data-checked={isChecked ? 'true' : 'false'}>
                  <button
                    type="button"
                    className="v2-habit-row__toggle"
                    onClick={() => onToggleToday(habit.id, isChecked ? 0 : 1)}
                    aria-pressed={isChecked}
                    aria-label={isChecked ? `Uncheck ${habit.label} for today` : `Check ${habit.label} for today`}
                  >
                    <span className="v2-habit-row__mark" aria-hidden="true">
                      {isChecked ? <Check size={18} weight="bold" /> : habit.mark}
                    </span>
                    <span className="v2-habit-row__copy">
                      <strong>{habit.label}</strong>
                      <span>{habit.minimum || 'Minimum version not set'}</span>
                    </span>
                    <span className="v2-habit-row__cadence">{habit.cadence}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="v2-empty-state">No habits yet. Add one with a minimum version you can keep on a difficult day.</p>
        )}
      </section>

      <section className="v2-rhythm" aria-labelledby="v2-rhythm-title">
        <div className="v2-section-heading">
          <div>
            <h2 id="v2-rhythm-title" className="v2-section-heading__title">Seven-day rhythm</h2>
            <p className="v2-section-heading__description">Check-ins only. No streak loss, ranking, or simulated history.</p>
          </div>
        </div>
        {activeHabits.length ? (
          <div className="v2-rhythm__table-wrap">
            <table className="v2-rhythm__table">
              <thead>
                <tr>
                  <th scope="col">Habit</th>
                  {rhythmDays.map((rhythmDay) => (
                    <th key={rhythmDay} scope="col" data-today={rhythmDay === dayKey ? 'true' : 'false'}>
                      <abbr title={formatArchiveDay(rhythmDay)}>{formatWeekday(rhythmDay)}</abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeHabits.map((habit) => (
                  <tr key={habit.id}>
                    <th scope="row">{habit.label}</th>
                    {rhythmDays.map((rhythmDay) => {
                      const state = habitRhythmState(habit, habitLogs, rhythmDay);
                      const checked = state === 'checked';
                      const stateLabel = state === 'unknown' ? 'no record' : state.replace('-', ' ');
                      const cellLabel = `${habit.label}, ${formatArchiveDay(rhythmDay)}: ${stateLabel}`;
                      return (
                        <td
                          key={rhythmDay}
                          data-state={state}
                          data-checked={checked ? 'true' : 'false'}
                          data-today={rhythmDay === dayKey ? 'true' : 'false'}
                        >
                          {rhythmDay === dayKey ? (
                            <button
                              type="button"
                              className="v2-rhythm__today-toggle"
                              onClick={() => onToggleToday(habit.id, checked ? 0 : 1)}
                              aria-label={`${cellLabel}. Toggle today.`}
                              aria-pressed={checked}
                            >
                              {checked
                                ? <Check size={15} weight="bold" aria-hidden="true" />
                                : state === 'unknown'
                                  ? <Minus size={13} weight="bold" aria-hidden="true" />
                                  : <Circle size={12} weight="bold" aria-hidden="true" />}
                            </button>
                          ) : (
                            <span className="v2-rhythm__mark" role="img" aria-label={cellLabel}>
                              {checked
                                ? <Check size={14} weight="bold" aria-hidden="true" />
                                : state === 'unknown'
                                  ? <Minus size={12} weight="bold" aria-hidden="true" />
                                  : <Circle size={10} weight="bold" aria-hidden="true" />}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="v2-empty-state">The rhythm will appear after the first habit is added.</p>
        )}
      </section>

      <form className="v2-inline-add v2-inline-add--habit" onSubmit={submitHabit} aria-labelledby="v2-add-habit-title">
        <div className="v2-inline-add__heading">
          <Plus size={20} weight="bold" aria-hidden="true" />
          <div>
            <h2 id="v2-add-habit-title">Add a habit</h2>
            <p>Name the habit and the version that still works on a low-energy day.</p>
          </div>
        </div>
        <div className="v2-inline-add__fields">
          <div className="v2-field-group">
            <label htmlFor={habitNameId}>Habit name</label>
            <input
              id={habitNameId}
              className="v2-field"
              value={habitName}
              onChange={(event) => setHabitName(event.target.value)}
              maxLength={NOOK_INPUT_LIMITS.habitLabel}
              placeholder="Name a repeatable action"
              autoComplete="off"
            />
          </div>
          <div className="v2-field-group v2-field-group--wide">
            <label htmlFor={minimumId}>Minimum version</label>
            <input
              id={minimumId}
              className="v2-field"
              value={minimum}
              onChange={(event) => setMinimum(event.target.value)}
              maxLength={NOOK_INPUT_LIMITS.habitMinimum}
              placeholder="What is the smallest honest version?"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="v2-button v2-button--primary" disabled={!habitName.trim() || !minimum.trim()}>
            Add habit
          </button>
        </div>
      </form>
    </div>
  );
}

export function FocusView({
  dayKey,
  onAddDistraction,
  onChangeIntention,
  onChangeSessionNote,
  onRemoveDistraction,
  onResetTimer,
  onSetPreset,
  onToggleTimer,
  sessions,
  timer,
}: FocusViewProps) {
  const intentionId = useId();
  const distractionId = useId();
  const sessionNoteId = useId();
  const [distractionDraft, setDistractionDraft] = useState('');
  const historyDays = lastSevenDayKeys(dayKey);
  const history = historyDays.map((historyDay) => ({
    dayKey: historyDay,
    minutes: sessions
      .filter((session) => session.dayKey === historyDay)
      .reduce((total, session) => total + Math.max(0, session.actualMinutes), 0),
  }));
  const historyMaximum = Math.max(...history.map((item) => item.minutes), 1);
  const historyTotal = history.reduce((total, item) => total + item.minutes, 0);
  const completedSessionCount = sessions.filter((session) => historyDays.includes(session.dayKey) && session.actualMinutes > 0).length;
  const timerHasProgress = Boolean(timer.startedAt)
    && timer.remainingSeconds < timer.presetMinutes * 60;
  const timerActionLabel = timer.running
    ? 'Pause'
    : timerHasProgress
      ? 'Resume focus'
      : 'Start focus';
  const timerStatus = timer.running
    ? 'running'
    : timerHasProgress
      ? 'paused'
      : 'ready';

  function submitDistraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const distraction = distractionDraft.trim();
    if (!distraction) return;
    onAddDistraction(distraction);
    setDistractionDraft('');
  }

  return (
    <div className="v2-view v2-focus-view">
      <header className="v2-view-header">
        <div className="v2-view-header__copy">
          <p className="v2-view-header__date">{formatLongDay(dayKey)}</p>
          <h1 className="v2-view-header__title">Protect one clear intention.</h1>
          <p className="v2-view-header__description">The timer holds the boundary. Loose thoughts can wait in the distraction pad.</p>
        </div>
        {timer.running && (
          <span className="v2-live-status" role="status">
            <span className="v2-live-status__dot" aria-hidden="true" />
            Session running
          </span>
        )}
      </header>

      <div className="v2-focus-view__grid">
        <section className="v2-focus-timer" aria-labelledby="v2-focus-timer-title">
          <div className="v2-focus-timer__topline">
            <h2 id="v2-focus-timer-title">Focus timer</h2>
            <div className="v2-focus-presets" aria-label="Focus duration presets">
              {FOCUS_PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className="v2-focus-presets__button"
                  data-selected={timer.presetMinutes === minutes ? 'true' : 'false'}
                  aria-pressed={timer.presetMinutes === minutes}
                  onClick={() => onSetPreset(minutes)}
                >
                  {minutes}m
                </button>
              ))}
            </div>
          </div>

          <p className="v2-focus-timer__digits" aria-label={`${formatTimer(timer.remainingSeconds)} remaining`}>
            {formatTimer(timer.remainingSeconds)}
          </p>

          <div className="v2-field-group v2-field-group--on-dark">
            <label htmlFor={intentionId}>Intention</label>
            <input
              id={intentionId}
              className="v2-field v2-focus-timer__intention"
              value={timer.intention}
              onChange={(event) => onChangeIntention(event.target.value)}
              maxLength={NOOK_INPUT_LIMITS.focusIntention}
              placeholder="What gets your full attention?"
              autoComplete="off"
            />
          </div>

          <div className="v2-focus-timer__actions">
            <button type="button" className="v2-button v2-button--focus" onClick={onToggleTimer}>
              {timer.running
                ? <Pause size={18} weight="bold" aria-hidden="true" />
                : <Play size={18} weight="bold" aria-hidden="true" />}
              {timerActionLabel}
            </button>
            <button type="button" className="v2-icon-button v2-icon-button--on-dark" onClick={onResetTimer} aria-label="Reset focus timer">
              <ArrowCounterClockwise size={19} weight="bold" aria-hidden="true" />
            </button>
          </div>
          <p className="v2-visually-hidden" role="status" aria-live="polite">
            Focus timer {timerStatus}.
          </p>
        </section>

        <section className="v2-distraction-pad" aria-labelledby="v2-distraction-title">
          <div className="v2-section-heading">
            <div>
              <h2 id="v2-distraction-title" className="v2-section-heading__title">Distraction pad</h2>
              <p className="v2-section-heading__description">Capture it without leaving the session.</p>
            </div>
            <span className="v2-measure">{timer.distractions.length}</span>
          </div>
          <form className="v2-distraction-pad__capture" onSubmit={submitDistraction}>
            <label htmlFor={distractionId}>Waiting thought</label>
            <div className="v2-distraction-pad__field-row">
              <input
                id={distractionId}
                className="v2-field"
                value={distractionDraft}
                onChange={(event) => setDistractionDraft(event.target.value)}
                maxLength={NOOK_INPUT_LIMITS.distraction}
                placeholder="Park a thought for later"
                autoComplete="off"
              />
              <button type="submit" className="v2-icon-button" disabled={!distractionDraft.trim()} aria-label="Add distraction">
                <Plus size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </form>
          {timer.distractions.length ? (
            <ul className="v2-distraction-list">
              {timer.distractions.map((distraction, index) => (
                <li key={`${distraction}-${index}`}>
                  <span>{distraction}</span>
                  {onRemoveDistraction && (
                    <button
                      type="button"
                      className="v2-icon-button"
                      onClick={() => onRemoveDistraction(index)}
                      aria-label={`Remove distraction: ${distraction}`}
                    >
                      <Trash size={15} weight="bold" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="v2-empty-state">Nothing is waiting here.</p>
          )}
        </section>

        <section className="v2-session-note" aria-labelledby="v2-session-note-title">
          <div className="v2-section-heading">
            <div>
              <h2 id="v2-session-note-title" className="v2-section-heading__title">Session note</h2>
              <p className="v2-section-heading__description">Keep the useful residue from this block.</p>
            </div>
          </div>
          <label className="v2-visually-hidden" htmlFor={sessionNoteId}>Focus session note</label>
          <textarea
            id={sessionNoteId}
            className="v2-field v2-session-note__editor"
            value={timer.sessionNote}
            onChange={(event) => onChangeSessionNote(event.target.value)}
            maxLength={NOOK_INPUT_LIMITS.sessionNote}
            placeholder="What changed, clarified, or should continue next time?"
            spellCheck
          />
        </section>

        <section className="v2-focus-history" aria-labelledby="v2-focus-history-title">
          <div className="v2-section-heading">
            <div>
              <h2 id="v2-focus-history-title" className="v2-section-heading__title">Seven-day focus history</h2>
              <p className="v2-section-heading__description">Completed session minutes, recorded on this device.</p>
            </div>
            <span className="v2-measure">{historyTotal ? minutesLabel(historyTotal) : 'No sessions'}</span>
          </div>
          {historyTotal > 0 ? (
            <>
              <ol className="v2-focus-history__chart" aria-label="Focus minutes for the last seven days">
                {history.map((item) => (
                  <li key={item.dayKey} data-today={item.dayKey === dayKey ? 'true' : 'false'}>
                    <meter
                      className="v2-focus-history__meter"
                      min={0}
                      max={historyMaximum}
                      value={item.minutes}
                      aria-label={`${formatArchiveDay(item.dayKey)}: ${minutesLabel(item.minutes)}`}
                    />
                    <span className="v2-focus-history__value">{item.minutes}</span>
                    <span className="v2-focus-history__day">{formatWeekday(item.dayKey)}</span>
                  </li>
                ))}
              </ol>
              <p className="v2-focus-history__summary">
                {completedSessionCount} completed {completedSessionCount === 1 ? 'session' : 'sessions'} in this window.
              </p>
            </>
          ) : (
            <div className="v2-empty-state v2-empty-state--history">
              <Timer size={24} weight="bold" aria-hidden="true" />
              <p>No completed focus sessions are recorded in this seven-day window.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function NotesView({ notes, onApplyTemplate, onChangeContent, onSelectDay, selectedDayKey }: NotesViewProps) {
  const dateId = useId();
  const searchId = useId();
  const [query, setQuery] = useState('');
  const selectedNote = notes.find((note) => note.dayKey === selectedDayKey);
  const selectedContent = selectedNote?.content ?? '';
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const archive = useMemo(() => (
    [...notes]
      .sort((left, right) => right.dayKey.localeCompare(left.dayKey))
      .filter((note) => (
        !normalizedQuery
        || note.dayKey.includes(normalizedQuery)
        || note.content.toLocaleLowerCase().includes(normalizedQuery)
      ))
  ), [normalizedQuery, notes]);

  return (
    <div className="v2-view v2-notes-view">
      <header className="v2-view-header">
        <div className="v2-view-header__copy">
          <p className="v2-view-header__date">{formatLongDay(selectedDayKey)}</p>
          <h1 className="v2-view-header__title">A page for each day.</h1>
          <p className="v2-view-header__description">Search the archive, choose a date, and keep the note on this device.</p>
        </div>
        <div className="v2-notes-view__date-control">
          <label htmlFor={dateId}>Note date</label>
          <input
            id={dateId}
            className="v2-field"
            type="date"
            value={selectedDayKey}
            onChange={(event) => event.target.value && onSelectDay(event.target.value)}
          />
        </div>
      </header>

      <div className="v2-notes-view__grid">
        <section className="v2-note-editor" aria-labelledby="v2-note-editor-title">
          <div className="v2-note-editor__toolbar">
            <div>
              <h2 id="v2-note-editor-title">{formatArchiveDay(selectedDayKey)}</h2>
              <p>{countWords(selectedContent)} words</p>
            </div>
            <span className="v2-local-label"><NotePencil size={15} weight="bold" aria-hidden="true" /> Local note</span>
          </div>
          <label className="v2-visually-hidden" htmlFor={`${dateId}-editor`}>Daily note for {formatArchiveDay(selectedDayKey)}</label>
          <textarea
            id={`${dateId}-editor`}
            className="v2-field v2-note-editor__textarea"
            value={selectedContent}
            onChange={(event) => onChangeContent(selectedDayKey, event.target.value)}
            maxLength={NOOK_INPUT_LIMITS.noteContent}
            placeholder="Write one line worth finding again. Markdown is welcome."
            spellCheck
          />
          <p className="v2-note-editor__save-note" role="status">Changes stay on this device.</p>
        </section>

        <aside className="v2-note-archive" aria-labelledby="v2-note-archive-title">
          <div className="v2-section-heading">
            <div>
              <h2 id="v2-note-archive-title" className="v2-section-heading__title">Archive</h2>
              <p className="v2-section-heading__description">{notes.length} dated {notes.length === 1 ? 'note' : 'notes'}</p>
            </div>
            <Archive size={21} weight="bold" aria-hidden="true" />
          </div>
          <div className="v2-search-field">
            <MagnifyingGlass size={17} weight="bold" aria-hidden="true" />
            <label className="v2-visually-hidden" htmlFor={searchId}>Search notes</label>
            <input
              id={searchId}
              className="v2-field"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={500}
              placeholder="Search dates or words"
            />
          </div>
          {archive.length ? (
            <ul className="v2-note-archive__list">
              {archive.map((note) => {
                const preview = meaningfulMarkdown(note.content);
                return (
                  <li key={note.dayKey}>
                    <button
                      type="button"
                      className="v2-note-archive__item"
                      data-selected={note.dayKey === selectedDayKey ? 'true' : 'false'}
                      aria-pressed={note.dayKey === selectedDayKey}
                      onClick={() => onSelectDay(note.dayKey)}
                    >
                      <span className="v2-note-archive__date">{formatArchiveDay(note.dayKey)}</span>
                      <span className="v2-note-archive__preview">{preview || 'Empty note'}</span>
                      <span className="v2-note-archive__words">{countWords(note.content)} words</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="v2-empty-state" role="status">
              {notes.length ? 'No notes match this search.' : 'No dated notes yet.'}
            </p>
          )}
        </aside>
      </div>

      <PremiumPreview
        className="v2-note-templates"
        title="Note templates"
        description="Templates add structure only. They do not generate content or send note text away."
      >
        <div className="v2-note-templates__list">
          {NOTE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className="v2-note-template"
              onClick={() => onApplyTemplate(selectedDayKey, template.id)}
            >
              <Clock size={18} weight="bold" aria-hidden="true" />
              <span>
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </span>
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </button>
          ))}
        </div>
      </PremiumPreview>
    </div>
  );
}
