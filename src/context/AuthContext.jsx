import { createContext, useContext, useEffect, useState } from "react";
import { supabase, authEnabled, profileFromUser } from "../utils/supabase.js";

const AuthContext = createContext({
  enabled: false,
  loading: false,
  user: null,
  profile: null,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(authEnabled);

  useEffect(() => {
    if (!authEnabled) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function signIn() {
    if (authEnabled)
      supabase.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo: window.location.origin },
      });
  }
  function signOut() {
    if (authEnabled) supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        enabled: authEnabled,
        loading,
        user,
        profile: profileFromUser(user),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
