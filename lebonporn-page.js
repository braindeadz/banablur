(function () {
  'use strict';
  if (window.__agegoLbpReady) return;
  window.__agegoLbpReady = true;

  var host = location.hostname.replace(/^www\./i, '');
  var isPlayer = /(^|\.)videos\.lebon\.porn$/i.test(host);

  // --- Player iframe (videos.lebon.porn) ---

  function blockSafeModeMessages() {
    window.addEventListener('message', function (ev) {
      var data = ev.data;
      if (!data || typeof data !== 'object') return;
      var mode = data.player_mode;
      if (mode == null) return;
      if (String(mode).toLowerCase() !== 'default') {
        ev.stopImmediatePropagation();
      }
    }, true);
  }

  function patchPlayerArg(arg) {
    if (!arg || typeof arg !== 'object') return arg;
    if (!arg.plugins) return arg;
    var sm = arg.plugins.safeMode;
    if (!sm) sm = arg.plugins.safeMode = {};
    if (!sm.data) sm.data = {};
    sm.data.player_mode = 'default';
    sm.data.blur_poster = false;
    sm.data.video_timestamp = 0;
    return arg;
  }

  function wrapPlayerArgsPush(arr) {
    if (!Array.isArray(arr) || arr.__agegoLbpArgsHooked) return arr;
    var origPush = arr.push;
    arr.push = function () {
      for (var i = 0; i < arguments.length; i++) {
        patchPlayerArg(arguments[i]);
      }
      return origPush.apply(this, arguments);
    };
    arr.__agegoLbpArgsHooked = true;
    for (var j = 0; j < arr.length; j++) patchPlayerArg(arr[j]);
    return arr;
  }

  function hookPlayerArgs() {
    var existing = window.player_args;
    if (Array.isArray(existing)) {
      wrapPlayerArgsPush(existing);
      return;
    }
    if (window.__agegoLbpArgsDefined) return;
    window.__agegoLbpArgsDefined = true;
    var stored = existing;
    Object.defineProperty(window, 'player_args', {
      configurable: true,
      enumerable: true,
      get: function () { return stored; },
      set: function (v) {
        stored = wrapPlayerArgsPush(Array.isArray(v) ? v : []);
      }
    });
    if (Array.isArray(existing)) window.player_args = existing;
  }

  function requestDefaultMode() {
    var msg = { player_mode: 'default', msg_origin: 'ewkplrpmr' };
    try { window.postMessage(msg, '*'); } catch (_e) {}
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, '*');
      }
    } catch (_e2) {}
  }

  function startPlayerMode() {
    blockSafeModeMessages();
    hookPlayerArgs();
    requestDefaultMode();
    setInterval(requestDefaultMode, 200);
  }

  // --- Page tube (lebon.porn) ---

  function spoofAgeVerif() {
    try {
      if (window.ageverif) {
        window.ageverif.verified = true;
        window.ageverif.requiresVerification = false;
      }
      window.mrx_ageverif = false;
      if (typeof hideSfwImages === 'function') hideSfwImages();
      if (typeof unblurImages === 'function') unblurImages();
      if (typeof unblurVideo === 'function') unblurVideo();
    } catch (_e) {}
  }

  function unlockThumbs() {
    document.querySelectorAll('img[data-type="nsfw"]').forEach(function (img) {
      img.classList.remove('mrx-nsfw', 'mrx-blur');
      var dataSrc = img.getAttribute('data-src') || '';
      var curSrc = img.getAttribute('src') || '';
      if (dataSrc && (!curSrc || curSrc.indexOf('data:') === 0)) img.src = dataSrc;
      img.style.setProperty('filter', 'none', 'important');
      img.style.setProperty('display', 'block', 'important');
    });
    document.querySelectorAll('img.video-img[data-type="sfw"]').forEach(function (img) {
      img.style.display = 'none';
    });
  }

  function unlockIframes() {
    var msg = { player_mode: 'default', msg_origin: 'ewkplrpmr' };
    document.querySelectorAll('iframe[id*="ewok-iframe"], iframe[src*="videos.lebon.porn"]').forEach(function (frame) {
      frame.classList.remove('mrx-blur-20');
      frame.style.filter = 'none';
      try {
        if (frame.contentWindow) frame.contentWindow.postMessage(msg, '*');
      } catch (_e) {}
    });
  }

  function unlock() {
    try { localStorage.adultDisclaimer = 'seen'; } catch (_e) {}
    ['#adult-popup', '#adult-popup-backdrop'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.style.display = 'none';
    });
    if (document.body) document.body.classList.add('mrx-unblur');
    unlockThumbs();
    document.querySelectorAll('.mrx-overlay, .mrx-click-overlay, .mrx-player-blur-overlay, .mrx-blur-overlay').forEach(function (el) {
      el.style.display = 'none';
    });
    spoofAgeVerif();
    unlockIframes();
  }

  function startTube() {
    unlock();
    document.addEventListener('agego-lbp-unlock', unlock);
    setInterval(unlock, 500);
  }

  // --- Demarrage ---

  if (isPlayer) {
    startPlayerMode();
  } else {
    startTube();
  }
})();
