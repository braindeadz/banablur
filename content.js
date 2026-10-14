(function () {
  'use strict';

  // Before any site script runs: PunishWorld and AgeGo "age-by-nosotros" (ABN) only read
  // cookies at load time. For AgeGo countries (FR/GB), age.js BLOCKS the player as long
  // as abn_age_verified=1 is absent (blur + intercepted player click). So we must set the
  // expected cookies AT document_start; otherwise the extension hides the "Start" button
  // without ever unlocking playback (player frozen).
  function abnSlugFromHost(host) {
    return String(host || '').replace(/^www\./i, '').replace(/\./g, '-');
  }
  const ABN_HOST_RE = /(^|\.)darknessporn\.com$/i;
  function setAgeVerifiedCookies(domain) {
    const d = '; path=/; max-age=31536000; SameSite=Lax';
    const dom = domain ? '; domain=' + domain : '';
    document.cookie = 'abn_age_verified=1' + d + dom;
    const key = 'age-allow-' + abnSlugFromHost(location.hostname);
    document.cookie = key + '=1' + d + dom;
    try {
      localStorage.setItem(key, '1');
    } catch (_e) {}
    try {
      sessionStorage.setItem(key, '1');
    } catch (_e) {}
  }
  function isAbnHost() {
    return ABN_HOST_RE.test(location.hostname || '');
  }
  // AgeGo "Flix" platform (TNAFlix, Empflix). Their player bundle computes
  // Flix.ageVerified = (cookie age_verified_mnt === "true") once, at load time.
  // When that flag is false the play handler PAUSES the player and diverts the click to the
  // age overlay instead of playing, so the video never starts (removing the overlay does not
  // help: the pause already happened). The site itself does the same thing after its own
  // verification: FlixUtils.setCookie('age_verified_mnt', 'true', 31).
  const AGEGO_FLIX_HOST_RE = /(^|\.)(tnaflix\.com|empflix\.com)$/i;
  try {
    const host = location.hostname || '';
    if (/(^|\.)punishworld\.com$/i.test(host)) {
      const key = 'age-allow-punishworld-com';
      const base = '; path=/; max-age=31536000; domain=.punishworld.com; SameSite=Lax';
      document.cookie = key + '=1' + base;
      document.cookie = 'abn_age_verified=1' + base;
      localStorage.setItem(key, '1');
      sessionStorage.setItem(key, '1');
    } else if (isAbnHost()) {
      setAgeVerifiedCookies('');
    }
    if (AGEGO_FLIX_HOST_RE.test(host)) {
      document.cookie = 'age_verified_mnt=true; path=/; max-age=2678400; SameSite=Lax';
    }
  } catch (_e) {}

  const CSS_ID = 'banablur-override';
  const DEBOUNCE_MS = 50;
  const FALLBACK_INTERVAL_MS = 500;

  const SITE_PROFILES = {
    'deviants.com': ['agego'],
    'www.deviants.com': ['agego'],
    'xvideos.com': ['xvideos', 'agego'],
    'www.xvideos.com': ['xvideos', 'agego'],
    'fr.xvideos.com': ['xvideos', 'agego'],
    'xvideos.es': ['xvideos', 'agego'],
    'www.xvideos.es': ['xvideos', 'agego'],
    'xnxx.com': ['xvideos', 'agego'],
    'www.xnxx.com': ['xvideos', 'agego'],
    'xnxx.es': ['xvideos', 'agego'],
    'www.xnxx.es': ['xvideos', 'agego'],
    'xvideos.red': ['xvideos'],
    'www.xvideos.red': ['xvideos'],
    'xhamsterlive.com': ['xhamsterlive'],
    'www.xhamsterlive.com': ['xhamsterlive'],
    'chaturbate.com': ['chaturbate'],
    'www.chaturbate.com': ['chaturbate'],
    'tnaflix.com': ['agego'],
    'www.tnaflix.com': ['agego'],
    'moviefap.com': ['agego'],
    'www.moviefap.com': ['agego'],
    'perfectgirls.xxx': ['agego'],
    'www.perfectgirls.xxx': ['agego'],
    'porndig.com': ['tkn'],
    'www.porndig.com': ['tkn'],
    'sxyprn.com': ['tkn'],
    'www.sxyprn.com': ['tkn'],
    'txxx.com': ['txxx'],
    'www.txxx.com': ['txxx'],
    'hclips.com': ['txxx'],
    'www.hclips.com': ['txxx'],
    'upornia.com': ['txxx'],
    'www.upornia.com': ['txxx'],
    'hdzog.com': ['txxx'],
    'www.hdzog.com': ['txxx'],
    'voyeurhit.com': ['txxx'],
    'www.voyeurhit.com': ['txxx'],
    'hotmovs.com': ['txxx'],
    'www.hotmovs.com': ['txxx'],
    'ooxxx.com': ['txxx'],
    'www.ooxxx.com': ['txxx'],
    'manysex.com': ['txxx'],
    'www.manysex.com': ['txxx'],
    'tubepornclassic.com': ['txxx'],
    'www.tubepornclassic.com': ['txxx'],
    'pornzog.com': ['txxx'],
    'www.pornzog.com': ['txxx'],
    'tporn.xxx': ['txxx'],
    'www.tporn.xxx': ['txxx'],
    'tporn.tube': ['txxx'],
    'www.tporn.tube': ['txxx'],
    'desi-porn.tube': ['txxx'],
    'www.desi-porn.tube': ['txxx'],
    'thegay.com': ['txxx'],
    'www.thegay.com': ['txxx'],
    'shemalez.com': ['txxx'],
    'www.shemalez.com': ['txxx'],
    'teen21.com': ['txxx'],
    'www.teen21.com': ['txxx'],
    'vr-porn.tube': ['txxx'],
    'www.vr-porn.tube': ['txxx'],
    'sunporno.com': ['sunporno'],
    'www.sunporno.com': ['sunporno'],
    'jacquieetmichel.net': ['jacquie'],
    'www.jacquieetmichel.net': ['jacquie'],
    'stripchat.com': ['stripchat'],
    'www.stripchat.com': ['stripchat'],
    'fr.stripchat.com': ['stripchat'],
    'lebon.porn': ['lebonporn'],
    'www.lebon.porn': ['lebonporn'],
    'videos.lebon.porn': ['lebonporn'],
    'tukif.porn': ['tukif'],
    'www.tukif.porn': ['tukif'],
    'videos.tukif.porn': ['tukif'],
    'xtube.com': ['stripchat'],
    'www.xtube.com': ['stripchat'],
    'fr.xtube.com': ['stripchat'],
    'empflix.com': ['agego'],
    'www.empflix.com': ['agego'],
    'perfectgirls.net': ['agego'],
    'www.perfectgirls.net': ['agego'],
    'thisvid.com': ['gate18'],
    'www.thisvid.com': ['gate18'],
    'hdtube.porn': ['gate18'],
    'www.hdtube.porn': ['gate18'],
    'analdin.com': ['gate18'],
    'www.analdin.com': ['gate18'],
    'punishworld.com': ['punishworld'],
    'www.punishworld.com': ['punishworld'],
    'darknessporn.com': ['abn'],
    'www.darknessporn.com': ['abn'],
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

/* LEBON.PORN (AgeVerif / mrx) */
#adult-popup, #adult-popup-backdrop { display: none !important; pointer-events: none !important; visibility: hidden !important; }
.mrx-blur, .mrx-blur-20, #ewok-iframe, iframe[src*="videos.lebon.porn"] { filter: none !important; }
.mrx-overlay, .mrx-click-overlay, .mrx-player-blur-overlay, .mrx-blur-overlay { display: none !important; pointer-events: none !important; visibility: hidden !important; }
img.video-img[data-type="nsfw"] { display: block !important; filter: none !important; visibility: visible !important; }
img.video-img[data-type="sfw"] { display: none !important; }

/* TUKIF.PORN (AgeVerif / TKN) */
#disclaimer_parent_wrapper, #disclaimer_parent_wrapper .disclaimer_container, #disclaimer_parent_wrapper .disclaimer_wrapper, .disclaimer_parent_wrapper, .sfw_disclaimer_wrapper, .disclaimer_overlay, #preview_disclaimer_parent_wrapper, #birth_month, #birth_day, #birth_year, .agepass_check, .agechecker, .sfw_video_poster, .img_18plus_wrapper, .blursfw_poster, iframe[src*="ageverif"], [id*="ageverif"], [class*="ageverif"] { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html.img-blured img, html.img-blured video, html.img-blured iframe, .img-blured, .img-blured-small, .main_wrapper.img-blured, .video_iframe_container, iframe[src*="videos.tukif.porn"] { filter: none !important; }
.blurmyass, .img_18plus, .video_action_buttons .main_video_page_buttons { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* AGEGO extra TNAFlix/MovieFap */
#video-player-container, #preroll-container, .plyr, .plyr__video-wrapper, .plyr__control, video, object { filter: none !important; backdrop-filter: none !important; }
#agego-verify-frame { display: none !important; }

/* JACQUIE */
custom-disclaimer.disclaimer, .disclaimer__container, .disclaimer__btns, #disclaimer, .disclaimer-wrapper { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html.my18pass-blur, html.my18pass-blur body, html.my18pass-blur img, html.my18pass-blur video { filter: none !important; }

/* TXXX family */
age-verification, age-verification-uk, age-verification-face, .modal-age-verification, .modal.modal-ageverification, .overlay-modal, .cookie-notify, [class*="modal-age"], iframe[src*="ageverif"], iframe[src*="ageverif.com"], [src*="static.ageverif.com"] { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html, body { filter: none !important; }
html, body { overflow: auto !important; height: auto !important; position: static !important; pointer-events: auto !important; }

/* SUNPORNO */
#age-verification-overlay, [id*="age-verif"], [class*="age-verif"], [class*="age_verif"] { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html, body, #wrapper, .wrapper, main, .container { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; overflow: auto !important; pointer-events: auto !important; }

/* STRIPCHAT */
#agreement-root, .visitors-agreement-modal, .full-cover.modal-wrapper.visitors-agreement-modal, [data-testid="CookiesReminder"], #CookiesReminder, .cookies-banner { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* SHARED GATE / MODAL NEUTRALIZERS (used by several cam sites) — DO NOT hide #overlay nor #fi-18-22 */
#consent_modal.over-18, #consent_modal.is-non-adult, #consent_modal, [data-testid="Over18ModalVariant1Modal"], .over-18.is-non-adult, .over-18__popover, [class*="thumb"] .over-18, [class*="Thumb"] .over-18, [class*="preview"] .over-18, [class*="Preview"] .over-18 { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html, body, #page, .layout, [class*="layout"], main, .main-content { overflow: auto !important; height: auto !important; position: static !important; overscroll-behavior: auto !important; pointer-events: auto !important; }
[class*="thumb"] img, [class*="thumb"] video, [class*="thumb"] canvas, [class*="Thumb"] img, [class*="Thumb"] video, [class*="Thumb"] canvas, [class*="preview"] img, [class*="preview"] video, [class*="preview"] canvas, [class*="Preview"] img, [class*="Preview"] video, [class*="Preview"] canvas, [class*="modelTile"] img, [class*="ModelTile"] img, [class*="modelTile"] video, [class*="ModelTile"] video { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }

/* PUNISHWORLD — AgeGO blur injected with !important on the kolortube player */
html body video.xp-Player-video,
html body .xp-Player-video,
html body .xp-Player-videoPreview,
html body .xp-Player-poster,
html body .video-img,
html body .img-actor-vid,
html body .playlist-thumbnail,
html body .xp-Video--related {
  filter: none !important;
  -webkit-filter: none !important;
}
.abn-age-banner,
.abn-age-overlay,
[class*="abn-age-banner"],
[class*="abn-age-overlay"] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

/* GATE18 generic (hosts listed only via profile, CSS loaded if page activated) */
#age_verification, #age-verification, #ageVerification, #age_gate, #age-gate, #ageGate,
#age-check, #age_check, #ageDisclaimer, #age-disclaimer, #age_disclaimer,
#age-verification-container, .age-verification-overlay, .age-verification, .age_verification,
.age-gate, .age_gate, .js-age-gate, #cookie-policy, .cc-window, .cc-banner, #full-page-loader { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* ADS / preroll — never hide .videoplayer .jwplayer #kt_player #player-1 video */
.vast_player, .vast_player_content, .vast_player_resume, .vast_player_click_link, .vast_player_close,
.jw-plugin-vast, [id$="_vast"], .exo-native, [class*="ExoClick"],
iframe[src*="poloptrex.com"], iframe[src*="mrdmca.com"], iframe[src*="exoclick.com"],
iframe[src*="ads.exoclick"], iframe[src*="tsvideo.sacdnssedge.com"],
iframe[src*="satencedge"], iframe[src*="sacfedge"], iframe[src*="sacdnssedge"],
iframe[src*="under_faphouse"], iframe[src*="adsterra"], iframe[src*="trafficjunky"],
iframe[src*="juicyads"], iframe[src*="clickadu"], iframe[src*="ad-maven"],
iframe[src*="yengo.com"], iframe[src*="exosrv.com"], iframe[src*="realsrv.com"],
iframe[src*="magsrv.com"], iframe[src*="trustberrie.com"], iframe[src*="tsyndicate"],
iframe[src*="onclickalgo"], iframe[src*="zsr"], iframe[src*="propeller"],
iframe[src*="vidoomy"], iframe[src*="vimmy"], iframe[src*="magsrv"],
#exoscript, .exo-native-widget, [class*="exo-native"], [id*="msg-native"],
[class*="exo-native-widget"], .abn-age-banner--ad,
[id^="native-boxes"], [id*="native-boxes"], ins.adsbyexoclick,
.video-underplayer, .video-underplayer__buttons { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* AGE-BY-NOSOTROS (ABN) — AgeGo FR/GB gate: never leave the blur nor the player gate */
.abn-age-banner, .abn-age-overlay, .abn-age-badge, .abn-age-badge-tags, .abn-age-player-gate,
[class*="abn-age-banner"], [class*="abn-age-overlay"] { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html, body { filter: none !important; }
.xp-Player-video, .xp-Player-videoWrapper, .xp-Player-poster, .video-img, .xp-Video--related,
.xp-Player-videoPreview, .video-preview, .playlist-thumbnail, .img-actor-vid, .mobile-cat-img {
  filter: none !important; -webkit-filter: none !important; backdrop-filter: none !important;
}
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
  let ageverifWatchTimer = null;
  let ageverifObserver = null;
  let ageverifHistoryHooked = false;
  let ageverifCallbacksCalled = false;
  let tukifTickTimer = null;
  let tukifClickGuardBound = false;
  let tukifNavGuardBound = false;
  let tukifHistoryHooked = false;
  let lastTukifPath = '';

  function getHostname() {
    return location.hostname;
  }

  function isXvideosHost() {
    return /(^|\.)(xvideos|xnxx)\.(com|es|red)$/i.test(getHostname());
  }

  function isXvideosVideoPath() {
    return /\/video[.-][\w]+/i.test(location.pathname);
  }

  function isXhamsterHost() {
    return /(^|\.)xhamster\.(com|desi)$/i.test(getHostname());
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

  function isLebonpornHost() {
    return /(^|\.)lebon\.porn$/i.test(getHostname());
  }

  function isTukifHost() {
    return /(^|\.)tukif\.porn$/i.test(getHostname());
  }

  function isTknHost() {
    return /(^|\.)(porndig|sxyprn)\.com$/i.test(getHostname());
  }

  function isTxxxHost() {
    return (
      /(^|\.)(txxx|hclips|upornia|hdzog|voyeurhit|hotmovs|ooxxx|manysex|tubepornclassic|pornzog|thegay|shemalez|teen21)\.com$/i.test(
        getHostname()
      ) ||
      /(^|\.)tporn\.(xxx|tube)$/i.test(getHostname()) ||
      /(^|\.)(desi-porn|vr-porn)\.tube$/i.test(getHostname())
    );
  }

  function isSunpornoHost() {
    return /(^|\.)sunporno\.com$/i.test(getHostname());
  }

  function isPunishworldHost() {
    return /(^|\.)punishworld\.com$/i.test(getHostname());
  }

  function isJacquieHost() {
    return /(^|\.)jacquieetmichel\.net$/i.test(getHostname());
  }

  function isStripchatHost() {
    return /(^|\.)(stripchat|xtube)\.com$/i.test(getHostname());
  }

  function isGate18Host() {
    return (
      /(^|\.)(thisvid|analdin)\.com$/i.test(getHostname()) ||
      /(^|\.)hdtube\.porn$/i.test(getHostname())
    );
  }

  const GATE18_SELECTORS =
    '#age_verification, #age-verification, #ageVerification, #age_gate, #age-gate, #ageGate, #age-check, #age_check, #ageDisclaimer, #age-disclaimer, #age_disclaimer, #age-verification-container, .age-verification-overlay, .age-verification, .age_verification, .age-gate, .age_gate, .js-age-gate, #cookie-policy, .cc-window, .cc-banner, #full-page-loader';

  function getConfiguredProfiles() {
    return SITE_PROFILES[getHostname()] || [];
  }

  // Safety net: the addon only modifies sites explicitly listed in SITE_PROFILES.
  // No DOM/CSS/cookie change is applied anywhere else (no breakage of third-party sites).
  function isListedSite() {
    return getConfiguredProfiles().length > 0;
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
    return !!document.querySelector('iframe[src*="videos.tukif.porn"]');
  }

  function detectTkn() {
    if (isTukifHost()) return false;
    if (isTknHost()) return true;
    return !!(
      document.querySelector('script[src*="tkn_disclaimer"]') ||
      document.getElementById('disclaimer_parent_wrapper')
    );
  }

  function detectTxxx() {
    if (isTxxxHost()) return true;
    return !!(
      document.querySelector('age-verification, age-verification-uk, age-verification-face') ||
      document.querySelector('.modal-age-verification, .modal.modal-ageverification')
    );
  }

  function detectSunporno() {
    if (isSunpornoHost()) return true;
    return !!document.getElementById('age-verification-overlay');
  }

  function detectPunishworld() {
    // PunishWorld is an ABN site: the 'abn' (generic) profile handles the others.
    return isPunishworldHost();
  }

  function detectAbn() {
    if (isAbnHost()) return true;
    if (isPunishworldHost()) return false;
    return !!(
      document.querySelector('script[src*="age-by-nosotros"]') ||
      document.querySelector('.abn-age-banner') ||
      document.querySelector('[class*="abn-age"]')
    );
  }

  function detectJacquie() {
    if (isJacquieHost()) return true;
    return !!(
      document.querySelector('custom-disclaimer.disclaimer') ||
      document.getElementById('disclaimer') ||
      document.documentElement.classList.contains('my18pass-blur')
    );
  }

  function detectStripchat() {
    if (isStripchatHost()) return true;
    return !!document.getElementById('agreement-root');
  }

  function detectGate18() {
    if (isGate18Host()) return true;
    return !!document.querySelector(GATE18_SELECTORS);
  }

  function detectAgeverif() {
    if (
      document.querySelector('script[src*="ageverif.com"]') ||
      document.querySelector('script[src*="static.ageverif.com"]') ||
      document.querySelector('iframe[src*="ageverif"]')
    ) {
      return true;
    }
    if (
      typeof window.ageverifSuccess === 'function' ||
      typeof window.ageverifReady === 'function' ||
      typeof window.ageverifError === 'function'
    ) {
      return true;
    }
    if (
      'ageverifSuccess' in window ||
      'ageverifReady' in window ||
      'ageverifError' in window
    ) {
      return true;
    }
    try {
      if (localStorage.getItem('_agvface')) return true;
    } catch (_e) {}
    return false;
  }

  function detectProfiles() {
    const profiles = new Set(getConfiguredProfiles());
    if (detectAgeGO()) profiles.add('agego');
    if (detectXvideos()) profiles.add('xvideos');
    if (detectXhamster()) profiles.add('xhamster');
    if (detectXhamsterLive()) profiles.add('xhamsterlive');
    if (detectFaphouse()) profiles.add('faphouse');
    if (detectChaturbate()) profiles.add('chaturbate');
    if (detectLebonporn()) profiles.add('lebonporn');
    if (detectTukif()) profiles.add('tukif');
    if (detectTkn()) profiles.add('tkn');
    if (detectTxxx()) profiles.add('txxx');
    if (detectSunporno()) profiles.add('sunporno');
    if (detectPunishworld()) profiles.add('punishworld');
    if (detectAbn()) profiles.add('abn');
    if (detectJacquie()) profiles.add('jacquie');
    if (detectStripchat()) profiles.add('stripchat');
    if (detectGate18()) profiles.add('gate18');
    if (detectAgeverif()) profiles.add('ageverif');
    return [...profiles];
  }

  function getMainVideo() {
    return document.querySelector(
      '#html5video video, #video-player-bg video, .xplayer video, .player-container__player video, #chatroom_video video, #TheaterModePlayer video, #chat_video, video'
    );
  }

  function isOverlayVisible(selector) {
    const el = document.querySelector(selector);
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  function hideMatches(selector) {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
    });
  }

  const AD_HIDE_SELECTORS = '.vast_player, .vast_player_content, .vast_player_resume, .vast_player_click_link, .jw-plugin-vast, [id$="_vast"], iframe[src*="poloptrex.com"], iframe[src*="mrdmca.com"], iframe[src*="exoclick.com"], iframe[src*="tsvideo.sacdnssedge.com"], iframe[src*="satencedge"], iframe[src*="sacfedge"], iframe[src*="under_faphouse"], iframe[src*="yengo.com"], iframe[src*="magsrv.com"], iframe[src*="trustberrie.com"], iframe[src*="tsyndicate"], iframe[src*="onclickalgo"], iframe[src*="propeller"], iframe[src*="vidoomy"], #exoscript, .exo-native-widget, [class*="exo-native"], [id*="msg-native"], [id^="native-boxes"], [id*="native-boxes"], ins.adsbyexoclick, .abn-age-banner--ad, .video-underplayer';
  const AD_VIDEO_SRC_RE = /tsvideo|sacdnssedge|satencedge|sacfedge|exoclick|poloptrex|mrdmca|yengo|imasdk|doubleclick|googlesyndication|trafficjunky|juicyads|adsterra|clickadu|exosrv|realsrv|magsrv|trustberrie|tsyndicate|onclickalgo|vidoomy|vimmy/i;
  const AD_IFRAME_SRC_RE = /magsrv|trustberrie|exoclick|exosrv|realsrv|tsyndicate|onclickalgo|propeller|vidoomy|vimmy|juicyads|trafficjunky|adsterra|clickadu|ad-maven|popads|doubleclick|googlesyndication/i;
  function isInsidePlayer(el) {
    return !!el.closest('#kt_player, #player, #player-1, #html5video, .jwplayer, .videoplayer, .player-container, .player, [id*="player"]');
  }
  function isAdVideoEl(v) {
    if (isInsidePlayer(v)) return false;
    const src = `${v.currentSrc || ''} ${v.src || ''}`.toLowerCase();
    if (!AD_VIDEO_SRC_RE.test(src)) return false;
    return !!v.closest('.vast_player, [id$="_vast"], .video-underplayer');
  }
  function killAdVideos() {
    document.querySelectorAll('video').forEach((v) => {
      if (!isAdVideoEl(v)) return;
      try { v.pause(); } catch (_e) {}
      v.style.setProperty('display', 'none', 'important');
    });
  }
  // Kolortube/ExoClick: ad iframes (magsrv/trustberrie/...) get their src in JS
  // after load -> a CSS selector is not enough, we remove them on the fly.
  function killAdIframes() {
    document.querySelectorAll('iframe').forEach((f) => {
      const s = `${f.src || ''} ${f.getAttribute('data-src') || ''}`;
      if (!AD_IFRAME_SRC_RE.test(s)) return;
      f.style.setProperty('display', 'none', 'important');
      f.style.setProperty('pointer-events', 'none', 'important');
      try { f.src = 'about:blank'; } catch (_e) {}
      f.remove();
    });
    document.querySelectorAll('[id^="msg-native"], [id*="exo-native"], .exo-native-widget').forEach((el) => el.remove());
  }
  // KolorTube plays the preroll INSIDE the main <video> (ExoClick "330x250.mp4",
  // then "c.adplsr.com/..._fix.mp4") before the real video. We can't remove the
  // element (it's the player), so we skip the ad by seeking it to its end.
  const AD_PLAYER_SRC_RE = /adplsr\.com|330x250|\/vast\/|exoclick|magsrv|jerkmate|cash4porn/i;
  function skipPlayerAd() {
    const v = document.querySelector('.xp-Player video, video.xp-Player-video, .xp-Player-videoWrapper video');
    if (!v || !v.duration || !isFinite(v.duration)) return;
    const src = (v.currentSrc || v.src || '').toLowerCase();
    if (!AD_PLAYER_SRC_RE.test(src)) return;
    try { v.currentTime = Math.max(0, v.duration - 0.05); } catch (_e) {}
  }
  function skipJwPreroll() {
    try {
      const jw = typeof window.jwplayer === 'function' ? window.jwplayer() : null;
      if (jw && typeof jw.skipAd === 'function') jw.skipAd();
    } catch (_e) {}
  }
  function dismissPrerollAds() {
    // TNAFlix (Flix platform) shows a preroll whose only exit is #prerollAdSkip ("Skip Ad in
    // N" then "Skip Ad >>>"). While that preroll is on screen the real video stays source-less
    // and paused, so playback never starts until the skip control is used.
    document.querySelectorAll('.vast_player_close, .vast_player_close--do, .jw-skip, .jw-icon-skip, [class*="skip-ad"], .vast_skip, [class*="SkipAd"], #prerollAdSkip, [id*="prerollAdSkip"]').forEach((el) => { try { el.click(); } catch (_e) {} });
    skipJwPreroll();
    skipPlayerAd();
    killAdVideos();
  }
  function cleanAds() {
    dismissPrerollAds();
    hideMatches(AD_HIDE_SELECTORS);
    killAdIframes();
  }

  function hasAgeGOThreat() {
    return !!(
      document.getElementById('agego-overlay-container') ||
      document.getElementById('agego-overlay') ||
      document.getElementById('agego-verify-frame') ||
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

  function hasTknThreat() {
    if (isTukifHost()) return false;
    return !!(
      isOverlayVisible('#disclaimer_parent_wrapper') ||
      isOverlayVisible('.disclaimer_parent_wrapper') ||
      isOverlayVisible('.sfw_disclaimer_wrapper') ||
      isOverlayVisible('.agechecker')
    );
  }

  function hasTxxxThreat() {
    return !!(
      isOverlayVisible('age-verification') ||
      isOverlayVisible('age-verification-uk') ||
      isOverlayVisible('age-verification-face') ||
      isOverlayVisible('.modal-age-verification') ||
      isOverlayVisible('.modal.modal-ageverification') ||
      isOverlayVisible('.overlay-modal') ||
      isOverlayVisible('.cookie-notify') ||
      isOverlayVisible('[class*="modal-age"]') ||
      isOverlayVisible('iframe[src*="ageverif"]')
    );
  }

  function hasPunishworldThreat() {
    if (!isPunishworldHost() && !document.querySelector('.abn-age-banner, script[src*="age-by-nosotros"]')) {
      return false;
    }
    const video = document.querySelector('video.xp-Player-video, .xp-Player-video, .video-img');
    const videoBlurred = video && getComputedStyle(video).filter.includes('blur');
    const player = document.querySelector('.xp-Player');    return !!(
      videoBlurred ||
      document.getElementById('abn-cz-visual-rules') ||
      isOverlayVisible('.abn-age-banner') ||
      isOverlayVisible('.abn-age-player-gate') ||
      document.querySelector('.abn-age-badge, .abn-age-badge-tags') ||
      (player && player.dataset.abnPlayerGateBound === '1')
    );
  }

  function hasAbnThreat() {
    if (isPunishworldHost()) return false;
    if (!isAbnHost() && !document.querySelector('script[src*="age-by-nosotros"]')) return false;
    const video = document.querySelector('video.xp-Player-video, .xp-Player-video, .video-img');
    const videoBlurred = video && getComputedStyle(video).filter.includes('blur');
    const player = document.querySelector('.xp-Player');
    return !!(
      videoBlurred ||
      document.getElementById('abn-cz-visual-rules') ||
      isOverlayVisible('.abn-age-banner') ||
      isOverlayVisible('.abn-age-player-gate') ||
      document.querySelector('.abn-age-badge, .abn-age-badge-tags, .abn-age-banner') ||
      (player && player.dataset.abnPlayerGateBound === '1')
    );
  }

  function hasSunpornoThreat() {
    const htmlCs = getComputedStyle(document.documentElement);
    const bodyCs = document.body ? getComputedStyle(document.body) : null;
    const pageBlocked =
      htmlCs.filter.includes('blur') ||
      htmlCs.pointerEvents === 'none' ||
      (bodyCs && (bodyCs.filter.includes('blur') || bodyCs.pointerEvents === 'none'));
    const container = document.querySelector('.container');
    const containerBlurred =
      container &&
      (getComputedStyle(container).filter.includes('blur') ||
        getComputedStyle(container).pointerEvents === 'none');
    return !!(
      isOverlayVisible('#age-verification-overlay') ||
      isOverlayVisible('[id*="age-verif"]') ||
      isOverlayVisible('[class*="age-verif"]') ||
      isOverlayVisible('[class*="age_verif"]') ||
      pageBlocked ||
      containerBlurred
    );
  }

  function hasJacquieThreat() {
    return !!(
      isOverlayVisible('custom-disclaimer.disclaimer') ||
      isOverlayVisible('#disclaimer') ||
      document.documentElement.classList.contains('my18pass-blur')
    );
  }

  function hasStripchatThreat() {
    return !!(
      isOverlayVisible('#agreement-root') ||
      isOverlayVisible('.visitors-agreement-modal')
    );
  }

  function hasGate18Threat() {
    return GATE18_SELECTORS.split(', ')
      .some((sel) => isOverlayVisible(sel.trim()));
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
      hasTukifThreat() ||
      hasTknThreat() ||
      hasTxxxThreat() ||
      hasSunpornoThreat() ||
      hasPunishworldThreat() ||
      hasAbnThreat() ||
      hasJacquieThreat() ||
      hasStripchatThreat() ||
      hasGate18Threat()
    );
  }

  function debloatAgeGO() {
    document.documentElement.classList.remove('agego-lock');
    document.body?.classList.remove('agego-blur-content');
    document.getElementById('agego-overlay-container')?.remove();
    document.getElementById('agego-overlay')?.remove();
    document.getElementById('agego-blur-style')?.remove();
    document.getElementById('agego-blur-stylev2')?.remove();
    document.getElementById('agego-verify-frame')?.remove();
    document.getElementById('AgeGoScript')?.remove();
  }

  function fixXvideosThumbnails() {
    // Deblur IN PLACE only (never remove nodes): removing .video-pic in a loop
    // shortened the page and scrolled back to the top.
    document.querySelectorAll('img').forEach((img) => {
      const style = img.getAttribute('style') || '';
      const blurred = style.includes('blur') || getComputedStyle(img).filter.includes('blur');
      if (!blurred) return;
      img.style.setProperty('filter', 'none', 'important');
      img.style.setProperty('box-shadow', 'none', 'important');
    });
  }

  function clearXvideosPlayerBlockers() {
    // Non-destructive: hide (display:none) rather than remove(), and limit the poster
    // to the player, so we don't change the page height (cause of the scroll jump).
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
        // Once the unlock succeeds (flag set by xvideos-page.js), we stop
        // re-requesting the unlock: this avoids the player re-init loop that
        // caused the black screen and the scroll jump.
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
    // Strict targeting: only real cookie modals (not a page wrapper
    // that mentions "cookies" in the footer).
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

  // Download relay: the button (page world) requests a download; the MP4 is on
  // a cross-origin CDN (download attribute ignored), so we go through the
  // chrome.downloads API via the service worker.
  document.addEventListener('agego-xv-download', (event) => {
    const detail = event.detail || {};
    if (!detail.url || !api?.runtime?.sendMessage) return;
    api.runtime.sendMessage({ action: 'download', url: detail.url, filename: detail.filename });
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
    // Click the real "Enter" button BEFORE removing the overlay: its handler
    // (an internal site function) stops the scrollTo(0,0) setInterval that
    // scrolls back to top every 2s, and sets the age cookie.
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
    // xhamster 2026: the real block is the runtime module window.xplayer.sfw
    // (temporal cutoff) only accessible in the page world -> we inject
    // xhamster-page.js. The CSS selectors below remain as a safety net for
    // any old pages / regional variants.
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
    /* CSS-only — don't touch the DOM (avoids Chaturbate reload loop) */
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
    // Deblur mrx thumbnails: restore data-src, remove blur/nsfw classes.
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
    // Don't click #adult-enter-btn (popunder ad): localStorage + hiding only.
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
      const maxAge = 31536000;
      document.cookie = `dsclcnst=1; path=/; max-age=${maxAge}`;
      document.cookie = `discl_s_t=1; path=/; max-age=${maxAge}`;
      document.cookie = `ckcnsnt=1; path=/; max-age=${maxAge}`;
    } catch (_e) {}
    document
      .querySelectorAll(
        '#disclaimer_parent_wrapper, #disclaimer_parent_wrapper .disclaimer_container, #disclaimer_parent_wrapper .disclaimer_wrapper, .disclaimer_parent_wrapper, .sfw_disclaimer_wrapper, .disclaimer_overlay, #preview_disclaimer_parent_wrapper, #birth_month, #birth_day, #birth_year, .agepass_check, .agechecker, .sfw_video_poster, .img_18plus_wrapper, .blursfw_poster, iframe[src*="ageverif"], [id*="ageverif"], [class*="ageverif"]'
      )
      .forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      });
  }

  function bindTukifClickGuard() {
    if (tukifClickGuardBound || !isTukifHost()) return;
    tukifClickGuardBound = true;
    document.addEventListener(
      'click',
      (ev) => {
        const target = ev.target;
        if (!(target instanceof Element)) return;
        if (
          target.closest(
            '.agepass_check, .js_remove_disclaimer, .js_remove_soft_disclaimer, #disclaimer_parent_wrapper'
          )
        ) {
          ev.preventDefault();
          ev.stopPropagation();
        }
      },
      true
    );
  }

  function isTukifDisclaimerVisible() {
    const el = document.getElementById('disclaimer_parent_wrapper');
    if (!el) return false;
    const cs = window.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  }

  function onTukifNavigate() {
    if (!isTukifHost()) return;
    if (
      location.pathname === lastTukifPath &&
      document.getElementById(CSS_ID) &&
      !isTukifDisclaimerVisible()
    ) {
      return;
    }
    lastTukifPath = location.pathname;
    delete document.documentElement.dataset.agegoLbpInjected;
    cleanTukif();
    injectCSS();
  }

  function hookTukifHistory() {
    if (tukifHistoryHooked) return;
    tukifHistoryHooked = true;
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = function (...args) {
      const ret = origPush(...args);
      if (autoEnabled) onTukifNavigate();
      return ret;
    };
    history.replaceState = function (...args) {
      const ret = origReplace(...args);
      if (autoEnabled) onTukifNavigate();
      return ret;
    };
  }

  function bindTukifNavGuard() {
    if (tukifNavGuardBound || !isTukifHost()) return;
    tukifNavGuardBound = true;
    lastTukifPath = location.pathname;

    const navHandler = () => {
      if (isTukifHost() && autoEnabled) onTukifNavigate();
    };

    window.addEventListener('popstate', navHandler);
    window.addEventListener('pageshow', navHandler);
    window.addEventListener('hashchange', navHandler);

    hookTukifHistory();

    document.addEventListener(
      'click',
      (ev) => {
        const target = ev.target;
        if (!(target instanceof Element)) return;
        const link = target.closest('a[href*="/videos/"]');
        if (!link || !(link instanceof HTMLAnchorElement)) return;
        try {
          const href = new URL(link.href, location.href);
          if (href.origin !== location.origin) return;
        } catch (_e) {
          return;
        }
        if (!autoEnabled) return;
        setTimeout(() => onTukifNavigate(), 0);
        setTimeout(() => onTukifNavigate(), 300);
        setTimeout(() => onTukifNavigate(), 800);
      },
      true
    );
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

    bindTukifClickGuard();
    bindTukifNavGuard();

    tukifTickTimer = setInterval(() => {
      if (!autoEnabled || !watchdogActive) return;
      if (location.pathname !== lastTukifPath) {
        lastTukifPath = location.pathname;
        delete document.documentElement.dataset.agegoLbpInjected;
        cleanTukif();
      }
      injectCSS();
      dismissTukifDisclaimer();
      fixTukifBlur();
      releaseTukifPlayers();
      document.dispatchEvent(new CustomEvent('agego-lbp-unlock'));
      injectLebonpornPageScript();
    }, 500);
  }

  function cleanTukif() {
    injectCSS();
    dismissTukifDisclaimer();
    fixTukifBlur();
    releaseTukifPlayers();
    injectLebonpornPageScript();
    document.dispatchEvent(new CustomEvent('agego-lbp-unlock'));
    startTukifWatchdog();
  }

  function cleanTkn() {
    injectCSS();
    dismissTukifDisclaimer();
    fixTukifBlur();
  }

  const TXXX_HIDE_SELECTORS =
    'age-verification, age-verification-uk, age-verification-face, .modal-age-verification, .modal.modal-ageverification, .overlay-modal, .cookie-notify, [class*="modal-age"], iframe[src*="ageverif"], iframe[src*="ageverif.com"], [src*="static.ageverif.com"]';

  const TXXX_AGE_HOST_SELECTORS =
    'age-verification, age-verification-uk, age-verification-face, .modal-age-verification, .modal.modal-ageverification, .overlay-modal, [class*="modal-age"]';

  const TXXX_AGE_BTN_RE =
    /(?:^|\s)(?:18\s*\+|i\s*'?m?\s*(?:over\s*)?18|j.?ai\s+(?:plus\s+de\s+)?18|enter|entrer|oui|yes|accept|continue|confirm)(?:\s|$)/i;

  const TXXX_AGE_BTN_SELECTORS =
    'button, [role="button"], input[type="button"], input[type="submit"]';

  function setTxxxAgeFlags() {
    try {
      localStorage.setItem('ageVerified', '1');
      localStorage.setItem('age_verified', '1');
      localStorage.setItem('_agvface', 'passed');
    } catch (_e) {}
    try {
      const maxAge = 31536000;
      document.cookie = `age_verified=1; path=/; max-age=${maxAge}`;
      document.cookie = `ageVerified=1; path=/; max-age=${maxAge}`;
      document.cookie = `kt_age_verified=1; path=/; max-age=${maxAge}`;
      document.cookie = `kt_is_age_verified=1; path=/; max-age=${maxAge}`;
      document.cookie = `kt_agv=1; path=/; max-age=${maxAge}`;
    } catch (_e) {}
  }

  function collectTxxxRoots() {
    const roots = [];
    document.querySelectorAll(TXXX_AGE_HOST_SELECTORS).forEach((host) => {
      roots.push(host);
      if (host.shadowRoot) roots.push(host.shadowRoot);
    });
    return roots;
  }

  function clickTxxxAgeButtonsInRoot(root, selector) {
    let clicked = false;
    root.querySelectorAll(selector).forEach((btn) => {
      const label = (btn.textContent || btn.value || btn.getAttribute('aria-label') || '').trim();
      if (!label || label.length > 100) return;
      if (!TXXX_AGE_BTN_RE.test(label) && !/^18\+?$/.test(label)) return;
      try {
        btn.click();
        clicked = true;
      } catch (_e) {}
    });
    return clicked;
  }

  function clickTxxxAgeButtons() {
    collectTxxxRoots().forEach((root) => {
      if (!clickTxxxAgeButtonsInRoot(root, TXXX_AGE_BTN_SELECTORS)) {
        clickTxxxAgeButtonsInRoot(root, 'a');
      }
    });
  }

  let txxxAgeverifSuccessCalled = false;

  function invokeTxxxAgeverifSuccess() {
    if (txxxAgeverifSuccessCalled) return;
    try {
      if (typeof window.ageverifSuccess !== 'function') return;
      window.ageverifSuccess();
      txxxAgeverifSuccessCalled = true;
    } catch (_e) {}
  }

  function unlockTxxxPage() {
    [document.documentElement, document.body].forEach((el) => {
      if (!el) return;
      el.style.setProperty('overflow', 'auto', 'important');
      el.style.setProperty('height', 'auto', 'important');
      el.style.setProperty('position', 'static', 'important');
      el.style.setProperty('pointer-events', 'auto', 'important');
    });
  }

  function cleanTxxx() {
    injectCSS();
    setTxxxAgeFlags();
    invokeTxxxAgeverifSuccess();
    clickTxxxAgeButtons();
    hideMatches(TXXX_HIDE_SELECTORS);
    unlockTxxxPage();
  }

  const AGEVERIF_HIDE_SELECTORS =
    'iframe[src*="ageverif"], [src*="static.ageverif.com"], [class*="ageverif"], [id*="ageverif"], .modal-age-verification, [class*="modal-age"], age-verification';

  function injectAgeverifPageScript() {
    if (document.documentElement.dataset.agegoAvInjected === '1') return;
    if (!api?.runtime?.getURL) return;
    document.documentElement.dataset.agegoAvInjected = '1';
    const script = document.createElement('script');
    const url = api.runtime.getURL('ageverif-page.js');
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

  function invokeAgeverifCallbacks() {
    if (ageverifCallbacksCalled) return;
    try {
      if (typeof window.ageverifSuccess === 'function') {
        window.ageverifSuccess();
        ageverifCallbacksCalled = true;
        return;
      }
    } catch (_e) {}
    try {
      if (typeof window.ageverifReady === 'function') {
        window.ageverifReady();
        ageverifCallbacksCalled = true;
      }
    } catch (_e) {}
  }

  function lightDeblurAgeverif() {
    [document.documentElement, document.body].forEach((el) => {
      if (!el) return;
      const cs = getComputedStyle(el);
      if (cs.filter && cs.filter.includes('blur')) {
        el.style.setProperty('filter', 'none', 'important');
      }
    });
    document.querySelectorAll('video, img').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.filter && cs.filter.includes('blur')) {
        el.style.setProperty('filter', 'none', 'important');
      }
    });
  }

  function cleanAgeverif() {
    injectCSS();
    injectAgeverifPageScript();
    setTxxxAgeFlags();
    invokeAgeverifCallbacks();
    hideMatches(AGEVERIF_HIDE_SELECTORS);
    unlockTxxxPage();
    lightDeblurAgeverif();
  }

  function resetAgeverifNavState() {
    ageverifCallbacksCalled = false;
  }

  function hookAgeverifNavigation() {
    if (ageverifHistoryHooked) return;
    ageverifHistoryHooked = true;
    const onNav = () => {
      resetAgeverifNavState();
      if (autoEnabled && detectAgeverif()) {
        if (!watchdogActive) activateWatchdog(true);
        cleanAgeverif();
      }
    };
    ['pushState', 'replaceState'].forEach((method) => {
      const orig = history[method];
      if (typeof orig !== 'function') return;
      history[method] = function (...args) {
        const ret = orig.apply(this, args);
        onNav();
        return ret;
      };
    });
    window.addEventListener('popstate', onNav);
    window.addEventListener('hashchange', onNav);
  }

  function startGlobalAgeverifWatch() {
    if (!isListedSite()) return;
    hookAgeverifNavigation();
    if (!ageverifWatchTimer) {
      ageverifWatchTimer = setInterval(() => {
        if (!autoEnabled || !detectAgeverif()) return;
        if (!watchdogActive) activateWatchdog(true);
        cleanAgeverif();
      }, 700);
    }
    if (!ageverifObserver) {
      ageverifObserver = new MutationObserver(() => {
        if (!autoEnabled || !detectAgeverif()) return;
        if (!watchdogActive) activateWatchdog(true);
        cleanAgeverif();
      });
      ageverifObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'src'],
      });
    }
  }

  const SUNPORNO_HIDE_SELECTORS =
    '#age-verification-overlay, [id*="age-verif"], [class*="age-verif"], [class*="age_verif"]';

  function hideSunpornoViewportVeils() {
    document.querySelectorAll('.overlay, [class*="overlay"], [class*="veil"], [class*="blur"]').forEach((el) => {
      if (el.closest('.player, .video-player, .video, #player, .jwplayer, video')) return;
      const tag = `${el.id} ${el.className}`.toLowerCase();
      if (!/(?:age|verif|blur|veil|gate|consent|adult|18)/.test(tag)) return;
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'absolute') return;
      const r = el.getBoundingClientRect();
      if (r.width < window.innerWidth * 0.85 || r.height < window.innerHeight * 0.85) return;
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('filter', 'none', 'important');
    });
  }

  function unlockSunpornoPage() {
    const roots = [
      document.documentElement,
      document.body,
      ...document.querySelectorAll('#wrapper, .wrapper, main, .container'),
    ];
    document.querySelectorAll('div, section, main').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.filter.includes('blur') || cs.backdropFilter.includes('blur')) roots.push(el);
    });
    roots.forEach((el) => {
      if (!el) return;
      el.style.setProperty('filter', 'none', 'important');
      el.style.setProperty('backdrop-filter', 'none', 'important');
      el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      el.style.setProperty('overflow', 'auto', 'important');
      el.style.setProperty('pointer-events', 'auto', 'important');
    });
  }

  function cleanPunishworld() {
    try {
      const key = 'age-allow-punishworld-com';
      const base = '; path=/; max-age=31536000; domain=.punishworld.com; SameSite=Lax';
      document.cookie = key + '=1' + base;
      document.cookie = 'abn_age_verified=1' + base;
      localStorage.setItem(key, '1');
      sessionStorage.setItem(key, '1');
    } catch (_e) {}
    injectCSS();
    document.getElementById('abn-cz-visual-rules')?.remove();
    document.querySelectorAll(
      '.abn-age-badge, .abn-age-badge-tags, .abn-age-player-gate, .abn-age-banner, .abn-age-overlay, [class*="abn-age-banner"], [class*="abn-age-overlay"]'
    ).forEach((el) => el.remove());
    document.querySelectorAll(
      'video.xp-Player-video, .xp-Player-video, .xp-Player-videoPreview, .xp-Player-poster, .video-img, .img-actor-vid, .playlist-thumbnail, .xp-Video--related, .video-preview, .mobile-cat-img'
    ).forEach((el) => {
      el.style.setProperty('filter', 'none', 'important');
      el.style.setProperty('-webkit-filter', 'none', 'important');
    });
  }

  // Generic ABN (AgeGo "age-by-nosotros", KolorTube theme): darknessporn.com etc.
  // The only real client-side unlock is the abn_age_verified=1 cookie (+ age-allow-<slug>),
  // to set at document_start. Here: safety net (DOM cleanup + deblur + ads).
  function cleanAbn() {
    try {
      setAgeVerifiedCookies('');
    } catch (_e) {}
    injectCSS();
    document.getElementById('abn-cz-visual-rules')?.remove();
    document.querySelectorAll(
      '.abn-age-badge, .abn-age-badge-tags, .abn-age-player-gate, .abn-age-banner, .abn-age-overlay, [class*="abn-age-banner"], [class*="abn-age-overlay"]'
    ).forEach((el) => el.remove());
    document.querySelectorAll(
      'video.xp-Player-video, .xp-Player-video, .xp-Player-videoWrapper, .xp-Player-poster, .xp-Player-videoPreview, .video-img, .img-actor-vid, .playlist-thumbnail, .xp-Video--related, .video-preview, .mobile-cat-img'
    ).forEach((el) => {
      el.style.setProperty('filter', 'none', 'important');
      el.style.setProperty('-webkit-filter', 'none', 'important');
      el.style.setProperty('backdrop-filter', 'none', 'important');
    });
    cleanAds();
  }

  function cleanSunporno() {
    injectCSS();
    hideMatches(SUNPORNO_HIDE_SELECTORS);
    hideSunpornoViewportVeils();
    unlockSunpornoPage();
  }

  function cleanJacquie() {
    try {
      document.cookie = 'dscl=1; path=/; max-age=31536000';
    } catch (_e) {}
    const enterBtn = document.querySelector('.disclaimer__btn--enter');
    if (enterBtn) { try { enterBtn.click(); } catch (_e) {} }
    hideMatches('custom-disclaimer.disclaimer, .disclaimer__container, .disclaimer__btns, #disclaimer, .disclaimer-wrapper');
    document.documentElement.classList.remove('my18pass-blur');
  }

  function cleanStripchat() {
    try {
      const maxAge = 31536000;
      document.cookie = `18PlusGenderSelected=1; path=/; max-age=${maxAge}`;
      document.cookie = `isAgeVerified=1; path=/; max-age=${maxAge}`;
    } catch (_e) {}
    const accept = document.querySelector('.btn-visitors-agreement-accept');
    if (accept) { try { accept.click(); } catch (_e) {} }
    hideMatches(
      '#agreement-root, .visitors-agreement-modal, .full-cover.modal-wrapper.visitors-agreement-modal, [data-testid="CookiesReminder"], #CookiesReminder, .cookies-banner'
    );
  }

  function cleanGate18() {
    try {
      const maxAge = 31536000;
      document.cookie = `age_verified=1; path=/; max-age=${maxAge}`;
      document.cookie = `ageVerified=1; path=/; max-age=${maxAge}`;
      document.cookie = `age_check=1; path=/; max-age=${maxAge}`;
      document.cookie = `ageVerification=1; path=/; max-age=${maxAge}`;
      document.cookie = `ageGateDetails=1; path=/; max-age=${maxAge}`;
    } catch (_e) {}
    hideMatches(GATE18_SELECTORS);
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.body?.style.setProperty('overflow', 'auto', 'important');
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
    if (activeProfiles.includes('lebonporn')) cleanLebonporn();
    if (activeProfiles.includes('tukif')) cleanTukif();
    if (activeProfiles.includes('tkn')) cleanTkn();
    if (activeProfiles.includes('txxx')) cleanTxxx();
    if (activeProfiles.includes('sunporno')) cleanSunporno();
    if (activeProfiles.includes('punishworld')) cleanPunishworld();
    if (activeProfiles.includes('abn')) cleanAbn();
    if (activeProfiles.includes('jacquie')) cleanJacquie();
    if (activeProfiles.includes('stripchat')) cleanStripchat();
    if (activeProfiles.includes('gate18')) cleanGate18();
    if (activeProfiles.includes('ageverif') || detectAgeverif()) cleanAgeverif();

    cleanAds();

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
        if (autoEnabled && watchdogActive) {
          cleanAds();
          if (hasThreat()) {
            runCleanup();
            injectCSS();
          }
        }
      }, FALLBACK_INTERVAL_MS);
    }
  }

  function shouldActivate(forceDetect) {
    if (forceDetect) return true;
    // Only sites from the list are handled.
    return isListedSite();
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

    if (isTknHost() && autoEnabled) cleanTkn();
    if (isTxxxHost() && autoEnabled) cleanTxxx();
    if (isSunpornoHost() && autoEnabled) cleanSunporno();
    if (isJacquieHost() && autoEnabled) cleanJacquie();
    if (isStripchatHost() && autoEnabled) cleanStripchat();
    if (isGate18Host() && autoEnabled) cleanGate18();

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
      tknDetected: detectTkn(),
      txxxDetected: detectTxxx(),
      sunpornoDetected: detectSunporno(),
      jacquieDetected: detectJacquie(),
      stripchatDetected: detectStripchat(),
      gate18Detected: detectGate18(),
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
      tknDetected: detectTkn(),
      txxxDetected: detectTxxx(),
      sunpornoDetected: detectSunporno(),
      jacquieDetected: detectJacquie(),
      stripchatDetected: detectStripchat(),
      gate18Detected: detectGate18(),
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

    if (isListedSite()) {
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
          if (!isListedSite()) return;
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
        if (isLebonpornHost() && autoEnabled) {
          cleanLebonporn();
        }
        if (isTukifHost() && autoEnabled) {
          cleanTukif();
        }
        if (isTknHost() && autoEnabled) cleanTkn();
        if (isTxxxHost() && autoEnabled) cleanTxxx();
        if (isSunpornoHost() && autoEnabled) cleanSunporno();
        if (isJacquieHost() && autoEnabled) cleanJacquie();
        if (isStripchatHost() && autoEnabled) cleanStripchat();
        if (isGate18Host() && autoEnabled) cleanGate18();
        if (isAbnHost() && autoEnabled) cleanAbn();
        if (autoEnabled && detectAgeverif()) cleanAgeverif();
      }
    });

    startGlobalAgeverifWatch();
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
          if (isListedSite()) {
            activateWatchdog(true);
            if (!isChaturbateHost()) runCleanup();
          }
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
