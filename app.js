// ============================================
// STATE — single source of truth
// ============================================

let state = {
    tasks: [],
    filter: "all",
    nextId: 1,
};

// ============================================
// LOAD FROM LOCALSTORAGE
// ============================================

function loadState() {
    const saved = localStorage.getItem("todo-state");
    if (saved) {
        state = JSON.parse(saved);
    }
}

function saveState() {
    localStorage.setItem("todo-state", JSON.stringify(state));
}

// ============================================
// TASK OPERATIONS
// ============================================

function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return false;
    if (trimmed.length > 100) return false;

    const task = {
        id: state.nextId++,
        text: trimmed,
        completed: false,
        createdAt: new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        }),
    };

    state.tasks.unshift(task); // add to beginning
    saveState();
    render();
    return true;
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveState();
        render();
    }
}

function deleteTask(id) {
    // Animate out
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) {
        item.style.transform = "translateX(100px)";
        item.style.opacity = "0";
        item.style.transition = "all 0.3s ease";
        setTimeout(() => {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveState();
            render();
        }, 300);
    }
}

function clearCompleted() {
    state.tasks = state.tasks.filter(t => !t.completed);
    saveState();
    render();
}

// ============================================
// FILTERING
// ============================================

function getFilteredTasks() {
    switch (state.filter) {
        case "active":
            return state.tasks.filter(t => !t.completed);
        case "completed":
            return state.tasks.filter(t => t.completed);
        default:
            return state.tasks;
    }
}

function setFilter(filter) {
    state.filter = filter;
    render();
}

// ============================================
// RENDERING
// ============================================

function render() {
    renderTasks();
    renderStats();
    renderFilters();
}

function renderTasks() {
    const list = document.getElementById("task-list");
    const emptyState = document.getElementById("empty-state");
    const filtered = getFilteredTasks();

    if (filtered.length === 0) {
        list.innerHTML = "";
        emptyState.classList.remove("hidden");

        // Customize empty state message
        const title = emptyState.querySelector(".empty-title");
        const sub = emptyState.querySelector(".empty-sub");

        if (state.tasks.length === 0) {
            emptyState.querySelector(".empty-icon").textContent = "📝";
            title.textContent = "No tasks yet!";
            sub.textContent = "Add a task above to get started";
        } else if (state.filter === "active") {
            emptyState.querySelector(".empty-icon").textContent = "🎉";
            title.textContent = "All done!";
            sub.textContent = "No active tasks remaining";
        } else {
            emptyState.querySelector(".empty-icon").textContent = "⭕";
            title.textContent = "Nothing completed yet";
            sub.textContent = "Complete some tasks to see them here";
        }
        return;
    }

    emptyState.classList.add("hidden");

    list.innerHTML = filtered
        .map(task => `
            <li class="task-item ${task.completed ? "completed" : ""}"
                data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? "checked" : ""}"
                     data-action="toggle"
                     data-id="${task.id}">
                </div>
                <span class="task-text">${escapeHtml(task.text)}</span>
                <div class="task-meta">
                    <span class="task-date">${task.createdAt}</span>
                    <button class="delete-btn"
                            data-action="delete"
                            data-id="${task.id}"
                            title="Delete task">
                        ×
                    </button>
                </div>
            </li>
        `)
        .join("");
}

function renderStats() {
    const activeCount = state.tasks.filter(t => !t.completed).length;
    const total = state.tasks.length;
    const completed = total - activeCount;

    const countEl = document.getElementById("task-count");
    if (activeCount === 0 && total === 0) {
        countEl.textContent = "No tasks";
    } else {
        countEl.textContent = 
            `${activeCount} active · ${completed} completed`;
    }
}

function renderFilters() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.filter === state.filter);
    });
}

// ============================================
// UTILITY
// ============================================

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    const input = document.getElementById("task-input");
    const addBtn = document.getElementById("add-btn");
    const taskList = document.getElementById("task-list");

    // Add task on Enter
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const success = addTask(input.value);
            if (success) {
                input.value = "";
                input.focus();
            }
        }
    });

    // Add task on button click
    addBtn.addEventListener("click", () => {
        const success = addTask(input.value);
        if (success) {
            input.value = "";
            input.focus();
        }
    });

    // Event delegation for task list
    taskList.addEventListener("click", (e) => {
        const action = e.target.closest("[data-action]");
        if (!action) return;

        const id = parseInt(action.dataset.id);
        const actionType = action.dataset.action;

        if (actionType === "toggle") toggleTask(id);
        if (actionType === "delete") deleteTask(id);
    });

    // Filter buttons
    document.querySelector(".filters").addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn");
        if (btn) setFilter(btn.dataset.filter);
    });

    // Clear completed
    document.getElementById("clear-completed").addEventListener("click", () => {
        if (state.tasks.some(t => t.completed)) {
            clearCompleted();
        }
    });

    // Focus input on load
    input.focus();
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    loadState();
    setupEventListeners();
    render();

    // Add sample tasks if first time
    if (state.tasks.length === 0) {
        addTask("Learn JavaScript DOM manipulation");
        addTask("Solve 2 LeetCode problems daily");
        addTask("Complete SQLZoo Section 5");
        addTask("Build Todo App");
    }

    console.log("Todo App initialized");
    console.log(`Loaded ${state.tasks.length} tasks from storage`);
});