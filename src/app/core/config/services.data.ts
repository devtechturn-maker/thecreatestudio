/** SERVICES DATA — edit service names, descriptions and deliverables here. */
export interface ServiceItem {
  id: string;
  no: string;
  title: string;
  icon: string;
  description: string;
  items: string[];
  hue: number; // accent hue for the visual tile
}

export interface ServiceGroup {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: string[];
}

export const MARKETING_SERVICES: ServiceItem[] = [
  {
    id: 'social-media',
    no: '01',
    title: 'Social Media Management',
    icon: 'share',
    hue: 280,
    description:
      'Consistent, strategic presence across platforms — planned, published and managed so your audience keeps coming back.',
    items: ['Instagram Management', 'Facebook Management', 'LinkedIn Management', 'Social Media Strategy', 'Content Calendar', 'Account Management', 'Community Management', 'Audience Engagement', 'Social Media Analytics'],
  },
  {
    id: 'graphic-design',
    no: '02',
    title: 'Graphic Designing & Creative Content',
    icon: 'pen',
    hue: 320,
    description:
      'Scroll-stopping creatives that look premium, stay on-brand and communicate your message in a glance.',
    items: ['Instagram Static Posts', 'Carousel Posts', 'Promotional Creatives', 'Festival Posts', 'Brand Creatives', 'Advertising Creatives', 'Infographics', 'Business Promotional Designs', 'Social Media Templates'],
  },
  {
    id: 'video',
    no: '03',
    title: 'Reels & Video Editing',
    icon: 'play',
    hue: 250,
    description:
      'Short-form video that hooks in the first second — edited with rhythm, motion and purpose.',
    items: ['Instagram Reels', 'Promotional Videos', 'Product Videos', 'Business Reels', 'Short-Form Video Content', 'Video Editing', 'Motion Graphics', 'Video Advertisements'],
  },
  {
    id: 'seo',
    no: '04',
    title: 'Search Engine Optimization (SEO)',
    icon: 'search',
    hue: 210,
    description:
      'Technical, on-page and off-page SEO that helps the right customers find you on Google.',
    items: ['On-Page SEO', 'Off-Page SEO', 'Technical SEO', 'Keyword Research', 'Website Optimization', 'Local SEO', 'SEO Audits', 'Content Optimization', 'Competitor Analysis'],
  },
  {
    id: 'geo',
    no: '05',
    title: 'Generative Engine Optimization (GEO)',
    icon: 'spark',
    hue: 265,
    description:
      'Make your brand discoverable and accurately represented in AI-powered search and answer engines.',
    items: ['AI Search Visibility', 'Generative Search Optimization', 'Brand Visibility in AI Search', 'Structured Content Optimization', 'Entity Optimization', 'Brand Authority Building'],
  },
  {
    id: 'ads',
    no: '06',
    title: 'Paid Advertising & Campaign Management',
    icon: 'target',
    hue: 240,
    description:
      'Performance campaigns on Meta and Google built around clear goals, smart targeting and honest reporting.',
    items: ['Meta Ads', 'Instagram Ads', 'Facebook Ads', 'Google Ads', 'Campaign Strategy', 'Lead Generation', 'Retargeting', 'Conversion Optimization', 'Performance Reporting'],
  },
  {
    id: 'stories',
    no: '07',
    title: 'Instagram Stories & Promotions',
    icon: 'circle',
    hue: 300,
    description:
      'Daily story content and promotions that keep your brand top-of-mind and drive quick action.',
    items: ['Instagram Story Management', 'Promotional Stories', 'Story Designing', 'Story Boosting', 'Engagement Campaigns', 'Brand Awareness Campaigns', 'Story Content Strategy'],
  },
  {
    id: 'email',
    no: '08',
    title: 'Email Marketing',
    icon: 'mail',
    hue: 225,
    description:
      'Beautiful, automated email journeys that nurture leads and bring customers back.',
    items: ['Email Campaign Design', 'Promotional Emails', 'Newsletter Management', 'Email Automation', 'Lead Nurturing', 'Email Campaign Analytics'],
  },
  {
    id: 'branding',
    no: '09',
    title: 'Brand Identity & Strategy',
    icon: 'diamond',
    hue: 275,
    description:
      'Distinctive identities and strategic positioning that make your brand instantly recognisable.',
    items: ['Logo Design', 'Brand Identity', 'Brand Guidelines', 'Brand Positioning', 'Creative Direction', 'Marketing Strategy', 'Visual Identity Systems'],
  },
  {
    id: 'consultation',
    no: '10',
    title: 'Digital Marketing Consultation',
    icon: 'compass',
    hue: 255,
    description:
      'Clear audits and practical growth plans so every rupee of your marketing works harder.',
    items: ['Business Growth Strategy', 'Competitor Analysis', 'Marketing Audits', 'Social Media Audits', 'Campaign Planning', 'Digital Presence Audits'],
  },
];

export const DEV_SERVICES: ServiceGroup[] = [
  {
    id: 'websites',
    title: 'Website Development',
    icon: 'globe',
    description: 'Fast, responsive, SEO-ready websites designed to convert visitors into customers.',
    items: ['Business Websites', 'Corporate Websites', 'Portfolio Websites', 'Landing Pages', 'E-commerce Websites', 'WordPress Websites', 'Custom Websites', 'Responsive Websites'],
  },
  {
    id: 'web-apps',
    title: 'Web Application Development',
    icon: 'layers',
    description: 'Scalable, secure web applications that streamline operations and power your business.',
    items: ['Custom Web Applications', 'Admin Dashboards', 'CRM Systems', 'ERP Solutions', 'SaaS Platforms', 'Management Systems', 'API Integrations', 'Database-Driven Applications'],
  },
  {
    id: 'mobile',
    title: 'Mobile Application Development',
    icon: 'phone',
    description: 'Native-quality Android and iOS apps your users will love to open every day.',
    items: ['Android Applications', 'iOS Applications', 'Cross-Platform Applications', 'Flutter Applications', 'React Native Applications', 'Business Applications', 'Custom Mobile Applications'],
  },
  {
    id: 'uiux',
    title: 'UI/UX Design',
    icon: 'pen',
    description: 'Research-led interfaces that are intuitive, accessible and beautifully crafted.',
    items: ['Website UI/UX', 'Mobile App UI/UX', 'Wireframing', 'Prototyping', 'Dashboard Design', 'User Experience Optimization'],
  },
];

export const TECH_STACK: { group: string; items: string[] }[] = [
  { group: 'Frontend', items: ['Angular', 'React', 'Next.js', 'HTML', 'CSS', 'JavaScript', 'TypeScript'] },
  { group: 'Backend', items: ['Java', 'Spring Boot', 'Node.js'] },
  { group: 'Database', items: ['PostgreSQL', 'MySQL', 'Firebase'] },
  { group: 'Mobile', items: ['Flutter', 'React Native'] },
];

export const DEV_PROCESS = [
  { title: 'Requirement Analysis', text: 'We understand your goals, users, features and constraints, then define a clear scope.' },
  { title: 'UI/UX Design', text: 'Wireframes and high-fidelity designs that you review and approve before a line of code.' },
  { title: 'Development', text: 'Clean, scalable code built in iterations with regular demos and transparent progress.' },
  { title: 'Testing', text: 'Functional, responsive and performance testing across devices and browsers.' },
  { title: 'Deployment', text: 'Secure launch to production with domain, hosting and analytics configured.' },
  { title: 'Maintenance & Support', text: 'Updates, monitoring and improvements so your product keeps getting better.' },
];

export const CONTACT_SERVICES = [
  'Social Media Management', 'Graphic Designing', 'Reels & Video Editing', 'SEO', 'GEO', 'Meta Ads',
  'Google Ads', 'Email Marketing', 'Branding', 'Website Development', 'Web Application Development',
  'Mobile App Development', 'UI/UX Design', 'Complete Digital Marketing', 'Other',
];

export const BUDGETS = ['Under ₹10,000', '₹10,000 – ₹25,000', '₹25,000 – ₹50,000', '₹50,000 – ₹1,00,000', '₹1,00,000+'];
