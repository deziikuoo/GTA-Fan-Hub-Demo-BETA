export function parseApiError(error) {
  if (!error.response) return "Network error: Unable to reach the server";
  if (error.response?.data?.errors) {
    return error.response.data.errors.map((e) => e.msg).join(", ");
  }
  return error.response?.data?.error || "An error occurred";
}
