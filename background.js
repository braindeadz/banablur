// Service worker MV3: telechargements only, lecture en IP utilisateur.
const api = typeof chrome !== 'undefined' ? chrome : typeof browser !== 'undefined' ? browser : null;

if (api?.runtime?.onMessage) {
  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action === 'download' && message.url) {
      try {
        api.downloads.download(
          { url: message.url, filename: message.filename || undefined, saveAs: false },
          (downloadId) => sendResponse({ success: typeof downloadId === 'number', downloadId })
        );
        return true;
      } catch (_err) {
        sendResponse({ success: false });
        return false;
      }
    }
    return false;
  });
}
