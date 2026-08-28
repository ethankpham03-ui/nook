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
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNookI18n } from '../lib/i18n';
import type { Language, NookCopy } from '../lib/i18n';
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

const TASK_LANE_IDS = ['anchor', 'support', 'optional'] as const satisfies readonly TaskLane[];

const FOCUS_PRESETS = [15, 25, 50, 90] as const;
const COMPASS_MINIMUM_DAYS = 3;

const VIEW_TERMS = {
  en: {
    capacityUnset: 'Set a capacity to keep the plan honest.',
    checklist: { one: 'checklist item', other: 'checklist items' },
    daily: 'Daily',
    habit: 'Habit',
    minimumMissing: 'Minimum version not set',
    open: { one: 'open', other: 'open', zero: 'open' },
  },
  vi: {
    capacityUnset: 'Đặt sức chứa để kế hoạch luôn vừa sức.',
    checklist: { one: 'mục danh sách', other: 'mục danh sách' },
    daily: 'Hằng ngày',
    habit: 'Thói quen',
    minimumMissing: 'Chưa đặt phiên bản tối thiểu',
    open: { one: 'còn lại', other: 'còn lại', zero: 'còn lại' },
  },
} as const satisfies Record<Language, {
  capacityUnset: string;
  checklist: { one: string; other: string };
  daily: string;
  habit: string;
  minimumMissing: string;
  open: { one: string; other: string; zero: string };
}>;

export type NoteTemplateId = 'morning-plan' | 'close-day' | 'weekly-reflection';

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
  guideNextMove?: boolean;
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
  guideAnchor?: boolean;
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

function formatTimer(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const seconds = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
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

function taskLaneCopy(copy: NookCopy, lane: TaskLane) {
  return copy.today.lanes[lane] ?? {
    label: copy.today.lanes.fallback,
    description: '',
  };
}

export function PremiumPreview({ children, className = '', description, title }: PremiumPreviewProps) {
  const { copy } = useNookI18n();

  return (
    <section
      className={`v2-premium-preview ${className}`.trim()}
      aria-label={copy.premium.sectionLabel(title)}
    >
      <div className="v2-premium-preview__header">
        <span className="v2-premium-preview__badge">
          <Sparkle size={15} weight="bold" aria-hidden="true" />
          {copy.common.premiumPreview}
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
  guideNextMove = false,
  habitLogs,
  habits,
  notes,
  onCloseDay,
  onFocusTask,
  onNavigate,
  onOpenMorningPlan,
  tasks,
}: HomeViewProps) {
  const { copy, formatDayKey, formatMinutes, formatNumber } = useNookI18n();
  const nextMoveActionRef = useRef<HTMLButtonElement>(null);
  const todayTasks = tasks.filter((task) => task.dayKey === dayKey);
  const pendingTasks = todayTasks.filter((task) => !task.done);
  const pendingAnchor = pendingTasks.find((task) => task.lane === ('anchor' as TaskLane));
  const todayRecord = dailyRecords.find((record) => record.dayKey === dayKey);
  const activeHabits = habits.filter((habit) => !habit.archivedAt);
  const todayFocusMinutes = focusSessions
    .filter((session) => session.dayKey === dayKey)
    .reduce((total, session) => total + Math.max(0, session.actualMinutes), 0);
  const habitsCheckedToday = activeHabits.filter((habit) => logValueFor(habitLogs, habit.id, dayKey) > 0).length;
  const hasOpenedDay = Boolean(todayRecord?.openedAt);
  const hasMorningPlan = hasOpenedDay || todayTasks.length > 0;
  const hasShapedDay = todayTasks.some((task) => task.lane === ('anchor' as TaskLane));
  const hasReflection = Boolean(todayRecord?.closedAt);

  useEffect(() => {
    if (!guideNextMove) return;
    const frame = window.requestAnimationFrame(() => {
      nextMoveActionRef.current?.scrollIntoView({ block: 'center' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [guideNextMove]);

  const arcFacts = [
    {
      id: 'plan',
      label: copy.home.arc.stages.shape,
      complete: hasShapedDay,
      detail: hasShapedDay
        ? copy.home.arc.tasksPlaced(todayTasks.length)
        : hasOpenedDay
          ? copy.home.arc.noAnchor
          : copy.home.arc.noPlan,
    },
    {
      id: 'focus',
      label: copy.home.arc.stages.focus,
      complete: todayFocusMinutes > 0,
      detail: todayFocusMinutes > 0
        ? copy.home.arc.focusRecorded(formatMinutes(todayFocusMinutes))
        : copy.home.arc.noSession,
    },
    {
      id: 'tend',
      label: copy.home.arc.stages.tend,
      complete: habitsCheckedToday > 0,
      detail: activeHabits.length
        ? copy.home.arc.habitsChecked(habitsCheckedToday, activeHabits.length)
        : copy.home.arc.noHabits,
    },
    {
      id: 'close',
      label: copy.home.arc.stages.close,
      complete: hasReflection,
      detail: todayRecord?.closedAt ? copy.home.dayClosed : copy.home.arc.noClosingNote,
    },
  ];
  const firstOpenStage = arcFacts.findIndex((stage) => !stage.complete);
  const arcStages = arcFacts.map((stage, index) => ({
    ...stage,
    state: (stage.complete ? 'complete' : index === firstOpenStage ? 'current' : 'waiting') as DayArcState,
  }));

  let quietMoveTitle = copy.home.quietMove.readyToCloseTitle;
  let quietMoveDetail = copy.home.quietMove.readyToCloseDetail;
  let quietMoveAction = copy.home.quietMove.closeAction;
  let handleQuietMove = onCloseDay;

  if (todayRecord?.closedAt) {
    quietMoveTitle = copy.home.quietMove.closedTitle;
    quietMoveDetail = copy.home.quietMove.closedDetail;
    quietMoveAction = copy.home.quietMove.openNoteAction;
    handleQuietMove = () => onNavigate('notes' as Tab);
  } else if (!hasMorningPlan) {
    quietMoveTitle = copy.home.quietMove.shapeTitle;
    quietMoveDetail = copy.home.quietMove.shapeDetail;
    quietMoveAction = copy.home.quietMove.morningPlanAction;
    handleQuietMove = onOpenMorningPlan;
  } else if (!pendingAnchor && todayTasks.length === 0) {
    quietMoveTitle = copy.home.quietMove.chooseAnchorTitle;
    quietMoveDetail = copy.home.quietMove.chooseAnchorDetail;
    quietMoveAction = copy.home.quietMove.addAnchorAction;
    handleQuietMove = () => onNavigate('today' as Tab);
  } else if (pendingAnchor) {
    quietMoveTitle = pendingAnchor.title;
    quietMoveDetail = copy.home.quietMove.anchorDetail(
      pendingAnchor.category,
      formatMinutes(pendingAnchor.minutes),
    );
    quietMoveAction = copy.home.quietMove.focusAnchorAction;
    handleQuietMove = () => {
      if (onFocusTask) onFocusTask(pendingAnchor.id);
      else onNavigate('focus' as Tab);
    };
  } else if (pendingTasks.length) {
    quietMoveTitle = copy.home.quietMove.chooseTaskTitle;
    quietMoveDetail = copy.home.quietMove.remainingTasks(pendingTasks.length);
    quietMoveAction = copy.home.quietMove.reviewTodayAction;
    handleQuietMove = () => onNavigate('today' as Tab);
  } else if (habitsCheckedToday < activeHabits.length) {
    quietMoveTitle = copy.home.quietMove.tendTitle;
    quietMoveDetail = copy.home.quietMove.tendDetail;
    quietMoveAction = copy.home.quietMove.openHabitsAction;
    handleQuietMove = () => onNavigate('habits' as Tab);
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
          <p className="v2-view-header__date">{formatDayKey(dayKey)}</p>
          <h1 className="v2-view-header__title">{copy.home.title}</h1>
          <p className="v2-view-header__description">{copy.home.description}</p>
        </div>
        <div className="v2-home-view__ritual-actions" aria-label={copy.home.dailyRituals}>
          <button type="button" className="v2-button v2-button--secondary" onClick={onOpenMorningPlan}>
            <CalendarBlank size={18} weight="bold" aria-hidden="true" />
            {todayRecord?.openedAt ? copy.home.reviewMorningPlan : copy.home.morningPlan}
          </button>
          <button
            type="button"
            className="v2-button v2-button--primary"
            onClick={onCloseDay}
            disabled={Boolean(todayRecord?.closedAt)}
          >
            <Check size={18} weight="bold" aria-hidden="true" />
            {todayRecord?.closedAt ? copy.home.dayClosed : copy.home.closeDay}
          </button>
        </div>
      </header>

      <div className="v2-home-view__primary-grid">
        <section className="v2-day-arc" aria-labelledby="v2-day-arc-title">
          <div className="v2-section-heading">
            <div>
              <h2 id="v2-day-arc-title" className="v2-section-heading__title">{copy.home.arc.title}</h2>
              <p className="v2-section-heading__description">{copy.home.arc.description}</p>
            </div>
            <span className="v2-measure">
              {formatNumber(arcFacts.filter((stage) => stage.complete).length)} / {formatNumber(arcFacts.length)}
            </span>
          </div>
          <progress
            className="v2-day-arc__progress"
            max={arcFacts.length}
            value={arcFacts.filter((stage) => stage.complete).length}
            aria-label={copy.home.arc.progressLabel}
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

        <section
          className="v2-quiet-move"
          aria-labelledby="v2-quiet-move-title"
          data-guided={guideNextMove && pendingAnchor ? 'true' : undefined}
        >
          <div className="v2-quiet-move__icon" aria-hidden="true">
            <ArrowRight size={22} weight="bold" />
          </div>
          <p className="v2-quiet-move__label">{copy.home.quietMove.label}</p>
          <h2 id="v2-quiet-move-title" className="v2-quiet-move__title">{quietMoveTitle}</h2>
          <p className="v2-quiet-move__description">{quietMoveDetail}</p>
          {guideNextMove && pendingAnchor && (
            <p className="v3-activation-cue" role="status">{copy.home.quietMove.anchorReady}</p>
          )}
          <button
            ref={nextMoveActionRef}
            id="nook-next-move-action"
            type="button"
            className="v2-button v2-button--focus"
            onClick={handleQuietMove}
            autoFocus={guideNextMove && Boolean(pendingAnchor)}
          >
            {quietMoveAction}
            <ArrowRight size={17} weight="bold" aria-hidden="true" />
          </button>
        </section>
      </div>

      <PremiumPreview
        className="v2-weekly-compass"
        title={copy.home.compass.title}
        description={copy.home.compass.description}
      >
        {daysStillNeeded > 0 ? (
          <div className="v2-weekly-compass__waiting" role="status">
            <Compass size={25} weight="bold" aria-hidden="true" />
            <div>
              <p className="v2-weekly-compass__waiting-title">
                {copy.home.compass.revealAfter(daysStillNeeded)}
              </p>
              <p className="v2-weekly-compass__waiting-copy">
                {copy.home.compass.recordedDays(observedDays.size, COMPASS_MINIMUM_DAYS)}
              </p>
            </div>
          </div>
        ) : (
          <div className="v2-weekly-compass__facts">
            <p className="v2-weekly-compass__summary">
              {copy.home.compass.activeDays(observedDays.size)}
            </p>
            <dl className="v2-weekly-compass__measures">
              <div>
                <dt>{copy.home.compass.tasksCompleted}</dt>
                <dd>{formatNumber(weeklyCompletedTasks)}</dd>
              </div>
              <div>
                <dt>{copy.home.compass.focusRecorded}</dt>
                <dd>{formatMinutes(weeklyFocusMinutes)}</dd>
              </div>
              <div>
                <dt>{copy.home.compass.habitCheckIns}</dt>
                <dd>{formatNumber(weeklyHabitChecks)}</dd>
              </div>
              <div>
                <dt>{copy.home.compass.noteDays}</dt>
                <dd>{formatNumber(weeklyNoteDays)}</dd>
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
  guideAnchor = false,
  onAddTask,
  onChangeTaskLane,
  onDeleteTask,
  onFocusTask,
  onSetCapacity,
  onToggleTask,
  tasks,
}: TodayViewProps) {
  const { copy, formatCount, formatDayKey, formatMinutes, language } = useNookI18n();
  const terms = VIEW_TERMS[language];
  const titleId = useId();
  const categoryId = useId();
  const minutesId = useId();
  const laneId = useId();
  const capacityId = useId();
  const firstAnchorId = useId();
  const taskTitleRef = useRef<HTMLInputElement>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskMinutes, setTaskMinutes] = useState(25);
  const [taskLane, setTaskLane] = useState<TaskLane>('anchor' as TaskLane);

  const todayTasks = tasks.filter((task) => task.dayKey === dayKey);
  const plannedMinutes = todayTasks.reduce((total, task) => total + Math.max(0, task.minutes), 0);
  const completedMinutes = todayTasks
    .filter((task) => task.done)
    .reduce((total, task) => total + Math.max(0, task.minutes), 0);
  const capacityMinutes = Math.max(0, dailyRecord?.capacityMinutes ?? 0);
  const overCapacityBy = capacityMinutes ? Math.max(0, plannedMinutes - capacityMinutes) : 0;

  useEffect(() => {
    if (!guideAnchor) return;
    const frame = window.requestAnimationFrame(() => taskTitleRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [guideAnchor]);

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;

    onAddTask({
      title,
      category: taskCategory.trim(),
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
          <p className="v2-view-header__date">{formatDayKey(dayKey)}</p>
          <h1 className="v2-view-header__title">{copy.today.title}</h1>
          <p className="v2-view-header__description">{copy.today.description}</p>
        </div>
      </header>

      <section className="v2-capacity" aria-labelledby="v2-capacity-title">
        <div className="v2-capacity__copy">
          <Gauge size={24} weight="bold" aria-hidden="true" />
          <div>
            <h2 id="v2-capacity-title" className="v2-capacity__title">{copy.today.capacity.title}</h2>
            <p className="v2-capacity__status" role="status">
              {!capacityMinutes && terms.capacityUnset}
              {capacityMinutes > 0 && overCapacityBy === 0
                && copy.today.capacity.fits(Math.max(0, capacityMinutes - plannedMinutes))}
              {overCapacityBy > 0 && copy.today.capacity.over(overCapacityBy)}
            </p>
          </div>
        </div>
        <div className="v2-capacity__control">
          <label htmlFor={capacityId}>{copy.today.capacity.available}</label>
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
          aria-label={copy.today.capacity.plannedAvailable(
            formatMinutes(plannedMinutes),
            formatMinutes(capacityMinutes),
          )}
        />
        <p className="v2-capacity__completed">{copy.today.capacity.completed(formatMinutes(completedMinutes))}</p>
      </section>

      <form
        className="v2-quick-capture"
        onSubmit={submitTask}
        aria-labelledby="v2-quick-capture-title"
        data-first-use={todayTasks.length === 0 ? 'true' : undefined}
        data-guided={guideAnchor ? 'true' : undefined}
      >
        <div className="v2-quick-capture__heading">
          <Plus size={20} weight="bold" aria-hidden="true" />
          <div>
            <h2 id="v2-quick-capture-title">
              {todayTasks.length === 0 ? copy.today.firstAnchor.title : copy.today.capture.title}
            </h2>
            {todayTasks.length === 0 && (
              <p id={firstAnchorId} className="v3-anchor-guide__description">
                {copy.today.firstAnchor.description}
              </p>
            )}
          </div>
        </div>
        {todayTasks.length === 0 && (
          <p className="v3-anchor-guide__lane-key">{copy.today.firstAnchor.laneGuide}</p>
        )}
        <div className="v2-quick-capture__fields">
          <div className="v2-field-group v2-field-group--wide">
            <label htmlFor={titleId}>{copy.today.capture.task}</label>
            <input
              ref={taskTitleRef}
              id={titleId}
              className="v2-field"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              maxLength={NOOK_INPUT_LIMITS.taskTitle}
              placeholder={copy.today.capture.taskPlaceholder}
              aria-describedby={todayTasks.length === 0 ? firstAnchorId : undefined}
              autoComplete="off"
            />
          </div>
          <div className="v2-field-group">
            <label htmlFor={categoryId}>{copy.today.capture.category}</label>
            <input
              id={categoryId}
              className="v2-field"
              value={taskCategory}
              onChange={(event) => setTaskCategory(event.target.value)}
              maxLength={NOOK_INPUT_LIMITS.taskCategory}
              placeholder={copy.today.capture.categoryPlaceholder}
              autoComplete="off"
            />
          </div>
          <div className="v2-field-group">
            <label htmlFor={minutesId}>{copy.today.capture.minutes}</label>
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
            <label htmlFor={laneId}>{copy.today.capture.lane}</label>
            <select
              id={laneId}
              className="v2-field"
              value={taskLane}
              onChange={(event) => setTaskLane(event.target.value as TaskLane)}
            >
              {TASK_LANE_IDS.map((lane) => (
                <option key={lane} value={lane}>{taskLaneCopy(copy, lane).label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="v2-button v2-button--primary" disabled={!taskTitle.trim()}>
            {copy.today.capture.addTask}
          </button>
        </div>
      </form>

      <div className="v2-task-lanes">
        {TASK_LANE_IDS.map((lane) => {
          const laneCopy = taskLaneCopy(copy, lane);
          const laneTasks = todayTasks.filter((task) => task.lane === lane);
          const unfinishedCount = laneTasks.filter((task) => !task.done).length;

          return (
            <section key={lane} className="v2-task-lane" data-lane={lane} aria-labelledby={`v2-lane-${lane}`}>
              <div className="v2-task-lane__heading">
                <div>
                  <h2 id={`v2-lane-${lane}`}>{laneCopy.label}</h2>
                  <p>{laneCopy.description}</p>
                </div>
                <span className="v2-measure">{formatCount(unfinishedCount, terms.open)}</span>
              </div>

              {laneTasks.length ? (
                <ul className="v2-task-list">
                  {laneTasks.map((task) => (
                    <li key={task.id} className="v2-task-row" data-complete={task.done ? 'true' : 'false'}>
                      <button
                        type="button"
                        className="v2-icon-button v2-task-row__toggle"
                        onClick={() => onToggleTask(task.id)}
                        aria-label={task.done
                          ? copy.today.taskA11y.markIncomplete(task.title)
                          : copy.today.taskA11y.complete(task.title)}
                        aria-pressed={task.done}
                      >
                        {task.done
                          ? <Check size={17} weight="bold" aria-hidden="true" />
                          : <Circle size={17} weight="bold" aria-hidden="true" />}
                      </button>
                      <div className="v2-task-row__body">
                        <p className="v2-task-row__title">{task.title}</p>
                        <p className="v2-task-row__meta">
                          {task.category || copy.today.capture.categoryPlaceholder} · {formatMinutes(task.minutes)}
                          {task.checklist.length > 0 && ` · ${formatCount(task.checklist.length, terms.checklist)}`}
                        </p>
                      </div>
                      <label className="v2-task-row__lane-control">
                        <span className="v2-visually-hidden">
                          {copy.today.taskA11y.lane(task.title, taskLaneCopy(copy, task.lane).label)}
                        </span>
                        <select
                          className="v2-field v2-field--compact"
                          value={task.lane}
                          onChange={(event) => onChangeTaskLane(task.id, event.target.value as TaskLane)}
                          aria-label={copy.today.taskA11y.lane(task.title, taskLaneCopy(copy, task.lane).label)}
                        >
                          {TASK_LANE_IDS.map((option) => (
                            <option key={option} value={option}>{taskLaneCopy(copy, option).label}</option>
                          ))}
                        </select>
                      </label>
                      {onFocusTask && !task.done && (
                        <button
                          type="button"
                          className="v2-icon-button"
                          onClick={() => onFocusTask(task.id)}
                          aria-label={copy.today.taskA11y.focus(task.title)}
                        >
                          <Play size={17} weight="bold" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="v2-icon-button v2-icon-button--danger"
                        onClick={() => onDeleteTask(task.id)}
                        aria-label={copy.today.taskA11y.delete(task.title)}
                      >
                        <Trash size={17} weight="bold" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="v2-empty-state">{copy.today.emptyLane}</p>
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
  const { copy, formatDayKey, language } = useNookI18n();
  const terms = VIEW_TERMS[language];
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
          <p className="v2-view-header__date">{formatDayKey(dayKey)}</p>
          <h1 className="v2-view-header__title">{copy.habits.title}</h1>
          <p className="v2-view-header__description">{copy.habits.description}</p>
        </div>
        <p className="v2-habits-view__today-count" aria-live="polite">
          {copy.habits.checkedToday(checkedToday, activeHabits.length)}
        </p>
      </header>

      <section className="v2-habit-world" aria-labelledby="v2-habits-today-title">
        <div className="v2-section-heading">
          <div>
            <h2 id="v2-habits-today-title" className="v2-section-heading__title">{copy.habits.minimumTitle}</h2>
            <p className="v2-section-heading__description">{copy.habits.minimumDescription}</p>
          </div>
          <span className="v2-local-label">
            <Leaf size={15} weight="bold" aria-hidden="true" /> {copy.common.local}
          </span>
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
                    aria-label={isChecked
                      ? copy.habits.uncheckToday(habit.label)
                      : copy.habits.checkToday(habit.label)}
                  >
                    <span className="v2-habit-row__mark" aria-hidden="true">
                      {isChecked ? <Check size={18} weight="bold" /> : habit.mark}
                    </span>
                    <span className="v2-habit-row__copy">
                      <strong>{habit.label}</strong>
                      <span>{habit.minimum || terms.minimumMissing}</span>
                    </span>
                    <span className="v2-habit-row__cadence">
                      {habit.cadence.toLowerCase() === 'daily' ? terms.daily : habit.cadence}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="v2-empty-state">{copy.habits.empty}</p>
        )}
      </section>

      <section className="v2-rhythm" aria-labelledby="v2-rhythm-title">
        <div className="v2-section-heading">
          <div>
            <h2 id="v2-rhythm-title" className="v2-section-heading__title">{copy.habits.rhythm.title}</h2>
            <p className="v2-section-heading__description">{copy.habits.rhythm.description}</p>
          </div>
        </div>
        {activeHabits.length ? (
          <div className="v2-rhythm__table-wrap">
            <table className="v2-rhythm__table">
              <thead>
                <tr>
                  <th scope="col">{terms.habit}</th>
                  {rhythmDays.map((rhythmDay) => (
                    <th key={rhythmDay} scope="col" data-today={rhythmDay === dayKey ? 'true' : 'false'}>
                      <abbr title={formatDayKey(rhythmDay, 'archive')}>
                        {formatDayKey(rhythmDay, 'weekdayShort')}
                      </abbr>
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
                      const stateLabel = state === 'unknown'
                        ? copy.habits.rhythm.noRecord
                        : state === 'checked'
                          ? copy.habits.rhythm.checked
                          : copy.habits.rhythm.notChecked;
                      const cellLabel = copy.habits.rhythm.cell(
                        habit.label,
                        formatDayKey(rhythmDay, 'archive'),
                        stateLabel,
                      );
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
                              aria-label={copy.habits.rhythm.toggleToday(cellLabel)}
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
          <p className="v2-empty-state">{copy.habits.rhythm.empty}</p>
        )}
      </section>

      <form className="v2-inline-add v2-inline-add--habit" onSubmit={submitHabit} aria-labelledby="v2-add-habit-title">
        <div className="v2-inline-add__heading">
          <Plus size={20} weight="bold" aria-hidden="true" />
          <div>
            <h2 id="v2-add-habit-title">{copy.habits.add.title}</h2>
            <p>{copy.habits.add.description}</p>
          </div>
        </div>
        <div className="v2-inline-add__fields">
          <div className="v2-field-group">
            <label htmlFor={habitNameId}>{copy.habits.add.name}</label>
            <input
              id={habitNameId}
              className="v2-field"
              value={habitName}
              onChange={(event) => setHabitName(event.target.value)}
              maxLength={NOOK_INPUT_LIMITS.habitLabel}
              placeholder={copy.habits.add.namePlaceholder}
              autoComplete="off"
            />
          </div>
          <div className="v2-field-group v2-field-group--wide">
            <label htmlFor={minimumId}>{copy.habits.add.minimum}</label>
            <input
              id={minimumId}
              className="v2-field"
              value={minimum}
              onChange={(event) => setMinimum(event.target.value)}
              maxLength={NOOK_INPUT_LIMITS.habitMinimum}
              placeholder={copy.habits.add.minimumPlaceholder}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="v2-button v2-button--primary" disabled={!habitName.trim() || !minimum.trim()}>
            {copy.habits.add.action}
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
  const { copy, formatDayKey, formatMinutes, formatNumber } = useNookI18n();
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
    ? copy.focus.timer.pause
    : timerHasProgress
      ? copy.focus.timer.resume
      : copy.focus.timer.start;
  const timerStatus = timer.running
    ? copy.focus.timer.running
    : timerHasProgress
      ? copy.focus.timer.paused
      : copy.focus.timer.ready;

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
          <p className="v2-view-header__date">{formatDayKey(dayKey)}</p>
          <h1 className="v2-view-header__title">{copy.focus.title}</h1>
          <p className="v2-view-header__description">{copy.focus.description}</p>
        </div>
        {timer.running && (
          <span className="v2-live-status" role="status">
            <span className="v2-live-status__dot" aria-hidden="true" />
            {copy.focus.sessionRunning}
          </span>
        )}
      </header>

      <div className="v2-focus-view__grid">
        <section className="v2-focus-timer" aria-labelledby="v2-focus-timer-title">
          <div className="v2-focus-timer__topline">
            <h2 id="v2-focus-timer-title">{copy.focus.timer.title}</h2>
            <div className="v2-focus-presets" aria-label={copy.focus.timer.presetsLabel}>
              {FOCUS_PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className="v2-focus-presets__button"
                  data-selected={timer.presetMinutes === minutes ? 'true' : 'false'}
                  aria-pressed={timer.presetMinutes === minutes}
                  onClick={() => onSetPreset(minutes)}
                >
                  {formatNumber(minutes)} {copy.common.units.minuteShort}
                </button>
              ))}
            </div>
          </div>

          <p
            className="v2-focus-timer__digits"
            aria-label={copy.focus.timer.remaining(formatTimer(timer.remainingSeconds))}
          >
            {formatTimer(timer.remainingSeconds)}
          </p>

          <div className="v2-field-group v2-field-group--on-dark">
            <label htmlFor={intentionId}>{copy.focus.timer.intention}</label>
            <input
              id={intentionId}
              className="v2-field v2-focus-timer__intention"
              value={timer.intention}
              onChange={(event) => onChangeIntention(event.target.value)}
              maxLength={NOOK_INPUT_LIMITS.focusIntention}
              placeholder={copy.focus.timer.intentionPlaceholder}
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
            <button
              type="button"
              className="v2-icon-button v2-icon-button--on-dark"
              onClick={onResetTimer}
              aria-label={copy.focus.timer.reset}
            >
              <ArrowCounterClockwise size={19} weight="bold" aria-hidden="true" />
            </button>
          </div>
          <p className="v2-visually-hidden" role="status" aria-live="polite">
            {copy.focus.timer.status(timerStatus)}
          </p>
        </section>

        <section className="v2-distraction-pad" aria-labelledby="v2-distraction-title">
          <div className="v2-section-heading">
            <div>
              <h2 id="v2-distraction-title" className="v2-section-heading__title">{copy.focus.distractions.title}</h2>
              <p className="v2-section-heading__description">{copy.focus.distractions.description}</p>
            </div>
            <span className="v2-measure">{formatNumber(timer.distractions.length)}</span>
          </div>
          <form className="v2-distraction-pad__capture" onSubmit={submitDistraction}>
            <label htmlFor={distractionId}>{copy.focus.distractions.label}</label>
            <div className="v2-distraction-pad__field-row">
              <input
                id={distractionId}
                className="v2-field"
                value={distractionDraft}
                onChange={(event) => setDistractionDraft(event.target.value)}
                maxLength={NOOK_INPUT_LIMITS.distraction}
                placeholder={copy.focus.distractions.placeholder}
                autoComplete="off"
              />
              <button
                type="submit"
                className="v2-icon-button"
                disabled={!distractionDraft.trim()}
                aria-label={copy.focus.distractions.add}
              >
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
                      aria-label={copy.focus.distractions.remove(distraction)}
                    >
                      <Trash size={15} weight="bold" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="v2-empty-state">{copy.focus.distractions.empty}</p>
          )}
        </section>

        <section className="v2-session-note" aria-labelledby="v2-session-note-title">
          <div className="v2-section-heading">
            <div>
              <h2 id="v2-session-note-title" className="v2-section-heading__title">{copy.focus.sessionNote.title}</h2>
              <p className="v2-section-heading__description">{copy.focus.sessionNote.description}</p>
            </div>
          </div>
          <label className="v2-visually-hidden" htmlFor={sessionNoteId}>{copy.focus.sessionNote.label}</label>
          <textarea
            id={sessionNoteId}
            className="v2-field v2-session-note__editor"
            value={timer.sessionNote}
            onChange={(event) => onChangeSessionNote(event.target.value)}
            maxLength={NOOK_INPUT_LIMITS.sessionNote}
            placeholder={copy.focus.sessionNote.placeholder}
            spellCheck
          />
        </section>

        <section className="v2-focus-history" aria-labelledby="v2-focus-history-title">
          <div className="v2-section-heading">
            <div>
              <h2 id="v2-focus-history-title" className="v2-section-heading__title">{copy.focus.history.title}</h2>
              <p className="v2-section-heading__description">{copy.focus.history.description}</p>
            </div>
            <span className="v2-measure">
              {historyTotal ? formatMinutes(historyTotal) : copy.focus.history.noSessions}
            </span>
          </div>
          {historyTotal > 0 ? (
            <>
              <ol className="v2-focus-history__chart" aria-label={copy.focus.history.chartLabel}>
                {history.map((item) => (
                  <li key={item.dayKey} data-today={item.dayKey === dayKey ? 'true' : 'false'}>
                    <meter
                      className="v2-focus-history__meter"
                      min={0}
                      max={historyMaximum}
                      value={item.minutes}
                      aria-label={copy.focus.history.dayMinutes(
                        formatDayKey(item.dayKey, 'archive'),
                        formatMinutes(item.minutes),
                      )}
                    />
                    <span className="v2-focus-history__value">{formatNumber(item.minutes)}</span>
                    <span className="v2-focus-history__day">{formatDayKey(item.dayKey, 'weekdayShort')}</span>
                  </li>
                ))}
              </ol>
              <p className="v2-focus-history__summary">
                {copy.focus.history.completed(completedSessionCount)}
              </p>
            </>
          ) : (
            <div className="v2-empty-state v2-empty-state--history">
              <Timer size={24} weight="bold" aria-hidden="true" />
              <p>{copy.focus.history.empty}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function NotesView({ notes, onApplyTemplate, onChangeContent, onSelectDay, selectedDayKey }: NotesViewProps) {
  const { copy, formatDayKey, locale } = useNookI18n();
  const dateId = useId();
  const searchId = useId();
  const [query, setQuery] = useState('');
  const selectedNote = notes.find((note) => note.dayKey === selectedDayKey);
  const selectedContent = selectedNote?.content ?? '';
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const archive = useMemo(() => (
    [...notes]
      .sort((left, right) => right.dayKey.localeCompare(left.dayKey))
      .filter((note) => (
        !normalizedQuery
        || note.dayKey.includes(normalizedQuery)
        || note.content.toLocaleLowerCase(locale).includes(normalizedQuery)
      ))
  ), [locale, normalizedQuery, notes]);
  const noteTemplates = [
    {
      id: 'morning-plan' as const,
      label: copy.notes.templates.morningPlan.label,
      description: copy.notes.templates.morningPlan.description,
    },
    {
      id: 'close-day' as const,
      label: copy.notes.templates.closeDay.label,
      description: copy.notes.templates.closeDay.description,
    },
    {
      id: 'weekly-reflection' as const,
      label: copy.notes.templates.weeklyReflection.label,
      description: copy.notes.templates.weeklyReflection.description,
    },
  ] satisfies ReadonlyArray<{ id: NoteTemplateId; label: string; description: string }>;

  return (
    <div className="v2-view v2-notes-view">
      <header className="v2-view-header">
        <div className="v2-view-header__copy">
          <p className="v2-view-header__date">{formatDayKey(selectedDayKey)}</p>
          <h1 className="v2-view-header__title">{copy.notes.title}</h1>
          <p className="v2-view-header__description">{copy.notes.description}</p>
        </div>
        <div className="v2-notes-view__date-control">
          <label htmlFor={dateId}>{copy.notes.date}</label>
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
              <h2 id="v2-note-editor-title">{formatDayKey(selectedDayKey, 'archive')}</h2>
              <p>{copy.common.units.words(countWords(selectedContent))}</p>
            </div>
            <span className="v2-local-label">
              <NotePencil size={15} weight="bold" aria-hidden="true" /> {copy.notes.localNote}
            </span>
          </div>
          <label className="v2-visually-hidden" htmlFor={`${dateId}-editor`}>
            {copy.notes.dailyNote(formatDayKey(selectedDayKey, 'archive'))}
          </label>
          <textarea
            id={`${dateId}-editor`}
            className="v2-field v2-note-editor__textarea"
            value={selectedContent}
            onChange={(event) => onChangeContent(selectedDayKey, event.target.value)}
            maxLength={NOOK_INPUT_LIMITS.noteContent}
            placeholder={copy.notes.placeholder}
            spellCheck
          />
          <p className="v2-note-editor__save-note" role="status">{copy.notes.saveNote}</p>
        </section>

        <aside className="v2-note-archive" aria-labelledby="v2-note-archive-title">
          <div className="v2-section-heading">
            <div>
              <h2 id="v2-note-archive-title" className="v2-section-heading__title">{copy.notes.archive.title}</h2>
              <p className="v2-section-heading__description">{copy.notes.archive.datedNotes(notes.length)}</p>
            </div>
            <Archive size={21} weight="bold" aria-hidden="true" />
          </div>
          <div className="v2-search-field">
            <MagnifyingGlass size={17} weight="bold" aria-hidden="true" />
            <label className="v2-visually-hidden" htmlFor={searchId}>{copy.notes.archive.searchLabel}</label>
            <input
              id={searchId}
              className="v2-field"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={500}
              placeholder={copy.notes.archive.searchPlaceholder}
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
                      <span className="v2-note-archive__date">{formatDayKey(note.dayKey, 'archive')}</span>
                      <span className="v2-note-archive__preview">{preview || copy.notes.archive.emptyNote}</span>
                      <span className="v2-note-archive__words">
                        {copy.common.units.words(countWords(note.content))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="v2-empty-state" role="status">
              {notes.length ? copy.notes.archive.noMatch : copy.notes.archive.empty}
            </p>
          )}
        </aside>
      </div>

      <PremiumPreview
        className="v2-note-templates"
        title={copy.notes.templates.title}
        description={copy.notes.templates.description}
      >
        <div className="v2-note-templates__list">
          {noteTemplates.map((template) => (
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
