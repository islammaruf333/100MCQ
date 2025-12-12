import { Buffer } from "buffer";

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "answers.json";

export default async function handler(req, res) {
  // #region agent log
  const logEntry = {location:'api/save-answer.js:9',message:'handler: Request received',data:{method:req.method,hasBody:!!req.body,studentName:req.body?.studentName,hasOwner:!!OWNER,hasRepo:!!REPO,hasToken:!!TOKEN},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H,I,J'};
  console.log('[DEBUG]', JSON.stringify(logEntry));
  // #endregion
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!OWNER || !REPO || !TOKEN) {
    // #region agent log
    const logEntry2 = {location:'api/save-answer.js:21',message:'handler: Missing GitHub config',data:{hasOwner:!!OWNER,hasRepo:!!REPO,hasToken:!!TOKEN,owner:OWNER||'undefined',repo:REPO||'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'};
    console.log('[DEBUG]', JSON.stringify(logEntry2));
    // #endregion
    return res.status(500).json({ error: "Missing GitHub configuration" });
  }

  const body = req.body || {};
  if (!body.studentName) {
    // #region agent log
    const logEntry3 = {location:'api/save-answer.js:30',message:'handler: Missing studentName',data:{bodyKeys:Object.keys(body)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'K'};
    console.log('[DEBUG]', JSON.stringify(logEntry3));
    // #endregion
    return res.status(400).json({ error: "studentName required" });
  }

  try {
    // #region agent log
    const logEntry4 = {location:'api/save-answer.js:28',message:'handler: Starting fetchFile',data:{owner:OWNER,repo:REPO,branch:BRANCH},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'};
    console.log('[DEBUG]', JSON.stringify(logEntry4));
    // #endregion
    const { content, sha } = await fetchFile();
    // #region agent log
    const logEntry5 = {location:'api/save-answer.js:30',message:'handler: fetchFile completed',data:{contentLength:Array.isArray(content)?content.length:'not-array',hasSha:!!sha},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'};
    console.log('[DEBUG]', JSON.stringify(logEntry5));
    // #endregion
    const list = Array.isArray(content) ? content : [];
    list.push(body);

    const updated = JSON.stringify(list, null, 2);
    // #region agent log
    const logEntry6 = {location:'api/save-answer.js:35',message:'handler: Starting updateFile',data:{updatedLength:updated.length,hasSha:!!sha},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'};
    console.log('[DEBUG]', JSON.stringify(logEntry6));
    // #endregion
    await updateFile(updated, sha);
    // #region agent log
    const logEntry7 = {location:'api/save-answer.js:37',message:'handler: updateFile completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'};
    console.log('[DEBUG]', JSON.stringify(logEntry7));
    // #endregion
    return res.status(200).json({ success: true });
  } catch (err) {
    // #region agent log
    const logEntry8 = {location:'api/save-answer.js:40',message:'handler: Error caught',data:{errorMessage:err.message,errorName:err.name,errorStack:err.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H,I,J,K'};
    console.log('[DEBUG]', JSON.stringify(logEntry8));
    // #endregion
    console.error(err);
    return res.status(500).json({ error: "Failed to save answer" });
  }
}

async function fetchFile() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  // #region agent log
  const logEntry1 = {location:'api/save-answer.js:42',message:'fetchFile: Starting GitHub API call',data:{url:url.replace(TOKEN,'[TOKEN]'),owner:OWNER,repo:REPO},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'};
  console.log('[DEBUG]', JSON.stringify(logEntry1));
  // #endregion
  let res;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });
    // #region agent log
    const logEntry2 = {location:'api/save-answer.js:52',message:'fetchFile: GitHub API response received',data:{status:res.status,statusText:res.statusText,ok:res.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'};
    console.log('[DEBUG]', JSON.stringify(logEntry2));
    // #endregion
  } catch (fetchErr) {
    // #region agent log
    const logEntry3 = {location:'api/save-answer.js:55',message:'fetchFile: Network error',data:{errorMessage:fetchErr.message,errorName:fetchErr.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'J'};
    console.log('[DEBUG]', JSON.stringify(logEntry3));
    // #endregion
    throw fetchErr;
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Could not read error');
    // #region agent log
    const logEntry4 = {location:'api/save-answer.js:60',message:'fetchFile: GitHub API error',data:{status:res.status,statusText:res.statusText,errorText:errorText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'};
    console.log('[DEBUG]', JSON.stringify(logEntry4));
    // #endregion
    if (res.status === 404) {
      return { content: [], sha: undefined };
    }
    throw new Error(`GitHub fetch failed: ${res.status}`);
  }

  try {
    const data = await res.json();
    // #region agent log
    const logEntry5 = {location:'api/save-answer.js:70',message:'fetchFile: JSON parsed',data:{hasContent:!!data.content,hasSha:!!data.sha},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'K'};
    console.log('[DEBUG]', JSON.stringify(logEntry5));
    // #endregion
    const decoded = Buffer.from(data.content, "base64").toString("utf8");
    const parsed = JSON.parse(decoded || "[]");
    return { content: parsed, sha: data.sha };
  } catch (parseErr) {
    // #region agent log
    const logEntry6 = {location:'api/save-answer.js:75',message:'fetchFile: Parse error',data:{errorMessage:parseErr.message,errorName:parseErr.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'K'};
    console.log('[DEBUG]', JSON.stringify(logEntry6));
    // #endregion
    throw parseErr;
  }
}

async function updateFile(content, sha) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  // #region agent log
  const logEntry1 = {location:'api/save-answer.js:85',message:'updateFile: Starting GitHub API PUT',data:{url:url.replace(TOKEN,'[TOKEN]'),hasSha:!!sha,contentLength:content.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'};
  console.log('[DEBUG]', JSON.stringify(logEntry1));
  // #endregion
  let res;
  try {
    res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: "chore: append exam submission",
        content: Buffer.from(content).toString("base64"),
        branch: BRANCH,
        sha,
      }),
    });
    // #region agent log
    const logEntry2 = {location:'api/save-answer.js:100',message:'updateFile: GitHub API response received',data:{status:res.status,statusText:res.statusText,ok:res.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'};
    console.log('[DEBUG]', JSON.stringify(logEntry2));
    // #endregion
  } catch (fetchErr) {
    // #region agent log
    const logEntry3 = {location:'api/save-answer.js:103',message:'updateFile: Network error',data:{errorMessage:fetchErr.message,errorName:fetchErr.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'J'};
    console.log('[DEBUG]', JSON.stringify(logEntry3));
    // #endregion
    throw fetchErr;
  }

  if (!res.ok) {
    const text = await res.text();
    // #region agent log
    const logEntry4 = {location:'api/save-answer.js:108',message:'updateFile: GitHub API error',data:{status:res.status,statusText:res.statusText,errorText:text.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'};
    console.log('[DEBUG]', JSON.stringify(logEntry4));
    // #endregion
    throw new Error(`GitHub update failed: ${res.status} ${text}`);
  }
}

