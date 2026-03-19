// State Management
let tasks = JSON.parse(localStorage.getItem('smartTasks')) || [];
let currentUser = localStorage.getItem('smartUserName') || '';

// DOM Elements
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const displayName = document.getElementById('display-name');
const logoutBtn = document.getElementById('logout-btn');

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const categoryInput = document.getElementById('category-input');
const priorityInput = document.getElementById('priority-input');
const dueDateInput = document.getElementById('due-date-input');
const taskList = document.getElementById('task-list');

const totalCount = document.getElementById('total-count');
const pendingCount = document.getElementById('pending-count');
const completedCount = document.getElementById('completed-count');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const searchInput = document.getElementById('search-input');
const clearCompletedBtn = document.getElementById('clear-completed');

const filterBtns = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';
let searchQuery = '';

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initTheme();
    renderTasks();
});

// Auth Logic
function checkAuth() {
    if (currentUser) {
        showApp();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

function showApp() {
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    displayName.textContent = currentUser;
    renderTasks();
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentUser = usernameInput.value.trim();
    if (currentUser) {
        localStorage.setItem('smartUserName', currentUser);
        showApp();
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('smartUserName');
    currentUser = '';
    showLogin();
});

// Social Login Simulation
const googleBtn = document.getElementById('google-btn');
const githubBtn = document.getElementById('github-btn');

googleBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim() || 'Google User';
    currentUser = name;
    localStorage.setItem('smartUserName', currentUser);
    showApp();
});

githubBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim() || 'GitHub User';
    currentUser = name;
    localStorage.setItem('smartUserName', currentUser);
    showApp();
});

// Task Logic
function addTask(e) {
    e.preventDefault();
    const text = taskInput.value.trim();
    const category = categoryInput.value;
    const priority = priorityInput.value;
    const dueDate = dueDateInput.value;

    if (!text) return;

    const newTask = {
        id: Date.now().toString(),
        text,
        category,
        priority,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveTasks();
    taskForm.reset();
    renderTasks();
}

taskForm.addEventListener('submit', addTask);

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            const isNowCompleted = !task.completed;
            if (isNowCompleted) {
                triggerConfetti();
            }
            return { ...task, completed: isNowCompleted };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function editTask(id, newText) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, text: newText };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

clearCompletedBtn.addEventListener('click', clearCompleted);

function saveTasks() {
    localStorage.setItem('smartTasks', JSON.stringify(tasks));
    updateCounters();
}

function updateCounters() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    totalCount.textContent = total;
    pendingCount.textContent = pending;
    completedCount.textContent = completed;

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
}

// Rendering
function renderTasks() {
    taskList.innerHTML = '';
    
    let filteredTasks = tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = 
            currentFilter === 'all' || 
            (currentFilter === 'pending' && !task.completed) || 
            (currentFilter === 'completed' && task.completed);
        return matchesSearch && matchesFilter;
    });

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item glass ${task.completed ? 'completed' : ''}`;
        li.draggable = true;
        li.dataset.id = task.id;

        const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date().setHours(0,0,0,0);

        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')">
                <i data-lucide="check" class="check-icon"></i>
            </div>
            <div class="task-content">
                <div class="task-title" contenteditable="true" onblur="handleTextEdit(event, '${task.id}')">
                    ${task.text}
                </div>
                <div class="task-meta">
                    <span class="category-tag">${task.category}</span>
                    <div class="priority-indicator priority-${task.priority}" title="Priority: ${task.priority}"></div>
                    ${task.dueDate ? `
                        <span class="due-date ${isOverdue ? 'overdue' : ''}">
                            <i data-lucide="calendar" style="width:12px"></i>
                            ${formatDate(task.dueDate)}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete Task">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        
        taskList.appendChild(li);
    });

    lucide.createIcons();
    updateCounters();
    initDragAndDrop();
}

function formatDate(dateStr) {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}

function handleTextEdit(e, id) {
    const newText = e.target.innerText.trim();
    if (newText) {
        editTask(id, newText);
    } else {
        renderTasks(); 
    }
}

// Search & Filtering
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTasks();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem('smartTheme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.setAttribute('data-lucide', 'sun');
    } else {
        document.body.classList.remove('dark-mode');
        themeIcon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('smartTheme', isDark ? 'dark' : 'light');
    themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
});

// Drag and Drop
function initDragAndDrop() {
    const items = document.querySelectorAll('.task-item');
    items.forEach(item => {
        item.addEventListener('dragstart', () => item.classList.add('dragging'));
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            saveOrder();
        });
    });

    taskList.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(taskList, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (dragging) {
            if (afterElement == null) {
                taskList.appendChild(dragging);
            } else {
                taskList.insertBefore(dragging, afterElement);
            }
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveOrder() {
    const newOrder = [...taskList.querySelectorAll('.task-item')].map(item => {
        const id = item.dataset.id;
        return tasks.find(t => t.id === id);
    }).filter(t => t);
    tasks = newOrder;
    saveTasks();
}

// Visual Effects
function triggerConfetti() {
    // Simple visual feedback for completion
    const effect = document.createElement('div');
    effect.className = 'completion-flash';
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

