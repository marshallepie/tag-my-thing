// src/hooks/useProfile.ts
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient"; // <-- adjust path
// If you don't use TS, remove the types below.
type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
  // add any other columns you need from user_profiles
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const log = (...args: any[]) =>
      console.log("%cuseProfile", "color:#7c3aed", ...args);

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      // 1) Grab current session/user
      const sessionStart = performance.now();
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      const sessionDur = (performance.now() - sessionStart).toFixed(1);

      if (sessionErr) {
        log("Auth getSession error:", sessionErr);
        setError(`Auth session error: ${sessionErr.message}`);
        setLoading(false);
        return;
      }

      const user = sessionData.session?.user ?? null;
      if (!user) {
        log("No user in session (SIGNED_OUT).");
        setProfile(null);
        setLoading(false);
        return;
      }

      if (lastUserId.current !== user.id) {
        log("Auth state → SIGNED_IN user:", user.id);
        lastUserId.current = user.id;
      }

      // 2) Fetch profile with detailed timing & error logging
      const qStart = performance.now();
      log("Fetching profile for", user.id);

      const { data, error: qError, status, statusText } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, role, created_at")
        .eq("id", user.id)
        .maybeSingle();

      const qDur = (performance.now() - qStart).toFixed(1);

      if (qError) {
        // RLS & permission issues often show as 401/403
        log(
          "Profile query failed:",
          { status, statusText },
          qError,
          `duration=${qDur}ms`
        );
        setError(
          `Profile query error [${status ?? "?"}]: ${qError.message} (${qError.code ?? "no-code"})`
        );
        setLoading(false);
        return;
      }

      if (!data) {
        log(
          "No profile row found for user. This is NOT a query error.",
          `queryDuration=${qDur}ms`
        );

        // ---- OPTIONAL: auto-create a minimal profile to unblock UI ----
        // Comment this out if you prefer to keep it read-only for now.
        try {
          const upsertStart = performance.now();
          const { data: created, error: upsertErr } = await supabase
            .from("user_profiles")
            .upsert(
              {
                id: user.id,
                email: user.email ?? null,
                full_name: null,
                role: "user", // or whatever your default is
              },
              { onConflict: "id" }
            )
            .select()
            .single();

          const upsertDur = (performance.now() - upsertStart).toFixed(1);

          if (upsertErr) {
            log(
              "Auto-create profile failed:",
              upsertErr,
              `duration=${upsertDur}ms`
            );
            setError(
              `Auto-create profile failed: ${upsertErr.message} (${upsertErr.code ?? "no-code"})`
            );
            setLoading(false);
            return;
          }

          log("Auto-created profile:", created, `duration=${upsertDur}ms`);
          setProfile(created as Profile);
          setLoading(false);
          return;
        } catch (e: any) {
          log("Auto-create profile threw:", e);
          setError(`Auto-create profile threw: ${e?.message ?? String(e)}`);
          setLoading(false);
          return;
        }
        // ---------------------------------------------------------------
      }

      log(
        "Profile fetched successfully:",
        data,
        `authGetSession=${sessionDur}ms profileQuery=${qDur}ms`
      );
      setProfile(data as Profile);
      setLoading(false);
    };

    fetchProfile();

    // (optional) Also listen for token refreshes and re-fetch
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        fetchProfile();
      }
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      sub.subscription?.unsubscribe();
    };
  }, []);

  return { profile, loading, error };
}
