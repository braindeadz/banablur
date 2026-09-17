/**
 * Test E2E Chaturbate — age gate masque + live overlay Hls.js.
 * Usage: node test-chaturbate.mjs
 * Exit 0 = OK, 1 = echec
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_PATH = __dirname;
const TEST_URL = 'https://chaturbate.com/?next=%2Fb%2F_female%2F';

function checkPage() {
  const overlayVideo = document.querySelector('#agego-live-overlay video, #agego-live-video');
  return {
    url: location.href,
    hasCss: !!document.getElementById('banablur-override'),
    overlayOp: document.getElementById('age_gate_overlay')
      ? getComputedStyle(document.getElementById('age_gate_overlay')).opacity
      : null,
    overlayPE: document.getElementById('age_gate_overlay')
      ? getComputedStyle(document.getElementById('age_gate_overlay')).pointerEvents
      : null,
    gateTextVisible: (() => {
      const t = document.getElementById('age-gate-visitor-text');
      if (!t) return false;
      const r = t.getBoundingClientRect();
      const s = getComputedStyle(t);
      return r.width > 0 && r.height > 0 && s.opacity !== '0' && s.visibility !== 'hidden';
    })(),
    hasLiveOverlay: !!document.getElementById('agego-live-overlay'),
    hasCustomApp: !!document.getElementById('agego-app'),
    customCards: document.querySelectorAll('#agego-app [data-agego-room]').length,
    customScrollable: (() => {
      const app = document.getElementById('agego-app');
      return !!app && app.scrollHeight > app.clientHeight;
    })(),
    videoW: overlayVideo?.videoWidth ?? 0,
    videoReady: overlayVideo?.readyState ?? 0,
    toast: document.getElementById('agego-cb-toast')?.textContent || null,
    clickable: (() => {
      const card =
        document.querySelector('#agego-app [data-agego-room]') ||
        document.querySelector('a.RoomCardThumbnail');
      const rect = card?.getBoundingClientRect();
      if (!rect) return false;
      const el = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return !!el?.closest('[data-agego-room], a.RoomCardThumbnail');
    })(),
  };
}

async function waitFor(page, browserFn, timeoutMs = 20000, stepMs = 500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await page.evaluate(browserFn);
    if (ok) return true;
    await page.waitForTimeout(stepMs);
  }
  return false;
}

async function main() {
  console.log('Extension:', EXT_PATH);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = await context.newPage();

  console.log('1) Chargement initial...');
  await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });

  console.log('2) Reload pour activer extension...');
  await page.waitForTimeout(2000);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(4000);

  await waitFor(
    page,
    () => document.querySelectorAll('a.RoomCardThumbnail').length > 0,
    30000,
    500
  );

  let state = await page.evaluate(checkPage);
  console.log('Etat gate:', JSON.stringify(state, null, 2));

  const gateOk = await waitFor(
    page,
    () => {
      const overlay = document.getElementById('age_gate_overlay');
      const overlayPE = overlay ? getComputedStyle(overlay).pointerEvents : null;
      const gateText = document.getElementById('age-gate-visitor-text');
      const gateTextVisible =
        gateText &&
        gateText.getBoundingClientRect().width > 0 &&
        getComputedStyle(gateText).opacity !== '0' &&
        getComputedStyle(gateText).visibility !== 'hidden';
      const card =
        document.querySelector('#agego-app [data-agego-room]') ||
        document.querySelector('a.RoomCardThumbnail');
      const rect = card?.getBoundingClientRect();
      const clickable =
        rect &&
        document
          .elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
          ?.closest('[data-agego-room], a.RoomCardThumbnail');
      return (
        !!document.getElementById('banablur-override') &&
        !!document.getElementById('agego-app') &&
        overlayPE === 'none' &&
        !gateTextVisible &&
        !!clickable
      );
    },
    15000
  );

  if (!gateOk) {
    console.error('ECHEC: fenetre age gate encore visible ou clics bloques');
    state = await page.evaluate(checkPage);
    console.log(JSON.stringify(state, null, 2));
    await context.close();
    process.exit(1);
  }
  console.log('OK: age gate masquee, clics possibles');

  const appOk = await waitFor(
    page,
    () => {
      const app = document.getElementById('agego-app');
      return !!app && app.querySelectorAll('[data-agego-room]').length > 0;
    },
    15000
  );
  if (!appOk) {
    console.error('ECHEC: page custom ou grille absente');
    await context.close();
    process.exit(1);
  }

  const slug = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img.RoomCardThumbnail__image')];
    for (const img of imgs.slice(0, 15)) {
      const room = img.alt;
      if (!room) continue;
      try {
        const r = await fetch('/get_edge_hls_url_ajax/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: 'room_slug=' + encodeURIComponent(room),
        });
        const j = await r.json();
        if (j.url && j.room_status === 'public') return room;
      } catch (_e) {
        /* next */
      }
    }
    return imgs[0]?.alt || null;
  });

  if (!slug) {
    console.error('ECHEC: aucune miniature');
    await context.close();
    process.exit(1);
  }

  console.log('3) Clic room (overlay live):', slug);
  const thumb = page.locator(`#agego-app [data-agego-room="${slug}"]`).first();
  await thumb.scrollIntoViewIfNeeded();
  await thumb.click({ force: true, timeout: 10000 });

  // Playwright utilise Chromium (sans codecs H.264/AAC proprietaires). La chaine
  // complete que l'extension controle est validee ainsi : overlay cree + manifeste
  // HLS recupere par le player. Le seul blocage restant sous Chromium est le decodage
  // (manifestIncompatibleCodecsError), qui n'existe pas dans un vrai Chrome (voir MCP).
  const liveOk = await waitFor(
    page,
    () => {
      const v = document.querySelector('#agego-live-overlay video, #agego-live-video');
      if ((v?.videoWidth ?? 0) >= 160) return true;
      const err = document.documentElement.dataset.agegoHlsError || '';
      return (
        !!document.getElementById('agego-live-overlay') &&
        (document.documentElement.dataset.agegoFragLoaded === '1' ||
          /IncompatibleCodecs/i.test(err))
      );
    },
    35000
  );

  state = await page.evaluate(() => {
    const v = document.querySelector('#agego-live-overlay video');
    return {
      hasLiveOverlay: !!document.getElementById('agego-live-overlay'),
      videoW: v?.videoWidth ?? 0,
      fragLoaded: document.documentElement.dataset.agegoFragLoaded === '1',
      hlsError: document.documentElement.dataset.agegoHlsError || null,
    };
  });
  console.log('Etat live:', JSON.stringify(state, null, 2));

  if (!liveOk) {
    console.error('ECHEC: overlay live non demarre (manifeste HLS non recupere)');
    await page.waitForTimeout(3000);
    await context.close();
    process.exit(1);
  }

  const mode =
    state.videoW >= 160
      ? 'video decodee (' + state.videoW + 'px)'
      : 'manifeste HLS recupere ; decodage indisponible sous Chromium (OK en vrai Chrome)';
  console.log('SUCCES: age gate masque + overlay live cree + ' + mode);
  await page.waitForTimeout(5000);
  await context.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
