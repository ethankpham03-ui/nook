'use client';

import Image from 'next/image';
import { getNookCopy } from '../lib/i18n';
import type { Language } from '../lib/nook-state';

export type NookLaunchProps = {
  language: Language;
  phase: 'active' | 'leaving';
  ready?: boolean;
  dark?: boolean;
};

export function NookLaunch({ language, phase, ready = true, dark }: NookLaunchProps) {
  const copy = getNookCopy(language);
  const status = copy.loading.opening;
  const tagline = copy.common.tagline;

  return (
    <div
      className="v3-launch"
      data-phase={phase}
      data-theme={dark === undefined ? undefined : dark ? 'dark' : 'light'}
      role={ready ? 'status' : undefined}
      aria-hidden={ready ? undefined : true}
    >
      <div className="v3-launch__brand" aria-hidden="true">
        <span className="v3-launch__aperture">
          <Image src="/icons/nook-mark.svg" alt="" width={88} height={88} priority />
        </span>
        <span className="v3-launch__wordmark">nook</span>
        {ready && <span className="v3-launch__tagline">{tagline}</span>}
      </div>
      {ready && <span className="v2-sr-only">{status}</span>}
    </div>
  );
}
