// Banablur — AgeVerif checker 2.8.0 (ageverif.com) shadow guard.
//
// The checker paints its gate into the CLOSED shadow root of an <ageverif-checker> host it appends to
// <html>, then watches that host: removing it, or changing its style, or emptying the overlay it put
// in the shadow root, makes it blur the page and render a red "Checker closed unexpectedly /
// DOM_TAMPERING" panel. Touching the host is therefore a losing move.
//
// This is the one thing that cannot be done from a stylesheet or a content script (the shadow root is
// closed and the host carries an inline "all: initial !important"), so it runs in the page world at
// document_start: attachShadow() is redirected for that single tag, so the overlay is attached to a
// detached element and nothing is ever painted, while the host, its style and its observers stay
// exactly as the checker left them.
(function () {
  'use strict';
  if (window.__banablurShadowGuard) return;
  window.__banablurShadowGuard = true;

  const proto = window.Element && Element.prototype;
  if (!proto || typeof proto.attachShadow !== 'function') return;
  const orig = proto.attachShadow;

  proto.attachShadow = function (init) {
    if (this && this.tagName === 'AGEVERIF-CHECKER') {
      return orig.call(document.createElement('div'), init);
    }
    return orig.apply(this, arguments);
  };

  // content.js (isolated world) reads this to know the guard is in place; it also keeps the legacy
  // page script injection out of the way on these sites.
  try {
    document.documentElement.setAttribute('data-banablur-guard', 'shadow');
  } catch (_e) {}
})();
