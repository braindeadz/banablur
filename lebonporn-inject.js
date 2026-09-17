(function () {
  'use strict';

  var docEl = document.documentElement;
  if (!docEl) return;

  if (docEl.dataset.agegoLbpInjected === '1') return;
  try {
    if (window.wrappedJSObject && window.wrappedJSObject.__agegoLbpReady) return;
  } catch (_e) {}

  var api = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);
  if (!api || !api.runtime || !api.runtime.getURL) return;

  docEl.dataset.agegoLbpInjected = '1';

  var pageUrl = api.runtime.getURL('lebonporn-page.js');
  var injected = false;

  function injectCode(code) {
    if (!code || injected) return false;
    try {
      var script = document.createElement('script');
      script.textContent = code;
      (docEl || document.head).appendChild(script);
      script.remove();
      injected = true;
      return true;
    } catch (_e) {
      return false;
    }
  }

  function fetchSync(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      if (xhr.status === 200 || xhr.status === 0) return xhr.responseText;
    } catch (_e) {}
    return null;
  }

  function fetchAsync(url, callback) {
    try {
      if (typeof fetch === 'function') {
        fetch(url).then(function (r) { return r.text(); }).then(function (text) {
          callback(text);
        }).catch(function () {
          callback(null);
        });
        return;
      }
    } catch (_e) {}
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onload = function () {
        callback(xhr.status === 200 || xhr.status === 0 ? xhr.responseText : null);
      };
      xhr.onerror = function () { callback(null); };
      xhr.send(null);
    } catch (_e) {
      callback(null);
    }
  }

  function startFallback() {
    if (injected) return;
    var payload = { player_mode: 'default', msg_origin: 'ewkplrpmr' };
    var targets = [window];
    try {
      if (window.parent && window.parent !== window) targets.push(window.parent);
    } catch (_e) {}

    setInterval(function () {
      for (var i = 0; i < targets.length; i++) {
        try {
          var msg = payload;
          if (typeof cloneInto === 'function') {
            msg = cloneInto(payload, targets[i]);
          }
          targets[i].postMessage(msg, '*');
        } catch (_e) {}
      }
    }, 200);
  }

  var code = fetchSync(pageUrl);
  if (code && injectCode(code)) return;
  if (code) {
    startFallback();
    return;
  }

  fetchAsync(pageUrl, function (asyncCode) {
    if (asyncCode && injectCode(asyncCode)) return;
    startFallback();
  });
})();
