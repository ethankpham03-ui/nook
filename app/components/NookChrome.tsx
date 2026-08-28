'use client';

import { BatteryLow } from '@phosphor-icons/react/BatteryLow';
import { BatteryMedium } from '@phosphor-icons/react/BatteryMedium';
import { ArrowCounterClockwise } from '@phosphor-icons/react/ArrowCounterClockwise';
import { CheckSquareOffset } from '@phosphor-icons/react/CheckSquareOffset';
import { DownloadSimple } from '@phosphor-icons/react/DownloadSimple';
import { GearSix } from '@phosphor-icons/react/GearSix';
import { GlobeHemisphereWest } from '@phosphor-icons/react/GlobeHemisphereWest';
import { House } from '@phosphor-icons/react/House';
import { Moon } from '@phosphor-icons/react/Moon';
import { NotePencil } from '@phosphor-icons/react/NotePencil';
import { Repeat } from '@phosphor-icons/react/Repeat';
import { ShieldCheck } from '@phosphor-icons/react/ShieldCheck';
import { Sun } from '@phosphor-icons/react/Sun';
import { SunHorizon } from '@phosphor-icons/react/SunHorizon';
import { Timer } from '@phosphor-icons/react/Timer';
import { Trash } from '@phosphor-icons/react/Trash';
import { UploadSimple } from '@phosphor-icons/react/UploadSimple';
import { X } from '@phosphor-icons/react/X';
import Image from 'next/image';
import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { useNookI18n } from '../lib/i18n';
import type { DailyRecord, Language, Tab } from '../lib/nook-state';

export type RitualEnergy = NonNullable<DailyRecord['energy']>;

export type MorningPlanValues = {
  energy: RitualEnergy;
  capacityMinutes: number;
};

export type CloseDayValues = {
  closingNote: string;
  closingEnergy: RitualEnergy;
};

const TAB_ITEMS = [
  { id: 'today', icon: CheckSquareOffset },
  { id: 'habits', icon: Repeat },
  { id: 'home', icon: House },
  { id: 'focus', icon: Timer },
  { id: 'notes', icon: NotePencil },
] satisfies ReadonlyArray<{
  id: Tab;
  icon: typeof House;
}>;

const ENERGY_OPTIONS = [
  {
    value: 'low',
    icon: BatteryLow,
  },
  {
    value: 'steady',
    icon: BatteryMedium,
  },
  {
    value: 'bright',
    icon: SunHorizon,
  },
] satisfies ReadonlyArray<{
  value: RitualEnergy;
  icon: typeof BatteryLow;
}>;

function isRitualEnergy(value: unknown): value is RitualEnergy {
  return value === 'low' || value === 'steady' || value === 'bright';
}

function initialEnergy(record: DailyRecord): RitualEnergy {
  return isRitualEnergy(record.energy) ? record.energy : 'steady';
}

function initialClosingEnergy(record: DailyRecord): RitualEnergy {
  if (isRitualEnergy(record.closingEnergy)) return record.closingEnergy;
  return initialEnergy(record);
}

function initialCapacity(record: DailyRecord): number {
  return typeof record.capacityMinutes === 'number'
    && Number.isFinite(record.capacityMinutes)
    && record.capacityMinutes >= 0
    ? record.capacityMinutes
    : 240;
}

export type NookHeaderProps = {
  activeTab: Tab;
  isDark: boolean;
  onGoHome: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
};

export function NookHeader({
  activeTab,
  isDark,
  onGoHome,
  onToggleTheme,
  onOpenSettings,
}: NookHeaderProps) {
  const { copy } = useNookI18n();
  const currentLabel = copy.nav.labels[activeTab];

  return (
    <header className="v2-header">
      <button
        className="v2-brand"
        type="button"
        onClick={onGoHome}
        aria-label={copy.nav.openHome}
      >
        <Image
          className="v2-brand-mark"
          src="/icons/nook-mark.svg"
          alt=""
          width={40}
          height={40}
        />
        <span className="v2-brand-name">nook</span>
      </button>

      <p className="v2-header-location" aria-live="polite">
        <span className="v2-header-location-label">{copy.nav.currentView}</span>
        <span className="v2-header-location-value">{currentLabel}</span>
      </p>

      <div className="v2-header-actions" role="group" aria-label={copy.nav.appControls}>
        <button
          className="v2-icon-button"
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? copy.nav.useLightTheme : copy.nav.useDarkTheme}
          aria-pressed={isDark}
        >
          {isDark
            ? <Sun size={20} weight="bold" aria-hidden="true" />
            : <Moon size={20} weight="bold" aria-hidden="true" />}
        </button>
        <button
          id="nook-settings-trigger"
          className="v2-icon-button"
          type="button"
          onClick={onOpenSettings}
          aria-label={copy.nav.openSettings}
          aria-haspopup="dialog"
        >
          <GearSix size={20} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

export type NookDockProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  focusRunning?: boolean;
};

export function NookDock({ activeTab, onTabChange, focusRunning = false }: NookDockProps) {
  const { copy } = useNookI18n();
  const activeIndex = TAB_ITEMS.findIndex((item) => item.id === activeTab);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragPointerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const dockStyle = {
    '--active-tab-index': previewIndex ?? Math.max(0, activeIndex),
  } as CSSProperties;

  function indexAtPointer(clientX: number): number | null {
    const buttons = trackRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (!buttons?.length) return null;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    buttons.forEach((button, index) => {
      const rect = button.getBoundingClientRect();
      const distance = Math.abs(clientX - (rect.left + rect.width / 2));
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    return nearestIndex;
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const index = indexAtPointer(event.clientX);
    if (index === null) return;
    dragPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setPreviewIndex(index);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragPointerRef.current !== event.pointerId) return;
    const index = indexAtPointer(event.clientX);
    if (index !== null) setPreviewIndex(index);
  }

  function finishDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragPointerRef.current !== event.pointerId) return;
    const index = indexAtPointer(event.clientX);
    dragPointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    setPreviewIndex(null);
    if (index === null) return;

    suppressClickRef.current = true;
    onTabChange(TAB_ITEMS[index].id);
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }

  function cancelDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragPointerRef.current !== event.pointerId) return;
    dragPointerRef.current = null;
    setDragging(false);
    setPreviewIndex(null);
  }

  function moveWithKeyboard(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % TAB_ITEMS.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + TAB_ITEMS.length) % TAB_ITEMS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = TAB_ITEMS.length - 1;
    else return;

    event.preventDefault();
    const next = TAB_ITEMS[nextIndex];
    setPreviewIndex(null);
    onTabChange(next.id);
    window.requestAnimationFrame(() => document.getElementById(`v2-dock-tab-${next.id}`)?.focus());
  }

  return (
    <nav className="v2-dock" aria-label={copy.nav.sections}>
      <div
        ref={trackRef}
        className="v2-dock-track"
        role="tablist"
        style={dockStyle}
        data-dragging={dragging ? 'true' : 'false'}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
        onPointerLeave={() => dragPointerRef.current === null && setPreviewIndex(null)}
      >
        {TAB_ITEMS.map((item, index) => {
          const TabIcon = item.icon;
          const label = copy.nav.labels[item.id];
          const isActive = item.id === activeTab;
          const isHome = item.id === 'home';

          return (
            <button
              key={item.id}
              id={`v2-dock-tab-${item.id}`}
              className={`v2-dock-tab${isHome ? ' v2-dock-tab-home' : ''}`}
              type="button"
              role="tab"
              onClick={() => {
                if (suppressClickRef.current) return;
                onTabChange(item.id);
              }}
              onPointerEnter={(event) => event.pointerType === 'mouse' && setPreviewIndex(index)}
              onFocus={() => setPreviewIndex(index)}
              onBlur={() => dragPointerRef.current === null && setPreviewIndex(null)}
              onKeyDown={(event) => moveWithKeyboard(event, index)}
              aria-current={isActive ? 'page' : undefined}
              aria-selected={isActive}
              aria-controls="nook-tab-panel"
              tabIndex={isActive ? 0 : -1}
              data-active={isActive ? 'true' : 'false'}
              data-tab={item.id}
            >
              <span className="v2-dock-icon" aria-hidden="true">
                <TabIcon size={22} weight="bold" />
              </span>
              <span className="v2-dock-label">{label}</span>
              {item.id === 'focus' && focusRunning ? (
                <span className="v2-dock-live">
                  <span className="v2-sr-only">{copy.nav.focusTimerRunning}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

type DialogFrameProps = {
  open: boolean;
  titleId: string;
  descriptionId: string;
  closeLabel: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
};

function useDialogAccessibility(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');

      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  return { dialogRef, closeButtonRef };
}

function DialogFrame({
  open,
  titleId,
  descriptionId,
  closeLabel,
  className = '',
  onClose,
  children,
}: DialogFrameProps) {
  const { dialogRef, closeButtonRef } = useDialogAccessibility(open, onClose);

  if (!open) return null;

  function closeFromBackdrop(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div className="v2-dialog-backdrop" onPointerDown={closeFromBackdrop}>
      <div
        ref={dialogRef}
        className={`v2-dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <button
          ref={closeButtonRef}
          className="v2-dialog-close"
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
        >
          <X size={20} weight="bold" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}

type EnergyChoicesProps = {
  name: string;
  legend: string;
  defaultValue: RitualEnergy;
};

function EnergyChoices({ name, legend, defaultValue }: EnergyChoicesProps) {
  const groupId = useId();
  const { copy } = useNookI18n();

  return (
    <fieldset className="v2-energy-fieldset">
      <legend className="v2-field-legend">{legend}</legend>
      <div className="v2-energy-options">
        {ENERGY_OPTIONS.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          const EnergyIcon = option.icon;
          const optionCopy = copy.dialogs.energy[option.value];
          return (
            <label className="v2-energy-option" htmlFor={optionId} key={option.value}>
              <input
                className="v2-energy-input"
                id={optionId}
                name={name}
                type="radio"
                value={option.value}
                defaultChecked={option.value === defaultValue}
                required
              />
              <span className="v2-energy-card">
                <span className="v2-energy-icon" aria-hidden="true">
                  <EnergyIcon size={22} weight="bold" />
                </span>
                <span className="v2-energy-label">{optionCopy.label}</span>
                <span className="v2-energy-description">{optionCopy.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export type MorningPlanDialogProps = {
  open: boolean;
  record: DailyRecord;
  onClose: () => void;
  onSubmit: (values: MorningPlanValues) => void;
};

export function MorningPlanDialog({
  open,
  record,
  onClose,
  onSubmit,
}: MorningPlanDialogProps) {
  const headingId = useId();
  const descriptionId = useId();
  const { copy } = useNookI18n();
  const dialogCopy = copy.dialogs.morning;

  function submitMorningPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const energy = formData.get('morning-energy');
    const capacityMinutes = Number(formData.get('capacityMinutes'));
    if (!isRitualEnergy(energy) || !Number.isInteger(capacityMinutes)) return;
    onSubmit({ energy, capacityMinutes });
  }

  return (
    <DialogFrame
      open={open}
      titleId={headingId}
      descriptionId={descriptionId}
      closeLabel={dialogCopy.closeLabel}
      onClose={onClose}
    >
      <div className="v2-dialog-heading">
        <p className="v2-dialog-kicker">{dialogCopy.kicker}</p>
        <h2 className="v2-dialog-title" id={headingId}>{dialogCopy.title}</h2>
        <p className="v2-dialog-description" id={descriptionId}>
          {dialogCopy.description}
        </p>
      </div>

      <form className="v2-ritual-form" onSubmit={submitMorningPlan}>
        <EnergyChoices
          name="morning-energy"
          legend={dialogCopy.energyLegend}
          defaultValue={initialEnergy(record)}
        />

        <label className="v2-field" htmlFor={`${headingId}-capacity`}>
          <span className="v2-field-label">{dialogCopy.focusTime}</span>
          <span className="v2-number-field">
            <input
              className="v2-number-input"
              id={`${headingId}-capacity`}
              name="capacityMinutes"
              type="number"
              min={0}
              max={1440}
              step={15}
              defaultValue={initialCapacity(record)}
              inputMode="numeric"
              required
            />
            <span className="v2-number-suffix" aria-hidden="true">{dialogCopy.minutes}</span>
          </span>
          <span className="v2-field-hint">{dialogCopy.hint}</span>
        </label>

        <div className="v2-dialog-actions">
          <button className="v2-button-secondary" type="button" onClick={onClose}>{dialogCopy.cancel}</button>
          <button className="v2-button-primary" type="submit">{dialogCopy.submit}</button>
        </div>
      </form>
    </DialogFrame>
  );
}

export type CloseDayDialogProps = {
  open: boolean;
  record: DailyRecord;
  onClose: () => void;
  onSubmit: (values: CloseDayValues) => void;
};

export function CloseDayDialog({
  open,
  record,
  onClose,
  onSubmit,
}: CloseDayDialogProps) {
  const headingId = useId();
  const descriptionId = useId();
  const { copy } = useNookI18n();
  const dialogCopy = copy.dialogs.closeDay;

  function submitClosingReflection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const closingEnergy = formData.get('closing-energy');
    if (!isRitualEnergy(closingEnergy)) return;
    onSubmit({
      closingEnergy,
      closingNote: String(formData.get('closingNote') ?? '').trim(),
    });
  }

  return (
    <DialogFrame
      open={open}
      titleId={headingId}
      descriptionId={descriptionId}
      closeLabel={dialogCopy.closeLabel}
      onClose={onClose}
    >
      <div className="v2-dialog-heading">
        <p className="v2-dialog-kicker">{dialogCopy.kicker}</p>
        <h2 className="v2-dialog-title" id={headingId}>{dialogCopy.title}</h2>
        <p className="v2-dialog-description" id={descriptionId}>
          {dialogCopy.description}
        </p>
      </div>

      <form className="v2-ritual-form" onSubmit={submitClosingReflection}>
        <label className="v2-field" htmlFor={`${headingId}-reflection`}>
          <span className="v2-field-label">{dialogCopy.reflection}</span>
          <textarea
            className="v2-textarea"
            id={`${headingId}-reflection`}
            name="closingNote"
            rows={4}
            maxLength={2000}
            defaultValue={record.closingNote}
            placeholder={dialogCopy.placeholder}
          />
          <span className="v2-field-hint">{dialogCopy.hint}</span>
        </label>

        <EnergyChoices
          name="closing-energy"
          legend={dialogCopy.energyLegend}
          defaultValue={initialClosingEnergy(record)}
        />

        <div className="v2-dialog-actions">
          <button className="v2-button-secondary" type="button" onClick={onClose}>{dialogCopy.cancel}</button>
          <button className="v2-button-primary" type="submit">{dialogCopy.submit}</button>
        </div>
      </form>
    </DialogFrame>
  );
}

export type BackupDialogProps = {
  language: Language;
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  onImportFile: (file: File) => void | Promise<void>;
  onLanguageChange: (language: Language) => void;
  onReplayOnboarding: () => void;
  onReset: () => void;
};

export function BackupDialog({
  language,
  open,
  onClose,
  onExport,
  onImportFile,
  onLanguageChange,
  onReplayOnboarding,
  onReset,
}: BackupDialogProps) {
  const headingId = useId();
  const descriptionId = useId();
  const languageHeadingId = useId();
  const languageDescriptionId = useId();
  const replayHeadingId = useId();
  const backupHeadingId = useId();
  const { copy } = useNookI18n();
  const dialogCopy = copy.dialogs.backup;

  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file) void onImportFile(file);
    event.currentTarget.value = '';
  }

  return (
    <DialogFrame
      open={open}
      titleId={headingId}
      descriptionId={descriptionId}
      closeLabel={dialogCopy.closeLabel}
      className="v3-settings"
      onClose={onClose}
    >
      <div className="v2-dialog-heading">
        <p className="v2-dialog-kicker">{dialogCopy.settingsKicker}</p>
        <h2 className="v2-dialog-title" id={headingId}>{dialogCopy.settingsTitle}</h2>
        <p className="v2-dialog-description" id={descriptionId}>
          {dialogCopy.settingsDescription}
        </p>
      </div>

      <section className="v3-settings__section" aria-labelledby={languageHeadingId}>
        <div className="v3-settings__section-heading">
          <span className="v3-settings__section-icon" aria-hidden="true">
            <GlobeHemisphereWest size={21} weight="bold" />
          </span>
          <div className="v3-settings__section-copy">
            <h3 id={languageHeadingId}>{dialogCopy.languageTitle}</h3>
            <p id={languageDescriptionId}>{dialogCopy.languageDescription}</p>
          </div>
        </div>
        <div
          className="v3-settings__language-options"
          role="group"
          aria-labelledby={languageHeadingId}
          aria-describedby={languageDescriptionId}
        >
          <button
            className="v3-settings__language-option"
            type="button"
            aria-pressed={language === 'en'}
            data-active={language === 'en' ? 'true' : 'false'}
            lang="en"
            onClick={() => onLanguageChange('en')}
          >
            <span aria-hidden="true">EN</span>
            <strong>{copy.onboarding.languageNames.en}</strong>
          </button>
          <button
            className="v3-settings__language-option"
            type="button"
            aria-pressed={language === 'vi'}
            data-active={language === 'vi' ? 'true' : 'false'}
            lang="vi"
            onClick={() => onLanguageChange('vi')}
          >
            <span aria-hidden="true">VI</span>
            <strong>{copy.onboarding.languageNames.vi}</strong>
          </button>
        </div>
      </section>

      <section className="v3-settings__replay" aria-labelledby={replayHeadingId}>
        <div className="v3-settings__section-heading">
          <span className="v3-settings__section-icon" aria-hidden="true">
            <ArrowCounterClockwise size={21} weight="bold" />
          </span>
          <div className="v3-settings__section-copy">
            <h3 id={replayHeadingId}>{dialogCopy.replayTitle}</h3>
            <p>{dialogCopy.replayDescription}</p>
          </div>
        </div>
        <button
          className="v2-button-secondary v3-settings__replay-action"
          type="button"
          onClick={onReplayOnboarding}
        >
          {dialogCopy.replayAction}
        </button>
      </section>

      <section className="v3-settings__backup" aria-labelledby={backupHeadingId}>
        <div className="v3-settings__backup-heading">
          <p className="v2-dialog-kicker">{dialogCopy.kicker}</p>
          <h3 id={backupHeadingId}>{dialogCopy.title}</h3>
          <p>{dialogCopy.description}</p>
        </div>

        <div className="v2-privacy-note">
          <ShieldCheck size={22} weight="bold" aria-hidden="true" />
          <p>{dialogCopy.privacyNote}</p>
        </div>

        <div className="v2-backup-actions">
          <button className="v2-backup-action" type="button" onClick={onExport}>
            <span className="v2-backup-action-icon" aria-hidden="true">
              <DownloadSimple size={22} weight="bold" />
            </span>
            <span className="v2-backup-action-copy">
              <strong>{dialogCopy.exportTitle}</strong>
              <span>{dialogCopy.exportDescription}</span>
            </span>
          </button>

          <label className="v2-backup-action" htmlFor={`${headingId}-import`}>
            <span className="v2-backup-action-icon" aria-hidden="true">
              <UploadSimple size={22} weight="bold" />
            </span>
            <span className="v2-backup-action-copy">
              <strong>{dialogCopy.importTitle}</strong>
              <span>{dialogCopy.importDescription}</span>
            </span>
            <input
              className="v2-file-input"
              id={`${headingId}-import`}
              type="file"
              accept=".json,application/json"
              onChange={importFile}
            />
          </label>
        </div>

        <div className="v2-reset-zone">
          <div className="v2-reset-copy">
            <strong>{dialogCopy.resetTitle}</strong>
            <span>{dialogCopy.resetDescription}</span>
          </div>
          <button className="v2-button-danger" type="button" onClick={onReset}>
            <Trash size={18} weight="bold" aria-hidden="true" />
            {dialogCopy.resetAction}
          </button>
        </div>
      </section>
    </DialogFrame>
  );
}
