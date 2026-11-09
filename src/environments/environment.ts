/**
 * PRODUCTION environment.
 *
 * WEB3FORMS ACCESS KEY
 * --------------------
 * 1. Go to https://web3forms.com/ and create an Access Key using the email
 *    address that should RECEIVE inquiries (the owner email).
 * 2. Replace the text 'WEB3FORMS_ACCESS_KEY' below with that key.
 * 3. Do the same in environment.development.ts (used by `ng serve`).
 *
 * NOTE: A Web3Forms access key is PUBLIC by design. It is shipped to the
 * browser and is not a secret. Protect it by restricting allowed domains in
 * the Web3Forms dashboard (Settings → Domain restriction, where your plan
 * supports it).
 */
export const environment = {
  production: true,
  siteUrl: 'https://www.example.com', // TODO: replace with your real domain (used for canonical/OG URLs)
  web3forms: {
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: 'WEB3FORMS_ACCESS_KEY',
  },
};
