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
