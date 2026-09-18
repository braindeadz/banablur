const api = typeof chrome !== 'undefined' ? chrome : typeof browser !== 'undefined' ? browser : null;

const els = {
  hostname: document.getElementById('hostname'),
  dotProfiles: document.getElementById('dot-profiles'),
  labelProfiles: document.getElementById('label-profiles'),
  dotWatchdog: document.getElementById('dot-watchdog'),
  labelWatchdog: document.getElementById('label-watchdog'),
  dotThreat: document.getElementById('dot-threat'),
  labelThreat: document.getElementById('label-threat'),
  dotVideo: document.getElementById('dot-video'),
  labelVideo: document.getElementById('label-video'),
  toggleAuto: document.getElementById('toggle-auto'),
  btnForce: document.getElementById('btn-force'),
  toggleProxy: document.getElementById('toggle-proxy'),
  btnProxyRefresh: document.getElementById('btn-proxy-refresh'),
  proxyInfo: document.getElementById('proxy-info'),
  lastCleanup: document.getElementById('last-cleanup'),
  feedback: document.getElementById('feedback'),
};

function sendToRuntime(message) {
  return new Promise((resolve) => {
    try {
      api.runtime.sendMessage(message, (response) => {
        void api.runtime.lastError;
        resolve(response || {});
      });
    } catch (_e) {
      resolve({});
    }
  });
}

async function refreshProxyUI() {
  const st = await sendToRuntime({ action: 'proxy:getStatus' });
  els.toggleProxy.checked = st.enabled !== false;
  els.proxyInfo.textContent = st.list && st.list.length
    ? `Proxy : ${st.enabled ? 'actif' : 'inactif'} (${st.list.length} dispo, ${st.list[0]})`
    : 'Proxy : —';
}

function setDot(el, state) {
  el.className = 'dot ' + state;
}

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function showFeedback(text, isError) {
  els.feedback.hidden = false;
  els.feedback.textContent = text;
  els.feedback.classList.toggle('error', !!isError);
}

function updateUI(status) {
  els.hostname.textContent = status.hostname || '—';

  const profiles = status.profiles || [];
  if (profiles.length) {
    setDot(els.dotProfiles, 'ok');
    els.labelProfiles.textContent = 'Profils : ' + profiles.join(', ');
  } else if (status.agegoDetected || status.xvideosDetected || status.xhamsterDetected || status.xhamsterLiveDetected || status.faphouseDetected || status.chaturbateDetected || status.lebonpornDetected || status.tukifDetected) {
    setDot(els.dotProfiles, 'warn');
    els.labelProfiles.textContent = 'Profils : detecte (non actif)';
  } else {
    setDot(els.dotProfiles, 'off');
    els.labelProfiles.textContent = 'Profils : aucun';
  }

  if (status.watchdogActive) {
    setDot(els.dotWatchdog, status.autoEnabled ? 'ok' : 'warn');
    els.labelWatchdog.textContent = status.autoEnabled
      ? 'Watchdog : actif'
      : 'Watchdog : actif (auto en pause)';
  } else {
    setDot(els.dotWatchdog, 'off');
    els.labelWatchdog.textContent = 'Watchdog : inactif';
  }

  if (status.threatPresent) {
    setDot(els.dotThreat, 'danger');
    els.labelThreat.textContent = 'Menace : overlay/blur present';
  } else {
    setDot(els.dotThreat, 'ok');
    els.labelThreat.textContent = 'Menace : aucune';
  }

  if (status.videoSfw || status.videoBlurred) {
    setDot(els.dotVideo, 'danger');
    els.labelVideo.textContent = status.videoSfw
      ? 'Video : flux SFW / blur actif'
      : 'Video : blur CSS actif';
  } else if (
    status.xvideosDetected ||
    status.xhamsterDetected ||
    status.xhamsterLiveDetected ||
    status.faphouseDetected ||
    status.chaturbateDetected ||
    status.lebonpornDetected ||
    status.tukifDetected ||
    profiles.includes('xvideos') ||
    profiles.includes('xhamster') ||
    profiles.includes('xhamsterlive') ||
    profiles.includes('faphouse') ||
    profiles.includes('chaturbate') ||
    profiles.includes('lebonporn') ||
    profiles.includes('tukif')
  ) {
    setDot(els.dotVideo, 'ok');
    els.labelVideo.textContent = 'Video : nette';
  } else {
    setDot(els.dotVideo, 'off');
    els.labelVideo.textContent = 'Video : —';
  }

  els.toggleAuto.checked = status.autoEnabled !== false;
  els.lastCleanup.textContent = 'Dernier nettoyage : ' + formatTime(status.lastCleanup);
}

async function getActiveTab() {
  const tabs = await api.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function sendToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    api.tabs.sendMessage(tabId, message, (response) => {
      if (api.runtime.lastError) {
        reject(new Error(api.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function refreshStatus() {
  try {
    const tab = await getActiveTab();
    if (!tab?.id) return;

    els.hostname.textContent = tab.url ? new URL(tab.url).hostname : '—';

    if (
      tab.url?.startsWith('chrome:') ||
      tab.url?.startsWith('about:') ||
      tab.url?.startsWith('moz-extension:')
    ) {
      showFeedback("Ouvrez un site web pour utiliser l'extension.", true);
      return;
    }

    const status = await sendToTab(tab.id, { action: 'getStatus' });
    updateUI(status);
  } catch (_err) {
    showFeedback("Rechargez la page apres installation de l'extension.", true);
  }
}

async function init() {
  const stored = await api.storage.local.get(['autoEnabled']);
  els.toggleAuto.checked = stored.autoEnabled !== false;

  els.toggleAuto.addEventListener('change', async () => {
    try {
      const tab = await getActiveTab();
      const status = await sendToTab(tab.id, {
        action: 'setAutoEnabled',
        enabled: els.toggleAuto.checked,
      });
      updateUI(status);
      showFeedback(
        els.toggleAuto.checked ? 'Suppression auto activee.' : 'Suppression auto desactivee.',
        false
      );
    } catch (_err) {
      showFeedback('Impossible de communiquer avec la page.', true);
    }
  });

  els.btnForce.addEventListener('click', async () => {
    els.btnForce.disabled = true;
    try {
      const tab = await getActiveTab();
      await sendToTab(tab.id, { action: 'forceCleanup' });
      const status = await sendToTab(tab.id, { action: 'getStatus' });
      updateUI(status);
      showFeedback(
        status.threatPresent ? 'Nettoyage force — menace residuelle.' : 'Nettoyage force reussi.',
        !!status.threatPresent
      );
    } catch (_err) {
      showFeedback('Rechargez la page puis reessayez.', true);
    } finally {
      els.btnForce.disabled = false;
    }
  });

  els.toggleProxy.addEventListener('change', async () => {
    const r = await sendToRuntime({ action: 'proxy:setEnabled', enabled: els.toggleProxy.checked });
    showFeedback(
      els.toggleProxy.checked ? 'Proxy xHamster active.' : 'Proxy xHamster desactive.',
      r && r.ok === false
    );
    await refreshProxyUI();
  });

  els.btnProxyRefresh.addEventListener('click', async () => {
    els.btnProxyRefresh.disabled = true;
    els.proxyInfo.textContent = 'Proxy : rafraichissement...';
    const r = await sendToRuntime({ action: 'proxy:refresh' });
    showFeedback(r && r.ok ? `Proxys rafraichis (${r.count}).` : 'Echec du rafraichissement.', !(r && r.ok));
    await refreshProxyUI();
    els.btnProxyRefresh.disabled = false;
  });

  await refreshStatus();
  await refreshProxyUI();
}

init();
