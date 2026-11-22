import { ValidatorFn } from '@angular/forms';

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  domains: string[];
}

const PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', icon: 'instagram', domains: ['instagram.com', 'instagr.am', 'ig.me'] },
  { id: 'facebook', name: 'Facebook', icon: 'facebook', domains: ['facebook.com', 'fb.com', 'fb.me', 'fb.watch'] },
  { id: 'youtube', name: 'YouTube', icon: 'youtube', domains: ['youtube.com', 'youtu.be'] },
  { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', domains: ['linkedin.com', 'lnkd.in'] },
  { id: 'x', name: 'X', icon: 'x', domains: ['x.com', 'twitter.com'] },
  { id: 'threads', name: 'Threads', icon: 'threads', domains: ['threads.net', 'threads.com'] },
  { id: 'pinterest', name: 'Pinterest', icon: 'pinterest', domains: ['pinterest.com', 'in.pinterest.com', 'pin.it'] },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', domains: ['whatsapp.com', 'wa.me'] },
];
const NO_ACCOUNT: SocialPlatform = { id: 'new', name: 'No account yet', icon: 'spark', domains: [] };
const USERNAME: SocialPlatform = { id: 'username', name: 'Username', icon: 'share', domains: [] };
const OTHER: SocialPlatform = { id: 'other', name: 'Other link', icon: 'globe', domains: [] };

function toUrl(value: string): URL | null {
  if (/\s/.test(value)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return /\.[a-z]{2,}$/i.test(url.hostname) && !url.username ? url : null;
  } catch {
    return null;
  }
}

/** Returns null when the text is not a link, an @username or "new". */
export function detectPlatform(raw: string): SocialPlatform | null {
  const value = raw.trim();
  if (/^["'“]?new["'”]?$/i.test(value)) return NO_ACCOUNT;
  if (/^@[\w.-]{2,}$/.test(value)) return USERNAME;
  const host = toUrl(value)?.hostname.toLowerCase();
  if (!host) return null;
  return PLATFORMS.find((p) => p.domains.some((d) => host === d || host.endsWith(`.${d}`))) ?? OTHER;
}

/** At least one entry, and every filled entry must be recognisable. */
export const socialLinksValidator: ValidatorFn = (control) => {
  const filled = (control.value as string[]).filter((v) => v.trim());
  return filled.length && filled.every((v) => detectPlatform(v)) ? null : { socialLinks: true };
};

/** One readable line for the inquiry email. */
export function describeSocialLinks(values: string[]): string {
  return values
    .map((raw) => {
      const value = raw.trim();
      const platform = detectPlatform(value);
      if (!platform) return '';
      if (platform === NO_ACCOUNT) return 'NEW: no account yet, needs to be created';
      if (platform === USERNAME) return `Username: ${value}`;
      return `${platform.name}: ${toUrl(value)?.href}`;
    })
    .filter(Boolean)
    .join(' | ');
}
