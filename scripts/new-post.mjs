#!/usr/bin/env node
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const title = process.argv.slice(2).join(" ").trim();
if (!title) {
  console.error('Usage: npm run new -- "Post title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-");

if (!slug) {
  console.error("Title produced an empty slug. Use letters or numbers.");
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const __dirname = dirname(fileURLToPath(import.meta.url));
const postsDir = join(__dirname, "..", "posts");
const filePath = join(postsDir, `${slug}.md`);

if (!existsSync(postsDir)) mkdirSync(postsDir, { recursive: true });

if (existsSync(filePath)) {
  console.error(`Post already exists: ${filePath}`);
  process.exit(1);
}

const template = `---
title: ${title}
date: ${date}
excerpt:
---

Write your post here.
`;

writeFileSync(filePath, template);
console.log(`Created ${filePath}`);
