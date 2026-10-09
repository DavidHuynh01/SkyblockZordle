// Discord session handling. The token is minted by our API after the OAuth
// round-trip and arrives back in the URL hash; we stash it and clean the URL.
const TOKEN_KEY = "skyblockzordle-token";

export function captureTokenFromUrl() {
  const hash = window.location.hash || "";
  const m = /[#&]token=([^&]+)/.exec(hash);
  if (m) {
    localStorage.setItem(TOKEN_KEY, decodeURIComponent(m[1]));
    history.replaceState(null, "", window.location.pathname + window.location.search);
    return true;
  }
  if (/[#&]login=failed/.test(hash)) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    return false;
  }
  return null;
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

// An opaque per-browser id so anonymous players can be counted once a day.
// Never used for ranking — only for the "players today" number.
const ANON_KEY = "skyblockzordle-anon";
export function getAnonId() {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = "a" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}
