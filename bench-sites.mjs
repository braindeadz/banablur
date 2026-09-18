/**
 * Banc séquentiel Banablur — zéro dépendance (CDP + WebSocket Node).
 *
 * KEEP seulement si : pas de mur légal/ARCOM/CF, pas de page âge seule,
 * pas de catalogue SFW/geo (Pornhub FR), pas de popup, thumbs clean,
 * lecture réelle, seek OK (sauf live), toujours clean après changement de vidéo.
 *
 *   node bench-sites.mjs --port=9222
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number((process.argv.find((a) => a.startsWith('--port=')) || '--port=9222').split('=')[1]);
const OUT = path.join(process.env.TEMP || __dirname, 'banablur-bench-results.json');
const CONTENT = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
const CDP = 'http://127.0.0.1:' + PORT;

function parseSites() {
  const src = fs.readFileSync(path.join(__dirname, 'popup.js'), 'utf8');
  const re = /\{\s*name:\s*'([^']+)',\s*url:\s*'([^']+)'\s*\}/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push({ name: m[1], url: m[2] });
  return out;
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
    try { this.ws.close(); } catch (_e) {}
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
  await sleep(500);
  return { id: t.id, cdp };
}

async function closeTab(id, cdp) {
  try { cdp.close(); } catch (_e) {}
  try { await fetch(CDP + '/json/close/' + id, { method: 'PUT' }); } catch (_e) {}
}

const INSPECT = `(() => {
  const videos = [...document.querySelectorAll('video')];
  const v = videos.find((x) => x.readyState >= 2 || (x.currentTime || 0) > 0.2) || videos[0] || null;
  const overlaySel = [
    '#disclaimer_parent_wrapper','#agego-overlay','#agego-overlay-container',
    '#ageDisclaimerMainBG','.ageDisclaimer','#agreement-root',
    '.visitors-agreement-modal','#consent_modal.over-18','#ageverifybox',
    '#age-verification-overlay','.popup_18_plus','#AgeConsentGenderDisclaimer',
    '.modal-age-verification','#modal-warning.is-active'
  ];
  let overlay = null;
  for (const s of overlaySel) {
    const el = document.querySelector(s);
    if (!el) continue;
    const st = getComputedStyle(el);
    if (st.display !== 'none' && st.visibility !== 'hidden' && st.pointerEvents !== 'none' && el.offsetHeight > 40) {
      overlay = s; break;
    }
  }
  const thumbs = [...document.querySelectorAll('img')].slice(0, 40);
  const blurredThumbs = thumbs.filter((img) => {
    const f = (img.getAttribute('style') || '') + (getComputedStyle(img).filter || '');
    return /blur\\(/i.test(f);
  }).length;
  const text = (document.body && document.body.innerText || '').slice(0, 2500);
  const wall = /acc[eè]s (à notre site )?suspendu|protectiondesmineurs|arcom|notice to users|just a moment|service unavailable in france/i.test(text + ' ' + document.title);
  return {
    href: location.href,
    title: document.title,
    sfwPage: !!(document.body && document.body.classList.contains('sfw-page')),
    isSfw: String(window.isSfw || '') === '1',
    wall,
    ageOnlyPath: /\\/age-verification|\\/tour\\/sfw/i.test(location.pathname + location.href),
    overlay,
    thumbCount: thumbs.length,
    blurredThumbs,
    videoCount: videos.length,
    paused: v ? v.paused : null,
    currentTime: v ? v.currentTime : 0,
    duration: v && isFinite(v.duration) ? v.duration : 0,
    readyState: v ? v.readyState : 0,
    live: !!(v && v.duration === Infinity),
    textSample: text.replace(/\\s+/g, ' ').slice(0, 180)
  };
})()`;

const CLICK = `(() => {
  const sels = ['a[href*="/video"]','a[href*="/videos/"]','a[href*="/watch"]','a[href*="view_video"]','a[href*="/view/"]','.thumb a','.mozaique a','.thumb-block a','a.video-link','.roomcard a','a[href*="/chat/"]'];
  for (const s of sels) {
    const a = document.querySelector(s);
    if (a && a.href && !/javascript:|#/.test(a.getAttribute('href') || '')) { a.click(); return a.href; }
  }
  return null;
})()`;

function verdictOf(row) {
  const fails = [];
  if (row.wall) fails.push('legal_or_cf_wall');
  if (row.sfwCatalog) fails.push('sfw_geo_catalog');
  if (row.ageOnly) fails.push('age_verification_only');
  if (row.overlayAfter) fails.push('popup_or_overlay');
  if (!row.playOk && !row.liveOk) fails.push('no_playback');
  if (row.needsSeek && !row.seekOk) fails.push('seek_fail');
  if (!row.navOk) fails.push('broken_after_video_change');
  if (!row.thumbsOk && !row.liveOk) fails.push('blurred_or_empty_thumbs');
  return { keep: fails.length === 0, fails };
}

async function runSite(site) {
  const row = {
    name: site.name, url: site.url, finalUrl: '',
    wall: false, sfwCatalog: false, ageOnly: false, overlayAfter: null,
    thumbsOk: false, playOk: false, liveOk: false, seekOk: false,
    needsSeek: true, navOk: false, notes: [],
  };
  let tab;
  try {
    tab = await openTab(site.url);
    await sleep(1800);
    let info = await tab.cdp.eval(INSPECT);
    row.finalUrl = info.href;
    row.wall = !!info.wall || /protectiondesmineurs|challenges\\.cloudflare/i.test(info.href + info.title);
    row.sfwCatalog = !!(info.sfwPage || info.isSfw);
    row.ageOnly = !!(info.ageOnlyPath && info.thumbCount < 8 && info.videoCount === 0);
    if (row.wall || row.sfwCatalog || row.ageOnly) {
      row.notes.push(info.textSample || '');
      row.needsSeek = false;
      return row;
    }
    await tab.cdp.eval(CONTENT + ';true');
    await sleep(700);
    info = await tab.cdp.eval(INSPECT);
    row.overlayAfter = info.overlay;
    row.thumbsOk = info.thumbCount >= 4 && info.blurredThumbs < Math.max(3, info.thumbCount * 0.5);
    if (info.live) { row.liveOk = info.readyState >= 2 || info.currentTime > 0; row.needsSeek = false; }

    const href1 = await tab.cdp.eval(CLICK);
    if (href1) {
      await sleep(3500);
      await tab.cdp.eval(CONTENT + ';true');
      await tab.cdp.eval(`(() => { const v=document.querySelector('video'); if(v){v.muted=true; v.play();} return true; })()`);
      await sleep(2200);
      const t0 = (await tab.cdp.eval(INSPECT)).currentTime;
      await sleep(2000);
      const later = await tab.cdp.eval(INSPECT);
      row.playOk = later.currentTime > t0 + 0.25 || (later.readyState >= 2 && later.paused === false);
      row.liveOk = row.liveOk || later.live;
      if (later.live) row.needsSeek = false;
      if (row.needsSeek) {
        await tab.cdp.eval(`(() => { const v=document.querySelector('video'); if(v && isFinite(v.duration) && v.duration>8) v.currentTime=Math.min(v.duration*0.4,v.duration-1); return true; })()`);
        await sleep(700);
        const after = await tab.cdp.eval(INSPECT);
        row.seekOk = after.currentTime >= 1;
      } else row.seekOk = true;
      if (later.overlay) row.overlayAfter = later.overlay;
    }

    const href2 = await tab.cdp.eval(CLICK);
    if (href2 && href2 !== href1) {
      await sleep(3500);
      await tab.cdp.eval(CONTENT + ';true');
      await tab.cdp.eval(`(() => { const v=document.querySelector('video'); if(v){v.muted=true; v.play();} return true; })()`);
      await sleep(2000);
      const n = await tab.cdp.eval(INSPECT);
      row.navOk = !n.overlay && (n.currentTime > 0.2 || n.readyState >= 2 || n.live);
      if (n.overlay) row.overlayAfter = n.overlay;
    } else if (row.playOk || row.liveOk) {
      row.navOk = !row.overlayAfter;
      row.notes.push('single-media-or-same-link');
    }
  } catch (e) {
    row.notes.push('error:' + String(e.message || e).slice(0, 160));
  } finally {
    if (tab) await closeTab(tab.id, tab.cdp);
  }
  return row;
}

const sites = parseSites();
const results = [];
console.log('BENCH sequential', sites.length, 'CDP', CDP);
for (const site of sites) {
  const t0 = Date.now();
  const row = await runSite(site);
  const v = verdictOf(row);
  row.keep = v.keep;
  row.fails = v.fails;
  row.ms = Date.now() - t0;
  results.push(row);
  console.log((row.keep ? 'KEEP ' : 'DELIST'), site.name.padEnd(22), (row.fails.join(',') || 'ok'), row.ms + 'ms');
}
const report = {
  at: new Date().toISOString(),
  total: results.length,
  keep: results.filter((r) => r.keep).map((r) => r.name),
  delist: results.filter((r) => !r.keep).map((r) => ({ name: r.name, fails: r.fails, url: r.finalUrl || r.url })),
  results,
};
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log('WROTE', OUT);
console.log('KEEP', report.keep.length, 'DELIST', report.delist.length);
process.exit(0);
