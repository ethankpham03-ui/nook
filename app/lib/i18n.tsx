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
      description: 'Check-ins only. No streak loss, ranking, or simulated history.',
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
    tagline: 'Ngày của bạn, lặng lẽ vào guồng.',
    local: 'Trên thiết bị',
    ownerPreview: 'Bản xem trước dành cho chủ ứng dụng',
    premiumPreview: 'Xem trước Premium · trên thiết bị',
    actions: {
      add: 'Thêm',
      back: 'Quay lại',
      cancel: 'Hủy',
      closeDialog: 'Đóng hộp thoại',
      continue: 'Tiếp tục',
      delete: 'Xóa',
      notNow: 'Để sau',
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
    currentView: 'Màn hình hiện tại',
    appControls: 'Điều khiển ứng dụng',
    sections: 'Các khu vực của Nook',
    useLightTheme: 'Dùng giao diện sáng',
    useDarkTheme: 'Dùng giao diện tối',
    openSettings: 'Mở cài đặt',
    focusTimerRunning: 'Bộ hẹn giờ tập trung đang chạy',
  },
  loading: {
    opening: 'Đang mở Nook trên thiết bị…',
  },
  onboarding: {
    dialogLabel: 'Chào mừng đến với Nook',
    languageLabel: 'Chọn ngôn ngữ',
    languageNames: {
      en: 'English',
      vi: 'Tiếng Việt',
    },
    skip: 'Bỏ qua lúc này',
    back: 'Quay lại',
    next: 'Tiếp tục',
    finish: 'Mở kế hoạch hôm nay',
    progressLabel: 'Tiến trình làm quen',
    journeyLabel: 'Một ngày di chuyển qua Nook như thế nào',
    starterLabel: 'Ba thao tác đầu tiên trong Nook',
    stepStatus: (current: number, total: number) => `Bước ${current} trên ${total}`,
    steps: {
      welcome: {
        title: 'Một ngày yên hơn, từng bước một.',
        description: 'Nook biến phần bạn thật sự có thể gánh hôm nay thành một bước tiếp theo rõ ràng—không tài khoản, không đám mây.',
        note: 'Khoảng hai phút. Dữ liệu luôn ở thiết bị này.',
      },
      shape: {
        title: 'Dùng Nook như một nhịp ngày.',
        description: 'Lập phần vừa sức, bảo vệ một Việc chính, duy trì phiên bản tối thiểu, rồi khép ngày.',
        note: 'Trang chủ luôn chỉ ra bước hữu ích tiếp theo.',
      },
      ready: {
        title: 'Bắt đầu bằng ngày thật, không phải bài hướng dẫn.',
        description: 'Chọn năng lượng và thời gian, thêm một Việc chính trong Hôm nay, rồi thấy việc đó trở về Trang chủ để bắt đầu Tập trung.',
        note: 'Chưa có gì được tạo trước khi bạn tự chọn.',
      },
    },
    journey: [
      { label: 'Lập ngày', detail: 'Sức chứa + một Việc chính' },
      { label: 'Tập trung', detail: 'Bảo vệ một ý định' },
      { label: 'Duy trì', detail: 'Làm phiên bản tối thiểu' },
      { label: 'Khép ngày', detail: 'Giữ lại một dòng hữu ích' },
    ],
    concepts: [
      { term: 'Sức chứa', definition: 'Giới hạn cho hôm nay, không phải mục tiêu cần lấp đầy.' },
      { term: 'Việc chính', definition: 'Một việc khiến ngày hôm nay trở nên đáng giá.' },
    ],
    starter: [
      { label: 'Mở ngày', detail: 'Chọn năng lượng và thời gian có thể dành.' },
      { label: 'Thêm một Việc chính', detail: 'Đặt việc quan trọng vào Hôm nay.' },
      { label: 'Vào Tập trung', detail: 'Dùng Bước nhẹ đang chờ trên Trang chủ.' },
    ],
  },
  home: {
    title: 'Một ngày có khoảng thở.',
    description: 'Nhìn đúng điều đang có, rồi chọn một bước đi nhẹ nhàng.',
    dailyRituals: 'Nhịp mở và khép ngày',
    morningPlan: 'Kế hoạch buổi sáng',
    reviewMorningPlan: 'Xem lại kế hoạch sáng',
    closeDay: 'Khép ngày',
    dayClosed: 'Đã khép ngày',
    arc: {
      title: 'Nhịp ngày',
      description: 'Dấu vết chân thực của hôm nay, không phải điểm số.',
      progressLabel: 'Các chặng đã hoàn thành trong nhịp ngày hôm nay',
      stages: {
        shape: 'Sắp xếp',
        focus: 'Tập trung',
        tend: 'Duy trì',
        close: 'Khép lại',
      },
      tasksPlaced: (count: number) => `Đã xếp ${count} công việc`,
      noPlan: 'Chưa có kế hoạch',
      noAnchor: 'Đã mở ngày · chưa có Việc chính',
      focusRecorded: (minutes: string) => `Đã ghi ${minutes}`,
      noSession: 'Chưa ghi phiên nào',
      habitsChecked: (checked: number, total: number) => `Đã làm ${checked} trên ${total} thói quen`,
      noHabits: 'Chưa thêm thói quen',
      noteWaiting: 'Có một ghi chú đang chờ',
      noClosingNote: 'Chưa có ghi chú cuối ngày',
    },
    quietMove: {
      label: 'Bước nhẹ tiếp theo',
      readyToCloseTitle: 'Hôm nay đã sẵn sàng để khép lại.',
      readyToCloseDetail: 'Để lại một dòng chân thật khi hình dáng ngày hôm nay vẫn còn rõ.',
      closeAction: 'Khép ngày',
      closedTitle: 'Hôm nay đã khép lại.',
      closedDetail: 'Không còn gì cần tối ưu thêm. Ghi chú vẫn ở đó khi bạn muốn xem lại.',
      openNoteAction: 'Mở ghi chú hôm nay',
      shapeTitle: 'Cho ngày hôm nay một hình dáng vừa sức.',
      shapeDetail: 'Đặt giới hạn thời gian và chọn một Việc chính trước khi thêm phần còn lại.',
      morningPlanAction: 'Kế hoạch buổi sáng',
      chooseAnchorTitle: 'Chọn việc sẽ khiến hôm nay trở nên đáng giá.',
      chooseAnchorDetail: 'Sức chứa đã rõ. Hãy thêm đúng một Việc chính trong Hôm nay trước phần còn lại.',
      addAnchorAction: 'Thêm Việc chính',
      anchorDetail: (category: string, minutes: string) => `${category} · ${minutes} · Việc chính hôm nay`,
      focusAnchorAction: 'Tập trung vào Việc chính',
      anchorReady: 'Kế hoạch đầu tiên đã sẵn sàng. Đây là cách Nook biến Việc chính thành bước tiếp theo.',
      chooseTaskTitle: 'Chọn công việc hữu ích tiếp theo.',
      remainingTasks: (count: number) => `Còn ${count} công việc và không còn Việc chính nào chưa xong.`,
      reviewTodayAction: 'Xem Hôm nay',
      tendTitle: 'Chăm một điều nhỏ.',
      tendDetail: 'Danh sách việc đã rõ. Chỉ cần làm phiên bản tối thiểu.',
      openHabitsAction: 'Mở Thói quen',
      noteTitle: 'Để lại một dấu nhỏ.',
      noteDetail: 'Một dòng là đủ để ngày hôm nay dễ được nhớ lại hơn.',
    },
    compass: {
      title: 'La bàn tuần',
      description: 'Góc nhìn bảy ngày chỉ dựa trên dữ liệu đã lưu ở thiết bị này.',
      revealAfter: (count: number) => `Ghi thêm ${count} ngày để thấy một nhịp tuần.`,
      recordedDays: (observed: number, minimum: number) => `Đã có ${observed} trên ${minimum} ngày. Nook sẽ không suy diễn khi dữ liệu còn quá ít.`,
      activeDays: (count: number) => `Có ${count} ngày hoạt động trong khoảng bảy ngày này.`,
      tasksCompleted: 'Công việc hoàn thành',
      focusRecorded: 'Tập trung đã ghi',
      habitCheckIns: 'Lượt duy trì thói quen',
      noteDays: 'Ngày có ghi chú',
    },
  },
  today: {
    title: 'Lập một ngày vừa sức.',
    description: 'Một Việc chính, những việc hỗ trợ hữu ích và việc tùy chọn chỉ khi còn chỗ.',
    capacity: {
      title: 'Sức chứa hôm nay',
      fits: (minutes: number) => `Còn ${minutes} phút có thể sắp xếp.`,
      over: (minutes: number) => `Vượt sức chứa ${minutes} phút.`,
      available: 'Số phút có thể dành',
      plannedAvailable: (planned: string, available: string) => `Đã xếp ${planned}, có ${available}`,
      completed: (minutes: string) => `Hôm nay đã hoàn thành ${minutes}`,
    },
    capture: {
      title: 'Thêm nhanh',
      task: 'Công việc',
      taskPlaceholder: 'Việc nào cần một chỗ trong hôm nay?',
      category: 'Nhóm',
      categoryPlaceholder: 'Cá nhân',
      minutes: 'Số phút',
      lane: 'Vai trò',
      addTask: 'Thêm công việc',
    },
    firstAnchor: {
      title: 'Bắt đầu bằng một Việc chính.',
      description: 'Đặt tên cho việc sẽ khiến hôm nay trở nên đáng giá và ước lượng thật lòng. Việc Hỗ trợ và Tùy chọn có thể thêm sau.',
      laneGuide: 'Việc chính dẫn ngày. Hỗ trợ giúp việc đó. Tùy chọn có thể chờ.',
    },
    lanes: {
      anchor: {
        label: 'Việc chính',
        description: 'Việc sẽ khiến hôm nay trở nên đáng giá.',
      },
      support: {
        label: 'Hỗ trợ',
        description: 'Việc hữu ích giúp ngày hôm nay tiếp tục tiến lên.',
      },
      optional: {
        label: 'Tùy chọn',
        description: 'Chỉ nên làm khi vẫn còn chỗ.',
      },
      fallback: 'Vai trò công việc',
    },
    taskA11y: {
      markIncomplete: (title: string) => `Đánh dấu ${title} là chưa hoàn thành`,
      complete: (title: string) => `Hoàn thành ${title}`,
      lane: (title: string, lane: string) => `Vai trò của ${title}: ${lane}`,
      focus: (title: string) => `Tập trung vào ${title}`,
      delete: (title: string) => `Xóa ${title}`,
    },
    emptyLane: 'Hôm nay chưa có việc nào ở đây.',
  },
  habits: {
    title: 'Nhỏ đủ để duy trì.',
    description: 'Theo dõi nhịp đều mà không biến một ngày bỏ lỡ thành lời phán xét.',
    checkedToday: (checked: number, total: number) => `Hôm nay đã làm ${checked} trên ${total}`,
    minimumTitle: 'Phiên bản tối thiểu hôm nay',
    minimumDescription: 'Phiên bản nhỏ nhất nhưng chân thật vẫn được tính.',
    checkToday: (label: string) => `Đánh dấu đã làm ${label} hôm nay`,
    uncheckToday: (label: string) => `Bỏ đánh dấu ${label} hôm nay`,
    empty: 'Chưa có thói quen. Hãy thêm một phiên bản tối thiểu mà bạn vẫn làm được trong ngày khó khăn.',
    rhythm: {
      title: 'Nhịp bảy ngày',
      description: 'Chỉ ghi nhận. Không mất chuỗi, xếp hạng hay dựng lịch sử giả.',
      noRecord: 'chưa có dữ liệu',
      checked: 'đã làm',
      notChecked: 'chưa làm',
      cell: (habit: string, date: string, state: string) => `${habit}, ${date}: ${state}`,
      toggleToday: (cell: string) => `${cell}. Bật hoặc tắt hôm nay.`,
      empty: 'Nhịp sẽ xuất hiện sau khi bạn thêm thói quen đầu tiên.',
    },
    add: {
      title: 'Thêm thói quen',
      description: 'Đặt tên cho thói quen và phiên bản vẫn làm được trong ngày ít năng lượng.',
      name: 'Tên thói quen',
      namePlaceholder: 'Đặt tên cho một hành động lặp lại',
      minimum: 'Phiên bản tối thiểu',
      minimumPlaceholder: 'Phiên bản nhỏ nhất nhưng chân thật là gì?',
      action: 'Thêm thói quen',
    },
  },
  focus: {
    title: 'Bảo vệ một ý định rõ ràng.',
    description: 'Bộ hẹn giờ giữ ranh giới. Những ý nghĩ lạc hướng có thể chờ trong khay tạm.',
    sessionRunning: 'Phiên đang chạy',
    timer: {
      title: 'Bộ hẹn giờ tập trung',
      presetsLabel: 'Các thời lượng tập trung đặt sẵn',
      remaining: (time: string) => `Còn ${time}`,
      intention: 'Ý định',
      intentionPlaceholder: 'Điều gì sẽ nhận trọn sự chú ý của bạn?',
      start: 'Bắt đầu tập trung',
      pause: 'Tạm dừng',
      resume: 'Tiếp tục tập trung',
      reset: 'Đặt lại bộ hẹn giờ tập trung',
      status: (status: string) => `Bộ hẹn giờ tập trung: ${status}.`,
      ready: 'sẵn sàng',
      running: 'đang chạy',
      paused: 'đã tạm dừng',
    },
    distractions: {
      title: 'Khay ý nghĩ tạm',
      description: 'Ghi lại mà không cần rời phiên tập trung.',
      label: 'Ý nghĩ đang chờ',
      placeholder: 'Để một ý nghĩ lại cho sau',
      add: 'Thêm ý nghĩ lạc hướng',
      remove: (thought: string) => `Xóa ý nghĩ: ${thought}`,
      empty: 'Không có gì đang chờ ở đây.',
    },
    sessionNote: {
      title: 'Ghi chú phiên',
      description: 'Giữ lại điều hữu ích còn đọng lại sau phiên này.',
      label: 'Ghi chú phiên tập trung',
      placeholder: 'Điều gì đã thay đổi, sáng rõ hơn hoặc nên tiếp tục lần tới?',
    },
    history: {
      title: 'Lịch sử tập trung bảy ngày',
      description: 'Số phút của các phiên đã hoàn thành, được ghi trên thiết bị này.',
      noSessions: 'Chưa có phiên',
      chartLabel: 'Số phút tập trung trong bảy ngày gần nhất',
      dayMinutes: (date: string, minutes: string) => `${date}: ${minutes}`,
      completed: (count: number) => `${count} phiên đã hoàn thành trong khoảng này.`,
      empty: 'Chưa có phiên tập trung hoàn thành nào trong bảy ngày này.',
    },
  },
  notes: {
    title: 'Mỗi ngày một trang.',
    description: 'Tìm trong kho lưu, chọn ngày và giữ ghi chú ngay trên thiết bị này.',
    date: 'Ngày ghi chú',
    localNote: 'Ghi chú trên thiết bị',
    dailyNote: (date: string) => `Ghi chú hằng ngày cho ${date}`,
    placeholder: 'Viết một dòng đáng để tìm lại. Bạn có thể dùng Markdown.',
    saveNote: 'Thay đổi được lưu trên thiết bị này.',
    archive: {
      title: 'Kho lưu',
      datedNotes: (count: number) => `${count} ghi chú theo ngày`,
      searchLabel: 'Tìm ghi chú',
      searchPlaceholder: 'Tìm theo ngày hoặc từ khóa',
      emptyNote: 'Ghi chú trống',
      noMatch: 'Không có ghi chú nào khớp tìm kiếm.',
      empty: 'Chưa có ghi chú theo ngày.',
    },
    templates: {
      title: 'Mẫu ghi chú',
      description: 'Mẫu chỉ thêm cấu trúc. Chúng không tạo nội dung hay gửi ghi chú đi nơi khác.',
      morningPlan: {
        label: 'Kế hoạch buổi sáng',
        description: 'Ghi Việc chính, phần hỗ trợ và điều có thể để sau.',
        content: '## Kế hoạch buổi sáng\n\n**Việc chính**\n\n**Hỗ trợ**\n\n**Điều có thể để sau**\n',
      },
      closeDay: {
        label: 'Khép ngày',
        description: 'Ghi lại điều đã tiến triển, điều chưa xong và điều có thể buông xuống.',
        content: '## Khép ngày\n\n**Điều đã tiến triển**\n\n**Điều thấy khó khăn**\n\n**Điều tôi có thể buông xuống**\n',
      },
      weeklyReflection: {
        label: 'Nhìn lại tuần',
        description: 'Xem lại tuần chỉ từ những gì đã được ghi.',
        content: '## Nhìn lại tuần\n\n**Điều có đà tiến triển**\n\n**Điều đòi hỏi quá nhiều**\n\n**Một điều chỉnh cho tuần tới**\n',
      },
    },
  },
  premium: {
    sectionLabel: (title?: string) => title ? `${title}, bản xem trước Premium` : 'Bản xem trước Premium',
    replan: {
      title: 'Sắp xếp lại trên thiết bị',
      description: 'Nook giải thích phần quá tải, rồi chuyển việc Tùy chọn trước và việc Hỗ trợ sau. Việc chính vẫn giữ nguyên.',
      overCapacity: (minutes: number) => `Hôm nay vượt sức chứa ${minutes} phút. Không có lịch hay dịch vụ đám mây nào tham gia.`,
      fits: 'Hôm nay vừa với sức chứa bạn đã đặt. Tính năng sắp xếp lại sẽ chờ đến khi có lý do thật sự.',
      action: 'Sắp xếp phần quá tải',
    },
    routine: {
      title: 'Thiết kế nhịp quen',
      description: 'Điều chỉnh phiên bản của từng thói quen để vẫn làm được trong ngày ít năng lượng. Thay đổi chỉ ở trên thiết bị.',
      minimumFor: (habit: string) => `Phiên bản tối thiểu của ${habit}`,
      empty: 'Hãy thêm một thói quen trước khi điều chỉnh phiên bản tối thiểu.',
    },
    profiles: {
      title: 'Hồ sơ tập trung',
      description: 'Chọn một hồ sơ có thể dùng lặp lại trên thiết bị. Chặn ứng dụng và âm thanh ngoại tuyến sẽ có trong đợt ứng dụng di động.',
      groupLabel: 'Các hồ sơ tập trung Premium',
      reset: 'Khởi động lại',
      steady: 'Đều nhịp',
      deep: 'Chuyên sâu',
      immersion: 'Đắm sâu',
    },
  },
  dialogs: {
    energy: {
      low: { label: 'Thấp', description: 'Giữ danh sách thật nhẹ.' },
      steady: { label: 'Ổn định', description: 'Một nhịp làm việc vừa phải.' },
      bright: { label: 'Dồi dào', description: 'Có chỗ cho một điều tham vọng.' },
    },
    morning: {
      closeLabel: 'Đóng kế hoạch buổi sáng',
      kicker: 'Kế hoạch buổi sáng',
      title: 'Dành chỗ cho phần vừa sức.',
      description: 'Chọn một nhịp chân thật trước khi quyết định điều gì thuộc về hôm nay.',
      energyLegend: 'Năng lượng của bạn thế nào?',
      focusTime: 'Thời gian tập trung có thể dành',
      minutes: 'phút',
      hint: 'Đây là giới hạn, không phải mục tiêu.',
      cancel: 'Để sau',
      submit: 'Lập kế hoạch hôm nay',
    },
    closeDay: {
      closeLabel: 'Đóng phần nhìn lại cuối ngày',
      kicker: 'Khép ngày',
      title: 'Để hôm nay dừng lại ở đây.',
      description: 'Giữ lại một ý nghĩ hữu ích. Phần còn lại có thể chờ đến ngày mai.',
      reflection: 'Nhìn lại cuối ngày',
      placeholder: 'Điều gì đáng để mang theo?',
      hint: 'Không bắt buộc và chỉ lưu trên thiết bị này.',
      energyLegend: 'Bạn kết thúc ngày hôm nay với năng lượng thế nào?',
      cancel: 'Giữ ngày hôm nay mở',
      submit: 'Khép ngày hôm nay',
    },
    backup: {
      closeLabel: 'Đóng cài đặt',
      settingsKicker: 'Cài đặt',
      settingsTitle: 'Nook, theo cách của bạn.',
      settingsDescription: 'Chọn ngôn ngữ, xem lại phần làm quen ngắn hoặc quản lý dữ liệu đang lưu trên thiết bị này.',
      kicker: 'Sao lưu trên thiết bị',
      title: 'Dữ liệu luôn ở bên bạn.',
      description: 'Nook không dùng tài khoản hay đồng bộ đám mây. Xuất và nhập bằng tệp JSON do bạn kiểm soát; không có gì được tải lên.',
      privacyNote: 'Hãy xuất một bản hiện tại trước khi nhập tệp khác hoặc đặt lại thiết bị này.',
      exportTitle: 'Xuất bản sao lưu',
      exportDescription: 'Lưu một bản JSON riêng tư.',
      importTitle: 'Nhập bản sao lưu',
      importDescription: 'Chọn một tệp JSON của Nook.',
      resetTitle: 'Bắt đầu lại trên thiết bị này',
      resetDescription: 'Thao tác này xóa dữ liệu Nook ở đây. Không thể khôi phục nếu thiếu bản sao lưu.',
      resetAction: 'Đặt lại dữ liệu trên thiết bị',
      languageTitle: 'Ngôn ngữ',
      languageDescription: 'Chọn ngôn ngữ dùng trong toàn bộ Nook.',
      replayTitle: 'Phần làm quen ban đầu',
      replayDescription: 'Xem lại phần giới thiệu ba bước. Dữ liệu hiện tại của bạn vẫn được giữ nguyên.',
      replayAction: 'Xem lại phần làm quen',
    },
    quickActions: {
      kicker: 'Thao tác nhanh',
      title: 'Ngày hôm nay nên chuyển hướng thế nào?',
      openMorning: 'Mở Kế hoạch buổi sáng',
      reviewToday: 'Xem Hôm nay',
      startFocus: 'Bắt đầu một phiên tập trung',
      closeDay: 'Khép ngày',
      backup: 'Sao lưu và quyền riêng tư',
    },
    importConfirm: {
      kicker: 'Kiểm tra bản sao lưu',
      title: 'Thay dữ liệu trên thiết bị này?',
      description: (tasks: number, habits: number, notes: number) => `Nook sẽ giữ một bản khôi phục trước. Tệp nhập có ${tasks} công việc, ${habits} thói quen và ${notes} ghi chú theo ngày.`,
      keep: 'Giữ dữ liệu hiện tại',
      replace: 'Thay bằng bản sao lưu',
    },
    resetConfirm: {
      kicker: 'Đặt lại trên thiết bị',
      title: 'Bắt đầu với một Nook trống?',
      description: 'Thao tác này xóa công việc, lịch sử, thói quen và ghi chú hiện tại khỏi trình duyệt. Hãy xuất trước nếu bạn cần một bản lưu lâu dài.',
      keep: 'Giữ dữ liệu của tôi',
      reset: 'Đặt lại dữ liệu trên thiết bị',
    },
  },
  footer: {
    privacy: 'Không tài khoản. Không đám mây. Không theo dõi.',
    save: {
      loading: 'Đang kiểm tra bộ nhớ trên thiết bị…',
      saving: 'Đang lưu trên thiết bị…',
      saved: 'Đã lưu trên thiết bị',
      error: 'Không thể lưu · hãy xuất bản sao lưu',
    },
    quickActions: 'Ctrl/⌘ K · Thao tác nhanh',
  },
  messages: {
    readError: 'Không thể đọc dữ liệu đã lưu. Dữ liệu vẫn được giữ nguyên; hãy nhập bản sao lưu hoặc đặt lại để tiếp tục lưu.',
    saveError: 'Không thể lưu trên thiết bị này. Hãy giữ thẻ này mở và xuất một bản sao lưu.',
    focusComplete: 'Phiên tập trung đã hoàn thành. Số phút thực tế đã được ghi vào nhịp của bạn.',
    anchorSet: (movedPrevious: boolean) => movedPrevious
      ? 'Đã đặt Việc chính. Việc chính trước đó được chuyển sang Hỗ trợ.'
      : 'Đã đặt Việc chính cho hôm nay.',
    anchorReady: 'Việc chính giờ là Bước nhẹ tiếp theo trên Trang chủ.',
    taskAdded: 'Đã thêm công việc vào hôm nay.',
    taskRestored: 'Đã khôi phục công việc.',
    taskRemoved: 'Đã xóa công việc. Bạn có thể hoàn tác trong giây lát.',
    morningSaved: 'Đã lưu kế hoạch buổi sáng trên thiết bị này.',
    morningNextAnchor: 'Đã mở ngày. Tiếp theo, hãy thêm một Việc chính.',
    dayClosed: 'Hôm nay đã khép lại. Không còn gì cần tối ưu thêm.',
    habitAdded: 'Đã thêm thói quen cùng phiên bản tối thiểu.',
    alreadyFits: 'Hôm nay đã vừa với sức chứa bạn đặt.',
    anchorOverload: 'Phần quá tải nằm ở Việc chính. Nook sẽ không tự chuyển nếu chưa có lựa chọn của bạn.',
    previousPlanRestored: 'Đã khôi phục kế hoạch ngày trước đó.',
    replanMoved: (count: number) => `Sắp xếp lại đã chuyển ${count} công việc sang ngày mai.`,
    templateAdded: 'Đã thêm mẫu vào ghi chú trên thiết bị này.',
    backupExported: 'Đã xuất bản sao lưu riêng tư.',
    invalidBackup: 'Tệp này không phải bản sao lưu Nook hợp lệ. Hãy chọn tệp JSON đã xuất từ Nook.',
    previousDataRestored: 'Đã khôi phục dữ liệu trên thiết bị trước đó.',
    backupImported: 'Đã nhập bản sao lưu. Bạn có thể hoàn tác trong giây lát.',
    dataReset: 'Đã đặt lại dữ liệu Nook trên thiết bị. Bạn có thể hoàn tác trong giây lát.',
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
