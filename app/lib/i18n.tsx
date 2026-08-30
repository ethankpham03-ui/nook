'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo } from 'react';
import type { Language } from './nook-state';

export type { Language } from './nook-state';

export const DEFAULT_LANGUAGE: Language = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const satisfies readonly Language[];

const LANGUAGE_LOCALES: Record<Language, string> = {
  en: 'en-US',
  vi: 'vi-VN',
};

const englishCopy = {
  common: {
    productName: 'Nook',
    tagline: 'Your day, quietly in focus.',
    local: 'Local',
    ownerPreview: 'Owner preview',
    premiumPreview: 'Premium preview · local',
    actions: {
      add: 'Add',
      back: 'Back',
      cancel: 'Cancel',
      closeDialog: 'Close dialog',
      continue: 'Continue',
      delete: 'Delete',
      notNow: 'Not now',
      save: 'Save',
      undo: 'Undo',
    },
    units: {
      minuteShort: 'min',
      minutes: 'minutes',
      words: (count: number) => `${count} ${count === 1 ? 'word' : 'words'}`,
      tasks: (count: number) => `${count} ${count === 1 ? 'task' : 'tasks'}`,
      habits: (count: number) => `${count} ${count === 1 ? 'habit' : 'habits'}`,
      notes: (count: number) => `${count} ${count === 1 ? 'note' : 'notes'}`,
      days: (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`,
      sessions: (count: number) => `${count} ${count === 1 ? 'session' : 'sessions'}`,
    },
  },
  nav: {
    labels: {
      today: 'Today',
      habits: 'Habits',
      home: 'Home',
      focus: 'Focus',
      notes: 'Notes',
    },
    openHome: 'Open Nook home',
    currentView: 'Current view',
    appControls: 'App controls',
    sections: 'Nook sections',
    useLightTheme: 'Use light theme',
    useDarkTheme: 'Use dark theme',
    openSettings: 'Open settings',
    focusTimerRunning: 'Focus timer is running',
  },
  loading: {
    opening: 'Opening your local Nook…',
  },
  onboarding: {
    dialogLabel: 'Welcome to Nook',
    languageLabel: 'Choose language',
    languageNames: {
      en: 'English',
      vi: 'Tiếng Việt',
    },
    skip: 'Skip for now',
    back: 'Back',
    next: 'Continue',
    finish: 'Open today’s plan',
    progressLabel: 'Onboarding progress',
    journeyLabel: 'How a day moves through Nook',
    starterLabel: 'Your first three actions in Nook',
    stepStatus: (current: number, total: number) => `Step ${current} of ${total}`,
    steps: {
      welcome: {
        title: 'A calmer day, one move at a time.',
        description: 'Nook turns what you can honestly carry today into one clear next move—without an account or a cloud.',
        note: 'About two minutes. Your data stays on this device.',
      },
      shape: {
        title: 'Use Nook as a daily loop.',
        description: 'Plan what fits, protect one Anchor, tend the smallest honest habit, then close the day.',
        note: 'Home always points to the next useful move.',
      },
      ready: {
        title: 'Start with a real day, not a tutorial.',
        description: 'Set today’s energy and focus time, add one Anchor in Today, then see it return to Home ready for Focus.',
        note: 'Nothing is created until you choose it.',
      },
    },
    journey: [
      { label: 'Plan', detail: 'Capacity + one Anchor' },
      { label: 'Focus', detail: 'Protect one intention' },
      { label: 'Tend', detail: 'Do the honest minimum' },
      { label: 'Close', detail: 'Keep one useful line' },
    ],
    concepts: [
      { term: 'Capacity', definition: 'A limit for the day, not a target to fill.' },
      { term: 'Anchor', definition: 'The one task that would make today count.' },
    ],
    starter: [
      { label: 'Open the day', detail: 'Choose your energy and available time.' },
      { label: 'Add one Anchor', detail: 'Place the work that matters in Today.' },
      { label: 'Enter Focus', detail: 'Use the next move waiting on Home.' },
    ],
  },
  home: {
    title: 'A day with room to breathe.',
    description: 'See what is true, then make one quiet move.',
    dailyRituals: 'Daily rituals',
    morningPlan: 'Morning plan',
    reviewMorningPlan: 'Review morning plan',
    closeDay: 'Close day',
    dayClosed: 'Day closed',
    arc: {
      title: 'Day Arc',
      description: 'A factual trace of today, not a score.',
      progressLabel: 'Completed stages in today’s arc',
      stages: {
        shape: 'Shape',
        focus: 'Focus',
        tend: 'Tend',
        close: 'Close',
      },
      actions: {
        shape: 'Open Today',
        focus: 'Open Focus',
        tend: 'Open Habits',
        close: 'Close the day',
        closed: 'Open today’s note',
      },
      tasksPlaced: (count: number) => `${count} ${count === 1 ? 'task' : 'tasks'} placed`,
      noPlan: 'No plan recorded',
      noAnchor: 'Day opened · no Anchor yet',
      focusRecorded: (minutes: string) => `${minutes} recorded`,
      noSession: 'No session recorded',
      habitsChecked: (checked: number, total: number) => `${checked} of ${total} habits checked`,
      noHabits: 'No habits added',
      noteWaiting: 'A note is waiting',
      noClosingNote: 'No closing note yet',
    },
    quietMove: {
      label: 'Next quiet move',
      readyToCloseTitle: 'The day is ready to close.',
      readyToCloseDetail: 'Leave one honest line while the shape of the day is still clear.',
      closeAction: 'Close the day',
      closedTitle: 'The day is closed.',
      closedDetail: 'Nothing else needs to be optimized. Your note remains available when you want it.',
      openNoteAction: 'Open today’s note',
      shapeTitle: 'Give the day a believable shape.',
      shapeDetail: 'Set a capacity and choose one anchor before adding more.',
      morningPlanAction: 'Morning plan',
      chooseAnchorTitle: 'Choose the work that would make today count.',
      chooseAnchorDetail: 'Your capacity is set. Add one Anchor in Today before anything else.',
      addAnchorAction: 'Add an Anchor',
      anchorDetail: (category: string, minutes: string) => `${category} · ${minutes} · today’s anchor`,
      anchorDetailWithoutCategory: (minutes: string) => `${minutes} · today’s anchor`,
      focusAnchorAction: 'Focus this anchor',
      anchorReady: 'Your first plan is ready. This is how Nook turns an Anchor into the next move.',
      chooseTaskTitle: 'Choose the next useful task.',
      remainingTasks: (count: number) => `${count} ${count === 1 ? 'task remains' : 'tasks remain'}, with no unfinished anchor.`,
      reviewTodayAction: 'Review today',
      tendTitle: 'Tend one small thing.',
      tendDetail: 'The task list is clear. A minimum version is enough.',
      openHabitsAction: 'Open habits',
      noteTitle: 'Leave a breadcrumb.',
      noteDetail: 'One line is enough to make the day easier to remember.',
    },
    compass: {
      title: 'Weekly Compass',
      description: 'A seven-day view assembled only from records on this device.',
      linksLabel: 'Open the source view for each weekly measure',
      actions: {
        tasks: 'Open completed tasks in Today',
        focus: 'Open seven-day Focus history',
        habits: 'Open the seven-day Habits rhythm',
        notes: 'Open the Notes archive',
      },
      revealAfter: (count: number) => `Add ${count} more ${count === 1 ? 'day' : 'days'} to reveal a weekly pattern.`,
      recordedDays: (observed: number, minimum: number) => `${observed} of ${minimum} recorded days available. Nook will not infer a pattern early.`,
      activeDays: (count: number) => `${count} active days are represented in this seven-day window.`,
      tasksCompleted: 'Tasks completed',
      focusRecorded: 'Focus recorded',
      habitCheckIns: 'Habit check-ins',
      noteDays: 'Note days',
    },
  },
  today: {
    title: 'Make the day believable.',
    description: 'One anchor, useful support, and optional work only if there is room.',
    capacity: {
      title: 'Daily capacity',
      fits: (minutes: number) => `${minutes} minutes of room remain.`,
      over: (minutes: number) => `${minutes} minutes over capacity.`,
      available: 'Available minutes',
      plannedAvailable: (planned: string, available: string) => `${planned} planned, ${available} available`,
      completed: (minutes: string) => `${minutes} completed today`,
    },
    capture: {
      title: 'Quick capture',
      description: 'Give the task a name, a realistic duration, and a place in today.',
      closeLabel: 'Close add task',
      task: 'Task',
      taskPlaceholder: 'What needs a place today?',
      category: 'Category',
      categoryPlaceholder: 'Personal',
      minutes: 'Minutes',
      lane: 'Lane',
      addTask: 'Add task',
    },
    firstAnchor: {
      title: 'Start with one Anchor.',
      description: 'Name the task that would make today count and estimate it honestly. Support and Optional work can come later.',
      laneGuide: 'Anchor leads the day. Support helps it. Optional can wait.',
    },
    lanes: {
      anchor: {
        label: 'Anchor',
        description: 'The work that would make today count.',
      },
      support: {
        label: 'Support',
        description: 'Useful work that keeps the day moving.',
      },
      optional: {
        label: 'Optional',
        description: 'Good to do only if there is room.',
      },
      fallback: 'Task lane',
    },
    taskA11y: {
      markIncomplete: (title: string) => `Mark ${title} incomplete`,
      complete: (title: string) => `Complete ${title}`,
      lane: (title: string, lane: string) => `Lane for ${title}: ${lane}`,
      focus: (title: string) => `Focus on ${title}`,
      delete: (title: string) => `Delete ${title}`,
    },
    emptyLane: 'Nothing placed here today.',
  },
  habits: {
    title: 'Small enough to keep.',
    description: 'Track the rhythm without turning a missed day into a verdict.',
    checkedToday: (checked: number, total: number) => `${checked} of ${total} checked today`,
    minimumTitle: 'Today’s minimum versions',
    minimumDescription: 'The smallest honest version still counts.',
    checkToday: (label: string) => `Check ${label} for today`,
    uncheckToday: (label: string) => `Uncheck ${label} for today`,
    empty: 'No habits yet. Add one with a minimum version you can keep on a difficult day.',
    rhythm: {
      title: 'Seven-day rhythm',
      description: 'Each consecutive check-in grows one fruit. Keep seven and the tree holds its flame.',
      listLabel: 'Habit trees and current streaks',
      streak: (count: number) => count === 0
        ? 'No fruit yet'
        : count >= 7
          ? 'Seven days held'
          : `${count} ${count === 1 ? 'day' : 'days'} held`,
      noRecord: 'no record',
      checked: 'checked',
      notChecked: 'not checked',
      cell: (habit: string, date: string, state: string) => `${habit}, ${date}: ${state}`,
      toggleToday: (cell: string) => `${cell}. Toggle today.`,
      empty: 'The rhythm will appear after the first habit is added.',
    },
    add: {
      title: 'Add a habit',
      description: 'Name the habit and the version that still works on a low-energy day.',
      name: 'Habit name',
      namePlaceholder: 'Name a repeatable action',
      minimum: 'Minimum version',
      minimumPlaceholder: 'What is the smallest honest version?',
      action: 'Add habit',
    },
  },
  focus: {
    title: 'Protect one clear intention.',
    description: 'The timer holds the boundary. Loose thoughts can wait in the distraction pad.',
    sessionRunning: 'Session running',
    timer: {
      title: 'Focus timer',
      presetsLabel: 'Focus duration presets',
      remaining: (time: string) => `${time} remaining`,
      intention: 'Intention',
      intentionPlaceholder: 'What gets your full attention?',
      start: 'Start focus',
      pause: 'Pause',
      resume: 'Resume focus',
      reset: 'Reset focus timer',
      status: (status: string) => `Focus timer ${status}.`,
      ready: 'ready',
      running: 'running',
      paused: 'paused',
    },
    distractions: {
      title: 'Distraction pad',
      description: 'Capture it without leaving the session.',
      label: 'Waiting thought',
      placeholder: 'Park a thought for later',
      add: 'Add distraction',
      remove: (thought: string) => `Remove distraction: ${thought}`,
      empty: 'Nothing is waiting here.',
    },
    sessionNote: {
      title: 'Session note',
      description: 'Keep the useful residue from this block.',
      label: 'Focus session note',
      placeholder: 'What changed, clarified, or should continue next time?',
    },
    history: {
      title: 'Seven-day focus history',
      description: 'Completed session minutes, recorded on this device.',
      noSessions: 'No sessions',
      chartLabel: 'Focus minutes for the last seven days',
      dayMinutes: (date: string, minutes: string) => `${date}: ${minutes}`,
      completed: (count: number) => `${count} completed ${count === 1 ? 'session' : 'sessions'} in this window.`,
      empty: 'No completed focus sessions are recorded in this seven-day window.',
    },
  },
  notes: {
    title: 'A page for each day.',
    description: 'Search the archive, choose a date, and keep the note on this device.',
    date: 'Note date',
    localNote: 'Local note',
    dailyNote: (date: string) => `Daily note for ${date}`,
    placeholder: 'Write one line worth finding again. Markdown is welcome.',
    saveNote: 'Changes stay on this device.',
    archive: {
      title: 'Archive',
      datedNotes: (count: number) => `${count} dated ${count === 1 ? 'note' : 'notes'}`,
      searchLabel: 'Search notes',
      searchPlaceholder: 'Search dates or words',
      emptyNote: 'Empty note',
      noMatch: 'No notes match this search.',
      empty: 'No dated notes yet.',
    },
    templates: {
      title: 'Note templates',
      description: 'Templates add structure only. They do not generate content or send note text away.',
      morningPlan: {
        label: 'Morning plan',
        description: 'Name the anchor, the support, and what can wait.',
        content: '## Morning plan\n\n**Anchor**\n\n**Support**\n\n**What can wait**\n',
      },
      closeDay: {
        label: 'Close the day',
        description: 'Record what moved, what did not, and what to release.',
        content: '## Close the day\n\n**What moved**\n\n**What felt difficult**\n\n**What I can release**\n',
      },
      weeklyReflection: {
        label: 'Weekly reflection',
        description: 'Review the week using only what was recorded.',
        content: '## Weekly reflection\n\n**What had momentum**\n\n**What asked for too much**\n\n**One adjustment for next week**\n',
      },
    },
  },
  premium: {
    sectionLabel: (title?: string) => title ? `${title}, premium preview` : 'Premium preview',
    replan: {
      title: 'Local Replan',
      description: 'Nook explains the overload, then moves Optional work first and Support work second. The Anchor stays put.',
      overCapacity: (minutes: number) => `${minutes} minutes over today’s capacity. No calendar or cloud service is involved.`,
      fits: 'Today fits the capacity you set. Replan will wait until it has a real reason.',
      action: 'Replan overflow',
    },
    routine: {
      title: 'Routine Designer',
      description: 'Tune the version of each habit that still works on a low-energy day. Changes stay local.',
      minimumFor: (habit: string) => `Minimum version for ${habit}`,
      empty: 'Add a habit before tuning its minimum version.',
    },
    profiles: {
      title: 'Focus profiles',
      description: 'Choose a repeatable local profile. Native app shielding and offline soundscapes come in the mobile wave.',
      groupLabel: 'Premium focus profiles',
      reset: 'Reset',
      steady: 'Steady',
      deep: 'Deep',
      immersion: 'Immersion',
    },
  },
  dialogs: {
    energy: {
      low: { label: 'Low', description: 'Keep the list light.' },
      steady: { label: 'Steady', description: 'A measured working rhythm.' },
      bright: { label: 'Bright', description: 'Room for something ambitious.' },
    },
    morning: {
      closeLabel: 'Close morning plan',
      kicker: 'Morning plan',
      title: 'Make room for what fits.',
      description: 'Set an honest pace before choosing what belongs in today.',
      energyLegend: 'How is your energy?',
      focusTime: 'Available focus time',
      minutes: 'minutes',
      hint: 'A limit, not a target.',
      cancel: 'Not now',
      submit: 'Plan the day',
    },
    closeDay: {
      closeLabel: 'Close end-of-day reflection',
      kicker: 'Close the day',
      title: 'Leave the day where it is.',
      description: 'Keep one useful thought. The rest can wait for tomorrow.',
      reflection: 'Closing reflection',
      placeholder: 'What felt worth carrying forward?',
      hint: 'Optional and stored only on this device.',
      energyLegend: 'How are you ending the day?',
      cancel: 'Keep today open',
      submit: 'Close today',
    },
    backup: {
      closeLabel: 'Close settings',
      settingsKicker: 'Settings',
      settingsTitle: 'Nook, set up for you.',
      settingsDescription: 'Choose a language, revisit the short introduction, or manage the data stored on this device.',
      kicker: 'Local backup',
      title: 'Your data stays with you.',
      description: 'Nook uses no account or cloud sync. Export and import use a JSON file you control; nothing is uploaded.',
      privacyNote: 'Export a current copy before importing another file or resetting this device.',
      exportTitle: 'Export backup',
      exportDescription: 'Save a private JSON copy.',
      importTitle: 'Import backup',
      importDescription: 'Choose a Nook JSON file.',
      resetTitle: 'Start fresh on this device',
      resetDescription: 'This removes Nook data here. It cannot be undone without a backup.',
      resetAction: 'Reset local data',
      languageTitle: 'Language',
      languageDescription: 'Choose the language used throughout Nook.',
      replayTitle: 'First-run introduction',
      replayDescription: 'Replay the three-step introduction. Your current data stays in place.',
      replayAction: 'Replay onboarding',
    },
    quickActions: {
      kicker: 'Quick actions',
      title: 'Where should the day move?',
      openMorning: 'Open Morning Plan',
      reviewToday: 'Review Today',
      startFocus: 'Start a Focus block',
      closeDay: 'Close the Day',
      backup: 'Backup & privacy',
    },
    importConfirm: {
      kicker: 'Review backup',
      title: 'Replace data on this device?',
      description: (tasks: number, habits: number, notes: number) => `Nook will keep a recovery copy first. The imported file contains ${tasks} tasks, ${habits} habits, and ${notes} dated notes.`,
      keep: 'Keep current data',
      replace: 'Replace with backup',
    },
    resetConfirm: {
      kicker: 'Local reset',
      title: 'Start with an empty Nook?',
      description: 'This removes the current tasks, history, habits, and notes from this browser. Export first if you need a durable copy.',
      keep: 'Keep my data',
      reset: 'Reset local data',
    },
  },
  footer: {
    privacy: 'No account. No cloud. No tracking.',
    save: {
      loading: 'Checking local storage…',
      saving: 'Saving on this device…',
      saved: 'Saved on this device',
      error: 'Save unavailable · export a backup',
    },
    quickActions: 'Ctrl/⌘ K · Quick actions',
  },
  messages: {
    readError: 'Saved data could not be read. It is preserved; import a backup or reset to resume saving.',
    saveError: 'Could not save on this device. Keep this tab open and export a backup.',
    focusComplete: 'Focus session complete. The real minutes are in your rhythm.',
    anchorSet: (movedPrevious: boolean) => movedPrevious
      ? 'Anchor set. The previous Anchor moved to Support.'
      : 'Anchor set for today.',
    anchorReady: 'Your Anchor is now the next quiet move on Home.',
    taskAdded: 'Task added to today.',
    taskRestored: 'Task restored.',
    taskRemoved: 'Task removed. Undo is available for a moment.',
    morningSaved: 'Morning plan saved on this device.',
    morningNextAnchor: 'Day opened. Add one Anchor next.',
    dayClosed: 'Today is closed. Nothing else needs to be optimized.',
    habitAdded: 'Habit added with a minimum version.',
    alreadyFits: 'Today already fits inside the capacity you set.',
    anchorOverload: 'The overload is in the Anchor. Nook will not move it without your choice.',
    previousPlanRestored: 'Previous day plan restored.',
    replanMoved: (count: number) => `Local Replan moved ${count} ${count === 1 ? 'task' : 'tasks'} to tomorrow.`,
    templateAdded: 'Template added to this local note.',
    backupExported: 'Private backup exported.',
    invalidBackup: 'That file is not a valid Nook backup. Choose an exported JSON backup.',
    previousDataRestored: 'Previous local data restored.',
    backupImported: 'Backup imported. Undo is available for a moment.',
    dataReset: 'Local Nook data reset. Undo is available for a moment.',
  },
} as const;

type WidenCopy<T> = T extends (...args: infer Args) => infer Result
  ? (...args: Args) => WidenCopy<Result>
  : T extends string
    ? string
    : T extends object
      ? { readonly [Key in keyof T]: WidenCopy<T[Key]> }
      : T;

export type NookCopy = WidenCopy<typeof englishCopy>;

const vietnameseCopy = {
  common: {
    productName: 'Nook',
    tagline: 'Một ngày rõ việc, nhẹ đầu.',
    local: 'Trên thiết bị',
    ownerPreview: 'Bản xem trước',
    premiumPreview: 'Xem trước Premium · lưu trên thiết bị',
    actions: {
      add: 'Thêm',
      back: 'Quay lại',
      cancel: 'Hủy',
      closeDialog: 'Đóng hộp thoại',
      continue: 'Tiếp tục',
      delete: 'Xóa',
      notNow: 'Lúc khác',
      save: 'Lưu',
      undo: 'Hoàn tác',
    },
    units: {
      minuteShort: 'phút',
      minutes: 'phút',
      words: (count: number) => `${count} từ`,
      tasks: (count: number) => `${count} công việc`,
      habits: (count: number) => `${count} thói quen`,
      notes: (count: number) => `${count} ghi chú`,
      days: (count: number) => `${count} ngày`,
      sessions: (count: number) => `${count} phiên`,
    },
  },
  nav: {
    labels: {
      today: 'Hôm nay',
      habits: 'Thói quen',
      home: 'Trang chủ',
      focus: 'Tập trung',
      notes: 'Ghi chú',
    },
    openHome: 'Mở trang chủ Nook',
    currentView: 'Mục đang mở',
    appControls: 'Các nút điều khiển Nook',
    sections: 'Các mục trong Nook',
    useLightTheme: 'Chuyển sang giao diện sáng',
    useDarkTheme: 'Chuyển sang giao diện tối',
    openSettings: 'Mở cài đặt',
    focusTimerRunning: 'Bộ hẹn giờ tập trung đang chạy',
  },
  loading: {
    opening: 'Đang mở Nook…',
  },
  onboarding: {
    dialogLabel: 'Làm quen với Nook',
    languageLabel: 'Chọn ngôn ngữ',
    languageNames: {
      en: 'English',
      vi: 'Tiếng Việt',
    },
    skip: 'Để sau',
    back: 'Quay lại',
    next: 'Tiếp tục',
    finish: 'Mở kế hoạch hôm nay',
    progressLabel: 'Các bước làm quen với Nook',
    journeyLabel: 'Cách một ngày diễn ra trong Nook',
    starterLabel: 'Ba việc đầu tiên nên làm trong Nook',
    stepStatus: (current: number, total: number) => `Bước ${current}/${total}`,
    steps: {
      welcome: {
        title: 'Sắp xếp hôm nay cho vừa sức.',
        description: 'Nook giúp bạn nhìn đúng quỹ thời gian mình có và chọn việc nên làm tiếp—không cần tài khoản, không đưa dữ liệu lên mạng.',
        note: 'Mất khoảng 2 phút. Mọi dữ liệu đều nằm trên thiết bị này.',
      },
      shape: {
        title: 'Mỗi ngày đi qua bốn bước.',
        description: 'Lên kế hoạch vừa sức, chọn một việc chính, giữ thói quen ở mức tối thiểu rồi tổng kết ngày.',
        note: 'Trang chủ luôn chỉ ra việc nên làm tiếp.',
      },
      ready: {
        title: 'Bắt đầu ngay với hôm nay.',
        description: 'Chọn mức năng lượng và quỹ thời gian, thêm một việc chính ở mục Hôm nay, rồi bắt đầu tập trung từ Trang chủ.',
        note: 'Nook chỉ lưu những gì bạn tự nhập.',
      },
    },
    journey: [
      { label: 'Lên kế hoạch', detail: 'Quỹ thời gian + một việc chính' },
      { label: 'Tập trung', detail: 'Làm trọn một việc' },
      { label: 'Giữ nhịp', detail: 'Làm ở mức tối thiểu' },
      { label: 'Tổng kết', detail: 'Ghi lại điều đáng nhớ' },
    ],
    concepts: [
      { term: 'Quỹ thời gian', definition: 'Khoảng thời gian thực tế bạn có hôm nay, không phải mục tiêu cần dùng hết.' },
      { term: 'Việc chính', definition: 'Việc quan trọng nhất trong ngày.' },
    ],
    starter: [
      { label: 'Bắt đầu ngày', detail: 'Chọn mức năng lượng và quỹ thời gian.' },
      { label: 'Thêm một việc chính', detail: 'Đưa việc quan trọng nhất vào mục Hôm nay.' },
      { label: 'Bắt đầu tập trung', detail: 'Mở việc tiếp theo từ Trang chủ.' },
    ],
  },
  home: {
    title: 'Hôm nay, làm gì tiếp?',
    description: 'Nắm nhanh tình hình và đi thẳng đến bước cần làm.',
    dailyRituals: 'Bắt đầu và tổng kết ngày',
    morningPlan: 'Lên kế hoạch',
    reviewMorningPlan: 'Xem lại kế hoạch',
    closeDay: 'Tổng kết ngày',
    dayClosed: 'Đã tổng kết',
    arc: {
      title: 'Hành trình hôm nay',
      description: 'Bốn bước để định hướng, không phải để chấm điểm.',
      progressLabel: 'Tiến độ bốn bước hôm nay',
      stages: {
        shape: 'Lên kế hoạch',
        focus: 'Tập trung',
        tend: 'Giữ thói quen',
        close: 'Tổng kết',
      },
      actions: {
        shape: 'Sang mục Hôm nay',
        focus: 'Sang mục Tập trung',
        tend: 'Sang mục Thói quen',
        close: 'Tổng kết hôm nay',
        closed: 'Mở ghi chú hôm nay',
      },
      tasksPlaced: (count: number) => `Đã xếp ${count} việc`,
      noPlan: 'Chưa lên kế hoạch',
      noAnchor: 'Đã bắt đầu ngày · chưa chọn việc chính',
      focusRecorded: (minutes: string) => `${minutes} tập trung`,
      noSession: 'Chưa có phiên tập trung',
      habitsChecked: (checked: number, total: number) => `Đã làm ${checked}/${total}`,
      noHabits: 'Chưa thêm thói quen',
      noteWaiting: 'Có ghi chú để xem lại',
      noClosingNote: 'Chưa tổng kết ngày',
    },
    quietMove: {
      label: 'Việc nên làm tiếp',
      readyToCloseTitle: 'Đến lúc tổng kết hôm nay.',
      readyToCloseDetail: 'Ghi lại một điều đáng nhớ khi hôm nay vẫn còn rõ.',
      closeAction: 'Tổng kết ngày',
      closedTitle: 'Hôm nay đã xong.',
      closedDetail: 'Bạn không cần làm thêm gì. Ghi chú hôm nay vẫn ở đó khi muốn xem lại.',
      openNoteAction: 'Mở ghi chú hôm nay',
      shapeTitle: 'Lên một kế hoạch vừa sức.',
      shapeDetail: 'Chọn quỹ thời gian và một việc chính trước khi thêm việc khác.',
      morningPlanAction: 'Lên kế hoạch',
      chooseAnchorTitle: 'Chọn việc quan trọng nhất hôm nay.',
      chooseAnchorDetail: 'Quỹ thời gian đã có. Bây giờ hãy thêm một việc chính ở mục Hôm nay.',
      addAnchorAction: 'Thêm việc chính',
      anchorDetail: (category: string, minutes: string) => `${category} · ${minutes} · việc chính hôm nay`,
      anchorDetailWithoutCategory: (minutes: string) => `${minutes} · việc chính hôm nay`,
      focusAnchorAction: 'Bắt đầu tập trung',
      anchorReady: 'Kế hoạch đã sẵn sàng. Việc chính đang chờ ở bước tiếp theo.',
      chooseTaskTitle: 'Chọn việc nên làm tiếp.',
      remainingTasks: (count: number) => `Còn ${count} việc chưa xong và không còn việc chính nào đang chờ.`,
      reviewTodayAction: 'Mở danh sách hôm nay',
      tendTitle: 'Giữ một thói quen nhỏ.',
      tendDetail: 'Các việc đã xong. Hôm nay chỉ cần làm thói quen ở mức tối thiểu.',
      openHabitsAction: 'Xem thói quen',
      noteTitle: 'Ghi lại một dòng.',
      noteDetail: 'Một dòng là đủ để sau này nhớ lại hôm nay.',
    },
    compass: {
      title: 'Nhìn lại 7 ngày',
      description: 'Tổng hợp từ những gì đã được ghi trên thiết bị này.',
      linksLabel: 'Mở mục liên quan đến từng số liệu trong 7 ngày',
      actions: {
        tasks: 'Mở các việc đã hoàn thành trong mục Hôm nay',
        focus: 'Mở lịch sử 7 ngày trong mục Tập trung',
        habits: 'Mở nhịp 7 ngày trong mục Thói quen',
        notes: 'Mở kho ghi chú',
      },
      revealAfter: (count: number) => `Cần thêm ${count} ngày để hiện xu hướng 7 ngày.`,
      recordedDays: (observed: number, minimum: number) => `Đã có dữ liệu của ${observed}/${minimum} ngày. Nook sẽ đợi đủ dữ liệu.`,
      activeDays: (count: number) => `${count} ngày có hoạt động trong 7 ngày gần đây.`,
      tasksCompleted: 'Việc đã hoàn thành',
      focusRecorded: 'Thời gian tập trung',
      habitCheckIns: 'Lần làm thói quen',
      noteDays: 'Ngày có ghi chú',
    },
  },
  today: {
    title: 'Xếp hôm nay cho vừa sức.',
    description: 'Chọn một việc chính, thêm việc hỗ trợ, còn việc khác có thể để sau.',
    capacity: {
      title: 'Quỹ thời gian hôm nay',
      fits: (minutes: number) => `Còn ${minutes} phút chưa xếp.`,
      over: (minutes: number) => `Kế hoạch đang vượt ${minutes} phút.`,
      available: 'Thời gian có thể dành',
      plannedAvailable: (planned: string, available: string) => `Đã xếp ${planned} / ${available}`,
      completed: (minutes: string) => `${minutes} đã hoàn thành hôm nay`,
    },
    capture: {
      title: 'Thêm việc',
      description: 'Đặt tên, ước lượng thời lượng thực tế và chọn vị trí phù hợp trong ngày.',
      closeLabel: 'Đóng cửa sổ thêm việc',
      task: 'Tên việc',
      taskPlaceholder: 'Hôm nay cần làm gì?',
      category: 'Nhóm',
      categoryPlaceholder: 'Cá nhân',
      minutes: 'Thời lượng',
      lane: 'Xếp vào',
      addTask: 'Thêm việc',
    },
    firstAnchor: {
      title: 'Bắt đầu với một việc chính.',
      description: 'Chọn việc quan trọng nhất và ước lượng thời gian thực tế. Việc hỗ trợ và việc thêm có thể xếp sau.',
      laneGuide: 'Việc chính làm trước. Việc hỗ trợ giúp ngày trôi chảy. Việc thêm có thể để sau.',
    },
    lanes: {
      anchor: {
        label: 'Việc chính',
        description: 'Việc quan trọng nhất hôm nay.',
      },
      support: {
        label: 'Việc hỗ trợ',
        description: 'Những việc cần thiết để ngày trôi chảy.',
      },
      optional: {
        label: 'Nếu còn thời gian',
        description: 'Làm khi vẫn còn thời gian và năng lượng.',
      },
      fallback: 'Nhóm ưu tiên',
    },
    taskA11y: {
      markIncomplete: (title: string) => `Đánh dấu “${title}” là chưa xong`,
      complete: (title: string) => `Đánh dấu “${title}” là đã xong`,
      lane: (title: string, lane: string) => `Xếp “${title}” vào ${lane}`,
      focus: (title: string) => `Tập trung vào ${title}`,
      delete: (title: string) => `Xóa ${title}`,
    },
    emptyLane: 'Chưa có việc nào.',
  },
  habits: {
    title: 'Nhỏ thôi, nhưng làm được.',
    description: 'Theo dõi sự đều đặn mà không tự trách vì một ngày bỏ lỡ.',
    checkedToday: (checked: number, total: number) => `Hôm nay: ${checked}/${total} thói quen`,
    minimumTitle: 'Mức tối thiểu hôm nay',
    minimumDescription: 'Ngày khó vẫn làm được mức này là đủ.',
    checkToday: (label: string) => `Đánh dấu đã làm ${label} hôm nay`,
    uncheckToday: (label: string) => `Bỏ đánh dấu ${label} hôm nay`,
    empty: 'Chưa có thói quen. Hãy bắt đầu bằng một việc nhỏ mà ngày mệt vẫn làm được.',
    rhythm: {
      title: 'Nhịp 7 ngày',
      description: 'Mỗi ngày giữ được nhịp, cây mọc thêm một quả. Đủ 7 quả, ngọn lửa sẽ xuất hiện.',
      listLabel: 'Cây thói quen và chuỗi ngày hiện tại',
      streak: (count: number) => count === 0
        ? 'Chưa có quả'
        : count >= 7
          ? 'Đã giữ trọn 7 ngày'
          : `Đã giữ nhịp ${count} ngày`,
      noRecord: 'chưa ghi nhận',
      checked: 'đã làm',
      notChecked: 'chưa làm',
      cell: (habit: string, date: string, state: string) => `${habit}, ${date}: ${state}`,
      toggleToday: (cell: string) => `${cell}. Nhấn để đổi trạng thái hôm nay.`,
      empty: 'Nhịp 7 ngày sẽ xuất hiện sau khi bạn thêm thói quen đầu tiên.',
    },
    add: {
      title: 'Thêm thói quen',
      description: 'Chọn một hành động lặp lại và mức tối thiểu cho những ngày ít năng lượng.',
      name: 'Tên thói quen',
      namePlaceholder: 'Ví dụ: Đọc sách, đi bộ, uống nước',
      minimum: 'Mức tối thiểu',
      minimumPlaceholder: 'Ngày mệt nhất, bạn vẫn làm được gì?',
      action: 'Thêm thói quen',
    },
  },
  focus: {
    title: 'Chỉ tập trung vào một việc.',
    description: 'Đặt thời gian cho việc đang làm. Ý nghĩ chen ngang có thể ghi lại để xử lý sau.',
    sessionRunning: 'Đang tập trung',
    timer: {
      title: 'Hẹn giờ tập trung',
      presetsLabel: 'Chọn thời lượng tập trung',
      remaining: (time: string) => `Còn ${time}`,
      intention: 'Việc đang làm',
      intentionPlaceholder: 'Bạn muốn hoàn thành điều gì trong phiên này?',
      start: 'Bắt đầu',
      pause: 'Tạm dừng',
      resume: 'Tiếp tục',
      reset: 'Đặt lại bộ hẹn giờ',
      status: (status: string) => `Bộ hẹn giờ đang ở trạng thái ${status}.`,
      ready: 'sẵn sàng',
      running: 'đang chạy',
      paused: 'tạm dừng',
    },
    distractions: {
      title: 'Để lại cho sau',
      description: 'Ghi nhanh rồi quay lại việc đang làm.',
      label: 'Ý nghĩ chen ngang',
      placeholder: 'Ghi lại để không phải nhớ',
      add: 'Ghi lại',
      remove: (thought: string) => `Xóa khỏi danh sách: ${thought}`,
      empty: 'Chưa có gì để lại cho sau.',
    },
    sessionNote: {
      title: 'Ghi lại sau phiên',
      description: 'Giữ một điều hữu ích cho lần tiếp theo.',
      label: 'Ghi chú của phiên',
      placeholder: 'Điều gì đã rõ hơn? Lần tới nên tiếp tục từ đâu?',
    },
    history: {
      title: '7 ngày tập trung',
      description: 'Thời gian của các phiên đã hoàn thành và lưu trên thiết bị này.',
      noSessions: 'Chưa có phiên',
      chartLabel: 'Số phút tập trung trong 7 ngày gần nhất',
      dayMinutes: (date: string, minutes: string) => `${date}: ${minutes}`,
      completed: (count: number) => `${count} phiên đã hoàn thành trong 7 ngày này.`,
      empty: 'Chưa có phiên tập trung nào hoàn thành trong 7 ngày gần đây.',
    },
  },
  notes: {
    title: 'Mỗi ngày, một trang ghi chú.',
    description: 'Chọn ngày, ghi lại điều cần nhớ và tìm lại bất cứ lúc nào.',
    date: 'Ngày ghi chú',
    localNote: 'Ghi chú trên thiết bị',
    dailyNote: (date: string) => `Ghi chú ngày ${date}`,
    placeholder: 'Viết một điều bạn sẽ muốn tìm lại. Có thể dùng Markdown.',
    saveNote: 'Nội dung được lưu trên thiết bị này.',
    archive: {
      title: 'Kho ghi chú',
      datedNotes: (count: number) => `${count} ghi chú theo ngày`,
      searchLabel: 'Tìm ghi chú',
      searchPlaceholder: 'Tìm theo ngày hoặc từ khóa',
      emptyNote: 'Ghi chú trống',
      noMatch: 'Không tìm thấy ghi chú phù hợp.',
      empty: 'Chưa có ghi chú theo ngày.',
    },
    templates: {
      title: 'Mẫu ghi chú',
      description: 'Mẫu chỉ tạo sẵn bố cục; Nook không tự viết hay gửi nội dung đi đâu.',
      morningPlan: {
        label: 'Kế hoạch đầu ngày',
        description: 'Ghi việc chính, việc hỗ trợ và những gì có thể để sau.',
        content: '## Kế hoạch đầu ngày\n\n**Việc chính**\n\n**Việc hỗ trợ**\n\n**Có thể để sau**\n',
      },
      closeDay: {
        label: 'Tổng kết ngày',
        description: 'Ghi lại điều đã làm được, điều còn dang dở và điều có thể bỏ qua.',
        content: '## Tổng kết ngày\n\n**Điều đã làm được**\n\n**Điều còn dang dở**\n\n**Điều có thể bỏ qua**\n',
      },
      weeklyReflection: {
        label: 'Nhìn lại tuần',
        description: 'Nhìn lại tuần từ những gì bạn đã ghi.',
        content: '## Nhìn lại tuần\n\n**Điều đang tiến triển tốt**\n\n**Điều khiến mình quá tải**\n\n**Một thay đổi cho tuần tới**\n',
      },
    },
  },
  premium: {
    sectionLabel: (title?: string) => title ? `${title}, bản xem trước Premium` : 'Bản xem trước Premium',
    replan: {
      title: 'Xếp lại kế hoạch',
      description: 'Nook giải thích vì sao kế hoạch quá tải, rồi chuyển việc “Nếu còn thời gian” trước và việc hỗ trợ sau. Việc chính vẫn giữ nguyên.',
      overCapacity: (minutes: number) => `Kế hoạch hôm nay đang vượt ${minutes} phút. Nook không dùng lịch hay dữ liệu trên mạng.`,
      fits: 'Kế hoạch hiện vẫn nằm trong quỹ thời gian. Chưa cần xếp lại.',
      action: 'Xếp lại việc quá tải',
    },
    routine: {
      title: 'Điều chỉnh thói quen',
      description: 'Đặt mức tối thiểu cho từng thói quen để ngày ít năng lượng vẫn làm được. Mọi thay đổi chỉ lưu trên thiết bị này.',
      minimumFor: (habit: string) => `Mức tối thiểu của ${habit}`,
      empty: 'Hãy thêm một thói quen trước khi đặt mức tối thiểu.',
    },
    profiles: {
      title: 'Chế độ tập trung',
      description: 'Chọn một thời lượng để dùng lại trên thiết bị này. Chặn ứng dụng và âm thanh ngoại tuyến sẽ có ở bản di động.',
      groupLabel: 'Các chế độ tập trung Premium',
      reset: 'Làm lại từ đầu',
      steady: 'Đều đặn',
      deep: 'Tập trung sâu',
      immersion: 'Đắm mình',
    },
  },
  dialogs: {
    energy: {
      low: { label: 'Hơi đuối', description: 'Giữ kế hoạch thật gọn.' },
      steady: { label: 'Vừa sức', description: 'Đủ cho một nhịp làm việc đều.' },
      bright: { label: 'Nhiều năng lượng', description: 'Có thể nhận một việc khó.' },
    },
    morning: {
      closeLabel: 'Đóng phần lên kế hoạch',
      kicker: 'Lên kế hoạch',
      title: 'Hôm nay có thể làm đến đâu?',
      description: 'Chọn mức năng lượng và quỹ thời gian thực tế trước khi xếp việc.',
      energyLegend: 'Hôm nay bạn thấy thế nào?',
      focusTime: 'Quỹ thời gian tập trung',
      minutes: 'phút',
      hint: 'Đặt mức thực tế; không cần cố dùng hết.',
      cancel: 'Lúc khác',
      submit: 'Lên kế hoạch',
    },
    closeDay: {
      closeLabel: 'Đóng phần tổng kết ngày',
      kicker: 'Tổng kết ngày',
      title: 'Dừng lại một chút trước khi kết thúc ngày.',
      description: 'Ghi lại điều đáng nhớ rồi để phần còn lại sang ngày mai.',
      reflection: 'Một dòng cho hôm nay',
      placeholder: 'Hôm nay, điều gì đáng nhớ?',
      hint: 'Có thể bỏ trống. Nội dung chỉ lưu trên thiết bị này.',
      energyLegend: 'Cuối ngày, bạn thấy thế nào?',
      cancel: 'Chưa tổng kết',
      submit: 'Kết thúc hôm nay',
    },
    backup: {
      closeLabel: 'Đóng cài đặt',
      settingsKicker: 'Cài đặt',
      settingsTitle: 'Cài đặt Nook',
      settingsDescription: 'Đổi ngôn ngữ, xem lại phần hướng dẫn hoặc quản lý dữ liệu đang lưu trên thiết bị này.',
      kicker: 'Sao lưu dữ liệu',
      title: 'Dữ liệu nằm trong tay bạn.',
      description: 'Nook không dùng tài khoản và không đồng bộ lên đám mây. Bạn có thể tự xuất hoặc nhập tệp JSON; không có gì được tải lên.',
      privacyNote: 'Nên xuất một bản sao trước khi nhập tệp khác hoặc xóa dữ liệu trên thiết bị này.',
      exportTitle: 'Xuất dữ liệu',
      exportDescription: 'Lưu một bản sao dưới dạng tệp JSON.',
      importTitle: 'Nhập dữ liệu',
      importDescription: 'Chọn tệp JSON đã xuất từ Nook.',
      resetTitle: 'Bắt đầu lại trên thiết bị này',
      resetDescription: 'Thao tác này sẽ xóa dữ liệu Nook trên thiết bị. Nếu không có bản sao lưu, bạn sẽ không thể khôi phục.',
      resetAction: 'Xóa dữ liệu và bắt đầu lại',
      languageTitle: 'Ngôn ngữ',
      languageDescription: 'Chọn ngôn ngữ hiển thị trong Nook.',
      replayTitle: 'Hướng dẫn ban đầu',
      replayDescription: 'Xem lại phần giới thiệu 3 bước. Dữ liệu hiện tại vẫn được giữ nguyên.',
      replayAction: 'Xem lại hướng dẫn',
    },
    quickActions: {
      kicker: 'Thao tác nhanh',
      title: 'Bạn muốn làm gì tiếp?',
      openMorning: 'Lên kế hoạch hôm nay',
      reviewToday: 'Xem việc hôm nay',
      startFocus: 'Bắt đầu tập trung',
      closeDay: 'Tổng kết ngày',
      backup: 'Dữ liệu và sao lưu',
    },
    importConfirm: {
      kicker: 'Kiểm tra tệp nhập',
      title: 'Thay dữ liệu hiện tại?',
      description: (tasks: number, habits: number, notes: number) => `Nook sẽ giữ một bản để hoàn tác. Tệp này có ${tasks} công việc, ${habits} thói quen và ${notes} ghi chú theo ngày.`,
      keep: 'Giữ dữ liệu hiện tại',
      replace: 'Nhập và thay dữ liệu',
    },
    resetConfirm: {
      kicker: 'Xóa dữ liệu',
      title: 'Bắt đầu lại từ đầu?',
      description: 'Công việc, lịch sử, thói quen và ghi chú hiện tại sẽ bị xóa khỏi trình duyệt. Hãy xuất dữ liệu trước nếu bạn muốn giữ lại.',
      keep: 'Giữ dữ liệu hiện tại',
      reset: 'Xóa dữ liệu và bắt đầu lại',
    },
  },
  footer: {
    privacy: 'Không tài khoản · không đám mây · không theo dõi',
    save: {
      loading: 'Đang kiểm tra nơi lưu dữ liệu…',
      saving: 'Đang lưu trên thiết bị…',
      saved: 'Đã lưu trên thiết bị',
      error: 'Không thể lưu · hãy xuất dữ liệu ngay',
    },
    quickActions: 'Ctrl/⌘ K · Thao tác nhanh',
  },
  messages: {
    readError: 'Nook không đọc được dữ liệu đã lưu. Dữ liệu cũ vẫn còn; hãy nhập bản sao lưu hoặc bắt đầu lại để tiếp tục.',
    saveError: 'Nook không thể lưu trên thiết bị này. Hãy giữ trang này mở và xuất dữ liệu ngay.',
    focusComplete: 'Đã hoàn thành phiên tập trung và ghi lại thời gian thực tế.',
    anchorSet: (movedPrevious: boolean) => movedPrevious
      ? 'Đã chọn việc chính mới. Việc chính trước đó được chuyển sang việc hỗ trợ.'
      : 'Đã chọn việc chính cho hôm nay.',
    anchorReady: 'Việc chính hiện ở mục “Việc nên làm tiếp” trên Trang chủ.',
    taskAdded: 'Đã thêm việc vào hôm nay.',
    taskRestored: 'Đã khôi phục việc.',
    taskRemoved: 'Đã xóa việc. Bạn có thể hoàn tác trong vài giây.',
    morningSaved: 'Đã lưu kế hoạch hôm nay trên thiết bị này.',
    morningNextAnchor: 'Đã lưu quỹ thời gian. Tiếp theo, hãy thêm một việc chính.',
    dayClosed: 'Đã tổng kết hôm nay. Bạn không cần làm thêm gì nữa.',
    habitAdded: 'Đã thêm thói quen và mức tối thiểu.',
    alreadyFits: 'Kế hoạch hiện vẫn nằm trong quỹ thời gian.',
    anchorOverload: 'Phần vượt thời gian nằm ở việc chính. Nook sẽ không tự chuyển việc này nếu bạn chưa chọn.',
    previousPlanRestored: 'Đã khôi phục kế hoạch ngày trước đó.',
    replanMoved: (count: number) => `Đã chuyển ${count} việc sang ngày mai.`,
    templateAdded: 'Đã chèn mẫu vào ghi chú.',
    backupExported: 'Đã xuất dữ liệu ra tệp JSON.',
    invalidBackup: 'Tệp này không phải dữ liệu Nook hợp lệ. Hãy chọn tệp JSON đã xuất từ Nook.',
    previousDataRestored: 'Đã khôi phục dữ liệu trước đó.',
    backupImported: 'Đã nhập dữ liệu. Bạn có thể hoàn tác trong vài giây.',
    dataReset: 'Đã xóa dữ liệu Nook trên thiết bị. Bạn có thể hoàn tác trong vài giây.',
  },
} as const satisfies NookCopy;

export const nookCopy: Readonly<Record<Language, NookCopy>> = {
  en: englishCopy,
  vi: vietnameseCopy,
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string'
    && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function normalizeLanguage(value: unknown): Language {
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}

export function languageFromLocale(locale: string | null | undefined): Language {
  return locale?.trim().toLowerCase().startsWith('vi') ? 'vi' : DEFAULT_LANGUAGE;
}

export function getNookCopy(language: Language = DEFAULT_LANGUAGE): NookCopy {
  return nookCopy[language];
}

export type NookDateStyle = 'long' | 'archive' | 'weekdayShort';

export type PluralForms = Readonly<{
  one: string;
  other: string;
  zero?: string;
}>;

export type NookI18n = {
  language: Language;
  locale: string;
  copy: NookCopy;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDayKey: (dayKey: string, style?: NookDateStyle) => string;
  formatMinutes: (minutes: number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  plural: (count: number, forms: PluralForms) => string;
  formatCount: (count: number, forms: PluralForms) => string;
};

function parseDayKey(dayKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const value = new Date(year, month - 1, day, 12);
  return value.getFullYear() === year
    && value.getMonth() === month - 1
    && value.getDate() === day
    ? value
    : null;
}

function dateValue(value: Date | string | number): Date | null {
  if (typeof value === 'string') {
    const dayKey = parseDayKey(value);
    if (dayKey) return dayKey;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function createNookI18n(language: Language): NookI18n {
  const locale = LANGUAGE_LOCALES[language];
  const copy = getNookCopy(language);
  const numberFormatters = new Map<string, Intl.NumberFormat>();
  const dateFormatters = new Map<string, Intl.DateTimeFormat>();
  const optionsKey = (options: object | undefined) => JSON.stringify(options ?? {});
  const numberFormatter = (options?: Intl.NumberFormatOptions) => {
    const key = optionsKey(options);
    const cached = numberFormatters.get(key);
    if (cached) return cached;
    const formatter = new Intl.NumberFormat(locale, options);
    numberFormatters.set(key, formatter);
    return formatter;
  };
  const dateFormatter = (options?: Intl.DateTimeFormatOptions) => {
    const key = optionsKey(options);
    const cached = dateFormatters.get(key);
    if (cached) return cached;
    const formatter = new Intl.DateTimeFormat(locale, options);
    dateFormatters.set(key, formatter);
    return formatter;
  };
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => (
    numberFormatter(options).format(value)
  );
  const pluralRules = new Intl.PluralRules(locale);
  const plural = (count: number, forms: PluralForms) => {
    if (count === 0 && forms.zero) return forms.zero;
    return pluralRules.select(count) === 'one' ? forms.one : forms.other;
  };

  return {
    language,
    locale,
    copy,
    formatDate(value, options = { weekday: 'long', month: 'long', day: 'numeric' }) {
      const date = dateValue(value);
      return date ? dateFormatter(options).format(date) : String(value);
    },
    formatDayKey(dayKey, style = 'long') {
      const date = parseDayKey(dayKey);
      if (!date) return dayKey;
      const options: Intl.DateTimeFormatOptions = style === 'archive'
        ? { year: 'numeric', month: 'short', day: 'numeric' }
        : style === 'weekdayShort'
          ? { weekday: 'short' }
          : { weekday: 'long', month: 'long', day: 'numeric' };
      return dateFormatter(options).format(date);
    },
    formatMinutes(minutes) {
      const rounded = Math.max(0, Math.round(minutes));
      return `${formatNumber(rounded)} ${copy.common.units.minuteShort}`;
    },
    formatNumber,
    plural,
    formatCount(count, forms) {
      return `${formatNumber(count)} ${plural(count, forms)}`;
    },
  };
}

const NookI18nContext = createContext<NookI18n | null>(null);

export type NookI18nProviderProps = {
  children: ReactNode;
  language?: Language;
};

export function NookI18nProvider({ children, language = DEFAULT_LANGUAGE }: NookI18nProviderProps) {
  const value = useMemo(() => createNookI18n(language), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return <NookI18nContext.Provider value={value}>{children}</NookI18nContext.Provider>;
}

export function useNookI18n(): NookI18n {
  const context = useContext(NookI18nContext);
  if (!context) throw new Error('useNookI18n must be used inside NookI18nProvider.');
  return context;
}
