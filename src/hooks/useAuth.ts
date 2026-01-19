"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/storage/supabase/client";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const getSupabase = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      return;
    }

    let mounted = true;

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [getSupabase]);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }, [getSupabase]);

  return { user, loading, signOut };
}
