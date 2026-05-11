#!/usr/bin/env node
/**
 * DotMov asset fetcher
 * Run: node scripts/fetch-assets.js
 * Requires Node 18+ (native fetch)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const manifest = [];

function log(msg) { console.log('[fetch-assets]', msg); }

// ── helpers ────────────────────────────────────────────────────────────────

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 DotMovAssetFetcher/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        file.destroy();
        fs.unlink(dest, () => {});
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.destroy();
        fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(true)));
    });
    req.on('error', (e) => { file.destroy(); fs.unlink(dest, () => {}); reject(e); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function tryDownload(urls, dest, label) {
  for (const url of urls) {
    try {
      await download(url, dest);
      log(`✅  ${label} → ${url}`);
      manifest.push({ file: dest.replace(ROOT + '/', ''), source: url, status: 'real' });
      return true;
    } catch (e) {
      log(`⚠️  ${label}: failed ${url} (${e.message})`);
    }
  }
  return false;
}

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 DotMovAssetFetcher/1.0' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return res.text();
  } catch { return null; }
}

function writeFile(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

function record(file, source, status) {
  manifest.push({ file: file.replace(ROOT + '/', ''), source, status });
}

// ── A. Logo & favicon ──────────────────────────────────────────────────────

async function fetchLogos() {
  log('--- A. Logo & favicon ---');

  // Try to get favicon
  const faviconDest = path.join(ROOT, 'assets/logo/favicon.ico');
  const gotFavicon = await tryDownload(['https://dotmov.in/favicon.ico'], faviconDest, 'favicon.ico');
  if (!gotFavicon) {
    // Generate a minimal ICO-like placeholder (actually a 1x1 transparent PNG base64 renamed .ico)
    // We'll write a real SVG favicon instead
    const svgFav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#1a1b4b" rx="4"/><text x="16" y="22" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="14" fill="#d4a642">.M</text></svg>`;
    writeFile(faviconDest, svgFav);
    record(faviconDest, 'generated', 'placeholder');
    log('📝  favicon: wrote SVG placeholder');
  }

  // Parse dotmov.in homepage for logo images
  let logoFound = false;
  const html = await fetchText('https://dotmov.in/');
  if (html) {
    const uploadMatches = [...html.matchAll(/https?:\/\/dotmov\.in\/wp-content\/uploads\/[^\s"'<>]+\.(png|jpg|jpeg|svg|webp)/gi)];
    const logoUrls = uploadMatches
      .map(m => m[0])
      .filter(u => /logo|\.mov|dotmov/i.test(u))
      .slice(0, 3);

    log(`Found ${logoUrls.length} logo candidates on dotmov.in`);
    for (let i = 0; i < logoUrls.length; i++) {
      const ext = logoUrls[i].split('.').pop().split('?')[0];
      const dest = path.join(ROOT, `assets/logo/logo-fetched-${i + 1}.${ext}`);
      await tryDownload([logoUrls[i]], dest, `logo-fetched-${i + 1}`);
    }
  }

  // Try hero reel
  const reelDest = path.join(ROOT, 'assets/logo/hero-reel.mp4');
  await tryDownload(['https://dotmov.in/wp-content/uploads/2024/08/MOV-Intro.mp4'], reelDest, 'hero-reel.mp4');

  // Always write SVG logo (primary brand asset)
  const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60">
  <rect width="240" height="60" fill="transparent"/>
  <text x="0" y="42" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="38" fill="#d4a642" letter-spacing="1">.MOV</text>
</svg>`;
  writeFile(path.join(ROOT, 'assets/logo/logo.svg'), svgLogo);
  record(path.join(ROOT, 'assets/logo/logo.svg'), 'generated', 'real');

  const svgLogoDark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60">
  <rect width="240" height="60" fill="transparent"/>
  <text x="0" y="42" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="38" fill="#1a1b4b" letter-spacing="1">.MOV</text>
</svg>`;
  writeFile(path.join(ROOT, 'assets/logo/logo-dark.svg'), svgLogoDark);
  record(path.join(ROOT, 'assets/logo/logo-dark.svg'), 'generated', 'real');

  // OG image SVG
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#1a1b4b"/>
  <polygon points="900,0 1200,0 1200,630" fill="#0f1035" opacity="0.6"/>
  <polygon points="0,630 400,630 0,200" fill="#0f1035" opacity="0.4"/>
  <text x="600" y="260" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="96" fill="#d4a642" letter-spacing="4">.MOV</text>
  <text x="600" y="340" text-anchor="middle" font-family="Inter,sans-serif" font-weight="400" font-size="28" fill="#ffffff" letter-spacing="2">Building Brand Authority Through Visual Storytelling</text>
  <text x="600" y="400" text-anchor="middle" font-family="Inter,sans-serif" font-weight="400" font-size="20" fill="#d4a642" letter-spacing="4">DOTMOV.IN · CHENNAI</text>
</svg>`;
  writeFile(path.join(ROOT, 'assets/logo/og-image.jpg'), ogSvg);
  record(path.join(ROOT, 'assets/logo/og-image.jpg'), 'generated', 'placeholder — rename to .svg or convert to real JPG');
}

// ── B. Founder photo ────────────────────────────────────────────────────────

async function fetchFounder() {
  log('--- B. Founder photo ---');
  const dest = path.join(ROOT, 'assets/founder/raswanth.jpg');

  const aboutHtml = await fetchText('https://dotmov.in/about-us/');
  if (aboutHtml) {
    const imgMatches = [...aboutHtml.matchAll(/https?:\/\/dotmov\.in\/wp-content\/uploads\/[^\s"'<>]+\.(png|jpg|jpeg|webp)/gi)];
    const founderUrls = imgMatches.map(m => m[0]).filter(u => /raswanth|founder|team/i.test(u));
    if (founderUrls.length > 0) {
      const ok = await tryDownload(founderUrls, dest, 'raswanth founder photo');
      if (ok) return;
    }
  }

  // Fallback: SVG placeholder portrait
  const svgPortrait = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
  <rect width="600" height="750" fill="#1a1b4b"/>
  <polygon points="0,600 600,400 600,750 0,750" fill="#0f1035" opacity="0.5"/>
  <circle cx="300" cy="240" r="120" fill="#d4a642" opacity="0.15"/>
  <circle cx="300" cy="210" r="80" fill="#d4a642" opacity="0.2"/>
  <!-- Head silhouette -->
  <ellipse cx="300" cy="200" rx="70" ry="80" fill="#d4a642" opacity="0.4"/>
  <rect x="200" y="320" width="200" height="180" rx="20" fill="#d4a642" opacity="0.3"/>
  <text x="300" y="580" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="32" fill="#d4a642" letter-spacing="3">RASWANTH</text>
  <text x="300" y="620" text-anchor="middle" font-family="Inter,sans-serif" font-weight="400" font-size="18" fill="#ffffff" letter-spacing="1">Founder, DotMov</text>
  <text x="300" y="660" text-anchor="middle" font-family="Inter,sans-serif" font-weight="400" font-size="13" fill="#d4a642" opacity="0.7">TODO: replace with real headshot</text>
</svg>`;
  writeFile(dest, svgPortrait);
  record(dest, '(fetch failed)', 'placeholder — TODO: replace with real headshot');
  log('📝  founder: wrote SVG placeholder');
}

// ── C. Celebrity / event stills ─────────────────────────────────────────────

function generateCelebPlaceholders() {
  log('--- C. Celebrity placeholders ---');
  const palettes = [
    { bg: '#1a1b4b', accent: '#d4a642' },
    { bg: '#8b1a1a', accent: '#f5c842' },
    { bg: '#0a3d62', accent: '#e8c270' },
    { bg: '#1b4332', accent: '#d4a642' },
    { bg: '#2d1b69', accent: '#e8c270' },
    { bg: '#7b2d00', accent: '#f5c842' },
    { bg: '#0f3460', accent: '#d4a642' },
    { bg: '#1a0a2e', accent: '#e8c270' },
    { bg: '#3d1a00', accent: '#d4a642' },
    { bg: '#0a2744', accent: '#f5c842' },
  ];

  const labels = [
    'A.R. RAHMAN EVENT', 'KAMAL HAASAN EVENT', 'DHANUSH LAUNCH',
    'VIJAY ANTONY SHOW', 'ALLU ARJUN EVENT', 'RASHMIKA MANDANNA',
    'TRISHA EVENT', 'MANI RATNAM PREMIERE', 'CELEBRITY SHOOT', 'BRAND LAUNCH'
  ];

  for (let i = 1; i <= 10; i++) {
    const p = palettes[i - 1];
    const label = labels[i - 1];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <rect width="600" height="600" fill="${p.bg}"/>
  <polygon points="0,0 200,0 0,200" fill="${p.accent}" opacity="0.12"/>
  <polygon points="600,600 400,600 600,400" fill="${p.accent}" opacity="0.12"/>
  <!-- Camera icon -->
  <rect x="200" y="210" width="200" height="150" rx="12" fill="none" stroke="${p.accent}" stroke-width="6"/>
  <circle cx="300" cy="285" r="45" fill="none" stroke="${p.accent}" stroke-width="5"/>
  <circle cx="300" cy="285" r="28" fill="${p.accent}" opacity="0.3"/>
  <rect x="270" y="198" width="60" height="20" rx="6" fill="${p.accent}" opacity="0.6"/>
  <circle cx="370" cy="230" r="10" fill="${p.accent}" opacity="0.5"/>
  <!-- Label bar -->
  <rect x="0" y="510" width="600" height="90" fill="${p.accent}" opacity="0.15"/>
  <text x="300" y="552" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="18" fill="${p.accent}" letter-spacing="2">${label}</text>
  <text x="300" y="580" text-anchor="middle" font-family="Inter,sans-serif" font-weight="400" font-size="12" fill="${p.accent}" opacity="0.6">DOTMOV EVENT STILL</text>
</svg>`;
    const dest = path.join(ROOT, `assets/celebrities/celeb-${String(i).padStart(2, '0')}.svg`);
    writeFile(dest, svg);
    record(dest, 'generated', 'placeholder — user to replace with real event photos');
  }
  log('📝  celebrities: wrote 10 SVG placeholders');
}

// ── Work placeholders ─────────────────────────────────────────────────────

function generateWorkPlaceholders() {
  log('--- Work placeholders ---');
  const items = [
    { label: 'PERSONAL BRANDING', aspect: '1/1', w: 600, h: 600 },
    { label: 'EVENT COVERAGE', aspect: '4/5', w: 600, h: 750 },
    { label: 'PRODUCT SHOOT', aspect: '16/9', w: 800, h: 450 },
    { label: 'REELS', aspect: '9/16', w: 450, h: 800 },
    { label: 'FOUNDER STORY', aspect: '1/1', w: 600, h: 600 },
    { label: 'BRAND FILM', aspect: '16/9', w: 800, h: 450 },
    { label: 'PODCAST', aspect: '4/5', w: 600, h: 750 },
    { label: 'CELEBRITY EVENT', aspect: '1/1', w: 600, h: 600 },
    { label: 'PRODUCT LAUNCH', aspect: '16/9', w: 800, h: 450 },
    { label: 'STORY CRAFTING', aspect: '9/16', w: 450, h: 800 },
    { label: 'BRAND AUTHORITY', aspect: '1/1', w: 600, h: 600 },
    { label: 'CONTENT STRATEGY', aspect: '4/5', w: 600, h: 750 },
  ];

  const colors = ['#1a1b4b', '#0a3d62', '#1b4332', '#2d1b69', '#7b2d00', '#0f3460',
                   '#1a0a2e', '#3d1a00', '#0a2744', '#4a0e0e', '#0e2a4a', '#2a0e4a'];

  for (let i = 1; i <= 12; i++) {
    const it = items[i - 1];
    const bg = colors[i - 1];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${it.w} ${it.h}" width="${it.w}" height="${it.h}">
  <rect width="${it.w}" height="${it.h}" fill="${bg}"/>
  <polygon points="0,0 ${it.w * 0.4},0 0,${it.h * 0.4}" fill="#d4a642" opacity="0.08"/>
  <polygon points="${it.w},${it.h} ${it.w * 0.6},${it.h} ${it.w},${it.h * 0.6}" fill="#d4a642" opacity="0.08"/>
  <text x="${it.w / 2}" y="${it.h / 2 - 10}" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="${Math.min(it.w, it.h) * 0.055}" fill="#d4a642" letter-spacing="2">${it.label}</text>
  <text x="${it.w / 2}" y="${it.h / 2 + 30}" text-anchor="middle" font-family="Inter,sans-serif" font-weight="400" font-size="${Math.min(it.w, it.h) * 0.03}" fill="#ffffff" opacity="0.5">DOTMOV PRODUCTION</text>
  <text x="${it.w / 2}" y="${it.h - 20}" text-anchor="middle" font-family="Inter,sans-serif" font-weight="400" font-size="${Math.min(it.w, it.h) * 0.025}" fill="#d4a642" opacity="0.5">TODO: replace</text>
</svg>`;
    const dest = path.join(ROOT, `assets/work/work-${String(i).padStart(2, '0')}.svg`);
    writeFile(dest, svg);
    record(dest, 'generated', 'placeholder — user to replace with real portfolio work');
  }
  log('📝  work: wrote 12 SVG placeholders');
}

// ── D. Client logos ────────────────────────────────────────────────────────

async function fetchClientLogos() {
  log('--- D. Client logos ---');

  // Adidas
  await tryDownload([
    'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg',
  ], path.join(ROOT, 'assets/clients/adidas.svg'), 'adidas.svg')
  || (() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><text x="100" y="55" text-anchor="middle" font-family="Inter,sans-serif" font-weight="900" font-size="36" fill="#000000">adidas</text></svg>`;
    writeFile(path.join(ROOT, 'assets/clients/adidas.svg'), svg);
    record(path.join(ROOT, 'assets/clients/adidas.svg'), 'generated fallback', 'placeholder');
  })();

  // Zoho
  const zohoOk = await tryDownload([
    'https://upload.wikimedia.org/wikipedia/commons/9/9e/Zoho_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Zoho_logo.svg/512px-Zoho_logo.svg.png',
  ], path.join(ROOT, 'assets/clients/zoho.svg'), 'zoho.svg');
  if (!zohoOk) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><text x="100" y="55" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="36" fill="#e42527">Zoho</text></svg>`;
    writeFile(path.join(ROOT, 'assets/clients/zoho.svg'), svg);
    record(path.join(ROOT, 'assets/clients/zoho.svg'), 'generated fallback', 'placeholder');
  }

  // Joyalukkas
  const joyal = await tryDownload([
    'https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Joyalukkas_Logo.png/200px-Joyalukkas_Logo.png',
    'https://upload.wikimedia.org/wikipedia/en/5/5f/Joyalukkas_Logo.png',
  ], path.join(ROOT, 'assets/clients/joyalukkas.png'), 'joyalukkas.png');
  if (!joyal) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 80"><rect width="260" height="80" fill="transparent"/><text x="130" y="52" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="28" fill="#b71c1c">Joyalukkas</text></svg>`;
    writeFile(path.join(ROOT, 'assets/clients/joyalukkas.svg'), svg);
    record(path.join(ROOT, 'assets/clients/joyalukkas.svg'), 'generated fallback', 'placeholder');
  }

  // Naturals Salon
  let naturalsOk = false;
  const naturalsHtml = await fetchText('https://www.naturals.in/');
  if (naturalsHtml) {
    const imgs = [...naturalsHtml.matchAll(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|svg|webp)/gi)]
      .map(m => m[0]).filter(u => /logo|naturals/i.test(u));
    if (imgs.length > 0) {
      naturalsOk = await tryDownload(imgs, path.join(ROOT, 'assets/clients/naturals.png'), 'naturals logo');
    }
  }
  if (!naturalsOk) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 80"><text x="130" y="52" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="28" fill="#7b1fa2">Naturals</text></svg>`;
    writeFile(path.join(ROOT, 'assets/clients/naturals.svg'), svg);
    record(path.join(ROOT, 'assets/clients/naturals.svg'), 'generated fallback', 'placeholder');
  }

  // Chennai Freelancers Club
  let cfcOk = false;
  if (html) {
    const cfcImgs = [...html.matchAll(/https?:\/\/dotmov\.in\/wp-content\/uploads\/[^\s"'<>]+\.(png|jpg|jpeg|svg|webp)/gi)]
      .map(m => m[0]).filter(u => /chennai.freelancers|cfc/i.test(u));
    if (cfcImgs.length > 0) {
      cfcOk = await tryDownload(cfcImgs, path.join(ROOT, 'assets/clients/chennai-freelancers.png'), 'CFC logo');
    }
  }
  if (!cfcOk) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80"><text x="150" y="36" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="16" fill="#00796b">CHENNAI</text><text x="150" y="60" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="16" fill="#00796b">FREELANCERS CLUB</text></svg>`;
    writeFile(path.join(ROOT, 'assets/clients/chennai-freelancers.svg'), svg);
    record(path.join(ROOT, 'assets/clients/chennai-freelancers.svg'), 'generated fallback', 'placeholder');
  }

  // Filler brand logos
  const fillers = [
    { name: 'BrandCo', color: '#1a1b4b', file: 'brandco.svg' },
    { name: 'StartupX', color: '#0f3460', file: 'startupx.svg' },
    { name: 'VentureLab', color: '#1b4332', file: 'venturelab.svg' },
    { name: 'FounderFuel', color: '#7b2d00', file: 'founderfuel.svg' },
    { name: 'GrowthHub', color: '#2d1b69', file: 'growthhub.svg' },
  ];
  for (const f of fillers) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 60"><text x="110" y="42" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="24" fill="${f.color}">${f.name}</text></svg>`;
    const dest = path.join(ROOT, `assets/clients/${f.file}`);
    writeFile(dest, svg);
    record(dest, 'generated', 'placeholder — user to replace with real client logos');
  }
  log('📝  clients: logos done');
}

// ── E. Instagram tiles ─────────────────────────────────────────────────────

function generateInstagramTiles() {
  log('--- E. Instagram tiles ---');
  const captions = [
    'Brand Story', 'Event Reel', 'Founder Frame',
    'Product Drop', 'Authority Content', 'Behind The Lens'
  ];
  for (let i = 1; i <= 6; i++) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <rect width="1080" height="1080" fill="#0f1035"/>
  <polygon points="0,0 400,0 0,400" fill="#1a1b4b"/>
  <polygon points="1080,1080 680,1080 1080,680" fill="#1a1b4b"/>
  <!-- Instagram logo glyph -->
  <rect x="390" y="340" width="300" height="300" rx="80" fill="none" stroke="#d4a642" stroke-width="18"/>
  <circle cx="540" cy="490" r="80" fill="none" stroke="#d4a642" stroke-width="16"/>
  <circle cx="648" cy="380" r="22" fill="#d4a642"/>
  <!-- Caption bar -->
  <rect x="0" y="930" width="1080" height="150" fill="#d4a642" opacity="0.12"/>
  <text x="540" y="992" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="36" fill="#d4a642" letter-spacing="2">${captions[i - 1].toUpperCase()}</text>
  <text x="540" y="1042" text-anchor="middle" font-family="Inter,sans-serif" font-weight="400" font-size="28" fill="#d4a642" opacity="0.7">@dotmov.in</text>
</svg>`;
    const dest = path.join(ROOT, `assets/instagram/ig-${String(i).padStart(2, '0')}.svg`);
    writeFile(dest, svg);
    record(dest, 'generated', 'placeholder — TODO: user to replace with real Instagram post screenshots');
  }
  log('📝  instagram: wrote 6 SVG tiles');
}

// ── F. Testimonial avatars ──────────────────────────────────────────────────

async function fetchTestimonialAvatars() {
  log('--- F. Testimonial avatars ---');
  const people = [
    { seed: 'Priya+K', name: 'PK' },
    { seed: 'Rahul+M', name: 'RM' },
    { seed: 'Anita+S', name: 'AS' },
    { seed: 'Karthik+V', name: 'KV' },
    { seed: 'Deepa+R', name: 'DR' },
  ];

  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    const dest = path.join(ROOT, `assets/testimonials/avatar-0${i + 1}.svg`);
    const url = `https://api.dicebear.com/7.x/initials/svg?seed=${p.seed}&backgroundColor=1a1b4b&textColor=d4a642&fontSize=40`;
    const ok = await tryDownload([url], dest, `avatar-0${i + 1}`);
    if (!ok) {
      const colors = ['#1a1b4b', '#0f3460', '#1b4332', '#2d1b69', '#7b2d00'];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="50" fill="${colors[i]}"/>
  <text x="50" y="63" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="28" fill="#d4a642">${p.name}</text>
</svg>`;
      writeFile(dest, svg);
      record(dest, 'generated fallback', 'placeholder');
    }
  }
  log('📝  testimonials: avatars done');
}

// ── Write manifest ──────────────────────────────────────────────────────────

function writeManifest() {
  const rows = manifest.map(m => `| ${m.file.padEnd(50)} | ${(m.source || '').substring(0, 55).padEnd(55)} | ${m.status} |`);
  const content = `# DotMov Assets Manifest
Generated: ${new Date().toISOString()}

Review this file to see which assets are real vs placeholders.
Replace all \`placeholder\` entries with real files before launch.

| File                                               | Source                                                  | Status |
|----------------------------------------------------|--------------------------------------------------------|--------|
${rows.join('\n')}

## Placeholder replacement priority
1. \`assets/founder/raswanth.jpg\` — headshot of Raswanth
2. \`assets/celebrities/celeb-01.svg\` through \`celeb-10.svg\` — real event stills
3. \`assets/work/work-01.svg\` through \`work-12.svg\` — real portfolio work
4. \`assets/testimonials/\` — real client names, roles, quotes, and photos
5. \`assets/instagram/ig-01.svg\` through \`ig-06.svg\` — real Instagram screenshots
6. \`assets/clients/\` (placeholder entries) — real client logos
`;
  writeFile(path.join(ROOT, 'assets/ASSETS_MANIFEST.md'), content);
  log('📄  ASSETS_MANIFEST.md written');
}

// ── Main ────────────────────────────────────────────────────────────────────

let html = null; // shared dotmov.in HTML

async function main() {
  log('Starting DotMov asset fetch...');

  // Pre-fetch dotmov.in HTML so multiple sections can use it
  html = await fetchText('https://dotmov.in/');

  await fetchLogos();
  await fetchFounder();
  generateCelebPlaceholders();
  generateWorkPlaceholders();
  await fetchClientLogos();
  generateInstagramTiles();
  await fetchTestimonialAvatars();
  writeManifest();

  log('✅  Asset fetch complete.');
  const real = manifest.filter(m => m.status === 'real').length;
  const placeholder = manifest.filter(m => m.status !== 'real').length;
  log(`   ${real} real assets, ${placeholder} placeholders`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
