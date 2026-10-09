import { createContext, useContext, useEffect, useState } from "react";
import { api, loginUrl } from "../utils/api.js";
import { captureTokenFromUrl, getToken, clearToken } from "../utils/auth.js";

const AuthContext = createContext({
  ready: false,
  enabled: false,
  user: null,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    captureTokenFromUrl();
    let active = true;

    // Does this deployment have Discord login switched on?
    api
      .health()
      .then((h) => active && setEnabled(Boolean(h.auth)))
      .catch(() => {});

    if (!getToken()) {
      setReady(true);
      return () => { active = false; };
    }
    api
      .me()
      .then((r) => active && setUser(r.user))
      .catch(() => clearToken())
      .finally(() => active && setReady(true));

    return () => { active = false; };
  }, []);

  const signIn = () => { window.location.href = loginUrl(); };
  const signOut = () => { clearToken(); setUser(null); };

  return (
    <AuthContext.Provider value={{ ready, enabled, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
