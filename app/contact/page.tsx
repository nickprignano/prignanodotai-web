import type { Metadata } from "next";
import { OWNER } from "prignano-theme";
import { SITE, SOCIALS } from "@/lib/site";
import SiteHeader from "../site-header";
import ContactForm from "./contact-form";

const title = `Contact — ${SITE.name}`;
const description = `Where to find ${SITE.name} online, and a form to send him a message.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: { type: "website", siteName: SITE.name, title, description, url: "/contact", images: SITE.image },
  twitter: { card: "summary_large_image", title, description, images: SITE.image },
};

export default function Contact() {
  return (
    <main className="contact">
      <SiteHeader current="contact" />

      <header className="contact-head">
        <h1>Contact</h1>
        <p>Speaking invitations, questions about a project, or just hello. Send a message below or find me here.</p>
      </header>

      <div className="contact-grid">
        <section aria-labelledby="find-me">
          <h2 id="find-me">Find me</h2>
          <ul className="socials">
            {SOCIALS.map((s) => (
              <li key={s.id}>
                <a href={s.href} rel="me">
                  <span className="social-label">{s.label}</span>
                  <span className="social-handle">{s.handle}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${OWNER.email}`}>
                <span className="social-label">Email</span>
                <span className="social-handle">{OWNER.email}</span>
              </a>
            </li>
          </ul>
        </section>

        <section aria-labelledby="write">
          <h2 id="write">Send a message</h2>
          {SITE.turnstileSiteKey || process.env.NODE_ENV === "development" ? (
            <ContactForm siteKey={SITE.turnstileSiteKey} />
          ) : (
            <p className="notice-inline">
              The form is on its way. Until then, email <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
