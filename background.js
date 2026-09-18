// Service worker MV3: (1) telechargements cross-origin via chrome.downloads,
// (2) proxy xHamster hors-France pour deflouter (le flou est geo-FR: via une IP
// hors-FR, xHamster sert le flux clair sans /sfw/),
// (3) proxy cible XVIDEOS/XNXX embedframe uniquement (decouverte URL, pas le CDN).
const api = typeof chrome !== 'undefined' ? chrome : typeof browser !== 'undefined' ? browser : null;

// ---------------------------------------------------------------------------
// Telechargements
// ---------------------------------------------------------------------------
if (api?.runtime?.onMessage) {
  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action === 'download' && message.url) {
      try {
        api.downloads.download(
          { url: message.url, filename: message.filename || undefined, saveAs: false },
          (downloadId) => sendResponse({ success: typeof downloadId === 'number', downloadId })
        );
        return true;
      } catch (_err) {
        sendResponse({ success: false });
        return false;
      }
    }
    if (message?.action && (message.action.startsWith('proxy:') || message.action === 'xv:embedframe')) {
      handleProxyMessage(message).then(sendResponse);
      return true;
    }
    return false;
  });
}

// ---------------------------------------------------------------------------
// Proxy xHamster
// ---------------------------------------------------------------------------
const PROXY_DOMAINS = ['xhamster.com', 'xhamster.desi', 'xhpingcdn.com', 'xhcdn.com'];
const PROXY_MATCH = ['*://*.xhamster.com/*', '*://*.xhamster.desi/*', '*://*.xhpingcdn.com/*', '*://*.xhcdn.com/*'];
const PROXY_XV_EMBED_MATCH = [
  '*://*.xvideos.com/embedframe/*', '*://*.xvideos.es/embedframe/*', '*://*.xvideos.red/embedframe/*',
  '*://*.xnxx.com/embedframe/*', '*://*.xnxx.es/embedframe/*', '*://*.xnxx.red/embedframe/*',
];
// Proxys hors-FR par defaut (publics gratuits, valides e2e). Peuvent mourir:
// l'utilisateur peut rafraichir la liste (proxy:refresh) et le PAC bascule
// automatiquement sur le suivant (failover), puis DIRECT en dernier recours.
const DEFAULT_PROXIES = [
  '153.80.240.37:8080',
  '153.80.240.37:1080',
  '91.98.86.26:8888',
  '174.138.161.146:8024',
  '131.153.163.130:8184',
  '131.153.163.130:50325',
];
const PROXYSCRAPE_URL =
  'https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=ipport&format=json&protocol=http&country=nl,de,gb,us,ch,es,it,pl,no';

function isFirefoxProxy() {
  return !!(api && api.proxy && api.proxy.onRequest && !(api.proxy.settings && api.proxy.settings.set));
}

async function getProxyConfig() {
  const s = await api.storage.local.get(['xhProxyEnabled', 'xhProxyList']);
  return {
    enabled: s.xhProxyEnabled !== false, // defaut: actif
    list: Array.isArray(s.xhProxyList) && s.xhProxyList.length ? s.xhProxyList : DEFAULT_PROXIES.slice(),
  };
}

function buildPacData(list) {
  const proxyChain = list.map((p) => `PROXY ${p}`).join('; ');
  const ret = (proxyChain ? proxyChain + '; ' : '') + 'DIRECT';
  const xhConds = PROXY_DOMAINS
    .map((d) => `dnsDomainIs(host, ".${d}") || host == "${d}"`)
    .join(' || ');
  const xvHostConds =
    'dnsDomainIs(host, ".xvideos.com") || host == "xvideos.com" || dnsDomainIs(host, ".xvideos.es") || host == "xvideos.es" || dnsDomainIs(host, ".xvideos.red") || host == "xvideos.red" || dnsDomainIs(host, ".xnxx.com") || host == "xnxx.com" || dnsDomainIs(host, ".xnxx.es") || host == "xnxx.es" || dnsDomainIs(host, ".xnxx.red") || host == "xnxx.red"';
  return `function FindProxyForURL(url, host) {
  if (${xhConds}) {
    return "${ret}";
  }
  if ((${xvHostConds}) && shExpMatch(url, "*/embedframe/*")) {
    return "${ret}";
  }
  return "DIRECT";
}`;
}

// --- Firefox: proxy.onRequest ---
let firefoxHandler = null;
function firefoxApply(list) {
  firefoxClear();
  const infos = list.map((p) => {
    const [host, port] = p.split(':');
    // failoverTimeout court => Firefox bascule vite sur le proxy suivant si un
    // proxy ne repond pas (cascade rapide).
    return { type: 'http', host, port: parseInt(port, 10), failoverTimeout: 2 };
  });
  infos.push({ type: 'direct' });
  firefoxHandler = (details) => {
    try {
      const u = new URL(details.url);
      const h = u.hostname.toLowerCase();
      const isXv =
        h === 'xvideos.com' || h.endsWith('.xvideos.com') ||
        h === 'xvideos.es' || h.endsWith('.xvideos.es') ||
        h === 'xvideos.red' || h.endsWith('.xvideos.red') ||
        h === 'xnxx.com' || h.endsWith('.xnxx.com') ||
        h === 'xnxx.es' || h.endsWith('.xnxx.es') ||
        h === 'xnxx.red' || h.endsWith('.xnxx.red');
      if (isXv && !u.pathname.includes('/embedframe/')) {
        return [{ type: 'direct' }];
      }
    } catch (_e) { /* ignore */ }
    return infos;
  };
  api.proxy.onRequest.addListener(firefoxHandler, { urls: [...PROXY_MATCH, ...PROXY_XV_EMBED_MATCH] });
}
function firefoxClear() {
  if (firefoxHandler && api.proxy.onRequest.hasListener(firefoxHandler)) {
    api.proxy.onRequest.removeListener(firefoxHandler);
  }
  firefoxHandler = null;
}

// --- Chromium: proxy.settings pac_script ---
function chromiumApply(list) {
  return new Promise((resolve) => {
    api.proxy.settings.set(
      { value: { mode: 'pac_script', pacScript: { data: buildPacData(list) } }, scope: 'regular' },
      () => resolve()
    );
  });
}
function chromiumClear() {
  return new Promise((resolve) => {
    try { api.proxy.settings.clear({ scope: 'regular' }, () => resolve()); } catch (_e) { resolve(); }
  });
}

async function applyProxy() {
  const { enabled, list } = await getProxyConfig();
  if (!api || !api.proxy) return { ok: false, reason: 'no-proxy-api' };
  if (!enabled) return clearProxy().then(() => ({ ok: true, enabled: false }));
  if (isFirefoxProxy()) firefoxApply(list);
  else await chromiumApply(list);
  return { ok: true, enabled: true, count: list.length };
}

async function clearProxy() {
  if (!api || !api.proxy) return { ok: false };
  if (isFirefoxProxy()) firefoxClear();
  else await chromiumClear();
  return { ok: true, enabled: false };
}

async function refreshProxies() {
  try {
    const resp = await fetch(PROXYSCRAPE_URL);
    const data = await resp.json();
    const arr = (data.proxies || data)
      .filter((p) => (p.alive !== false) && (!p.ip_data || p.ip_data.countryCode !== 'FR'))
      .sort((a, b) => (a.average_timeout || 9999) - (b.average_timeout || 9999))
      .map((p) => (p.proxy ? p.proxy.replace(/^\w+:\/\//, '') : `${p.ip}:${p.port}`))
      .filter(Boolean);
    // Garder les proxys par defaut valides en tete, puis completer, sans doublons.
    const merged = [...new Set([...DEFAULT_PROXIES, ...arr])].slice(0, 20);
    await api.storage.local.set({ xhProxyList: merged });
    await applyProxy();
    return { ok: true, count: merged.length };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 120) };
  }
}

async function handleProxyMessage(message) {
  switch (message.action) {
    case 'proxy:getStatus': {
      const { enabled, list } = await getProxyConfig();
      return { enabled, list, engine: isFirefoxProxy() ? 'firefox' : 'chromium' };
    }
    case 'proxy:setEnabled': {
      await api.storage.local.set({ xhProxyEnabled: !!message.enabled });
      const r = await applyProxy();
      return { ...r };
    }
    case 'proxy:setList': {
      const list = Array.isArray(message.list) ? message.list.filter((x) => /^[\w.-]+:\d+$/.test(x)) : [];
      await api.storage.local.set({ xhProxyList: list.length ? list : DEFAULT_PROXIES.slice() });
      const r = await applyProxy();
      return { ...r };
    }
    case 'proxy:ensure': {
      // Reassure le proxy (utile apres eviction du service worker MV3).
      const r = await applyProxy();
      const cfg = await getProxyConfig();
      return { ...r, enabled: cfg.enabled, count: cfg.list.length, head: cfg.list[0] || null };
    }
    case 'proxy:refresh':
      return refreshProxies();
    case 'proxy:rotate': {
      // Bascule "cascade": le proxy en tete est demoted en fin de liste (ou le
      // proxy explicitement signale mort), pour que la prochaine requete/charge
      // utilise un autre exit. Auto-guerison: les proxys qui marchent remontent.
      const { enabled, list } = await getProxyConfig();
      if (!enabled) return { ok: false, disabled: true };
      if (list.length > 1) {
        const dead = message.dead;
        const newList = dead && list.includes(dead)
          ? [...list.filter((p) => p !== dead), dead]
          : [...list.slice(1), list[0]];
        await api.storage.local.set({ xhProxyList: newList });
        await applyProxy();
        return { ok: true, head: newList[0], count: newList.length };
      }
      await applyProxy();
      return { ok: true, head: list[0] || null, count: list.length };
    }
    case 'xv:embedframe': {
      const key = String(message.key || '').replace(/[^\w.-]/g, '');
      const origin = message.origin;
      if (!key || !/^https:\/\/(www\.)?(xvideos|xnxx)\.(com|es|red)$/i.test(origin || '')) {
        return { ok: false };
      }
      try {
        const r = await fetch(`${origin}/embedframe/${key}`, { credentials: 'omit', cache: 'no-store' });
        if (!r.ok) return { ok: false };
        const t = await r.text();
        const high = (t.match(/setVideoUrlHigh\('([^']+)'\)/) || [])[1] || null;
        const low = (t.match(/setVideoUrlLow\('([^']+)'\)/) || [])[1] || null;
        const hls = (t.match(/setVideoHLS\('([^']+)'\)/) || [])[1] || null;
        if (!high && !low && !hls) return { ok: false };
        return { ok: true, high, low, hls };
      } catch (_e) {
        return { ok: false };
      }
    }
    default:
      return { ok: false };
  }
}

if (api?.runtime?.onInstalled) api.runtime.onInstalled.addListener(() => { applyProxy(); });
if (api?.runtime?.onStartup) api.runtime.onStartup.addListener(() => { applyProxy(); });
// Application immediate au demarrage du service worker.
applyProxy();
