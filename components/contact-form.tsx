"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SubmissionStatus =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<SubmissionStatus>({ kind: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "sending" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus({
          kind: "error",
          message:
            result.message ??
            "Your message could not be delivered. Please try again.",
        });
        return;
      }

      form.reset();
      setStatus({ kind: "success" });
    } catch {
      setStatus({
        kind: "error",
        message:
          "We could not reach the email service. Your message was not sent.",
      });
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={100}
          required
          className="h-11 bg-surface"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          className="h-11 bg-surface"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-subject" className="text-sm font-medium">
          Subject
        </label>
        <Input
          id="contact-subject"
          name="subject"
          minLength={3}
          maxLength={160}
          required
          className="h-11 bg-surface"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          minLength={10}
          maxLength={5000}
          required
          rows={7}
          className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10000px] h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Button
        type="submit"
        className="h-11 self-start px-6"
        disabled={status.kind === "sending"}
      >
        {status.kind === "sending" ? "Sending…" : "Send message"}
      </Button>

      <p
        role={status.kind === "error" ? "alert" : "status"}
        aria-live="polite"
        className={`min-h-5 text-sm ${
          status.kind === "error" ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {status.kind === "success"
          ? "Your message was sent to our support team."
          : status.kind === "error"
            ? status.message
            : ""}
      </p>
    </form>
  );
}
