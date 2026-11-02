/**
 * TaskFlow — Gestor de Tareas Moderno
 * Vanilla JavaScript Implementation with LocalStorage Persistence
 */

// Initial Seed Data for first-time users
const DEFAULT_TASKS = [
  {
    id: "task-1",
    title: "Explorar la interfaz y funcionalidades de TaskFlow",
    category: "Personal",
    priority: "alta",
    dueDate: new Date().toISOString().split("T")[0],
    completed: true,
    createdAt: Date.now() - 3600000,
  },
  {
    id: "task-2",
    title: "Crear una nueva tarea con fecha de entrega y prioridad",
    category: "Trabajo",
    priority: "media",
    dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    completed: false,
    createdAt: Date.now() - 1800000,
  },
  {
    id: "task-3",
    title: "Probar el modo oscuro y los filtros",
    category: "Estudio",
    priority: "baja",
    dueDate: "",
    completed: false,
    createdAt: Date.now(),
  }
];

class TaskFlowApp {
  constructor() {
    this.tasks = this.loadTasks();
    this.currentFilter = "all"; // 'all' | 'pending' | 'completed'
    this.searchQuery = "";
    
    this.initDOMElements();
    this.initTheme();
    this.bindEvents();
    this.render();
  }

  // LocalStorage Helpers
  loadTasks() {
    try {
      const stored = localStorage.getItem("taskflow_tasks");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error al cargar tareas de LocalStorage:", e);
    }
    return DEFAULT_TASKS;
  }

  saveTasks() {
    try {
      localStorage.setItem("taskflow_tasks", JSON.stringify(this.tasks));
    } catch (e) {
      console.error("Error al guardar tareas en LocalStorage:", e);
    }
  }

  // DOM Selection
  initDOMElements() {
    // Forms & Inputs
    this.taskForm = document.getElementById("taskForm");
    this.taskTitleInput = document.getElementById("taskTitleInput");
    this.taskCategoryInput = document.getElementById("taskCategoryInput");
    this.taskPriorityInput = document.getElementById("taskPriorityInput");
    this.taskDueDateInput = document.getElementById("taskDueDateInput");

    // List & Controls
    this.taskList = document.getElementById("taskList");
    this.emptyState = document.getElementById("emptyState");
    this.emptyStateTitle = document.getElementById("emptyStateTitle");
    this.emptyStateSubtitle = document.getElementById("emptyStateSubtitle");
    this.clearCompletedBtn = document.getElementById("clearCompletedBtn");
    this.searchInput = document.getElementById("searchInput");
    this.clearSearchBtn = document.getElementById("clearSearchBtn");
    this.filterTabs = document.querySelectorAll(".filter-tab");

    // Stats Elements
    this.statsCountText = document.getElementById("statsCountText");
    this.percentageBadge = document.getElementById("percentageBadge");
    this.progressBarFill = document.getElementById("progressBarFill");
    this.totalTasksCount = document.getElementById("totalTasksCount");
    this.pendingTasksCount = document.getElementById("pendingTasksCount");
    this.completedTasksCount = document.getElementById("completedTasksCount");

    // Edit Modal Elements
    this.editModalOverlay = document.getElementById("editModalOverlay");
    this.editTaskForm = document.getElementById("editTaskForm");
    this.editTaskId = document.getElementById("editTaskId");
    this.editTaskTitle = document.getElementById("editTaskTitle");
    this.editTaskCategory = document.getElementById("editTaskCategory");
    this.editTaskPriority = document.getElementById("editTaskPriority");
    this.editTaskDueDate = document.getElementById("editTaskDueDate");
    this.closeModalBtn = document.getElementById("closeModalBtn");
    this.cancelEditBtn = document.getElementById("cancelEditBtn");

    // Theme & Toast
    this.themeToggleBtn = document.getElementById("themeToggleBtn");
    this.toast = document.getElementById("toast");
  }

  // Theme Handling (Light / Dark)
  initTheme() {
    const savedTheme = localStorage.getItem("taskflow_theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    document.documentElement.setAttribute("data-theme", initialTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("taskflow_theme", nextTheme);
    this.showToast(`Modo ${nextTheme === "dark" ? "oscuro" : "claro"} activado`);
  }

  // Event Listeners
  bindEvents() {
    // Add Task
    this.taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleAddTask();
    });

    // Theme Toggle
    this.themeToggleBtn.addEventListener("click", () => this.toggleTheme());

    // Search Input
    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.clearSearchBtn.style.display = this.searchQuery ? "block" : "none";
      this.render();
    });

    this.clearSearchBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.clearSearchBtn.style.display = "none";
      this.searchInput.focus();
      this.render();
    });

    // Filter Tabs
    this.filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.filterTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.currentFilter = tab.getAttribute("data-filter");
        this.render();
      });
    });

    // Clear Completed
    this.clearCompletedBtn.addEventListener("click", () => {
      this.handleClearCompleted();
    });

    // Modal Events
    this.closeModalBtn.addEventListener("click", () => this.closeEditModal());
    this.cancelEditBtn.addEventListener("click", () => this.closeEditModal());
    this.editModalOverlay.addEventListener("click", (e) => {
      if (e.target === this.editModalOverlay) {
        this.closeEditModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.editModalOverlay.classList.contains("active")) {
        this.closeEditModal();
      }
    });

    this.editTaskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSaveEdit();
    });
  }

  // Core Actions
  handleAddTask() {
    const title = this.taskTitleInput.value.trim();
    if (!title) return;

    const newTask = {
      id: "task-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title: title,
      category: this.taskCategoryInput.value,
      priority: this.taskPriorityInput.value,
      dueDate: this.taskDueDateInput.value || "",
      completed: false,
      createdAt: Date.now(),
    };

    this.tasks.unshift(newTask);
    this.saveTasks();
    this.render();

    // Reset Form
    this.taskTitleInput.value = "";
    this.taskDueDateInput.value = "";
    this.taskTitleInput.focus();

    this.showToast("Tarea agregada correctamente");
  }

  toggleTaskCompletion(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    this.saveTasks();
    this.render();

    if (task.completed) {
      this.showToast("¡Tarea completada! 🎉");
    }
  }

  deleteTask(id) {
    const taskIndex = this.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return;

    const [deletedTask] = this.tasks.splice(taskIndex, 1);
    this.saveTasks();
    this.render();
    this.showToast(`Tarea eliminada`);
  }

  handleClearCompleted() {
    const completedCount = this.tasks.filter((t) => t.completed).length;
    if (completedCount === 0) {
      this.showToast("No hay tareas completadas para limpiar");
      return;
    }

    if (confirm(`¿Deseas eliminar las ${completedCount} tareas completadas?`)) {
      this.tasks = this.tasks.filter((t) => !t.completed);
      this.saveTasks();
      this.render();
      this.showToast(`${completedCount} tareas eliminadas`);
    }
  }

  // Modal Editing
  openEditModal(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    this.editTaskId.value = task.id;
    this.editTaskTitle.value = task.title;
    this.editTaskCategory.value = task.category;
    this.editTaskPriority.value = task.priority;
    this.editTaskDueDate.value = task.dueDate || "";

    this.editModalOverlay.classList.add("active");
    this.editModalOverlay.setAttribute("aria-hidden", "false");
    setTimeout(() => this.editTaskTitle.focus(), 100);
  }

  closeEditModal() {
    this.editModalOverlay.classList.remove("active");
    this.editModalOverlay.setAttribute("aria-hidden", "true");
  }

  handleSaveEdit() {
    const id = this.editTaskId.value;
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    const newTitle = this.editTaskTitle.value.trim();
    if (!newTitle) return;

    task.title = newTitle;
    task.category = this.editTaskCategory.value;
    task.priority = this.editTaskPriority.value;
    task.dueDate = this.editTaskDueDate.value;

    this.saveTasks();
    this.closeEditModal();
    this.render();
    this.showToast("Tarea actualizada exitosamente");
  }

  // Filtering & Search
  getFilteredTasks() {
    return this.tasks.filter((task) => {
      // Filter status
      if (this.currentFilter === "pending" && task.completed) return false;
      if (this.currentFilter === "completed" && !task.completed) return false;

      // Filter search
      if (this.searchQuery) {
        const titleMatch = task.title.toLowerCase().includes(this.searchQuery);
        const categoryMatch = task.category.toLowerCase().includes(this.searchQuery);
        if (!titleMatch && !categoryMatch) return false;
      }

      return true;
    });
  }

  // Date Formatting Helper
  formatDueDate(dateString, isCompleted) {
    if (!dateString) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dateString.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let label = "";
    let isOverdue = false;

    if (diffDays === 0) {
      label = "Hoy";
    } else if (diffDays === 1) {
      label = "Mañana";
    } else if (diffDays === -1) {
      label = "Ayer";
      if (!isCompleted) isOverdue = true;
    } else if (diffDays < -1) {
      const options = { day: "numeric", month: "short" };
      label = targetDate.toLocaleDateString("es-ES", options);
      if (!isCompleted) isOverdue = true;
    } else {
      const options = { day: "numeric", month: "short" };
      label = targetDate.toLocaleDateString("es-ES", options);
    }

    return { label, isOverdue };
  }

  // Escape HTML to prevent XSS
  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Statistics Calculation
  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    this.statsCountText.textContent = `${completed} de ${total} tareas completadas`;
    this.percentageBadge.textContent = `${percent}%`;
    this.progressBarFill.style.width = `${percent}%`;

    this.totalTasksCount.textContent = total;
    this.pendingTasksCount.textContent = pending;
    this.completedTasksCount.textContent = completed;
  }

  // Rendering
  render() {
    this.updateStats();

    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      this.taskList.innerHTML = "";
      this.emptyState.style.display = "block";

      if (this.searchQuery) {
        this.emptyStateTitle.textContent = "Sin resultados";
        this.emptyStateSubtitle.textContent = `No se encontraron tareas que coincidan con "${this.searchQuery}".`;
      } else if (this.currentFilter === "completed") {
        this.emptyStateTitle.textContent = "No hay tareas completadas";
        this.emptyStateSubtitle.textContent = "Completa tus tareas marcando la casilla de verificación.";
      } else if (this.currentFilter === "pending") {
        this.emptyStateTitle.textContent = "¡Todo al día!";
        this.emptyStateSubtitle.textContent = "No tienes tareas pendientes. ¡Buen trabajo!";
      } else {
        this.emptyStateTitle.textContent = "Tu lista está vacía";
        this.emptyStateSubtitle.textContent = "Agrega una nueva tarea arriba para empezar a organizar tu día.";
      }
      return;
    }

    this.emptyState.style.display = "none";
    this.taskList.innerHTML = "";

    filteredTasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed" : ""}`;
      li.id = `task-item-${task.id}`;

      // Date information
      const dateInfo = this.formatDueDate(task.dueDate, task.completed);
      let dateBadgeHtml = "";
      if (dateInfo) {
        dateBadgeHtml = `
          <span class="badge-date ${dateInfo.isOverdue ? "overdue" : ""}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${dateInfo.isOverdue ? "Vencida: " : ""}${this.escapeHtml(dateInfo.label)}
          </span>
        `;
      }

      li.innerHTML = `
        <div class="task-checkbox-wrapper">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            ${task.completed ? "checked" : ""} 
            aria-label="Marcar como completada"
          >
        </div>

        <div class="task-content">
          <div class="task-title">${this.escapeHtml(task.title)}</div>
          <div class="task-meta">
            <span class="badge badge-category">${this.escapeHtml(task.category)}</span>
            <span class="badge badge-priority-${this.escapeHtml(task.priority)}">Prioridad ${this.escapeHtml(task.priority)}</span>
            ${dateBadgeHtml}
          </div>
        </div>

        <div class="task-actions">
          <button class="task-action-btn edit-btn" title="Editar tarea" aria-label="Editar tarea">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="task-action-btn delete-btn" title="Eliminar tarea" aria-label="Eliminar tarea">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Event Attachments
      const checkbox = li.querySelector(".task-checkbox");
      checkbox.addEventListener("change", () => this.toggleTaskCompletion(task.id));

      const editBtn = li.querySelector(".edit-btn");
      editBtn.addEventListener("click", () => this.openEditModal(task.id));

      const deleteBtn = li.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", () => this.deleteTask(task.id));

      this.taskList.appendChild(li);
    });
  }

  // Toast System
  showToast(message) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toast.textContent = message;
    this.toast.classList.add("show");

    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove("show");
    }, 2800);
  }
}

// Initialize Application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.taskFlowApp = new TaskFlowApp();
});

