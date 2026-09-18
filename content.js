(function () {
  'use strict';

  const CSS_ID = 'banablur-override';
  const DEBOUNCE_MS = 50;
  const FALLBACK_INTERVAL_MS = 500;

  const SITE_PROFILES = {
    'deviants.com': ['agego'],
    'www.deviants.com': ['agego'],
    'xvideos.com': ['xvideos', 'agego'],
    'www.xvideos.com': ['xvideos', 'agego'],
    'xnxx.com': ['xvideos', 'agego'],
    'www.xnxx.com': ['xvideos', 'agego'],
    'xhamster.com': ['xhamster'],
    'www.xhamster.com': ['xhamster'],
    'fra.xhamster.com': ['xhamster'],
    'xhamsterlive.com': ['xhamsterlive'],
    'www.xhamsterlive.com': ['xhamsterlive'],
    'faphouse.com': ['faphouse'],
    'www.faphouse.com': ['faphouse'],
    'chaturbate.com': ['chaturbate'],
    'www.chaturbate.com': ['chaturbate'],
    'pornhub.com': ['pornhub'],
    'www.pornhub.com': ['pornhub'],
    'fr.pornhub.com': ['pornhub'],
    'lebon.porn': ['lebonporn'],
    'www.lebon.porn': ['lebonporn'],
    'videos.lebon.porn': ['lebonporn'],
    'tukif.porn': ['tukif'],
    'www.tukif.porn': ['tukif'],
    'videos.tukif.porn': ['tukif'],
  };

  const OVERRIDE_CSS = `
/* AgeGO */
.agego-blur-content > :not(#agego-overlay-container) { filter: none !important; }
.agego-blur-content { overflow: auto !important; }
#agego-overlay-container, #agego-overlay { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html.agego-lock body { overflow: auto !important; height: auto !important; }

/* XVIDEOS */
#disclaimer_background, .disclaimer-background, #disclaimer_message { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html.disclaimer-opened, html.disclaimer-opened body { overflow: auto !important; height: auto !important; position: static !important; }
html.img-blured img, html.img-blured video, img[style*="blur"], .thumb img, .mozaique img, .thumb-related-exo img, .thumb-block img { filter: none !important; box-shadow: none !important; }
#html5video video, #video-player-bg video, #hlsplayer video { filter: none !important; box-shadow: none !important; }
.sfw-blur, .sfw-click-area, .sfw-click, .sfw-playlocked .sfw-blur { display: none !important; filter: none !important; backdrop-filter: none !important; pointer-events: none !important; }
.sfw-playlocked .video-pic img, #hlsplayer .video-pic img, .video-pic img { filter: none !important; box-shadow: none !important; }
#html5video .video-click-handler, #hlsplayer .video-click-handler { pointer-events: none !important; }
.ban.has-banner, .quickies__player-bg--blur { filter: none !important; }

/* XHAMSTER */
:root { --xh-av-blur-value: 0px !important; }
.xp-sfw, .xp-sfw__background, .xp-sfw__content, .xp-sfw__verify { display: none !important; pointer-events: none !important; visibility: hidden !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
aside.root-3b979, .root-3b979.desktop-3b979 { display: none !important; pointer-events: none !important; visibility: hidden !important; }
.xh-helper-blurred-background, .xh-helper-blurred-iframe iframe, .xh-thumb-disabled img, .xh-thumb-disabled video { filter: none !important; }
.xh-helper-blurred-overlay::after, .xh-helper-18-plus::after, .xh-helper-18-plus-big::after { content: none !important; display: none !important; backdrop-filter: none !important; }
.video-preview.blurred, .replacement-template.blurred, .thumb-8dafc, [class*="blurred"] { filter: none !important; }
.mn-thumb__hls-wrapper, .xh-helper-blurred-overlay { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; filter: none !important; }
#xplayer__video, .player-container video, .player-container__player video, #xplayer, .player-container, .player-container__player, .xplayer { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
.cookies-announce, .cookie-banner, .cookies-modal, .dialog-cookies, [class*="cookie-banner"], [class*="CookieBanner"], [class*="cookies-dialog"], [class*="consent-dialog"] { display: none !important; visibility: hidden !important; pointer-events: none !important; }
.xp-sfw, .xp-sfw__background, .xp-sfw__content, .xp-sfw__verify { display: none !important; pointer-events: none !important; visibility: hidden !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }

/* XHAMSTER LIVE */
.non-nude-shutter-background, .non-nude-shutter-profile, .ViewCamShutterWrapper, .ViewCamAvp, [class*="non-nude-shutter"] { display: none !important; pointer-events: none !important; visibility: hidden !important; }
.video-element, .video-element-wrapper-blur, .video-element-wrapper--avp-blurred, .with-blur { filter: none !important; }
img.image-background { filter: none !important; }

/* FAPHOUSE */
#cookie-wall, .aged-enough#cookie-wall, .fh-bottom-sticky-banner__container, .manage-cookie-sticky-banner { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html.aged-enough, body.aged-enough { overflow: auto !important; }
.modal-bg, .modal.modal__dark { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* CHATURBATE */
#age_gate_overlay, #age_gate_home, #age-gate-header, #age-gate-verify, #age-gate-account,
#age-gate-visitor-text, #age-gate-timing-sentence, #age-gate-tool-tip-icon, #age-gate-tool-tip-text,
#age-key-div, #age-key-option, .multi-av, .age-gate-tooltip {
  display: none !important; pointer-events: none !important; visibility: hidden !important; z-index: -1 !important;
}
body.age-gate--shown { overflow: auto !important; }
body.age-gate--shown > *:not(#age_gate_overlay):not(#age_gate_home):not(script):not(style) {
  filter: none !important; pointer-events: auto !important;
}
.videoPlayerDiv canvas { filter: none !important; brightness: 1 !important; }
#chatroom_video, #TheaterModePlayer, .videoContainer, .RoomCardThumbnail, .RoomCardThumbnail__image { filter: none !important; }

/* PORNHUB (gate d'age FR) - le mode SFW hardcore reste bloque cote serveur (geo) */
.ageDisclaimer, .modalMTubes.ageDisclaimer, .containerMTubes.ageDisclaimer,
.containerMTubes.ageDisclaimer.isVisibleMTubes, .fadeInMTubes.ageDisclaimer { display: none !important; pointer-events: none !important; visibility: hidden !important; }
body.isOpenMTubes { overflow: auto !important; }

/* LEBON.PORN (AgeVerif / mrx) */
#adult-popup, #adult-popup-backdrop { display: none !important; pointer-events: none !important; visibility: hidden !important; }
.mrx-blur, .mrx-blur-20, #ewok-iframe, iframe[src*="videos.lebon.porn"] { filter: none !important; }
.mrx-overlay, .mrx-click-overlay, .mrx-player-blur-overlay, .mrx-blur-overlay { display: none !important; pointer-events: none !important; visibility: hidden !important; }
img.video-img[data-type="nsfw"] { display: block !important; filter: none !important; visibility: visible !important; }
img.video-img[data-type="sfw"] { display: none !important; }

/* TUKIF.PORN (AgeVerif / TKN) */
.disclaimer_parent_wrapper, .sfw_disclaimer_wrapper, .disclaimer_overlay, #preview_disclaimer_parent_wrapper, .agechecker, .sfw_video_poster, .img_18plus_wrapper, .blursfw_poster, iframe[src*="ageverif"], #ageverif, .ageverif { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html.img-blured img, html.img-blured video, html.img-blured iframe, .img-blured, .img-blured-small, .main_wrapper.img-blured, .video_iframe_container, iframe[src*="videos.tukif.porn"] { filter: none !important; }
.blurmyass, .img_18plus, .video_action_buttons .main_video_page_buttons { display: none !important; pointer-events: none !important; visibility: hidden !important; }
`.trim();

  const api = typeof chrome !== 'undefined' ? chrome : typeof browser !== 'undefined' ? browser : null;

  let autoEnabled = true;
  let watchdogActive = false;
  let observer = null;
  let fallbackInterval = null;
  let debounceTimer = null;
  let lastCleanup = null;
  let activeProfiles = [];
  let chaturbateTickTimer = null;
  let chaturbateObserver = null;
  let chaturbateBusy = false;
  let xvideosTickTimer = null;
  let xhamsterTickTimer = null;
  let lebonpornTickTimer = null;
  let tukifTickTimer = null;
  let xhProxyEnsured = false;

  function ensureXhamsterProxy() {
    if (xhProxyEnsured || !isXhamsterHost() || !api?.runtime?.sendMessage) return;
    xhProxyEnsured = true;
    try { api.runtime.sendMessage({ action: 'proxy:ensure' }, () => { void api.runtime.lastError; }); } catch (_e) {}
  }

  function getHostname() {
    return location.hostname;
  }

  function isXvideosHost() {
    return /(^|\.)(xvideos|xnxx)\.com$/i.test(getHostname());
  }

  function isXvideosVideoPath() {
    return /\/video[.-][\w]+/i.test(location.pathname);
  }

  function isXhamsterHost() {
    return /(^|\.)xhamster\.com$/i.test(getHostname());
  }

  function isXhamsterLiveHost() {
    return /(^|\.)xhamsterlive\.com$/i.test(getHostname());
  }

  function isFaphouseHost() {
    return /(^|\.)faphouse\.com$/i.test(getHostname());
  }

  function isChaturbateHost() {
    return /(^|\.)chaturbate\.com$/i.test(getHostname());
  }

  function isPornhubHost() {
    return /(^|\.)pornhub\.com$/i.test(getHostname());
  }

  function isLebonpornHost() {
    return /(^|\.)lebon\.porn$/i.test(getHostname());
  }

  function isTukifHost() {
    return /(^|\.)tukif\.porn$/i.test(getHostname());
  }

  function getConfiguredProfiles() {
    return SITE_PROFILES[getHostname()] || [];
  }

  function detectAgeGO() {
    return !!(
      document.getElementById('agego-overlay-container') ||
      document.getElementById('agego-overlay') ||
      document.body?.classList.contains('agego-blur-content') ||
      document.documentElement.classList.contains('agego-lock') ||
      typeof window.AGEGO !== 'undefined' ||
      document.querySelector('script[src*="verifycdn.agego.com"]') ||
      document.querySelector('script[src*="agego"]')
    );
  }

  function detectXvideos() {
    if (isXvideosHost()) return true;
    return !!(
      document.getElementById('disclaimer_background') ||
      document.querySelector('.disclaimer-background') ||
      document.documentElement.classList.contains('img-blured') ||
      document.documentElement.classList.contains('disclaimer-opened') ||
      document.querySelector('.sfw-blur') ||
      document.querySelector('.sfw-playlocked') ||
      document.querySelector('.sfw-click-area') ||
      document.querySelector('#html5video video[style*="blur"]')
    );
  }

  function detectXhamster() {
    if (isXhamsterHost()) return true;
    return !!(
      document.querySelector('.xp-sfw') ||
      document.querySelector('.xh-helper-18-plus') ||
      document.querySelector('.xh-helper-blurred-background') ||
      document.querySelector('.xh-helper-blurred-overlay') ||
      document.querySelector('aside.root-3b979')
    );
  }

  function detectXhamsterLive() {
    if (isXhamsterLiveHost()) return true;
    return !!(
      document.querySelector('.non-nude-shutter-background') ||
      document.querySelector('.ViewCamShutterWrapper') ||
      document.querySelector('.video-element-wrapper--avp-blurred') ||
      document.querySelector('img[src*="snapshot_blurred"]')
    );
  }

  function detectFaphouse() {
    if (isFaphouseHost()) return true;
    return !!(
      document.getElementById('cookie-wall') ||
      document.getElementById('cwc-accept') ||
      document.querySelector('.manage-cookie-sticky-banner') ||
      document.querySelector('[data-el="AcceptCookies"]') ||
      document.querySelector('.modal.modal__dark')
    );
  }

  function detectChaturbate() {
    if (isChaturbateHost()) return true;
    return !!(
      document.getElementById('age_gate_overlay') ||
      document.getElementById('age_gate_home') ||
      document.body?.classList.contains('age-gate--shown') ||
      document.getElementById('age-gate-verify')
    );
  }

  function detectPornhub() {
    if (isPornhubHost()) return true;
    return !!(
      document.querySelector('.ageDisclaimer') ||
      document.body?.classList.contains('sfw-page') ||
      document.querySelector('.buttonOver18')
    );
  }

  function detectLebonporn() {
    if (isLebonpornHost()) return true;
    return !!(
      document.getElementById('ewok-iframe') ||
      document.querySelector('.mrx-blur') ||
      document.getElementById('adult-popup') ||
      document.querySelector('script[src*="ageverif-for-mrx"]') ||
      document.querySelector('script[src*="ageverif.com"]')
    );
  }

  function detectTukif() {
    if (isTukifHost()) return true;
    return !!(
      document.querySelector('iframe[src*="videos.tukif.porn"]') ||
      document.querySelector('.sfw_disclaimer_wrapper') ||
      document.querySelector('.disclaimer_parent_wrapper') ||
      document.querySelector('.blurmyass') ||
      document.querySelector('script[src*="tkn_disclaimer"]')
    );
  }

  function detectProfiles() {
    const profiles = new Set(getConfiguredProfiles());
    if (detectAgeGO()) profiles.add('agego');
    if (detectXvideos()) profiles.add('xvideos');
    if (detectXhamster()) profiles.add('xhamster');
    if (detectXhamsterLive()) profiles.add('xhamsterlive');
    if (detectFaphouse()) profiles.add('faphouse');
    if (detectChaturbate()) profiles.add('chaturbate');
    if (detectPornhub()) profiles.add('pornhub');
    if (detectLebonporn()) profiles.add('lebonporn');
    if (detectTukif()) profiles.add('tukif');
    return [...profiles];
  }

  function getMainVideo() {
    return document.querySelector(
      '#html5video video, #video-player-bg video, .xplayer video, .player-container__player video, #chatroom_video video, #TheaterModePlayer video, #chat_video, video'
    );
  }

  function hasAgeGOThreat() {
    return !!(
      document.getElementById('agego-overlay-container') ||
      document.getElementById('agego-overlay') ||
      document.body?.classList.contains('agego-blur-content') ||
      document.documentElement.classList.contains('agego-lock')
    );
  }

  function hasXvideosThreat() {
    const video = getMainVideo();
    const videoBlurred =
      video &&
      ((video.getAttribute('style') || '').includes('blur') ||
        getComputedStyle(video).filter.includes('blur') ||
        (video.currentSrc || '').includes('video_sfw'));

    return !!(
      document.getElementById('disclaimer_background') ||
      document.querySelector('.disclaimer-background') ||
      document.documentElement.classList.contains('img-blured') ||
      document.documentElement.classList.contains('disclaimer-opened') ||
      document.querySelector('.sfw-blur') ||
      document.querySelector('.sfw-playlocked') ||
      document.querySelector('.sfw-click-area') ||
      document.querySelector('img[style*="blur"]') ||
      hasXvideosBlurredThumb() ||
      videoBlurred
    );
  }

  function hasXvideosBlurredThumb() {
    return [...document.querySelectorAll('img')].some((img) => {
      const style = img.getAttribute('style') || '';
      return style.includes('blur') || getComputedStyle(img).filter.includes('blur');
    });
  }

  function hasXhamsterThreat() {
    const hasCookieBanner = [...document.querySelectorAll('button')].some((btn) =>
      /accept all cookies/i.test((btn.textContent || '').trim())
    );

    return !!(
      document.querySelector('.xp-sfw') ||
      document.querySelector('.xh-helper-blurred-background') ||
      document.querySelector('.xh-helper-blurred-overlay') ||
      document.querySelector('aside.root-3b979') ||
      document.querySelector('.xh-helper-18-plus') ||
      document.querySelector('.xh-helper-18-plus-big') ||
      hasCookieBanner
    );
  }

  function hasXhamsterLiveThreat() {
    const video = getMainVideo();
    const videoBlurred =
      video &&
      ((video.getAttribute('style') || '').includes('blur') ||
        getComputedStyle(video).filter.includes('blur'));

    return !!(
      document.querySelector('.non-nude-shutter-background') ||
      document.querySelector('.ViewCamShutterWrapper') ||
      document.querySelector('.video-element-wrapper--avp-blurred') ||
      document.querySelector('img[src*="snapshot_blurred"]') ||
      videoBlurred
    );
  }

  function hasFaphouseThreat() {
    const hasCookieUi =
      !!document.getElementById('cookie-wall') ||
      !!document.getElementById('cwc-accept') ||
      !!document.querySelector('.manage-cookie-sticky-banner') ||
      !!document.querySelector('[data-el="AcceptCookies"]') ||
      [...document.querySelectorAll('button, [data-el], div')].some((el) =>
        /accept all cookies/i.test((el.textContent || '').trim())
      );

    const hasAgeOverlay = [...document.querySelectorAll('*')].some((el) => {
      const text = (el.textContent || '').trim();
      return (
        (text.includes('Verify your age') ||
          text.includes('Verify you age') ||
          text.includes('Start verification') ||
          text.includes('Locked due to age restriction') ||
          text.includes('I\'M OVER 18')) &&
        el.offsetWidth > 200 &&
        el.offsetHeight > 100 &&
        el.querySelector('button, a, [data-el], .fh-button')
      );
    });

    return !!(hasCookieUi || hasAgeOverlay || document.querySelector('.modal.modal__dark'));
  }

  function hasChaturbateThreat() {
    return !!document.querySelector('img[src*="/ribw/"], img[src*="thumb.live.mmcdn.com/ribw/"]');
  }

  function hasChaturbateThreatForStatus() {
    const overlay = document.getElementById('age_gate_overlay');
    const overlayBlocks =
      overlay &&
      getComputedStyle(overlay).display !== 'none' &&
      getComputedStyle(overlay).pointerEvents !== 'none';
    return !!(overlayBlocks || document.body?.classList.contains('age-gate--shown') || hasChaturbateThreat());
  }

  function hasLebonpornThreat() {
    const popup = document.getElementById('adult-popup');
    const popupVisible = popup && getComputedStyle(popup).display !== 'none';
    return !!(
      popupVisible ||
      document.querySelector('.mrx-overlay') ||
      document.querySelector('.mrx-click-overlay') ||
      document.querySelector('.mrx-player-blur-overlay') ||
      document.querySelector('img.mrx-blur') ||
      document.querySelector('iframe.mrx-blur-20')
    );
  }

  function hasTukifThreat() {
    const overlayVisible = (sel) => {
      const el = document.querySelector(sel);
      return el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
    };
    const agechecker = document.querySelector('.agechecker');
    const agecheckerVisible =
      agechecker &&
      getComputedStyle(agechecker).display !== 'none' &&
      getComputedStyle(agechecker).visibility !== 'hidden';
    const blurmyass = document.querySelector('.blurmyass');
    const blurmyassVisible =
      blurmyass &&
      getComputedStyle(blurmyass).display !== 'none' &&
      getComputedStyle(blurmyass).visibility !== 'hidden';
    return !!(
      overlayVisible('.disclaimer_parent_wrapper') ||
      overlayVisible('.sfw_disclaimer_wrapper') ||
      agecheckerVisible ||
      document.querySelector('.main_wrapper.img-blured') ||
      blurmyassVisible
    );
  }

  function hasThreat() {
    return (
      hasAgeGOThreat() ||
      hasXvideosThreat() ||
      hasXhamsterThreat() ||
      hasXhamsterLiveThreat() ||
      hasFaphouseThreat() ||
      hasChaturbateThreat() ||
      hasLebonpornThreat() ||
      hasTukifThreat()
    );
  }

  function debloatAgeGO() {
    document.documentElement.classList.remove('agego-lock');
    document.body?.classList.remove('agego-blur-content');
    document.getElementById('agego-overlay-container')?.remove();
    document.getElementById('agego-overlay')?.remove();
  }

  function fixXvideosThumbnails() {
    // Defloutage EN PLACE uniquement (jamais de suppression de noeud): retirer des
    // .video-pic en boucle raccourcissait la page et renvoyait le scroll en haut.
    document.querySelectorAll('img').forEach((img) => {
      const style = img.getAttribute('style') || '';
      const blurred = style.includes('blur') || getComputedStyle(img).filter.includes('blur');
      if (!blurred) return;
      img.style.setProperty('filter', 'none', 'important');
      img.style.setProperty('box-shadow', 'none', 'important');
    });
  }

  function clearXvideosPlayerBlockers() {
    // Non destructif: masquage (display:none) plutot que remove(), et poster limite
    // au lecteur, pour ne pas modifier la hauteur de page (cause du saut de scroll).
    document.querySelectorAll('.sfw-blur, .sfw-click-area, .sfw-click').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });
    document.querySelectorAll('.sfw-playlocked').forEach((el) => {
      el.classList.remove('sfw-playlocked', 'sfw-click');
      el.style.removeProperty('filter');
    });
    document.querySelectorAll('#hlsplayer .video-pic, #html5video .video-pic').forEach((el) => {
      const img = el.querySelector('img');
      if (!img) return;
      const blurred =
        (img.getAttribute('style') || '').includes('blur') ||
        getComputedStyle(img).filter.includes('blur');
      if (blurred) el.style.setProperty('display', 'none', 'important');
    });
    document.querySelectorAll('.video-click-handler').forEach((el) => {
      el.style.setProperty('pointer-events', 'none', 'important');
    });
  }

  function startXvideosWatchdog() {
    if (xvideosTickTimer || !isXvideosHost()) return;

    xvideosTickTimer = setInterval(() => {
      if (!autoEnabled || !watchdogActive) return;
      fixXvideosThumbnails();
      if (isXvideosVideoPath()) {
        injectXvideosPageScript();
        // Une fois l'unlock reussi (flag pose par xvideos-page.js), on cesse de
        // redemander l'unlock: cela evite la re-init en boucle du lecteur qui
        // provoquait l'ecran noir et le saut de scroll.
        if (document.documentElement.dataset.agegoXvDone !== '1') {
          document.dispatchEvent(new CustomEvent('agego-xv-unlock'));
        }
      }
    }, 500);
  }

  function startXhamsterWatchdog() {
    if (xhamsterTickTimer || !isXhamsterHost()) return;

    xhamsterTickTimer = setInterval(() => {
      if (!autoEnabled || !watchdogActive) return;
      injectXhamsterPageScript();
      document.dispatchEvent(new CustomEvent('agego-xh-unlock'));
      hideXhamsterCookieModal();
      document.querySelectorAll('.xp-sfw, .xp-sfw__background, .xp-sfw__content').forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
      });
    }, 500);
  }

  function hideXhamsterCookieModal() {
    const btn = [...document.querySelectorAll('button, a[role="button"], [role="button"]')].find((b) =>
      /accept all cookies|tout accepter|accepter tout|j'?accepte/i.test((b.textContent || '').trim())
    );
    if (btn) { try { btn.click(); } catch (_e) {} }
    // Ciblage strict: uniquement les vraies modales cookies (pas un wrapper de page
    // qui mentionne "cookies" dans le footer).
    const selectors = [
      '.cookies-announce', '.cookie-banner', '.cookies-modal', '.dialog-cookies',
      '[data-role="cookies-dialog"]', '[class*="CookieBanner"]', '[class*="cookies-dialog"]',
      '[class*="consent-dialog"]',
    ];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      });
    });
    [...document.querySelectorAll('[role="dialog"], .modal, .dialog-wrapper')].forEach((el) => {
      if (el.id === 'agego-dl-btn' || el.id === 'agego-dl-menu') return;
      const t = (el.textContent || '').slice(0, 800);
      if (!/cookie|consent|tout accepter|accept all/i.test(t)) return;
      if (!el.querySelector('button')) return;
      const st = getComputedStyle(el);
      if (st.position !== 'fixed' && st.position !== 'absolute') return;
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
    });
  }

  function getXvideosVideoId() {
    const html = document.documentElement.innerHTML;
    const hp = window.html5player;
    if (hp) {
      const fromPlayer = hp.id_video || hp.iVideoId || hp.video_id;
      if (fromPlayer) return String(fromPlayer);
    }
    const patterns = [
      /"id"\s*:\s*(\d+)\s*,\s*"issfw"/,
      /id_video["'\s:=]+(\d+)/,
      /embedframe\/(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return match[1];
    }
    return null;
  }

  async function fetchXvideosUrls(id) {
    if (!id) return null;
    try {
      const response = await fetch(`/embedframe/${id}`, { credentials: 'include' });
      if (!response.ok) return null;
      const html = await response.text();
      const high = html.match(/setVideoUrlHigh\('([^']+)'\)/)?.[1] || null;
      const low = html.match(/setVideoUrlLow\('([^']+)'\)/)?.[1] || null;
      const hls = html.match(/setVideoHLS\('([^']+)'\)/)?.[1] || null;
      if (!high && !low && !hls) return null;
      return { high, low, hls };
    } catch (_err) {
      return null;
    }
  }

  // Relais telechargement: le bouton (monde page) demande un download; le MP4
  // est sur un CDN cross-origin (attribut download ignore), on passe donc par
  // l'API chrome.downloads via le service worker.
  document.addEventListener('agego-xv-download', (event) => {
    const detail = event.detail || {};
    if (!detail.url || !api?.runtime?.sendMessage) return;
    api.runtime.sendMessage({ action: 'download', url: detail.url, filename: detail.filename });
  });

  // Relais embedframe: le script page (monde isole) demande un fetch proxifie
  // quand le fetch same-origin ne renvoie que du SFW ou pas de HLS.
  document.addEventListener('agego-xv-embedframe', (event) => {
    if (!isXvideosHost() || !api?.runtime?.sendMessage) return;
    const detail = event.detail || {};
    const { key, origin, reqId } = detail;
    if (!key) return;
    api.runtime.sendMessage({ action: 'xv:embedframe', key, origin }, (resp) => {
      void api.runtime.lastError;
      document.dispatchEvent(
        new CustomEvent('agego-xv-embedframe-result', { detail: { reqId, ...(resp || {}) } })
      );
    });
  });

  // Cascade proxy xHamster: xhamster-page.js (monde page) signale l'etat SFW.
  // Si SFW (proxy tombe / exit FR), on demande au service worker de basculer sur
  // le proxy suivant puis on recharge. Compteur anti-boucle (sessionStorage) pour
  // ne pas boucler si tous les proxys echouent -> on laisse la page (floutee mais
  // fonctionnelle) au-dela de XH_PROXY_MAX tentatives. Reset quand un flux clair
  // est obtenu.
  const XH_PROXY_MAX = 6;
  document.addEventListener('agego-xh-proxy-state', (event) => {
    if (!isXhamsterHost() || !api?.runtime?.sendMessage) return;
    const sfw = !!(event.detail && event.detail.sfw);
    if (!sfw) {
      try { sessionStorage.removeItem('agegoXhProxyAttempts'); } catch (_e) {}
      return;
    }
    let attempts = 0;
    try { attempts = parseInt(sessionStorage.getItem('agegoXhProxyAttempts') || '0', 10) || 0; } catch (_e) {}
    if (attempts >= XH_PROXY_MAX) return;
    try { sessionStorage.setItem('agegoXhProxyAttempts', String(attempts + 1)); } catch (_e) {}
    api.runtime.sendMessage({ action: 'proxy:rotate' }, (resp) => {
      void api.runtime.lastError;
      if (!resp || resp.ok !== true) return; // proxy desactive -> pas de reload
      setTimeout(() => { try { location.reload(); } catch (_e) {} }, 400);
    });
  });

  function injectXvideosPageScript() {
    if (document.documentElement.dataset.agegoXvInjected === '1') return;
    if (!api?.runtime?.getURL) return;
    document.documentElement.dataset.agegoXvInjected = '1';
    const script = document.createElement('script');
    script.src = api.runtime.getURL('xvideos-page.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  function cleanXvideos() {
    // Cliquer le vrai bouton "Enter" AVANT de supprimer l'overlay: son handler
    // (fonction interne du site) stoppe le setInterval scrollTo(0,0) qui
    // remonte la page toutes les 2s, et pose le cookie d'age.
    const enterBtn = document.querySelector('button.disclaimer-enter');
    if (enterBtn) { try { enterBtn.click(); } catch (_e) {} }
    document.getElementById('disclaimer_background')?.remove();
    document.querySelector('.disclaimer-background')?.remove();
    document.documentElement.classList.remove('disclaimer-opened', 'img-blured');
    clearXvideosPlayerBlockers();
    fixXvideosThumbnails();
    injectXvideosPageScript();
    startXvideosWatchdog();
  }

  function unlockXhamsterStream() {
    const video = getMainVideo();
    if (!video) return;

    const html = document.documentElement.innerHTML;
    const sfwUrl =
      html.match(/https:\/\/[^"'\s]+\/sfw\/720p\.h264\.mp4[^"'\s]*/)?.[0] ||
      html.match(/https:\/\/[^"'\s]+\/sfw\/[^"'\s]+\.m3u8[^"'\s]*/)?.[0];

    if (!sfwUrl) return;

    const hdUrl = sfwUrl.replace('/sfw/', '/');
    const current = video.currentSrc || video.src || '';
    if (!current.includes('/sfw/') && !current.includes('sfw')) return;

    video.src = hdUrl;
    video.load();
  }

  function injectXhamsterPageScript() {
    if (document.documentElement.dataset.agegoXhInjected === '1') return;
    if (!api?.runtime?.getURL) return;
    document.documentElement.dataset.agegoXhInjected = '1';
    const script = document.createElement('script');
    script.src = api.runtime.getURL('xhamster-page.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  function cleanXhamster() {
    // xhamster 2026: le blocage reel est le module runtime window.xplayer.sfw
    // (coupe temporelle) accessible uniquement dans le monde page -> on injecte
    // xhamster-page.js. Les selecteurs CSS ci-dessous restent en filet de
    // securite pour d'eventuelles anciennes pages / variantes regionales.
    injectXhamsterPageScript();
    document.dispatchEvent(new CustomEvent('agego-xh-unlock'));
    startXhamsterWatchdog();
    hideXhamsterCookieModal();

    document.querySelectorAll('.xp-sfw, .xp-sfw__background, .xp-sfw__content').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    });
    document.querySelectorAll('aside.root-3b979, .root-3b979.desktop-3b979').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    });

    document
      .querySelectorAll(
        '.xh-helper-blurred-background, .xh-helper-blurred-overlay, .xh-helper-18-plus, .xh-helper-18-plus-big'
      )
      .forEach((el) => {
        el.classList.remove(
          'xh-helper-blurred-background',
          'xh-helper-blurred-overlay',
          'xh-helper-18-plus',
          'xh-helper-18-plus-big'
        );
        el.style.removeProperty('filter');
      });

    document.querySelectorAll('video, img, iframe').forEach((el) => {
      el.style.removeProperty('filter');
    });

    const acceptBtn = [...document.querySelectorAll('button, a[role="button"]')].find((btn) =>
      /accept all cookies|tout accepter|accepter tout|j'?accepte/i.test((btn.textContent || '').trim())
    );
    if (acceptBtn) {
      acceptBtn.click();
    }
    hideXhamsterCookieModal();

    unlockXhamsterStream();
  }

  function fixXhamsterLiveThumbnails() {
    document.querySelectorAll('img[src*="snapshot_blurred"], img.image-background').forEach((img) => {
      if ((img.src || '').includes('snapshot_blurred')) {
        img.src = img.src.replace('snapshot_blurred', 'snapshot');
      }
      img.style.removeProperty('filter');
    });
  }

  function startCanvasDeblur(video) {
    if (!video || video.dataset.deblurCanvas === '1') return;

    const parent = video.parentElement;
    if (!parent) return;

    video.dataset.deblurCanvas = '1';
    video.style.setProperty('opacity', '0', 'important');

    let canvas = parent.querySelector('#banablur-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'banablur-canvas';
      canvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;z-index:2;pointer-events:none;background:#000;';
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      parent.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    function draw() {
      if (!video.isConnected) return;
      if (video.videoWidth && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      if (video.videoWidth) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch (_err) {
          /* stream not ready */
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  function cleanXhamsterLive() {
    document
      .querySelectorAll(
        '.non-nude-shutter-background, .non-nude-shutter-profile, .ViewCamShutterWrapper, .ViewCamAvp, [class*="non-nude-shutter"]'
      )
      .forEach((el) => el.remove());

    document.querySelectorAll('video.video-element, video').forEach((video) => {
      startCanvasDeblur(video);
    });

    document
      .querySelectorAll('.video-element-wrapper--avp-blurred, .video-element-wrapper-blur, .with-blur')
      .forEach((el) => {
        el.classList.remove('video-element-wrapper--avp-blurred', 'with-blur');
      });

    fixXhamsterLiveThumbnails();

    const acceptBtn = [...document.querySelectorAll('button')].find((btn) =>
      /accept all/i.test((btn.textContent || '').trim())
    );
    if (acceptBtn) acceptBtn.click();

    if (isXhamsterLiveHost() && !window.__agegoDeblurLiveLoop) {
      window.__agegoDeblurLiveLoop = setInterval(() => {
        if (!autoEnabled || !watchdogActive) return;
        document
          .querySelectorAll('.non-nude-shutter-background, .ViewCamShutterWrapper, [class*="non-nude-shutter"]')
          .forEach((el) => el.remove());
        document.querySelectorAll('video.video-element, video').forEach((video) => {
          video.style.setProperty('opacity', '0', 'important');
          if (!video.dataset.deblurCanvas) startCanvasDeblur(video);
        });
        fixXhamsterLiveThumbnails();
      }, 300);
    }
  }

  function cleanFaphouse() {
    document.getElementById('cookie-wall')?.remove();
    document.documentElement.classList.remove('aged-enough');
    document.body?.classList.remove('aged-enough');

    document.getElementById('cwc-accept')?.click();
    document.querySelector('[data-el="AcceptCookies"]')?.click();
    [...document.querySelectorAll('button, [data-el], .fh-button')].find((el) =>
      /accept all cookies/i.test((el.textContent || '').trim())
    )?.click();

    document.querySelector('.fh-bottom-sticky-banner__container')?.remove();
    document.querySelector('.manage-cookie-sticky-banner')?.remove();

    document.querySelector('.modal-bg')?.remove();
    document.querySelectorAll('.modal.modal__dark').forEach((el) => el.remove());

    document.querySelectorAll('*').forEach((el) => {
      const text = (el.textContent || '').trim();
      if (
        (text.includes('Verify your age to access') ||
          text.includes('Verify you age to watch') ||
          text.includes('Start verification')) &&
        el.offsetWidth > 150 &&
        el.offsetHeight > 80 &&
        el.querySelector('button, a, .fh-button')
      ) {
        el.remove();
      }
    });

    document.querySelectorAll('[class*="age-restrict"], [class*="ageRestrict"], [data-el="AgeVerification"]').forEach(
      (el) => el.remove()
    );
  }

  function neutralizeChaturbateAgeGate() {
    /* CSS-only — ne pas toucher au DOM (évite reload loop Chaturbate) */
  }

  function fixChaturbateThumbnails() {
    document
      .querySelectorAll('img.RoomCardThumbnail__image[src*="/ribw/"], img[src*="thumb.live.mmcdn.com/ribw/"]')
      .forEach((img) => {
        const wide = img.dataset.wideImage === 'true';
        const nextSrc = img.src.replace('/ribw/', wide ? '/riw/' : '/ri/');
        if (nextSrc === img.src) return;
        img.src = nextSrc;
      });
  }

  function fixChaturbatePreview() {
    document.querySelectorAll('.videoPlayerDiv canvas').forEach((canvas) => {
      if (canvas.dataset.agegoFixed === '1') return;
      if (!getComputedStyle(canvas).filter.includes('blur')) return;
      canvas.dataset.agegoFixed = '1';
      canvas.style.setProperty('filter', 'none', 'important');
    });
  }

  function getChaturbateRoomSlug() {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 1 && !['b', 'female', 'male', 'couple', 'trans'].includes(parts[0])) {
      return parts[0];
    }
    return null;
  }

  async function unlockChaturbateStream(roomSlug) {
    if (!roomSlug || window.__agegoChaturbateStreamLoading === roomSlug) return;

    window.__agegoChaturbateStreamLoading = roomSlug;

    try {
      const response = await fetch('/get_edge_hls_url_ajax/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: `room_slug=${encodeURIComponent(roomSlug)}`,
      });

      const data = await response.json();
      if (!data?.url) return;

      const playerEl = document.getElementById('chat-player') || document.querySelector('.video-js');
      const player = playerEl && window.videojs ? window.videojs(playerEl.id || playerEl) : null;

      if (player) {
        player.src({ src: data.url, type: 'application/x-mpegURL' });
        player.play()?.catch(() => {});
      } else {
        const video = getMainVideo();
        if (video) {
          video.src = data.url;
          video.load();
          video.play()?.catch(() => {});
        }
      }
    } catch (_err) {
      /* stream fetch failed */
    } finally {
      window.__agegoChaturbateStreamLoading = null;
    }
  }

  function bindChaturbateRoomCards() {
    document.querySelectorAll('.RoomCard:not([data-agego-hover-bound])').forEach((card) => {
      card.dataset.agegoHoverBound = '1';
      card.addEventListener(
        'mouseenter',
        () => {
          const slug = card.querySelector('img.RoomCardThumbnail__image')?.alt;
          if (slug) unlockChaturbateStream(slug);
          fixChaturbatePreview();
        },
        { passive: true }
      );
    });
  }

  function tickChaturbate() {
    if (chaturbateBusy || !autoEnabled) return;
    chaturbateBusy = true;
    try {
      if (document.querySelector('img[src*="/ribw/"]')) fixChaturbateThumbnails();
    } finally {
      chaturbateBusy = false;
    }
  }

  function startChaturbateWatchdog() {
    if (chaturbateTickTimer) return;

    chaturbateTickTimer = setInterval(tickChaturbate, 5000);

    if (chaturbateObserver) return;

    const root =
      document.getElementById('roomlist_root') ||
      document.getElementById('roomlist_content_wrapper');

    if (!root) return;

    let thumbDebounce = null;
    chaturbateObserver = new MutationObserver((mutations) => {
      if (!autoEnabled) return;

      const needsFix = mutations.some(
        (m) =>
          m.type === 'childList' ||
          (m.type === 'attributes' && m.attributeName === 'src' && (m.target.src || '').includes('/ribw/'))
      );

      if (!needsFix) return;

      clearTimeout(thumbDebounce);
      thumbDebounce = setTimeout(() => {
        fixChaturbateThumbnails();
        bindChaturbateRoomCards();
      }, 300);
    });

    chaturbateObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });
  }

  function cleanChaturbate() {
    injectCSS();
    fixChaturbateThumbnails();
    bindChaturbateRoomCards();
    startChaturbateWatchdog();
  }

  function injectPornhubPageScript() {
    if (document.documentElement.dataset.agegoPhInjected === '1') return;
    if (!api?.runtime?.getURL) return;
    document.documentElement.dataset.agegoPhInjected = '1';
    const script = document.createElement('script');
    script.src = api.runtime.getURL('pornhub-page.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  function injectLebonpornPageScript() {
    if (document.documentElement.dataset.agegoLbpInjected === '1') return;
    if (!api?.runtime?.getURL) return;
    document.documentElement.dataset.agegoLbpInjected = '1';
    const script = document.createElement('script');
    const url = api.runtime.getURL('lebonporn-page.js');
    let injected = false;
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      if (xhr.status === 200 || xhr.status === 0) {
        script.textContent = xhr.responseText;
        injected = true;
      }
    } catch (_e) {}
    if (!injected) {
      script.src = url;
      script.onload = () => script.remove();
    }
    (document.head || document.documentElement).appendChild(script);
    if (injected) script.remove();
  }

  function fixLebonpornThumbs() {
    // Defloutage miniatures mrx: restaurer data-src, retirer classes blur/nsfw.
    document.querySelectorAll('img[data-type="nsfw"]').forEach((img) => {
      img.classList.remove('mrx-nsfw', 'mrx-blur');
      img.style.setProperty('filter', 'none', 'important');
      img.style.setProperty('display', 'block', 'important');
      const dataSrc = img.getAttribute('data-src');
      const curSrc = img.getAttribute('src') || '';
      if (dataSrc && (!curSrc || curSrc.startsWith('data:'))) {
        img.src = dataSrc;
      }
    });
    document.querySelectorAll('img.video-img[data-type="sfw"]').forEach((img) => {
      img.classList.add('mrx-nsfw');
      img.style.setProperty('display', 'none', 'important');
    });
    document
      .querySelectorAll('.mrx-overlay, .mrx-click-overlay, .mrx-player-blur-overlay, .mrx-blur-overlay')
      .forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
      });
    document.body?.classList.add('mrx-unblur');
  }

  function dismissLebonpornDisclaimer() {
    // Ne pas cliquer #adult-enter-btn (popunder pub): localStorage + masquage seulement.
    try {
      localStorage.setItem('adultDisclaimer', 'seen');
    } catch (_e) {}
    document.querySelectorAll('#adult-popup, #adult-popup-backdrop').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });
  }

  function releaseLebonpornPlayers() {
    document.querySelectorAll('iframe[id*="ewok-iframe"], iframe[src*="videos.lebon.porn"], iframe[src*="videos.tukif.porn"]').forEach((iframe) => {
      iframe.classList.remove('mrx-blur-20');
      iframe.style.setProperty('filter', 'none', 'important');
      try {
        const win = iframe.contentWindow;
        if (!win) return;
        const payload = { player_mode: 'default', msg_origin: 'ewkplrpmr' };
        const msg = typeof cloneInto === 'function' ? cloneInto(payload, win) : payload;
        win.postMessage(msg, '*');
      } catch (_e) {}
    });
  }

  function startLebonpornWatchdog() {
    if (lebonpornTickTimer || !isLebonpornHost()) return;

    lebonpornTickTimer = setInterval(() => {
      if (!autoEnabled || !watchdogActive) return;
      fixLebonpornThumbs();
      releaseLebonpornPlayers();
      document.dispatchEvent(new CustomEvent('agego-lbp-unlock'));
      injectLebonpornPageScript();
    }, 500);
  }

  function cleanLebonporn() {
    dismissLebonpornDisclaimer();
    fixLebonpornThumbs();
    releaseLebonpornPlayers();
    injectLebonpornPageScript();
    document.dispatchEvent(new CustomEvent('agego-lbp-unlock'));
    startLebonpornWatchdog();
  }

  function dismissTukifDisclaimer() {
    try {
      document.cookie = 'dsclcnst=2; path=/; max-age=31536000';
      document.cookie = 'discl_s_t=1; path=/';
    } catch (_e) {}
    document
      .querySelectorAll(
        '.disclaimer_parent_wrapper, .sfw_disclaimer_wrapper, .disclaimer_overlay, #preview_disclaimer_parent_wrapper, .agechecker, .sfw_video_poster, .img_18plus_wrapper, .blursfw_poster, iframe[src*="ageverif"], #ageverif, .ageverif'
      )
      .forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      });
  }

  function fixTukifBlur() {
    document.documentElement.classList.remove('img-blured', 'img-blured-small');
    document.body?.classList.remove('img-blured', 'img-blured-small');
    document.querySelectorAll('.main_wrapper, .stories_main_wrapper').forEach((el) => {
      el.classList.remove('img-blured', 'img-blured-small');
    });
    document
      .querySelectorAll('.blurmyass, .agechecker, .sfw_video_poster, .img_18plus_wrapper, .blursfw_poster')
      .forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      });
    document
      .querySelectorAll('.video_iframe_container iframe, .video_iframe_container video, .video_iframe_container img, iframe[src*="videos.tukif.porn"]')
      .forEach((el) => {
        el.style.setProperty('filter', 'none', 'important');
      });
  }

  function releaseTukifPlayers() {
    document.querySelectorAll('iframe[src*="videos.tukif.porn"]').forEach((iframe) => {
      iframe.style.setProperty('filter', 'none', 'important');
      try {
        const win = iframe.contentWindow;
        if (!win) return;
        const payloads = [
          { player_mode: 'default', msg_origin: 'ewkplrpmr' },
          { msg_origin: 'ewkplrpmr', msg_text: 'play' },
        ];
        payloads.forEach((payload) => {
          const msg = typeof cloneInto === 'function' ? cloneInto(payload, win) : payload;
          win.postMessage(msg, '*');
        });
      } catch (_e) {}
    });
  }

  function startTukifWatchdog() {
    if (tukifTickTimer || !isTukifHost()) return;

    tukifTickTimer = setInterval(() => {
      if (!autoEnabled || !watchdogActive) return;
      fixTukifBlur();
      releaseTukifPlayers();
      document.dispatchEvent(new CustomEvent('agego-lbp-unlock'));
      injectLebonpornPageScript();
    }, 500);
  }

  function cleanTukif() {
    dismissTukifDisclaimer();
    fixTukifBlur();
    releaseTukifPlayers();
    injectLebonpornPageScript();
    document.dispatchEvent(new CustomEvent('agego-lbp-unlock'));
    startTukifWatchdog();
  }

  function cleanPornhub() {
    // Gate d'age FR: pose des cookies + clique le bouton 18+, puis masque le
    // modal. NB: le catalogue hardcore reste bloque cote serveur (mode SFW geo
    // France, isSfw=1) -> non contournable par une extension (VPN requis).
    try {
      const maxAge = 60 * 60 * 24 * 30;
      document.cookie = `accessAgeDisclaimerPH=2; path=/; max-age=${maxAge}`;
      document.cookie = `accessPH=1; path=/; max-age=${maxAge}`;
      document.cookie = `cookieConsent=3; path=/; max-age=${maxAge}`;
    } catch (_e) {}
    const over18 = document.querySelector('.buttonOver18, .js-closeAgeModal, .js-av-cta');
    if (over18 && over18.offsetParent !== null) { try { over18.click(); } catch (_e) {} }
    document.querySelectorAll('.ageDisclaimer, .modalMTubes.ageDisclaimer').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });
    document.body?.classList.remove('isOpenMTubes');
    injectPornhubPageScript();
    document.dispatchEvent(new CustomEvent('agego-ph-unlock'));
  }

  function runCleanup() {
    const profiles = detectProfiles();
    if (profiles.length === 0 && !getConfiguredProfiles().length) return false;

    activeProfiles = profiles.length ? profiles : getConfiguredProfiles();

    if (activeProfiles.includes('agego')) debloatAgeGO();
    if (activeProfiles.includes('xvideos')) cleanXvideos();
    if (activeProfiles.includes('xhamster')) cleanXhamster();
    if (activeProfiles.includes('xhamsterlive')) cleanXhamsterLive();
    if (activeProfiles.includes('faphouse')) cleanFaphouse();
    if (activeProfiles.includes('chaturbate')) cleanChaturbate();
    if (activeProfiles.includes('pornhub')) cleanPornhub();
    if (activeProfiles.includes('lebonporn')) cleanLebonporn();
    if (activeProfiles.includes('tukif')) cleanTukif();

    lastCleanup = Date.now();
    return true;
  }

  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = OVERRIDE_CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeInjectedCSS() {
    document.getElementById(CSS_ID)?.remove();
  }

  function persistKnownSite() {
    if (!api?.storage?.local) return;
    const hostname = getHostname();
    api.storage.local.get(['knownProtectedSites'], (data) => {
      const known = data.knownProtectedSites || [];
      if (!known.includes(hostname)) {
        api.storage.local.set({ knownProtectedSites: [...known, hostname] });
      }
    });
  }

  function scheduleCleanup() {
    if (isChaturbateHost()) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (autoEnabled && watchdogActive && hasThreat()) {
        runCleanup();
        injectCSS();
      }
    }, DEBOUNCE_MS);
  }

  function startWatchdog() {
    if (observer) return;

    observer = new MutationObserver(() => {
      if (isChaturbateHost()) return;
      if (autoEnabled && watchdogActive) scheduleCleanup();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'src'],
    });

    if (!fallbackInterval) {
      fallbackInterval = setInterval(() => {
        if (isChaturbateHost()) return;
        if (autoEnabled && watchdogActive && hasThreat()) {
          runCleanup();
          injectCSS();
        }
      }, FALLBACK_INTERVAL_MS);
    }
  }

  function shouldActivate(forceDetect) {
    if (forceDetect) return true;
    if (getConfiguredProfiles().length) return true;
    return detectProfiles().length > 0;
  }

  function activateWatchdog(forceDetect) {
    if (!shouldActivate(forceDetect)) return false;

    watchdogActive = true;
    activeProfiles = detectProfiles().length ? detectProfiles() : getConfiguredProfiles();
    persistKnownSite();

    injectCSS();

    if (isChaturbateHost()) {
      cleanChaturbate();
      return true;
    }

    startWatchdog();

    if (autoEnabled) {
      runCleanup();
    }

    if (isXvideosHost()) {
      startXvideosWatchdog();
    }

    if (isXhamsterHost()) {
      ensureXhamsterProxy();
      startXhamsterWatchdog();
    }

    if (isLebonpornHost()) {
      startLebonpornWatchdog();
      if (autoEnabled) cleanLebonporn();
    }

    if (isTukifHost()) {
      startTukifWatchdog();
      if (autoEnabled) cleanTukif();
    }

    return true;
  }

  function deactivateAutoMode() {
    removeInjectedCSS();
  }

  function forceCleanup() {
    activateWatchdog(true);
    runCleanup();
    injectCSS();
    persistKnownSite();

    return {
      success: true,
      profiles: activeProfiles,
      agegoDetected: detectAgeGO(),
      xvideosDetected: detectXvideos(),
      xhamsterDetected: detectXhamster(),
      xhamsterLiveDetected: detectXhamsterLive(),
      faphouseDetected: detectFaphouse(),
      chaturbateDetected: detectChaturbate(),
      lebonpornDetected: detectLebonporn(),
      tukifDetected: detectTukif(),
      threatPresent: isChaturbateHost() ? hasChaturbateThreatForStatus() : hasThreat(),
      watchdogActive,
    };
  }

  function getStatus() {
    activeProfiles = detectProfiles().length ? detectProfiles() : getConfiguredProfiles();
    const video = getMainVideo();
    return {
      hostname: getHostname(),
      autoEnabled,
      watchdogActive,
      profiles: activeProfiles,
      agegoDetected: detectAgeGO(),
      xvideosDetected: detectXvideos(),
      xhamsterDetected: detectXhamster(),
      xhamsterLiveDetected: detectXhamsterLive(),
      faphouseDetected: detectFaphouse(),
      chaturbateDetected: detectChaturbate(),
      lebonpornDetected: detectLebonporn(),
      tukifDetected: detectTukif(),
      threatPresent: isChaturbateHost() ? hasChaturbateThreatForStatus() : hasThreat(),
      lastCleanup,
      videoSfw:
        !!(video?.currentSrc || video?.src || '').includes('video_sfw') ||
        !!(video?.currentSrc || video?.src || '').includes('/sfw/'),
      videoBlurred: !!(video && getComputedStyle(video).filter.includes('blur')),
    };
  }

  function onStorageReady(data) {
    autoEnabled = data.autoEnabled !== false;
    const known = data.knownProtectedSites || data.knownAgeGOSites || [];
    const hostname = getHostname();

    if (getConfiguredProfiles().length || known.includes(hostname)) {
      activateWatchdog(true);
    }
  }

  function tryActivate() {
    if (shouldActivate(false)) activateWatchdog(false);
  }

  function init() {
    if (isChaturbateHost()) {
      injectCSS();
    }

    if (api?.storage?.local) {
      api.storage.local.get(['autoEnabled', 'knownProtectedSites', 'knownAgeGOSites'], onStorageReady);

      api.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local' || !changes.autoEnabled) return;
        autoEnabled = changes.autoEnabled.newValue !== false;

        if (autoEnabled) {
          if (!watchdogActive) activateWatchdog(true);
          runCleanup();
          injectCSS();
        } else {
          deactivateAutoMode();
        }
      });
    } else {
      autoEnabled = true;
      if (getConfiguredProfiles().length) activateWatchdog(true);
    }

    tryActivate();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryActivate, { once: true });
    }

    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive' || document.readyState === 'complete') {
        tryActivate();
        if (isChaturbateHost() && autoEnabled) {
          startChaturbateWatchdog();
          fixChaturbateThumbnails();
          bindChaturbateRoomCards();
        }
        if (isXvideosHost() && autoEnabled) {
          injectXvideosPageScript();
          startXvideosWatchdog();
          fixXvideosThumbnails();
        }
        if (isXhamsterHost() && autoEnabled) {
          injectXhamsterPageScript();
          startXhamsterWatchdog();
          document.dispatchEvent(new CustomEvent('agego-xh-unlock'));
          hideXhamsterCookieModal();
        }
        if (isPornhubHost() && autoEnabled) {
          cleanPornhub();
        }
        if (isLebonpornHost() && autoEnabled) {
          cleanLebonporn();
        }
        if (isTukifHost() && autoEnabled) {
          cleanTukif();
        }
      }
    });
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

        if (autoEnabled) {
          activateWatchdog(true);
          if (!isChaturbateHost()) runCleanup();
        } else {
          deactivateAutoMode();
        }

        sendResponse(getStatus());
        return false;
      }

      if (message.action === 'forceCleanup') {
        sendResponse(forceCleanup());
        return false;
      }

      return false;
    });
  }

  init();
})();
