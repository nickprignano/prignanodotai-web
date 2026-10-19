// The "book me to speak" box on the events pages and the resume. It opens the
// contact form on the speaking topic, which prompts for the event details.
const href = "/contact?topic=speaking";

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
