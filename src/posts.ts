import { marked } from "marked";

export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
  html: string;
  readingMinutes: number;
};

const modules = import.meta.glob("../posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  content: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) data[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return { data, content: match[2] };
}

function injectLazyImages(html: string): string {
  return html.replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy"');
}

function demoteHeadings(html: string): string {
  return html.replace(
    /<(\/?)h([1-5])(\b[^>]*)?>/gi,
    (_, slash: string, level: string, attrs = "") => {
      const newLevel = parseInt(level, 10) + 1;
      return `<${slash}h${newLevel}${attrs}>`;
    }
  );
}

function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

marked.setOptions({ gfm: true, breaks: false });

export const posts: Post[] = Object.entries(modules)
  .map(([path, raw]) => {
    const slug = path.replace(/^.*\/(.+)\.md$/, "$1");
    const { data, content } = parseFrontmatter(raw);
    return {
      slug,
      title: data.title || slug,
      date: data.date || "1970-01-01",
      excerpt: data.excerpt || "",
      body: content,
      html: demoteHeadings(injectLazyImages(marked.parse(content) as string)),
      readingMinutes: readingMinutes(content),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAdjacent(slug: string): { older?: Post; newer?: Post } {
  const i = posts.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return {
    newer: i > 0 ? posts[i - 1] : undefined,
    older: i < posts.length - 1 ? posts[i + 1] : undefined,
  };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
