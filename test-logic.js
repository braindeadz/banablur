/**

 * Tests unitaires — node test-logic.js

 */



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
    'teen21.com': ['txxx'],
    'www.teen21.com': ['txxx'],
    'vr-porn.tube': ['txxx'],
    'www.vr-porn.tube': ['txxx'],
    'eporner.com': ['eporner'],
    'www.eporner.com': ['eporner'],
    'sunporno.com': ['sunporno'],
    'www.sunporno.com': ['sunporno'],
    'jacquieetmicheltv.net': ['jacquie'],
    'www.jacquieetmicheltv.net': ['jacquie'],
    'jacquieetmichel.net': ['jacquie'],
    'www.jacquieetmichel.net': ['jacquie'],
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



function detectXvideosHost(hostname) {

  return /(^|\.)(xvideos|xnxx)\.(com|es|red)$/i.test(hostname);

}



function detectXhamsterHost(hostname) {

  return /(^|\.)xhamster\.(com|desi)$/i.test(hostname);

}

function extractContentSiteProfiles(src) {
  const m = src.match(/const SITE_PROFILES = \{([\s\S]*?)\n  \};/);
  if (!m) return {};
  try {
    return Function('"use strict"; return ({' + m[1] + '});')();
  } catch (_e) {
    return {};
  }
}

function contentHostHasProfile(contentProfiles, contentSrc, host, profile) {
  const candidates = [host];
  if (!host.startsWith('www.')) candidates.push('www.' + host);
  for (const key of candidates) {
    if (Array.isArray(contentProfiles[key]) && contentProfiles[key].includes(profile)) return true;
  }
  const block = (contentSrc.match(/const SITE_PROFILES = \{[\s\S]*?\n  \};/) || [''])[0];
  const hostRe = host.replace(/\./g, '\\.');
  return new RegExp(`['"]((www\\.)?${hostRe})['"]\\s*:\\s*\\[[^\\]]*['"]${profile}['"]`).test(block);
}

function extractFnBody(src, name) {
  return (src.match(new RegExp('function ' + name + '\\(\\)[\\s\\S]*?\\n  \\}')) || [''])[0];
}



let passed = 0;

let failed = 0;



function assert(condition, msg) {

  if (condition) {

    passed++;

    console.log('  OK:', msg);

  } else {

    failed++;

    console.error('  FAIL:', msg);

  }

}



console.log('Test 1: SITE_PROFILES');

assert(SITE_PROFILES['deviants.com'].includes('agego'), 'deviants -> agego');

assert(SITE_PROFILES['www.xvideos.com'].includes('xvideos'), 'xvideos -> xvideos');

assert(SITE_PROFILES['www.xhamster.com'].includes('xhamster'), 'xhamster -> xhamster');
assert(SITE_PROFILES['xvideos.es'].includes('xvideos'), 'xvideos.es -> xvideos');
assert(SITE_PROFILES['xnxx.es'].includes('xvideos'), 'xnxx.es -> xvideos');
assert(SITE_PROFILES['xhamster.desi'].includes('xhamster'), 'xhamster.desi -> xhamster');
assert(SITE_PROFILES['tnaflix.com'].includes('agego'), 'tnaflix -> agego');
assert(SITE_PROFILES['porndig.com'].includes('tkn'), 'porndig -> tkn');
assert(SITE_PROFILES['txxx.com'].includes('txxx'), 'txxx -> txxx');
assert(SITE_PROFILES['teen21.com'].includes('txxx'), 'teen21 -> txxx');
assert(SITE_PROFILES['vr-porn.tube'].includes('txxx'), 'vr-porn.tube -> txxx');
assert(SITE_PROFILES['eporner.com'].includes('eporner'), 'eporner -> eporner');
assert(SITE_PROFILES['jacquieetmicheltv.net'].includes('jacquie'), 'jacquieetmicheltv -> jacquie');
assert(SITE_PROFILES['stripchat.com'].includes('stripchat'), 'stripchat -> stripchat');
assert(SITE_PROFILES['bongacams.com'].includes('bongacams'), 'bongacams -> bongacams');
assert(SITE_PROFILES['livejasmin.com'].includes('livejasmin'), 'livejasmin -> livejasmin');
assert(SITE_PROFILES['sxyprn.com'].includes('tkn'), 'sxyprn -> tkn');
assert(SITE_PROFILES['sunporno.com'].includes('sunporno'), 'sunporno -> sunporno');
assert(SITE_PROFILES['pornone.com'].includes('agego'), 'pornone -> agego');



console.log('Test 2: detectXvideosHost');

assert(detectXvideosHost('www.xvideos.com'), 'www.xvideos.com');

assert(detectXvideosHost('xvideos.com'), 'xvideos.com');

assert(detectXvideosHost('www.xnxx.com'), 'www.xnxx.com');

assert(detectXvideosHost('xnxx.com'), 'xnxx.com');
assert(detectXvideosHost('xvideos.es'), 'xvideos.es');
assert(detectXvideosHost('www.xvideos.es'), 'www.xvideos.es');
assert(detectXvideosHost('xnxx.es'), 'xnxx.es');
assert(detectXvideosHost('xvideos.red'), 'xvideos.red');

assert(!detectXvideosHost('google.com'), 'google.com false');



console.log('Test 3: detectXhamsterHost');

assert(detectXhamsterHost('www.xhamster.com'), 'www.xhamster.com');

assert(detectXhamsterHost('xhamster.com'), 'xhamster.com');
assert(detectXhamsterHost('xhamster.desi'), 'xhamster.desi');
assert(detectXhamsterHost('www.xhamster.desi'), 'www.xhamster.desi');

assert(!detectXhamsterHost('xvideos.com'), 'xvideos.com false');



console.log('Test 4: manifest v1.5');

{

  const m = require('./manifest.json');

  assert(m.version === '1.10.9', 'version 1.10.9');
  assert(!!m.web_accessible_resources?.length, 'web_accessible_resources');
  const war = m.web_accessible_resources?.[0]?.resources || [];
  assert(war.includes('hls.min.js'), 'hls.min.js accessible');
  assert((m.permissions || []).includes('downloads'), 'permission downloads');
  assert(!(m.permissions || []).includes('proxy'), 'manifest: pas de permission proxy');
  assert(!(m.permissions || []).includes('tabs'), 'manifest: pas de permission tabs');
  const hostPerms = (m.host_permissions || []).join(' ');
  assert(!/proxyscrape\.com/.test(hostPerms), 'manifest: pas host_permission proxyscrape');
  assert(/xvideos\.com/.test(hostPerms), 'manifest host_permissions: xvideos.com');
  assert(/xnxx\.com/.test(hostPerms), 'manifest host_permissions: xnxx.com');
  assert(/xvideos\.es/.test(hostPerms), 'manifest host_permissions: xvideos.es');
  assert(/xnxx\.es/.test(hostPerms), 'manifest host_permissions: xnxx.es');
  assert(/xvideos\.red/.test(hostPerms), 'manifest host_permissions: xvideos.red');
  const warXvMatchesV110 = ((m.web_accessible_resources || []).find((r) => (r.resources || []).includes('xvideos-page.js'))?.matches || []).join(' ');
  assert(/xvideos\.es/.test(warXvMatchesV110), 'manifest WAR: xvideos.es');
  assert(m.background?.service_worker === 'background.js', 'service worker background.js');

  assert(!!m.icons?.['16'], 'icons racine 16');

  assert(!!m.content_scripts?.find((s) => s.js?.includes('chaturbate.js')), 'script chaturbate separe');
  assert(!!m.content_scripts?.find((s) => s.css?.includes('chaturbate-gate.css')), 'css chaturbate-gate');
  assert(!!m.content_scripts?.[0]?.exclude_matches?.length, 'exclude chaturbate de content.js');

}



console.log('Test 5: content.js contient profils xvideos + xhamster');

{

  const fs = require('fs');

  const path = require('path');

  const src = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert(src.includes('disclaimer_background'), 'cible disclaimer_background');

  assert(src.includes('video_sfw'), 'cible video_sfw');

  assert(src.includes('getXvideosVideoId'), 'extrait id xvideos');
  assert(src.includes('fetchXvideosUrls'), 'fetch embedframe xvideos');
  assert(src.includes('/embedframe/'), 'endpoint embedframe xvideos');
  assert(src.includes('setVideoUrlHigh'), 'parse setVideoUrlHigh');
  assert(src.includes('sfw-playlocked'), 'cible sfw-playlocked');
  assert(src.includes('sfw-click-area'), 'cible sfw-click-area');
  assert(src.includes('fixXvideosThumbnails'), 'deblur miniatures xvideos');
  assert(src.includes('injectXvideosPageScript'), 'injection script page xvideos');
  assert(src.includes('agego-xv-unlock'), 'evenement unlock xvideos');
  assert(src.includes('startXvideosWatchdog'), 'watchdog xvideos');
  assert(src.includes('xnxx'), 'content: support xnxx (famille xvideos)');
  assert(src.includes('video[.-]'), 'content: chemin video token xnxx/xvideos');

  assert(src.includes('cleanXhamster'), 'fonction cleanXhamster');
  assert(src.includes('cleanFaphouse'), 'fonction cleanFaphouse');
  assert(src.includes('cleanChaturbate'), 'fonction cleanChaturbate');
  assert(src.includes('neutralizeChaturbateAgeGate'), 'fonction neutralizeChaturbateAgeGate');
  assert(src.includes('hasChaturbateThreatForStatus'), 'status chaturbate separe');
  assert(src.includes('startChaturbateWatchdog'), 'fonction startChaturbateWatchdog');
  assert(src.includes('tickChaturbate'), 'fonction tickChaturbate');
  assert(src.includes('get_edge_hls_url_ajax'), 'cible get_edge_hls_url_ajax');
  assert(src.includes('/ribw/'), 'cible ribw');
  assert(src.includes('pointer-events'), 'cible pointer-events overlay');
  assert(src.includes('cookie-wall'), 'cible cookie-wall');
  assert(src.includes('snapshot_blurred'), 'cible snapshot_blurred');

  assert(src.includes('xp-sfw'), 'cible xp-sfw');

  assert(src.includes('xh-helper-18-plus'), 'cible xh-helper-18-plus');

  assert(src.includes('removeProperty(\'filter\')'), 'retire blur inline');

  assert(src.includes('attributeFilter'), 'watchdog style attr');

  const cb = fs.readFileSync(path.join(__dirname, 'chaturbate.js'), 'utf8');
  assert(cb.includes('getNextRoomSlug'), 'chaturbate getNextRoomSlug');
  assert(cb.includes('getRoomSlugFromPath'), 'chaturbate getRoomSlugFromPath');
  assert(cb.includes('injectCSS'), 'chaturbate injectCSS backup');
  assert(cb.includes('chaturbate-page.js'), 'chaturbate page script inject');
  assert(cb.includes('hls.min.js'), 'chaturbate hls bundle inject');
  assert(cb.includes('startGateObserver'), 'chaturbate gate observer');
  assert(cb.includes('/riw/'), 'deblur grille native');
  assert(!cb.includes('agego-app'), 'chaturbate: pas agego-app');
  assert(!cb.includes('handleRoomAction'), 'chaturbate: pas handleRoomAction');
  assert(!cb.includes('syncCustomCards'), 'chaturbate: pas syncCustomCards');
  assert(!cb.includes('createCustomApp'), 'chaturbate: pas createCustomApp');
  assert(!cb.includes('startCustomApp'), 'chaturbate: pas startCustomApp');
  assert(cb.includes('entrance_terms_overlay'), 'chaturbate: masque entrance_terms_overlay');

  const cbPage = fs.readFileSync(path.join(__dirname, 'chaturbate-page.js'), 'utf8');
  assert(cbPage.includes('agego-live-overlay'), 'overlay live autonome');
  assert(!cbPage.includes('onRoomClick'), 'chaturbate-page: pas onRoomClick');
  assert(!cbPage.includes('videojs'), 'pas de dependance videojs');
  assert(cbPage.includes('startWatchdog'), 'watchdog live');
  assert(cbPage.includes('unlockStream'), 'chaturbate-page unlockStream');
  assert(cbPage.includes('silentReload'), 'refresh flux discret');
  assert(cbPage.includes('isBlackFrame'), 'detection image noire');
  assert(fs.existsSync(path.join(__dirname, 'hls.min.js')), 'fichier hls.min.js present');

  const xvPage = fs.readFileSync(path.join(__dirname, 'xvideos-page.js'), 'utf8');
  assert(xvPage.includes('initHls'), 'xvideos page initialise le lecteur HLS');
  assert(xvPage.includes('showVideoControls'), 'xvideos page barre navigation');
  assert(xvPage.includes('disableCast'), 'xvideos page cast desactive');
  assert(xvPage.includes('disableRemotePlayback'), 'xvideos page remote playback off');
  assert(xvPage.includes('__agegoXvDone'), 'xvideos page flag idempotence init');
  assert(xvPage.includes('MutationObserver'), 'xvideos page observer (pas de re-init en boucle)');
  assert(xvPage.includes('forceVideoVisible'), 'xvideos page force affichage video (anti ecran noir)');
  assert(xvPage.includes('watchPlayback'), 'xvideos page verifie lecture reelle');
  assert(xvPage.includes('forceMaxQuality'), 'xvideos page force la qualite max (1080p HLS)');
  assert(xvPage.includes('use_hlsjs = true'), 'xvideos page utilise le pipeline HLS');
  assert(xvPage.includes('neutralizeSiteBar'), 'xvideos page neutralise la barre custom du site');
  assert(xvPage.includes('stopSfwVideos'), 'xvideos page stoppe le preview SFW');
  assert(xvPage.includes('dismissDisclaimer'), 'xvideos page ferme le disclaimer (anti scroll-to-top)');
  assert(xvPage.includes('disclaimer-enter'), 'xvideos page clique le bouton Enter du disclaimer');
  assert(fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8').includes('disclaimer-enter'), 'content clique le bouton Enter avant suppression');
  assert(xvPage.includes('close_pop'), 'xvideos page utilise l API disclaimer du site');
  assert(xvPage.includes('getToken'), 'xvideos page utilise le token URL pour embedframe');
  assert(xvPage.includes('/video[.-]'), 'xvideos page getToken: chemin /video-TOKEN ou /video.TOKEN');
  assert(xvPage.includes('fetchEmbedframe(getToken())'), 'xvideos page token en priorite, id en secours');
  assert(!xvPage.includes('agego-xv-embedframe'), 'xvideos page: pas d evenement proxy embedframe');
  assert(xvPage.includes('disableSfwLimit'), 'xvideos page desactive la limite SFW (boucle 44s)');
  assert(xvPage.includes('bIsSfwLimited = false'), 'xvideos page coupe bIsSfwLimited');
  assert(xvPage.includes('.buttons-bar'), 'xvideos page masque la barre de boutons du site');
  assert(xvPage.includes('.video-ended-desktop'), 'xvideos page masque l overlay fin de video');
  assert(xvPage.includes('.big-buttons'), 'xvideos page masque le gros bouton central');
  assert(xvPage.includes('.slowseek-info'), 'xvideos page masque le bandeau slowseek');
  assert(!/\.video-pic[^\n]*\)\s*\{[\s\S]{0,120}?e\.remove\(\)/.test(xvPage), 'xvideos page ne supprime plus les .video-pic');
  assert(fs.existsSync(path.join(__dirname, 'xvideos-page.js')), 'fichier xvideos-page.js present');
  assert(xvPage.includes('ensureDownloadButton'), 'xvideos page: bouton de telechargement');
  assert(xvPage.includes('agego-dl-btn'), 'xvideos page: id du bouton flottant');
  assert(xvPage.includes('openDownloadMenu'), 'xvideos page: menu de qualites');
  assert(xvPage.includes('downloadHls'), 'xvideos page: telechargement HLS (concat segments)');
  assert(xvPage.includes('agego-xv-download'), 'xvideos page: evenement telechargement');
  assert(src.includes('agego-xv-download'), 'content relaie l evenement de telechargement');
  assert(fs.existsSync(path.join(__dirname, 'background.js')), 'fichier background.js present');
  const bg = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
  assert(bg.includes('downloads.download'), 'background utilise chrome.downloads');
  assert(!/proxyscrape/i.test(bg), 'background: pas de proxyscrape');
  assert(!bg.includes('proxy:ensure'), 'background: pas de proxy:ensure');
  assert(!bg.includes('xv:embedframe'), 'background: pas de handler proxy embedframe');
  assert(!/buildPacData/.test(bg), 'background: pas de buildPacData');
  assert(!src.includes('agego-xv-embedframe'), 'content: pas d evenement proxy embedframe');
  assert(!src.includes('ensureXhamsterProxy'), 'content: pas de ensureXhamsterProxy');
  assert(!src.includes('agego-xh-proxy-state'), 'content: pas d evenement agego-xh-proxy-state');
  const contentProfiles = extractContentSiteProfiles(src);
  for (const removedHost of ['youporn.com', 'ixxx.com', 'porntrex.com', '4tube.com', 'pornmd.com']) {
    assert(
      !contentHostHasProfile(contentProfiles, src, removedHost, 'aylo') &&
        !contentHostHasProfile(contentProfiles, src, removedHost, 'gate18'),
      `content.js SITE_PROFILES: ${removedHost} absent`
    );
  }
  for (const removedPh of ['pornhub.com', 'fr.pornhub.com', 'pornhubpremium.com', 'tube8.com']) {
    assert(
      !contentHostHasProfile(contentProfiles, src, removedPh, 'pornhub'),
      `content.js SITE_PROFILES: ${removedPh} absent (pornhub retire)`
    );
  }

  assert(fs.existsSync(path.join(__dirname, 'xhamster-page.js')), 'fichier xhamster-page.js present');
  const xhPage = fs.readFileSync(path.join(__dirname, 'xhamster-page.js'), 'utf8');
  assert(xhPage.includes('disableSfw'), 'xhamster page: neutralise le module SFW (coupe temporelle)');
  assert(xhPage.includes('hideAgeOverlays'), 'xhamster page: masque overlay verification age');
  assert(xhPage.includes('fixPlayerBlur'), 'xhamster page: deflou le lecteur video');
  assert(xhPage.includes('hideCookieBanner'), 'xhamster page: masque modale cookies');
  assert(xhPage.includes('injectCookieHideCss'), 'xhamster page: CSS masquage cookies');
  assert(xhPage.includes('tout accepter'), 'xhamster page: bouton cookies FR');
  assert(!/clearInterval\(loopTimer\)/.test(xhPage), 'xhamster page: watchdog permanent (pas de stop 20s)');
  assert(xhPage.includes('setInterval(tick, 500)'), 'xhamster page: tick 500ms');
  assert(src.includes('startXhamsterWatchdog'), 'content: watchdog xhamster');
  assert(src.includes('hideXhamsterCookieModal'), 'content: masque cookies xhamster');
  assert(xhPage.includes('moderationTimestamp'), 'xhamster page: reset moderationTimestamp');
  assert(xhPage.includes('sourceController'), 'xhamster page: lit les URLs via sourceController');
  assert(xhPage.includes('downloadHls'), 'xhamster page: telechargement HLS');
  assert(xhPage.includes('agego-dl-btn'), 'xhamster page: bouton flottant');
  assert(src.includes('injectXhamsterPageScript'), 'content injecte xhamster-page.js');
  assert(src.includes('agego-xh-unlock'), 'content dispatch agego-xh-unlock');
  const mf = require('./manifest.json');
  const warXh = (mf.web_accessible_resources || []).some((r) => (r.resources || []).includes('xhamster-page.js'));
  assert(warXh, 'manifest: xhamster-page.js accessible');

  // fra.xhamster / SFW complet / deblur renforce / bouton SVG
  assert(SITE_PROFILES['fra.xhamster.com'].includes('xhamster'), 'profil fra.xhamster.com');
  assert(xhPage.includes('SFW_NO_LIMIT') && xhPage.includes('999999999'), 'xhamster page: SFW no-limit (grande valeur, pas 0)');
  assert(!/moderationTimestamp = 0\b/.test(xhPage), 'xhamster page: ne remet plus moderationTimestamp a 0');
  assert(xhPage.includes('xh-helper-blurred-background'), 'xhamster page: deblur xh-helper-blurred-background');
  assert(xhPage.includes('mn-thumb__hls-wrapper'), 'xhamster page: deblur backdrop preview HLS');
  assert(xhPage.includes('backdrop-filter'), 'xhamster page: neutralise backdrop-filter');
  assert(xhPage.includes('<svg') && xhPage.includes('Telecharger'), 'xhamster page: bouton avec icone SVG');
  assert(xvPage.includes('<svg'), 'xvideos page: bouton avec icone SVG');
  assert(src.includes('mn-thumb__hls-wrapper') || src.includes('xh-helper-blurred-overlay'), 'content CSS: deblur renforce xhamster');
  assert(!src.includes('cleanPornhub'), 'content: pas de fonction cleanPornhub');
  assert(!src.includes('injectPornhubPageScript'), 'content: n injecte plus pornhub-page.js');
  const warPh = (mf.web_accessible_resources || []).some((r) => (r.resources || []).includes('pornhub-page.js'));
  assert(!warPh, 'manifest: pornhub-page.js WAR retire');
  const warXv = (mf.web_accessible_resources || []).find((r) => (r.resources || []).includes('xvideos-page.js'));
  const warXvMatches = (warXv?.matches || []).join(' ');
  assert(/xnxx\.com/.test(warXvMatches), 'manifest: xvideos-page.js accessible sur xnxx.com');

  const contentSrc = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  assert(contentSrc.includes("dataset.agegoXvDone"), 'content stoppe le dispatch une fois unlock reussi');
  const fixThumbBody = (contentSrc.match(/function fixXvideosThumbnails\(\)[\s\S]*?\n  \}/) || [''])[0];
  assert(!fixThumbBody.includes('.remove()'), 'fixXvideosThumbnails ne supprime plus de noeuds');

  assert(SITE_PROFILES['lebon.porn'].includes('lebonporn'), 'profil lebon.porn');
  assert(SITE_PROFILES['www.lebon.porn'].includes('lebonporn'), 'profil www.lebon.porn');
  assert(SITE_PROFILES['videos.lebon.porn'].includes('lebonporn'), 'profil videos.lebon.porn');
  assert(src.includes('cleanLebonporn'), 'content: fonction cleanLebonporn');
  assert(src.includes('injectLebonpornPageScript'), 'content: injecte lebonporn-page.js');
  assert(src.includes('agego-lbp-unlock'), 'content: evenement unlock lebonporn');
  assert(src.includes('mrx-blur'), 'content: cible mrx-blur');
  assert(src.includes('adultDisclaimer'), 'content: cible adultDisclaimer');
  assert(!/adult-enter-btn[\s\S]{0,80}\.click\(/.test(src), 'content: ne clique pas adult-enter-btn');
  assert(fs.existsSync(path.join(__dirname, 'lebonporn-page.js')), 'fichier lebonporn-page.js present');
  const lbpPage = fs.readFileSync(path.join(__dirname, 'lebonporn-page.js'), 'utf8');
  assert(lbpPage.includes('player_mode'), 'lebonporn page: player_mode');
  assert(lbpPage.includes('__agegoLbpReady'), 'lebonporn page: __agegoLbpReady');
  assert(lbpPage.includes('safeMode'), 'lebonporn page: safeMode');
  assert(lbpPage.includes('msg_origin'), 'lebonporn page: msg_origin');
  assert(lbpPage.includes('ewkplrpmr'), 'lebonporn page: ewkplrpmr');
  assert(lbpPage.includes('stopImmediatePropagation'), 'lebonporn page: stopImmediatePropagation');
  assert(/player_mode\s*:\s*['"]default['"]/.test(lbpPage), 'lebonporn page: player_mode default');
  assert(!/player-safe-mode\)\.remove/.test(lbpPage), 'lebonporn page: pas player-safe-mode).remove');
  assert(!/getElementById\(['"]player-safe-mode['"]\)[\s\S]{0,120}?\.remove\(/.test(lbpPage), 'lebonporn page: pas remove player-safe-mode via getElementById');
  assert(lbpPage.includes("addEventListener('message") || lbpPage.includes('addEventListener("message"'), 'lebonporn page: ecoute message');
  assert(fs.existsSync(path.join(__dirname, 'lebonporn-inject.js')), 'fichier lebonporn-inject.js present');
  const lbpInject = fs.readFileSync(path.join(__dirname, 'lebonporn-inject.js'), 'utf8');
  assert(lbpInject.includes('lebonporn-page.js'), 'lebonporn inject: reference lebonporn-page.js');
  assert(lbpInject.includes('textContent'), 'lebonporn inject: injection textContent');
  assert(lbpInject.includes('XMLHttpRequest') || /xhr[\s\S]{0,40}sync/i.test(lbpInject), 'lebonporn inject: xhr sync');
  assert(lbpInject.includes('cloneInto') || lbpInject.includes('ewkplrpmr'), 'lebonporn inject: cloneInto ou ewkplrpmr');
  const releaseLbpBody = (contentSrc.match(/function releaseLebonpornPlayers\(\)[\s\S]*?\n  \}/) || [''])[0];
  assert(releaseLbpBody.includes('msg_origin') && releaseLbpBody.includes('ewkplrpmr'), 'content: releaseLebonpornPlayers msg_origin/ewkplrpmr');
  assert(!/player-safe-mode[\s\S]{0,120}?\.remove\(/.test(releaseLbpBody), 'content: releaseLebonpornPlayers pas remove player-safe-mode');
  const warLbp = (mf.web_accessible_resources || []).some((r) => (r.resources || []).includes('lebonporn-page.js'));
  assert(warLbp, 'manifest: lebonporn-page.js accessible');
  assert(typeof mf.version === 'string' && mf.version.length > 0, 'manifest: version non vide');
  const csLbpMain = (mf.content_scripts || []).some((s) => s.world === 'MAIN' && (s.js || []).includes('lebonporn-page.js'));
  assert(csLbpMain, 'manifest: lebonporn-page.js world MAIN');
  const csLbpInjectEntry = (mf.content_scripts || []).find((s) => (s.js || []).includes('lebonporn-inject.js'));
  const lbpInjectMatches = (csLbpInjectEntry?.matches || []).join(' ');
  assert(/lebon\.porn/.test(lbpInjectMatches) && /videos\.lebon\.porn/.test(lbpInjectMatches), 'manifest: lebonporn-inject matches lebon.porn + videos');
  assert(
    mf.browser_specific_settings?.gecko?.strict_min_version === '140.0',
    'manifest: gecko.strict_min_version 140.0'
  );
  assert(
    mf.browser_specific_settings?.gecko_android?.strict_min_version === '142.0',
    'manifest: gecko_android.strict_min_version 142.0'
  );
  assert(
    !!mf.browser_specific_settings?.gecko?.data_collection_permissions,
    'manifest: gecko.data_collection_permissions (Firefox 140+)'
  );
  assert(Array.isArray(mf.background?.scripts) && mf.background.scripts.includes('background.js'), 'manifest: background.scripts Firefox');
  const csLbp = (mf.content_scripts || []).some((s) => (s.js || []).includes('lebonporn-inject.js') && s.all_frames === true);
  assert(csLbp, 'manifest: lebonporn-inject.js all_frames');

  assert(SITE_PROFILES['tukif.porn'].includes('tukif'), 'profil tukif.porn');
  assert(SITE_PROFILES['www.tukif.porn'].includes('tukif'), 'profil www.tukif.porn');
  assert(SITE_PROFILES['videos.tukif.porn'].includes('tukif'), 'profil videos.tukif.porn');
  assert(src.includes('isTukifHost'), 'content: isTukifHost');
  assert(src.includes('cleanTukif'), 'content: fonction cleanTukif');
  assert(src.includes('detectTukif'), 'content: detectTukif');
  assert(src.includes('hasTukifThreat'), 'content: hasTukifThreat');
  assert(src.includes('videos.tukif.porn'), 'content: videos.tukif.porn');
  assert(src.includes('dsclcnst'), 'content: cible dsclcnst');
  assert(src.includes('img-blured'), 'content: cible img-blured');
  assert(src.includes('sfw_disclaimer_wrapper'), 'content: cible sfw_disclaimer_wrapper');
  assert(src.includes('agechecker'), 'content: cible agechecker');
  assert(src.includes('blurmyass'), 'content: cible blurmyass');
  assert(!/click_remove_disclaimer[\s\S]{0,80}\.click\(/.test(src), 'content: ne clique pas click_remove_disclaimer');
  assert(
    /videos\.\(lebon\|tukif\)\.porn/.test(lbpPage) ||
      (lbpPage.includes('tukif') && lbpPage.includes('videos.lebon.porn') && lbpPage.includes('ewkplrpmr') && lbpPage.includes('player_mode')),
    'lebonporn page: isPlayer couvre tukif'
  );
  const csLbpPageEntry = (mf.content_scripts || []).find((s) => (s.js || []).includes('lebonporn-page.js'));
  const csLbpPageMatches = (csLbpPageEntry?.matches || []).join(' ');
  assert(/tukif\.porn/.test(csLbpPageMatches) && /videos\.tukif\.porn/.test(csLbpPageMatches), 'manifest: lebonporn-page.js matches tukif.porn + videos.tukif.porn');
  assert(/tukif\.porn/.test(lbpInjectMatches) && /videos\.tukif\.porn/.test(lbpInjectMatches), 'manifest: lebonporn-inject matches tukif.porn + videos.tukif.porn');
  const warLbpEntry = (mf.web_accessible_resources || []).find((r) => (r.resources || []).includes('lebonporn-page.js'));
  const warLbpMatches = (warLbpEntry?.matches || []).join(' ');
  assert(/tukif\.porn/.test(warLbpMatches), 'manifest: WAR lebonporn-page.js matches tukif.porn');
  assert(lbpPage.includes('999999999'), 'lebonporn page: SFW no-limit timestamp (999999999)');
  assert(!/video_timestamp\s*=\s*0\b/.test(lbpPage), 'lebonporn page: ne remet plus video_timestamp a 0');
  assert(lbpPage.includes("'seeking'") || lbpPage.includes('"seeking"'), 'lebonporn page: ecoute seeking');
  assert(lbpPage.includes("'seeked'") || lbpPage.includes('"seeked"'), 'lebonporn page: ecoute seeked');
  assert(/player_mode\s*:\s*['"]default['"]/.test(lbpPage), 'lebonporn page: player_mode default (TKN seek fix)');
  assert(lbpPage.includes('ewkplrpmr'), 'lebonporn page: ewkplrpmr (TKN seek fix)');
  assert(src.includes('#disclaimer_parent_wrapper'), 'content: selecteur #disclaimer_parent_wrapper');
  assert(src.includes('disclaimer_wrapper'), 'content: cible disclaimer_wrapper');
  assert(src.includes('dsclcnst=1'), 'content: cookie dsclcnst=1 (AgeVerif skip)');
  assert(src.includes('dismissTukifDisclaimer'), 'content: dismissTukifDisclaimer');
  const startTukifWatchdogBody = (src.match(/function startTukifWatchdog\(\)[\s\S]*?\n  \}/) || [''])[0];
  assert(startTukifWatchdogBody.includes('dismissTukifDisclaimer'), 'content: startTukifWatchdog appelle dismissTukifDisclaimer');
  const dismissTukifBody = (src.match(/function dismissTukifDisclaimer\(\)[\s\S]*?\n  \}/) || [''])[0];
  assert(
    dismissTukifBody.includes('#disclaimer_parent_wrapper') || startTukifWatchdogBody.includes('dismissTukifDisclaimer'),
    'content: dismiss/watchdog mentionne #disclaimer_parent_wrapper'
  );
  assert(lbpPage.includes('#disclaimer_parent_wrapper'), 'lebonporn page: selecteur #disclaimer_parent_wrapper');
  assert(lbpPage.includes('ageverif'), 'lebonporn page: ageverif');
  assert(
    /ageverif[\s\S]{0,400}(\.start\s*=|start\s*=\s*function)/.test(lbpPage) ||
      /obj\.start\s*=\s*function/.test(lbpPage),
    'lebonporn page: stub ageverif.start'
  );
  assert(startTukifWatchdogBody.includes('injectCSS'), 'content: startTukifWatchdog appelle injectCSS');
  assert(
    src.includes('pushState') || src.includes('onTukifNavigate') || src.includes('lastTukifPath'),
    'content: pushState ou navigation tukif (onTukifNavigate/lastTukifPath)'
  );
  assert(src.includes('/videos/'), 'content: clic guard lien /videos/');
  assert(lbpPage.includes('pushState'), 'lebonporn page: wrap history.pushState');
  assert(
    lbpPage.includes('MutationObserver') ||
      /Observer[\s\S]{0,500}videos\.tukif\.porn/.test(lbpPage),
    'lebonporn page: MutationObserver iframes tukif/lebon'
  );
  assert(mf.browser_specific_settings?.gecko?.id === 'agego-deblur@local.dev', 'manifest: gecko id agego-deblur@local.dev');
}

console.log('Test 6: build.ps1 (Chrome sans scripts, XPI sans service_worker)');
{
  const fs = require('fs');
  const path = require('path');
  const buildSrc = fs.readFileSync(path.join(__dirname, 'build.ps1'), 'utf8');
  assert(buildSrc.includes('service_worker'), 'build.ps1: reference service_worker');
  assert(/\.xpi|\$xpiPath/.test(buildSrc), 'build.ps1: reference xpi');
  assert(
    /Replace[\s\S]{0,200}service_worker|service_worker[\s\S]{0,400}xpi|xpi[\s\S]{0,400}service_worker|-replace[\s\S]{0,120}service_worker/i.test(buildSrc),
    'build.ps1: retire service_worker du XPI Firefox'
  );
  assert(/background\.scripts|"scripts"/.test(buildSrc), 'build.ps1: strip background.scripts pour Chrome');
  assert(buildSrc.includes('$chromeManifest'), 'build.ps1: variable chromeManifest');
  assert(
    /\$chromeManifest\s*=\s*\$originalManifest\s*-replace/.test(buildSrc) &&
      /"scripts"/.test(buildSrc) &&
      /background\\.js/.test(buildSrc),
    'build.ps1: chromeManifest -replace scripts (background.js)'
  );
  assert(/\$zipPath/.test(buildSrc), 'build.ps1: reference zipPath');
  assert(
    /\$chromeManifest[\s\S]{0,600}\$zipPath|New-ExtensionZip[\s\S]{0,120}\$zipPath/.test(buildSrc),
    'build.ps1: zip Chrome (zipPath) apres chromeManifest'
  );
}

console.log('Test 7: popup sites list');
{
  const fs = require('fs');
  const path = require('path');
  const popupJs = fs.readFileSync(path.join(__dirname, 'popup.js'), 'utf8');
  const popupHtml = fs.readFileSync(path.join(__dirname, 'popup.html'), 'utf8');
  const popupCss = fs.readFileSync(path.join(__dirname, 'popup.css'), 'utf8');
  const mf = require('./manifest.json');

  assert(popupJs.includes('SUPPORTED_SITES'), 'popup.js: SUPPORTED_SITES');
  assert(popupJs.includes('tukif.porn'), 'popup.js: tukif.porn');
  assert(popupJs.includes('xvideos.com'), 'popup.js: xvideos.com');
  assert(popupJs.includes('tnaflix.com'), 'popup.js: tnaflix.com');
  assert(!popupJs.includes('youporn.com'), 'popup.js: pas youporn.com');
  assert(!popupJs.includes('pornhub.com'), 'popup.js: pas pornhub.com');
  assert(!popupJs.includes('tube8.com'), 'popup.js: pas tube8.com');
  assert(!popupJs.includes('ixxx.com'), 'popup.js: pas ixxx.com');
  assert(!popupJs.includes('toggle-proxy'), 'popup.js: pas toggle-proxy');
  assert(popupJs.includes('txxx.com'), 'popup.js: txxx.com');
  assert(popupJs.includes('teen21.com'), 'popup.js: teen21.com');
  assert(popupJs.includes('vr-porn.tube'), 'popup.js: vr-porn.tube');
  assert(popupJs.includes('stripchat.com'), 'popup.js: stripchat.com');
  assert(popupJs.includes('xtube.com'), 'popup.js: xtube.com');
  assert(popupJs.includes('jacquieetmichel.net'), 'popup.js: jacquieetmichel.net');
  assert(!popupJs.includes('spankbang.com'), 'popup.js: pas spankbang.com (hors banc KEEP)');
  assert(!popupJs.includes('cam4.com'), 'popup.js: pas cam4.com (hors banc KEEP)');
  assert(!popupJs.includes('xxxbunker.com'), 'popup.js: pas xxxbunker.com (hors banc KEEP)');
  assert(!popupJs.includes('youjizz.com'), 'popup.js: pas youjizz.com (hors banc KEEP)');
  assert(!popupJs.includes('pornhat.com'), 'popup.js: pas pornhat.com (site mort)');
  assert(!popupJs.includes('xhamster.desi'), 'popup.js: pas xhamster.desi (clone TLD)');
  assert(!popupJs.includes('xnxx.es'), 'popup.js: pas xnxx.es (clone TLD)');
  assert(!popupJs.includes('xvideos.es'), 'popup.js: pas xvideos.es (clone TLD)');
  assert(popupJs.includes('tabs.create'), 'popup.js: tabs.create');
  assert(popupJs.includes('renderSites'), 'popup.js: renderSites');
  assert(popupHtml.includes('sites-list'), 'popup.html: sites-list');
  assert(popupHtml.includes('Sites pris en charge'), 'popup.html: Sites pris en charge');
  assert(popupCss.includes('site-link'), 'popup.css: site-link');

  const perms = mf.permissions || [];
  assert(!perms.includes('tabs'), 'manifest: pas de permission tabs ajoutee');

  const hostPerms = (mf.host_permissions || []).join(' ');
  assert(!/chaturbate\.com/.test(hostPerms), 'manifest: pas host_permission chaturbate pour popup');
  assert(!/faphouse\.com/.test(hostPerms), 'manifest: pas host_permission faphouse pour popup');
  assert(!/pornhub\.com/.test(hostPerms), 'manifest: pas host_permission pornhub pour popup');
  assert(!/xhamster\.com/.test(hostPerms), 'manifest: pas host_permission xhamster pour popup');
  assert(!/lebon\.porn/.test(hostPerms), 'manifest: pas host_permission lebon.porn pour popup');
  assert(!/tukif\.porn/.test(hostPerms), 'manifest: pas host_permission tukif.porn pour popup');
  assert(!/deviants\.com/.test(hostPerms), 'manifest: pas host_permission deviants pour popup');
}

console.log('Test 8: content.js hosts 1.10 + detect helpers (fs)');
{
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const contentProfiles = extractContentSiteProfiles(src);
  const hostMap = [
    ['xvideos.es', 'xvideos'],
    ['xnxx.es', 'xvideos'],
    ['xhamster.desi', 'xhamster'],
    ['tnaflix.com', 'agego'],
    ['porndig.com', 'tkn'],
    ['txxx.com', 'txxx'],
    ['teen21.com', 'txxx'],
    ['vr-porn.tube', 'txxx'],
    ['jacquieetmichel.net', 'jacquie'],
    ['stripchat.com', 'stripchat'],
    ['livejasmin.com', 'livejasmin'],
    ['sxyprn.com', 'tkn'],
    ['sunporno.com', 'sunporno'],
    ['thisvid.com', 'gate18'],
    ['analdin.com', 'gate18'],
  ];
  for (const [host, profile] of hostMap) {
    assert(
      contentHostHasProfile(contentProfiles, src, host, profile),
      `content.js SITE_PROFILES: ${host} -> ${profile}`
    );
  }

  const xvHostFn = extractFnBody(src, 'isXvideosHost');
  assert(
    (/es/.test(xvHostFn) && /red/.test(xvHostFn)),
    'content: isXvideosHost regex inclut .es et .red'
  );
  const xhHostFn = extractFnBody(src, 'isXhamsterHost');
  assert(/desi/.test(xhHostFn), 'content: isXhamsterHost inclut .desi');

  const detectTukifBody = extractFnBody(src, 'detectTukif');
  const isTukifHostBody = extractFnBody(src, 'isTukifHost');
  assert(isTukifHostBody.includes('tukif'), 'content: isTukifHost serre (tukif)');
  assert(detectTukifBody.includes('isTukifHost'), 'content: detectTukif utilise isTukifHost');
  assert(!detectTukifBody.includes('tkn_disclaimer'), 'content: detectTukif ne matche plus tkn_disclaimer generique');

  assert(/function cleanTkn\(/.test(src), 'content: cleanTkn existe');
  const cleanTknBody = extractFnBody(src, 'cleanTkn');
  assert(!cleanTknBody.includes('injectLebonpornPageScript'), 'content: cleanTkn n appelle pas injectLebonpornPageScript');

  const cssBlock = (src.match(/const OVERRIDE_CSS = `([\s\S]*?)`;/) || ['', ''])[1];
  assert(!cssBlock.includes('#ageDisclaimerMainBG'), 'OVERRIDE_CSS: pas #ageDisclaimerMainBG (pornhub retire)');
  assert(cssBlock.includes('.modal-age-verification'), 'OVERRIDE_CSS: .modal-age-verification');
  assert(cssBlock.includes('#agreement-root'), 'OVERRIDE_CSS: #agreement-root');
  assert(cssBlock.includes('#consent_modal'), 'OVERRIDE_CSS: #consent_modal');
  assert(!cssBlock.includes('#ageverifybox'), 'OVERRIDE_CSS: pas #ageverifybox (pornhub retire)');
  assert(cssBlock.includes('custom-disclaimer'), 'OVERRIDE_CSS: custom-disclaimer');

  const ljCss = (src.match(/\/\*\s*LIVEJASMIN[\s\S]*?(?=\n\s*\/\*\s*[A-Z]|\n\s*`;)/i) || [''])[0];
  assert(/#consent_modal/.test(ljCss), 'content CSS livejasmin: #consent_modal');
  const ljOverlayIsolated = /#overlay(?:\s|,|\{)/.test(ljCss);
  const ljOverlayComment = /#overlay/.test(src) && /livejasmin/i.test(src) &&
    /ne (pas |plus )?cacher #overlay|#overlay[^\n]{0,80}livejasmin|livejasmin[^\n]{0,120}#overlay/i.test(src);
  assert(
    !ljOverlayIsolated || ljOverlayComment,
    'content: pas de #overlay isole pour LiveJasmin (ou commentaire)'
  );
}

console.log('Test 9: content.js v1.10.9 (xtube/gate18)');
{
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const contentProfiles = extractContentSiteProfiles(src);
  const mf = require('./manifest.json');

  const v1103HostMap = [
    ['xtube.com', 'stripchat'],
    ['empflix.com', 'agego'],
    ['thisvid.com', 'gate18'],
  ];
  for (const [host, profile] of v1103HostMap) {
    assert(
      contentHostHasProfile(contentProfiles, src, host, profile),
      `content.js SITE_PROFILES: ${host} -> ${profile}`
    );
  }

  const popupJs = fs.readFileSync(path.join(__dirname, 'popup.js'), 'utf8');
  for (const removedHost of ['pornhat.com', 'www.pornhat.com']) {
    assert(
      !contentHostHasProfile(contentProfiles, src, removedHost, 'gate18'),
      `content.js SITE_PROFILES: ${removedHost} absent (pornhat retire)`
    );
  }
  assert(!popupJs.includes('pornhat.com'), 'popup.js: pas pornhat.com (site mort)');

  assert(/function cleanGate18\(/.test(src), 'content: cleanGate18 existe');
  assert(!/function cleanXxxbunker\(/.test(src), 'content: pas cleanXxxbunker (hors banc KEEP)');
  assert(!/function cleanCam4\(/.test(src), 'content: pas cleanCam4 (hors banc KEEP)');

  const cssBlock = (src.match(/const OVERRIDE_CSS = `([\s\S]*?)`;/) || ['', ''])[1];
  assert(
    !cssBlock.includes('body[data-ageconfirmed="false"] #overlay'),
    'OVERRIDE_CSS: pas body[data-ageconfirmed] #overlay (xxxbunker retire)'
  );
  assert(
    !/(?:^|\n)\s*#overlay\s*\{/.test(cssBlock),
    'OVERRIDE_CSS: pas de #overlay { isole (LiveJasmin)'
  );

  const stripchatHostFn = extractFnBody(src, 'isStripchatHost');
  assert(/xtube/.test(stripchatHostFn), 'content: isStripchatHost inclut xtube');

  assert(!(mf.permissions || []).includes('tabs'), 'manifest v1.10.3: pas de permission tabs');
  assert(!(mf.permissions || []).includes('proxy'), 'manifest v1.10.3: pas de permission proxy');
}

console.log('Test 11: content.js cleaners (txxx/sunporno/livejasmin)');
{
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const cssBlock = (src.match(/const OVERRIDE_CSS = `([\s\S]*?)`;/) || ['', ''])[1];

  const cleanTxxxBody = extractFnBody(src, 'cleanTxxx');
  assert(cleanTxxxBody.includes('setTxxxAgeFlags'), 'cleanTxxx: setTxxxAgeFlags');
  assert(cleanTxxxBody.includes('clickTxxxAgeButtons'), 'cleanTxxx: clickTxxxAgeButtons');
  assert(cleanTxxxBody.includes('invokeTxxxAgeverifSuccess'), 'cleanTxxx: invokeTxxxAgeverifSuccess');
  assert(src.includes("localStorage.setItem('_agvface', 'passed')"), 'cleanTxxx: _agvface');
  assert(cleanTxxxBody.includes('injectCSS'), 'cleanTxxx: injectCSS');
  assert(cssBlock.includes('[class*="modal-age"]'), 'OVERRIDE_CSS TXXX: [class*="modal-age"]');
  assert(src.includes('iframe[src*="ageverif.com"]'), 'cleanTxxx: hide iframe ageverif.com');
  assert(src.includes('[src*="static.ageverif.com"]'), 'cleanTxxx: hide static.ageverif.com');

  const isTxxxHostBody = extractFnBody(src, 'isTxxxHost');
  assert(/teen21/.test(isTxxxHostBody), 'content: isTxxxHost inclut teen21');
  assert(/vr-porn/.test(isTxxxHostBody), 'content: isTxxxHost inclut vr-porn.tube');

  const cleanSunpornoBody = extractFnBody(src, 'cleanSunporno');
  assert(cleanSunpornoBody.includes('hideSunpornoViewportVeils'), 'cleanSunporno: hideSunpornoViewportVeils');
  assert(cleanSunpornoBody.includes('unlockSunpornoPage'), 'cleanSunporno: unlockSunpornoPage');
  assert(cleanSunpornoBody.includes('injectCSS'), 'cleanSunporno: injectCSS');
  assert(!cleanSunpornoBody.includes("el.style.removeProperty('pointer-events')"), 'cleanSunporno: pas de removeProperty pointer-events');
  assert(cssBlock.includes('[id*="age-verif"]'), 'OVERRIDE_CSS SUNPORNO: [id*="age-verif"]');
  assert(/\.container/.test(cssBlock), 'OVERRIDE_CSS SUNPORNO: .container deblur');
  assert(src.includes("querySelectorAll('#wrapper, .wrapper, main, .container')"), 'unlockSunpornoPage: .container');

  const cleanLivejasminBody = extractFnBody(src, 'cleanLivejasmin');
  assert(cleanLivejasminBody.includes('unlockLivejasminScroll'), 'cleanLivejasmin: unlockLivejasminScroll');
  assert(cleanLivejasminBody.includes('injectCSS'), 'cleanLivejasmin: injectCSS');
  const ljCss = (src.match(/\/\*\s*LIVEJASMIN[\s\S]*?(?=\n\s*\/\*\s*[A-Z]|\n\s*`;)/i) || [''])[0];
  assert(/overflow:\s*auto/.test(ljCss), 'OVERRIDE_CSS LIVEJASMIN: overflow auto');
  assert(ljCss.includes('Over18ModalVariant1Modal'), 'OVERRIDE_CSS LIVEJASMIN: Over18ModalVariant1Modal');
  assert(/NE PAS cacher #overlay/.test(ljCss), 'OVERRIDE_CSS LIVEJASMIN: commentaire #overlay');

  assert(
    cssBlock.includes('vast_player') || src.includes('vast_player'),
    'content/OVERRIDE: masque vast_player'
  );
  assert(src.includes('poloptrex.com'), 'content: masque poloptrex.com');
  assert(src.includes('mrdmca.com'), 'content: masque mrdmca.com');
  assert(
    /function cleanAds\(/.test(src) || src.includes('cleanAds()'),
    'content: cleanAds (pub/preroll)'
  );
  assert(src.includes('dismissPrerollAds'), 'content: dismissPrerollAds');
  assert(src.includes('killAdVideos'), 'content: killAdVideos');
  assert(src.includes('isAdVideoEl'), 'content: isAdVideoEl');
  assert(src.includes('AD_VIDEO_SRC_RE'), 'content: AD_VIDEO_SRC_RE');
  assert(src.includes('satencedge'), 'content: masque satencedge');
  assert(src.includes('sacfedge'), 'content: masque sacfedge');
  assert(src.includes('skipJwPreroll'), 'content: skipJwPreroll');
  assert(
    !/(?:^|\n)\s*#overlay\s*\{/.test(cssBlock),
    'OVERRIDE_CSS: pas de #overlay { isole (LiveJasmin preroll)'
  );

  const isGate18HostBody = extractFnBody(src, 'isGate18Host');
  assert(!isGate18HostBody.includes('pornhat'), 'isGate18Host: pas pornhat');
}

console.log('Test 10: bench-sites.mjs (banc popup + catalogue SFW/geo)');
{
  const fs = require('fs');
  const path = require('path');
  const benchPath = path.join(__dirname, 'bench-sites.mjs');
  assert(fs.existsSync(benchPath), 'bench-sites.mjs present');
  const benchSrc = fs.readFileSync(benchPath, 'utf8');
  assert(benchSrc.includes('sfw_geo_catalog'), 'bench-sites.mjs: critere sfw_geo_catalog');
  assert(benchSrc.includes('sfw-page'), 'bench-sites.mjs: detection sfw-page');
  assert(benchSrc.includes('parseSites'), 'bench-sites.mjs: parse popup.js');
  const pkg = require('./package.json');
  assert(pkg.scripts && pkg.scripts['test:sites'] === 'node bench-sites.mjs', 'package.json: script test:sites');
}

console.log('Test 12: bench-strict.mjs (seek profond + changement video)');
{
  const fs = require('fs');
  const path = require('path');
  const benchPath = path.join(__dirname, 'bench-strict.mjs');
  assert(fs.existsSync(benchPath), 'bench-strict.mjs present');
  const benchSrc = fs.readFileSync(benchPath, 'utf8');
  assert(benchSrc.includes('function seekDeep'), 'bench-strict: seekDeep');
  assert(benchSrc.includes('proveDeepSeek'), 'bench-strict: proveDeepSeek');
  assert(/55/.test(benchSrc), 'bench-strict: seek au-dela de 55s (coupe SFW 44-46s)');
  assert(benchSrc.includes('seek_cutoff'), 'bench-strict: critere seek_cutoff');
  assert(benchSrc.includes('broken_after_video_change'), 'bench-strict: changement video');
  assert(benchSrc.includes('second-seek-fail') || benchSrc.includes('seek2-cutoff'), 'bench-strict: seek 2e video');
  const pkg = require('./package.json');
  assert(pkg.scripts && pkg.scripts['test:strict'] === 'node bench-strict.mjs', 'package.json: script test:strict');
}

console.log('Test 13: pipeline AgeVerif global');
{
  const fs = require('fs');
  const path = require('path');
  const root = __dirname;
  const mf = require('./manifest.json');

  assert(fs.existsSync(path.join(root, 'ageverif-page.js')), 'fichier ageverif-page.js present');

  const avPage = fs.readFileSync(path.join(root, 'ageverif-page.js'), 'utf8');
  assert(avPage.includes('__agegoAvReady'), 'ageverif-page: __agegoAvReady');
  assert(avPage.includes('ageverifSuccess'), 'ageverif-page: ageverifSuccess');
  assert(avPage.includes('ageverifReady'), 'ageverif-page: ageverifReady');
  assert(
    avPage.includes('applyStub') || /\.start\s*=/.test(avPage) || avPage.includes('obj.start'),
    'ageverif-page: applyStub ou stub .start'
  );
  assert(avPage.includes('_agvface'), 'ageverif-page: _agvface');

  const warAv = (mf.web_accessible_resources || []).find((r) =>
    (r.resources || []).includes('ageverif-page.js')
  );
  assert(!!warAv, 'manifest WAR: entree ageverif-page.js');
  assert((warAv?.matches || []).includes('<all_urls>'), 'manifest WAR: ageverif-page.js matches <all_urls>');

  const src = fs.readFileSync(path.join(root, 'content.js'), 'utf8');
  assert(/function detectAgeverif\(/.test(src), 'content: detectAgeverif');
  assert(/function cleanAgeverif\(/.test(src), 'content: cleanAgeverif');
  assert(/function injectAgeverifPageScript\(/.test(src), 'content: injectAgeverifPageScript');
  assert(/function startGlobalAgeverifWatch\(/.test(src), 'content: startGlobalAgeverifWatch');
  assert(src.includes('AGEVERIF_HIDE_SELECTORS'), 'content: AGEVERIF_HIDE_SELECTORS');
  const injectAvBody = extractFnBody(src, 'injectAgeverifPageScript');
  assert(injectAvBody.includes("getURL('ageverif-page.js')"), 'content: injectAgeverifPageScript getURL ageverif-page.js');

  const detectProfilesBody = extractFnBody(src, 'detectProfiles');
  assert(detectProfilesBody.includes('detectAgeverif'), 'content: detectProfiles appelle detectAgeverif');
  assert(detectProfilesBody.includes("'ageverif'") || detectProfilesBody.includes('"ageverif"'), 'content: detectProfiles profil ageverif');

  const runCleanupBody = extractFnBody(src, 'runCleanup');
  assert(runCleanupBody.includes('cleanAgeverif'), 'content: runCleanup appelle cleanAgeverif');

  const initBody = extractFnBody(src, 'init');
  assert(initBody.includes('startGlobalAgeverifWatch'), 'content: init appelle startGlobalAgeverifWatch');

  const buildSrc = fs.readFileSync(path.join(root, 'build.ps1'), 'utf8');
  assert(/["']ageverif-page\.js["']/.test(buildSrc), 'build.ps1: $files inclut ageverif-page.js');
}

console.log('\n--- Resultat:', passed, 'OK,', failed, 'echecs ---');

process.exit(failed > 0 ? 1 : 0);


