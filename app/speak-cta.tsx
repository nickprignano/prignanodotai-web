import { OWNER } from "prignano-theme";

// The "book me to speak" box on the events pages and the resume; the header
// links to it on every page. The email opens with a
// short template so invitations arrive with the details needed to answer.

const subject = "Speaking invitation";
const body = ["Event:", "Date:", "Location (or online):", "Audience and size:", "Topic idea:", "", ""].join("\n");
const href = `mailto:${OWNER.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export default function SpeakCta() {
  return (
    <section className="speak" aria-labelledby="speak">
      <div>
        <h2 id="speak">Book me to speak</h2>
        <p>
          Running a meetup, conference, podcast or team session? I talk about end-user computing, cloud desktops,
          infrastructure as code and building with AI. Send me the details.
        </p>
      </div>
      <a className="speak-button" href={href}>
        Book me to speak <span aria-hidden>→</span>
      </a>
    </section>
  );
}
