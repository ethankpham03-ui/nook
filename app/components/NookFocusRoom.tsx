'use client';

import { ArrowCounterClockwise } from '@phosphor-icons/react/ArrowCounterClockwise';
import { ArrowsIn } from '@phosphor-icons/react/ArrowsIn';
import { CheckCircle } from '@phosphor-icons/react/CheckCircle';
import { NotePencil } from '@phosphor-icons/react/NotePencil';
import { Pause } from '@phosphor-icons/react/Pause';
import { Play } from '@phosphor-icons/react/Play';
import { Timer } from '@phosphor-icons/react/Timer';
import type { FormEvent } from 'react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useNookI18n } from '../lib/i18n';
import { NOOK_INPUT_LIMITS } from '../lib/nook-state';
import type { FocusSession, FocusTimer } from '../lib/nook-state';

export type FocusRoomRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type FocusRoomOrigin = {
  surface: FocusRoomRect;
  digits?: FocusRoomRect;
  intention?: FocusRoomRect;
  actions?: FocusRoomRect;
};

type FocusRoomProps = {
  origin: FocusRoomOrigin | null;
  timer: FocusTimer;
  completedSession: FocusSession | null;
  onAddDistraction: (distraction: string) => void;
  onClose: () => void;
  onCompleteTimer: () => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
};

function formatTimer(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function FocusRoom({
  origin,
  timer,
  completedSession,
  onAddDistraction,
  onClose,
  onCompleteTimer,
  onToggleTimer,
  onResetTimer,
}: FocusRoomProps) {
  const { copy, formatMinutes } = useNookI18n();
  const titleId = useId();
  const descriptionId = useId();
  const quickCaptureId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLElement>(null);
  const digitsRef = useRef<HTMLParagraphElement>(null);
  const intentionRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const minimizeRef = useRef<HTMLButtonElement>(null);
  const quickCaptureRef = useRef<HTMLInputElement>(null);
  const initialOriginRef = useRef(origin);
  const onCloseRef = useRef(onClose);
  const closePresentationRef = useRef<(() => void) | null>(null);
  const closingRef = useRef(false);
  const restoreFocusFrameRef = useRef<number | null>(null);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [quickCaptureDraft, setQuickCaptureDraft] = useState('');

  useEffect(() => {
    if (quickCaptureOpen) quickCaptureRef.current?.focus();
  }, [quickCaptureOpen]);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    const surface = surfaceRef.current!;
    const content = contentRef.current!;
    const banner = bannerRef.current!;
    const digits = digitsRef.current!;
    const intention = intentionRef.current!;
    const actions = actionsRef.current!;
    if (!dialog || !surface || !content || !banner || !digits || !intention || !actions) return;

    if (restoreFocusFrameRef.current !== null) {
      window.cancelAnimationFrame(restoreFocusFrameRef.current);
      restoreFocusFrameRef.current = null;
    }
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animations: Animation[] = [];
    let disposed = false;
    let closeDelivered = false;
    closingRef.current = false;

    function cancelMotion() {
      animations.forEach((animation) => animation.cancel());
      animations = [];
      [surface, content, banner, digits, intention, actions].forEach((element) => {
        element.style.willChange = '';
      });
    }

    function originClipPath(): string | null {
      const source = initialOriginRef.current?.surface;
      const target = surface.getBoundingClientRect();
      if (!source || source.width <= 0 || source.height <= 0 || target.width <= 0 || target.height <= 0) return null;
      const top = Math.max(0, source.top - target.top);
      const left = Math.max(0, source.left - target.left);
      const right = Math.max(0, target.width - left - source.width);
      const bottom = Math.max(0, target.height - top - source.height);
      return `inset(${top}px ${right}px ${bottom}px ${left}px round 28px)`;
    }

    function originTransform(element: HTMLElement, source?: FocusRoomRect, scale = false): string | null {
      if (!source) return null;
      const target = element.getBoundingClientRect();
      if (target.width <= 0 || target.height <= 0) return null;
      const ratio = scale ? Math.min(1, Math.max(0.2, source.width / target.width)) : 1;
      return `translate3d(${source.left - target.left}px, ${source.top - target.top}px, 0) scale(${ratio})`;
    }

    function animateFromOrigin(element: HTMLElement, source?: FocusRoomRect, scale = false) {
      const transform = originTransform(element, source, scale);
      element.style.willChange = 'transform, opacity';
      animations.push(element.animate(
        transform
          ? [{ transform, opacity: 0.72 }, { transform: 'none', opacity: 1 }]
          : [{ opacity: 0 }, { opacity: 1 }],
        {
          duration: transform ? 520 : 300,
          delay: transform ? 0 : 70,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        },
      ));
    }

    function finishClose() {
      if (disposed || closeDelivered) return;
      closeDelivered = true;
      cancelMotion();
      dialog.close();
      onCloseRef.current();
    }

    function requestClose() {
      if (disposed || closingRef.current) return;
      closingRef.current = true;
      const clipPath = originClipPath();
      const origins = initialOriginRef.current;
      cancelMotion();
      const duration = motionPreference.matches ? 100 : 240;
      surface.style.willChange = 'clip-path, opacity';
      animations.push(surface.animate(
        motionPreference.matches || !clipPath
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [{ clipPath: 'inset(0 0 0 0 round 0)', opacity: 1 }, { clipPath, opacity: 1 }],
        { duration, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
      ));

      if (motionPreference.matches) {
        animations.push(content.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' }));
      } else {
        ([
          [digits, origins?.digits, true],
          [intention, origins?.intention, false],
          [actions, origins?.actions, false],
        ] as const).forEach(([element, source, scale]) => {
          const transform = originTransform(element, source, scale);
          animations.push(element.animate(
            [{ transform: 'none', opacity: 1 }, { transform: transform ?? 'none', opacity: transform ? 0.38 : 0 }],
            { duration, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
          ));
        });
        animations.push(banner.animate(
          [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-18px)', opacity: 0 }],
          { duration: 180, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
        ));
      }
      Promise.all(animations.map((animation) => animation.finished)).then(finishClose).catch(() => {});
    }

    function settleMotion() {
      if (closingRef.current) finishClose();
      else cancelMotion();
    }

    function trapTab(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0
        && !element.closest('[hidden], [inert], [aria-hidden="true"]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    closePresentationRef.current = requestClose;
    if (!dialog.open) dialog.showModal();
    minimizeRef.current?.focus({ preventScroll: true });
    const clipPath = motionPreference.matches ? null : originClipPath();
    surface.style.willChange = clipPath ? 'clip-path' : 'opacity';
    animations.push(surface.animate(
      clipPath
        ? [{ clipPath }, { clipPath: 'inset(0 0 0 0 round 0)' }]
        : [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: clipPath ? 520 : 120,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'both',
      },
    ));
    if (motionPreference.matches) {
      animations.push(content.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, fill: 'both' }));
    } else {
      animateFromOrigin(digits, initialOriginRef.current?.digits, true);
      animateFromOrigin(intention, initialOriginRef.current?.intention);
      animateFromOrigin(actions, initialOriginRef.current?.actions);
      banner.style.willChange = 'transform, opacity';
      animations.push(banner.animate(
        [{ transform: 'translateY(-22px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
        {
          duration: 400,
          delay: 80,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        },
      ));
    }
    Promise.all(animations.map((animation) => animation.finished)).then(() => {
      if (!disposed && !closingRef.current) cancelMotion();
    }).catch(() => {});
    dialog.addEventListener('keydown', trapTab);
    window.addEventListener('resize', settleMotion);
    window.visualViewport?.addEventListener('resize', settleMotion);
    motionPreference.addEventListener('change', settleMotion);

    return () => {
      disposed = true;
      cancelMotion();
      closePresentationRef.current = null;
      dialog.removeEventListener('keydown', trapTab);
      window.removeEventListener('resize', settleMotion);
      window.visualViewport?.removeEventListener('resize', settleMotion);
      motionPreference.removeEventListener('change', settleMotion);
      if (dialog.open) dialog.close();
      restoreFocusFrameRef.current = window.requestAnimationFrame(() => {
        if (document.querySelector('dialog[open]')) return;
        const returnTarget = previousFocus?.isConnected
          && previousFocus !== document.body && !previousFocus.closest('[inert]')
          ? previousFocus
          : document.getElementById('v2-dock-tab-focus');
        returnTarget?.focus({ preventScroll: true });
      });
    };
  }, []);

  const roomCopy = copy.focus.room;
  const roomState = completedSession ? 'completed' : timer.running ? 'running' : 'paused';
  const StatusIcon = completedSession ? CheckCircle : timer.running ? Timer : Pause;
  const statusTitle = completedSession ? roomCopy.completedTitle : timer.running ? roomCopy.runningTitle : roomCopy.pausedTitle;
  const statusDescription = completedSession ? roomCopy.completedDescription : timer.running ? roomCopy.runningDescription : roomCopy.pausedDescription;
  const digits = formatTimer(completedSession ? 0 : timer.remainingSeconds);
  const intention = (completedSession?.intention ?? timer.intention).trim() || roomCopy.intentionFallback;
  const plannedMinutes = completedSession?.plannedMinutes ?? timer.presetMinutes;
  const displayedMinutes = completedSession?.actualMinutes ?? plannedMinutes;

  function submitQuickCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const distraction = quickCaptureDraft.trim();
    if (!distraction) return;
    onAddDistraction(distraction);
    setQuickCaptureDraft('');
    setQuickCaptureOpen(false);
  }

  return (
    <dialog
      ref={dialogRef}
      className="v3-focus-room"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        closePresentationRef.current?.();
      }}
    >
      <div ref={surfaceRef} className="v3-focus-room__surface" aria-hidden="true" />
      <div ref={contentRef} className="v3-focus-room__content">
        <header className="v3-focus-room__header">
          <p id={titleId}>{roomCopy.title}</p>
          <button ref={minimizeRef} className="v3-focus-room__minimize" type="button" onClick={() => closePresentationRef.current?.()}>
            <ArrowsIn size={19} weight="bold" aria-hidden="true" />
            {roomCopy.minimize}
          </button>
        </header>

        <section ref={bannerRef} className="v3-focus-room__banner" data-state={roomState} role="status" aria-live="polite" aria-atomic="true">
          <StatusIcon size={30} weight="bold" aria-hidden="true" />
          <div className="v3-focus-room__banner-copy">
            <h1>{statusTitle}</h1>
            <p id={descriptionId}>{statusDescription}</p>
          </div>
        </section>

        <div className="v3-focus-room__stage">
          <section ref={intentionRef} className="v3-focus-room__intention-block" aria-label={copy.focus.timer.intention}>
            <p className="v3-focus-room__section-label">{copy.focus.timer.intention}</p>
            <p className="v3-focus-room__intention">{intention}</p>
          </section>

          <div className="v3-focus-room__timer-block">
            <p className="v3-focus-room__remaining">{roomCopy.remaining}</p>
            <p ref={digitsRef} className="v3-focus-room__digits" role="timer" aria-live="off" aria-label={copy.focus.timer.remaining(digits)}>{digits}</p>
            <p className="v3-focus-room__duration">{formatMinutes(displayedMinutes)}</p>
          </div>

          <div ref={actionsRef} className="v3-focus-room__actions">
            <button className="v2-button v2-button--focus" type="button" onClick={() => {
              if (closingRef.current) return;
              if (completedSession) closePresentationRef.current?.();
              else onToggleTimer();
            }}>
              {completedSession ? <CheckCircle size={20} weight="bold" aria-hidden="true" />
                : timer.running ? <Pause size={20} weight="bold" aria-hidden="true" />
                  : <Play size={20} weight="bold" aria-hidden="true" />}
              {completedSession ? roomCopy.backToFocus : timer.running ? copy.focus.timer.pause : copy.focus.timer.resume}
            </button>
            {!completedSession && (
              <>
                <button className="v2-button v3-focus-room__complete" type="button" onClick={onCompleteTimer}>
                  <CheckCircle size={19} weight="bold" aria-hidden="true" />
                  {roomCopy.completeEarly}
                </button>
                <button
                  className="v2-button v3-focus-room__quick-button"
                  type="button"
                  aria-expanded={quickCaptureOpen}
                  aria-controls={quickCaptureId}
                  onClick={() => setQuickCaptureOpen((open) => !open)}
                >
                  <NotePencil size={19} weight="bold" aria-hidden="true" />
                  {roomCopy.quickCapture}
                </button>
                <button className="v2-button v3-focus-room__reset" type="button" onClick={() => {
                  if (closingRef.current) return;
                  onResetTimer();
                  closePresentationRef.current?.();
                }}>
                  <ArrowCounterClockwise size={19} weight="bold" aria-hidden="true" />
                  {roomCopy.reset}
                </button>
              </>
            )}
          </div>

          {quickCaptureOpen && !completedSession && (
            <form id={quickCaptureId} className="v3-focus-room__quick-capture" onSubmit={submitQuickCapture}>
              <label htmlFor={`${quickCaptureId}-input`}>{copy.focus.distractions.label}</label>
              <div>
                <input
                  ref={quickCaptureRef}
                  id={`${quickCaptureId}-input`}
                  value={quickCaptureDraft}
                  onChange={(event) => setQuickCaptureDraft(event.target.value)}
                  maxLength={NOOK_INPUT_LIMITS.distraction}
                  placeholder={copy.focus.distractions.placeholder}
                  autoComplete="off"
                />
                <button type="submit" disabled={!quickCaptureDraft.trim()}>{copy.focus.distractions.add}</button>
              </div>
            </form>
          )}
        </div>
        <p className="v3-focus-room__hint">{roomCopy.minimizeHint}</p>
      </div>
    </dialog>
  );
}
