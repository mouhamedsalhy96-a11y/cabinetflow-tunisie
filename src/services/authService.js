import { supabase } from "../supabase/client";

function localizeAuthError(message) {
  const text = (message || "").toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }

  if (text.includes("user already registered")) {
    return "Cet email est déjà enregistré.";
  }

  if (text.includes("email not confirmed")) {
    return "L’adresse email n’a pas encore été confirmée.";
  }

  if (text.includes("password should be at least")) {
    return "Le mot de passe est trop court.";
  }

  if (text.includes("too many requests")) {
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  }

  if (text.includes("network")) {
    return "Problème réseau. Vérifie la connexion puis réessaie.";
  }

  return message || "Erreur d’authentification.";
}

function parseAuthArgs(firstArg, secondArg, thirdArg) {
  if (typeof firstArg === "object" && firstArg !== null) {
    return {
      email: firstArg.email || "",
      password: firstArg.password || "",
      metadata: firstArg.metadata || firstArg.data || {},
    };
  }

  return {
    email: firstArg || "",
    password: secondArg || "",
    metadata: thirdArg || {},
  };
}

export async function signIn(firstArg, secondArg) {
  const { email, password } = parseAuthArgs(firstArg, secondArg);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(localizeAuthError(error.message));
  }

  return data;
}

export async function signInUser(firstArg, secondArg) {
  return signIn(firstArg, secondArg);
}

export async function signUp(firstArg, secondArg, thirdArg) {
  const { email, password, metadata } = parseAuthArgs(firstArg, secondArg, thirdArg);

  const payload = {
    email,
    password,
  };

  if (metadata && Object.keys(metadata).length > 0) {
    payload.options = { data: metadata };
  }

  const { data, error } = await supabase.auth.signUp(payload);

  if (error) {
    throw new Error(localizeAuthError(error.message));
  }

  return data;
}

export async function signUpUser(firstArg, secondArg, thirdArg) {
  return signUp(firstArg, secondArg, thirdArg);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signOutUser() {
  return signOut();
}