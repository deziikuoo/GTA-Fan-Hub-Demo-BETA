<!-- ForgotPassword.vue -->
<template>
  <div class="forgot-password-container">
    <h2>Forgot Password</h2>
    <form @submit.prevent="handleSubmit" class="forgot-password-form">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="Enter your email address"
          required
          :disabled="isLoading"
        />
      </div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? "Sending..." : "Reset Password" }}
      </button>
    </form>
    <p v-if="error" class="error" aria-live="polite">
      {{ error }}
    </p>
    <p v-if="success" class="success" aria-live="polite">
      {{ success }}
    </p>
    <router-link to="/" class="back-to-login"> Back to Home </router-link>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "@/utils/axios";

const email = ref("");
const error = ref(null);
const success = ref(null);
const isLoading = ref(false);

const handleSubmit = async () => {
  error.value = null;
  success.value = null;
  isLoading.value = true;

  try {
    await axios.post("/api/forgot-password", {
      email: email.value,
    });
    success.value =
      "If an account exists with this email, you will receive password reset instructions.";
    email.value = "";
  } catch (err) {
    if (err.response?.status === 400) {
      error.value = err.response.data.message || "Invalid email address";
    } else {
      error.value = "An error occurred. Please try again later.";
    }
    console.error("Password reset request failed:", err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.forgot-password-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.forgot-password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: #333;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

button {
  padding: 0.75rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #357abd;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  margin-top: 1rem;
  text-align: center;
}

.success {
  color: #28a745;
  margin-top: 1rem;
  text-align: center;
}

.back-to-login {
  display: block;
  text-align: center;
  margin-top: 1rem;
  color: #4a90e2;
  text-decoration: none;
}

.back-to-login:hover {
  text-decoration: underline;
}

/* Dark mode styles */
:root[data-theme="dark"] .forgot-password-container {
  background: rgba(0, 0, 0, 0.2);
}

:root[data-theme="dark"] label {
  color: #fff;
}

:root[data-theme="dark"] input {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

:root[data-theme="dark"] input:focus {
  border-color: #4a90e2;
}

:root[data-theme="dark"] .back-to-login {
  color: #4a90e2;
}
</style>
