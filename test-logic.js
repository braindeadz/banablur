/**

 * Tests unitaires — node test-logic.js

 */



const SITE_PROFILES = {

  'deviants.com': ['agego'],

  'www.deviants.com': ['agego'],

  'xvideos.com': ['xvideos', 'agego'],

  'www.xvideos.com': ['xvideos', 'agego'],

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

};



function detectXvideosHost(hostname) {

  return /(^|\.)xvideos\.com$/i.test(hostname);

}



function detectXhamsterHost(hostname) {

  return /(^|\.)xhamster\.com$/i.test(hostname);

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



console.log('Test 2: detectXvideosHost');

assert(detectXvideosHost('www.xvideos.com'), 'www.xvideos.com');

assert(detectXvideosHost('xvideos.com'), 'xvideos.com');

assert(!detectXvideosHost('google.com'), 'google.com false');



console.log('Test 3: detectXhamsterHost');

assert(detectXhamsterHost('www.xhamster.com'), 'www.xhamster.com');

assert(detectXhamsterHost('xhamster.com'), 'xhamster.com');

assert(!detectXhamsterHost('xvideos.com'), 'xvideos.com false');



console.log('Test 4: manifest v1.5');

{

  const m = require('./manifest.json');

  assert(m.version === '1.9.1', 'version 1.9.1');
  assert(!!m.web_accessible_resources?.length, 'web_accessible_resources');
  const war = m.web_accessible_resources?.[0]?.resources || [];
  assert(war.includes('hls.min.js'), 'hls.min.js accessible');
  assert((m.permissions || []).includes('downloads'), 'permission downloads');
  assert((m.permissions || []).includes('proxy'), 'permission proxy (deflou xHamster)');
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
  assert(cb.includes('handleRoomAction'), 'chaturbate clic intercepte');
  assert(cb.includes('injectCSS'), 'chaturbate injectCSS backup');
  assert(cb.includes('chaturbate-page.js'), 'chaturbate page script inject');
  assert(cb.includes('hls.min.js'), 'chaturbate hls bundle inject');
  assert(cb.includes('startGateObserver'), 'chaturbate gate observer');
  assert(cb.includes('agego-app'), 'page custom chaturbate');
  assert(cb.includes('syncCustomCards'), 'sync grille custom');
  assert(cb.includes('/riw/'), 'deblur grille custom');
  assert(cb.includes('loadNextPage'), 'pagination custom');

  const cbPage = fs.readFileSync(path.join(__dirname, 'chaturbate-page.js'), 'utf8');
  assert(cbPage.includes('agego-live-overlay'), 'overlay live autonome');
  assert(!cbPage.includes('videojs'), 'pas de dependance videojs');
  assert(cbPage.includes('startWatchdog'), 'watchdog live');
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
  assert(xvPage.includes('fetchEmbedframe(getToken())'), 'xvideos page token en priorite, id en secours');
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

  assert(fs.existsSync(path.join(__dirname, 'pornhub-page.js')), 'fichier pornhub-page.js present');
  const phPage = fs.readFileSync(path.join(__dirname, 'pornhub-page.js'), 'utf8');
  assert(phPage.includes('flashvars_'), 'pornhub page: lit window.flashvars_{id}');
  assert(phPage.includes('mediaDefinitions'), 'pornhub page: mediaDefinitions');
  assert(phPage.includes('downloadHls'), 'pornhub page: telechargement HLS');
  assert(phPage.includes('agego-dl-btn'), 'pornhub page: bouton flottant');
  assert(phPage.includes('dismissAgeGate'), 'pornhub page: leve la gate d age');

  // fra.xhamster / SFW complet / deblur renforce / bouton SVG
  assert(SITE_PROFILES['fra.xhamster.com'].includes('xhamster'), 'profil fra.xhamster.com');
  assert(xhPage.includes('SFW_NO_LIMIT') && xhPage.includes('999999999'), 'xhamster page: SFW no-limit (grande valeur, pas 0)');
  assert(!/moderationTimestamp = 0\b/.test(xhPage), 'xhamster page: ne remet plus moderationTimestamp a 0');
  assert(xhPage.includes('xh-helper-blurred-background'), 'xhamster page: deblur xh-helper-blurred-background');
  assert(xhPage.includes('mn-thumb__hls-wrapper'), 'xhamster page: deblur backdrop preview HLS');
  assert(xhPage.includes('backdrop-filter'), 'xhamster page: neutralise backdrop-filter');
  assert(xhPage.includes('<svg') && xhPage.includes('Telecharger'), 'xhamster page: bouton avec icone SVG');
  assert(xvPage.includes('<svg'), 'xvideos page: bouton avec icone SVG');
  assert(phPage.includes('<svg'), 'pornhub page: bouton avec icone SVG');
  assert(src.includes('mn-thumb__hls-wrapper') || src.includes('xh-helper-blurred-overlay'), 'content CSS: deblur renforce xhamster');
  assert(src.includes('cleanPornhub'), 'content: fonction cleanPornhub');
  assert(src.includes('accessAgeDisclaimerPH=2'), 'content: cookie age gate pornhub');
  assert(src.includes('buttonOver18'), 'content: clic bouton 18+ pornhub');
  assert(src.includes('injectPornhubPageScript'), 'content: injecte pornhub-page.js');
  const warPh = (mf.web_accessible_resources || []).some((r) => (r.resources || []).includes('pornhub-page.js'));
  assert(warPh, 'manifest: pornhub-page.js accessible');
  assert(SITE_PROFILES['fr.pornhub.com'].includes('pornhub'), 'profil fr.pornhub.com');

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
  assert(!!mf.browser_specific_settings?.gecko?.strict_min_version, 'manifest: gecko.strict_min_version');
  assert(
    !!mf.browser_specific_settings?.gecko?.data_collection_permissions,
    'manifest: gecko.data_collection_permissions (Firefox 140+)'
  );
  assert(Array.isArray(mf.background?.scripts) && mf.background.scripts.includes('background.js'), 'manifest: background.scripts Firefox');
  const csLbp = (mf.content_scripts || []).some((s) => (s.js || []).includes('lebonporn-inject.js') && s.all_frames === true);
  assert(csLbp, 'manifest: lebonporn-inject.js all_frames');
}



console.log('\n--- Resultat:', passed, 'OK,', failed, 'echecs ---');

process.exit(failed > 0 ? 1 : 0);


