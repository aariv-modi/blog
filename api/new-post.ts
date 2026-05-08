import type { VercelRequest, VercelResponse } from "@vercel/node";
import { timingSafeEqual } from "node:crypto";

const GITHUB_API = "https://api.github.com";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = new Uint8Array(Buffer.from(a, "utf-8"));
  const bBuf = new Uint8Array(Buffer.from(b, "utf-8"));
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function buildMarkdown(title: string, date: string, excerpt: string, body: string): string {
  return `---\ntitle: ${title}\ndate: ${date}\nexcerpt: ${excerpt}\n---\n\n${body.trim()}\n`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expectedPassword = process.env.BLOG_ADMIN_PASSWORD;
  const githubToken = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!expectedPassword || !githubToken || !owner || !repo) {
    return res.status(500).json({
      error:
        "Missing env vars on the server. Required: BLOG_ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO. Optional: GITHUB_BRANCH (defaults to 'main').",
    });
  }

  const {
    password,
    title,
    date,
    excerpt = "",
    body,
  } = (req.body ?? {}) as {
    password?: string;
    title?: string;
    date?: string;
    excerpt?: string;
    body?: string;
  };

  if (!password || !constantTimeEquals(password, expectedPassword)) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const trimmedTitle = (title ?? "").trim();
  if (!trimmedTitle) return res.status(400).json({ error: "Title is required" });
  if (!body || !body.trim()) return res.status(400).json({ error: "Body is required" });
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Date must be YYYY-MM-DD" });
  }

  const slug = slugify(trimmedTitle);
  if (!slug) {
    return res.status(400).json({ error: "Title produced an empty slug — use letters or numbers" });
  }

  const path = `posts/${slug}.md`;
  const markdown = buildMarkdown(trimmedTitle, date, excerpt.trim(), body);
  const contentBase64 = Buffer.from(markdown, "utf-8").toString("base64");

  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const ghResponse = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "blog-new-post",
    },
    body: JSON.stringify({
      message: `Add post: ${trimmedTitle}`,
      content: contentBase64,
      branch,
    }),
  });

  if (ghResponse.status === 422) {
    return res.status(409).json({ error: `A post with slug "${slug}" already exists.` });
  }
  if (!ghResponse.ok) {
    const text = await ghResponse.text();
    return res
      .status(502)
      .json({ error: `GitHub API error: ${ghResponse.status} ${text.slice(0, 300)}` });
  }

  const data = (await ghResponse.json()) as { commit?: { html_url?: string } };
  return res.status(200).json({
    ok: true,
    slug,
    commitUrl: data.commit?.html_url ?? null,
  });
}
