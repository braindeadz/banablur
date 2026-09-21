(function () {
  'use strict';
  if (window.__agegoAvReady) return;
  window.__agegoAvReady = true;

  function applyStub(obj) {
    if (!obj || typeof obj !== 'object') obj = {};
    obj.verified = true;
    obj.requiresVerification = false;
    obj.start = function () {};
    obj.close = function () {};
    obj.stop = function () {};
    obj.open = function () {};
    obj.show = function () {};
    obj.hide = function () {};
    return obj;
  }

  var stub = applyStub(window.ageverif && typeof window.ageverif === 'object' ? window.ageverif : {});
  try {
    Object.defineProperty(window, 'ageverif', {
      configurable: true,
      enumerable: true,
      get: function () { return stub; },
      set: function (v) { stub = applyStub(v); }
    });
  } catch (_e) {
    window.ageverif = applyStub(window.ageverif);
  }

  window.mrx_ageverif = false;
  window.handleAgeverif = function () {
    window.mrx_ageverif = false;
    applyStub(window.ageverif);
    callSuccess();
  };
  window.handleAgeverifError = function () {};

  function markPassed() {
    try {
      localStorage.setItem('_agvface', 'passed');
      localStorage.setItem('ageverif', '1');
      localStorage.setItem('ageVerified', '1');
      localStorage.setItem('age_verified', '1');
      sessionStorage.setItem('_agvface', 'passed');
    } catch (_e) {}
    try {
      var maxAge = '; path=/; max-age=31536000; SameSite=Lax';
      document.cookie = '_agvface=passed' + maxAge;
      document.cookie = 'ageverif=1' + maxAge;
      document.cookie = 'age_verified=1' + maxAge;
      document.cookie = 'ageVerified=1' + maxAge;
      document.cookie = 'kt_age_verified=1' + maxAge;
      document.cookie = 'kt_is_age_verified=1' + maxAge;
      document.cookie = 'kt_agv=1' + maxAge;
    } catch (_e) {}
    hideFrames();
    try {
      if (window.ktk_player && typeof window.ktk_player.play === 'function') {
        window.ktk_player.play();
      }
    } catch (_e) {}
    try {
      var jw = typeof window.jwplayer === 'function' ? window.jwplayer() : null;
      if (jw && typeof jw.play === 'function') jw.play();
    } catch (_e) {}
  }

  var siteSuccess = typeof window.ageverifSuccess === 'function' ? window.ageverifSuccess : null;
  var siteReady = typeof window.ageverifReady === 'function' ? window.ageverifReady : null;
  var siteError = typeof window.ageverifError === 'function' ? window.ageverifError : null;
  var successCalled = false;

  function callSuccess() {
    markPassed();
    var fn = siteSuccess;
    if (successCalled) {
      if (typeof fn === 'function') {
        try { fn(); } catch (_e) {}
      }
      return;
    }
    successCalled = true;
    try { if (typeof fn === 'function') fn(); } catch (_e) {}
  }

  function callReady() {
    markPassed();
    try { if (typeof siteReady === 'function') siteReady(); } catch (_e) {}
    callSuccess();
  }

  function wrapCallback(name, assignSite, invoke) {
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: function () { return invoke; },
        set: function (v) {
          if (typeof v === 'function') {
            assignSite(v);
            try { invoke(); } catch (_e) {}
          }
        }
      });
    } catch (_e) {
      window[name] = invoke;
    }
  }

  wrapCallback('ageverifSuccess', function (v) { siteSuccess = v; }, function () { callSuccess(); });
  wrapCallback('ageverifReady', function (v) { siteReady = v; }, function () { callReady(); });
  wrapCallback('ageverifError', function (v) { siteError = v; }, function () {});

  function hideFrames() {
    var nodes = document.querySelectorAll(
      'iframe[src*="ageverif"], iframe[src*="static.ageverif"], [class*="ageverif"], [id*="ageverif"], [class*="modal-age"], age-verification'
    );
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.closest && el.closest('video, .player, #kt_player, #player, .jwplayer')) continue;
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
      if (el.tagName === 'IFRAME') {
        el.setAttribute('src', 'about:blank');
      }
    }
    var html = document.documentElement;
    var body = document.body;
    if (html) {
      html.style.setProperty('overflow', 'auto', 'important');
      html.style.setProperty('filter', 'none', 'important');
    }
    if (body) {
      body.style.setProperty('overflow', 'auto', 'important');
      body.style.setProperty('pointer-events', 'auto', 'important');
      body.style.setProperty('filter', 'none', 'important');
    }
  }

  function onNav() {
    successCalled = false;
    hideFrames();
    setTimeout(callSuccess, 0);
    setTimeout(callSuccess, 250);
  }

  try {
    var push = history.pushState;
    var replace = history.replaceState;
    if (typeof push === 'function') {
      history.pushState = function () {
        var ret = push.apply(this, arguments);
        onNav();
        return ret;
      };
    }
    if (typeof replace === 'function') {
      history.replaceState = function () {
        var ret = replace.apply(this, arguments);
        onNav();
        return ret;
      };
    }
  } catch (_e) {}
  window.addEventListener('popstate', onNav);
  window.addEventListener('hashchange', onNav);

  var obs = new MutationObserver(function () { hideFrames(); });
  try {
    obs.observe(document.documentElement, { childList: true, subtree: true });
  } catch (_e) {}

  hideFrames();
  setTimeout(callSuccess, 0);
  setTimeout(callSuccess, 200);
  setTimeout(callSuccess, 800);
})();
