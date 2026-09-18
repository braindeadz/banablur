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
    'fr.xvideos.com': ['xvideos', 'agego'],
    'xvideos.es': ['xvideos', 'agego'],
    'www.xvideos.es': ['xvideos', 'agego'],
    'xnxx.com': ['xvideos', 'agego'],
    'www.xnxx.com': ['xvideos', 'agego'],
    'xnxx.es': ['xvideos', 'agego'],
    'www.xnxx.es': ['xvideos', 'agego'],
    'xvideos.red': ['xvideos'],
    'www.xvideos.red': ['xvideos'],
    'xhamster.com': ['xhamster'],
    'www.xhamster.com': ['xhamster'],
    'fra.xhamster.com': ['xhamster'],
    'ge.xhamster.com': ['xhamster'],
    'ita.xhamster.com': ['xhamster'],
    'nl.xhamster.com': ['xhamster'],
    'xhamster.desi': ['xhamster'],
    'www.xhamster.desi': ['xhamster'],
    'xhamsterlive.com': ['xhamsterlive'],
    'www.xhamsterlive.com': ['xhamsterlive'],
    'faphouse.com': ['faphouse'],
    'www.faphouse.com': ['faphouse'],
    'chaturbate.com': ['chaturbate'],
    'www.chaturbate.com': ['chaturbate'],
    'pornhub.com': ['pornhub'],
    'www.pornhub.com': ['pornhub'],
    'fr.pornhub.com': ['pornhub'],
    'rt.pornhub.com': ['pornhub'],
    'pornhubpremium.com': ['pornhub'],
    'www.pornhubpremium.com': ['pornhub'],
    'fr.pornhubpremium.com': ['pornhub'],
    'tube8.com': ['pornhub'],
    'www.tube8.com': ['pornhub'],
    'tnaflix.com': ['agego'],
    'www.tnaflix.com': ['agego'],
    'moviefap.com': ['agego'],
    'www.moviefap.com': ['agego'],
    'pornone.com': ['agego'],
    'www.pornone.com': ['agego'],
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
    'eporner.com': ['eporner'],
    'www.eporner.com': ['eporner'],
    'sunporno.com': ['sunporno'],
    'www.sunporno.com': ['sunporno'],
    'jacquieetmicheltv.net': ['jacquie'],
    'www.jacquieetmicheltv.net': ['jacquie'],
    'jacquieetmichel.net': ['jacquie'],
    'www.jacquieetmichel.net': ['jacquie'],
    'youporn.com': ['aylo'],
    'www.youporn.com': ['aylo'],
    'fr.youporn.com': ['aylo'],
    'redtube.com': ['aylo'],
    'www.redtube.com': ['aylo'],
    'porntube.com': ['porntube'],
    'www.porntube.com': ['porntube'],
    'porn.com': ['porncom'],
    'www.porn.com': ['porncom'],
    'stripchat.com': ['stripchat'],
    'www.stripchat.com': ['stripchat'],
    'fr.stripchat.com': ['stripchat'],
    'bongacams.com': ['bongacams'],
    'www.bongacams.com': ['bongacams'],
    'fr.bongacams.com': ['bongacams'],
    'livejasmin.com': ['livejasmin'],
    'www.livejasmin.com': ['livejasmin'],
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
#disclaimer_parent_wrapper, #disclaimer_parent_wrapper .disclaimer_container, #disclaimer_parent_wrapper .disclaimer_wrapper, .disclaimer_parent_wrapper, .sfw_disclaimer_wrapper, .disclaimer_overlay, #preview_disclaimer_parent_wrapper, #birth_month, #birth_day, #birth_year, .agepass_check, .agechecker, .sfw_video_poster, .img_18plus_wrapper, .blursfw_poster, iframe[src*="ageverif"], [id*="ageverif"], [class*="ageverif"] { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html.img-blured img, html.img-blured video, html.img-blured iframe, .img-blured, .img-blured-small, .main_wrapper.img-blured, .video_iframe_container, iframe[src*="videos.tukif.porn"] { filter: none !important; }
.blurmyass, .img_18plus, .video_action_buttons .main_video_page_buttons { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* AGEGO extra TNAFlix/MovieFap */
#video-player-container, #preroll-container, .plyr, .plyr__video-wrapper, .plyr__control, video, object { filter: none !important; backdrop-filter: none !important; }
#agego-verify-frame { display: none !important; }

/* TUBE8 */
#ageDisclaimerMainBG, #ageDisclaimerWrapper, #ageDisclaimerTitle, #underAgeWrapper, .age-disclaimer-modal { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html.showAgeDisclaimer, html.showAgeDisclaimer body { overflow: auto !important; }

/* AYLO YouPorn/RedTube — overlay seulement, pas le catalogue serveur */
link[href*="age-wall"] + *, [class*="AgeWall"], .age-wall, [class*="age-wall"] { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* JACQUIE */
custom-disclaimer.disclaimer, .disclaimer__container, .disclaimer__btns, #disclaimer, .disclaimer-wrapper { display: none !important; pointer-events: none !important; visibility: hidden !important; }
html.my18pass-blur, html.my18pass-blur body, html.my18pass-blur img, html.my18pass-blur video { filter: none !important; }

/* TXXX family */
age-verification, age-verification-uk, age-verification-face, .modal-age-verification, .modal.modal-ageverification, .overlay-modal, .cookie-notify { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* EPORNER */
#ageverifybox, #ageverifybox-inner, #simplemodal-overlay, .simplemodal-overlay, .simplemodal-container { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* SUNPORNO */
#age-verification-overlay { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* PORNTUBE */
[data-controller="click-verify"], [data-modal-target="modal"] { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* PORN.COM */
.nc { filter: none !important; }
.modal.age, .age-modal { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* STRIPCHAT */
#agreement-root, .visitors-agreement-modal, .full-cover.modal-wrapper.visitors-agreement-modal, [data-testid="CookiesReminder"], #CookiesReminder, .cookies-banner { display: none !important; pointer-events: none !important; visibility: hidden !important; }

/* BONGACAMS */
.verification_wrapper, .verification_wrapper.__yoti, .yoti_warning_popup, .warning_popup[data-type="18_plus"], .popup_18_plus, .cookies_bar { display: none !important; pointer-events: none !important; visibility: hidden !important; }
body.bd_18plus { overflow: auto !important; height: auto !important; }

/* LIVEJASMIN — NE PAS cacher #overlay ni #fi-18-22 */
#consent_modal.over-18, #consent_modal.is-non-adult, #consent_modal { display: none !important; pointer-events: none !important; visibility: hidden !important; }
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
  let tukifClickGuardBound = false;
  let tukifNavGuardBound = false;
  let tukifHistoryHooked = false;
  let lastTukifPath = '';
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

  function isPornhubHost() {
    return /(^|\.)pornhub(premium)?\.com$/i.test(getHostname());
  }

  function isTube8Host() {
    return /(^|\.)tube8\.com$/i.test(getHostname());
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
      /(^|\.)(txxx|hclips|upornia|hdzog|voyeurhit|hotmovs|ooxxx|manysex|tubepornclassic|pornzog|thegay|shemalez)\.com$/i.test(
        getHostname()
      ) ||
      /(^|\.)tporn\.(xxx|tube)$/i.test(getHostname()) ||
      /(^|\.)desi-porn\.tube$/i.test(getHostname())
    );
  }

  function isEpornerHost() {
    return /(^|\.)eporner\.com$/i.test(getHostname());
  }

  function isSunpornoHost() {
    return /(^|\.)sunporno\.com$/i.test(getHostname());
  }

  function isJacquieHost() {
    return /(^|\.)jacquieetmichel(tv)?\.net$/i.test(getHostname());
  }

  function isAyloHost() {
    return /(^|\.)(youporn|redtube)\.com$/i.test(getHostname());
  }

  function isPorntubeHost() {
    return /(^|\.)porntube\.com$/i.test(getHostname());
  }

  function isPorncomHost() {
    return /(^|\.)porn\.com$/i.test(getHostname());
  }

  function isStripchatHost() {
    return /(^|\.)stripchat\.com$/i.test(getHostname());
  }

  function isBongacamsHost() {
    return /(^|\.)bongacams\.com$/i.test(getHostname());
  }

  function isLivejasminHost() {
    return /(^|\.)livejasmin\.com$/i.test(getHostname());
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
    if (isPornhubHost() || isTube8Host()) return true;
    return !!(
      document.querySelector('.ageDisclaimer') ||
      document.body?.classList.contains('sfw-page') ||
      document.querySelector('.buttonOver18') ||
      document.getElementById('ageDisclaimerMainBG') ||
      document.getElementById('accessButton')
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

  function detectEporner() {
    if (isEpornerHost()) return true;
    return !!document.getElementById('ageverifybox');
  }

  function detectSunporno() {
    if (isSunpornoHost()) return true;
    return !!document.getElementById('age-verification-overlay');
  }

  function detectJacquie() {
    if (isJacquieHost()) return true;
    return !!(
      document.querySelector('custom-disclaimer.disclaimer') ||
      document.getElementById('disclaimer') ||
      document.documentElement.classList.contains('my18pass-blur')
    );
  }

  function detectAylo() {
    if (isAyloHost()) return true;
    return !!(
      document.querySelector('link[href*="age-wall"]') ||
      document.body?.classList.contains('yp') ||
      document.body?.classList.contains('rt')
    );
  }

  function detectPorntube() {
    if (isPorntubeHost()) return true;
    return !!document.querySelector('[data-controller="click-verify"]');
  }

  function detectPorncom() {
    return isPorncomHost();
  }

  function detectStripchat() {
    if (isStripchatHost()) return true;
    return !!document.getElementById('agreement-root');
  }

  function detectBongacams() {
    if (isBongacamsHost()) return true;
    return !!(
      document.querySelector('.popup_18_plus') ||
      document.querySelector('.verification_wrapper.__yoti')
    );
  }

  function detectLivejasmin() {
    if (isLivejasminHost()) return true;
    return !!document.querySelector('#consent_modal.over-18');
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
    if (detectTkn()) profiles.add('tkn');
    if (detectTxxx()) profiles.add('txxx');
    if (detectEporner()) profiles.add('eporner');
    if (detectSunporno()) profiles.add('sunporno');
    if (detectJacquie()) profiles.add('jacquie');
    if (detectAylo()) profiles.add('aylo');
    if (detectPorntube()) profiles.add('porntube');
    if (detectPorncom()) profiles.add('porncom');
    if (detectStripchat()) profiles.add('stripchat');
    if (detectBongacams()) profiles.add('bongacams');
    if (detectLivejasmin()) profiles.add('livejasmin');
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
      isOverlayVisible('.overlay-modal')
    );
  }

  function hasEpornerThreat() {
    return !!(isOverlayVisible('#ageverifybox') || isOverlayVisible('.simplemodal-overlay'));
  }

  function hasSunpornoThreat() {
    return isOverlayVisible('#age-verification-overlay');
  }

  function hasJacquieThreat() {
    return !!(
      isOverlayVisible('custom-disclaimer.disclaimer') ||
      isOverlayVisible('#disclaimer') ||
      document.documentElement.classList.contains('my18pass-blur')
    );
  }

  function hasAyloThreat() {
    return !!(
      document.querySelector('link[href*="age-wall"]') ||
      isOverlayVisible('.age-wall') ||
      isOverlayVisible('[class*="AgeWall"]')
    );
  }

  function hasPorntubeThreat() {
    return isOverlayVisible('[data-controller="click-verify"]');
  }

  function hasPorncomThreat() {
    return !!(isOverlayVisible('.modal.age') || isOverlayVisible('.age-modal'));
  }

  function hasStripchatThreat() {
    return !!(
      isOverlayVisible('#agreement-root') ||
      isOverlayVisible('.visitors-agreement-modal')
    );
  }

  function hasBongacamsThreat() {
    return !!(
      isOverlayVisible('.popup_18_plus') ||
      isOverlayVisible('.verification_wrapper.__yoti') ||
      isOverlayVisible('.verification_wrapper')
    );
  }

  function hasLivejasminThreat() {
    return !!(
      isOverlayVisible('#consent_modal.over-18') ||
      isOverlayVisible('#consent_modal.is-non-adult') ||
      isOverlayVisible('#consent_modal')
    );
  }

  function hasPornhubThreat() {
    return !!(
      isOverlayVisible('.ageDisclaimer') ||
      isOverlayVisible('#ageDisclaimerMainBG') ||
      isOverlayVisible('#ageDisclaimerWrapper')
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
      hasTukifThreat() ||
      hasTknThreat() ||
      hasTxxxThreat() ||
      hasEpornerThreat() ||
      hasSunpornoThreat() ||
      hasJacquieThreat() ||
      hasAyloThreat() ||
      hasPorntubeThreat() ||
      hasPorncomThreat() ||
      hasStripchatThreat() ||
      hasBongacamsThreat() ||
      hasLivejasminThreat() ||
      hasPornhubThreat()
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

  function cleanPornhub() {
    // Gate d'age FR: pose des cookies + clique le bouton 18+, puis masque le
    // modal. NB: le catalogue hardcore reste bloque cote serveur (mode SFW geo
    // France, isSfw=1) -> non contournable par une extension (VPN requis).
    try {
      const maxAge = 60 * 60 * 24 * 30;
      document.cookie = `accessAgeDisclaimerPH=2; path=/; max-age=${maxAge}`;
      document.cookie = `accessPH=1; path=/; max-age=${maxAge}`;
      document.cookie = `cookieConsent=3; path=/; max-age=${maxAge}`;
      document.cookie = `showAgeDisclaimer=1; path=/; max-age=${maxAge}`;
    } catch (_e) {}
    const over18 = document.querySelector('.buttonOver18, .js-closeAgeModal, .js-av-cta, #accessButton');
    if (over18 && over18.offsetParent !== null) { try { over18.click(); } catch (_e) {} }
    document.querySelectorAll('.ageDisclaimer, .modalMTubes.ageDisclaimer').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });
    hideMatches('#ageDisclaimerMainBG, #ageDisclaimerWrapper');
    document.documentElement.classList.remove('showAgeDisclaimer');
    document.body?.classList.remove('isOpenMTubes');
    if (isPornhubHost()) {
      injectPornhubPageScript();
      document.dispatchEvent(new CustomEvent('agego-ph-unlock'));
    }
  }

  function cleanTkn() {
    injectCSS();
    dismissTukifDisclaimer();
    fixTukifBlur();
  }

  function cleanTxxx() {
    hideMatches(
      'age-verification, age-verification-uk, age-verification-face, .modal-age-verification, .modal.modal-ageverification, .overlay-modal, .cookie-notify'
    );
    try {
      localStorage.removeItem('_agvface');
    } catch (_e) {}
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.body?.style.setProperty('overflow', 'auto', 'important');
  }

  function cleanEporner() {
    hideMatches('#ageverifybox, #ageverifybox-inner, #simplemodal-overlay, .simplemodal-overlay, .simplemodal-container');
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.body?.style.setProperty('overflow', 'auto', 'important');
  }

  function cleanSunporno() {
    hideMatches('#age-verification-overlay');
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

  function cleanAylo() {
    hideMatches('[class*="AgeWall"], .age-wall, [class*="age-wall"]');
    document.querySelectorAll('link[href*="age-wall"]').forEach((link) => {
      const next = link.nextElementSibling;
      if (next) {
        next.style.setProperty('display', 'none', 'important');
        next.style.setProperty('pointer-events', 'none', 'important');
        next.style.setProperty('visibility', 'hidden', 'important');
      }
    });
  }

  function cleanPorntube() {
    hideMatches('[data-controller="click-verify"], [data-modal-target="modal"]');
  }

  function cleanPorncom() {
    hideMatches('.modal.age, .age-modal');
    document.querySelectorAll('.nc').forEach((el) => {
      el.style.setProperty('filter', 'none', 'important');
    });
  }

  function cleanStripchat() {
    const accept = document.querySelector('.btn-visitors-agreement-accept');
    if (accept) { try { accept.click(); } catch (_e) {} }
    hideMatches(
      '#agreement-root, .visitors-agreement-modal, .full-cover.modal-wrapper.visitors-agreement-modal, [data-testid="CookiesReminder"], #CookiesReminder, .cookies-banner'
    );
  }

  function cleanBongacams() {
    hideMatches(
      '.verification_wrapper, .verification_wrapper.__yoti, .yoti_warning_popup, .warning_popup[data-type="18_plus"], .popup_18_plus, .cookies_bar'
    );
    document.body?.classList.remove('bd_18plus');
    document.body?.style.setProperty('overflow', 'auto', 'important');
    document.body?.style.setProperty('height', 'auto', 'important');
  }

  function cleanLivejasmin() {
    hideMatches('#consent_modal.over-18, #consent_modal.is-non-adult, #consent_modal');
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
    if (activeProfiles.includes('tkn')) cleanTkn();
    if (activeProfiles.includes('txxx')) cleanTxxx();
    if (activeProfiles.includes('eporner')) cleanEporner();
    if (activeProfiles.includes('sunporno')) cleanSunporno();
    if (activeProfiles.includes('jacquie')) cleanJacquie();
    if (activeProfiles.includes('aylo')) cleanAylo();
    if (activeProfiles.includes('porntube')) cleanPorntube();
    if (activeProfiles.includes('porncom')) cleanPorncom();
    if (activeProfiles.includes('stripchat')) cleanStripchat();
    if (activeProfiles.includes('bongacams')) cleanBongacams();
    if (activeProfiles.includes('livejasmin')) cleanLivejasmin();

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

    if (isTknHost() && autoEnabled) cleanTkn();
    if (isTxxxHost() && autoEnabled) cleanTxxx();
    if (isEpornerHost() && autoEnabled) cleanEporner();
    if (isSunpornoHost() && autoEnabled) cleanSunporno();
    if (isJacquieHost() && autoEnabled) cleanJacquie();
    if (isAyloHost() && autoEnabled) cleanAylo();
    if (isPorntubeHost() && autoEnabled) cleanPorntube();
    if (isPorncomHost() && autoEnabled) cleanPorncom();
    if (isStripchatHost() && autoEnabled) cleanStripchat();
    if (isBongacamsHost() && autoEnabled) cleanBongacams();
    if (isLivejasminHost() && autoEnabled) cleanLivejasmin();
    if (isTube8Host() && autoEnabled) cleanPornhub();

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
      epornerDetected: detectEporner(),
      sunpornoDetected: detectSunporno(),
      jacquieDetected: detectJacquie(),
      ayloDetected: detectAylo(),
      porntubeDetected: detectPorntube(),
      porncomDetected: detectPorncom(),
      stripchatDetected: detectStripchat(),
      bongacamsDetected: detectBongacams(),
      livejasminDetected: detectLivejasmin(),
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
      epornerDetected: detectEporner(),
      sunpornoDetected: detectSunporno(),
      jacquieDetected: detectJacquie(),
      ayloDetected: detectAylo(),
      porntubeDetected: detectPorntube(),
      porncomDetected: detectPorncom(),
      stripchatDetected: detectStripchat(),
      bongacamsDetected: detectBongacams(),
      livejasminDetected: detectLivejasmin(),
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
        if (isTknHost() && autoEnabled) cleanTkn();
        if (isTxxxHost() && autoEnabled) cleanTxxx();
        if (isEpornerHost() && autoEnabled) cleanEporner();
        if (isSunpornoHost() && autoEnabled) cleanSunporno();
        if (isJacquieHost() && autoEnabled) cleanJacquie();
        if (isAyloHost() && autoEnabled) cleanAylo();
        if (isPorntubeHost() && autoEnabled) cleanPorntube();
        if (isPorncomHost() && autoEnabled) cleanPorncom();
        if (isStripchatHost() && autoEnabled) cleanStripchat();
        if (isBongacamsHost() && autoEnabled) cleanBongacams();
        if (isLivejasminHost() && autoEnabled) cleanLivejasmin();
        if (isTube8Host() && autoEnabled) cleanPornhub();
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
