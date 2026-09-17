(function () {
  'use strict';

  const CSS_ID = 'banablur-override';
  const THUMB_INTERVAL_MS = 2500;
  const THUMB_DEBOUNCE_MS = 200;
  const APP_REFRESH_MS = 25000;
  const RELOAD_COOLDOWN_MS = 4000;

  const GATE_CSS = `
#age_gate_overlay, #age_gate_home, #age_gate_overlay *,
#age-gate-header, #age-gate-visitor-text, #age-gate-timing-sentence,
#age-gate-verify, #age-gate-account, #age-gate-tool-tip-icon, #age-gate-tool-tip-text,
#age-key-div, #age-key-option, #av-choices, #av-choice-submit, .age-gate-tooltip, .multi-av {
  pointer-events: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  clip-path: inset(100%) !important;
  overflow: hidden !important;
  color: transparent !important;
}
#age_gate_overlay, #age_gate_home {
  z-index: -1 !important;
  max-height: 0 !important;
  max-width: 0 !important;
  width: 0 !important;
  height: 0 !important;
}
body.age-gate--shown { overflow: auto !important; }
#main,
#base,
.main-content-wrapper,
#roomlist_root {
  position: relative !important;
  z-index: 1200 !important;
  pointer-events: auto !important;
}
.RoomCard, .RoomCardThumbnail, .RoomCardThumbnail__image {
  pointer-events: auto !important;
  cursor: pointer !important;
}
.videoPlayerDiv canvas { filter: none !important; }
`.trim();

  const api = typeof chrome !== 'undefined' ? chrome : typeof browser !== 'undefined' ? browser : null;

  let autoEnabled = true;
  let thumbTimer = null;
  let thumbObserver = null;
  let started = false;
  let lastCleanup = null;
  let clicksBound = false;
  let appRoot = null;
  let appGrid = null;
  let appSentinel = null;
  let appCards = new Map();
  let appObserver = null;
  let appRefreshTimer = null;
  let appSyncTimer = null;
  let currentPage = 1;
  let loadingPage = false;

  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = GATE_CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function injectPageReloadGuard() {
    if (window.__agegoReloadGuardInjected) return;
    window.__agegoReloadGuardInjected = true;

    const script = document.createElement('script');
    script.textContent = `(function(){
      if(window.__agegoCbGuard) return;
      window.__agegoCbGuard=true;
      var last=0, n=0;
      var orig=location.reload.bind(location);
      location.reload=function(){
        var now=Date.now();
        if(now-last<${RELOAD_COOLDOWN_MS}){ n++; if(n<5) return; }
        last=now; n=0;
        return orig.apply(location, arguments);
      };
    })();`;
    (document.documentElement || document.head).appendChild(script);
    script.remove();
  }

  function showToast(text) {
    let el = document.getElementById('agego-cb-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'agego-cb-toast';
      el.style.cssText =
        'position:fixed;bottom:16px;left:16px;z-index:99999;background:#111;color:#fff;padding:8px 14px;border-radius:8px;font:13px sans-serif;pointer-events:none;opacity:0.92;';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.display = 'block';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => {
      el.style.display = 'none';
    }, 3500);
  }

  function getNextRoomSlug() {
    const next = new URLSearchParams(location.search).get('next');
    if (!next) return null;
    const parts = next.split('/').filter(Boolean);
    if (parts.length === 1 && !['b', 'female', 'male', 'couple', 'trans'].includes(parts[0])) {
      return parts[0];
    }
    return null;
  }

  function getSlugFromLink(link) {
    if (!link) return null;
    const fromImg = link.querySelector('img.RoomCardThumbnail__image')?.alt;
    if (fromImg) return fromImg;
    const parts = (link.getAttribute('href') || link.pathname || '').split('/').filter(Boolean);
    return parts[0] || null;
  }

  function createCustomApp() {
    if (appRoot) return;
    currentPage = Number(new URLSearchParams(location.search).get('page') || 1);

    appRoot = document.createElement('section');
    appRoot.id = 'agego-app';
    appRoot.setAttribute('aria-label', 'Chaturbate');
    appRoot.style.cssText =
      'position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;background:#0b0b0f;color:#f5f5f5;font:14px system-ui,sans-serif;overscroll-behavior:contain;';

    const header = document.createElement('header');
    header.style.cssText =
      'position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:16px;padding:14px 20px;background:rgba(18,18,24,.96);backdrop-filter:blur(10px);border-bottom:1px solid #292936;';

    const title = document.createElement('strong');
    title.textContent = 'Banablur';
    title.style.cssText = 'font-size:18px;white-space:nowrap;';

    const count = document.createElement('span');
    count.id = 'agego-app-count';
    count.style.cssText = 'color:#aaa;white-space:nowrap;';

    const categories = document.createElement('nav');
    categories.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
    for (const [label, target] of [
      ['Female', '_female'],
      ['Male', '_male'],
      ['Couple', '_couple'],
      ['Trans', '_trans'],
    ]) {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = `/?next=%2Fb%2F${target}%2F`;
      link.style.cssText =
        'color:#ddd;background:#262633;border-radius:6px;padding:6px 10px;text-decoration:none;';
      categories.appendChild(link);
    }

    header.append(title, count, categories);
    appGrid = document.createElement('div');
    appGrid.id = 'agego-app-grid';
    appGrid.style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;padding:20px;align-content:start;';

    appSentinel = document.createElement('div');
    appSentinel.id = 'agego-app-sentinel';
    appSentinel.style.cssText = 'height:80px;grid-column:1/-1;';
    appGrid.appendChild(appSentinel);

    appRoot.append(header, appGrid);
    document.body.appendChild(appRoot);
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');

    appRoot.addEventListener('click', (event) => {
      const card = event.target.closest('[data-agego-room]');
      if (!card) return;
      event.preventDefault();
      event.stopPropagation();
      unlockChaturbateStream(card.dataset.agegoRoom);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadNextPage();
      },
      { root: appRoot, rootMargin: '500px' }
    );
    observer.observe(appSentinel);
  }

  function makeAppCard(source) {
    const link = source.querySelector('a.RoomCardThumbnail');
    const img = source.querySelector('img.RoomCardThumbnail__image');
    const slug = getSlugFromLink(link);
    if (!slug || !img) return null;

    const card = document.createElement('article');
    card.dataset.agegoRoom = slug;
    card.style.cssText =
      'background:#181820;border:1px solid #2c2c38;border-radius:10px;overflow:hidden;cursor:pointer;transition:transform .15s,border-color .15s;';
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.borderColor = '#7777ff';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.borderColor = '#2c2c38';
    });

    const image = document.createElement('img');
    image.alt = img.alt || slug;
    image.src = img.src.replace('/ribw/', '/riw/');
    image.dataset.agegoSource = img.src;
    image.style.cssText = 'display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#000;';

    const body = document.createElement('div');
    body.style.cssText = 'padding:10px 12px;';
    const name = document.createElement('strong');
    name.textContent = slug;
    name.style.cssText = 'display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    const subject = document.createElement('div');
    subject.textContent = source.querySelector('.RoomCardSubject')?.textContent?.trim() || '';
    subject.style.cssText = 'color:#bbb;margin-top:5px;min-height:34px;overflow:hidden;';
    const meta = document.createElement('small');
    meta.textContent =
      source.querySelector('.cams')?.textContent?.replace(/\s+/g, ' ').trim() ||
      [source.querySelector('.age')?.textContent, source.querySelector('.gender')?.textContent]
        .filter(Boolean)
        .join(' · ');
    meta.style.cssText = 'display:block;color:#8f8fa5;margin-top:8px;';

    body.append(name, subject, meta);
    card.append(image, body);
    return card;
  }

  function syncCustomCards() {
    if (!appGrid) return;
    const sources = document.querySelectorAll('ul.RoomCardGrid > .RoomCard');
    let added = 0;
    sources.forEach((source) => {
      const slug = getSlugFromLink(source.querySelector('a.RoomCardThumbnail'));
      if (!slug || appCards.has(slug)) return;
      const card = makeAppCard(source);
      if (!card) return;
      appCards.set(slug, card);
      appGrid.insertBefore(card, appSentinel);
      added++;
    });
    const count = document.getElementById('agego-app-count');
    if (count) count.textContent = `${appCards.size} rooms`;
    if (added) fixThumbnails();
  }

  function refreshCustomThumbnails() {
    appCards.forEach((card) => {
      const image = card.querySelector('img');
      const source = card.querySelector('img')?.dataset.agegoSource;
      if (!image || !source) return;
      const separator = source.includes('?') ? '&' : '?';
      image.src = source.replace('/ribw/', '/riw/') + `${separator}agego=${Date.now()}`;
    });
  }

  function loadNextPage() {
    if (loadingPage) return;
    const links = [...document.querySelectorAll('div.Pagination a')];
    const next = links.find((link) => Number(new URL(link.href).searchParams.get('page')) === currentPage + 1);
    if (!next) return;
    loadingPage = true;
    currentPage++;
    next.click();
    setTimeout(() => {
      loadingPage = false;
      syncCustomCards();
    }, 1800);
  }

  function startCustomApp() {
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startCustomApp, { once: true });
      } else {
        setTimeout(startCustomApp, 0);
      }
      return;
    }
    try {
      createCustomApp();
      syncCustomCards();
    } catch (error) {
      return;
    }
    if (!appObserver) {
      const root = document.getElementById('roomlist_root') || document.body;
      appObserver = new MutationObserver(() => {
        clearTimeout(appSyncTimer);
        appSyncTimer = setTimeout(() => {
          ensureGateHidden();
          syncCustomCards();
        }, THUMB_DEBOUNCE_MS);
      });
      appObserver.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
    }
    if (!appRefreshTimer) {
      appRefreshTimer = setInterval(refreshCustomThumbnails, APP_REFRESH_MS);
    }
  }

  function injectPageUnlock() {
    if (document.documentElement.dataset.agegoUnlockReady === '1') return;
    if (document.documentElement.dataset.agegoUnlockInjected === '1') return;
    if (!api?.runtime?.getURL) return;

    document.documentElement.dataset.agegoUnlockInjected = '1';
    document.documentElement.dataset.agegoHlsSrc = api.runtime.getURL('hls.min.js');
    const script = document.createElement('script');
    script.src = api.runtime.getURL('chaturbate-page.js');
    script.onload = () => {
      document.documentElement.dataset.agegoUnlockReady = '1';
      script.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  async function waitForPageScript() {
    injectPageUnlock();
    for (let i = 0; i < 40; i++) {
      if (document.documentElement.dataset.agegoUnlockReady === '1') return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  }

  function ensureGateHidden() {
    injectCSS();
    ['#age_gate_overlay', '#age_gate_home', '#age-gate-visitor-text', '#av-choices'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.style.setProperty('pointer-events', 'none', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('max-height', '0', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
    });
    if (document.body.classList.contains('age-gate--shown')) {
      document.body.classList.remove('age-gate--shown');
    }
  }

  function startGateObserver() {
    if (window.__agegoGateObserver) return;
    window.__agegoGateObserver = true;

    const observer = new MutationObserver(() => {
      if (document.getElementById('age_gate_overlay') || document.getElementById('age-gate-visitor-text')) {
        ensureGateHidden();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    ensureGateHidden();
  }

  function unlockChaturbateStream(roomSlug) {
    if (!roomSlug || !autoEnabled) return Promise.resolve(false);
    if (window.__agegoChaturbateStreamLoading === roomSlug) return Promise.resolve(false);

    window.__agegoChaturbateStreamLoading = roomSlug;

    return waitForPageScript().then((ready) => {
      if (!ready) {
        showToast('Script page non charge');
        window.__agegoChaturbateStreamLoading = null;
        return false;
      }

      return new Promise((resolve) => {
        const reqId = Math.random().toString(36).slice(2);
        const timeout = setTimeout(() => {
          document.removeEventListener('agego-unlock-result', onResult);
          showToast('Timeout stream');
          window.__agegoChaturbateStreamLoading = null;
          resolve(false);
        }, 45000);

        function onResult(event) {
          if (event.detail?.id !== reqId) return;
          clearTimeout(timeout);
          document.removeEventListener('agego-unlock-result', onResult);
          window.__agegoChaturbateStreamLoading = null;

          const result = event.detail?.result || {};
          if (result.ok) {
            showToast('Live : ' + roomSlug);
            document.getElementById('agego-live-overlay')?.scrollIntoView({ block: 'nearest' });
            lastCleanup = Date.now();
            resolve(true);
          } else {
            showToast(
              result.reason === 'no url'
                ? 'Hors ligne : ' + roomSlug
                : 'Stream indisponible'
            );
            resolve(false);
          }
        }

        document.addEventListener('agego-unlock-result', onResult);
        document.dispatchEvent(
          new CustomEvent('agego-unlock-stream', { detail: { slug: roomSlug, id: reqId } })
        );
      });
    });
  }

  function handleRoomAction(event) {
    const link = event.target.closest && event.target.closest('a.RoomCardThumbnail');
    if (!link) return false;

    const slug = getSlugFromLink(link);
    if (!slug) return false;

    // Le script de page (chaturbate-page.js) gere le clic et le live.
    injectPageUnlock();
    return true;
  }

  function fixThumbnails() {
    if (!autoEnabled) return 0;
    let count = 0;
    document.querySelectorAll('img[src*="/ribw/"]').forEach((img) => {
      const wide = img.dataset.wideImage === 'true';
      const next = img.src.replace('/ribw/', wide ? '/riw/' : '/ri/');
      if (next === img.src) return;
      img.src = next;
      count++;
    });
    if (count) lastCleanup = Date.now();
    return count;
  }

  function bindRoomClicks() {
    if (clicksBound) return;
    clicksBound = true;

    ['pointerdown', 'mousedown', 'click'].forEach((type) => {
      document.addEventListener(type, (event) => handleRoomAction(event), true);
    });
  }

  function startThumbObserver() {
    if (thumbObserver) return;

    const root =
      document.getElementById('roomlist_root') ||
      document.getElementById('roomlist_content_wrapper');

    if (!root) return;

    let debounce = null;
    thumbObserver = new MutationObserver((mutations) => {
      const hasRibw = mutations.some(
        (m) =>
          m.type === 'childList' ||
          (m.type === 'attributes' && m.attributeName === 'src' && (m.target.src || '').includes('/ribw/'))
      );
      if (!hasRibw) return;

      clearTimeout(debounce);
      debounce = setTimeout(fixThumbnails, THUMB_DEBOUNCE_MS);
    });

    thumbObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });
  }

  function startThumbs() {
    if (!autoEnabled) return;
    fixThumbnails();
    startThumbObserver();

    if (!thumbTimer) {
      thumbTimer = setInterval(fixThumbnails, THUMB_INTERVAL_MS);
    }
  }

  function initGate() {
    startCustomApp();
    injectCSS();
    injectPageReloadGuard();
    injectPageUnlock();
    startGateObserver();
    bindRoomClicks();
  }

  function initAll() {
    if (started) return;
    started = true;
    initGate();
    startThumbs();

    const nextSlug = getNextRoomSlug();
    if (nextSlug) {
      setTimeout(() => unlockChaturbateStream(nextSlug), 2000);
    }
  }

  function getStatus() {
    const ribw = document.querySelectorAll('img[src*="/ribw/"]').length;
    const overlay = document.getElementById('age_gate_overlay');
    const overlayBlocks =
      overlay &&
      getComputedStyle(overlay).pointerEvents !== 'none' &&
      parseFloat(getComputedStyle(overlay).opacity) > 0.01;

    return {
      hostname: location.hostname,
      autoEnabled,
      watchdogActive: started,
      profiles: ['chaturbate'],
      chaturbateDetected: true,
      threatPresent: ribw > 0 || overlayBlocks,
      lastCleanup,
      videoSfw: false,
      videoBlurred: false,
    };
  }

  function onStorageReady(data) {
    autoEnabled = data.autoEnabled !== false;
    if (autoEnabled) initAll();
  }

  injectCSS();
  initGate();
  setTimeout(startCustomApp, 1000);

  if (api?.storage?.local) {
    api.storage.local.get(['autoEnabled'], onStorageReady);
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes.autoEnabled) return;
      autoEnabled = changes.autoEnabled.newValue !== false;
      if (autoEnabled) {
        initAll();
      } else if (thumbTimer) {
        clearInterval(thumbTimer);
        thumbTimer = null;
        started = false;
      }
    });
  } else {
    initAll();
  }

  if (api?.runtime?.onMessage) {
    api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'getStatus') {
        sendResponse(getStatus());
        return false;
      }
      if (message.action === 'setAutoEnabled') {
        autoEnabled = message.enabled !== false;
        if (api.storage?.local) api.storage.local.set({ autoEnabled });
        if (autoEnabled) initAll();
        sendResponse(getStatus());
        return false;
      }
      if (message.action === 'forceCleanup') {
        injectCSS();
        fixThumbnails();
        const slug = getNextRoomSlug();
        if (slug) unlockChaturbateStream(slug);
        sendResponse(getStatus());
        return false;
      }
      return false;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }
})();
