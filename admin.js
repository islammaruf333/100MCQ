const RESULTS_URL = "answers.json"; // adjust to GitHub raw URL if needed

const resultsBody = document.getElementById("results-body");
const detailSection = document.getElementById("detail-section");
const detailTitle = document.getElementById("detail-title");
const detailBody = document.getElementById("detail-body");
const loadStatus = document.getElementById("load-status");
const searchInput = document.getElementById("search-input");

document.getElementById("refresh-btn").addEventListener("click", loadResults);
document.getElementById("close-detail").addEventListener("click", () => {
  detailSection.classList.add("hidden");
});
searchInput.addEventListener("input", () => renderTable(latestData));

let latestData = [];

async function loadResults() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin.js:12',message:'loadResults: start',data:{url:RESULTS_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  loadStatus.textContent = "Loading...";
  detailSection.classList.add("hidden");
  try {
    const res = await fetch(RESULTS_URL, { cache: "no-store" });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin.js:17',message:'loadResults: fetch completed',data:{status:res.status,ok:res.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    if (!res.ok) throw new Error("Failed to load answers");
    latestData = await res.json();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin.js:21',message:'loadResults: parsed JSON',data:{count:latestData.length,firstName:latestData[0]?.studentName},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    renderTable(latestData);
    loadStatus.textContent = `Loaded ${latestData.length} submissions`;
  } catch (err) {
    console.error(err);
    loadStatus.textContent = "লোড করতে সমস্যা হয়েছে";
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin.js:27',message:'loadResults: error',data:{errorMessage:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
  }
}

function renderTable(data) {
  const term = searchInput.value.toLowerCase();
  const filtered = data.filter(
    (item) =>
      item.studentName?.toLowerCase().includes(term) ||
      item.studentId?.toLowerCase().includes(term)
  );

  resultsBody.innerHTML = filtered
    .map((item, idx) => {
      const status = item.pass ? "পাস" : "ফেল";
      const time = item.timestamp
        ? new Date(item.timestamp).toLocaleString()
        : "-";
      return `
        <tr>
          <td>${item.studentName || item.studentId || "Unknown"}</td>
          <td>${Number(item.score || 0).toFixed(2)}</td>
          <td>${status}</td>
          <td>${time}</td>
          <td><button data-index="${idx}" class="link-btn">View</button></td>
        </tr>
      `;
    })
    .join("");

  resultsBody.querySelectorAll("button[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => showDetail(filtered[btn.dataset.index]));
  });
}

function showDetail(item) {
  if (!item) return;
  detailTitle.textContent = `${item.studentName || "Student"} - স্কোর ${Number(
    item.score || 0
  ).toFixed(2)}`;

  const entries = Object.entries(item.answers || {});
  detailBody.innerHTML = entries
    .map(
      ([qid, ans]) => `
      <tr>
        <td>${qid}</td>
        <td>${ans}</td>
      </tr>
    `
    )
    .join("");

  detailSection.classList.remove("hidden");
}

// initial load
loadResults();

