<script>
export default {
  name: "Login",
};
</script>

<template>
  <body>
    <h1>Login</h1>
    <form id="loginForm">
      <input type="text" id="username" placeholder="Username" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>

    <script>
      document
        .getElementById("loginForm")
        .addEventListener("submit", async function (event) {
          event.preventDefault();
          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;

          const response = await fetch("http://localhost:3001/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();
          if (response.ok) {
            alert(`Login successful! Token: ${data.token}`);
          } else {
            alert(`Error: ${data.error}`);
          }
        });
    </script>
  </body>
</template>

<style></style>
