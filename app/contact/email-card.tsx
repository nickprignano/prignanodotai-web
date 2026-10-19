"use client";

import { useState } from "react";
import SocialIcon from "./social-icon";

// The email card on /contact. The address isn't in the page's HTML: it's put
// together only when someone clicks "Show address", so scrapers that harvest
// mailto links find nothing. The form stays the main way in.
const USER = "nick";
const DOMAIN = "prignano.ai";

export default function EmailCard() {
  const [address, setAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; the address is on screen to select.
    }
  }

  if (!address) {
    return (
      <li className="social">
        <button type="button" className="social-link social-reveal" onClick={() => setAddress(`${USER}@${DOMAIN}`)}>
          <SocialIcon id="email" />
          <span className="social-text">
            <span className="social-label">Email</span>
            <span className="social-handle">Show address</span>
          </span>
        </button>
      </li>
    );
  }

  return (
    <li className="social">
      <a className="social-link" href={`mailto:${address}`}>
        <SocialIcon id="email" />
        <span className="social-text">
          <span className="social-label">Email</span>
          <span className="social-handle">{address}</span>
        </span>
      </a>
      <button type="button" className="social-copy" onClick={copy} aria-label={`Copy ${address}`}>
        {copied ? "Copied" : "Copy"}
      </button>
    </li>
  );
}
