/**
 * SITE CONFIGURATION — edit this file to update contact details, social links
 * and statistics. Empty strings hide the related UI automatically.
 * No real details are pre-filled: add yours before going live.
 */
export interface Stat {
  label: string;
  value: number;
  suffix: string;
}

export const SITE = {
  name: 'TheCreateStudio',
  tagline: 'WE CREATE. YOU GROW.',
  supportingTagline: 'From Creative Ideas to Powerful Digital Experiences.',
  footerTagline: 'Creative Minds. Digital Solutions. Real Growth.',
  description:
    'TheCreateStudio is a full-service digital agency helping businesses establish their digital presence, build powerful brands, connect with their audience, and grow through creative marketing and modern technology.',

  contact: {
    email: '', // e.g. 'hello@yourdomain.com'
    phone: '', // e.g. '+91 98765 43210' (display format)
    whatsapp: '', // digits only with country code, e.g. '919876543210'
    whatsappMessage: "Hi TheCreateStudio! I'd like to discuss a project.",
    address: '', // e.g. 'Office address, City, State, India'
  },

  social: {
    instagram: '', // full URL, e.g. 'https://instagram.com/yourhandle'
    linkedin: '',
    facebook: '',
  },

  /**
   * Statistics shown on the home page. These are PLACEHOLDERS.
   * Set `showStats: true` only after replacing them with your real numbers.
   */
  showStats: false,
  stats: [
    { label: 'Projects Completed', value: 0, suffix: '+' },
    { label: 'Brands Supported', value: 0, suffix: '+' },
    { label: 'Creative Campaigns', value: 0, suffix: '+' },
    { label: 'Digital Experiences', value: 0, suffix: '+' },
  ] as Stat[],
};

export function whatsappLink(): string {
  const n = SITE.contact.whatsapp.replace(/\D/g, '');
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(SITE.contact.whatsappMessage)}` : '';
}
