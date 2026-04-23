const API = `${BASE_URL}/${SERVICE}`;

// 🔐 LOGIN
function login() {
  const u = document.getElementById("loginUser").value;
  const p = document.getElementById("loginPass").value;

  if (u === "admin" && p === "admin") {
    localStorage.setItem("auth", "true");
    showApp();
  } else {
    showError("loginError", "Invalid credentials ❌");
  }
}

function showApp() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

// auto login
if (localStorage.getItem("auth") === "true") {
  showApp();
}


// 🔴 ERROR / SUCCESS
function showError(id, msg) {
  const el = document.getElementById(id);
  el.innerText = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

function showSuccess(msg) {
  const el = document.getElementById("successCard");
  el.innerText = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}


// 🟢 GET USERS
function getUsers() {
  fetch(`${API}/users`)
    .then(res => res.json())
    .then(data => {

      document.getElementById("userCount").innerText =
        "Total Users: " + data.length;

      const list = document.getElementById("userList");
      list.innerHTML = "";

      data.forEach(user => {
        const li = document.createElement("li");

        li.className = "flex justify-between bg-gray-100 p-2 rounded";

        li.innerHTML = `
          ${user.name}
          <button onclick="deleteUser(${user.id})" class="text-red-500">❌</button>
        `;

        list.appendChild(li);
      });
    })
    .catch(() => showError("errorCard", "Failed to fetch users ❌"));
}


// 🟡 ADD USER
function addUser() {
  const name = document.getElementById("username").value.trim();

  if (!name) {
    showError("errorCard", "Name cannot be empty ❌");
    return;
  }

  // check duplicate
  fetch(`${API}/users`)
    .then(res => res.json())
    .then(users => {

      const exists = users.some(u =>
        u.name.toLowerCase() === name.toLowerCase()
      );

      if (exists) {
        showError("errorCard", "User already exists ❌");
        return;
      }

      fetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })
      .then(() => {
        showSuccess("User added ✅");
        document.getElementById("username").value = "";
        getUsers();
      });

    })
    .catch(() => showError("errorCard", "Error adding user ❌"));
}


// 🔵 DELETE USER
function deleteUser(id) {
  fetch(`${API}/users/${id}`, {
    method: "DELETE"
  })
  .then(() => {
    showSuccess("User deleted ✅");
    getUsers();
  })
  .catch(() => showError("errorCard", "Delete failed ❌"));
}


// expose
window.getUsers = getUsers;
window.addUser = addUser;
window.login = login;
window.deleteUser = deleteUser;