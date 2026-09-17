(function () {
  'use strict';
  if (window.__agegoCbPageReady) return;
  window.__agegoCbPageReady = true;

  let activeHls = null;
  let watchdogTimer = null;
  let watchdogVideo = null;
  let watchdogSlug = null;
  let lastReloadAt = 0;
  let reloadInProgress = false;
  let activeManifestUrl = null;

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function destroyOverlay() {
    if (watchdogTimer) {
      clearInterval(watchdogTimer);
      watchdogTimer = null;
    }
    watchdogVideo = null;
    watchdogSlug = null;
    if (activeHls) {
      try {
        activeHls.destroy();
      } catch (_e) {
        /* ignore */
      }
      activeHls = null;
    }
    document.getElementById('agego-live-overlay')?.remove();
    if (activeManifestUrl) {
      URL.revokeObjectURL(activeManifestUrl);
      activeManifestUrl = null;
    }
  }

  function isBlackFrame(video) {
    if (!video || video.readyState < 2 || !video.videoWidth) return false;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 18;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      let sumSquared = 0;
      const count = pixels.length / 4;
      for (let index = 0; index < pixels.length; index += 4) {
        const luminance = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
        sum += luminance;
        sumSquared += luminance * luminance;
      }
      const mean = sum / count;
      const variance = sumSquared / count - mean * mean;
      return mean < 4 && variance < 5;
    } catch (_error) {
      return false;
    }
  }

  async function silentReload(slug, video) {
    if (reloadInProgress || Date.now() - lastReloadAt < 6000) return false;
    reloadInProgress = true;
    lastReloadAt = Date.now();
    try {
      const data = await fetchStreamUrl(slug);
      if (!data?.url) return false;
      if (activeHls) {
        try {
          activeHls.stopLoad();
        } catch (_error) {
          /* ignore */
        }
      }
      video.pause();
      const played = await playHlsOnVideo(video, data.url);
      if (played) {
        await Promise.race([video.play().catch(() => {}), sleep(3000)]);
        return (await waitForVideoSize(video, 10000)) >= 160;
      }
      return false;
    } catch (_error) {
      return false;
    } finally {
      reloadInProgress = false;
    }
  }

  function startWatchdog(video, slug) {
    if (watchdogTimer) clearInterval(watchdogTimer);
    watchdogVideo = video;
    watchdogSlug = slug;
    let lastTime = video.currentTime;
    let stalledSince = 0;
    let blackFrames = 0;

    watchdogTimer = setInterval(() => {
      if (video !== watchdogVideo || slug !== watchdogSlug || reloadInProgress) return;
      const playing = !video.paused && !video.ended && video.readyState >= 2;
      if (!playing) return;

      if (Math.abs(video.currentTime - lastTime) < 0.05) {
        stalledSince ||= Date.now();
      } else {
        stalledSince = 0;
      }
      lastTime = video.currentTime;
      blackFrames = isBlackFrame(video) ? blackFrames + 1 : 0;

      if ((stalledSince && Date.now() - stalledSince >= 4000) || blackFrames >= 2) {
        stalledSince = 0;
        blackFrames = 0;
        silentReload(slug, video);
      }
    }, 1500);
  }

  async function ensureHls() {
    if (window.Hls?.isSupported?.()) return true;

    const src = document.documentElement.dataset.agegoHlsSrc;
    if (!src || document.documentElement.dataset.agegoHlsLoading === '1') {
      for (let i = 0; i < 30; i++) {
        if (window.Hls?.isSupported?.()) return true;
        await sleep(100);
      }
      return false;
    }

    document.documentElement.dataset.agegoHlsLoading = '1';
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      (document.head || document.documentElement).appendChild(script);
    }).catch(() => {});

    document.documentElement.dataset.agegoHlsLoading = '0';
    return window.Hls?.isSupported?.() ?? false;
  }

  function createOverlay(slug) {
    destroyOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'agego-live-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box';

    const panel = document.createElement('div');
    panel.style.cssText =
      'position:relative;width:min(960px,92vw);aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6)';

    const title = document.createElement('div');
    title.textContent = slug;
    title.style.cssText =
      'position:absolute;top:8px;left:12px;z-index:2;color:#fff;font:14px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none';

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.title = 'Fermer';
    close.style.cssText =
      'position:absolute;top:8px;right:8px;z-index:3;width:36px;height:36px;border:none;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;font:24px/1 sans-serif;cursor:pointer';
    close.addEventListener('click', destroyOverlay);

    const video = document.createElement('video');
    video.id = 'agego-live-video';
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute('playsinline', '');
    video.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000;display:block';

    panel.appendChild(title);
    panel.appendChild(close);
    panel.appendChild(video);
    overlay.appendChild(panel);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) destroyOverlay();
    });
    document.body.appendChild(overlay);

    return video;
  }

  // Chaturbate annonce une variante HEVC (hvc1) non decodable par MSE dans
  // Chromium, ce qui fait echouer tout le manifeste. On reecrit le manifeste
  // maitre pour ne garder que les variantes H.264 (avc1) + l'audio AAC.
  async function buildCompatibleManifest(masterUrl) {
    const resp = await fetch(masterUrl, { credentials: 'omit' });
    if (!resp.ok) return null;
    const text = await resp.text();
    if (!text.includes('#EXT-X-STREAM-INF')) return null;

    const abs = (uri) => new URL(uri.trim(), masterUrl).href;
    const lines = text.split('\n');
    const out = [];
    let keptVariant = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#EXT-X-MEDIA')) {
        out.push(line.replace(/URI="([^"]+)"/, (_m, u) => `URI="${abs(u)}"`));
        continue;
      }

      if (line.startsWith('#EXT-X-STREAM-INF')) {
        const codecs = /CODECS="([^"]*)"/.exec(line)?.[1] || '';
        const isHevc = /hvc1|hev1/i.test(codecs);
        const uriLine = lines[i + 1] || '';
        if (isHevc) {
          i++; // saute aussi la ligne URI de la variante HEVC
          continue;
        }
        out.push(line);
        if (uriLine && !uriLine.startsWith('#')) {
          out.push(abs(uriLine));
          keptVariant = true;
          i++;
        }
        continue;
      }

      if (line && !line.startsWith('#')) {
        // ligne URI orpheline (deja geree ci-dessus) -> ignorer
        continue;
      }

      out.push(line);
    }

    if (!keptVariant) return null;

    const blob = new Blob([out.join('\n')], { type: 'application/vnd.apple.mpegurl' });
    return URL.createObjectURL(blob);
  }

  async function playHlsOnVideo(video, rawUrl) {
    video.muted = true;

    let url = rawUrl;
    try {
      const compat = await buildCompatibleManifest(rawUrl);
      if (compat) {
        if (activeManifestUrl) URL.revokeObjectURL(activeManifestUrl);
        activeManifestUrl = compat;
        url = compat;
      }
    } catch (_e) {
      /* on garde l'URL d'origine */
    }

    if (await ensureHls()) {
      if (activeHls) {
        try {
          activeHls.destroy();
        } catch (_e) {
          /* ignore */
        }
      }
      activeHls = new window.Hls({
        enableWorker: false,
        lowLatencyMode: false,
        backBufferLength: 30,
        manifestLoadingTimeOut: 12000,
        levelLoadingTimeOut: 12000,
        fragLoadingTimeOut: 20000,
      });

      const outcome = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve('timeout'), 12000);
        activeHls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          clearTimeout(timer);
          resolve('parsed');
        });
        activeHls.on(window.Hls.Events.FRAG_LOADED, () => {
          try {
            document.documentElement.dataset.agegoFragLoaded = '1';
          } catch (_err) {
            /* ignore */
          }
        });
        activeHls.on(window.Hls.Events.ERROR, (_e, data) => {
          try {
            document.documentElement.dataset.agegoHlsError =
              (data?.type || '') + '/' + (data?.details || '') + '/fatal=' + !!data?.fatal +
              '/code=' + (data?.response?.code || '');
          } catch (_err) {
            /* ignore */
          }
          if (data?.fatal) {
            clearTimeout(timer);
            resolve('error');
          if (watchdogSlug && watchdogVideo) {
            silentReload(watchdogSlug, watchdogVideo);
          }
          }
        });
        activeHls.loadSource(url);
        activeHls.attachMedia(video);
      });

      if (outcome === 'error') return false;
    } else if (video.canPlayType('application/vnd.apple.mpegURL')) {
      video.src = url;
      video.load();
    } else {
      return false;
    }

    await Promise.race([video.play().catch(() => {}), sleep(4000)]);
    return true;
  }

  async function waitForVideoSize(video, maxMs) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if ((video.videoWidth ?? 0) >= 160) return video.videoWidth;
      await sleep(400);
    }
    return video.videoWidth ?? 0;
  }

  async function fetchStreamUrl(slug) {
    const response = await fetch('/get_edge_hls_url_ajax/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: 'room_slug=' + encodeURIComponent(slug),
    });
    const data = await response.json();
    return data;
  }

  async function unlockStream(slug) {
    if (!slug) return { ok: false, reason: 'no slug' };

    const first = await fetchStreamUrl(slug);
    if (!first?.url) {
      return { ok: false, reason: 'no url', status: first?.room_status };
    }

    const video = createOverlay(slug);

    // Certains edges/tokens renvoient 403 : on reessaie avec une URL fraiche.
    let lastW = 0;
    for (let attempt = 0; attempt < 4; attempt++) {
      let url = first.url;
      if (attempt > 0) {
        const retry = await fetchStreamUrl(slug);
        if (!retry?.url) {
          if (retry?.room_status && retry.room_status !== 'public') {
            return { ok: false, reason: 'no url', status: retry.room_status };
          }
          await sleep(800);
          continue;
        }
        url = retry.url;
      }

      const played = await playHlsOnVideo(video, url);
      if (played) {
        lastW = await waitForVideoSize(video, 12000);
        if (lastW >= 160) {
          startWatchdog(video, slug);
          return { ok: true, videoW: lastW, slug, method: 'agego-live-overlay', attempts: attempt + 1 };
        }
      }
      await sleep(600);
    }

    return { ok: false, videoW: lastW, slug, reason: 'edge 403 / no frames', method: 'agego-live-overlay' };
  }

  document.addEventListener('agego-unlock-stream', async (event) => {
    const slug = event.detail?.slug;
    const reqId = event.detail?.id;
    let result = { ok: false, reason: 'unknown' };
    try {
      result = await unlockStream(slug);
    } catch (err) {
      result = { ok: false, reason: String(err) };
    }
    document.dispatchEvent(
      new CustomEvent('agego-unlock-result', { detail: { id: reqId, result } })
    );
  });

  let clickLoading = null;

  function onRoomClick(event) {
    const link = event.target?.closest?.('a.RoomCardThumbnail');
    if (!link) return;

    const slug =
      link.querySelector('img.RoomCardThumbnail__image')?.alt ||
      (link.getAttribute('href') || link.pathname || '').split('/').filter(Boolean)[0];
    if (!slug) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (clickLoading === slug && document.getElementById('agego-live-overlay')) return;
    clickLoading = slug;
    unlockStream(slug)
      .catch(() => {})
      .finally(() => {
        clickLoading = null;
      });
  }

  ['pointerdown', 'mousedown', 'click'].forEach((type) => {
    document.addEventListener(type, onRoomClick, true);
  });
})();
