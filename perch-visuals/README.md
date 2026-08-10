# Perch Visuals — site

A GTA real estate photography / drone / 360° tour site: flashy hero, work
samples, 3 selectable packages, a real calendar with slot booking, a sticky
checkout bar, and a handoff to Stripe for payment. Pure HTML/CSS/JS — no
build step, so it deploys straight to GitHub Pages.

## Put it online (GitHub Pages)

1. Create a new repo on GitHub (e.g. `perch-visuals`).
2. Upload these files to the repo root: `index.html`, `style.css`, `script.js`,
   plus an `images/` folder if you add your own photos.
   - Easiest way: on the repo page, **Add file → Upload files**, drag the
     files in, commit.
   - Or via git:
     ```
     git init
     git add .
     git commit -m "Launch Perch Visuals site"
     git branch -M main
     git remote add origin https://github.com/<your-username>/perch-visuals.git
     git push -u origin main
     ```
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment": **Source: Deploy from a branch**,
   **Branch: main**, folder **/ (root)** → Save.
5. Live in ~1 minute at `https://<your-username>.github.io/perch-visuals/`.
6. (Optional) Add a **custom domain** under Settings → Pages if you buy one
   (e.g. perchvisuals.ca) — GitHub gives you the DNS records to set.

## Connect Stripe (takes ~10 minutes, no code)

This site uses **Stripe Payment Links** — no backend or server code needed.

1. Create a free account at stripe.com, finish basic business verification.
2. In the Stripe Dashboard, go to **Product catalog → + Add product** and
   create three products matching the packages: *Ground Level* ($199 CAD),
   *Elevated* ($349 CAD), *Full Flight* ($549 CAD). One-time price, not
   recurring.
3. For each product, go to **Payment links → + New**, select that product,
   and create the link. Copy the resulting URL (looks like
   `https://buy.stripe.com/xxxxxxxx`).
4. Open `script.js` and paste your three real links into the `STRIPE_LINKS`
   object near the top, replacing the `REPLACE_ME` placeholders.
5. Commit and push — checkout now sends people to real Stripe checkout pages.

**Important limitation:** because this is a static site with no backend, the
calendar does **not** automatically grey out a slot the instant someone pays
— it's a client-side demo calendar. Two people could theoretically pick the
same slot. To fully automate that:
- Add a **Stripe webhook** (`checkout.session.completed`) pointed at a small
  serverless function (Vercel, Netlify Functions, or a Google Apps Script)
  that marks the slot booked in a real data source (Google Sheet, Airtable,
  or a database).
- Or, simpler to start: check your Stripe Dashboard each morning for new
  payments (the `client_reference_id` on each payment shows the package,
  date, time, and property address you booked) and manually update the
  `AVAILABILITY` object in `script.js`, then push the change.

## Things to swap before you launch

- **Photos** — every image currently pulls from loremflickr.com as a themed
  placeholder (GTA-style houses, kitchens, aerial shots). Replace each `src`
  in `index.html` with your own photography — drop files in `/images` and
  point to e.g. `images/mississauga-01.jpg`. This matters most: real photos
  of real GTA homes will sell the service far better than any placeholder.
- **Business name / tagline** — "PERCH" appears in the nav, hero, and footer.
- **Contact info** — footer email/phone.
- **Pricing & package details** — edit inside `<section id="packages">`.
- **Availability window** — `buildDemoAvailability()` in `script.js`
  auto-generates the next 21 days (skipping Sundays) with a pseudo-random
  open/booked pattern, purely so the calendar isn't empty. Replace the whole
  function with your real hours once you're ready, or wire it to a real
  calendar (Calendly / Google Calendar Appointment Schedules also work well
  dropped in place of the `#book` section, and sync automatically).

## Local preview

Just open `index.html` in a browser — no build tools needed. For a closer-to-
production preview, run a tiny local server from this folder:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.
