/**
 * Banc séquentiel ULTRA-STRICT Banablur — zéro dépendance (CDP + WebSocket Node).
 *
 * ANY fail = FAIL. Doubt = FAIL. Aucun critère assoupli (pas de readyState
 * comme preuve de lecture, pas d'excuse autoplay, pas d'aveugle au
 * `.container { filter: blur() }` type SunPorno).
 *
 *   node bench-strict.mjs --port=9336
 *   node bench-strict.mjs --port=9336 --only=teen21.com
 *   node bench-strict.mjs --port=9336 --candidates-only
 *
 * Candidats extra: %TEMP%\banablur-strict-candidates.json
 * Sortie:         %TEMP%\banablur-strict-results.json
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = process.env.TEMP || process.env.TMPDIR || os.tmpdir();
const PORT = Number((process.argv.find((a) => a.startsWith('--port=')) || '--port=9336').split('=')[1]);
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice('--only='.length);
const CANDIDATES_ONLY = process.argv.includes('--candidates-only');
const OUT = path.join(TMP, 'banablur-strict-results.json');
const CANDIDATES = path.join(TMP, 'banablur-strict-candidates.json');
const CONTENT = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
const CDP = 'http://127.0.0.1:' + PORT;

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (_e) {
    return String(url || '').toLowerCase();
  }
}

function parseSupportedSites() {
  const src = fs.readFileSync(path.join(__dirname, 'popup.js'), 'utf8');
  const re = /\{\s*name:\s*'([^']+)',\s*url:\s*'([^']+)'\s*\}/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push({ name: m[1], url: m[2] });
  return out;
}

function loadExtraCandidates() {
  if (!fs.existsSync(CANDIDATES)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(CANDIDATES, 'utf8').replace(/^\uFEFF/, ''));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((x) => x && x.url)
      .map((x) => ({
        name: String(x.name || hostnameOf(x.url)),
        url: String(x.url),
      }));
  } catch (_e) {
    console.log('WARN candidates JSON illisible', CANDIDATES);
    return [];
  }
}

function mergeSites(supported, extra) {
  const list = CANDIDATES_ONLY ? [...extra] : [...supported, ...extra];
  const seen = new Set();
  const out = [];
  for (const s of list) {
    const key = hostnameOf(s.url).replace(/^www\./, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function filterOnly(sites) {
  if (!ONLY) return sites;
  const tokens = ONLY.split(',')
    .map((s) => s.trim().toLowerCase().replace(/^www\./, ''))
    .filter(Boolean);
  if (!tokens.length) return sites;
  return sites.filter((s) => {
    const host = hostnameOf(s.url).replace(/^www\./, '');
    const blob = (s.name + ' ' + s.url + ' ' + host).toLowerCase();
    return tokens.some((t) => blob.includes(t) || host === t || host.endsWith('.' + t));
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        this.pending.get(msg.id)(msg);
        this.pending.delete(msg.id);
      }
    });
  }
  ready() {
    if (this.ws.readyState === 1) return Promise.resolve();
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res(), { once: true });
      this.ws.addEventListener('error', (e) => rej(e), { once: true });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('cdp-timeout ' + method)), 28000);
      this.pending.set(id, (msg) => {
        clearTimeout(t);
        if (msg.error) rej(new Error(msg.error.message || method));
        else res(msg.result || {});
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'eval');
    return r.result ? r.result.value : null;
  }
  close() {
    try {
      this.ws.close();
    } catch (_e) {}
  }
}

async function openTab(url) {
  const res = await fetch(CDP + '/json/new?about:blank', { method: 'PUT' });
  if (!res.ok) throw new Error('json/new ' + res.status);
  const t = await res.json();
  if (!t.webSocketDebuggerUrl) throw new Error('no-ws');
  const cdp = new Cdp(t.webSocketDebuggerUrl);
  await cdp.ready();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url });
  await waitReady(cdp, 12000);
  await sleep(1500);
  return { id: t.id, cdp };
}

async function waitReady(cdp, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const state = await cdp.eval('document.readyState');
      if (state === 'complete' || state === 'interactive') return;
    } catch (_e) {}
    await sleep(250);
  }
}

async function closeTab(id, cdp) {
  try {
    cdp.close();
  } catch (_e) {}
  try {
    await fetch(CDP + '/json/close/' + id, { method: 'PUT' });
  } catch (_e) {}
}

async function injectContent(cdp) {
  await cdp.eval(CONTENT + ';true');
}

/** Inspecte la page dans le monde principal — source envoyée via CDP. */
function inspectPage() {
  const vw = window.innerWidth || document.documentElement.clientWidth || 0;
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  const viewArea = Math.max(1, vw * vh);

  function blurPx(cs) {
    const f = [cs.filter, cs.backdropFilter, cs.webkitBackdropFilter]
      .filter(Boolean)
      .join(' ');
    const m = f.match(/blur\(\s*([0-9.]+)\s*px/i);
    if (m) return parseFloat(m[1]);
    return /blur\s*\(/i.test(f) ? 1 : 0;
  }

  function coverRatio(el) {
    const r = el.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return (w * h) / viewArea;
  }

  const overlaySels = [
    '#disclaimer_parent_wrapper',
    '#agego-overlay',
    '#agego-overlay-container',
    '#agego-verify-frame',
    '#ageDisclaimerMainBG',
    '.ageDisclaimer',
    '#agreement-root',
    '.visitors-agreement-modal',
    '#consent_modal.over-18',
    '#consent_modal.is-non-adult',
    '#consent_modal',
    '#ageverifybox',
    '#age-verification-overlay',
    '.popup_18_plus',
    '#AgeConsentGenderDisclaimer',
    '.modal-age-verification',
    '.modal.modal-ageverification',
    '[class*="modal-age"]',
    '#modal-warning.is-active',
    '#entrance_terms_overlay',
    '.entrance_terms_overlay',
    '#age_gate_overlay',
    '#age_gate_home',
    '#adult-popup',
    '#adult-popup-backdrop',
    '#age_verification',
    '#age-verification',
    '#ageVerification',
    '#age_gate',
    '#age-gate',
    '#ageGate',
    '#age-check',
    '#age_check',
    '#ageDisclaimer',
    '#age-disclaimer',
    '#age_disclaimer',
    '#age-verification-container',
    '.age-verification-overlay',
    '.age-verification',
    '.age_verification',
    '.age-gate',
    '.age_gate',
    '.js-age-gate',
    '[id*="age-verif"]',
    '[class*="age-verif"]',
    '[class*="age_verif"]',
    '#disclaimer',
    'custom-disclaimer.disclaimer',
    'age-verification',
    '.overlay-modal',
    '#cookie-wall',
    '#preview_disclaimer_parent_wrapper',
    '.disclaimer_overlay',
    '.sfw_disclaimer_wrapper',
    '[data-testid="Over18ModalVariant1Modal"]',
    '.over-18.is-non-adult',
    '.over-18__popover',
  ];

  const overlays = [];
  const seenEl = new Set();
  for (const sel of overlaySels) {
    let list;
    try {
      list = document.querySelectorAll(sel);
    } catch (_e) {
      continue;
    }
    for (const el of list) {
      if (seenEl.has(el)) continue;
      seenEl.add(el);
      const st = getComputedStyle(el);
      const visible =
        st.display !== 'none' &&
        st.visibility !== 'hidden' &&
        st.pointerEvents !== 'none' &&
        (el.offsetHeight > 40 || coverRatio(el) >= 0.2);
      overlays.push({
        sel,
        display: st.display,
        visibility: st.visibility,
        pointerEvents: st.pointerEvents,
        opacity: st.opacity,
        visible,
      });
      if (visible && overlays.filter((o) => o.visible).length >= 8) break;
    }
    if (overlays.filter((o) => o.visible).length >= 8) break;
  }
  const overlayVisible = overlays.filter((o) => o.visible);
  const overlayBlocks = overlayVisible.length > 0;

  function generalBlurHit() {
    const roots = [document.documentElement, document.body, document.querySelector('.container')].filter(Boolean);
    for (const el of roots) {
      const px = blurPx(getComputedStyle(el));
      if (px > 0.25) {
        return {
          hit: true,
          via: (el.id && '#' + el.id) || (el.className && '.' + String(el.className).split(' ')[0]) || el.tagName,
          px,
        };
      }
    }
    const nodes = document.querySelectorAll('body *');
    const lim = Math.min(nodes.length, 500);
    for (let i = 0; i < lim; i++) {
      const el = nodes[i];
      const r = el.getBoundingClientRect();
      if (r.width < vw * 0.5 || r.height < vh * 0.5) continue;
      if (coverRatio(el) < 0.8) continue;
      const px = blurPx(getComputedStyle(el));
      if (px > 0.25) {
        return {
          hit: true,
          via: (el.id && '#' + el.id) || (el.className && '.' + String(el.className).split(/\s+/)[0]) || el.tagName,
          px,
        };
      }
    }
    return { hit: false, via: null, px: 0 };
  }
  const gblur = generalBlurHit();

  const html = document.documentElement;
  const body = document.body;
  const htmlCs = getComputedStyle(html);
  const bodyCs = body ? getComputedStyle(body) : null;
  const overflowHidden =
    /hidden/i.test(htmlCs.overflow + htmlCs.overflowY) ||
    !!(bodyCs && /hidden/i.test(bodyCs.overflow + bodyCs.overflowY));
  const scrollH = Math.max(html.scrollHeight, body ? body.scrollHeight : 0);
  const clientH = html.clientHeight;
  const shouldScroll = scrollH > clientH + 80;
  let cannotScroll = false;
  if (overflowHidden && shouldScroll) {
    const y0 = window.scrollY;
    window.scrollTo(0, y0 + 160);
    cannotScroll = Math.abs(window.scrollY - y0) < 2;
    window.scrollTo(0, y0);
  }
  const scrollLocked = !!(overflowHidden && shouldScroll && (cannotScroll || overlayBlocks));

  function isEighteenCta(el) {
    const t = ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.value || '')).toLowerCase();
    return /18\s*\+|i am 18|i'm 18|i’m 18|enter site|verify age|j['’]ai\s*18|entrer|yes.?i.?am|i agree|i am over/i.test(t);
  }
  function insideAgeModal(el) {
    return !!el.closest(
      '#age-verification-overlay,#consent_modal,.modal-age,[class*="modal-age"],[class*="age-verif"],[id*="age-verif"],#age_gate_overlay,#entrance_terms_overlay,#disclaimer_parent_wrapper,#agreement-root,#age_verification,#age-verification,#ageGate,#age_gate'
    );
  }
  function isJunkHref(href, raw) {
    if (!href || /javascript:/i.test(href) || /^#/.test(raw || '')) return true;
    if (/\/(login|signup|premium|join|affiliate|out|redirect)(\/|$|\?)/i.test(href)) return true;
    if (/\/register(\/|$|\?)/i.test(href) && !/live-sex|\/chat\/|\/room\/|[?&]name=/i.test(href)) return true;
    if (/\/videos?\/(latest|most-popular|trending|categories|channels|pornstars|new|best|top|top-rated|most-liked|most-recent|most-viewed|latest-updates|history|models)(\/|$)/i.test(href)) return true;
    if (/\/model\//i.test(href)) return true;
    return false;
  }
  function isConcreteVideo(href) {
    if (/\/model\//i.test(href)) return false;
    if (/\/videos?\/(latest|most-popular|trending|categories|channels|pornstars|new|best|top|top-rated|most-liked|most-recent|most-viewed|latest-updates|history|models)(\/|$)/i.test(href)) return false;
    if (/\/videos?\/\d{3,}(\/|$|\?)/i.test(href)) return true;
    if (/\/video[.-]\d+/i.test(href) || /\/v\/\d{3,}/i.test(href)) return true;
    const slug = href.match(/\/video\/([a-z0-9_-]{6,})(\/|$|\?)/i);
    if (!slug) return false;
    return !/^(latest|popular|trending|categories|channels|pornstars|top-rated|most-liked|most-recent)$/i.test(slug[1]);
  }
  const mediaSels = [
    'a[href*="/videos/"]',
    'a[href*="/video/"]',
    'a[href*="/video"]',
    'a[href*="/watch"]',
    'a[href*="view_video"]',
    'a[href*="/view/"]',
    'a[href*="/v/"]',
    '.thumb a',
    '.mozaique a',
    '.thumb-block a',
    'a.video-link',
    '.roomcard a',
    'a[href*="/chat/"]',
    'a.RoomCardThumbnail',
    '.thumb-list a',
    '.video-list a',
    'a[href*="/room/"]',
  ];
  let firstLink = null;
  for (const s of mediaSels) {
    const nodes = document.querySelectorAll(s);
    for (const a of nodes) {
      const raw = a.getAttribute('href') || '';
      const href = a.href || raw;
      if (isJunkHref(href, raw)) continue;
      if (isEighteenCta(a) && !insideAgeModal(a)) continue;
      if (!isConcreteVideo(href) && !/\/watch|view_video|\/view\/|\/room\/|\/chat\//i.test(href)) continue;
      firstLink = a;
      break;
    }
    if (firstLink) break;
  }

  function linkClickable(a) {
    if (!a) return false;
    let r = a.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    let x = r.left + r.width / 2;
    let y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x > vw || y > vh) {
      try {
        a.scrollIntoView({ block: 'center', inline: 'center' });
      } catch (_e) {}
      r = a.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    const top = document.elementFromPoint(x, y);
    if (!top) return false;
    return !!(a.contains(top) || top === a || top.closest('a') === a);
  }
  const clickable = linkClickable(firstLink);

  const thumbImgs = [...document.querySelectorAll('img')].filter((img) => {
    const r = img.getBoundingClientRect();
    return r.width >= 80 && r.height >= 60;
  }).slice(0, 60);
  const thumbs = thumbImgs.map((img) => {
    const px = blurPx(getComputedStyle(img));
    return { px, blurred: px > 0.25 };
  });
  const thumbCount = thumbs.length;
  const blurredThumbs = thumbs.filter((t) => t.blurred).length;

  const videos = [...document.querySelectorAll('video')];
  const scored = videos
    .map((x) => ({
      x,
      inVast: !!x.closest('.vast_player, .vast_player_content, [class*="vast"]'),
      dur: isFinite(x.duration) ? x.duration : 0,
      ready: x.readyState,
    }))
    .sort((a, b) => {
      if (a.inVast !== b.inVast) return a.inVast ? 1 : -1;
      if ((b.dur >= 60) !== (a.dur >= 60)) return b.dur >= 60 ? 1 : -1;
      return b.dur - a.dur || b.ready - a.ready;
    });
  const v = (scored[0] && scored[0].x) || videos[0] || null;

  const text = ((document.body && document.body.innerText) || '').slice(0, 2500);
  const wallText = text + ' ' + document.title + ' ' + location.href;
  const wall = /acc[eè]s (à notre site )?suspendu|protectiondesmineurs|arcom|notice to users|just a moment|attention required|checking your browser|service unavailable in france|unavailable in france|challenges\.cloudflare/i.test(
    wallText
  );

  const ageOnlyPath = /\/age-verification|\/tour\/sfw/i.test(location.pathname + location.href);

  return {
    href: location.href,
    title: document.title,
    wall,
    sfwCatalog: !!(
      (document.body && document.body.classList.contains('sfw-page')) ||
      String(window.isSfw || '') === '1'
    ),
    ageOnly: !!(ageOnlyPath && thumbCount < 8 && videos.length === 0),
    overlays: overlayVisible,
    overlay: overlayVisible.length ? overlayVisible[0].sel : null,
    generalBlur: gblur.hit,
    generalBlurVia: gblur.via,
    generalBlurPx: gblur.px,
    scrollLocked,
    overflowHidden,
    shouldScroll,
    cannotScroll,
    thumbs: { count: thumbCount, blurred: blurredThumbs },
    thumbCount,
    blurredThumbs,
    video: v
      ? {
          currentTime: v.currentTime || 0,
          paused: v.paused,
          readyState: v.readyState,
          duration: isFinite(v.duration) ? v.duration : 0,
          live: v.duration === Infinity,
        }
      : null,
    videoCount: videos.length,
    currentTime: v ? v.currentTime || 0 : 0,
    paused: v ? v.paused : null,
    readyState: v ? v.readyState : 0,
    duration: v && isFinite(v.duration) ? v.duration : 0,
    live: !!(v && v.duration === Infinity),
    clickable,
    firstLink: firstLink ? firstLink.href : null,
    textSample: text.replace(/\s+/g, ' ').slice(0, 180),
  };
}

function clickMedia(skipHrefs) {
  function isEighteenCta(el) {
    const t = ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.value || '')).toLowerCase();
    return /18\s*\+|i am 18|i'm 18|i’m 18|enter site|verify age|j['’]ai\s*18|entrer|yes.?i.?am|i agree|i am over/i.test(t);
  }
  function insideAgeModal(el) {
    return !!el.closest(
      '#age-verification-overlay,#consent_modal,.modal-age,[class*="modal-age"],[class*="age-verif"],[id*="age-verif"],#age_gate_overlay,#entrance_terms_overlay,#disclaimer_parent_wrapper,#agreement-root,#age_verification,#age-verification,#ageGate,#age_gate'
    );
  }
  function isJunkHref(href, raw) {
    if (!href || /javascript:/i.test(href) || /^#/.test(raw || '')) return true;
    if (/\/(login|signup|premium|join|affiliate|out|redirect)(\/|$|\?)/i.test(href)) return true;
    if (/\/register(\/|$|\?)/i.test(href) && !/live-sex|\/chat\/|\/room\/|[?&]name=/i.test(href)) return true;
    if (/\/videos?\/(latest|most-popular|trending|categories|channels|pornstars|new|best|top|top-rated|most-liked|most-recent|most-viewed|latest-updates|history|models)(\/|$)/i.test(href)) return true;
    if (/\/model\//i.test(href)) return true;
    return false;
  }
  function isConcreteVideo(href) {
    if (/\/model\//i.test(href)) return false;
    if (/\/videos?\/(latest|most-popular|trending|categories|channels|pornstars|new|best|top|top-rated|most-liked|most-recent|most-viewed|latest-updates|history|models)(\/|$)/i.test(href)) return false;
    if (/\/videos?\/\d{3,}(\/|$|\?)/i.test(href)) return true;
    if (/\/video[.-]\d+/i.test(href) || /\/v\/\d{3,}/i.test(href)) return true;
    const slug = href.match(/\/video\/([a-z0-9_-]{6,})(\/|$|\?)/i);
    if (!slug) return false;
    return !/^(latest|popular|trending|categories|channels|pornstars|top-rated|most-liked|most-recent)$/i.test(slug[1]);
  }
  function isAllowedFallback(href) {
    return /\/(watch|view_video|view|room|chat|live-sex)\b/i.test(href);
  }
  const skips = new Set(
    (Array.isArray(skipHrefs) ? skipHrefs : [skipHrefs])
      .filter(Boolean)
      .map((h) => String(h).split('#')[0].replace(/\/$/, ''))
  );
  const sels = [
    'a[href*="/videos/"]',
    'a[href*="/video/"]',
    'a[href*="/video"]',
    'a[href*="/watch"]',
    'a[href*="view_video"]',
    'a[href*="/view/"]',
    'a[href*="/v/"]',
    '.thumb a',
    '.mozaique a',
    '.thumb-block a',
    'a.video-link',
    '.roomcard a',
    'a[href*="/chat/"]',
    'a.RoomCardThumbnail',
    '.thumb-list a',
    '.video-list a',
    'a[href*="/room/"]',
  ];
  function sameHost(href) {
    try {
      return new URL(href, location.href).hostname.replace(/^www\./, '') === location.hostname.replace(/^www\./, '');
    } catch (_e) {
      return false;
    }
  }
  function pick(requireConcrete, requireSameHost) {
    const seen = new Set();
    for (const s of sels) {
      for (const a of document.querySelectorAll(s)) {
        const raw = a.getAttribute('href') || '';
        const href = a.href || raw;
        if (isJunkHref(href, raw)) continue;
        if (isEighteenCta(a) && !insideAgeModal(a)) continue;
        if (requireSameHost && !sameHost(href)) continue;
        if (requireConcrete && !isConcreteVideo(href)) continue;
        if (!requireConcrete && !isConcreteVideo(href) && !isAllowedFallback(href)) continue;
        const norm = String(href).split('#')[0].replace(/\/$/, '');
        if (skips.has(norm)) continue;
        if (seen.has(norm)) continue;
        seen.add(norm);
        try {
          a.scrollIntoView({ block: 'center', inline: 'center' });
        } catch (_e) {}
        a.click();
        return href;
      }
    }
    return null;
  }
  const concrete = pick(true, true);
  if (concrete) return concrete;
  const fallback = pick(false, true);
  if (fallback) return fallback;
  const concreteAny = pick(true, false);
  if (concreteAny) return concreteAny;
  const fallbackAny = pick(false, false);
  if (fallbackAny) return fallbackAny;
  if (!skips.size) {
    const ctas = document.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
    for (const el of ctas) {
      if (!isEighteenCta(el) || !insideAgeModal(el)) continue;
      el.click();
      return el.href || 'age-modal-cta';
    }
  }
  return null;
}

function dismissPreroll() {
  const sels = [
    '.vast_player_close',
    '.vast_player_close--do',
    '.vast_player_close_text',
    '.jw-skip',
    '.jw-icon-skip',
    '[class*="skip-ad"]',
    '[class*="SkipAd"]',
    'button[class*="skip"]',
    '.fp-skip',
  ];
  let clicked = 0;
  for (const s of sels) {
    for (const el of document.querySelectorAll(s)) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      try {
        el.click();
        clicked++;
      } catch (_e) {}
    }
  }
  return clicked;
}

function pickBestVideo() {
  const videos = [...document.querySelectorAll('video')];
  const scored = videos
    .map((v) => {
      const inVast = !!v.closest('.vast_player, .vast_player_content, [class*="vast"]');
      const dur = isFinite(v.duration) ? v.duration : 0;
      return { v, inVast, dur, ready: v.readyState, t: v.currentTime || 0 };
    })
    .sort((a, b) => {
      if (a.inVast !== b.inVast) return a.inVast ? 1 : -1;
      if ((b.dur >= 60) !== (a.dur >= 60)) return b.dur >= 60 ? 1 : -1;
      return b.dur - a.dur || b.ready - a.ready;
    });
  return (scored[0] && scored[0].v) || videos[0] || null;
}

function playMuted() {
  dismissPreroll();
  const v = pickBestVideo();
  if (!v) return { played: false, currentTime: 0, duration: 0, live: false, readyState: 0 };
  v.muted = true;
  v.defaultMuted = true;
  v.volume = 0;
  try {
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  } catch (_e) {}
  return {
    played: true,
    currentTime: v.currentTime || 0,
    duration: isFinite(v.duration) ? v.duration : 0,
    live: v.duration === Infinity,
    readyState: v.readyState,
  };
}

function seekDeep() {
  dismissPreroll();
  const v = pickBestVideo();
  if (!v) return { skipped: true, reason: 'no-video', currentTime: 0, duration: 0, target: 0 };
  if (!isFinite(v.duration) || v.duration < 60) {
    return {
      skipped: true,
      reason: 'too-short-for-55s-cutoff',
      currentTime: v.currentTime || 0,
      duration: v.duration || 0,
      target: 0,
    };
  }
  // Coupe SFW typique ~44-46s : aller AU-DELA de 55s. Interdit de "reussir" sur une pub 30s.
  const target = Math.min(Math.max(55, v.duration * 0.45), v.duration - 2);
  try {
    v.currentTime = target;
  } catch (_e) {}
  return {
    skipped: false,
    currentTime: v.currentTime || 0,
    duration: v.duration,
    target,
  };
}

const INSPECT = '(' + inspectPage.toString() + ')()';

function markWall(row, info) {
  if (info.wall || /protectiondesmineurs|challenges\.cloudflare/i.test((info.href || '') + ' ' + (info.title || ''))) {
    row.wall = true;
  }
}

function applyHomeFlags(row, info) {
  row.finalUrl = info.href || row.finalUrl;
  row.title = info.title || row.title;
  row.inspect = info;
  markWall(row, info);
  if (info.sfwCatalog) row.sfwCatalog = true;
  if (info.ageOnly) row.ageOnly = true;
  if (info.overlay) row.overlayAfter = info.overlay;
  if (info.generalBlur) row.generalBlur = true;
  if (info.scrollLocked || info.clickable === false) row.scrollOrClickLock = true;
  if (info.live) row.liveOk = true;
  row.thumbsOk = info.thumbCount >= 4 && info.blurredThumbs === 0;
}

function applyVideoFlags(row, info) {
  row.finalUrl = info.href || row.finalUrl;
  markWall(row, info);
  if (info.sfwCatalog) row.sfwCatalog = true;
  if (info.overlay) row.overlayAfter = info.overlay;
  if (info.generalBlur) row.generalBlur = true;
  if (info.scrollLocked) row.scrollOrClickLock = true;
  if (info.live) row.liveOk = true;
  if (info.thumbCount >= 1 && info.blurredThumbs > 0) row.thumbsOk = false;
}

function verdictOf(row) {
  const fails = [];
  if (row.wall) fails.push('legal_or_cf_wall');
  if (row.sfwCatalog) fails.push('sfw_geo_catalog');
  if (row.ageOnly) fails.push('age_verification_only');
  if (row.overlayAfter) fails.push('popup_or_overlay');
  if (row.generalBlur) fails.push('general_blur');
  // Un pouce home non cliquable ne vire pas un site si seek 1+2 ont prouve la lecture.
  if (row.scrollOrClickLock && !(row.playOk && row.seekOk && row.navOk)) fails.push('scroll_or_click_lock');
  if (!row.thumbsOk) fails.push('blurred_or_empty_thumbs');
  if (!row.playOk) fails.push('no_playback');
  if (row.needsSeek && !row.seekOk) fails.push('seek_fail');
  if (row.seekCutoff) fails.push('seek_cutoff');
  if (!row.navOk) fails.push('broken_after_video_change');
  return { keep: fails.length === 0, fails };
}

async function waitHrefChange(cdp, prev, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const href = await cdp.eval('location.href');
      if (href && href !== prev) return href;
    } catch (_e) {}
    await sleep(250);
  }
  return null;
}

const HELPERS = dismissPreroll.toString() + '\n' + pickBestVideo.toString() + '\n';
const PLAY_EVAL = HELPERS + '(' + playMuted.toString() + ')()';
const SEEK_EVAL = HELPERS + '(' + seekDeep.toString() + ')()';

async function provePlayback(cdp) {
  await injectContent(cdp);
  await cdp.eval(HELPERS + '(' + dismissPreroll.toString() + ')()');
  await cdp.eval(PLAY_EVAL);
  await sleep(900);
  const again = await cdp.eval(PLAY_EVAL);
  if ((again.duration || 0) > 0 && again.duration < 45) {
    await sleep(1200);
    await cdp.eval(PLAY_EVAL);
  }
  const t0info = await cdp.eval(INSPECT);
  const t0 = t0info.currentTime || 0;
  await sleep(2000);
  const later = await cdp.eval(INSPECT);
  const advanced = later.currentTime > t0 + 0.25;
  return { t0, later, advanced, live: !!(later.live || t0info.live) };
}

async function proveDeepSeek(cdp) {
  await injectContent(cdp);
  await cdp.eval(PLAY_EVAL);
  await sleep(400);
  let seek = await cdp.eval(SEEK_EVAL);
  if (seek.skipped && seek.reason === 'too-short-for-55s-cutoff') {
    await sleep(2200);
    await cdp.eval(PLAY_EVAL);
    seek = await cdp.eval(SEEK_EVAL);
  }
  if (seek.skipped) {
    const cutoff = seek.reason === 'too-short-for-55s-cutoff';
    return { ok: !cutoff, skipped: true, cutoff, seek, after: null };
  }
  await sleep(900);
  const after = await cdp.eval(INSPECT);
  const minStay = Math.max(8, (seek.target || 55) - 8);
  const snapped = (after.currentTime || 0) < minStay;
  const dirty = !!(after.overlay || after.generalBlur);
  if (snapped || dirty) {
    return { ok: false, skipped: false, cutoff: true, snapped, dirty, seek, after };
  }
  const play = await provePlayback(cdp);
  const frozen = !play.advanced && !play.live;
  const dirtyAfter = !!(play.later.overlay || play.later.generalBlur);
  return {
    ok: !frozen && !dirtyAfter,
    skipped: false,
    cutoff: !!(frozen || dirtyAfter || snapped),
    snapped,
    dirty: dirtyAfter,
    frozen,
    seek,
    after: play.later,
  };
}

async function runSite(site) {
  const row = {
    name: site.name,
    url: site.url,
    finalUrl: '',
    title: '',
    wall: false,
    sfwCatalog: false,
    ageOnly: false,
    overlayAfter: null,
    generalBlur: false,
    scrollOrClickLock: false,
    thumbsOk: false,
    playOk: false,
    liveOk: false,
    seekOk: false,
    seekCutoff: false,
    needsSeek: false,
    navOk: false,
    notes: [],
    inspect: null,
    inspectVideo: null,
    inspectVideo2: null,
  };
  let tab;
  try {
    tab = await openTab(site.url);
    await injectContent(tab.cdp);
    await sleep(900);

    const home = await tab.cdp.eval(INSPECT);
    applyHomeFlags(row, home);

    if (row.wall || row.sfwCatalog || row.ageOnly) {
      row.notes.push(home.textSample || '');
      return row;
    }

    const tried = [];
    async function openPlayable(fromHref) {
      for (let i = 0; i < 3; i++) {
        const href = await tab.cdp.eval('(' + clickMedia.toString() + ')(' + JSON.stringify(tried) + ')');
        if (!href) return { href: null, play: null };
        tried.push(href);
        await waitHrefChange(tab.cdp, fromHref, 5000);
        await sleep(1500);
        const play = await provePlayback(tab.cdp);
        if (play.live) return { href, play };
        if (play.advanced && (play.later.duration || 0) >= 60) return { href, play };
        row.notes.push('skip-short-or-dead=' + Math.round(play.later.duration || 0) + 's');
        fromHref = play.later.href || href;
      }
      return { href: tried[tried.length - 1] || null, play: null };
    }

    const first = await openPlayable(home.href);
    const href1 = first.href;
    const play1 = first.play;
    if (!href1 || !play1) {
      row.scrollOrClickLock = !href1;
      row.notes.push(href1 ? 'no-long-playable-video' : 'no-media-link');
      return row;
    }

    row.inspectVideo = play1.later;
    applyVideoFlags(row, play1.later);
    row.playOk = play1.advanced;
    row.liveOk = row.liveOk || play1.live;
    if (play1.later.overlay) row.overlayAfter = play1.later.overlay;
    if (play1.later.generalBlur) row.generalBlur = true;

    if (play1.live) {
      row.needsSeek = false;
      row.seekOk = true;
    } else {
      row.needsSeek = true;
      const deep1 = await proveDeepSeek(tab.cdp);
      if (deep1.after) {
        row.inspectVideo = deep1.after;
        applyVideoFlags(row, deep1.after);
      }
      row.seekOk = !!deep1.ok && !deep1.cutoff;
      row.seekCutoff = !!deep1.cutoff;
      if (deep1.cutoff) row.notes.push('seek-cutoff');
      if (deep1.seek) row.notes.push('seek1=' + Math.round(deep1.seek.target || 0) + 's/' + Math.round(deep1.seek.duration || 0) + 's');
    }

    const second = await openPlayable(play1.later.href);
    const href2 = second.href;
    const play2 = second.play;
    if (!href2 || href2 === href1 || !play2) {
      row.notes.push('no-second-distinct-video');
      return row;
    }
    row.inspectVideo2 = play2.later;
    applyVideoFlags(row, play2.later);
    const secondClean = !play2.later.overlay && !play2.later.generalBlur;
    const secondPlay = play2.advanced || play2.live;
    let secondSeekOk = true;
    if (play2.live) {
      secondSeekOk = true;
    } else {
      const deep2 = await proveDeepSeek(tab.cdp);
      if (deep2.after) {
        row.inspectVideo2 = deep2.after;
        applyVideoFlags(row, deep2.after);
      }
      secondSeekOk = !!deep2.ok && !deep2.cutoff;
      if (deep2.cutoff) {
        row.seekCutoff = true;
        row.notes.push('second-seek-fail');
      }
      if (deep2.seek) row.notes.push('seek2=' + Math.round(deep2.seek.target || 0) + 's/' + Math.round(deep2.seek.duration || 0) + 's');
    }
    row.navOk = !!(secondClean && secondPlay && secondSeekOk);
    if (!secondPlay && !play2.live) row.notes.push('second-no-playback');
  } catch (e) {
    row.notes.push('error:' + String(e.message || e).slice(0, 160));
  } finally {
    if (tab) await closeTab(tab.id, tab.cdp);
  }
  return row;
}

const sites = filterOnly(mergeSites(parseSupportedSites(), loadExtraCandidates()));
const results = [];
console.log('BENCH-STRICT sequential', sites.length, 'CDP', CDP, CANDIDATES_ONLY ? 'candidates-only' : '');
for (const site of sites) {
  const t0 = Date.now();
  const row = await runSite(site);
  const v = verdictOf(row);
  row.keep = v.keep;
  row.fails = v.fails;
  row.ms = Date.now() - t0;
  results.push(row);
  console.log(
    (row.keep ? 'KEEP' : 'FAIL') +
      ' ' +
      site.name +
      (row.fails.length ? ' ' + row.fails.join(',') : '') +
      (row.notes.length ? ' | ' + row.notes.join('; ') : '')
  );
}

function slimInspect(info) {
  if (!info) return null;
  return {
    href: info.href || null,
    currentTime: info.currentTime || 0,
    duration: info.duration || 0,
    overlay: info.overlay || null,
    generalBlur: !!info.generalBlur,
    firstLink: info.firstLink || null,
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  keep: results.filter((r) => r.keep).map((r) => r.name),
  keepDetails: results
    .filter((r) => r.keep)
    .map((r) => ({
      name: r.name,
      url: r.finalUrl || r.url,
      notes: r.notes,
      video1: slimInspect(r.inspectVideo),
      video2: slimInspect(r.inspectVideo2),
    })),
  fail: results
    .filter((r) => !r.keep)
    .map((r) => ({
      name: r.name,
      url: r.finalUrl || r.url,
      fails: r.fails,
      notes: r.notes,
      inspect: r.inspect,
      video1: slimInspect(r.inspectVideo),
      video2: slimInspect(r.inspectVideo2),
    })),
};
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log('WROTE', OUT);
console.log('KEEP', report.keep.length, 'FAIL', report.fail.length);
process.exit(0);
