(function () {
  'use strict';
  if (window.__agegoXhReady) return;
  window.__agegoXhReady = true;

  var loopTimer = null;
  var observer = null;
  var lastPath = '';
  var lastVideoId = '';
  var seekBoundVideo = null;
  var AGE_TEXT = /v[ée]rifier votre [âa]ge|verify your age|30 secondes|continue watching/i;
  var COOKIE_BTN = /accept all cookies|tout accepter|accepter tout|j'?accepte|^ok$/i;

  // ---------------------------------------------------------------------------
  // Deverrouillage SFW (xhamster 2026): le blocage n'est plus un flou CSS mais
  // le module runtime window.xplayer.sfw qui coupe la video apres
  // moderationTimestamp (~151s) et affiche une verification. On neutralise ce
  // module au lieu de tenter un swap /sfw/ (obsolete: le CDN renvoie 403).
  // ---------------------------------------------------------------------------
  // IMPORTANT (audit live fra.xhamster): le handler SFW fait
  // `moderationTimestamp > currentTime ? hideVerification() : showVerification()`.
  // Mettre 0 force donc l'overlay EN PERMANENCE (0 > t est toujours faux). Il faut
  // au contraire une TRES GRANDE valeur pour que hideVerification() reste actif et
  // que la video soit lisible en entier. On garde le noop des handlers en defense.
  var SFW_NO_LIMIT = 999999999;
  function disableSfw() {
    try {
      if (window.initials && window.initials.xplayerSettings && window.initials.xplayerSettings.sfw) {
        window.initials.xplayerSettings.sfw.moderationTimestamp = SFW_NO_LIMIT;
      }
    } catch (_e) {}
    var xp = window.xplayer;
    if (!xp || !xp.sfw) return;
    try {
      if (xp.sfw.options) xp.sfw.options.moderationTimestamp = SFW_NO_LIMIT;
      xp.sfw.moderationTimestamp = SFW_NO_LIMIT;
    } catch (_e) {}
    var noop = function () {};
    ['showVerification', 'sfwEventHandler'].forEach(function (m) {
      try { if (typeof xp.sfw[m] === 'function') xp.sfw[m] = noop; } catch (_e) {}
    });
    try { if (typeof xp.sfw.hideVerification === 'function') xp.sfw.hideVerification(); } catch (_e) {}
    try { xp.sfw.isShowingVerification = false; } catch (_e) {}
    var v = getVideo();
    if (v) { try { v.loop = false; } catch (_e) {} }
  }

  function injectSfwHideCss() {
    if (document.getElementById('agego-xh-sfw-css')) return;
    var st = document.createElement('style');
    st.id = 'agego-xh-sfw-css';
    st.textContent =
      '.xp-sfw, .xp-sfw__background, .xp-sfw__content, .xp-sfw__verify, [class*="xp-sfw"] ' +
      '{ display: none !important; visibility: hidden !important; pointer-events: none !important; ' +
      'backdrop-filter: none !important; -webkit-backdrop-filter: none !important; filter: none !important; }';
    (document.head || document.documentElement).appendChild(st);
  }

  function hideSfwBlurOverlay() {
    injectSfwHideCss();
    document.querySelectorAll('.xp-sfw, .xp-sfw__background, .xp-sfw__content, .xp-sfw__verify, [class*="xp-sfw"]').forEach(function (e) {
      e.style.setProperty('display', 'none', 'important');
      e.style.setProperty('visibility', 'hidden', 'important');
      e.style.setProperty('pointer-events', 'none', 'important');
      e.style.setProperty('backdrop-filter', 'none', 'important');
      e.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      e.style.setProperty('filter', 'none', 'important');
    });
    var xp = window.xplayer;
    if (xp && xp.sfw) {
      try { if (typeof xp.sfw.hideVerification === 'function') xp.sfw.hideVerification(); } catch (_e) {}
      try { xp.sfw.isShowingVerification = false; } catch (_e) {}
    }
  }

  function bindVideoSeekGuard() {
    var v = getVideo();
    if (!v || v === seekBoundVideo) return;
    seekBoundVideo = v;
    var onSeek = function () {
      disableSfw();
      hideSfwBlurOverlay();
      hideAgeOverlays();
      fixPlayerBlur();
    };
    ['seeked', 'timeupdate', 'playing', 'loadeddata'].forEach(function (ev) {
      v.addEventListener(ev, onSeek, { passive: true });
    });
  }

  function getVideo() {
    return document.querySelector('#xplayer__video, .player-container__player video, video');
  }

  function getVideoId() {
    try {
      if (window.initials && window.initials.videoModel && window.initials.videoModel.id) {
        return String(window.initials.videoModel.id);
      }
    } catch (_e) {}
    var m = location.pathname.match(/\/videos\/[^/]+-(\d+)/);
    return m ? m[1] : location.pathname;
  }

  // Masque l'overlay de verification d'age (reapparait au changement de video SPA).
  function hideAgeOverlays() {
    document.querySelectorAll('.xp-sfw, .xp-sfw__background, .xp-sfw__content, [class*="xp-sfw"]').forEach(function (e) {
      e.style.setProperty('display', 'none', 'important');
      e.style.setProperty('visibility', 'hidden', 'important');
      e.style.setProperty('pointer-events', 'none', 'important');
    });
    document.querySelectorAll('div, section, aside, button, a, p, span').forEach(function (e) {
      if (e.id === 'agego-dl-btn' || e.id === 'agego-dl-menu') return;
      var t = (e.textContent || '').trim();
      if (t.length > 400 || t.length < 20) return;
      if (!AGE_TEXT.test(t)) return;
      if (e.offsetWidth < 80 || e.offsetHeight < 40) return;
      e.style.setProperty('display', 'none', 'important');
      e.style.setProperty('pointer-events', 'none', 'important');
    });
    var xp = window.xplayer;
    if (xp && xp.sfw) {
      try { if (typeof xp.sfw.hideVerification === 'function') xp.sfw.hideVerification(); } catch (_e) {}
      try { xp.sfw.isShowingVerification = false; } catch (_e) {}
    }
  }

  // Deflou le lecteur video lui-meme (pas seulement les miniatures).
  function fixPlayerBlur() {
    var v = getVideo();
    var scopes = ['#xplayer', '#xplayer__video', '.player-container', '.player-container__player', '.xplayer'];
    scopes.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (e) {
        e.style.setProperty('filter', 'none', 'important');
        e.style.setProperty('backdrop-filter', 'none', 'important');
        e.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      });
    });
    if (v) {
      v.style.setProperty('filter', 'none', 'important');
      v.style.setProperty('opacity', '1', 'important');
      v.style.setProperty('visibility', 'visible', 'important');
      var anc = v.parentElement;
      var guard = 0;
      while (anc && anc !== document.body && guard < 10) {
        guard++;
        anc.style.setProperty('filter', 'none', 'important');
        anc.style.setProperty('backdrop-filter', 'none', 'important');
        anc.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        anc = anc.parentElement;
      }
      var rect = v.getBoundingClientRect();
      if (rect.width > 20 && rect.height > 20) {
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var guard2 = 0;
        var el = document.elementFromPoint(cx, cy);
        while (el && el !== v && guard2 < 8) {
          guard2++;
          if (el.id === 'agego-dl-btn' || el.id === 'agego-dl-menu') break;
          if (el.tagName === 'VIDEO' || el.contains(v)) break;
          var cls = el.className && typeof el.className === 'string' ? el.className : '';
          if (/xp-sfw|sfw|verification|blur|overlay|helper/i.test(cls)) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
          } else {
            el.style.setProperty('pointer-events', 'none', 'important');
            break;
          }
          el = document.elementFromPoint(cx, cy);
        }
      }
    }
  }

  function injectCookieHideCss() {
    if (document.getElementById('agego-xh-cookie-css')) return;
    var st = document.createElement('style');
    st.id = 'agego-xh-cookie-css';
    st.textContent =
      '.cookies-announce, .cookie-banner, .cookies-modal, .dialog-cookies, ' +
      '[class*="CookieBanner"], [class*="cookieBanner"], [class*="cookie-banner"], ' +
      '[class*="cookies-dialog"], [class*="consent-dialog"], [data-role="cookies-dialog"] ' +
      '{ display: none !important; visibility: hidden !important; pointer-events: none !important; }';
    (document.head || document.documentElement).appendChild(st);
  }

  function hideCookieBanner() {
    injectCookieHideCss();
    var btn = [].slice.call(document.querySelectorAll('button, a[role="button"], [role="button"]')).find(function (b) {
      return COOKIE_BTN.test((b.textContent || '').trim());
    });
    if (btn) { try { btn.click(); } catch (_e) {} }
    var selectors = [
      '.cookies-announce', '.cookie-banner', '.cookies-modal', '.dialog-cookies',
      '[data-role="cookies-dialog"]', '[class*="CookieBanner"]', '[class*="cookies-dialog"]',
      '[class*="consent-dialog"]',
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (e) {
        e.style.setProperty('display', 'none', 'important');
        e.style.setProperty('visibility', 'hidden', 'important');
        e.style.setProperty('pointer-events', 'none', 'important');
      });
    });
    document.querySelectorAll('[role="dialog"], .modal, .dialog-wrapper').forEach(function (e) {
      if (e.id === 'agego-dl-btn' || e.id === 'agego-dl-menu') return;
      var t = (e.textContent || '').slice(0, 800);
      if (!/cookie|consent|tout accepter|accept all/i.test(t)) return;
      if (!e.querySelector('button')) return;
      var st = getComputedStyle(e);
      if (st.position !== 'fixed' && st.position !== 'absolute') return;
      e.style.setProperty('display', 'none', 'important');
      e.style.setProperty('visibility', 'hidden', 'important');
      e.style.setProperty('pointer-events', 'none', 'important');
    });
    try { document.documentElement.classList.remove('modal-open', 'no-scroll', 'overflow-hidden'); } catch (_e) {}
    try { document.body.classList.remove('modal-open', 'no-scroll', 'overflow-hidden'); } catch (_e) {}
    if (document.body) document.body.style.setProperty('overflow', 'auto', 'important');
  }

  // Deflou des vignettes related (classe semantique, pas de filter mesure, mais
  // on retire quand meme tout filter inline par securite).
  function fixThumbnails() {
    // Conteneurs marques "blurred" (classe semantique).
    document.querySelectorAll(
      '.video-preview.blurred, .thumb-8dafc, .replacement-template.blurred, [class*="blurred"]'
    ).forEach(function (e) {
      e.classList.remove('blurred');
    });
    // Couches de flou reelles (audit fra): filter blur(30px) + background-image,
    // backdrop-filter sur les previews HLS animees, overlays helper.
    document.querySelectorAll(
      '.xh-helper-blurred-background, .xh-helper-blurred-overlay, .mn-thumb__hls-wrapper'
    ).forEach(function (e) {
      e.style.setProperty('filter', 'none', 'important');
      e.style.setProperty('backdrop-filter', 'none', 'important');
      e.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    });
    // Zones player + miniatures uniquement (pas toute la page).
    var scopes = [
      '#xplayer', '.player-container', '.player-container__player', '.xplayer',
      '.thumb-list-container', '.related-videos', '.video-list', 'aside', '.mn-thumb__hls-wrapper',
    ];
    scopes.forEach(function (sel) {
      document.querySelectorAll(sel + ' img, ' + sel + ' video, ' + sel + ' span, ' + sel + ' div, ' + sel + ' a').forEach(function (e) {
        var st = getComputedStyle(e);
        var inline = e.getAttribute('style') || '';
        if (inline.indexOf('blur') !== -1 || st.filter.indexOf('blur') !== -1) {
          e.style.setProperty('filter', 'none', 'important');
        }
        if ((st.backdropFilter && st.backdropFilter.indexOf('blur') !== -1) ||
          (st.webkitBackdropFilter && st.webkitBackdropFilter.indexOf('blur') !== -1)) {
          e.style.setProperty('backdrop-filter', 'none', 'important');
          e.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        }
      });
    });
  }

  // URLs de lecture: lues sur sourceController (tokens dechiffres par xplayer).
  function getUrls() {
    var out = { hls: null, levels: [] };
    try {
      var sc = window.xplayer && window.xplayer.core && window.xplayer.core.sourceController;
      if (sc) {
        out.hls = sc.hlsSource || (sc.hls && sc.hls._url) || null;
        var levels = sc.hls && sc.hls.levels;
        if (levels && levels.length) {
          out.levels = levels.map(function (l) {
            var u = l.url;
            if (Array.isArray(u)) u = u[0];
            return { h: l.height || 0, url: u || null };
          }).filter(function (l) { return l.url; });
        }
      }
    } catch (_e) {}
    if (!out.hls) {
      // Fallback: regex m3u8 dans le HTML.
      var m = document.documentElement.innerHTML.match(/https:\/\/[^"'\s]+\.h264\.mp4\.m3u8[^"'\s]*/);
      if (m) out.hls = m[0].replace(/\\\//g, '/');
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Bouton flottant de telechargement (concat HLS -> fichier .ts)
  // ---------------------------------------------------------------------------
  function sanitizeFilename(name) {
    return (name || 'xhamster')
      .replace(/\s*-\s*xHamster.*$/i, '')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'xhamster';
  }

  async function downloadHls(masterUrl, baseName, statusFn) {
    try {
      statusFn && statusFn('HLS: lecture du manifeste...');
      var masterTxt = await (await fetch(masterUrl, { credentials: 'include' })).text();
      var base = masterUrl.replace(/[^/]*$/, '');
      var variants = [];
      var lines = masterTxt.split(/\r?\n/);
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('#EXT-X-STREAM-INF') === 0) {
          var bw = parseInt((lines[i].match(/BANDWIDTH=(\d+)/) || [])[1] || '0', 10);
          var res = (lines[i].match(/RESOLUTION=\d+x(\d+)/) || [])[1];
          var uri = (lines[i + 1] || '').trim();
          if (uri && uri[0] !== '#') variants.push({ bw: bw, h: parseInt(res || '0', 10), uri: uri });
        }
      }
      var mediaUrl = masterUrl;
      if (variants.length) {
        variants.sort(function (a, b) { return (b.h - a.h) || (b.bw - a.bw); });
        mediaUrl = new URL(variants[0].uri, base).href;
      }
      statusFn && statusFn('HLS: lecture des segments...');
      var media = await (await fetch(mediaUrl, { credentials: 'include' })).text();
      var mBase = mediaUrl.replace(/[^/]*$/, '');
      var segs = media.split(/\r?\n/).filter(function (l) { return l && l[0] !== '#'; })
        .map(function (u) { return new URL(u, mBase).href; });
      if (!segs.length) throw new Error('aucun segment');
      var parts = [];
      for (var s = 0; s < segs.length; s++) {
        statusFn && statusFn('HLS: segment ' + (s + 1) + '/' + segs.length);
        parts.push(await (await fetch(segs[s], { credentials: 'include' })).arrayBuffer());
      }
      var blob = new Blob(parts, { type: 'video/mp2t' });
      var objUrl = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = objUrl;
      a.download = baseName + '.ts';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(objUrl); }, 60000);
      statusFn && statusFn('HLS: telechargement lance');
    } catch (e) {
      statusFn && statusFn('HLS: echec (' + (e && e.message) + ')');
    }
  }

  function closeMenu() {
    var m = document.getElementById('agego-dl-menu');
    if (m) m.remove();
  }

  function openMenu() {
    closeMenu();
    var menu = document.createElement('div');
    menu.id = 'agego-dl-menu';
    menu.style.cssText =
      'position:fixed;bottom:74px;right:20px;z-index:2147483647;background:#1b1b1b;' +
      'color:#fff;border:1px solid #444;border-radius:10px;padding:8px;min-width:220px;' +
      'font:13px/1.4 system-ui,Arial,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.5);';
    var list = document.createElement('div');
    var status = document.createElement('div');
    status.style.cssText = 'padding:6px 8px;color:#bbb;min-height:16px;';
    menu.appendChild(list);
    menu.appendChild(status);
    document.body.appendChild(menu);

    var urls = getUrls();
    var baseName = sanitizeFilename(document.title);
    if (!urls.hls && !urls.levels.length) {
      status.textContent = 'Aucune source trouvee (lance la lecture puis reessaie).';
      return;
    }
    function addItem(text, onClick) {
      var item = document.createElement('div');
      item.textContent = text;
      item.style.cssText = 'padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;';
      item.addEventListener('mouseenter', function () { item.style.background = '#333'; });
      item.addEventListener('mouseleave', function () { item.style.background = 'transparent'; });
      item.addEventListener('click', onClick);
      list.appendChild(item);
    }
    if (urls.levels.length) {
      urls.levels.slice().sort(function (a, b) { return b.h - a.h; }).forEach(function (l) {
        addItem('Telecharger ' + (l.h ? l.h + 'p' : '') + ' (HLS)', function () {
          downloadHls(l.url, baseName + (l.h ? '_' + l.h + 'p' : ''), function (s) { status.textContent = s; });
        });
      });
    } else if (urls.hls) {
      addItem('Telecharger qualite max (HLS)', function () {
        downloadHls(urls.hls, baseName, function (s) { status.textContent = s; });
      });
    }
  }

  function isVideoPage() {
    return /\/videos\//.test(location.pathname) || !!document.querySelector('#xplayer__video');
  }

  function ensureButton() {
    if (!isVideoPage()) return;
    if (document.getElementById('agego-dl-btn')) return;
    if (!document.body) return;
    var btn = document.createElement('button');
    btn.id = 'agego-dl-btn';
    btn.type = 'button';
    btn.title = 'Telecharger cette video';
    btn.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" ' +
      'stroke-linejoin="round" style="flex:0 0 auto;"><path d="M12 3v12"/>' +
      '<path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg>' +
      '<span>Telecharger</span>';
    btn.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:2147483647;' +
      'display:inline-flex;align-items:center;gap:10px;' +
      'background:#e6007e;color:#fff;font:700 16px system-ui,Arial,sans-serif;' +
      'border:2px solid #fff;border-radius:28px;padding:14px 22px;cursor:pointer;' +
      'box-shadow:0 6px 22px rgba(0,0,0,.55);letter-spacing:.2px;';
    btn.addEventListener('mouseenter', function () { btn.style.background = '#ff2ea0'; });
    btn.addEventListener('mouseleave', function () { btn.style.background = '#e6007e'; });
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (document.getElementById('agego-dl-menu')) { closeMenu(); return; }
      openMenu();
    });
    document.body.appendChild(btn);
    document.addEventListener('click', function (e) {
      if (btn.contains(e.target)) return;
      var menu = document.getElementById('agego-dl-menu');
      if (menu && !menu.contains(e.target)) closeMenu();
    });
  }

  function tick() {
    var path = location.pathname;
    var vid = getVideoId();
    if (path !== lastPath || vid !== lastVideoId) {
      lastPath = path;
      lastVideoId = vid;
    }
    hideCookieBanner();
    disableSfw();
    hideSfwBlurOverlay();
    hideAgeOverlays();
    bindVideoSeekGuard();
    fixPlayerBlur();
    fixThumbnails();
    ensureButton();
  }

  function startObserver() {
    if (observer) return;
    var pending = false;
    observer = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () {
        pending = false;
        var vid = getVideoId();
        if (location.pathname !== lastPath || vid !== lastVideoId) {
          lastPath = location.pathname;
          lastVideoId = vid;
        }
        hideCookieBanner();
        disableSfw();
        hideSfwBlurOverlay();
        hideAgeOverlays();
        bindVideoSeekGuard();
        fixPlayerBlur();
        fixThumbnails();
        ensureButton();
      }, 200);
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  }

  function start() {
    lastPath = location.pathname;
    lastVideoId = getVideoId();
    tick();
    startObserver();
    if (!loopTimer) loopTimer = setInterval(tick, 500);
  }

  document.addEventListener('agego-xh-unlock', tick);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
