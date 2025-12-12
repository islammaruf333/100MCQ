const DURATION_SECONDS = 60 * 60; // 60 minutes
const NEGATIVE_MARKING = 0.25;
const MARK_PER_QUESTION = 1.25;
const PASS_MARK = 40;
const STORAGE_KEY = "mcq_exam_state";

const startSection = document.getElementById("start-section");
const examSection = document.getElementById("exam-section");
const resultSection = document.getElementById("result-section");
const questionContainer = document.getElementById("question-container");
const progressText = document.getElementById("progress-text");
const timerEl = document.getElementById("timer");
const autosaveIndicator = document.getElementById("autosave-indicator");

const startBtn = document.getElementById("start-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");
const restartBtn = document.getElementById("restart-btn");

const nameInput = document.getElementById("student-name");
const resultSummary = document.getElementById("result-summary");

let questions = [];
let currentIndex = 0;
let answers = {};
let timerInterval = null;
let timeLeft = DURATION_SECONDS;
let studentName = "";

startBtn.addEventListener("click", handleStart);
prevBtn.addEventListener("click", () => changeQuestion(-1));
nextBtn.addEventListener("click", () => changeQuestion(1));
submitBtn.addEventListener("click", handleSubmit);
restartBtn.addEventListener("click", () => window.location.reload());

async function handleStart() {
  const name = nameInput.value.trim();
  if (!name) {
    alert("নাম বা আইডি দিন।");
    return;
  }

  studentName = name;
  const saved = loadSavedState(name);

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:47',message:'handleStart: About to load questions',data:{studentName:name,protocol:window.location.protocol,host:window.location.host,pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    await loadQuestions();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:50',message:'handleStart: Questions loaded successfully',data:{questionsCount:questions.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:53',message:'handleStart: Error loading questions',data:{errorMessage:err.message,errorStack:err.stack,errorName:err.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    // #endregion
    console.error(err);
    if (err.message === "FILE_PROTOCOL_ERROR") {
      alert("এই application একটি HTTP server দিয়ে চালাতে হবে।\n\nLocal server চালানোর জন্য:\n- Python: python -m http.server 8000\n- Node.js: npx serve\n\nতারপর browser এ http://localhost:8000 খুলুন।");
    } else {
      alert("প্রশ্ন লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    }
    return;
  }

  if (saved) {
    answers = saved.answers || {};
    currentIndex = Math.min(saved.currentIndex || 0, questions.length - 1);
    timeLeft = saved.timeLeft ?? DURATION_SECONDS;
  }

  startSection.classList.add("hidden");
  examSection.classList.remove("hidden");

  renderQuestion();
  startTimer();
  saveState();
}

async function loadQuestions() {
  // Check if running from file:// protocol
  if (window.location.protocol === 'file:') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:69',message:'loadQuestions: Detected file:// protocol',data:{protocol:window.location.protocol},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error("FILE_PROTOCOL_ERROR");
  }
  
  // #region agent log
  const fetchUrl = "questions.json";
  fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:75',message:'loadQuestions: Starting fetch',data:{fetchUrl:fetchUrl,fullUrl:window.location.href + fetchUrl,protocol:window.location.protocol},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C'})}).catch(()=>{});
  // #endregion
  let res;
  try {
    res = await fetch("questions.json", { cache: "no-store" });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:81',message:'loadQuestions: Fetch completed',data:{status:res.status,statusText:res.statusText,ok:res.ok,headers:Object.fromEntries(res.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D,E'})}).catch(()=>{});
    // #endregion
  } catch (fetchErr) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:84',message:'loadQuestions: Fetch network error',data:{errorMessage:fetchErr.message,errorName:fetchErr.name,errorStack:fetchErr.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    throw fetchErr;
  }
  if (!res.ok) {
    // #region agent log
    const errorText = await res.text().catch(() => 'Could not read error text');
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:88',message:'loadQuestions: Response not OK',data:{status:res.status,statusText:res.statusText,errorText:errorText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D,E'})}).catch(()=>{});
    // #endregion
    throw new Error("Failed to load questions");
  }
  try {
    const jsonData = await res.json();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:94',message:'loadQuestions: JSON parsed successfully',data:{questionsCount:jsonData.length,firstQuestionId:jsonData[0]?.id,isArray:Array.isArray(jsonData)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    questions = jsonData;
  } catch (parseErr) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:98',message:'loadQuestions: JSON parse error',data:{errorMessage:parseErr.message,errorName:parseErr.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw parseErr;
  }
}

function renderQuestion() {
  if (!questions.length) return;
  const q = questions[currentIndex];

  progressText.textContent = `প্রশ্ন ${currentIndex + 1} / ${questions.length}`;

  const selected = answers[q.id] || "";
  const optionsHtml = Object.entries(q.options)
    .map(
      ([key, text]) => `
        <label class="option">
          <input type="radio" name="option" value="${key}" ${
        selected === key ? "checked" : ""
      }>
          <span>${key}) ${text}</span>
        </label>
      `
    )
    .join("");

  questionContainer.innerHTML = `
    <div class="question-text">${q.question}</div>
    <div class="options">${optionsHtml}</div>
  `;

  const radios = questionContainer.querySelectorAll("input[name='option']");
  radios.forEach((radio) =>
    radio.addEventListener("change", (e) => {
      answers[q.id] = e.target.value;
      saveState();
    })
  );

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === questions.length - 1;
}

function changeQuestion(delta) {
  const nextIndex = currentIndex + delta;
  if (nextIndex < 0 || nextIndex >= questions.length) return;
  currentIndex = nextIndex;
  renderQuestion();
  saveState();
}

function startTimer() {
  updateTimerDisplay(timeLeft);
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timeLeft = 0;
      updateTimerDisplay(timeLeft);
      handleSubmit();
      return;
    }
    updateTimerDisplay(timeLeft);
    saveState(false);
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}

function saveState(showIndicator = true) {
  const payload = {
    studentName,
    currentIndex,
    answers,
    timeLeft,
  };
  localStorage.setItem(STORAGE_KEY + ":" + studentName, JSON.stringify(payload));
  if (showIndicator) {
    autosaveIndicator.textContent = "Progress saved locally";
  }
}

function loadSavedState(name) {
  const raw = localStorage.getItem(STORAGE_KEY + ":" + name);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function calculateScore() {
  let correct = 0;
  let wrong = 0;

  questions.forEach((q) => {
    const ans = answers[q.id];
    if (!ans) return;
    if (ans === q.correctAnswer) correct += 1;
    else wrong += 1;
  });

  const score = correct * MARK_PER_QUESTION - wrong * NEGATIVE_MARKING;
  return {
    score: Math.max(score, 0),
    correct,
    wrong,
    attempted: correct + wrong,
    total: questions.length,
  };
}

async function handleSubmit() {
  if (!questions.length) return;
  clearInterval(timerInterval);

  const { score, correct, wrong, attempted, total } = calculateScore();
  const payload = {
    studentName,
    answers,
    score,
    totalMarks: total * MARK_PER_QUESTION,
    timestamp: new Date().toISOString(),
    attempted,
    correct,
    wrong,
    pass: score >= PASS_MARK,
  };

  resultSummary.innerHTML = `
    <p>নাম: <strong>${studentName}</strong></p>
    <p>স্কোর: <strong>${score.toFixed(2)}</strong> / ${payload.totalMarks}</p>
    <p>সঠিক: ${correct}, ভুল: ${wrong}, চেষ্টা: ${attempted}</p>
    <p>স্ট্যাটাস: <strong>${payload.pass ? "পাস" : "ফেল"}</strong></p>
  `;

  examSection.classList.add("hidden");
  resultSection.classList.remove("hidden");

  try {
    await saveRemote(payload);
    autosaveIndicator.textContent = "Saved to server";
  } catch (err) {
    console.error(err);
    autosaveIndicator.textContent = "Server save failed. Try again later.";
    alert("সার্ভারে সেভ করতে সমস্যা হয়েছে, পরে আবার চেষ্টা করুন।");
  }
}

async function saveRemote(payload) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:277',message:'saveRemote: Starting API call',data:{url:'/api/save-answer',studentName:payload.studentName,hasAnswers:!!payload.answers,score:payload.score},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H,I,J,L'})}).catch(()=>{});
  // #endregion
  let res;
  try {
    res = await fetch("/api/save-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:285',message:'saveRemote: API response received',data:{status:res.status,statusText:res.statusText,ok:res.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H,I,J,L'})}).catch(()=>{});
    // #endregion
  } catch (fetchErr) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:290',message:'saveRemote: Network error',data:{errorMessage:fetchErr.message,errorName:fetchErr.name,errorStack:fetchErr.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    throw fetchErr;
  }
  if (!res.ok) {
    const text = await res.text();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:297',message:'saveRemote: API error response',data:{status:res.status,statusText:res.statusText,errorText:text.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H,I,L'})}).catch(()=>{});
    // #endregion
    throw new Error(text || "Failed to save answer");
  }
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/60d33db9-47b9-4e90-b1f2-f87a5ebdb6bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'exam.js:302',message:'saveRemote: Success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H,I,J,L'})}).catch(()=>{});
  // #endregion
}

