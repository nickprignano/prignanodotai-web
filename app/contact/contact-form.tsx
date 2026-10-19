"use client";

import { useEffect, useRef, useState } from "react";
import { LIMITS, TOPICS } from "@/lib/contact";

// Cloudflare's always-pass test key, so the form works in `next dev` before
// the real site key is set in lib/site.ts.
const TEST_SITE_KEY = "1x00000000000000000000AA";

type Turnstile = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id?: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
    onContactTurnstileLoad?: () => void;
  }
}

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export default function ContactForm({ siteKey }: { siteKey: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [topic, setTopic] = useState<string>(TOPICS[0].id);
  const loadedAt = useRef(Date.now());
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  // /contact?topic=speaking opens with that topic picked. Read here rather
  // than on the server so the page stays static.
  useEffect(() => {
    const wanted = new URLSearchParams(location.search).get("topic");
    if (TOPICS.some((t) => t.id === wanted)) setTopic(wanted!);
  }, []);

  // Loads Turnstile once and renders the widget into the form.
  useEffect(() => {
    const render = () => {
      if (!window.turnstile || !widget.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(widget.current, {
        sitekey: siteKey || TEST_SITE_KEY,
        action: "contact",
        appearance: "interaction-only",
        theme: "auto",
      });
    };
    if (window.turnstile) return render();
    window.onContactTurnstileLoad = render;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onContactTurnstileLoad";
    script.async = true;
    document.head.appendChild(script);
  }, [siteKey]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("elapsed", String(Date.now() - loadedAt.current));
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", { method: "POST", body: data });
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; redirect?: string };
      // The route only sends this for submissions a bot would make.
      if (res.ok && out.ok && out.redirect?.startsWith("https://www.youtube.com/")) {
        window.location.assign(out.redirect);
        return;
      }
      if (res.ok && out.ok) {
        form.reset();
        setState({ kind: "sent" });
      } else {
        setState({ kind: "error", message: out.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setState({ kind: "error", message: "Couldn't reach the server. Please check your connection and try again." });
    }
    // Each Turnstile token works once.
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }

  if (state.kind === "sent") {
    return (
      <div className="contact-sent" role="status">
        <p className="contact-sent-title">Thanks, your message is on its way.</p>
        <p>I&apos;ll get back to you at the address you gave.</p>
        <button type="button" className="contact-again" onClick={() => setState({ kind: "idle" })}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <label>
        <span>Name</span>
        <input name="name" autoComplete="name" required maxLength={LIMITS.name} />
      </label>
      <label>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required maxLength={LIMITS.email} />
      </label>
      <label>
        <span>What&apos;s it about?</span>
        <select name="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Message</span>
        <textarea
          name="message"
          rows={7}
          required
          minLength={LIMITS.minMessage}
          maxLength={LIMITS.message}
          placeholder={
            topic === "speaking" ? "Event, date, location (or online), audience and a topic idea." : undefined
          }
        />
      </label>
      {/* Hidden from people and screen readers; bots fill it in. */}
      <div className="contact-trap" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div ref={widget} className="contact-turnstile" />
      <div className="contact-actions">
        <button type="submit" className="contact-submit" disabled={state.kind === "sending"}>
          {state.kind === "sending" ? "Sending…" : "Send message"}
        </button>
        <p className="contact-fine">
          Messages are screened for spam by Cloudflare.
        </p>
      </div>
      {state.kind === "error" && (
        <p className="contact-error" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
