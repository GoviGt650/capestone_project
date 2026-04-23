const API = `${BASE_URL}/${SERVICE}`;

function getUsers() {
  console.log("Fetching users...");

  fetch(`${API}/users`)
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
  console.log("Adding user...");

  const name = document.getElementById("username").value;

  fetch(`${API}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  })
  .then(() => getUsers())
  .catch(err => console.error(err));
}

// expose to HTML
window.getUsers = getUsers;
window.addUser = addUser;