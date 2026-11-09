/**
 * PORTFOLIO DATA — add, edit or remove projects here.
 *
 * Every entry below is a clearly marked DEMO project (`demo: true`). They are
 * not real clients. Replace them with your real work and set `demo: false`.
 *
 * Images: put files in /public/assets/projects/ and reference them as
 * 'assets/projects/your-image.jpg'.
 */
export type PortfolioCategory =
  | 'Digital Marketing'
  | 'Social Media Creatives'
  | 'Branding'
  | 'Website Development'
  | 'Mobile Applications'
  | 'UI/UX Design';

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  'Digital Marketing',
  'Social Media Creatives',
  'Branding',
  'Website Development',
  'Mobile Applications',
  'UI/UX Design',
];

export interface Project {
  slug: string;
  title: string;
  category: PortfolioCategory;
  image: string;
  summary: string;
  details: string;
  technologies: string[];
  liveUrl?: string;
  featured?: boolean;
  size?: 'tall' | 'wide' | 'normal';
  demo: boolean;
}

export const PROJECTS: Project[] = [
  {
    slug: 'demo-cafe-social',
    title: 'Café Social Launch',
    category: 'Social Media Creatives',
    image: 'assets/projects/demo-1.svg',
    summary: 'A sample Instagram content system for a neighbourhood café.',
    details:
      'Demo concept showing a 30-day content calendar, carousel templates and reel cover designs built around a warm, playful visual language.',
    technologies: ['Instagram', 'Figma', 'Content Calendar'],
    featured: true,
    size: 'tall',
    demo: true,
  },
  {
    slug: 'demo-fintech-dashboard',
    title: 'Fintech Dashboard',
    category: 'UI/UX Design',
    image: 'assets/projects/demo-2.svg',
    summary: 'A sample analytics dashboard concept for a payments startup.',
    details:
      'Demo concept: information architecture, wireframes and a high-fidelity dashboard design system with dark and light themes.',
    technologies: ['Figma', 'Design System', 'Prototyping'],
    featured: true,
    size: 'normal',
    demo: true,
  },
  {
    slug: 'demo-fashion-store',
    title: 'Fashion E-commerce Store',
    category: 'Website Development',
    image: 'assets/projects/demo-3.svg',
    summary: 'A sample headless storefront concept for a clothing label.',
    details:
      'Demo concept: a fast, responsive storefront with product filtering, wishlist and checkout flow.',
    technologies: ['Angular', 'Node.js', 'PostgreSQL'],
    featured: true,
    size: 'wide',
    demo: true,
  },
  {
    slug: 'demo-fitness-app',
    title: 'Fitness Tracker App',
    category: 'Mobile Applications',
    image: 'assets/projects/demo-4.svg',
    summary: 'A sample cross-platform workout tracking app concept.',
    details:
      'Demo concept: onboarding, workout plans, progress charts and reminders for Android and iOS.',
    technologies: ['Flutter', 'Firebase'],
    featured: true,
    size: 'tall',
    demo: true,
  },
  {
    slug: 'demo-organic-brand',
    title: 'Organic Foods Identity',
    category: 'Branding',
    image: 'assets/projects/demo-5.svg',
    summary: 'A sample brand identity concept for an organic food label.',
    details:
      'Demo concept: logo, colour palette, typography, packaging direction and brand guidelines.',
    technologies: ['Brand Strategy', 'Logo Design', 'Guidelines'],
    size: 'normal',
    demo: true,
  },
  {
    slug: 'demo-realty-campaign',
    title: 'Real Estate Lead Campaign',
    category: 'Digital Marketing',
    image: 'assets/projects/demo-6.svg',
    summary: 'A sample Meta + Google Ads lead generation campaign concept.',
    details:
      'Demo concept: audience strategy, ad creatives, landing page and retargeting funnel structure.',
    technologies: ['Meta Ads', 'Google Ads', 'Landing Page'],
    size: 'normal',
    demo: true,
  },
  {
    slug: 'demo-clinic-crm',
    title: 'Clinic Management System',
    category: 'Website Development',
    image: 'assets/projects/demo-7.svg',
    summary: 'A sample web application concept for appointment management.',
    details:
      'Demo concept: role-based admin dashboard, appointments, patient records and reports.',
    technologies: ['Angular', 'Spring Boot', 'MySQL'],
    size: 'wide',
    demo: true,
  },
  {
    slug: 'demo-festival-creatives',
    title: 'Festival Creative Series',
    category: 'Social Media Creatives',
    image: 'assets/projects/demo-8.svg',
    summary: 'A sample set of festive social media post designs.',
    details: 'Demo concept: a consistent template series for festival greetings and offers.',
    technologies: ['Illustrator', 'Photoshop'],
    size: 'normal',
    demo: true,
  },
  {
    slug: 'demo-delivery-app',
    title: 'Food Delivery App UI',
    category: 'Mobile Applications',
    image: 'assets/projects/demo-9.svg',
    summary: 'A sample React Native food ordering app concept.',
    details: 'Demo concept: menu browsing, cart, live order tracking and payment screens.',
    technologies: ['React Native', 'Node.js'],
    size: 'tall',
    demo: true,
  },
];
