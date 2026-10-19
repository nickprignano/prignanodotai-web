import type { Metadata } from "next";
import { resume } from "@/lib/resume";
import { SITE } from "@/lib/site";
import SiteHeader from "../site-header";
import SpeakCta from "../speak-cta";
import PrintButton from "./print-button";

const title = `Resume — ${resume.name}`;

export const metadata: Metadata = {
  title,
  description: resume.summary,
  alternates: { canonical: "/resume" },
  openGraph: { type: "profile", siteName: resume.name, title, description: resume.summary, url: "/resume", images: SITE.image },
  twitter: { card: "summary_large_image", title, description: resume.summary, images: SITE.image },
};

export default function Resume() {
  return (
    <main className="resume">
      <SiteHeader current="resume" />

      <header className="resume-head">
        <h1>{resume.name}</h1>
        <p className="resume-title">
          {resume.headline} · {resume.location}
        </p>
        <p>{resume.summary}</p>
        <p className="resume-links">
          {resume.links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a href="https://prignano.ai">prignano.ai</a>
          <PrintButton />
        </p>
      </header>

      <SpeakCta />

      <section>
        <h2>Experience</h2>
        {resume.experience.map((position) => (
          <article key={position.org} className="position">
            <h3>
              {position.org} <span className="where">· {position.location}</span>
            </h3>
            {position.roles.map((role) => (
              <div key={role.title} className="role">
                <p className="role-head">
                  <strong>{role.title}</strong>
                  <span className="when">
                    {role.start} – {role.end ?? "Present"}
                  </span>
                </p>
                {role.summary && <p className="role-summary">{role.summary}</p>}
              </div>
            ))}
          </article>
        ))}
      </section>

      <div className="resume-grid">
        <section>
          <h2>Skills</h2>
          <ul className="topics">
            {resume.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Certifications</h2>
          <ul className="plain">
            {resume.certifications.map((cert) => (
              <li key={cert}>{cert}</li>
            ))}
          </ul>
          <h2>Education</h2>
          <ul className="plain">
            {resume.education.map((ed) => (
              <li key={ed.school}>
                <strong>{ed.school}</strong>, {ed.degree} <span className="when">{ed.years}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
