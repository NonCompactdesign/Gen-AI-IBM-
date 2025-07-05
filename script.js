const WORKER_PROXY_URL = "https://restless-firefly-4689.chebolutarun5.workers.dev/"; // Replace with your actual Cloudflare Worker URL

const button = document.getElementById("generateBtn");
const input = document.getElementById("userInput");
const status = document.getElementById("status");
const list = document.getElementById("todoList");

// Save and Load
function saveTasks() {
  const tasks = [];
  document.querySelectorAll(".task-item").forEach(li => {
    const text = li.querySelector(".task-text").textContent;
    const status =
      li.querySelector(".status-box.todo").checked ? "todo" :
      li.querySelector(".status-box.doing").checked ? "doing" :
      li.querySelector(".status-box.done").checked ? "done" : "none";
    tasks.push({ text, status });
  });
  localStorage.setItem("todo_tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const saved = JSON.parse(localStorage.getItem("todo_tasks") || "[]");
  saved.forEach(({ text, status }) => addTask(text, status));
}

// Add Task
function addTask(taskText, statusVal = "none") {
  const li = document.createElement("li");
  li.classList.add("task-item");

  const textSpan = document.createElement("span");
  textSpan.textContent = taskText;
  textSpan.className = "task-text";
  li.appendChild(textSpan);

  ["todo", "doing", "done"].forEach(state => {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = `status-box ${state}`;
    box.checked = (state === statusVal);
    box.onclick = () => {
      li.querySelectorAll(".status-box").forEach(b => {
        if (b !== box) b.checked = false;
      });
      saveTasks();
    };
    li.appendChild(box);
  });

  const del = document.createElement("button");
  del.textContent = "❌";
  del.className = "delete-btn";
  del.onclick = () => {
    li.remove();
    saveTasks();
  };
  li.appendChild(del);

  list.appendChild(li);
  saveTasks();
}

// API Call via Proxy
async function callOpenRouter(payload) {
  const response = await fetch(WORKER_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return response;
}

// Generate To-Do List
button.addEventListener("click", async () => {
  const userText = input.value.trim();
  if (!userText) return;

  status.textContent = "🤖 Generating tasks...";

  try {
    const response = await callOpenRouter({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates a to-do list based on what the user said. Use common sense and infer what the user might want to do. Reply ONLY with short, bullet-pointed to-do items, no explanation or extra text."
        },
        {
          role: "user",
          content: `Convert the following message into clear, actionable to-do list items:\n"${userText}"`
        }
      ]
    });

    if (!response.ok) throw new Error(`API Error ${response.status}: ${response.statusText}`);
    const data = await response.json();
    const reply = data.choices[0].message.content;

    const items = reply.split(/\n|•|–|-/).filter(t => t.trim().length > 2);
    items.forEach(item => {
      const clean = item.replace(/^\d+\.\s*/, "").trim();
      if (clean) addTask(clean);
    });

    status.textContent = "✅ Tasks added!";
  } catch (err) {
    console.error("❌ Error:", err);
    status.textContent = "❌ Error: " + err.message;
  }
});

// Share Link
document.getElementById("shareBtn").addEventListener("click", () => {
  const tasks = [];
  document.querySelectorAll(".task-item").forEach(li => {
    const text = li.querySelector(".task-text").textContent;
    const status =
      li.querySelector(".status-box.todo").checked ? "todo" :
      li.querySelector(".status-box.doing").checked ? "doing" :
      li.querySelector(".status-box.done").checked ? "done" : "none";
    tasks.push({ text, status });
  });

  const encoded = encodeURIComponent(JSON.stringify(tasks));
  const url = `${location.origin}${location.pathname}?share=${encoded}`;

  const output = document.getElementById("shareOutput");
  output.value = url;
  output.select();
  document.execCommand("copy");
  status.textContent = "🔗 Share link copied!";
});

// Dark Mode
const toggle = document.getElementById("darkToggle");
toggle.checked = localStorage.getItem("dark_mode") === "true";
if (toggle.checked) document.body.classList.add("dark");

toggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark_mode", toggle.checked);
});

// Load Tasks from URL or Storage
const params = new URLSearchParams(location.search);
if (params.has("share")) {
  const shared = JSON.parse(decodeURIComponent(params.get("share")));
  localStorage.setItem("todo_tasks", JSON.stringify(shared));
  location.href = location.origin + location.pathname;
}

window.addEventListener("DOMContentLoaded", loadTasks);
