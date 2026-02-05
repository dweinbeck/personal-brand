"use client";

import clsx from "clsx";
import {
  useActionState,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { type ContactState, submitContact } from "@/lib/actions/contact";
import { SubmitButton } from "./SubmitButton";
import { trackEvent } from "@/lib/analytics";

const initialState: ContactState = {};

const inputBase =
  "mt-1 block w-full rounded-lg border border-border px-3 py-2 shadow-sm transition-colors focus:border-gold focus:ring-1 focus:ring-gold min-h-[44px]";

/** Simple client-side validation for immediate feedback */
function validateEmail(value: string): string | null {
  if (!value) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "Please enter a valid email address";
  return null;
}

function validateMessage(value: string): string | null {
  if (!value) return "Message is required";
  if (value.length < 10)
    return `Message must be at least 10 characters (${value.length}/10)`;
  if (value.length > 2000) return "Message is too long (max 2000 characters)";
  return null;
}

function validateName(value: string): string | null {
  if (!value) return "Name is required";
  if (value.length > 100) return "Name is too long";
  return null;
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContact, initialState);

  // Client-side inline validation state
  const [clientErrors, setClientErrors] = useState<
    Record<string, string | null>
  >({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const formStartTracked = useRef(false);
  const lastTrackedError = useRef<string | null>(null);

  const handleFocus = useCallback(() => {
    if (!formStartTracked.current) {
      trackEvent("form_start", { form: "contact" });
      formStartTracked.current = true;
    }
  }, []);

  const handleBlur = useCallback(
    (field: string, value: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      let error: string | null = null;
      if (field === "email") error = validateEmail(value);
      else if (field === "message") error = validateMessage(value);
      else if (field === "name") error = validateName(value);

      setClientErrors((prev) => ({ ...prev, [field]: error }));
    },
    [],
  );

  const handleChange = useCallback(
    (field: string, value: string) => {
      // Only validate on change if field was already touched (blur first)
      if (!touched[field]) return;

      let error: string | null = null;
      if (field === "email") error = validateEmail(value);
      else if (field === "message") error = validateMessage(value);
      else if (field === "name") error = validateName(value);

      setClientErrors((prev) => ({ ...prev, [field]: error }));
    },
    [touched],
  );

  /** Wrap formAction to fire analytics */
  const handleSubmit = useCallback(
    (formData: FormData) => {
      trackEvent("form_submit", { form: "contact" });
      formAction(formData);
    },
    [formAction],
  );

  // Track errors from server state (in effect, not during render)
  useEffect(() => {
    if (
      state.message &&
      !state.success &&
      state.message !== lastTrackedError.current
    ) {
      trackEvent("form_error", { form: "contact", error: state.message });
      lastTrackedError.current = state.message;
    }
  }, [state.message, state.success]);

  if (state.success) {
    return (
      <output
        className="block rounded-lg bg-sage/10 border border-sage/20 p-6 text-sage"
        role="status"
      >
        <div className="flex items-start gap-3">
          {/* Check icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">{state.message}</span>
        </div>
      </output>
    );
  }

  /** Get display error for a field (client-side takes priority, then server) */
  function fieldError(field: "name" | "email" | "message"): string | null {
    if (touched[field] && clientErrors[field]) return clientErrors[field];
    if (state.errors?.[field]?.[0]) return state.errors[field]![0];
    return null;
  }

  return (
    <form action={handleSubmit} className="space-y-6" noValidate>
      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company_website">Company Website</label>
        <input
          type="text"
          id="company_website"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-text-secondary"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          autoComplete="name"
          onFocus={handleFocus}
          onBlur={(e) => handleBlur("name", e.target.value)}
          onChange={(e) => handleChange("name", e.target.value)}
          className={clsx(inputBase, fieldError("name") && "border-red-500")}
          aria-invalid={!!fieldError("name")}
          aria-describedby={fieldError("name") ? "name-error" : undefined}
        />
        {fieldError("name") && (
          <p
            id="name-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldError("name")}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-secondary"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          onFocus={handleFocus}
          onBlur={(e) => handleBlur("email", e.target.value)}
          onChange={(e) => handleChange("email", e.target.value)}
          className={clsx(inputBase, fieldError("email") && "border-red-500")}
          aria-invalid={!!fieldError("email")}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
        />
        {fieldError("email") && (
          <p
            id="email-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldError("email")}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-text-secondary"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          onFocus={handleFocus}
          onBlur={(e) => handleBlur("message", e.target.value)}
          onChange={(e) => handleChange("message", e.target.value)}
          className={clsx(
            inputBase,
            "min-h-[120px]",
            fieldError("message") && "border-red-500",
          )}
          aria-invalid={!!fieldError("message")}
          aria-describedby={
            fieldError("message") ? "message-error" : undefined
          }
        />
        {fieldError("message") && (
          <p
            id="message-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldError("message")}
          </p>
        )}
      </div>

      {/* General error / failure state with email fallback */}
      {state.message && !state.success && (
        <div
          className="rounded-lg bg-amber/10 border border-amber/20 p-4 text-sm text-amber"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {/* Warning icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{state.message}</span>
          </div>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
