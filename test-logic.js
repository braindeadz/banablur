/**

 * Unit tests — node test-logic.js

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
    'xhamsterlive.com': ['xhamsterlive'],
    'www.xhamsterlive.com': ['xhamsterlive'],
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

assert(!SITE_PROFILES['www.xhamster.com'], 'xhamster.com removed');
assert(SITE_PROFILES['xhamsterlive.com'].includes('xhamsterlive'), 'xhamsterlive stays');
assert(SITE_PROFILES['xvideos.es'].includes('xvideos'), 'xvideos.es -> xvideos');
assert(SITE_PROFILES['xnxx.es'].includes('xvideos'), 'xnxx.es -> xvideos');
assert(!SITE_PROFILES['xhamster.desi'] && !SITE_PROFILES['faphouse.com'], 'xhamster.desi and faphouse removed');
assert(SITE_PROFILES['tnaflix.com'].includes('agego'), 'tnaflix -> agego');
assert(SITE_PROFILES['porndig.com'].includes('tkn'), 'porndig -> tkn');
assert(SITE_PROFILES['txxx.com'].includes('txxx'), 'txxx -> txxx');
assert(SITE_PROFILES['teen21.com'].includes('txxx'), 'teen21 -> txxx');
assert(SITE_PROFILES['vr-porn.tube'].includes('txxx'), 'vr-porn.tube -> txxx');
assert(SITE_PROFILES['eporner.com'].includes('eporner'), 'eporner -> eporner');
assert(SITE_PROFILES['jacquieetmicheltv.net'].includes('jacquie'), 'jacquieetmicheltv -> jacquie');
assert(SITE_PROFILES['stripchat.com'].includes('stripchat'), 'stripchat -> stripchat');
assert(SITE_PROFILES['bongacams.com'].includes('bongacams'), 'bongacams -> bongacams');
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

  assert(m.version === '1.10.15', 'version 1.10.15');
  assert(!!m.web_accessible_resources?.length, 'web_accessible_resources');
  const war = m.web_accessible_resources?.[0]?.resources || [];
  assert(war.includes('hls.min.js'), 'hls.min.js accessible');
  assert((m.permissions || []).includes('downloads'), 'permission downloads');
  assert(!(m.permissions || []).includes('proxy'), 'manifest: no proxy permission');
  assert(!(m.permissions || []).includes('tabs'), 'manifest: no tabs permission');
  const hostPerms = (m.host_permissions || []).join(' ');
  assert(!/proxyscrape\.com/.test(hostPerms), 'manifest: no host_permission proxyscrape');
  assert(/xvideos\.com/.test(hostPerms), 'manifest host_permissions: xvideos.com');
  assert(/xnxx\.com/.test(hostPerms), 'manifest host_permissions: xnxx.com');
  assert(/xvideos\.es/.test(hostPerms), 'manifest host_permissions: xvideos.es');
  assert(/xnxx\.es/.test(hostPerms), 'manifest host_permissions: xnxx.es');
  assert(/xvideos\.red/.test(hostPerms), 'manifest host_permissions: xvideos.red');
  const warXvMatchesV110 = ((m.web_accessible_resources || []).find((r) => (r.resources || []).includes('xvideos-page.js'))?.matches || []).join(' ');
  assert(/xvideos\.es/.test(warXvMatchesV110), 'manifest WAR: xvideos.es');
  assert(m.background?.service_worker === 'background.js', 'service worker background.js');

  assert(!!m.icons?.['16'], 'root icons 16');

  assert(!!m.content_scripts?.find((s) => s.js?.includes('chaturbate.js')), 'separate chaturbate script');
  assert(!!m.content_scripts?.find((s) => s.css?.includes('chaturbate-gate.css')), 'chaturbate-gate css');
  assert(!!m.content_scripts?.[0]?.exclude_matches?.length, 'exclude chaturbate from content.js');

}



console.log('Test 5: content.js contains xvideos + xhamster profiles');

{

  const fs = require('fs');

  const path = require('path');

  const src = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert(src.includes('disclaimer_background'), 'target disclaimer_background');

  assert(src.includes('video_sfw'), 'target video_sfw');

  assert(src.includes('getXvideosVideoId'), 'extract xvideos id');
  assert(src.includes('fetchXvideosUrls'), 'fetch embedframe xvideos');
  assert(src.includes('/embedframe/'), 'endpoint embedframe xvideos');
  assert(src.includes('setVideoUrlHigh'), 'parse setVideoUrlHigh');
  assert(src.includes('sfw-playlocked'), 'target sfw-playlocked');
  assert(src.includes('sfw-click-area'), 'target sfw-click-area');
  assert(src.includes('fixXvideosThumbnails'), 'deblur xvideos thumbnails');
  assert(src.includes('injectXvideosPageScript'), 'xvideos page script injection');
  assert(src.includes('agego-xv-unlock'), 'xvideos unlock event');
  assert(src.includes('startXvideosWatchdog'), 'watchdog xvideos');
  assert(src.includes('xnxx'), 'content: xnxx support (xvideos family)');
  assert(src.includes('video[.-]'), 'content: video token path xnxx/xvideos');

  assert(src.includes('cleanXhamster'), 'cleanXhamster function');
  assert(src.includes('cleanFaphouse'), 'cleanFaphouse function');
  assert(src.includes('cleanChaturbate'), 'cleanChaturbate function');
  assert(src.includes('neutralizeChaturbateAgeGate'), 'neutralizeChaturbateAgeGate function');
  assert(src.includes('hasChaturbateThreatForStatus'), 'separate chaturbate status');
  assert(src.includes('startChaturbateWatchdog'), 'startChaturbateWatchdog function');
  assert(src.includes('tickChaturbate'), 'tickChaturbate function');
  assert(src.includes('get_edge_hls_url_ajax'), 'target get_edge_hls_url_ajax');
  assert(src.includes('/ribw/'), 'target ribw');
  assert(src.includes('pointer-events'), 'target pointer-events overlay');
  assert(src.includes('cookie-wall'), 'target cookie-wall');
  assert(src.includes('age_verified_mnt'), 'content: AgeGo/Flix age cookie');
  assert(src.includes('AGEGO_FLIX_HOST_RE'), 'content: AgeGo/Flix host scope');
  assert(src.includes('prerollAdSkip'), 'content: TNAFlix preroll skip control');
  assert(src.includes('snapshot_blurred'), 'target snapshot_blurred');

  assert(src.includes('xp-sfw'), 'target xp-sfw');

  assert(src.includes('xh-helper-18-plus'), 'target xh-helper-18-plus');

  assert(src.includes('removeProperty(\'filter\')'), 'remove inline blur');

  assert(src.includes('attributeFilter'), 'watchdog style attr');

  const cb = fs.readFileSync(path.join(__dirname, 'chaturbate.js'), 'utf8');
  assert(cb.includes('getNextRoomSlug'), 'chaturbate getNextRoomSlug');
  assert(cb.includes('getRoomSlugFromPath'), 'chaturbate getRoomSlugFromPath');
  assert(cb.includes('injectCSS'), 'chaturbate injectCSS backup');
  assert(cb.includes('chaturbate-page.js'), 'chaturbate page script inject');
  assert(cb.includes('hls.min.js'), 'chaturbate hls bundle inject');
  assert(cb.includes('startGateObserver'), 'chaturbate gate observer');
  assert(cb.includes('/riw/'), 'native grid deblur');
  assert(!cb.includes('agego-app'), 'chaturbate: no agego-app');
  assert(!cb.includes('handleRoomAction'), 'chaturbate: no handleRoomAction');
  assert(!cb.includes('syncCustomCards'), 'chaturbate: no syncCustomCards');
  assert(!cb.includes('createCustomApp'), 'chaturbate: no createCustomApp');
  assert(!cb.includes('startCustomApp'), 'chaturbate: no startCustomApp');
  assert(cb.includes('entrance_terms_overlay'), 'chaturbate: hide entrance_terms_overlay');
  assert(cb.includes('location.assign'), 'chaturbate: click falls back to room navigation');
  assert(cb.includes('Inline player unavailable'), 'chaturbate: visible toast when falling back');

  const cbPage = fs.readFileSync(path.join(__dirname, 'chaturbate-page.js'), 'utf8');
  assert(cbPage.includes('agego-live-overlay'), 'standalone live overlay');
  assert(!cbPage.includes('onRoomClick'), 'chaturbate-page: no onRoomClick');
  assert(!cbPage.includes('videojs'), 'no videojs dependency');
  assert(cbPage.includes('startWatchdog'), 'live watchdog');
  assert(cbPage.includes('unlockStream'), 'chaturbate-page unlockStream');
  assert(cbPage.includes('silentReload'), 'discreet stream refresh');
  assert(cbPage.includes('isBlackFrame'), 'black frame detection');
  assert(fs.existsSync(path.join(__dirname, 'hls.min.js')), 'hls.min.js file present');

  const xvPage = fs.readFileSync(path.join(__dirname, 'xvideos-page.js'), 'utf8');
  assert(xvPage.includes('initHls'), 'xvideos page initializes the HLS player');
  assert(xvPage.includes('showVideoControls'), 'xvideos page navigation bar');
  assert(xvPage.includes('disableCast'), 'xvideos page cast disabled');
  assert(xvPage.includes('disableRemotePlayback'), 'xvideos page remote playback off');
  assert(xvPage.includes('__agegoXvDone'), 'xvideos page init idempotence flag');
  assert(xvPage.includes('MutationObserver'), 'xvideos page observer (no re-init loop)');
  assert(xvPage.includes('forceVideoVisible'), 'xvideos page force video visible (anti black screen)');
  assert(xvPage.includes('watchPlayback'), 'xvideos page checks real playback');
  assert(xvPage.includes('forceMaxQuality'), 'xvideos page forces max quality (1080p HLS)');
  assert(xvPage.includes('use_hlsjs = true'), 'xvideos page uses the HLS pipeline');
  assert(xvPage.includes('neutralizeSiteBar'), 'xvideos page neutralizes the site custom bar');
  assert(xvPage.includes('stopSfwVideos'), 'xvideos page stops the SFW preview');
  assert(xvPage.includes('dismissDisclaimer'), 'xvideos page closes the disclaimer (anti scroll-to-top)');
  assert(xvPage.includes('disclaimer-enter'), 'xvideos page clicks the disclaimer Enter button');
  assert(fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8').includes('disclaimer-enter'), 'content clicks the Enter button before removal');
  assert(xvPage.includes('close_pop'), 'xvideos page uses the site disclaimer API');
  assert(xvPage.includes('getToken'), 'xvideos page uses the URL token for embedframe');
  assert(xvPage.includes('/video[.-]'), 'xvideos page getToken: path /video-TOKEN or /video.TOKEN');
  assert(xvPage.includes('fetchEmbedframe(getToken())'), 'xvideos page token priority, id fallback');
  assert(!xvPage.includes('agego-xv-embedframe'), 'xvideos page: no embedframe proxy event');
  assert(xvPage.includes('disableSfwLimit'), 'xvideos page disables the SFW limit (44s loop)');
  assert(xvPage.includes('bIsSfwLimited = false'), 'xvideos page cuts bIsSfwLimited');
  assert(xvPage.includes('.buttons-bar'), 'xvideos page hides the site button bar');
  assert(xvPage.includes('.video-ended-desktop'), 'xvideos page hides the end-of-video overlay');
  assert(xvPage.includes('.big-buttons'), 'xvideos page hides the big central button');
  assert(xvPage.includes('.slowseek-info'), 'xvideos page hides the slowseek banner');
  assert(!/\.video-pic[^\n]*\)\s*\{[\s\S]{0,120}?e\.remove\(\)/.test(xvPage), 'xvideos page no longer removes .video-pic');
  assert(fs.existsSync(path.join(__dirname, 'xvideos-page.js')), 'xvideos-page.js file present');
  assert(xvPage.includes('ensureDownloadButton'), 'xvideos page: download button');
  assert(xvPage.includes('agego-dl-btn'), 'xvideos page: floating button id');
  assert(xvPage.includes('openDownloadMenu'), 'xvideos page: quality menu');
  assert(xvPage.includes('downloadHls'), 'xvideos page: HLS download (concat segments)');
  assert(xvPage.includes('agego-xv-download'), 'xvideos page: download event');
  assert(src.includes('agego-xv-download'), 'content relays the download event');
  assert(fs.existsSync(path.join(__dirname, 'background.js')), 'background.js file present');
  const bg = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
  assert(bg.includes('downloads.download'), 'background uses chrome.downloads');
  assert(!/proxyscrape/i.test(bg), 'background: no proxyscrape');
  assert(!bg.includes('proxy:ensure'), 'background: no proxy:ensure');
  assert(!bg.includes('xv:embedframe'), 'background: no embedframe proxy handler');
  assert(!/buildPacData/.test(bg), 'background: no buildPacData');
  assert(!src.includes('agego-xv-embedframe'), 'content: no embedframe proxy event');
  assert(!src.includes('ensureXhamsterProxy'), 'content: no ensureXhamsterProxy');
  assert(!src.includes('agego-xh-proxy-state'), 'content: no agego-xh-proxy-state event');
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
      `content.js SITE_PROFILES: ${removedPh} absent (pornhub removed)`
    );
  }

  assert(fs.existsSync(path.join(__dirname, 'xhamster-page.js')), 'xhamster-page.js file present');
  const xhPage = fs.readFileSync(path.join(__dirname, 'xhamster-page.js'), 'utf8');
  assert(xhPage.includes('disableSfw'), 'xhamster page: neutralizes the SFW module (time cutoff)');
  assert(xhPage.includes('hideAgeOverlays'), 'xhamster page: hides age verification overlay');
  assert(xhPage.includes('fixPlayerBlur'), 'xhamster page: deblurs the video player');
  assert(xhPage.includes('hideCookieBanner'), 'xhamster page: hides cookie modal');
  assert(xhPage.includes('injectCookieHideCss'), 'xhamster page: cookie hiding CSS');
  assert(xhPage.includes('tout accepter'), 'xhamster page: FR cookie button');
  assert(!/clearInterval\(loopTimer\)/.test(xhPage), 'xhamster page: permanent watchdog (no 20s stop)');
  assert(xhPage.includes('setInterval(tick, 500)'), 'xhamster page: 500ms tick');
  assert(src.includes('startXhamsterWatchdog'), 'content: xhamster watchdog');
  assert(src.includes('hideXhamsterCookieModal'), 'content: hides xhamster cookies');
  assert(xhPage.includes('moderationTimestamp'), 'xhamster page: reset moderationTimestamp');
  assert(xhPage.includes('sourceController'), 'xhamster page: reads URLs via sourceController');
  assert(xhPage.includes('downloadHls'), 'xhamster page: HLS download');
  assert(xhPage.includes('agego-dl-btn'), 'xhamster page: floating button');
  assert(src.includes('injectXhamsterPageScript'), 'content injects xhamster-page.js');
  assert(src.includes('agego-xh-unlock'), 'content dispatches agego-xh-unlock');
  const mf = require('./manifest.json');
  const warXh = (mf.web_accessible_resources || []).some((r) => (r.resources || []).includes('xhamster-page.js'));
  assert(warXh, 'manifest: xhamster-page.js accessible');

  // fra.xhamster / full SFW / reinforced deblur / SVG button
  assert(!SITE_PROFILES['fra.xhamster.com'], 'fra.xhamster.com profile removed');
  assert(xhPage.includes('SFW_NO_LIMIT') && xhPage.includes('999999999'), 'xhamster page: SFW no-limit (large value, not 0)');
  assert(!/moderationTimestamp = 0\b/.test(xhPage), 'xhamster page: no longer resets moderationTimestamp to 0');
  assert(xhPage.includes('xh-helper-blurred-background'), 'xhamster page: deblur xh-helper-blurred-background');
  assert(xhPage.includes('mn-thumb__hls-wrapper'), 'xhamster page: deblur HLS preview backdrop');
  assert(xhPage.includes('backdrop-filter'), 'xhamster page: neutralizes backdrop-filter');
  assert(xhPage.includes('<svg') && xhPage.includes('Download'), 'xhamster page: button with SVG icon');
  assert(xvPage.includes('<svg'), 'xvideos page: button with SVG icon');
  assert(src.includes('mn-thumb__hls-wrapper') || src.includes('xh-helper-blurred-overlay'), 'content CSS: reinforced xhamster deblur');
  assert(!src.includes('cleanPornhub'), 'content: no cleanPornhub function');
  assert(!src.includes('injectPornhubPageScript'), 'content: no longer injects pornhub-page.js');
  const warPh = (mf.web_accessible_resources || []).some((r) => (r.resources || []).includes('pornhub-page.js'));
  assert(!warPh, 'manifest: pornhub-page.js WAR removed');
  const warXv = (mf.web_accessible_resources || []).find((r) => (r.resources || []).includes('xvideos-page.js'));
  const warXvMatches = (warXv?.matches || []).join(' ');
  assert(/xnxx\.com/.test(warXvMatches), 'manifest: xvideos-page.js accessible on xnxx.com');

  const contentSrc = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  assert(contentSrc.includes("dataset.agegoXvDone"), 'content stops the dispatch once unlock succeeded');
  const fixThumbBody = (contentSrc.match(/function fixXvideosThumbnails\(\)[\s\S]*?\n  \}/) || [''])[0];
  assert(!fixThumbBody.includes('.remove()'), 'fixXvideosThumbnails no longer removes nodes');

  assert(SITE_PROFILES['lebon.porn'].includes('lebonporn'), 'lebon.porn profile');
  assert(SITE_PROFILES['www.lebon.porn'].includes('lebonporn'), 'www.lebon.porn profile');
  assert(SITE_PROFILES['videos.lebon.porn'].includes('lebonporn'), 'videos.lebon.porn profile');
  assert(src.includes('cleanLebonporn'), 'content: cleanLebonporn function');
  assert(src.includes('injectLebonpornPageScript'), 'content: injects lebonporn-page.js');
  assert(src.includes('agego-lbp-unlock'), 'content: lebonporn unlock event');
  assert(src.includes('mrx-blur'), 'content: target mrx-blur');
  assert(src.includes('adultDisclaimer'), 'content: target adultDisclaimer');
  assert(!/adult-enter-btn[\s\S]{0,80}\.click\(/.test(src), 'content: does not click adult-enter-btn');
  assert(fs.existsSync(path.join(__dirname, 'lebonporn-page.js')), 'lebonporn-page.js file present');
  const lbpPage = fs.readFileSync(path.join(__dirname, 'lebonporn-page.js'), 'utf8');
  assert(lbpPage.includes('player_mode'), 'lebonporn page: player_mode');
  assert(lbpPage.includes('__agegoLbpReady'), 'lebonporn page: __agegoLbpReady');
  assert(lbpPage.includes('safeMode'), 'lebonporn page: safeMode');
  assert(lbpPage.includes('msg_origin'), 'lebonporn page: msg_origin');
  assert(lbpPage.includes('ewkplrpmr'), 'lebonporn page: ewkplrpmr');
  assert(lbpPage.includes('stopImmediatePropagation'), 'lebonporn page: stopImmediatePropagation');
  assert(/player_mode\s*:\s*['"]default['"]/.test(lbpPage), 'lebonporn page: player_mode default');
  assert(!/player-safe-mode\)\.remove/.test(lbpPage), 'lebonporn page: no player-safe-mode).remove');
  assert(!/getElementById\(['"]player-safe-mode['"]\)[\s\S]{0,120}?\.remove\(/.test(lbpPage), 'lebonporn page: no remove player-safe-mode via getElementById');
  assert(lbpPage.includes("addEventListener('message") || lbpPage.includes('addEventListener("message"'), 'lebonporn page: listens for message');
  assert(fs.existsSync(path.join(__dirname, 'lebonporn-inject.js')), 'lebonporn-inject.js file present');
  const lbpInject = fs.readFileSync(path.join(__dirname, 'lebonporn-inject.js'), 'utf8');
  assert(lbpInject.includes('lebonporn-page.js'), 'lebonporn inject: reference lebonporn-page.js');
  assert(lbpInject.includes('textContent'), 'lebonporn inject: injection textContent');
  assert(lbpInject.includes('XMLHttpRequest') || /xhr[\s\S]{0,40}sync/i.test(lbpInject), 'lebonporn inject: xhr sync');
  assert(lbpInject.includes('cloneInto') || lbpInject.includes('ewkplrpmr'), 'lebonporn inject: cloneInto or ewkplrpmr');
  const releaseLbpBody = (contentSrc.match(/function releaseLebonpornPlayers\(\)[\s\S]*?\n  \}/) || [''])[0];
  assert(releaseLbpBody.includes('msg_origin') && releaseLbpBody.includes('ewkplrpmr'), 'content: releaseLebonpornPlayers msg_origin/ewkplrpmr');
  assert(!/player-safe-mode[\s\S]{0,120}?\.remove\(/.test(releaseLbpBody), 'content: releaseLebonpornPlayers no remove player-safe-mode');
  const warLbp = (mf.web_accessible_resources || []).some((r) => (r.resources || []).includes('lebonporn-page.js'));
  assert(warLbp, 'manifest: lebonporn-page.js accessible');
  assert(typeof mf.version === 'string' && mf.version.length > 0, 'manifest: non-empty version');
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

  assert(SITE_PROFILES['tukif.porn'].includes('tukif'), 'tukif.porn profile');
  assert(SITE_PROFILES['www.tukif.porn'].includes('tukif'), 'www.tukif.porn profile');
  assert(SITE_PROFILES['videos.tukif.porn'].includes('tukif'), 'videos.tukif.porn profile');
  assert(src.includes('isTukifHost'), 'content: isTukifHost');
  assert(src.includes('cleanTukif'), 'content: cleanTukif function');
  assert(src.includes('detectTukif'), 'content: detectTukif');
  assert(src.includes('hasTukifThreat'), 'content: hasTukifThreat');
  assert(src.includes('videos.tukif.porn'), 'content: videos.tukif.porn');
  assert(src.includes('dsclcnst'), 'content: target dsclcnst');
  assert(src.includes('img-blured'), 'content: target img-blured');
  assert(src.includes('sfw_disclaimer_wrapper'), 'content: target sfw_disclaimer_wrapper');
  assert(src.includes('agechecker'), 'content: target agechecker');
  assert(src.includes('blurmyass'), 'content: target blurmyass');
  assert(!/click_remove_disclaimer[\s\S]{0,80}\.click\(/.test(src), 'content: does not click click_remove_disclaimer');
  assert(
    /videos\.\(lebon\|tukif\)\.porn/.test(lbpPage) ||
      (lbpPage.includes('tukif') && lbpPage.includes('videos.lebon.porn') && lbpPage.includes('ewkplrpmr') && lbpPage.includes('player_mode')),
    'lebonporn page: isPlayer covers tukif'
  );
  const csLbpPageEntry = (mf.content_scripts || []).find((s) => (s.js || []).includes('lebonporn-page.js'));
  const csLbpPageMatches = (csLbpPageEntry?.matches || []).join(' ');
  assert(/tukif\.porn/.test(csLbpPageMatches) && /videos\.tukif\.porn/.test(csLbpPageMatches), 'manifest: lebonporn-page.js matches tukif.porn + videos.tukif.porn');
  assert(/tukif\.porn/.test(lbpInjectMatches) && /videos\.tukif\.porn/.test(lbpInjectMatches), 'manifest: lebonporn-inject matches tukif.porn + videos.tukif.porn');
  const warLbpEntry = (mf.web_accessible_resources || []).find((r) => (r.resources || []).includes('lebonporn-page.js'));
  const warLbpMatches = (warLbpEntry?.matches || []).join(' ');
  assert(/tukif\.porn/.test(warLbpMatches), 'manifest: WAR lebonporn-page.js matches tukif.porn');
  assert(lbpPage.includes('999999999'), 'lebonporn page: SFW no-limit timestamp (999999999)');
  assert(!/video_timestamp\s*=\s*0\b/.test(lbpPage), 'lebonporn page: no longer resets video_timestamp to 0');
  assert(lbpPage.includes("'seeking'") || lbpPage.includes('"seeking"'), 'lebonporn page: listens for seeking');
  assert(lbpPage.includes("'seeked'") || lbpPage.includes('"seeked"'), 'lebonporn page: listens for seeked');
  assert(/player_mode\s*:\s*['"]default['"]/.test(lbpPage), 'lebonporn page: player_mode default (TKN seek fix)');
  assert(lbpPage.includes('ewkplrpmr'), 'lebonporn page: ewkplrpmr (TKN seek fix)');
  assert(src.includes('#disclaimer_parent_wrapper'), 'content: selector #disclaimer_parent_wrapper');
  assert(src.includes('disclaimer_wrapper'), 'content: target disclaimer_wrapper');
  assert(src.includes('dsclcnst=1'), 'content: cookie dsclcnst=1 (AgeVerif skip)');
  assert(src.includes('dismissTukifDisclaimer'), 'content: dismissTukifDisclaimer');
  const startTukifWatchdogBody = (src.match(/function startTukifWatchdog\(\)[\s\S]*?\n  \}/) || [''])[0];
  assert(startTukifWatchdogBody.includes('dismissTukifDisclaimer'), 'content: startTukifWatchdog calls dismissTukifDisclaimer');
  const dismissTukifBody = (src.match(/function dismissTukifDisclaimer\(\)[\s\S]*?\n  \}/) || [''])[0];
  assert(
    dismissTukifBody.includes('#disclaimer_parent_wrapper') || startTukifWatchdogBody.includes('dismissTukifDisclaimer'),
    'content: dismiss/watchdog mentions #disclaimer_parent_wrapper'
  );
  assert(lbpPage.includes('#disclaimer_parent_wrapper'), 'lebonporn page: selector #disclaimer_parent_wrapper');
  assert(lbpPage.includes('ageverif'), 'lebonporn page: ageverif');
  assert(
    /ageverif[\s\S]{0,400}(\.start\s*=|start\s*=\s*function)/.test(lbpPage) ||
      /obj\.start\s*=\s*function/.test(lbpPage),
    'lebonporn page: stub ageverif.start'
  );
  assert(startTukifWatchdogBody.includes('injectCSS'), 'content: startTukifWatchdog calls injectCSS');
  assert(
    src.includes('pushState') || src.includes('onTukifNavigate') || src.includes('lastTukifPath'),
    'content: pushState or tukif navigation (onTukifNavigate/lastTukifPath)'
  );
  assert(src.includes('/videos/'), 'content: click guard for /videos/ links');
  assert(lbpPage.includes('pushState'), 'lebonporn page: wraps history.pushState');
  assert(
    lbpPage.includes('MutationObserver') ||
      /Observer[\s\S]{0,500}videos\.tukif\.porn/.test(lbpPage),
    'lebonporn page: MutationObserver tukif/lebon iframes'
  );
  assert(mf.browser_specific_settings?.gecko?.id === 'agego-deblur@local.dev', 'manifest: gecko id agego-deblur@local.dev');
}

console.log('Test 6: build.ps1 (Chrome without scripts, XPI without service_worker)');
{
  const fs = require('fs');
  const path = require('path');
  const buildSrc = fs.readFileSync(path.join(__dirname, 'build.ps1'), 'utf8');
  assert(buildSrc.includes('service_worker'), 'build.ps1: reference service_worker');
  assert(/\.xpi|\$xpiPath/.test(buildSrc), 'build.ps1: reference xpi');
  assert(
    /Replace[\s\S]{0,200}service_worker|service_worker[\s\S]{0,400}xpi|xpi[\s\S]{0,400}service_worker|-replace[\s\S]{0,120}service_worker/i.test(buildSrc),
    'build.ps1: remove service_worker from the Firefox XPI'
  );
  assert(/background\.scripts|"scripts"/.test(buildSrc), 'build.ps1: strip background.scripts for Chrome');
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
    'build.ps1: zip Chrome (zipPath) after chromeManifest'
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
  assert(!popupJs.includes('youporn.com'), 'popup.js: no youporn.com');
  assert(!popupJs.includes('pornhub.com'), 'popup.js: no pornhub.com');
  assert(!popupJs.includes('tube8.com'), 'popup.js: no tube8.com');
  assert(!popupJs.includes('ixxx.com'), 'popup.js: no ixxx.com');
  assert(!popupJs.includes('toggle-proxy'), 'popup.js: no toggle-proxy');
  assert(popupJs.includes('txxx.com'), 'popup.js: txxx.com');
  assert(popupJs.includes('teen21.com'), 'popup.js: teen21.com');
  assert(popupJs.includes('vr-porn.tube'), 'popup.js: vr-porn.tube');
  assert(popupJs.includes('stripchat.com'), 'popup.js: stripchat.com');
  assert(popupJs.includes('xtube.com'), 'popup.js: xtube.com');
  assert(popupJs.includes('jacquieetmichel.net'), 'popup.js: jacquieetmichel.net');
  assert(popupJs.includes('darknessporn.com'), 'popup.js: darknessporn.com');
  assert(!popupJs.includes('spankbang.com'), 'popup.js: no spankbang.com (off KEEP bench)');
  assert(!popupJs.includes('cam4.com'), 'popup.js: no cam4.com (off KEEP bench)');
  assert(!popupJs.includes('xxxbunker.com'), 'popup.js: no xxxbunker.com (off KEEP bench)');
  assert(!popupJs.includes('youjizz.com'), 'popup.js: no youjizz.com (off KEEP bench)');
  assert(!popupJs.includes('pornhat.com'), 'popup.js: no pornhat.com (dead site)');
  assert(!popupJs.includes('xhamster.desi'), 'popup.js: no xhamster.desi (TLD clone)');
  assert(!popupJs.includes('xnxx.es'), 'popup.js: no xnxx.es (TLD clone)');
  assert(!popupJs.includes('xvideos.es'), 'popup.js: no xvideos.es (TLD clone)');
  assert(popupJs.includes('tabs.create'), 'popup.js: tabs.create');
  assert(popupJs.includes('renderSites'), 'popup.js: renderSites');
  assert(popupHtml.includes('sites-list'), 'popup.html: sites-list');
  assert(popupHtml.includes('Supported sites'), 'popup.html: Supported sites');
  assert(popupCss.includes('site-link'), 'popup.css: site-link');

  const perms = mf.permissions || [];
  assert(!perms.includes('tabs'), 'manifest: no tabs permission added');

  const hostPerms = (mf.host_permissions || []).join(' ');
  assert(!/chaturbate\.com/.test(hostPerms), 'manifest: no chaturbate host_permission for popup');
  assert(!/faphouse\.com/.test(hostPerms), 'manifest: no faphouse host_permission for popup');
  assert(!/pornhub\.com/.test(hostPerms), 'manifest: no pornhub host_permission for popup');
  assert(!/xhamster\.com/.test(hostPerms), 'manifest: no xhamster host_permission for popup');
  assert(!/lebon\.porn/.test(hostPerms), 'manifest: no lebon.porn host_permission for popup');
  assert(!/tukif\.porn/.test(hostPerms), 'manifest: no tukif.porn host_permission for popup');
  assert(!/deviants\.com/.test(hostPerms), 'manifest: no deviants host_permission for popup');
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
    ['tnaflix.com', 'agego'],
    ['porndig.com', 'tkn'],
    ['txxx.com', 'txxx'],
    ['teen21.com', 'txxx'],
    ['vr-porn.tube', 'txxx'],
    ['jacquieetmichel.net', 'jacquie'],
    ['stripchat.com', 'stripchat'],
    ['sxyprn.com', 'tkn'],
    ['sunporno.com', 'sunporno'],
    ['punishworld.com', 'punishworld'],
    ['darknessporn.com', 'abn'],
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
    'content: isXvideosHost regex includes .es and .red'
  );
  const xhHostFn = extractFnBody(src, 'isXhamsterHost');
  assert(/desi/.test(xhHostFn), 'content: isXhamsterHost includes .desi');

  const detectTukifBody = extractFnBody(src, 'detectTukif');
  const isTukifHostBody = extractFnBody(src, 'isTukifHost');
  assert(isTukifHostBody.includes('tukif'), 'content: isTukifHost serre (tukif)');
  assert(detectTukifBody.includes('isTukifHost'), 'content: detectTukif uses isTukifHost');
  assert(!detectTukifBody.includes('tkn_disclaimer'), 'content: detectTukif no longer matches generic tkn_disclaimer');

  assert(/function cleanTkn\(/.test(src), 'content: cleanTkn exists');
  const cleanTknBody = extractFnBody(src, 'cleanTkn');
  assert(!cleanTknBody.includes('injectLebonpornPageScript'), 'content: cleanTkn does not call injectLebonpornPageScript');

  const cssBlock = (src.match(/const OVERRIDE_CSS = `([\s\S]*?)`;/) || ['', ''])[1];
  assert(!cssBlock.includes('#ageDisclaimerMainBG'), 'OVERRIDE_CSS: no #ageDisclaimerMainBG (pornhub removed)');
  assert(cssBlock.includes('.modal-age-verification'), 'OVERRIDE_CSS: .modal-age-verification');
  assert(cssBlock.includes('#agreement-root'), 'OVERRIDE_CSS: #agreement-root');
  assert(cssBlock.includes('#consent_modal'), 'OVERRIDE_CSS: #consent_modal');
  assert(!cssBlock.includes('#ageverifybox'), 'OVERRIDE_CSS: no #ageverifybox (pornhub removed)');
  assert(cssBlock.includes('custom-disclaimer'), 'OVERRIDE_CSS: custom-disclaimer');
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
      `content.js SITE_PROFILES: ${removedHost} absent (pornhat removed)`
    );
  }
  assert(!popupJs.includes('pornhat.com'), 'popup.js: no pornhat.com (dead site)');

  assert(/function cleanGate18\(/.test(src), 'content: cleanGate18 exists');
  assert(!/function cleanXxxbunker\(/.test(src), 'content: no cleanXxxbunker (off KEEP bench)');
  assert(!/function cleanCam4\(/.test(src), 'content: no cleanCam4 (off KEEP bench)');

  const cssBlock = (src.match(/const OVERRIDE_CSS = `([\s\S]*?)`;/) || ['', ''])[1];
  assert(
    !cssBlock.includes('body[data-ageconfirmed="false"] #overlay'),
    'OVERRIDE_CSS: no body[data-ageconfirmed] #overlay (xxxbunker removed)'
  );
  assert(
    !/(?:^|\n)\s*#overlay\s*\{/.test(cssBlock),
    'OVERRIDE_CSS: no isolated #overlay {'
  );

  const stripchatHostFn = extractFnBody(src, 'isStripchatHost');
  assert(/xtube/.test(stripchatHostFn), 'content: isStripchatHost includes xtube');

  assert(!(mf.permissions || []).includes('tabs'), 'manifest v1.10.3: no tabs permission');
  assert(!(mf.permissions || []).includes('proxy'), 'manifest v1.10.3: no proxy permission');
}

console.log('Test 11: content.js cleaners (txxx/sunporno)');
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
  assert(/teen21/.test(isTxxxHostBody), 'content: isTxxxHost includes teen21');
  assert(/vr-porn/.test(isTxxxHostBody), 'content: isTxxxHost includes vr-porn.tube');

  const cleanSunpornoBody = extractFnBody(src, 'cleanSunporno');
  assert(cleanSunpornoBody.includes('hideSunpornoViewportVeils'), 'cleanSunporno: hideSunpornoViewportVeils');
  assert(cleanSunpornoBody.includes('unlockSunpornoPage'), 'cleanSunporno: unlockSunpornoPage');
  assert(cleanSunpornoBody.includes('injectCSS'), 'cleanSunporno: injectCSS');
  assert(!cleanSunpornoBody.includes("el.style.removeProperty('pointer-events')"), 'cleanSunporno: no removeProperty pointer-events');
  assert(cssBlock.includes('[id*="age-verif"]'), 'OVERRIDE_CSS SUNPORNO: [id*="age-verif"]');
  assert(/\.container/.test(cssBlock), 'OVERRIDE_CSS SUNPORNO: .container deblur');
  assert(src.includes("querySelectorAll('#wrapper, .wrapper, main, .container')"), 'unlockSunpornoPage: .container');

  assert(cssBlock.includes('Over18ModalVariant1Modal'), 'OVERRIDE_CSS shared: Over18ModalVariant1Modal');
  assert(/overflow:\s*auto/.test(cssBlock), 'OVERRIDE_CSS shared: overflow auto');
  assert(/DO NOT hide #overlay/.test(cssBlock), 'OVERRIDE_CSS shared: #overlay comment');

  assert(
    cssBlock.includes('vast_player') || src.includes('vast_player'),
    'content/OVERRIDE: hides vast_player'
  );
  assert(src.includes('poloptrex.com'), 'content: hides poloptrex.com');
  assert(src.includes('mrdmca.com'), 'content: hides mrdmca.com');
  assert(
    /function cleanAds\(/.test(src) || src.includes('cleanAds()'),
    'content: cleanAds (pub/preroll)'
  );
  assert(src.includes('dismissPrerollAds'), 'content: dismissPrerollAds');
  assert(src.includes('killAdVideos'), 'content: killAdVideos');
  assert(src.includes('isAdVideoEl'), 'content: isAdVideoEl');
  assert(src.includes('AD_VIDEO_SRC_RE'), 'content: AD_VIDEO_SRC_RE');
  assert(src.includes('satencedge'), 'content: hides satencedge');
  assert(src.includes('sacfedge'), 'content: hides sacfedge');
  assert(src.includes('skipJwPreroll'), 'content: skipJwPreroll');
  assert(
    !/(?:^|\n)\s*#overlay\s*\{/.test(cssBlock),
    'OVERRIDE_CSS: no isolated #overlay {'
  );

  const isGate18HostBody = extractFnBody(src, 'isGate18Host');
  assert(!isGate18HostBody.includes('pornhat'), 'isGate18Host: no pornhat');
}

console.log('Test 10: bench-sites.mjs (popup bench + SFW/geo catalog)');
{
  const fs = require('fs');
  const path = require('path');
  const benchPath = path.join(__dirname, 'bench-sites.mjs');
  assert(fs.existsSync(benchPath), 'bench-sites.mjs present');
  const benchSrc = fs.readFileSync(benchPath, 'utf8');
  assert(benchSrc.includes('sfw_geo_catalog'), 'bench-sites.mjs: sfw_geo_catalog criterion');
  assert(benchSrc.includes('sfw-page'), 'bench-sites.mjs: sfw-page detection');
  assert(benchSrc.includes('parseSites'), 'bench-sites.mjs: parse popup.js');
  const pkg = require('./package.json');
  assert(pkg.scripts && pkg.scripts['test:sites'] === 'node bench-sites.mjs', 'package.json: script test:sites');
}

console.log('Test 12: bench-strict.mjs (deep seek + video change)');
{
  const fs = require('fs');
  const path = require('path');
  const benchPath = path.join(__dirname, 'bench-strict.mjs');
  assert(fs.existsSync(benchPath), 'bench-strict.mjs present');
  const benchSrc = fs.readFileSync(benchPath, 'utf8');
  assert(benchSrc.includes('function seekDeep'), 'bench-strict: seekDeep');
  assert(benchSrc.includes('proveDeepSeek'), 'bench-strict: proveDeepSeek');
  assert(/55/.test(benchSrc), 'bench-strict: seek beyond 55s (SFW cutoff 44-46s)');
  assert(benchSrc.includes('seek_cutoff'), 'bench-strict: seek_cutoff criterion');
  assert(benchSrc.includes('broken_after_video_change'), 'bench-strict: video change');
  assert(benchSrc.includes('second-seek-fail') || benchSrc.includes('seek2-cutoff'), 'bench-strict: 2nd video seek');
  const pkg = require('./package.json');
  assert(pkg.scripts && pkg.scripts['test:strict'] === 'node bench-strict.mjs', 'package.json: script test:strict');
}

console.log('Test 13: global AgeVerif pipeline');
{
  const fs = require('fs');
  const path = require('path');
  const root = __dirname;
  const mf = require('./manifest.json');

  assert(fs.existsSync(path.join(root, 'ageverif-page.js')), 'ageverif-page.js file present');

  const avPage = fs.readFileSync(path.join(root, 'ageverif-page.js'), 'utf8');
  assert(avPage.includes('__agegoAvReady'), 'ageverif-page: __agegoAvReady');
  assert(avPage.includes('ageverifSuccess'), 'ageverif-page: ageverifSuccess');
  assert(avPage.includes('ageverifReady'), 'ageverif-page: ageverifReady');
  assert(
    avPage.includes('applyStub') || /\.start\s*=/.test(avPage) || avPage.includes('obj.start'),
    'ageverif-page: applyStub or stub .start'
  );
  assert(avPage.includes('_agvface'), 'ageverif-page: _agvface');

  const warAv = (mf.web_accessible_resources || []).find((r) =>
    (r.resources || []).includes('ageverif-page.js')
  );
  assert(!!warAv, 'manifest WAR: ageverif-page.js entry');
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
  assert(detectProfilesBody.includes('detectAgeverif'), 'content: detectProfiles calls detectAgeverif');
  assert(detectProfilesBody.includes("'ageverif'") || detectProfilesBody.includes('"ageverif"'), 'content: detectProfiles ageverif profile');

  const runCleanupBody = extractFnBody(src, 'runCleanup');
  assert(runCleanupBody.includes('cleanAgeverif'), 'content: runCleanup calls cleanAgeverif');

  const initBody = extractFnBody(src, 'init');
  assert(initBody.includes('startGlobalAgeverifWatch'), 'content: init calls startGlobalAgeverifWatch');

  const buildSrc = fs.readFileSync(path.join(root, 'build.ps1'), 'utf8');
  assert(/["']ageverif-page\.js["']/.test(buildSrc), 'build.ps1: $files includes ageverif-page.js');
}

console.log('\n--- Result:', passed, 'OK,', failed, 'failures ---');

process.exit(failed > 0 ? 1 : 0);


