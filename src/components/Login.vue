<!-- Login.vue -->
<script setup>
import { ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "@/utils/axios";

// No props needed for Login component

const store = useStore();
const router = useRouter();
const form = ref({
  username: "",
  password: "",
});
const error = ref(null);
const isLoading = ref(false);
const loginError = ref(null);

const login = async () => {
  isLoading.value = true;
  error.value = null;

  // Debug: Check form values
  console.log("Login attempt with form data:", {
    username: form.value.username,
    password: form.value.password ? "[REDACTED]" : "undefined",
  });

  // Validate form data before sending
  if (!form.value.username || !form.value.password) {
    error.value = "Please fill in all fields";
    isLoading.value = false;
    return;
  }

  try {
    const response = await axios.post("/api/login", {
      username: form.value.username,
      password: form.value.password,
    });

    // Store the access token in localStorage
    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      console.log("Access token stored in localStorage");
    }

    store.dispatch("loginUser", response.data.user);
    emit("close");
    router.push("/");
    form.value.username = "";
    form.value.password = "";
  } catch (err) {
    console.error("Login error details:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
      config: err.config,
    });

    if (err.response?.status === 400) {
      error.value = err.response.data.errors
        ? err.response.data.errors.map((e) => e.msg).join(", ")
        : err.response.data.error || "Invalid username or password";
    } else if (err.code === "ECONNABORTED") {
      error.value = "Request timed out. Please check your connection.";
    } else {
      emit("error", error.value);
      error.value = "Login failed. Please try again.";
    }
  } finally {
    isLoading.value = false;
  }
};
const emit = defineEmits(["logged-in", "close"]);
</script>

<template>
  <div class="login-container">
    <h2 id="login-title">Login</h2>
    <form @submit.prevent="login" class="login-form">
      <div class="form-group">
        <label for="username">Username or Email</label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          placeholder="Enter username or email"
          required
          :disabled="isLoading"
        />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="Enter password"
          required
          :disabled="isLoading"
        />
      </div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? "Logging in..." : "Login" }}
      </button>
      <div class="forgot-password">
        <router-link to="/forgot-password">Forgot Password?</router-link>
      </div>
    </form>
    <p v-if="error" class="error" aria-live="polite">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: var(--glass-morphism-bg);
  border-radius: 1.2rem;
  border: 1px solid transparent;
  box-shadow: 
    8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  max-width: 400px;
  margin: auto;
}

h2 {
  color: var(--bright-white);
  margin-bottom: 15px;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  color: var(--bright-white);
  margin-bottom: 5px;
  font-weight: 500;
}

input {
  padding: 1rem;
  border: none;
  border-radius: 1rem;
  font-size: 1rem;
  background: rgba(40, 40, 45, 0.8);
  color: var(--bright-white);
  box-shadow: 
    12px 12px 30px rgba(0, 0, 0, 0.4),
    -12px -12px 30px rgba(80, 80, 90, 0.1);
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  background: rgba(40, 40, 45, 0.9);
  box-shadow: 
    inset 12px 12px 30px rgba(0, 0, 0, 0.5),
    inset -12px -12px 30px rgba(80, 80, 90, 0.2);
}

button {
  padding: 10px 16px;
  background: var(--glass-morphism-bg);
  color: var(--bright-white);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-full);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: fit-content;
}

button:hover:not(:disabled) {
  border: 1px solid var(--bright-white);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: var(--coral-red);
  font-size: 0.9rem;
  text-align: center;
  margin-top: 10px;
}

.forgot-password {
  text-align: center;
  margin-top: 10px;
}

.forgot-password a {
  color: var(--skyBlue);
  text-decoration: none;
  font-size: 0.9rem;
}

.forgot-password a:hover {
  text-decoration: underline;
}
</style>
