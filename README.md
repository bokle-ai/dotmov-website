# DotMov — Brand Authority Through Visual Storytelling

Premium marketing website for **DotMov**, a personal-branding video production studio run by Raswanth, based in Chennai, India.

---

## 1. Running Locally

No build step required. Just open `index.html` in any modern browser:

```bash
# Option A — double-click
open index.html

# Option B — local server (avoids any file:// quirks with maps/embeds)
npx serve .
# or
python3 -m http.server 8080
# then visit http://localhost:8080
```

**Browser support:** Chrome, Safari, Firefox, Edge (latest). Mobile-first responsive. Tested at 375px (iPhone SE).

---

## 2. Re-running the Asset Fetch

If you need to re-download assets (e.g. after the fetch script is updated):

```bash
node scripts/fetch-assets.js
```

Requires **Node 18+** (uses native `fetch` and ES modules). No npm install needed.

The script will:
- Try to fetch real logos from dotmov.in
- Download client logos from Wikimedia
- Generate SVG placeholders for anything that fails
- Overwrite `assets/ASSETS_MANIFEST.md` with an updated status table

---

## 3. Deploying

### Netlify (recommended — fastest)
1. Go to [netlify.com](https://netlify.com) → "Add new site" → "Deploy manually"
2. Drag and drop the entire `DotMov/` folder into the deploy box
3. Your site is live in ~30 seconds
4. Point `dotmov.in` to Netlify: add a CNAME record `www → your-site.netlify.app` and an A record for the apex domain per Netlify's DNS instructions

### Vercel
```bash
npm i -g vercel
cd /path/to/DotMov
vercel
# Follow prompts — select "Other" as framework, root as output directory
```

### Traditional FTP / cPanel Hosting
1. Connect to your hosting via FTP (FileZilla etc.)
2. Upload the entire `DotMov/` folder contents to `public_html/` (or `www/`)
3. Ensure `index.html` is at the root of `public_html/`

> **Before going live:** take a full backup of the existing WordPress site at dotmov.in. Export via UpdraftPlus or ask your host to snapshot the current state. The new site replaces the WordPress install entirely.

---

## 4. Replacing Placeholder Assets

Open `assets/ASSETS_MANIFEST.md` — every file marked `placeholder` needs a real replacement before launch. Priority order:

| Priority | File(s) | What to replace with |
|----------|---------|----------------------|
| 🔴 High  | `assets/founder/raswanth.jpg` | Real headshot of Raswanth |
| 🔴 High  | `assets/celebrities/celeb-01` to `celeb-10.svg` | Actual DotMov event stills |
| 🟡 Med   | `assets/work/work-01` to `work-12.svg` | Real portfolio screenshots / stills |
| 🟡 Med   | `assets/testimonials/` | Real client names, roles, photos, and quotes |
| 🟡 Med   | `assets/instagram/ig-01` to `ig-06.svg` | Screenshots of real @dotmov.in posts |
| 🟢 Low   | `assets/clients/` (filler logos) | Real client brand logos |

**How to swap a file:** simply replace the file at the same path with the same filename. The HTML references those paths — no code changes needed.

For the testimonials, also update the quote copy inside `index.html` (search for `TODO: user to replace testimonial`).

---

## 5. Site Structure

```
/
├── index.html          Homepage (hero, trust strip, process, pricing, testimonials)
├── about.html          Founder story, mission, values, team
├── services.html       Six service cards + process
├── work.html           Portfolio grid with filter chips + lightbox
├── pricing.html        Full pricing + FAQ accordion
├── contact.html        Split layout: info/map + enquiry form
├── css/
│   └── style.css       Full brand design system (tokens, layout, components)
├── js/
│   └── main.js         Sticky nav, mobile nav, scroll reveal, count-up,
│                       FAQ accordion, portfolio filter/lightbox, contact form
├── assets/
│   ├── logo/           DotMov logo (fetched real PNGs + generated SVGs)
│   ├── founder/        Raswanth headshot (placeholder — replace)
│   ├── celebrities/    10 SVG event still placeholders (replace with real stills)
│   ├── clients/        10 client logos (adidas + naturals are real; rest placeholders)
│   ├── work/           12 portfolio tile placeholders (replace with real work)
│   ├── testimonials/   5 DiceBear initials avatars (real fetched SVGs)
│   ├── instagram/      6 Instagram tile placeholders (replace with real screenshots)
│   └── ASSETS_MANIFEST.md  Full status of every asset (real vs placeholder)
└── scripts/
    └── fetch-assets.js Asset downloader — re-run any time to refresh assets
```

---

## 6. Key Customisations

### Updating contact details
Search and replace across all HTML files:
- Phone: `+91 99431 11944` → your new number
- Email: `raswanthjagan@gmail.com` → your new email
- WhatsApp link: `https://wa.me/919943111944` → update the number in the URL

### Changing brand colours
Edit the CSS custom properties at the top of `css/style.css`:
```css
:root {
  --navy: #1a1b4b;
  --gold: #d4a642;
  /* ... */
}
```

### Adding real portfolio work
In `work.html`, replace the `src` of each `.work-tile img` and update the `data-*` attributes (title, client, service, desc) for the lightbox.

### Connecting a real form backend
The contact form currently uses `mailto:`. To use a proper backend:
- **Netlify Forms:** add `data-netlify="true"` to the `<form>` tag and remove the JS submit handler
- **Formspree:** change the form `action` to your Formspree endpoint
- **Custom backend:** replace the `mailto:` logic in `js/main.js` `contactForm` handler with a `fetch()` POST

---

## 7. Notes

- The hero video `assets/logo/hero-reel.mp4` was successfully fetched from dotmov.in. To use it as a background: add a `<video>` tag inside `.hero` with `autoplay muted loop playsinline`.
- The real DotMov logo PNGs (`logo-fetched-1.png`, `logo-fetched-2.png`) were downloaded from dotmov.in — these are used in the navbar across all pages.
- Adidas SVG and Naturals Salon PNG logos are real (Wikimedia + naturals.in). All others are styled SVG wordmarks.
- The site scores well on Lighthouse: pure HTML/CSS/JS, no framework overhead, lazy-loaded images, system font fallbacks, minimal JS.
