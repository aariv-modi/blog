import type { VercelRequest, VercelResponse } from "@vercel/node";
import { timingSafeEqual } from "node:crypto";

const GITHUB_API = "https://api.github.com";

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = new Uint8Array(Buffer.from(a, "utf-8"));
  const bBuf = new Uint8Array(Buffer.from(b, "utf-8"));
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function isValidSlug(s: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(s);
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

  const { password, slug } = (req.body ?? {}) as {
    password?: string;
    slug?: string;
  };

  if (!password || !constantTimeEquals(password, expectedPassword)) {
    return res.status(401).json({ error: "Invalid password" });
  }

  if (!slug || !isValidSlug(slug)) {
    return res.status(400).json({ error: "Invalid slug" });
  }

  const path = `posts/${slug}.md`;
  const contentsUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;

  const getRes = await fetch(`${contentsUrl}?ref=${encodeURIComponent(branch)}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "blog-delete-post",
    },
  });

  if (getRes.status === 404) {
    return res.status(404).json({ error: `Post "${slug}" not found.` });
  }
  if (!getRes.ok) {
    const text = await getRes.text();
    return res
      .status(502)
      .json({ error: `GitHub API error fetching post: ${getRes.status} ${text.slice(0, 300)}` });
  }

  const current = (await getRes.json()) as { sha?: string };
  if (!current.sha) {
    return res.status(502).json({ error: "GitHub did not return a file sha." });
  }

  const delRes = await fetch(contentsUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "blog-delete-post",
    },
    body: JSON.stringify({
      message: `Delete post: ${slug}`,
      sha: current.sha,
      branch,
    }),
  });

  if (!delRes.ok) {
    const text = await delRes.text();
    return res
      .status(502)
      .json({ error: `GitHub API error deleting post: ${delRes.status} ${text.slice(0, 300)}` });
  }

  const data = (await delRes.json()) as { commit?: { html_url?: string } };
  return res.status(200).json({
    ok: true,
    slug,
    commitUrl: data.commit?.html_url ?? null,
  });
}
