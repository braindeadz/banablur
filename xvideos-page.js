(function () {
  'use strict';
  if (window.__agegoXvReady) return;
  window.__agegoXvReady = true;
  window.__agegoXvDone = false;

  var MAX_INIT_ATTEMPTS = 5;
  var initAttempts = 0;
  var loopTimer = null;
  var observer = null;
  var busy = false;

  function getId() {
    const hp = window.html5player;
    if (hp && (hp.id_video || hp.iVideoId || hp.video_id)) {
      return String(hp.id_video || hp.iVideoId || hp.video_id);
    }
    const html = document.documentElement.innerHTML;
    const patterns = [/"id"\s*:\s*(\d+)\s*,\s*"issfw"/, /id_video["'\s:=]+(\d+)/, /embedframe\/(\d+)/];
    for (const p of patterns) {
      const m = html.match(p);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  function getToken() {
    // Encoded URL token (e.g. video.ooebhhp39c3): embedframe takes it in
    // priority; some numeric IDs return 404 while the token works.
    const hp = window.html5player;
    if (hp && hp.encoded_id_video) return String(hp.encoded_id_video);
    const m = location.pathname.match(/\/video[.-](\w+)(\/|$)/);
    return m ? m[1] : null;
  }

  async function fetchEmbedframe(key) {
    if (!key) return null;
    try {
      const r = await fetch('/embedframe/' + key, { credentials: 'include' });
      if (!r.ok) return null;
      const t = await r.text();
      const high = (t.match(/setVideoUrlHigh\('([^']+)'\)/) || [])[1] || null;
      const low = (t.match(/setVideoUrlLow\('([^']+)'\)/) || [])[1] || null;
      const hls = (t.match(/setVideoHLS\('([^']+)'\)/) || [])[1] || null;
      if (!high && !low && !hls) return null;
      return { high: high, low: low, hls: hls };
    } catch (_e) {
      return null;
    }
  }

  async function fetchUrls(id) {
    // Token first (reliable), then numeric ID as fallback — user IP only.
    const urls = (await fetchEmbedframe(getToken())) || (await fetchEmbedframe(id));
    if (urls) window.__agegoXvUrls = urls;
    return urls;
  }

  // ---------------------------------------------------------------------------
  // Floating download button (quality menu)
  // ---------------------------------------------------------------------------

  function sanitizeFilename(name) {
    return (name || 'xvideos')
      .replace(/\s*-\s*(XVIDEOS|XNXX)\.COM.*$/i, '')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'xvideos';
  }

  // Retrieve already-fetched URLs, otherwise resolve them on demand on click.
  async function resolveUrls() {
    if (window.__agegoXvUrls) return window.__agegoXvUrls;
    const id = getId();
    return await fetchUrls(id);
  }

  // MP4: cross-origin CDN URL -> the download attribute is ignored, we go through
  // the chrome.downloads API via the content script (event -> service worker).
  function triggerBrowserDownload(url, filename) {
    document.dispatchEvent(
      new CustomEvent('agego-xv-download', { detail: { url: url, filename: filename } })
    );
  }

  // HLS: we download by concatenating the TS segments of the highest variant.
  // The blob is same-origin -> the download attribute works (real .ts file).
  async function downloadHls(masterUrl, baseName, statusFn) {
    try {
      statusFn && statusFn('HLS: reading manifest...');
      const master = await (await fetch(masterUrl, { credentials: 'include' })).text();
      const base = masterUrl.replace(/[^/]*$/, '');
      // Master playlist: choose the variant with the highest resolution/bandwidth.
      const variants = [];
      const lines = master.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('#EXT-X-STREAM-INF') === 0) {
          const bw = parseInt((lines[i].match(/BANDWIDTH=(\d+)/) || [])[1] || '0', 10);
          const res = (lines[i].match(/RESOLUTION=\d+x(\d+)/) || [])[1];
          const uri = (lines[i + 1] || '').trim();
          if (uri && uri[0] !== '#') variants.push({ bw: bw, h: parseInt(res || '0', 10), uri: uri });
        }
      }
      let mediaUrl = masterUrl;
      if (variants.length) {
        variants.sort(function (a, b) { return (b.h - a.h) || (b.bw - a.bw); });
        mediaUrl = new URL(variants[0].uri, base).href;
      }
      statusFn && statusFn('HLS: reading segments...');
      const media = await (await fetch(mediaUrl, { credentials: 'include' })).text();
      const mBase = mediaUrl.replace(/[^/]*$/, '');
      const segs = media.split(/\r?\n/).filter(function (l) { return l && l[0] !== '#'; })
        .map(function (u) { return new URL(u, mBase).href; });
      if (!segs.length) throw new Error('no segment');
      const parts = [];
      for (let i = 0; i < segs.length; i++) {
        statusFn && statusFn('HLS: segment ' + (i + 1) + '/' + segs.length);
        const buf = await (await fetch(segs[i], { credentials: 'include' })).arrayBuffer();
        parts.push(buf);
      }
      const blob = new Blob(parts, { type: 'video/mp2t' });
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = baseName + '.ts';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(objUrl); }, 60000);
      statusFn && statusFn('HLS: download started');
    } catch (e) {
      statusFn && statusFn('HLS: failure (' + (e && e.message) + ')');
    }
  }

  function labelForMp4(url, fallback) {
    const m = (url || '').match(/(\d{3,4})p/);
    return m ? m[1] + 'p (MP4)' : fallback;
  }

  function closeDownloadMenu() {
    const m = document.getElementById('agego-dl-menu');
    if (m) m.remove();
  }

  async function openDownloadMenu(anchor) {
    closeDownloadMenu();
    const menu = document.createElement('div');
    menu.id = 'agego-dl-menu';
    menu.style.cssText =
      'position:fixed;bottom:74px;right:20px;z-index:2147483647;background:#1b1b1b;' +
      'color:#fff;border:1px solid #444;border-radius:10px;padding:8px;min-width:220px;' +
      'font:13px/1.4 system-ui,Arial,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.5);';
    const status = document.createElement('div');
    status.style.cssText = 'padding:6px 8px;color:#bbb;min-height:16px;';
    status.textContent = 'Resolving sources...';
    const list = document.createElement('div');
    menu.appendChild(list);
    menu.appendChild(status);
    document.body.appendChild(menu);

    const urls = await resolveUrls();
    const baseName = sanitizeFilename(document.title);
    list.innerHTML = '';
    if (!urls || (!urls.high && !urls.low && !urls.hls)) {
      status.textContent = 'No source found.';
      return;
    }
    status.textContent = '';

    function addItem(text, onClick) {
      const item = document.createElement('div');
      item.textContent = text;
      item.style.cssText =
        'padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;';
      item.addEventListener('mouseenter', function () { item.style.background = '#333'; });
      item.addEventListener('mouseleave', function () { item.style.background = 'transparent'; });
      item.addEventListener('click', onClick);
      list.appendChild(item);
    }

    if (urls.high) {
      addItem('Download ' + labelForMp4(urls.high, 'High quality (MP4)'), function () {
        triggerBrowserDownload(urls.high, baseName + '.mp4');
        status.textContent = 'MP4 download started';
      });
    }
    if (urls.low && urls.low !== urls.high) {
      addItem('Download ' + labelForMp4(urls.low, 'Low quality (MP4)'), function () {
        triggerBrowserDownload(urls.low, baseName + '_low.mp4');
        status.textContent = 'MP4 download started';
      });
    }
    if (urls.hls) {
      addItem('Download max quality (HLS, slower)', function () {
        downloadHls(urls.hls, baseName, function (s) { status.textContent = s; });
      });
    }
  }

  function ensureDownloadButton() {
    if (!/\/video[.-][\w]+/i.test(location.pathname)) return;
    if (document.getElementById('agego-dl-btn')) return;
    if (!document.body) return;
    const btn = document.createElement('button');
    btn.id = 'agego-dl-btn';
    btn.type = 'button';
    btn.title = 'Download this video';
    btn.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" ' +
      'stroke-linejoin="round" style="flex:0 0 auto;"><path d="M12 3v12"/>' +
      '<path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg>' +
      '<span>Download</span>';
    btn.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:2147483647;' +
      'display:inline-flex;align-items:center;gap:10px;' +
      'background:#ff9600;color:#000;font:700 16px system-ui,Arial,sans-serif;' +
      'border:2px solid #000;border-radius:28px;padding:14px 22px;cursor:pointer;' +
      'box-shadow:0 6px 22px rgba(0,0,0,.55);letter-spacing:.2px;';
    btn.addEventListener('mouseenter', function () { btn.style.background = '#ffb84d'; });
    btn.addEventListener('mouseleave', function () { btn.style.background = '#ff9600'; });
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (document.getElementById('agego-dl-menu')) { closeDownloadMenu(); return; }
      openDownloadMenu(btn);
    });
    document.body.appendChild(btn);
    document.addEventListener('click', function (e) {
      if (btn.contains(e.target)) return;
      const menu = document.getElementById('agego-dl-menu');
      if (menu && !menu.contains(e.target)) closeDownloadMenu();
    });
  }

  function getVideo() {
    const vids = [].slice.call(document.querySelectorAll('#hlsplayer video, #html5video video'));
    // Prefer the <video> that is actually playing (real source + decoded frame).
    const playing = vids.find(function (v) {
      const s = v.currentSrc || v.src || '';
      return s && s.indexOf('video_sfw') === -1 && v.videoWidth > 0;
    });
    return playing || vids[0] || null;
  }

  function clearBlockers() {
    // Non-destructive: we HIDE instead of removing, so as to never change the
    // page height (repeated .remove() calls caused the scroll to jump back up).
    document.querySelectorAll('.sfw-blur, .sfw-click-area, .sfw-click').forEach(function (e) {
      e.style.setProperty('display', 'none', 'important');
    });
    document.querySelectorAll('.sfw-playlocked').forEach(function (e) {
      e.classList.remove('sfw-playlocked', 'sfw-click');
      e.style.removeProperty('filter');
    });
    // Blurred poster ONLY inside the player: hide (not remove).
    document.querySelectorAll('#hlsplayer .video-pic, #html5video .video-pic').forEach(function (e) {
      const img = e.querySelector('img');
      if (img && ((img.getAttribute('style') || '').indexOf('blur') !== -1 || getComputedStyle(img).filter.indexOf('blur') !== -1)) {
        e.style.setProperty('display', 'none', 'important');
      }
    });
    document.querySelectorAll('.video-click-handler').forEach(function (e) {
      e.style.setProperty('pointer-events', 'none', 'important');
    });
  }

  function dismissDisclaimer() {
    // The site's age disclaimer pins the page to the top via a scrollTo(0,0)
    // loop as long as it thinks it is displayed. We close it cleanly via its API,
    // which stops that loop and removes the global blur classes.
    if (window.__agegoDisclaimerClosed) return;
    try {
      // Priority to the real "Enter" button: its handler stops the site's
      // scrollTo(0,0) setInterval (closed-over function, otherwise unreachable).
      const btn = document.querySelector('button.disclaimer-enter');
      if (btn) { btn.click(); window.__agegoDisclaimerClosed = true; return; }
      const d = window.xv && window.xv.disclaimer;
      if (!d) return;
      if (d.bIsAgeWarning && typeof d.setAgeWarning === 'function') {
        d.setAgeWarning(false, false);
      }
      if (typeof d.close_pop === 'function') d.close_pop();
      window.__agegoDisclaimerClosed = true;
    } catch (_e) {}
  }

  function disableCast() {
    const hp = window.html5player;
    const noop = function () {};
    if (hp) {
      ['chromecastVideo', 'toggleChromecastCurrentStatus', 'initAirPlay', 'initAirPlayEvents',
       'drawAirPlayControls', 'chromecastInit', 'initChromecast'].forEach(function (m) {
        try { if (typeof hp[m] === 'function') hp[m] = noop; } catch (_e) {}
      });
      try { hp.isAirPlayAvailable = function () { return false; }; } catch (_e) {}
      try { hp.isCurCCastStatAnyLoading = function () { return false; }; } catch (_e) {}
      hp.bChromecastAvailable = false;
      hp.chromecastAvailable = false;
    }
    const v = getVideo();
    if (v) {
      try { v.disableRemotePlayback = true; } catch (_e) {}
    }
    try {
      if (navigator.presentation) navigator.presentation.defaultRequest = null;
    } catch (_e) {}
    document.querySelectorAll(
      '.pif-chromecast, .pif-chromecast-on, .pif-chromecast-off-red, .cast-device-name, .chromecast-progress, .cc-button'
    ).forEach(function (e) { e.style.setProperty('display', 'none', 'important'); });
    const casting = [...document.querySelectorAll('#hlsplayer *, #html5video *')].filter(function (e) {
      return /currently casting/i.test(e.textContent || '') && e.offsetHeight > 0;
    });
    casting.forEach(function (e) { e.style.setProperty('display', 'none', 'important'); });
  }

  // Force the real <video> to be visible and remove any black layer placed over it.
  function forceVideoVisible() {
    const v = getVideo();
    if (!v) return;
    v.style.setProperty('opacity', '1', 'important');
    v.style.setProperty('visibility', 'visible', 'important');
    v.style.setProperty('display', 'block', 'important');
    v.classList.remove('sfw-playlocked', 'sfw-click', 'fake');
    // The real player (native MP4) is sometimes inside a #hlsplayer container set to
    // display:none, while an empty/paused <video> stays visible on top:
    // this is the cause of the black screen with sound. We un-hide the ancestors of
    // the real <video> and hide the empty duplicates.
    let anc = v.parentElement;
    let guardAnc = 0;
    while (anc && anc !== document.body && guardAnc < 8) {
      guardAnc++;
      if (getComputedStyle(anc).display === 'none') {
        anc.style.setProperty('display', 'block', 'important');
      }
      anc = anc.parentElement;
    }
    document.querySelectorAll('#hlsplayer video, #html5video video').forEach(function (other) {
      if (other === v) return;
      const s = other.currentSrc || other.src || '';
      if (!s || other.videoWidth === 0) {
        other.style.setProperty('display', 'none', 'important');
      }
    });
    const rect = v.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) return;
    // Hide the layers interposed between the center point and the <video>
    // (poster, black overlay...), without touching the player controls.
    let guard = 0;
    let el = document.elementFromPoint(cx, cy);
    while (el && el !== v && guard < 6) {
      guard++;
      if (el.tagName === 'VIDEO' || el.contains(v)) break;
      const cls = el.className && typeof el.className === 'string' ? el.className : '';
      const isControl = /progress|control|button|pif-|player-bar|slider|menu/i.test(cls);
      if (!isControl && (el.tagName === 'IMG' || el.tagName === 'CANVAS' || /video-pic|thumb|poster|sfw|blur|overlay|click/i.test(cls))) {
        el.style.setProperty('display', 'none', 'important');
      } else {
        el.style.setProperty('pointer-events', 'none', 'important');
        break;
      }
      el = document.elementFromPoint(cx, cy);
    }
  }

  function isPlayable() {
    const v = getVideo();
    if (!v) return false;
    const src = v.currentSrc || v.src || '';
    return !!src && src.indexOf('video_sfw') === -1 && v.videoWidth > 0 && v.readyState >= 2;
  }

  function hasControls() {
    const v = getVideo();
    // The only reliable bar = native browser controls (v.controls). The site's
    // custom bar (.progress-bar-bg) is just a non-functional background we neutralize.
    if (v && v.controls) return true;
    return !!document.querySelector('.progress-bar-bg, .progress-bar, [class*="progress-bar"]');
  }

  // Force the highest HLS level (1080p if available) instead of leaving auto or the 360p MP4.
  function forceMaxQuality() {
    const hp = window.html5player;
    if (!hp) return;
    const h = hp.hlsobj || hp.hls || null;
    if (!h || !h.levels || !h.levels.length) return;
    let maxI = -1;
    let maxH = -1;
    h.levels.forEach(function (l, i) {
      if (l && l.height > maxH) { maxH = l.height; maxI = i; }
    });
    if (maxI < 0) return;
    try { if (h.currentLevel !== maxI) h.currentLevel = maxI; } catch (_e) {}
    try { h.startLevel = maxI; } catch (_e) {}
    try { h.loadLevel = maxI; } catch (_e) {}
  }

  // A single bar: we keep the native controls and neutralize the site's residual
  // custom bar that was overlapping and intercepting clicks.
  var SKIN_SELECTORS = ['.progress-bar-bg', '.video-bar', '.buttons-bar', '.pgbar-cursor-detect',
    'p.video-title', 'button.clip-subscribe', '.video-subscribe', '.subscribe',
    '.slowseek-info', '.seek-cursor', '.seek-thumb', '.seek-text',
    '.video-ended-desktop', '.top-top', '.big-buttons', '.video-loader',
    // Central translucent pill: container of the cast controls (its
    // children were already hidden, but not the box with the 65% black background).
    '.cast-ctrls', '.centered-box'];

  // Permanent stylesheet: the site regularly resets the inline display of its
  // skin (e.g. .big-buttons on play/pause); an !important CSS rule wins over a
  // non-important inline style and lasts over time.
  function injectSkinCss() {
    if (document.getElementById('agego-skin-css')) return;
    const sel = ['#hlsplayer', '#html5video'].map(function (s) {
      return SKIN_SELECTORS.map(function (k) { return s + ' ' + k; }).join(', ');
    }).join(', ');
    const st = document.createElement('style');
    st.id = 'agego-skin-css';
    st.textContent = sel + ' { display: none !important; pointer-events: none !important; }\n' +
      '#hlsplayer, #html5video { cursor: auto !important; }';
    (document.head || document.documentElement).appendChild(st);
  }

  function neutralizeSiteBar() {
    injectSkinCss();
    const v = getVideo();
    if (v && !v.controls) {
      try { v.controls = true; } catch (_e) {}
    }
    // The site's entire custom skin (progress bar, button bar for
    // play/pause/volume/subscribe, overlaid title, big central button,
    // end-of-video overlay, slowseek, loader): we keep ONLY the
    // native controls.
    const SKIN = SKIN_SELECTORS;
    const scopes = ['#hlsplayer', '#html5video'];
    const sel = scopes.map(function (s) {
      return SKIN.map(function (k) { return s + ' ' + k; }).join(', ');
    }).join(', ');
    document.querySelectorAll(sel).forEach(function (e) {
      e.style.setProperty('pointer-events', 'none', 'important');
      e.style.setProperty('display', 'none', 'important');
    });
    // The site sets cursor:none on the player (its skin handles the cursor):
    // we restore the cursor since only the native controls remain.
    scopes.forEach(function (s) {
      const c = document.querySelector(s);
      if (c && getComputedStyle(c).cursor === 'none') {
        c.style.setProperty('cursor', 'auto', 'important');
      }
    });
  }

  // Disable the player's "limited SFW" mode: without this, the site loops the
  // first ~44 seconds (iSfwIntroDur) with video.loop=true -> impression that
  // only the safe preview plays on loop.
  function disableSfwLimit() {
    const hp = window.html5player;
    if (hp) {
      try { hp.bIsSfwLimited = false; } catch (_e) {}
      try { hp.iSfwIntroDur = 0; } catch (_e) {}
      try { hp.sSfwIntroUrl = ''; } catch (_e) {}
    }
    document.querySelectorAll('#hlsplayer video, #html5video video').forEach(function (v) {
      if (v.loop) v.loop = false;
    });
  }

  // Stop and hide the SFW/preview (content-safe) player that overlays the real video.
  function stopSfwVideos() {
    const real = getVideo();
    document.querySelectorAll('#hlsplayer video, #html5video video').forEach(function (o) {
      if (o === real) return;
      const s = o.currentSrc || o.src || '';
      const isSfw = s.indexOf('video_sfw') !== -1 || s.indexOf('sfw') !== -1;
      if (isSfw || !s || o.videoWidth === 0) {
        try { o.pause(); } catch (_e) {}
        o.style.setProperty('display', 'none', 'important');
      }
    });
  }

  function markDone() {
    if (window.__agegoXvDone) return;
    window.__agegoXvDone = true;
    // Signal to the content script (isolated world) that it can stop dispatching.
    try { document.documentElement.dataset.agegoXvDone = '1'; } catch (_e) {}
    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
    startObserver();
  }

  // Watch for the return of SFW blockers / cast buttons without rebuilding the player.
  function startObserver() {
    if (observer) return;
    var pending = false;
    observer = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () {
        pending = false;
        if (document.querySelector('.sfw-blur, .sfw-click-area, .sfw-playlocked')) clearBlockers();
        dismissDisclaimer();
        disableCast();
        disableSfwLimit();
        stopSfwVideos();
        neutralizeSiteBar();
        forceMaxQuality();
        forceVideoVisible();
        ensureDownloadButton();
      }, 200);
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  // Confirm the video is really playing (currentTime advancing) before freezing the state.
  function watchPlayback() {
    const v = getVideo();
    if (!v) return;
    const t0 = v.currentTime;
    setTimeout(function () {
      const nv = getVideo();
      if (nv && isPlayable() && nv.currentTime > t0) {
        forceMaxQuality();
        disableSfwLimit();
        neutralizeSiteBar();
        stopSfwVideos();
        forceVideoVisible();
        markDone();
      }
    }, 1200);
  }

  function initPlayer(urls) {
    const hp = window.html5player;
    if (!hp || !urls) return false;
    clearBlockers();
    if (urls.high) hp.setVideoUrlHigh(urls.high);
    if (urls.low) hp.setVideoUrlLow(urls.low);
    if (urls.hls) hp.setVideoHLS(urls.hls);
    // HLS pipeline (and NOT the forced native MP4): only HLS exposes 1080p; it also
    // produces a single clean <video> (avoids the duplicate/black screen of native mode).
    hp.use_hlsjs = true;
    disableSfwLimit();
    ['initPlayer', 'showPlayer', 'draw', 'setupEvents'].forEach(function (fn) {
      try { if (typeof hp[fn] === 'function') hp[fn](); } catch (_e) {}
    });
    try { if (typeof hp.initHls === 'function') hp.initHls(); } catch (_e) {}
    disableCast();
    ['loadVideoSrc', 'showVideoControls'].forEach(function (fn) {
      try { if (typeof hp[fn] === 'function') hp[fn](); } catch (_e) {}
    });
    try { if (hp.play) hp.play(); } catch (_e) {}
    forceMaxQuality();
    neutralizeSiteBar();
    forceVideoVisible();
    // If HLS did not yield a playable video, we will try the MP4 fallback in unlock().
    return isPlayable() || hasControls();
  }

  async function unlock() {
    dismissDisclaimer();
    if (window.__agegoXvDone) { disableCast(); return; }
    if (busy) return;
    const hp = window.html5player;
    if (!hp) return;
    const id = getId();
    if (!id) return;

    if (isPlayable() && hasControls()) {
      forceMaxQuality();
      disableSfwLimit();
      neutralizeSiteBar();
      stopSfwVideos();
      forceVideoVisible();
      disableCast();
      markDone();
      return;
    }

    if (initAttempts >= MAX_INIT_ATTEMPTS) {
      // Stop rebuilding the player in a loop: we just observe.
      forceVideoVisible();
      disableCast();
      startObserver();
      return;
    }

    busy = true;
    initAttempts++;
    try {
      const urls = await fetchUrls(id);
      if (!urls) return;
      const ok = initPlayer(urls);
      if (!ok) {
        const nv = getVideo();
        const src = urls.high || urls.low || urls.hls;
        if (nv && src) {
          clearBlockers();
          nv.src = src;
          nv.controls = true;
          try { nv.disableRemotePlayback = true; } catch (_e) {}
          nv.load();
          if (nv.play) nv.play().catch(function () {});
          forceVideoVisible();
        }
      }
      watchPlayback();
    } finally {
      busy = false;
    }
  }

  document.addEventListener('agego-xv-unlock', function () { unlock(); });

  function start() {
    ensureDownloadButton();
    unlock();
    loopTimer = setInterval(function () {
      ensureDownloadButton();
      if (window.__agegoXvDone) { clearInterval(loopTimer); loopTimer = null; return; }
      disableCast();
      unlock();
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
