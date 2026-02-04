"use client";

import clsx from "clsx";
import { useActionState } from "react";
import { type ContactState, submitContact } from "@/lib/actions/contact";
import { SubmitButton } from "./SubmitButton";

const initialState: ContactState = {};

const inputBase =
  "mt-1 block w-full rounded-lg border border-gray-200/60 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

export function ContactForm() {
  const [state, formAction] = useActionState(submitContact, initialState);

  if (state.success) {
    return (
      <output className="block rounded-md bg-green-50 p-4 text-green-800">
        {state.message}
      </output>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
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
          className="block text-sm font-medium text-gray-700"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className={clsx(inputBase, state.errors?.name && "border-red-500")}
        />
        {state.errors?.name?.[0] && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className={clsx(inputBase, state.errors?.email && "border-red-500")}
        />
        {state.errors?.email?.[0] && (
          <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={clsx(inputBase, state.errors?.message && "border-red-500")}
        />
        {state.errors?.message?.[0] && (
          <p className="mt-1 text-sm text-red-600">{state.errors.message[0]}</p>
        )}
      </div>

      {/* General error */}
      {state.message && !state.success && (
        <p className="text-sm text-red-600" aria-live="polite">
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
