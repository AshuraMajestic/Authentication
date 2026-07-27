import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { completeOAuthLogin, fetchCurrentUser } from "../api";
import { useAuth } from "../hooks/useAuth";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const ran = useRef(false);
  const { setUserFromOAuth } = useAuth(); 

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token"); // matches backend's redirectUrl.searchParams key
    const oauthError = params.get("error");

    if (oauthError || !accessToken) {
      navigate("/login", { replace: true, state: { oauthError: oauthError ?? "Missing access token." } });
      return;
    }

    completeOAuthLogin(accessToken);

    (async () => {
      const result = await fetchCurrentUser();
      if (result.ok) {
        setUserFromOAuth(result.data.user);
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true, state: { oauthError: result.error } });
      }
    })();
  }, [navigate, setUserFromOAuth]);

  return (
    <div className="min-h-screen grid place-items-center bg-canvas">
      <p className="text-sm text-ink-soft">Signing you in…</p>
    </div>
  );
}