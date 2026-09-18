(function () {
  'use strict';
  if (window.__agegoLbpReady) return;
  window.__agegoLbpReady = true;

  var host = location.hostname.replace(/^www\./i, '');
  var isPlayer = /(^|\.)videos\.(lebon|tukif)\.porn$/i.test(host);
  var SFW_NO_LIMIT = 999999999;

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
    sm.data.video_timestamp = SFW_NO_LIMIT;
    var ts = sm.data.timestamps;
    if (ts && typeof ts === 'object') {
      for (var k in ts) {
        if (Object.prototype.hasOwnProperty.call(ts, k)) {
          ts[k] = String(SFW_NO_LIMIT);
        }
      }
    } else {
      sm.data.timestamps = {};
    }
    sm.data.timestamps['20'] = String(SFW_NO_LIMIT);
    sm.data.timestamps['30'] = String(SFW_NO_LIMIT);
    return arg;
  }

  function patchAllPlayerArgs() {
    var arr = window.player_args;
    if (!Array.isArray(arr)) return;
    for (var i = 0; i < arr.length; i++) patchPlayerArg(arr[i]);
  }

  function forcePlayerVisualUnblur() {
    document.querySelectorAll('video').forEach(function (v) {
      v.style.setProperty('filter', 'none', 'important');
    });
    document.querySelectorAll('canvas').forEach(function (c) {
      c.style.setProperty('filter', 'none', 'important');
    });
  }

  function bindVideoSeekGuard() {
    document.querySelectorAll('video').forEach(function (v) {
      if (v.__agegoLbpSeekHooked) return;
      v.__agegoLbpSeekHooked = true;
      var lastTu = 0;
      function onSeek() {
        patchAllPlayerArgs();
        requestDefaultMode();
        forcePlayerVisualUnblur();
      }
      v.addEventListener('seeking', onSeek, { passive: true });
      v.addEventListener('seeked', onSeek, { passive: true });
      v.addEventListener('timeupdate', function () {
        var now = Date.now();
        if (now - lastTu < 500) return;
        lastTu = now;
        onSeek();
      }, { passive: true });
      forcePlayerVisualUnblur();
    });
  }

  function reapplyPlayerPatch() {
    patchAllPlayerArgs();
    requestDefaultMode();
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
    reapplyPlayerPatch();
    bindVideoSeekGuard();
    setInterval(function () {
      reapplyPlayerPatch();
      bindVideoSeekGuard();
    }, 200);
  }

  // --- Page tube (lebon.porn) ---

  function applyAgeverifStub(obj) {
    if (!obj || typeof obj !== 'object') {
      obj = {};
    }
    obj.verified = true;
    obj.requiresVerification = false;
    obj.start = function () {};
    obj.close = function () {};
    return obj;
  }

  function hookAgeVerifEarly() {
    var stub = applyAgeverifStub({});
    try {
      Object.defineProperty(window, 'ageverif', {
        configurable: true,
        enumerable: true,
        get: function () { return stub; },
        set: function (v) {
          stub = applyAgeverifStub(v);
        }
      });
    } catch (_e) {
      window.ageverif = applyAgeverifStub(window.ageverif);
    }
    window.mrx_ageverif = false;
    window.handleAgeverif = function () {
      window.mrx_ageverif = false;
      applyAgeverifStub(window.ageverif);
    };
    window.handleAgeverifError = function () {};
    window.handleDisclaimerLoad = function () {
      window.mrx_ageverif = false;
      applyAgeverifStub(window.ageverif);
    };
    var helper = window.tkn_disclaimer_helper;
    if (helper && typeof helper === 'object') {
      helper.show_disclaimer_pop = function () {};
      helper.open_ageverif_disclaimer = function () {};
      helper.agepass_check = function () { return true; };
    }
  }

  function setDisclaimerCookies() {
    var path = '; path=/';
    document.cookie = 'dsclcnst=1' + path;
    document.cookie = 'discl_s_t=1' + path;
    document.cookie = 'ckcnsnt=1' + path;
  }

  function spoofAgeVerif() {
    try {
      hookAgeVerifEarly();
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
    document.querySelectorAll('iframe[id*="ewok-iframe"], iframe[src*="videos.lebon.porn"], iframe[src*="videos.tukif.porn"]').forEach(function (frame) {
      frame.classList.remove('mrx-blur-20');
      frame.style.filter = 'none';
      try {
        if (frame.contentWindow) frame.contentWindow.postMessage(msg, '*');
      } catch (_e) {}
    });
  }

  function unlock() {
    hookAgeVerifEarly();
    try { localStorage.adultDisclaimer = 'seen'; } catch (_e) {}
    setDisclaimerCookies();
    ['#adult-popup', '#adult-popup-backdrop', '#disclaimer_parent_wrapper', '#preview_disclaimer_parent_wrapper'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.style.display = 'none';
    });
    document.querySelectorAll('#disclaimer_parent_wrapper .disclaimer_wrapper').forEach(function (el) {
      el.style.display = 'none';
    });
    if (document.body) document.body.classList.add('mrx-unblur');
    unlockThumbs();
    document.querySelectorAll('.mrx-overlay, .mrx-click-overlay, .mrx-player-blur-overlay, .mrx-blur-overlay, .disclaimer_parent_wrapper, .sfw_disclaimer_wrapper, .disclaimer_overlay, .agechecker, .blurmyass').forEach(function (el) {
      el.style.display = 'none';
    });
    spoofAgeVerif();
    unlockIframes();
  }

  function startTube() {
    hookAgeVerifEarly();
    unlock();
    document.addEventListener('agego-lbp-unlock', unlock);
    setInterval(unlock, 500);

    if (!window.__agegoLbpHistHook) {
      window.__agegoLbpHistHook = true;
      var origPush = history.pushState.bind(history);
      var origReplace = history.replaceState.bind(history);
      history.pushState = function () {
        var ret = origPush.apply(history, arguments);
        unlock();
        hookAgeVerifEarly();
        return ret;
      };
      history.replaceState = function () {
        var ret = origReplace.apply(history, arguments);
        unlock();
        hookAgeVerifEarly();
        return ret;
      };
    }

    window.addEventListener('popstate', unlock);
    window.addEventListener('hashchange', unlock);
    window.addEventListener('pageshow', unlock);

    if (!window.__agegoLbpIframeObs) {
      window.__agegoLbpIframeObs = true;

      function isPlayerIframe(el) {
        if (!el || el.tagName !== 'IFRAME') return false;
        var src = el.getAttribute('src') || '';
        return src.indexOf('videos.tukif.porn') !== -1 || src.indexOf('videos.lebon.porn') !== -1;
      }

      function nodeHasPlayerIframe(node) {
        if (node.nodeType !== 1) return false;
        if (isPlayerIframe(node)) return true;
        if (node.querySelectorAll) {
          return node.querySelectorAll('iframe[src*="videos.tukif.porn"], iframe[src*="videos.lebon.porn"]').length > 0;
        }
        return false;
      }

      var iframeObs = new MutationObserver(function (mutations) {
        var addedPlayer = false;
        var srcChanged = false;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type === 'childList') {
            for (var j = 0; j < m.addedNodes.length; j++) {
              if (nodeHasPlayerIframe(m.addedNodes[j])) {
                addedPlayer = true;
                break;
              }
            }
          } else if (m.type === 'attributes' && m.attributeName === 'src' && isPlayerIframe(m.target)) {
            srcChanged = true;
          }
          if (addedPlayer) break;
        }
        if (addedPlayer) {
          unlockIframes();
          unlock();
        } else if (srcChanged) {
          unlockIframes();
        }
      });

      iframeObs.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src']
      });
    }
  }

  // --- Demarrage ---

  if (isPlayer) {
    startPlayerMode();
  } else {
    startTube();
  }
})();
