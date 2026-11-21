/** DEVELOPMENT environment (used by `ng serve`). See environment.ts for instructions. */
export const environment = {
  production: false,
  siteUrl: 'http://localhost:4200',
  /** Backend API base. Served by nginx at /api in production; proxied to :8080 by ng serve. */
  apiBase: '/api',
  web3forms: {
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: 'WEB3FORMS_ACCESS_KEY',
  },
};
