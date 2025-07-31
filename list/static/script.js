const API_URL = "/api";
let userEmail = localStorage.getItem("userEmail");

document.addEventListener("DOMContentLoaded", () => {
  if (userEmail) {
    showTaskScreen(userEmail);
  }
});

// ===== LOGIN HANDLER =====
document.getElementById("enterBtn").addEventListener("click", () => {
  const emailInput = document.getElementById("emailInput");
  const emailError = document.getElementById("emailError");
  const email = emailInput.value.trim();

  if (!email.endsWith("@gmail.com")) {
    emailError.classList.remove("hidden");
    emailInput.classList.add("shake");
    setTimeout(() => emailInput.classList.remove("shake"), 300);
    return;
  }

  emailError.classList.add("hidden");
  userEmail = email;
  localStorage.setItem("userEmail", email);
  showTaskScreen(email);
});

// ===== LOGOUT HANDLER =====
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("userEmail");
  userEmail = null;
  document.getElementById("taskScreen").classList.add("hidden");
  document.getElementById("emailScreen").classList.remove("hidden");
});

// ===== ADD TASK HANDLER =====
document.getElementById("addBtn").addEventListener("click", async () => {
  const text = document.getElementById("task").value.trim();
  const datetime = document.getElementById("datetime").value;
  const priority = document.getElementById("priority").value;

  if (!text) {
    alert("Enter a task");
    return;
  }

  const response = await fetch(`${API_URL}/addTask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userEmail, text, datetime, priority })
  });

  const newTask = await response.json();

  // ✅ Clear form inputs every time
  document.getElementById("task").value = "";
  document.getElementById("datetime").value = "";
  document.getElementById("priority").value = "low";

  if (newTask && newTask._id) {
    addTaskToUI(newTask); // Show task immediately
  }

  // ✅ Refresh from database to stay accurate
  loadTasks(userEmail);
});

// ===== SHOW TASK SCREEN =====
function showTaskScreen(email) {
  document.getElementById("emailScreen").classList.add("hidden");
  document.getElementById("taskScreen").classList.remove("hidden");
  document.getElementById("userEmail").textContent = `Logged in as: ${email}`;
  loadTasks(email);
}

// ===== LOAD TASKS FROM DB =====
async function loadTasks(email) {
  const res = await fetch(`${API_URL}/getTasks/${email}`);
  const tasks = await res.json();

  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No tasks yet";
    li.style.textAlign = "center";
    li.style.color = "#888";
    taskList.appendChild(li);
    return;
  }

  tasks.forEach(task => addTaskToUI(task));
}

// ===== ADD TASK TO UI (CARD STYLE) =====
function addTaskToUI(task) {
  const taskList = document.getElementById("taskList");

  const li = document.createElement("li");
  li.classList.add("task-item");

  li.innerHTML = `
    <div class="task-info">
      <span class="task-text">${task.text}</span>
      <small class="task-date">${task.datetime || "No date"}</small>
      <span class="priority-badge priority-${task.priority}">
        ${task.priority}
      </span>
    </div>
    <div class="task-actions">
      <button class="btn-edit"><i class="fa-solid fa-pen"></i></button>
      <button class="btn-delete"><i class="fa-solid fa-trash"></i></button>
    </div>
  `;

  // ✅ DELETE HANDLER
  li.querySelector(".btn-delete").addEventListener("click", async () => {
    await fetch(`${API_URL}/deleteTask/${task._id}`, { method: "DELETE" });
    loadTasks(userEmail);
  });

  // ✅ EDIT HANDLER
  li.querySelector(".btn-edit").addEventListener("click", async () => {
    const newText = prompt("Enter new task:", task.text);
    if (!newText) return;
    await fetch(`${API_URL}/updateTask/${task._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText })
    });
    loadTasks(userEmail);
  });

  taskList.appendChild(li);
}
