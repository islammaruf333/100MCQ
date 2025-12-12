import { Buffer } from "buffer";

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "answers.json";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!OWNER || !REPO || !TOKEN) {
    return res.status(500).json({ error: "Missing GitHub configuration" });
  }

  const { studentName, timestamp } = req.body || {};
  if (!studentName || !timestamp) {
    return res.status(400).json({ error: "studentName and timestamp required" });
  }

  try {
    const { content, sha } = await fetchFile();
    const list = Array.isArray(content) ? content : [];
    
    // Remove the submission
    const filtered = list.filter(
      item => !(item.studentName === studentName && item.timestamp === timestamp)
    );

    if (filtered.length === list.length) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const updated = JSON.stringify(filtered, null, 2);
    await updateFile(updated, sha);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete answer" });
  }
}

async function fetchFile() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return { content: [], sha: undefined };
    }
    throw new Error(`GitHub fetch failed: ${res.status}`);
  }

  const data = await res.json();
  const decoded = Buffer.from(data.content, "base64").toString("utf8");
  const parsed = JSON.parse(decoded || "[]");
  return { content: parsed, sha: data.sha };
}

async function updateFile(content, sha) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      message: "chore: delete exam submission",
      content: Buffer.from(content).toString("base64"),
      branch: BRANCH,
      sha,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub update failed: ${res.status} ${text}`);
  }
}

