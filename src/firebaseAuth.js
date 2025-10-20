// src/firebaseAuth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Sign up with email & password and send email verification.
 */
export async function signupWithEmail(email, password, displayName = "") {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(userCred.user, { displayName });
  }
  // Send email verification (optional but recommended)
  await sendEmailVerification(userCred.user);
  return userCred.user;
}

/**
 * Sign in with email & password.
 */
export async function loginWithEmail(email, password) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return userCred.user;
}

/**
 * Sign out
 */
export async function logout() {
  await signOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChanged(callback) {
  return onAuthStateChanged(auth, callback);
}
