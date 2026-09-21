# Banablur

**v1.10.9** · *Peel the blur.*

Banablur is a browser extension for **Chromium** (Chrome, Edge, Brave) and **Firefox** that removes age-verification overlays, neutralizes CSS and player blur, and unlocks safe-mode / SFW video players where the site allows it.

The name is a playful mix of **banana** and **blur** — fun, but the purpose is clear.

## Télécharger et installer (2 minutes)

**Fichiers officiels :** [Dernière version sur GitHub](https://github.com/braindeadz/banablur/releases/latest) (page *Releases* → section *Assets*).

### Firefox (recommandé)

1. Sur la page des releases, téléchargez le fichier **`Banablur-*-FIREFOX-SIGNE.xpi`** (icône orange / Firefox). **Ne prenez jamais le `.zip`.**
2. Ouvrez **Firefox**.
3. Dans la barre d’adresse, tapez **`about:addons`** puis Entrée.
4. Menu **engrenage** (⚙) → **Install Add-on From File…** / **Installer un module depuis un fichier…**
5. Choisissez le fichier **`.xpi`** que vous venez de télécharger.

> **Important :** ne **double-cliquez pas** le `.xpi`. Firefox peut refuser l’installation ; passez toujours par **about:addons → engrenage → Install Add-on From File**.

### Chrome / Edge / Brave

1. Même page : [releases/latest](https://github.com/braindeadz/banablur/releases/latest).
2. Téléchargez **`Banablur-*-CHROME.zip`** (**pas** le `.xpi`).
3. Clic droit sur le zip → **Extraire tout** / **Extract all**.
4. Ouvrez **`chrome://extensions`** (Edge : **`edge://extensions`**, Brave : **`brave://extensions`**).
5. Activez le **Mode développeur** / **Developer mode**.
6. **Charger l’extension non empaquetée** / **Load unpacked** → sélectionnez le **dossier extrait** (pas le fichier zip).

> **Important :** Chrome n’installe **pas** une extension en double-cliquant sur le `.zip`. Il faut extraire, puis **Load unpacked**.

---

## Install in 2 minutes

**Official files:** [Latest release on GitHub](https://github.com/braindeadz/banablur/releases/latest).

### Firefox (recommended)

Download **`Banablur-*-FIREFOX-SIGNE.xpi`** (not `.zip`) → Firefox → **`about:addons`** → gear → **Install Add-on From File** → pick the `.xpi`. Do **not** double-click the XPI.

### Chrome / Edge / Brave

Download **`Banablur-*-CHROME.zip`** → extract → **`chrome://extensions`** → enable **Developer mode** → **Load unpacked** → select the extracted folder. Do not double-click the zip.

---

## What it is

- A **local-only** content script that detects known adult sites and strips consent gates, blur filters, and safe-for-work player locks.
- A **popup toolbar** to toggle auto-removal and force a cleanup pass.
- An **optional download button** on supported video pages (MP4 via the browser downloads API; HLS as concatenated segments where implemented).
- **Direct connection** — all network requests use your **local IP**; no proxy or traffic rerouting.

## What it is not

- **Not listed** on the Chrome Web Store or the public Mozilla Add-ons (AMO) catalog. Those stores prohibit extensions whose primary purpose is porn enhancement or age-gate circumvention.
- **Not a VPN or anonymity tool.** Traffic stays on your normal connection.
- **Not a guarantee** that every stream or quality tier will unlock — some restrictions are enforced server-side (geo, account tier, DRM).

---

## Features

| Feature | Description |
|---------|-------------|
| Age & consent overlays | Hides AgeGO, cookie walls, age banners, and modal gates |
| AgeVerif.com popups | Blocks AgeVerif.com verification popups on **any** site while the add-on is enabled (including redirect flows) |
| CSS / player blur | Removes `filter: blur`, backdrop blur, SFW overlays, and related classes |
| Safe-mode unlock | Switches SFW streams to full video where possible (e.g. XVIDEOS, LebonPorn / Tukif Shaka safe mode) |
| Auto-detection | Built-in profiles per domain; learns similar domains over time |
| Watchdog | Re-applies fixes when sites mutate the DOM |
| Video download | Optional floating button on XVIDEOS and xHamster (MP4 / HLS) |
| Local IP | All requests go through your browser with your real IP — no proxy |
| Privacy | No telemetry; Firefox 140+ `data_collection_permissions`: **none** |

---

## Supported sites

| Site / domain | Profile | Notes |
|---------------|---------|-------|
| [deviants.com](https://deviants.com) | AgeGO | Overlay + CSS blur |
| [xvideos.com](https://xvideos.com) | XVIDEOS + AgeGO (FR) | Cookies, inline blur, SFW stream swap |
| [xnxx.com](https://xnxx.com) | XVIDEOS + AgeGO (FR) | Same as XVIDEOS: disclaimer, SFW unlock, HLS; URL style `/video-TOKEN` |
| [xhamster.com](https://xhamster.com) | xHamster | SFW overlay, age banner, blur helpers |
| [xhamsterlive.com](https://xhamsterlive.com) | xHamster Live | Non-nude shutter / AVP blur |
| [faphouse.com](https://faphouse.com) | FapHouse | Cookie wall + age modal |
| [chaturbate.com](https://chaturbate.com) | Chaturbate | Age gate + canvas blur (dedicated script) |
| [lebon.porn](https://lebon.porn) / videos.lebon.porn | LebonPorn | AgeVerif popup, mrx blur, Shaka safe mode |
| [tukif.porn](https://tukif.porn) / videos.tukif.porn | Tukif | TKN AgeVerif / disclaimer, CSS deblur, Shaka safe-mode unlock (same stack as LebonPorn) |
| [tnaflix.com](https://www.tnaflix.com), [moviefap.com](https://www.moviefap.com), [pornone.com](https://www.pornone.com), [perfectgirls.xxx](https://www.perfectgirls.xxx) | AgeGO | Overlay + extra player deblur |
| [txxx.com](https://txxx.com) family (HClips, Upornia, HDZog, …) | TXXX | Vue `.modal-age-verification` |
| [teen21.com](https://teen21.com) | TXXX | Same Vue `.modal-age-verification` + AgeVerif |
| [vr-porn.tube](https://vr-porn.tube) | TXXX | AgeVerif modal; player DeoVR (seek HTML5 non prouvable) |
| [porndig.com](https://www.porndig.com), [sxyprn.com](https://sxyprn.com) | TKN | AgeVerif disclaimer without Tukif player inject |
| [jacquieetmicheltv.net](https://www.jacquieetmicheltv.net), [jacquieetmichel.net](https://www.jacquieetmichel.net) | Jacquie | Custom 18+ disclaimer / my18pass blur |
| [redtube.com](https://www.redtube.com) | Aylo | Overlay only |
| [eporner.com](https://www.eporner.com), [sunporno.com](https://www.sunporno.com), [porntube.com](https://www.porntube.com), [porn.com](https://www.porn.com) | Custom | Site-specific age overlays |
| [stripchat.com](https://stripchat.com), [bongacams.com](https://bongacams.com), [livejasmin.com](https://www.livejasmin.com) | Cam gates | 18+ modal / Yoti / consent modal |
| [xtube.com](https://www.xtube.com) | Stripchat-like | Same agreement / cookie gates as Stripchat |
| [cam4.com](https://cam4.com) | CAM4 | Age consent gender disclaimer |
| [xxxbunker.com](https://xxxbunker.com) | XxxBunker | `#overlay` only when `data-ageconfirmed="false"` (avoids LiveJasmin clash) |
| [spankbang.com](https://spankbang.com), [youjizz.com](https://www.youjizz.com), [hqporner.com](https://hqporner.com), [motherless.com](https://www.motherless.com), [beeg.com](https://beeg.com), [thisvid.com](https://thisvid.com), [alohatube.com](https://www.alohatube.com), [hellporno.com](https://www.hellporno.com), [drtuber.com](https://www.drtuber.com), [nuvid.com](https://www.nuvid.com), [analdin.com](https://www.analdin.com), [streamate.com](https://www.streamate.com), [rule34.xxx](https://rule34.xxx), [hdtube.porn](https://www.hdtube.porn) | Gate18 | Generic 18+ / cookie overlays |
| xvideos.es, xnxx.es, xvideos.red, xhamster.desi | Same engines | TLD clones of existing profiles |
| Similar domains | Auto-detected | Remembered after first visit |

---

## Install (details)

See **Télécharger et installer** at the top of this README for step-by-step downloads.

**Maintainers:** the signed Firefox XPI must contain `META-INF/mozilla.rsa`. Temporary **`about:debugging`** → **Load Temporary Add-on** remains for local development only.

**Firefox add-on ID (stable):** `agego-deblur@local.dev` — do not change. **Minimum:** Firefox desktop **140+**, Firefox for Android **142+**.

---

## Usage

Click the Banablur icon in the toolbar. The popup UI labels are in **French**; behavior is the same in all locales.

| Control (UI label) | Function |
|--------------------|----------|
| **Suppression auto** | Toggle automatic overlay/blur removal (default: on) |
| **Forcer detection + nettoyage** | Force profile detection and run cleanup immediately |

**Status indicators** (also French in the UI):

- **Profils** — active site profiles (agego, xvideos, xhamster, …)
- **Watchdog** — whether the DOM watchdog is running
- **Menace** — whether blocking overlays/blur are still detected
- **Video** — player / stream state where applicable

On supported video pages, a **download** button may appear when stream URLs are discoverable. Downloads use the browser's native download manager.

---

## Build from source

**Requirements:** Node.js (for tests), PowerShell (for packaging on Windows).

```powershell
cd banablur
npm install
npm test
powershell -File build.ps1
```

Outputs in the **parent** directory:

| Artifact | Purpose |
|----------|---------|
| `Banablur-1.10.9-CHROME.zip` | **GitHub release name** for Chromium — extract, then **Load unpacked** |
| `Banablur-1.10.9-FIREFOX-SIGNE.xpi` | **GitHub release name** for Firefox Release (Mozilla-signed) |
| `banablur-1.10.9.zip` | Same unsigned pack produced locally by `build.ps1` (Chromium after extract) |
| `banablur-1.10.9.xpi` | Same unsigned bytes from `build.ps1` — **not** for Firefox Release |
| `banablur-1.10.9/` | Folder auto-extracted by `build.ps1` for **Load unpacked** |

The build script reads the version from `manifest.json` and cleans previous build artifacts before generating new ones.

Optional Chaturbate integration test:

```powershell
npm run test:chaturbate
```

Sequential site bench (popup list, Chrome CDP on port 9222). A site is **kept** only if there is no legal/ARCOM wall, no age-only page, no SFW/geo catalogue (`sfw-page` / `sfw_geo_catalog`), no popup, clean thumbs, real playback, seek OK (except live), and still clean after video change:

```powershell
npm run test:sites
# or: node bench-sites.mjs --port=9222
```

---

## Project layout

| File / folder | Role |
|---------------|------|
| `manifest.json` | Manifest V3 (Chromium + Firefox gecko settings) |
| `content.js` | Core profiles, CSS overrides, watchdog, site detection |
| `ageverif-page.js` | Global AgeVerif MAIN-world stub (blocks AgeVerif.com flows) |
| `background.js` | Service worker: downloads API only (local IP) |
| `popup.html` / `popup.js` / `popup.css` | Toolbar popup UI |
| `override.css` | Shared override styles |
| `xvideos-page.js` | XVIDEOS page-world script (player, download) |
| `xhamster-page.js` | xHamster page-world script |
| `lebonporn-page.js` / `lebonporn-inject.js` | LebonPorn + Tukif Shaka / safe-mode hooks |
| `chaturbate.js` / `chaturbate-page.js` / `chaturbate-gate.css` | Chaturbate age gate (isolated from `content.js`) |
| `hls.min.js` | HLS helper for Chaturbate streams |
| `icons/` | Extension icons (16 / 48 / 128) |
| `test-logic.js` | Unit tests (`npm test`) |
| `bench-sites.mjs` | Sequential site bench (`npm run test:sites`) |
| `build.ps1` | Clean, pack zip/xpi, extract unpacked folder |

---

## Privacy

- **No telemetry**, analytics, or remote logging.
- **No account** or sign-in.
- Settings (`autoEnabled`, known sites) are stored locally via `storage`.
- All network traffic uses your **local IP** — no proxy, no third-party proxy list fetch.
- Firefox 140+ manifest declares `data_collection_permissions.required: ["none"]` (Android 142+).

### Permissions

| Permission | Why |
|------------|-----|
| `storage` | Save toggles and learned domains |
| `activeTab` | Popup communicates with the active tab |
| `downloads` | Cross-origin video download via the downloads API |
| `host_permissions`: xvideos/xnxx TLDs | Direct embedframe fetch for stream discovery (local IP) |

Content scripts run on `<all_urls>` with site-specific logic gated by hostname detection.

---

## Disclaimer / legal

**18+ only.** Banablur is intended for adults in jurisdictions where accessing such content is legal.

- Use may **violate the Terms of Service** of third-party websites.
- Circumventing age verification may be **illegal** in your jurisdiction.
- Provided **as-is**, with **no warranty**; authors are not liable for misuse or damages.
- You assume **all risk** — legal, technical, and personal.

---

## License

[MIT License](LICENSE) — Copyright © 2026 Banablur contributors.
