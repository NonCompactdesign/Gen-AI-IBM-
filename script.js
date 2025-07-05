// 🔐 Prompt user for OpenRouter API key
let API_KEY = localStorage.getItem("openrouter_key");
if (!API_KEY) {
  API_KEY = prompt("Enter your OpenRouter API key (starts with sk-):");
  localStorage.setItem("openrouter_key", API_KEY);
}

const button = document.getElementById("generateBtn");
const input = document.getElementById("userInput");
const status = document.getElementById("status");
const list = document.getElementById("todoList");

// 🔄 Save all tasks to localStorage
function saveTasks() {
  const tasks = [];
  document.querySelectorAll(".task-item").forEach(li => {
    const text = li.querySelector(".task-text").textContent;
    const status = li.querySelector(".status-box.todo").checked
      ? "todo"
      : li.querySelector(".status-box.doing").checked
      ? "doing"
      : li.querySelector(".status-box.done").checked
      ? "done"
      : "none";
    tasks.push({ text, status });
  });
  localStorage.setItem("todo_tasks", JSON.stringify(tasks));
}

// 🔁 Load tasks from localStorage
function loadTasks() {
  const saved = JSON.parse(localStorage.getItem("todo_tasks") || "[]");
  saved.forEach(({ text, status }) => addTask(text, status));
}

// ➕ Add a new task to the list
function addTask(taskText, statusVal = "none") {
  const li = document.createElement("li");
  li.classList.add("task-item");

  const textSpan = document.createElement("span");
  textSpan.textContent = taskText;
  textSpan.className = "task-text";
  li.appendChild(textSpan);

  const statuses = ["todo", "doing", "done"];
  statuses.forEach(s => {
    const btn = document.createElement("input");
    btn.type = "checkbox";
    btn.className = `status-box ${s}`;
    btn.checked = (s === statusVal);
    btn.onclick = () => {
      [...li.querySelectorAll(".status-box")].forEach(b => {
        if (b !== btn) b.checked = false;
      });
      saveTasks(); // Save after status change
    };
    li.appendChild(btn);
  });

  const delBtn = document.createElement("button");
  delBtn.textContent = "❌";
  delBtn.className = "delete-btn";
  delBtn.onclick = () => {
    li.remove();
    saveTasks(); // Save after delete
  };

  li.appendChild(delBtn);
  list.appendChild(li);
  saveTasks(); // Save after add
}

// 🧠 Generate tasks from OpenRouter AI
button.addEventListener("click", async () => {
  const userText = input.value.trim();
  if (!userText) return;

  status.textContent = "🤖 Thinking...";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site.github.io",
        "X-Title": "AI To-Do Assistant"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content: "You are an agent that analyzes a user's journal entry and extracts the core to-do tasks."
          },
          {
            role: "user",
            content: `From the message given, identify the user's tasks as a to-do list. Do not explain anything. Just return the list:\n${userText}`
          }
        ]
      })
    });

    if (!response.ok) throw new Error(`API Error ${response.status}: ${response.statusText}`);

    const data = await response.json();
    const reply = data.choices[0].message.content;

    const items = reply.split(/\n|•|–|-/).filter(t => t.trim().length > 2);
    items.forEach(item => {
      const taskText = item.replace(/^\d+\.\s*/, "").trim();
      if (!taskText) return;
      addTask(taskText);
    });

    status.textContent = "✅ Tasks added!";
  } catch (err) {
    console.error("❌ Error:", err);
    status.textContent = "❌ Error: " + err.message;
  }
});

// 🚀 Load tasks on startup
window.addEventListener("DOMContentLoaded", loadTasks);
// 🌙 Dark mode toggle
const toggle = document.getElementById("darkToggle");
toggle.checked = localStorage.getItem("dark_mode") === "true";

if (toggle.checked) document.body.classList.add("dark");

toggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark_mode", toggle.checked);
});
const shareBtn = document.getElementById("shareBtn");
const shareOut = document.getElementById("shareOutput");

shareBtn.addEventListener("click", () => {
  const tasks = [];
  document.querySelectorAll(".task-item").forEach(li => {
    const text = li.querySelector(".task-text").textContent;
    const status = li.querySelector(".status-box.todo").checked
      ? "todo"
      : li.querySelector(".status-box.doing").checked
      ? "doing"
      : li.querySelector(".status-box.done").checked
      ? "done"
      : "none";
    tasks.push({ text, status });
  });

  const encoded = encodeURIComponent(JSON.stringify(tasks));
  const url = `${location.origin}${location.pathname}?share=${encoded}`;

  shareOut.value = url;
  shareOut.select();
  document.execCommand("copy");
  status.textContent = "✅ Share link copied!";
});
// 📨 Load shared list from URL if available
const params = new URLSearchParams(location.search);
if (params.has("share")) {
  const shared = JSON.parse(decodeURIComponent(params.get("share")));
  localStorage.setItem("todo_tasks", JSON.stringify(shared));
  location.href = location.origin + location.pathname; // Clean the URL
}


function resetKey() {
  localStorage.removeItem("openrouter_key");
  location.reload();
}
document.getElementById("resetKeyBtn").addEventListener("click", () => {
  localStorage.removeItem("openrouter_key");
  location.reload();
});
