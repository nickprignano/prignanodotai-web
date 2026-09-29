// Pulls a short plain-text summary and a representative image out of a README.

export type ReadmeSummary = {
  description: string | null;
  image: string | null;
};

const MAX_DESCRIPTION = 420;

// Badge and CI-status images aren't meaningful project screenshots.
const BADGE_PATTERN =
  /shields\.io|badge|badgen\.net|travis-ci|circleci|codecov|coveralls|github\.com\/[^/]+\/[^/]+\/(actions\/)?workflows|img\.shields|forthebadge|vercel\.com\/button|deploy\.workers\.cloudflare\.com\/button|buymeacoffee|ko-fi/i;

export function summarizeReadme(markdown: string, baseUrl: string): ReadmeSummary {
  const text = markdown
    .replace(/\r\n/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^(```|~~~)[\s\S]*?^\1/gm, "");

  return { description: extractDescription(text), image: extractImage(text, baseUrl) };
}

function extractImage(text: string, baseUrl: string): string | null {
  const candidates: string[] = [];
  const pattern = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)|<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi;
  for (const match of text.matchAll(pattern)) candidates.push(match[1] ?? match[2]);

  for (const src of candidates) {
    if (!src || BADGE_PATTERN.test(src)) continue;
    try {
      const url = new URL(src, baseUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") continue;
      // Image links into a repo's blob view need the raw form to render.
      if (url.hostname === "github.com" && url.pathname.includes("/blob/")) {
        url.search = "?raw=true";
      }
      return url.toString();
    } catch {
      // Ignore malformed URLs and keep looking.
    }
  }
  return null;
}

function extractDescription(text: string): string | null {
  const paragraphs: string[] = [];
  let length = 0;

  for (const block of text.split(/\n\s*\n/)) {
    const trimmed = block.trim();
    if (!trimmed || !isProse(trimmed)) continue;

    const plain = toPlainText(trimmed);
    if (plain.length < 25) continue;

    paragraphs.push(plain);
    length += plain.length;
    if (length >= MAX_DESCRIPTION * 0.6) break;
  }

  if (paragraphs.length === 0) return null;
  const joined = paragraphs.join(" ");
  if (joined.length <= MAX_DESCRIPTION) return joined;
  const cut = joined.slice(0, MAX_DESCRIPTION);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "") + "…";
}

function isProse(block: string): boolean {
  const first = block.split("\n")[0].trim();
  if (/^(#{1,6}\s|[-=]{3,}$|\||>|[-*+]\s|\d+\.\s|\[!\[|!\[|<\/?(img|p|div|h\d|picture|a|table|br|hr|details|summary)\b)/i.test(first)) {
    return false;
  }
  // Setext-style headings: a line underlined with === or ---.
  if (/\n[=-]{3,}\s*$/.test(block)) return false;
  return /[a-z]{3,}/i.test(toPlainText(block));
}

function toPlainText(block: string): string {
  return block
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,!?:;]|$)/g, "$1$2")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
