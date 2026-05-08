import { marked } from "marked";

export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
  html: string;
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
      html: marked.parse(content) as string,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
