import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    data: {
      seo: {
        title: 'TheCreateStudio | Creative Digital Marketing & Website, App Development Agency',
        description:
          'TheCreateStudio is a creative digital agency for social media marketing, branding, SEO, website development and mobile app development. We create. You grow.',
      },
    },
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then((m) => m.AboutComponent),
    data: {
      seo: {
        title: 'About Us',
        description:
          'Meet TheCreateStudio — a creative digital agency combining marketing, design and technology to help businesses build a powerful digital presence.',
      },
    },
  },
  {
    path: 'digital-marketing',
    loadComponent: () =>
      import('./features/digital-marketing/digital-marketing.component').then((m) => m.DigitalMarketingComponent),
    data: {
      seo: {
        title: 'Digital Marketing Services',
        description:
          'Social media marketing, graphic design, reels, SEO & GEO, Meta and Google Ads, email marketing and branding from a creative digital marketing agency.',
      },
    },
  },
  {
    path: 'development',
    loadComponent: () => import('./features/development/development.component').then((m) => m.DevelopmentComponent),
    data: {
      seo: {
        title: 'Website & App Development',
        description:
          'Website development, custom web applications, Android & iOS mobile app development and UI/UX design built with modern technology.',
      },
    },
  },
  {
    path: 'work',
    loadComponent: () => import('./features/portfolio/portfolio.component').then((m) => m.PortfolioComponent),
    data: {
      seo: {
        title: 'Our Work',
        description: 'Explore the TheCreateStudio portfolio across digital marketing, branding, social media creatives, websites, mobile apps and UI/UX.',
      },
    },
  },
  { path: 'portfolio', redirectTo: 'work' },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then((m) => m.ContactComponent),
    data: {
      seo: {
        title: 'Contact Us',
        description: 'Start your project with TheCreateStudio. Tell us about your digital marketing, website or mobile app requirements.',
      },
    },
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/legal/privacy.component').then((m) => m.PrivacyComponent),
    data: { seo: { title: 'Privacy Policy', description: 'How TheCreateStudio collects, uses and protects information submitted through this website.' } },
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/legal/terms.component').then((m) => m.TermsComponent),
    data: { seo: { title: 'Terms & Conditions', description: 'Terms and conditions for using the TheCreateStudio website.' } },
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
    data: { seo: { title: 'Page Not Found', description: 'The page you are looking for does not exist.', noindex: true } },
  },
];
