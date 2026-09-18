# Banablur

**v1.10.3** · *Peel the blur.*

Banablur is a browser extension for **Chromium** (Chrome, Edge, Brave) and **Firefox** that removes age-verification overlays, neutralizes CSS and player blur, and unlocks safe-mode / SFW video players where the site allows it.

The name is a playful mix of **banana** and **blur** — fun, but the purpose is clear.

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
| [porndig.com](https://www.porndig.com), [sxyprn.com](https://sxyprn.com) | TKN | AgeVerif disclaimer without Tukif player inject |
| [jacquieetmicheltv.net](https://www.jacquieetmicheltv.net), [jacquieetmichel.net](https://www.jacquieetmichel.net) | Jacquie | Custom 18+ disclaimer / my18pass blur |
| [redtube.com](https://www.redtube.com) | Aylo | Overlay only |
| [eporner.com](https://www.eporner.com), [sunporno.com](https://www.sunporno.com), [porntube.com](https://www.porntube.com), [porn.com](https://www.porn.com) | Custom | Site-specific age overlays |
| [stripchat.com](https://stripchat.com), [bongacams.com](https://bongacams.com), [livejasmin.com](https://www.livejasmin.com) | Cam gates | 18+ modal / Yoti / consent modal |
| [xtube.com](https://www.xtube.com) | Stripchat-like | Same agreement / cookie gates as Stripchat |
| [cam4.com](https://cam4.com) | CAM4 | Age consent gender disclaimer |
| [xxxbunker.com](https://xxxbunker.com) | XxxBunker | `#overlay` only when `data-ageconfirmed="false"` (avoids LiveJasmin clash) |
| [spankbang.com](https://spankbang.com), [youjizz.com](https://www.youjizz.com), [hqporner.com](https://hqporner.com), [motherless.com](https://www.motherless.com), [beeg.com](https://beeg.com), [thisvid.com](https://thisvid.com), [alohatube.com](https://www.alohatube.com), [hellporno.com](https://www.hellporno.com), [drtuber.com](https://www.drtuber.com), [nuvid.com](https://www.nuvid.com), [analdin.com](https://www.analdin.com), [streamate.com](https://www.streamate.com), [pornhat.com](https://www.pornhat.com), [rule34.xxx](https://rule34.xxx), [hdtube.porn](https://www.hdtube.porn) | Gate18 | Generic 18+ / cookie overlays |
| xvideos.es, xnxx.es, xvideos.red, xhamster.desi | Same engines | TLD clones of existing profiles |
| Similar domains | Auto-detected | Remembered after first visit |

---

## Install — Chrome / Edge / Brave

Banablur is distributed as an **unpacked extension** (developer mode). There is no Chrome Web Store package.

1. Obtain a build: extract `banablur-1.10.3.zip` from a release, or build from source (see below).
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder (e.g. `banablur-1.10.3/`).
5. Pin the extension from the puzzle icon in the toolbar.

> Chromium does not install a `.zip` directly — use the extracted folder.

---

## Install — Firefox

**Firefox add-on ID (stable):** `agego-deblur@local.dev` — do not change; existing installs rely on it for updates.

**Minimum versions:** Firefox desktop **140+**, Firefox for Android **142+** (`strict_min_version` / `gecko_android` in `manifest.json`).

The AMO / Firefox **XPI** omits `background.service_worker` (Firefox uses `background.scripts` only); the Chromium **zip** keeps both.

### Permanent install (signed XPI — recommended for Firefox Release)

Firefox Release requires a **Mozilla-signed** add-on. Banablur is distributed as an **unlisted** AMO-signed `.xpi` (not in the public AMO catalog).

Use only a file that contains `META-INF/mozilla.rsa` (name ends with `FIREFOX-SIGNE.xpi`, `firefox-signed.xpi`, or comes from an AMO download). The unsigned build zip/xpi from `build.ps1` is **not** for Firefox Release — it will be rejected with “not verified”.

1. Download `Banablur-1.10.3-FIREFOX-SIGNE.xpi` or `banablur-1.10.3-firefox-signed.xpi` (or the latest signed release asset).
2. Open `about:addons`.
3. Click the gear menu → **Install Add-on From File…**
4. Select the **signed** `.xpi`.

Double-clicking an XPI can fail even when the file is signed (Firefox treats `file://` as a web install). Prefer **Install Add-on From File**.

Maintainers sign builds through Mozilla's developer hub; end users only need the signed artifact.

### Temporary install (development)

1. Open `about:debugging`.
2. Click **This Firefox**.
3. **Load Temporary Add-on…** → select `manifest.json` inside the source or extracted folder.

Temporary add-ons are removed when Firefox closes.

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
| `banablur-1.10.3.zip` | Unsigned build zip (Chrome/Edge **Load unpacked** after extract) |
| `banablur-1.10.3.xpi` | Same unsigned bytes — **not** for Firefox Release |
| `Banablur-1.10.3-FIREFOX-SIGNE.xpi` or `banablur-1.10.3-firefox-signed.xpi` | AMO-signed XPI for Firefox Release |
| `banablur-1.10.3/` | Auto-extracted folder for Chromium **Load unpacked** |

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
