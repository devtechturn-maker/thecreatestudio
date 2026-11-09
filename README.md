# TheCreateStudio — Agency Website

**WE CREATE. YOU GROW.** A premium, animated Angular website for TheCreateStudio: digital marketing plus website & app development.

## Tech stack
- **Angular 21** (standalone components, zoneless, signals, lazy-loaded routes, Reactive Forms)
- **TypeScript** + **SCSS** design system (`src/styles.scss`)
- **GSAP 3 + ScrollTrigger** for animations (every component cleans up its tweens and triggers on destroy)
- **Web3Forms** for the contact form. There is no backend, SMTP or database.
- Google Fonts: Space Grotesk, Inter, Manrope

> Note: Angular 22 (the newest version) needs Node ≥ 24.15. This machine has Node 24.11.1, so the project uses Angular 21. To upgrade later, update Node and then run `ng update @angular/core@22 @angular/cli@22`.

## Folder structure
```
src/
  app/
    core/
      config/      site.config.ts (contact/social/stats), services.data.ts,
                   portfolio.data.ts, testimonials.data.ts
      services/    seo.service.ts, motion.service.ts (GSAP), web3forms.service.ts
    shared/
      components/  navbar/, footer, loader, cursor, floating-actions (WhatsApp + back-to-top),
                   cta-section, brand (wordmark), icon, service-visual
      directives/  reveal, magnetic, parallax, counter
    features/      home/, about/, digital-marketing/, development/, portfolio/,
                   contact/, legal/ (privacy, terms), not-found/
    layouts/       main-layout.component.ts (shell + page transitions)
    app.routes.ts  routes + per-page SEO metadata
    app.config.ts
  environments/    environment.ts (prod), environment.development.ts (dev)
  styles.scss      design tokens, typography, buttons, cards, forms, utilities
public/
  assets/projects/ demo project images (SVG)
  assets/images/   og-image.svg
  robots.txt, sitemap.xml, favicon.svg
```

## Install & run
```bash
npm install
npm start            # http://localhost:4200
npm run build        # production build → dist/TheCreateStudio/browser
```

## Web3Forms setup (contact form)
1. Go to https://web3forms.com/ and enter the **email address that should receive inquiries** (the owner email). You'll get an **Access Key** by email.
2. Open `src/environments/environment.ts` **and** `src/environments/environment.development.ts` and replace `'WEB3FORMS_ACCESS_KEY'` with your key:
   ```ts
   web3forms: { endpoint: 'https://api.web3forms.com/submit', accessKey: 'your-key-here' }
   ```
3. Restart `npm start` and send a test inquiry. You should receive an email with the subject **"New Project Inquiry – TheCreateStudio"** that lists every field (name, company, email, phone, service, budget, preferred contact method, message).

**How it works:** Angular validates the form, then POSTs JSON to `https://api.web3forms.com/submit`. The success screen shows **only** when Web3Forms returns `success: true`. Network or API errors show an error message. Until a key is configured, the form shows a setup notice and refuses to "succeed".

**Spam & abuse controls:** a hidden `botcheck` honeypot (Web3Forms' native field), a minimum time-on-page check, a 60-second cooldown between submissions, and a guard against double submits.

**Security notes**
- The Web3Forms access key is **public by design**. It ships in the browser bundle and is **not a secret**. No SMTP credentials exist anywhere in this project.
- In the Web3Forms dashboard, restrict the key to your domain (domain allow-list) where your plan supports it.
- Email delivery depends on Web3Forms and your mail provider and isn't guaranteed. Check your spam folder.

### Owner email & autoresponder
- The **owner email** is the address you used to create the access key. To change it, go to the Web3Forms dashboard (or create a new key for the new email) and update the key in the environment files.
- **Autoresponse to the customer** is a Web3Forms paid (Pro) feature. Enable it in the dashboard; the form already sends the visitor's `email` and `replyto` fields, which it uses.

## Contact details, WhatsApp & social links
Edit `src/app/core/config/site.config.ts`:
```ts
contact: {
  email: 'hello@yourdomain.com',
  phone: '+91 98765 43210',
  whatsapp: '919876543210',     // digits only, with country code
  whatsappMessage: "Hi TheCreateStudio! ...",
  address: 'Your office address',
},
social: { instagram: 'https://instagram.com/...', linkedin: 'https://linkedin.com/company/...', facebook: 'https://facebook.com/...' },
```
Empty values are hidden automatically. The floating WhatsApp button and the social icons appear only once they are filled in. No fake details are included.

### Statistics
`stats` in the same file holds **placeholder zeros** and `showStats: false`. Enter your real numbers, then set `showStats: true` to show the animated counters on the home page.

### Testimonials
`src/app/core/config/testimonials.data.ts` holds **sample placeholders**, and they are labelled "Sample" on the site. Replace them with real, permitted client feedback and set `sample: false`.

## Adding portfolio projects
Edit `src/app/core/config/portfolio.data.ts`:
```ts
{
  slug: 'acme-website',                    // unique, used in ?project=acme-website
  title: 'Acme Corporate Website',
  category: 'Website Development',          // one of PORTFOLIO_CATEGORIES
  image: 'assets/projects/acme.jpg',        // put the file in public/assets/projects/
  summary: 'One-line description.',
  details: 'Longer description shown in the detail view.',
  technologies: ['Angular', 'Node.js'],
  liveUrl: 'https://acme.com',              // optional
  featured: true,                           // show on the home page (first 4)
  size: 'normal',                           // 'normal' | 'tall' | 'wide' (grid layout)
  demo: false,
}
```
The current 9 entries are **demo concepts** (`demo: true`) and carry a "Demo" label. Remove them when you add real work. Use optimised images (WebP/JPG, about 1600px wide).

## SEO
- Each page's title and description live in `src/app/app.routes.ts` (`data.seo`). `SeoService` sets the title, description, Open Graph tags, Twitter card tags and the canonical URL.
- Set your real domain in `environment.ts` (`siteUrl`), `public/robots.txt` and `public/sitemap.xml`.
- Organization JSON-LD is added automatically. LocalBusiness schema is intentionally left out until you have a real address.
- Social previews: many platforms don't support SVG. Export `og-image.svg` (or your own design) as a 1200×630 PNG at `public/assets/images/og-image.png`, then update the path in `seo.service.ts`.

## Deployment
This is a single-page app, so every route must fall back to `index.html`.
- **Netlify:** build command `npm run build`, publish directory `dist/TheCreateStudio/browser`, and add a `_redirects` file in `public/` containing `/*  /index.html  200`.
- **Vercel:** use the same build and output directory, plus a rewrite of `/(.*)` → `/index.html`.
- **Firebase Hosting:** set `"public": "dist/TheCreateStudio/browser"` with a rewrite of `**` → `/index.html`.
- **Apache/cPanel:** upload the `browser` folder contents and add an `.htaccess` file with a rewrite to `index.html`.

After deploying, add your domain to the Web3Forms allow-list and submit `sitemap.xml` in Google Search Console.

## Accessibility & motion
Skip link, keyboard-accessible dropdown and menu (Escape closes them), ARIA states on tabs, accordions and toggles, labelled form fields with announced errors, and visible focus rings. Users with `prefers-reduced-motion` get a static site with no loader, reveals, parallax or custom cursor. The custom cursor and magnetic effects run only on fine-pointer (desktop) devices.

## Before going live
- [ ] Web3Forms key added and a test inquiry received
- [ ] Contact details and social links filled in
- [ ] Domain set in environment, robots.txt and sitemap.xml
- [ ] Demo projects and sample testimonials replaced
- [ ] Privacy Policy and Terms reviewed by a legal professional
