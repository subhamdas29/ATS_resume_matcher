import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const placeholderAuth = {
  async getSession() {
    return { data: { session: null } };
  },
  onAuthStateChange() {
    return {
      data: {
        subscription: {
          unsubscribe() {}
        }
      }
    };
  },
  async signInWithPassword() {
    return { error: new Error("backend") };
  },
  async signUp() {
    return { error: new Error("backend") };
  },
  async signOut() {
    return { error: null };
  }
};

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : { auth: placeholderAuth };
