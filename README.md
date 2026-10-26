# EduAltTech Invoice Studio

Standalone invoice generator for EduAltTech (a product by Setsuzoku). Create
student invoices, auto-fill course fees, show actual and discounted prices,
track payments and balances, and print or save a branded A4 invoice as PDF.

Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.
All data stays on this machine — no external database or cloud account needed.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## What it does

- **Students**: name, email and phone captured per invoice.
- **Courses & fees**: pick a course and the actual and final discounted fee fill
  in automatically. Edit the catalogue under **Courses & fees** when prices
  change.
- **Payments**: mark unpaid, partially paid or paid in full. Amount paid,
  balance due and status update automatically; add later payments from the
  invoice page.
- **Invoice numbering**: `PREFIX-YEAR-0000` (default `EAT-2026-0001`), configured
  in **Settings**.
- **Print / PDF**: open any invoice and choose **Print / PDF**, then "Save as
  PDF" in the browser dialog.
- **Branding**: EduAltTech logo, Setsuzoku logo and watermark, and the
  blue/teal/navy Setsuzoku palette on the invoice.

## Co-founder signature (encrypted)

The signature is encrypted with **AES-256-GCM** before being written to disk:

- Ciphertext: `data/signature.enc` (outside `public/`, never served directly)
- Key: `data/signature.key` (generated on first use, or set a 64-character hex
  `SIGNATURE_SECRET` in `.env.local`)

The server decrypts the signature only while rendering an invoice. Invoice and
settings pages are sent with `Cache-Control: no-store`.

Upload or replace the signature in **Settings → Signature**. The signatory name
and title printed under the signature are also set there.

To replace the signature from the command line:

```bash
node scripts/encrypt-signature.mjs path/to/signature.png
```

Keep `data/signature.key` (or `SIGNATURE_SECRET`) private and back it up. Without
it the encrypted signature cannot be recovered.

## Data

Everything is stored in `data/db.json` (gitignored). Delete that file to reset
the app to the seeded course catalogue; the encrypted signature is kept
separately.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm start        # production server
npm run lint     # eslint
```
