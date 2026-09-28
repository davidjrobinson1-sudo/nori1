# NORI Website

Static GitHub Pages-ready website for NORI NFC payment rings.

## Upload to GitHub

1. Upload all files in this folder to a GitHub repository.
2. In GitHub, open **Settings > Pages**.
3. Set the source to the repository branch that contains `index.html`.
4. Save and wait for GitHub Pages to publish.

## Files

- `index.html` - page content
- `styles.css` - layout and visual design
- `script.js` - mobile menu and Stripe Payment Links checkout routing
- `stripe-payment-links.csv` - the Stripe Payment Links currently connected to the site
- `create-stripe-payment-links.mjs` - optional local helper to create all 28 size-specific Stripe links
- image and document files - logo, product renders, policies, sizing guide, packaging, and lifestyle image

## Stripe Payment Links

The site currently uses one Stripe Payment Link per ring finish. The selected size is added to the checkout URL as `client_reference_id`, for example `obsidian-mirror-size-9`.

For the cleanest fulfilment workflow, create one Payment Link per finish and size, with names such as `NORI Obsidian Mirror - Size 9`.

### Optional: create all 28 links automatically

1. Revoke any Stripe secret key that was pasted into chat or screenshots.
2. Create a fresh Stripe secret key.
3. Open a terminal in this folder.
4. Set the key only for that terminal session:

   PowerShell:

   ```powershell
   $env:STRIPE_SECRET_KEY="sk_test_YOUR_NEW_SECRET_KEY"
   node .\create-stripe-payment-links.mjs
   ```

   macOS/Linux:

   ```bash
   STRIPE_SECRET_KEY="sk_test_YOUR_NEW_SECRET_KEY" node ./create-stripe-payment-links.mjs
   ```

The helper creates 28 Stripe Payment Links, updates `stripe-payment-links.csv`, and rewrites the `PAYMENT_LINKS` map in `script.js`.

## NORI approved logo system
- `nori-signal-logo.jpg` — primary compact logo for navigation/header.
- `nori-signal-lockup.jpg` — primary SIGNAL logo with tagline.
- `nori-pure-logo.jpg` — secondary PURE compact wordmark.
- `nori-pure-lockup.jpg` — secondary PURE wordmark with tagline.

The SIGNAL version is the primary consumer-facing mark; PURE is the quieter secondary mark for luxury/brand moments and small applications. The legal entity remains RINGO WEARABLES LIMITED.
