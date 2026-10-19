import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  AI_MODEL,
  AI_SCHEMA,
  MIN_FILL_MS,
  aiPrompt,
  buildEmail,
  checkRules,
  decide,
  parseAiVerdict,
  parseSubmission,
  type AiVerdict,
  type ContactMessage,
} from "@/lib/contact";

// Receives the contact form (app/contact/contact-form.tsx). A message reaches
// Nick only after Turnstile, the rate limits, the junk rules and the Workers
// AI check (lib/contact.ts). Junk gets the same "sent" answer as a real
// message, so bots learn nothing, and is written to the Worker's logs instead.

export const dynamic = "force-dynamic";

// The bindings and secrets this route uses, set up in wrangler.jsonc and the
// Cloudflare dashboard (see README "Contact form").
type ContactEnv = {
  SEND_EMAIL?: { send(message: object): Promise<unknown> };
  AI?: { run(model: string, input: object): Promise<unknown> };
  CONTACT_RATE_LIMIT?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  TURNSTILE_SECRET_KEY?: string;
  CONTACT_TO?: string;
};

const FROM = { name: "prignano.ai contact form", email: "contact-form@prignano.ai" };

const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const sent = () => json({ ok: true });
const fail = (error: string, status = 400) => json({ ok: false, error }, status);

async function verifyTurnstile(secret: string, token: string, ip: string | null, host: string) {
  if (!token) return false;
  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const out = (await res.json()) as { success?: boolean; hostname?: string; action?: string };
    // The test keys report "example.com"; real keys report the page's host.
    const hostOk = !out.hostname || out.hostname === host.split(":")[0] || out.hostname === "example.com";
    return out.success === true && hostOk && (!out.action || out.action === "contact");
  } catch {
    return false;
  }
}

async function askAi(ai: ContactEnv["AI"], m: ContactMessage): Promise<AiVerdict | null> {
  if (!ai) return null;
  try {
    const out = await ai.run(AI_MODEL, {
      messages: aiPrompt(m),
      response_format: { type: "json_schema", json_schema: AI_SCHEMA },
      max_tokens: 120,
      temperature: 0,
    });
    return parseAiVerdict(out);
  } catch (e) {
    console.warn("contact: AI check failed", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function POST(request: Request) {
  const env = getCloudflareContext().env as unknown as ContactEnv;
  // The Host header, not request.url: the Next server can see a rewritten URL.
  const host = request.headers.get("Host") ?? new URL(request.url).host;

  // Only this site's own pages may post here.
  const origin = request.headers.get("Origin");
  if (origin && URL.parse(origin)?.host !== host) return fail("Forbidden.", 403);

  if (!env.SEND_EMAIL || !env.TURNSTILE_SECRET_KEY || !env.CONTACT_TO) {
    return fail("The contact form isn't switched on here yet. Please email me instead.", 503);
  }

  const ip = request.headers.get("CF-Connecting-IP");
  if (env.CONTACT_RATE_LIMIT && ip) {
    const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: `ip:${ip}` });
    if (!success) return fail("That's a lot of messages at once. Please wait a minute and try again.", 429);
  }

  let form: Record<string, unknown>;
  try {
    form = Object.fromEntries(await request.formData());
  } catch {
    return fail("Something went wrong reading the form. Please try again.");
  }

  const parsed = parseSubmission(form);
  if (!parsed.ok) return fail(parsed.error);
  const m = parsed.value;

  // Bots that fill every field, or submit faster than anyone can type.
  if (parsed.honeypot || parsed.elapsedMs < MIN_FILL_MS) {
    console.log(JSON.stringify({ contact: "dropped", reasons: [parsed.honeypot ? "honeypot" : "too-fast"], from: m.email }));
    return sent();
  }

  if (!(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, parsed.turnstileToken, ip, host))) {
    return fail("The spam check didn't go through. Please try again.");
  }

  // A second limit per sender address, for the same message sent from many IPs.
  if (env.CONTACT_RATE_LIMIT) {
    const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: `email:${m.email}` });
    if (!success) return fail("That's a lot of messages at once. Please wait a minute and try again.", 429);
  }

  const rules = checkRules(m);
  // Hard rules already decide it, so the AI isn't asked.
  const ai = rules.hard.length > 0 ? null : await askAi(env.AI, m);
  const decision = decide(rules, ai);

  if (!decision.deliver) {
    console.log(
      JSON.stringify({ contact: "dropped", reasons: decision.reasons, from: m.email, name: m.name, topic: m.topic, preview: m.message.slice(0, 300) }),
    );
    return sent();
  }

  const cf = (request as Request & { cf?: { country?: string } }).cf;
  const { subject, text } = buildEmail(m, decision, { country: cf?.country });
  try {
    await env.SEND_EMAIL.send({ from: FROM, to: env.CONTACT_TO, replyTo: { name: m.name, email: m.email }, subject, text });
  } catch (e) {
    console.error("contact: sending failed", e instanceof Error ? e.message : e);
    return fail("Your message couldn't be sent just now. Please try again later or email me.", 502);
  }
  console.log(JSON.stringify({ contact: "sent", reasons: decision.reasons, topic: m.topic }));
  return sent();
}
