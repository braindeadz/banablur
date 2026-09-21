(function () {
  'use strict';

  const CSS_ID = 'banablur-override';
  const THUMB_INTERVAL_MS = 2500;
  const THUMB_DEBOUNCE_MS = 200;
  const RELOAD_COOLDOWN_MS = 4000;

  const RESERVED_SLUGS = new Set([
    'b', 'female', 'male', 'couple', 'trans', 'tags', 'accounts', 'auth', 'chat',
    'discover', 'contest', 'apps', 'help', 'legal', 'affiliates', 'api', 'static',
    'followed-cams', 'trending', 'about', 'terms', 'privacy', 'security',
    'billingsupport', 'community', 'v2app',
  ]);

  const ENTRANCE_TERMS_SELECTORS = [
    '#entrance_terms_overlay',
    '#entrance_terms',
    '.entrance_terms_overlay',
  ];

  const GATE_HIDE_SELECTORS = [
    '#age_gate_overlay',
    '#age_gate_home',
    '#age-gate-visitor-text',
    '#av-choices',
    ...ENTRANCE_TERMS_SELECTORS,
  ];

  const GATE_CSS = `
#age_gate_overlay, #age_gate_home, #age_gate_overlay *,
#entrance_terms_overlay, #entrance_terms, .entrance_terms_overlay, #entrance_terms_overlay *,
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
#age_gate_overlay, #age_gate_home, #entrance_terms_overlay, .entrance_terms_overlay {
  z-index: -1 !important;
  max-height: 0 !important;
  max-width: 0 !important;
  width: 0 !important;
  height: 0 !important;
}
body.age-gate--shown,
html:has(#entrance_terms_overlay),
body:has(#entrance_terms_overlay),
html:has(.entrance_terms_overlay),
body:has(.entrance_terms_overlay) {
  overflow: auto !important;
}
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
    if (parts.length === 1 && !RESERVED_SLUGS.has(parts[0])) {
      return parts[0];
    }
    return null;
  }

  function getRoomSlugFromPath() {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length !== 1 || RESERVED_SLUGS.has(parts[0])) return null;
    return parts[0];
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

  function hasEntranceTermsOverlay() {
    return ENTRANCE_TERMS_SELECTORS.some((sel) => document.querySelector(sel));
  }

  function clickEntranceTermsAgree() {
    const root =
      document.getElementById('entrance_terms_overlay') ||
      document.querySelector('.entrance_terms_overlay');
    if (!root) return false;

    const agreePattern = /\b(I\s+Agree|I\s+am\s+over\s+18|J['']accepte|J['']ai\s+plus\s+de\s+18)\b/i;
    const candidates = root.querySelectorAll(
      'button, a, input[type="button"], input[type="submit"], [role="button"]'
    );

    for (const el of candidates) {
      const text = (el.textContent || el.value || '').trim();
      if (!agreePattern.test(text)) continue;
      try {
        el.click();
        return true;
      } catch (_e) {
        /* next */
      }
    }
    return false;
  }

  function ensureGateHidden() {
    injectCSS();
    clickEntranceTermsAgree();

    GATE_HIDE_SELECTORS.forEach((sel) => {
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

    if (hasEntranceTermsOverlay()) {
      document.body.style.setProperty('overflow', 'auto', 'important');
      document.documentElement.style.setProperty('overflow', 'auto', 'important');
    } else {
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
    }
  }

  function startGateObserver() {
    if (window.__agegoGateObserver) return;
    window.__agegoGateObserver = true;

    const observer = new MutationObserver(() => {
      if (
        document.getElementById('age_gate_overlay') ||
        document.getElementById('age-gate-visitor-text') ||
        hasEntranceTermsOverlay()
      ) {
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
    injectCSS();
    injectPageReloadGuard();
    injectPageUnlock();
    startGateObserver();
  }

  function initAll() {
    if (started) return;
    started = true;
    initGate();
    startThumbs();

    const roomSlug = getNextRoomSlug() || getRoomSlugFromPath();
    if (roomSlug) {
      setTimeout(() => unlockChaturbateStream(roomSlug), 2000);
    }
  }

  function getStatus() {
    const ribw = document.querySelectorAll('img[src*="/ribw/"]').length;
    const overlay = document.getElementById('age_gate_overlay');
    const overlayBlocks =
      overlay &&
      getComputedStyle(overlay).pointerEvents !== 'none' &&
      parseFloat(getComputedStyle(overlay).opacity) > 0.01;
    const entranceOverlay =
      document.getElementById('entrance_terms_overlay') ||
      document.querySelector('.entrance_terms_overlay');
    const entranceBlocks =
      entranceOverlay &&
      getComputedStyle(entranceOverlay).pointerEvents !== 'none' &&
      parseFloat(getComputedStyle(entranceOverlay).opacity) > 0.01;

    return {
      hostname: location.hostname,
      autoEnabled,
      watchdogActive: started,
      profiles: ['chaturbate'],
      chaturbateDetected: true,
      threatPresent: ribw > 0 || overlayBlocks || entranceBlocks,
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
        const slug = getNextRoomSlug() || getRoomSlugFromPath();
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
