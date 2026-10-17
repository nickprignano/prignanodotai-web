import type { Metadata } from "next";
import { resume } from "@/lib/resume";
import PrintButton from "./print-button";

export const metadata: Metadata = {
  title: `Resume — ${resume.name}`,
  description: resume.summary,
};

export default function Resume() {
  return (
    <main className="resume">
      <nav className="resume-nav">
        <a href="/">← Projects</a>
        <span className="resume-nav-links">
          <a href="https://blog.prignano.ai">Blog</a>
          <PrintButton />
        </span>
      </nav>

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
        </p>
      </header>

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
