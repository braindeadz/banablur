const api = typeof chrome !== 'undefined' ? chrome : typeof browser !== 'undefined' ? browser : null;

const SUPPORTED_SITES = [
  { name: 'XVIDEOS', url: 'https://www.xvideos.com' },
  { name: 'XNXX', url: 'https://www.xnxx.com' },
  { name: 'xHamster', url: 'https://www.xhamster.com' },
  { name: 'xHamster Live', url: 'https://fr.xhamsterlive.com' },
  { name: 'Pornhub', url: 'https://www.pornhub.com' },
  { name: 'Chaturbate', url: 'https://chaturbate.com' },
  { name: 'LebonPorn', url: 'https://lebon.porn' },
  { name: 'Tukif', url: 'https://tukif.porn' },
  { name: 'FapHouse', url: 'https://www.faphouse.com' },
  { name: 'Deviants', url: 'https://deviants.com' },
  { name: 'AlohaTube', url: 'https://www.alohatube.com' },
  { name: 'AnalDin', url: 'https://www.analdin.com' },
  { name: 'Beeg', url: 'https://beeg.com' },
  { name: 'BongaCams', url: 'https://bongacams.com' },
  { name: 'CAM4', url: 'https://cam4.com' },
  { name: 'DrTuber', url: 'https://www.drtuber.com' },
  { name: 'Empflix', url: 'https://www.empflix.com' },
  { name: 'Eporner', url: 'https://www.eporner.com' },
  { name: 'HClips', url: 'https://hclips.com' },
  { name: 'HDZog', url: 'https://hdzog.com' },
  { name: 'HDTube', url: 'https://www.hdtube.porn' },
  { name: 'HellPorno', url: 'https://www.hellporno.com' },
  { name: 'HQPorner', url: 'https://hqporner.com' },
  { name: 'Jacquie et Michel', url: 'https://www.jacquieetmichel.net' },
  { name: 'Jacquie et Michel TV', url: 'https://www.jacquieetmicheltv.net' },
  { name: 'LiveJasmin', url: 'https://www.livejasmin.com' },
  { name: 'Motherless', url: 'https://www.motherless.com' },
  { name: 'MovieFap', url: 'https://www.moviefap.com' },
  { name: 'Nuvid', url: 'https://www.nuvid.com' },
  { name: 'PerfectGirls', url: 'https://www.perfectgirls.xxx' },
  { name: 'Porn.com', url: 'https://www.porn.com' },
  { name: 'PornDig', url: 'https://www.porndig.com' },
  { name: 'PornHat', url: 'https://www.pornhat.com' },
  { name: 'PornOne', url: 'https://www.pornone.com' },
  { name: 'PornTube', url: 'https://www.porntube.com' },
  { name: 'Rule34', url: 'https://rule34.xxx' },
  { name: 'SpankBang', url: 'https://spankbang.com' },
  { name: 'Stripchat', url: 'https://stripchat.com' },
  { name: 'Streamate', url: 'https://www.streamate.com' },
  { name: 'SunPorno', url: 'https://www.sunporno.com' },
  { name: 'sxyprn', url: 'https://sxyprn.com' },
  { name: 'TNAFlix', url: 'https://www.tnaflix.com' },
  { name: 'ThisVid', url: 'https://thisvid.com' },
  { name: 'Tube8', url: 'https://www.tube8.com' },
  { name: 'TXXX', url: 'https://txxx.com' },
  { name: 'Upornia', url: 'https://upornia.com' },
  { name: 'xHamster.desi', url: 'https://xhamster.desi' },
  { name: 'XNXX.es', url: 'https://www.xnxx.es' },
  { name: 'Xtube', url: 'https://www.xtube.com' },
  { name: 'XVIDEOS.es', url: 'https://www.xvideos.es' },
  { name: 'XxxBunker', url: 'https://xxxbunker.com' },
  { name: 'YouJizz', url: 'https://www.youjizz.com' },
];

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
  lastCleanup: document.getElementById('last-cleanup'),
  feedback: document.getElementById('feedback'),
  sitesList: document.getElementById('sites-list'),
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

function hostnameMatchesSite(currentHostname, siteUrl) {
  if (!currentHostname) return false;
  try {
    const siteHost = new URL(siteUrl).hostname.toLowerCase();
    const current = currentHostname.toLowerCase();
    if (current === siteHost) return true;
    const suffix = siteHost.includes('.') ? siteHost.slice(siteHost.indexOf('.') + 1) : siteHost;
    return current === suffix || current.endsWith('.' + suffix);
  } catch (_e) {
    return false;
  }
}

function renderSites(currentHostname) {
  if (!els.sitesList) return;
  els.sitesList.innerHTML = '';
  for (const site of SUPPORTED_SITES) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'site-link';
    a.href = site.url;
    a.textContent = site.name;
    if (hostnameMatchesSite(currentHostname, site.url)) {
      a.classList.add('is-current');
    }
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (api?.tabs?.create) {
        api.tabs.create({ url: site.url, active: true });
      } else {
        window.open(site.url, '_blank');
      }
    });
    li.appendChild(a);
    els.sitesList.appendChild(li);
  }
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

    const hostname = tab.url ? new URL(tab.url).hostname : '';
    els.hostname.textContent = hostname || '—';
    renderSites(hostname);

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

  await refreshStatus();
}

init();
