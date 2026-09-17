(function () {
  'use strict';
  if (window.__agegoPhReady) return;
  window.__agegoPhReady = true;

  var loopTimer = null;
  var observer = null;

  // IMPORTANT (documente pour l'utilisateur): en France, Pornhub impose un mode
  // SFW COTE SERVEUR (window.isSfw === "1", body.sfw-page, countryCode "FR").
  // Aucun levier client (cookie/param) ne restaure le catalogue hardcore: c'est
  // une restriction serveur/geo, pas un flou. Ce script se limite donc a: lever
  // la gate d'age FR et proposer le telechargement des videos accessibles.

  function getFlashvars() {
    var key = Object.keys(window).find(function (k) { return /^flashvars_\d+/.test(k); });
    return key ? window[key] : null;
  }

  // URLs de lecture: window.flashvars_{id}.mediaDefinitions (HLS signes).
  function getUrls() {
    var out = { hls: null, levels: [], mp4: null };
    var fv = getFlashvars();
    var defs = fv && fv.mediaDefinitions;
    if (Array.isArray(defs)) {
      defs.forEach(function (d) {
        var url = d && d.videoUrl;
        if (!url) return;
        if (d.format === 'hls') {
          if (typeof d.height === 'number' && d.height > 0) {
            out.levels.push({ h: d.height, url: url });
          } else if (!out.hls) {
            out.hls = url;
          }
        } else if (d.format === 'mp4' && !out.mp4) {
          out.mp4 = url;
        }
      });
      if (!out.hls && out.levels.length) {
        out.hls = out.levels.slice().sort(function (a, b) { return b.h - a.h; })[0].url;
      }
    }
    if (!out.hls && !out.levels.length) {
      var m = document.documentElement.innerHTML.match(/https:\/\/[^"'\s]+master\.m3u8[^"'\s]*/);
      if (m) out.hls = m[0].replace(/\\\//g, '/');
    }
    return out;
  }

  // ------- Telechargement (concat HLS -> .ts, comme xvideos/xhamster) -------
  function sanitizeFilename(name) {
    return (name || 'pornhub')
      .replace(/\s*-\s*Pornhub.*$/i, '')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'pornhub';
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
        addItem('Telecharger ' + l.h + 'p (HLS)', function () {
          downloadHls(l.url, baseName + '_' + l.h + 'p', function (s) { status.textContent = s; });
        });
      });
    } else if (urls.hls) {
      addItem('Telecharger qualite max (HLS)', function () {
        downloadHls(urls.hls, baseName, function (s) { status.textContent = s; });
      });
    }
  }

  function isVideoPage() {
    return /view_video\.php/.test(location.href) || !!getFlashvars();
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
      'background:#ff9000;color:#000;font:700 16px system-ui,Arial,sans-serif;' +
      'border:2px solid #000;border-radius:28px;padding:14px 22px;cursor:pointer;' +
      'box-shadow:0 6px 22px rgba(0,0,0,.55);letter-spacing:.2px;';
    btn.addEventListener('mouseenter', function () { btn.style.background = '#ffad4d'; });
    btn.addEventListener('mouseleave', function () { btn.style.background = '#ff9000'; });
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

  function dismissAgeGate() {
    var btn = document.querySelector('.buttonOver18, .js-closeAgeModal, .js-av-cta');
    if (btn && btn.offsetParent !== null) { try { btn.click(); } catch (_e) {} }
    document.body && document.body.classList.remove('isOpenMTubes');
  }

  function tick() {
    dismissAgeGate();
    ensureButton();
  }

  function startObserver() {
    if (observer) return;
    var pending = false;
    observer = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; dismissAgeGate(); ensureButton(); }, 300);
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  function start() {
    tick();
    startObserver();
    loopTimer = setInterval(tick, 1000);
    setTimeout(function () { if (loopTimer) { clearInterval(loopTimer); loopTimer = null; } }, 20000);
  }

  document.addEventListener('agego-ph-unlock', tick);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
