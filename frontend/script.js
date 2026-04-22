function getUsers() {
  console.log("Fetching users..."); // debug

  fetch(`${BASE_URL}/users`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("userList");
      list.innerHTML = "";

      data.forEach(user => {
        const li = document.createElement("li");
        li.textContent = user.name;
        list.appendChild(li);
      });
    })
    .catch(err => console.error(err));
}

function addUser() {
  console.log("Adding user..."); // debug

  const name = document.getElementById("username").value;

  fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  })
  .then(() => getUsers())
  .catch(err => console.error(err));
}

// ✅ IMPORTANT FIX
window.getUsers = getUsers;
window.addUser = addUser;