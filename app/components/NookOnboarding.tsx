'use client';

import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { ArrowRight } from '@phosphor-icons/react/ArrowRight';
import { CheckCircle } from '@phosphor-icons/react/CheckCircle';
import { ShieldCheck } from '@phosphor-icons/react/ShieldCheck';
import { SunHorizon } from '@phosphor-icons/react/SunHorizon';
import { Target } from '@phosphor-icons/react/Target';
import { X } from '@phosphor-icons/react/X';
import { useEffect, useId, useRef, useState } from 'react';
import { getNookCopy } from '../lib/i18n';
import type { NookCopy } from '../lib/i18n';
import type { Language } from '../lib/nook-state';

export type NookOnboardingResult = {
  openMorningPlan: boolean;
};

export type NookOnboardingProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onComplete: (result: NookOnboardingResult) => void;
};

const TOTAL_STEPS = 3;

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  )).filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
}

function StepVisual({ copy, step }: { copy: NookCopy['onboarding']; step: number }) {
  if (step === 1) {
    return (
      <div className="v3-onboarding__visual" data-variant="journey">
        <ol className="v3-onboarding__journey" aria-label={copy.journeyLabel}>
          {copy.journey.map((item, index) => (
            <li className="v3-onboarding__journey-item" key={item.label}>
              <span className="v3-onboarding__journey-icon" aria-hidden="true">
                {index === 0
                  ? <Target size={22} weight="bold" />
                  : index === 1
                    ? <SunHorizon size={22} weight="bold" />
                    : index === 2
                      ? <ShieldCheck size={22} weight="bold" />
                      : <CheckCircle size={22} weight="bold" />}
              </span>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="v3-onboarding__visual" data-variant="starter">
        <ol className="v3-onboarding__starter" aria-label={copy.starterLabel}>
          {copy.starter.map((item, index) => (
            <li key={item.label}>
              <span>{index + 1}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="v3-onboarding__visual" aria-hidden="true">
      <span className="v3-onboarding__visual-orbit" />
      <span className="v3-onboarding__visual-mark">
        <SunHorizon size={48} weight="bold" />
      </span>
    </div>
  );
}

export function NookOnboarding({
  language,
  onLanguageChange,
  onComplete,
}: NookOnboardingProps) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const selectedLanguageRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const onCompleteRef = useRef(onComplete);
  const titleId = useId();
  const descriptionId = useId();
  const noteId = useId();
  const copy = getNookCopy(language).onboarding;

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusFrame = window.requestAnimationFrame(() => selectedLanguageRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCompleteRef.current({ openMorningPlan: false });
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = focusableElements(dialogRef.current);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
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
  }, []);

  useEffect(() => {
    if (step === 0) selectedLanguageRef.current?.focus();
    else titleRef.current?.focus();
  }, [step]);

  const content = step === 0
    ? {
        ...copy.steps.welcome,
      }
    : step === 1
      ? {
          ...copy.steps.shape,
        }
      : {
          ...copy.steps.ready,
        };

  const stepStatus = copy.stepStatus(step + 1, TOTAL_STEPS);

  return (
    <div className="v3-onboarding" data-step={step + 1}>
      <div
        ref={dialogRef}
        className="v3-onboarding__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${descriptionId} ${noteId}`}
        tabIndex={-1}
      >
        <div className="v3-onboarding__utility">
          {step > 0 && (
            <div
              className="v3-onboarding__languages"
              role="group"
              aria-label={copy.languageLabel}
            >
              <button
                className="v3-onboarding__language"
                type="button"
                aria-label={copy.languageNames.en}
                aria-pressed={language === 'en'}
                data-active={language === 'en' ? 'true' : 'false'}
                lang="en"
                onClick={() => onLanguageChange('en')}
              >
                EN
              </button>
              <button
                className="v3-onboarding__language"
                type="button"
                aria-label={copy.languageNames.vi}
                aria-pressed={language === 'vi'}
                data-active={language === 'vi' ? 'true' : 'false'}
                lang="vi"
                onClick={() => onLanguageChange('vi')}
              >
                VI
              </button>
            </div>
          )}

          <button
            className="v3-onboarding__skip"
            type="button"
            onClick={() => onComplete({ openMorningPlan: false })}
          >
            <span>{copy.skip}</span>
            <X size={17} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div className="v3-onboarding__progress">
          <progress
            max={TOTAL_STEPS}
            value={step + 1}
            aria-label={`${copy.progressLabel}: ${stepStatus}`}
          />
          <span aria-hidden="true">{stepStatus}</span>
        </div>

        <div className="v3-onboarding__body">
          <StepVisual copy={copy} step={step} />
          <div className="v3-onboarding__copy">
            <h1 ref={titleRef} id={titleId} tabIndex={-1}>{content.title}</h1>
            <p id={descriptionId}>{content.description}</p>
            {step === 0 && (
              <div className="v3-onboarding__language-field">
                <span className="v3-onboarding__language-label">{copy.languageLabel}</span>
                <div
                  className="v3-onboarding__language-choices"
                  role="group"
                  aria-label={copy.languageLabel}
                >
                  {(['en', 'vi'] as const).map((option) => (
                    <button
                      key={option}
                      ref={option === language ? selectedLanguageRef : undefined}
                      className="v3-onboarding__language-choice"
                      type="button"
                      aria-pressed={language === option}
                      data-active={language === option ? 'true' : 'false'}
                      lang={option}
                      onClick={() => onLanguageChange(option)}
                    >
                      <span className="v3-onboarding__language-code">{option.toUpperCase()}</span>
                      <strong>{copy.languageNames[option]}</strong>
                      <CheckCircle size={20} weight={language === option ? 'fill' : 'regular'} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 1 && (
              <dl className="v3-onboarding__concepts">
                {copy.concepts.map((concept) => (
                  <div key={concept.term}>
                    <dt>{concept.term}</dt>
                    <dd>{concept.definition}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="v3-onboarding__note" id={noteId}>
              <ShieldCheck size={19} weight="bold" aria-hidden="true" />
              <span>{content.note}</span>
            </p>
          </div>
        </div>

        <div className="v3-onboarding__actions">
          {step > 0 ? (
            <button
              className="v3-onboarding__button v3-onboarding__button--secondary"
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              <ArrowLeft size={18} weight="bold" aria-hidden="true" />
              {copy.back}
            </button>
          ) : <span className="v3-onboarding__action-spacer" aria-hidden="true" />}

          {step < TOTAL_STEPS - 1 ? (
            <button
              className="v3-onboarding__button v3-onboarding__button--primary"
              type="button"
              onClick={() => setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1))}
            >
              {copy.next}
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </button>
          ) : (
            <button
              className="v3-onboarding__button v3-onboarding__button--focus"
              type="button"
              onClick={() => onComplete({ openMorningPlan: true })}
            >
              {copy.finish}
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
