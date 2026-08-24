"use client";

import { useActionState } from "react";
import { LockKeyhole } from "@/components/icons";
import { loginWithInvite, type LoginState } from "./login-actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginWithInvite, initialState);
  return (
    <form action={action} className="login-form">
      <label htmlFor="login">Invite login</label>
      <input id="login" name="login" autoComplete="username" required maxLength={80} />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required minLength={16} maxLength={256} />
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button type="submit" className="button button--primary" disabled={pending}>
        <LockKeyhole size={18} /> {pending ? "Signing in..." : "Enter Grindstone"}
      </button>
    </form>
  );
}

