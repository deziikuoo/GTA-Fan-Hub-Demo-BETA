<template>
  <div class="register-container">
    <h2 id="register-title">Register</h2>
    <form @submit.prevent="register" class="register-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="Enter email"
          required
          :disabled="isLoading"
        />
      </div>
      <div class="form-group">
        <label for="username">Username</label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          placeholder="Enter username"
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
      <div class="form-group">
        <label for="phoneNumber">Phone Number</label>
        <input
          id="phoneNumber"
          v-model="form.phoneNumber"
          type="tel"
          placeholder="Enter 10-15 digits (e.g., 1234567890)"
          :disabled="isLoading"
        />
      </div>
      <div class="form-group">
        <label for="address">Address</label>
        <input
          id="address"
          v-model="form.address"
          type="text"
          placeholder="Enter address"
          :disabled="isLoading"
        />
      </div>
      <div class="form-group">
        <label for="gender">Gender</label>
        <select id="gender" v-model="form.gender" :disabled="isLoading">
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer not to say">Prefer not to say</option>
        </select>
      </div>
      <div class="form-group">
        <label for="profilePicture">Profile Picture</label>
        <input
          id="profilePicture"
          type="file"
          accept="image/*"
          @change="handleFileUpload"
          :disabled="isLoading"
        />
      </div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? "Registering..." : "Register" }}
      </button>
    </form>
    <p v-if="error" class="error" aria-live="polite">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "@/utils/axios";

const store = useStore();
const router = useRouter();
const form = ref({
  email: "",
  username: "",
  password: "",
  phoneNumber: "",
  address: "",
  gender: "male",
  profilePicture: null,
});
const error = ref(null);
const isLoading = ref(false);

const handleFileUpload = (event) => {
  form.value.profilePicture = event.target.files[0];
};

const validatePhoneNumber = () => {
  const phoneRegex = /^\d{10,15}$/;
  if (form.value.phoneNumber && !phoneRegex.test(form.value.phoneNumber)) {
    error.value = "Phone number must contain 10 to 15 digits only.";
    return false;
  }
  return true;
};

const register = async () => {
  if (!validatePhoneNumber()) return;
  isLoading.value = true;
  error.value = null;

  const formData = new FormData();
  formData.append("email", form.value.email);
  formData.append("username", form.value.username);
  formData.append("password", form.value.password);
  formData.append("phoneNumber", form.value.phoneNumber);
  formData.append("address", form.value.address);
  formData.append("gender", form.value.gender);
  if (form.value.profilePicture) {
    formData.append("profilePicture", form.value.profilePicture);
  }

  try {
    const response = await axios.post("/api/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Store the access token
    localStorage.setItem("accessToken", response.data.accessToken);

    // Update store with user data
    store.dispatch("loginUser", response.data.user);

    // Emit events and redirect
    emit("registered", response.data);
    emit("close");
    router.push("/");

    // Reset form
    form.value.email = "";
    form.value.username = "";
    form.value.password = "";
    form.value.phoneNumber = "";
    form.value.address = "";
    form.value.gender = "male";
    form.value.profilePicture = null;
  } catch (err) {
    console.error("Registration error:", err);
    if (err.response?.status === 400) {
      error.value = err.response.data.error || "Registration failed";
    } else {
      error.value = "Registration failed. Please try again.";
    }
  } finally {
    isLoading.value = false;
  }
};

const emit = defineEmits(["registered", "close"]);
</script>

<style scoped>
.register-container {
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
  margin-bottom: 20px;
}

.register-form {
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

input,
select {
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

input:focus,
select:focus {
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
</style>
