// Global API variable from config.js
let API = window.API || "http://localhost:8081/api";

// Array of vibrant colors for avatars
const avatarColors = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500'
];

let currentRoute = "round";

function updateAPI(route) {
  currentRoute = route;

  // 🔥 Save in localStorage
  localStorage.setItem("selectedRoute", route);

  API = window.ROUTES[route];

  console.log("🔁 Switched route:", route);
  console.log("🌐 New API:", API);

  showSuccess(`Switched to ${route.toUpperCase()} backend`);

  getUsers();
}

// Store current users for duplicate checking
let currentUsers = [];

// ==================== HELPER FUNCTIONS ====================

function getAvatarColor(userId, userName) {
  const str = (userId || userName || Math.random()).toString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ==================== TOAST SYSTEM ====================

function showEnhancedError(message) {
  const container = document.getElementById("errorCard");
  if (!container) return;
  
  container.innerHTML = `
    <div class="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 rounded-lg p-4 toast-show backdrop-blur-md">
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-sm text-red-400">${message}</p>
      </div>
    </div>
  `;
  container.classList.remove("hidden");
  setTimeout(() => {
    container.classList.add("hidden");
    container.innerHTML = "";
  }, 4000);
}

function showEnhancedSuccess(message) {
  const container = document.getElementById("successCard");
  if (!container) return;
  
  container.innerHTML = `
    <div class="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20 rounded-lg p-4 toast-show backdrop-blur-md">
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-sm text-green-400">${message}</p>
      </div>
    </div>
  `;
  container.classList.remove("hidden");
  setTimeout(() => {
    container.classList.add("hidden");
    container.innerHTML = "";
  }, 4000);
}

function showError(message) {
  console.error("❌", message);
  showEnhancedError(message);
}

function showSuccess(message) {
  console.log("✅", message);
  showEnhancedSuccess(message);
}

function showLoginError(message) {
  const el = document.getElementById("loginError");
  if (el) {
    el.innerText = message;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 4000);
  }
}

// ==================== MODAL CARDS ====================

function removeCard(cardId) {
  const card = document.getElementById(cardId);
  if (card) {
    card.remove();
  }
}

function removeExistingCards() {
  const cardIds = ["emptyNameCard", "shortNameCard", "duplicateCard", "deleteConfirmCard"];
  cardIds.forEach(id => removeCard(id));
}

// 🚫 Empty Name Card
function showEmptyNameCard() {
  removeExistingCards();
  
  const card = document.createElement("div");
  card.id = "emptyNameCard";
  card.className = "fixed inset-0 z-50 flex items-center justify-center";
  card.innerHTML = `
    <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" id="emptyNameOverlay"></div>
    <div class="relative glass-card rounded-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 bg-opacity-10 mb-4">
          <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">Username Required</h3>
        <p class="text-sm text-gray-400">
          Please enter a username to continue.
        </p>
        <p class="text-xs text-gray-500 mt-2">The username field cannot be empty.</p>
      </div>
      <button id="emptyNameCloseBtn"
        class="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-smooth">
        Got it
      </button>
    </div>
  `;
  
  document.body.appendChild(card);
  
  // Add event listeners
  document.getElementById("emptyNameOverlay").addEventListener("click", closeEmptyNameCard);
  document.getElementById("emptyNameCloseBtn").addEventListener("click", closeEmptyNameCard);
}

function closeEmptyNameCard() {
  removeCard("emptyNameCard");
  const input = document.getElementById("username");
  if (input) {
    setTimeout(() => input.focus(), 100);
  }
}

// 🔤 Short Name Card
function showShortNameCard() {
  removeExistingCards();
  
  const card = document.createElement("div");
  card.id = "shortNameCard";
  card.className = "fixed inset-0 z-50 flex items-center justify-center";
  card.innerHTML = `
    <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" id="shortNameOverlay"></div>
    <div class="relative glass-card rounded-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 bg-opacity-10 mb-4">
          <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">Username Too Short</h3>
        <p class="text-sm text-gray-400">
          Username must be at least <span class="text-orange-400 font-medium">2 characters</span> long.
        </p>
        <p class="text-xs text-gray-500 mt-2">Please enter a longer username.</p>
      </div>
      <button id="shortNameCloseBtn"
        class="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-smooth">
        Got it
      </button>
    </div>
  `;
  
  document.body.appendChild(card);
  
  document.getElementById("shortNameOverlay").addEventListener("click", closeShortNameCard);
  document.getElementById("shortNameCloseBtn").addEventListener("click", closeShortNameCard);
}

function closeShortNameCard() {
  removeCard("shortNameCard");
  const input = document.getElementById("username");
  if (input) {
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);
  }
}

// 👥 Duplicate Username Card
function showDuplicateCard(username) {
  removeExistingCards();
  
  const card = document.createElement("div");
  card.id = "duplicateCard";
  card.className = "fixed inset-0 z-50 flex items-center justify-center";
  card.innerHTML = `
    <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" id="duplicateOverlay"></div>
    <div class="relative glass-card rounded-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500 bg-opacity-10 mb-4">
          <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">Duplicate Username</h3>
        <p class="text-sm text-gray-400">
          A user with the name <span class="text-yellow-400 font-medium">"${escapeHtml(username)}"</span> already exists.
        </p>
        <p class="text-xs text-gray-500 mt-2">Please choose a different username.</p>
      </div>
      <button id="duplicateCloseBtn"
        class="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 transition-smooth">
        Got it
      </button>
    </div>
  `;
  
  document.body.appendChild(card);
  
  document.getElementById("duplicateOverlay").addEventListener("click", closeDuplicateCard);
  document.getElementById("duplicateCloseBtn").addEventListener("click", closeDuplicateCard);
}

function closeDuplicateCard() {
  removeCard("duplicateCard");
  const input = document.getElementById("username");
  if (input) {
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);
  }
}

// 🗑️ Delete Confirmation Card
function showDeleteCard(userId, userName) {
  removeExistingCards();
  
  const card = document.createElement("div");
  card.id = "deleteConfirmCard";
  card.className = "fixed inset-0 z-50 flex items-center justify-center";
  card.innerHTML = `
    <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" id="deleteOverlay"></div>
    <div class="relative glass-card rounded-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500 bg-opacity-10 mb-4">
          <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">Delete User</h3>
        <p class="text-sm text-gray-400">
          Are you sure you want to delete <span class="text-white font-medium">${escapeHtml(userName)}</span>?
        </p>
        <p class="text-xs text-gray-500 mt-2">This action cannot be undone.</p>
      </div>
      <div class="flex gap-3">
        <button id="deleteCancelBtn"
          class="btn-secondary flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 transition-smooth">
          Cancel
        </button>
        <button id="deleteConfirmBtn"
          class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-smooth">
          Delete
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(card);
  
  document.getElementById("deleteOverlay").addEventListener("click", closeDeleteCard);
  document.getElementById("deleteCancelBtn").addEventListener("click", closeDeleteCard);
  document.getElementById("deleteConfirmBtn").addEventListener("click", () => confirmDelete(userId));
}

function closeDeleteCard() {
  removeCard("deleteConfirmCard");
}

async function confirmDelete(userId) {
  removeCard("deleteConfirmCard");
  await deleteUser(userId);
}

// ==================== API FUNCTIONS ====================

async function init() {
  console.log("🚀 Initializing app...");
  console.log("🌐 Using API:", API);
  console.log("⚖️ Nginx will round-robin between all backends");

  const userList = document.getElementById("userList");
  
  try {
    const testRes = await fetch(`${API}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (testRes.ok) {
      const data = await testRes.json().catch(() => ({}));
      console.log("✅ Connected to backend:", data);
      showSuccess(`Connected successfully via Nginx load balancer`);
    } else {
      console.warn("⚠️ Health check failed:", testRes.status);
      showError(`Backend returned status ${testRes.status}`);
    }
    
    await getUsers();
    
  } catch (err) {
    console.error("Init error:", err);
    showError(`Cannot connect to backend. Is Docker running?`);
    
    if (userList) {
      userList.innerHTML = `
        <li class="text-red-400 text-center py-8">
          <div class="flex flex-col items-center gap-2">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Unable to connect to backend service</span>
            <span class="text-xs text-gray-500">Make sure Docker containers are running</span>
            <button id="retryBtn" class="mt-2 px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 transition-smooth">
              Retry Connection
            </button>
          </div>
        </li>
      `;
      
      setTimeout(() => {
        const retryBtn = document.getElementById("retryBtn");
        if (retryBtn) retryBtn.addEventListener("click", init);
      }, 100);
    }
  }
}

async function getUsers() {
  console.log("📋 Fetching users from:", `${API}/users`);
  
  const userList = document.getElementById("userList");
  if (!userList) return;
  
  userList.innerHTML = `
    <li class="text-gray-400 text-center py-8">
      <div class="flex justify-center">
        <div class="spinner"></div>
      </div>
    </li>
  `;

  try {
    const res = await fetch(`${API}/users`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch users (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const users = Array.isArray(data) ? data : (data.users || data.data || []);
    
    currentUsers = users;
    
const userCount = document.getElementById("userCount");
const userCountBadge = document.getElementById("userCountBadge");

if (userCount) {
  userCount.innerText = users.length;
}
if (userCountBadge) {
  userCountBadge.innerText = users.length + " users";
}
    
    userList.innerHTML = "";

    if (users.length === 0) {
      userList.innerHTML = `
        <li class="text-gray-500 text-center py-8">
          <div class="flex flex-col items-center gap-2">
            <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <span>No users found</span>
            <span class="text-xs">Add your first user using the form above</span>
          </div>
        </li>
      `;
      return;
    }

    users.forEach((user, index) => {
      const li = document.createElement("li");
      li.className = "user-item user-item-hover flex justify-between items-center px-6 py-3";
      li.style.animationDelay = `${index * 0.05}s`;
      
      const userId = user.id || user.userId || user.user_id || index;
      const userName = user.name || user.username || user.user_name || "Unnamed";
      const userEmail = user.email || "";
      const userInitial = getInitials(userName);
      const avatarColor = getAvatarColor(userId, userName);
      
      li.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold text-sm shadow-lg flex-shrink-0">
            ${userInitial}
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-white font-medium truncate">${escapeHtml(userName)}</span>
            <span class="text-xs text-gray-500">ID: ${userId}${userEmail ? ` • ${escapeHtml(userEmail)}` : ''}</span>
          </div>
        </div>
        <button class="delete-btn text-gray-400 hover:text-red-400 transition-colors text-sm flex items-center gap-1 flex-shrink-0 ml-4" data-userid="${userId}" data-username="${escapeHtml(userName)}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Delete
        </button>
      `;
      
      // Add event listener to delete button
      const deleteBtn = li.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", () => {
        const uid = deleteBtn.getAttribute("data-userid");
        const uname = deleteBtn.getAttribute("data-username");
        showDeleteCard(uid, uname);
      });
      
      userList.appendChild(li);
    });

    console.log(`✅ Loaded ${users.length} users`);

  } catch (err) {
    console.error("Fetch users error:", err);
    showError(`Error loading users: ${err.message}`);
    
    userList.innerHTML = `
      <li class="text-red-400 text-center py-8">
        <div class="flex flex-col items-center gap-2">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Failed to load users</span>
          <button id="retryGetUsersBtn" class="mt-2 px-3 py-1 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-smooth">
            Try Again
          </button>
        </div>
      </li>
    `;
    
    setTimeout(() => {
      const retryBtn = document.getElementById("retryGetUsersBtn");
      if (retryBtn) retryBtn.addEventListener("click", getUsers);
    }, 100);
  }
}

async function addUser() {
  const input = document.getElementById("username");
  if (!input) return;
  
  const name = input.value.trim();

  if (!name) {
    showEmptyNameCard();
    return;
  }
  
  if (name.length < 2) {
    showShortNameCard();
    return;
  }

  const isDuplicate = currentUsers.some(user => {
    const userName = (user.name || user.username || user.user_name || "").toLowerCase();
    return userName === name.toLowerCase();
  });

  if (isDuplicate) {
    showDuplicateCard(name);
    return;
  }

  const addButton = document.getElementById("addUserBtn");
  if (addButton) {
    addButton.disabled = true;
    addButton.innerHTML = `<div class="spinner"></div> Adding...`;
  }

  try {
    console.log("➕ Adding user:", name);
    
    const res = await fetch(`${API}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: name })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Failed to add user (${res.status})`);
    }

    const responseData = await res.json().catch(() => ({}));
    console.log("✅ User added:", responseData);
    
    showSuccess(`User "${escapeHtml(name)}" added successfully`);
    input.value = "";
    input.focus();
    await getUsers();

  } catch (err) {
    console.error("Add user error:", err);
    showError(`Error adding user: ${err.message}`);
  } finally {
    if (addButton) {
      addButton.disabled = false;
      addButton.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Add User
      `;
    }
  }
}

async function deleteUser(id) {
  if (!id && id !== 0) {
    showError("Invalid user ID");
    return;
  }

  console.log("🗑️ Deleting user:", id);

  try {
    const res = await fetch(`${API}/users/${id}`, {
      method: "DELETE",
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Delete failed (${res.status})`);
    }

    showSuccess(`User deleted successfully`);
    await getUsers();

  } catch (err) {
    console.error("Delete user error:", err);
    showError(`Error deleting user: ${err.message}`);
  }
}

// ==================== AUTH FUNCTIONS ====================

function login() {
  const usernameInput = document.getElementById("loginUser");
  const passwordInput = document.getElementById("loginPass");
  
  if (!usernameInput || !passwordInput) return;
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!username || !password) {
    showLoginError("Please enter both username and password");
    return;
  }
  
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.innerHTML = `<div class="spinner"></div> Signing in...`;
  }
  
  setTimeout(() => {
    if (username === "admin" && password === "admin") {
      localStorage.setItem("auth", "true");
      document.getElementById("loginPage").classList.add("hidden");
      document.getElementById("app").classList.remove("hidden");
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = "Sign in";
      }
      showSuccess("Login successful!");
      init();
    } else {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = "Sign in";
      }
      showLoginError("Invalid credentials. Use admin/admin");
    }
  }, 500);
}

function logout() {
  localStorage.removeItem("auth");
  location.reload();
}

// ==================== EVENT LISTENERS SETUP ====================

function setupEventListeners() {
  // Login button
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", login);
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Add User button
  const addUserBtn = document.getElementById("addUserBtn");
  if (addUserBtn) {
    addUserBtn.addEventListener("click", addUser);
  }

  // Refresh button
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", getUsers);
  }






  // Routing buttons
  document.querySelectorAll(".route-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const route = btn.getAttribute("data-route");

      // Update UI active state
      document.querySelectorAll(".route-btn").forEach(b => {
        b.classList.remove("btn-primary");
        b.classList.add("btn-secondary");
      });

      btn.classList.remove("btn-secondary");
      btn.classList.add("btn-primary");

      updateAPI(route);
    });
  });

  // Enter key handlers
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      removeExistingCards();
    }
    
    if (e.key === "Enter") {
      const loginPage = document.getElementById("loginPage");
      const app = document.getElementById("app");
      
      if (loginPage && !loginPage.classList.contains("hidden")) {
        e.preventDefault();
        login();
      } else if (app && !app.classList.contains("hidden") && document.activeElement?.id === "username") {
        e.preventDefault();
        addUser();
      }
    }
  });
}

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 Page loaded");

  // 🔥 Load saved route (or default to round robin)
  const savedRoute = localStorage.getItem("selectedRoute") || "round";
  currentRoute = savedRoute;
  API = window.ROUTES[savedRoute];

  console.log("🌐 API Base:", API);

  // Setup all event listeners
  setupEventListeners();

  // 🔥 Update active button UI based on saved route
  setTimeout(() => {
    document.querySelectorAll(".route-btn").forEach(btn => {
      const route = btn.getAttribute("data-route");

      if (route === currentRoute) {
        btn.classList.remove("btn-secondary");
        btn.classList.add("btn-primary");
      } else {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-secondary");
      }
    });
  }, 100);

  // Check authentication
  const isAuthenticated = localStorage.getItem("auth") === "true";
  if (isAuthenticated) {
    const loginPage = document.getElementById("loginPage");
    const app = document.getElementById("app");
    if (loginPage && app) {
      loginPage.classList.add("hidden");
      app.classList.remove("hidden");
      init();
    }
  }
});