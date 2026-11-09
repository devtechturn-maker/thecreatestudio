/**
 * TESTIMONIALS — these are SAMPLE PLACEHOLDERS, not real client feedback.
 * Replace with genuine testimonials (with permission) and set `sample: false`.
 */
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  sample: boolean;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Placeholder testimonial. Replace this text with real feedback from a client about their social media and branding experience.',
    name: 'Client Name',
    role: 'Founder, Sample Business',
    sample: true,
  },
  {
    quote:
      'Placeholder testimonial. Replace this text with real feedback from a client whose website or web application you delivered.',
    name: 'Client Name',
    role: 'Director, Sample Company',
    sample: true,
  },
  {
    quote:
      'Placeholder testimonial. Replace this text with real feedback from a client whose mobile app or campaign you worked on.',
    name: 'Client Name',
    role: 'Marketing Head, Sample Brand',
    sample: true,
  },
];
