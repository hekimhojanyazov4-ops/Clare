const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

async function readResponseBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const trimmedText = text.trim();

  const looksLikeJson =
    contentType.includes("application/json") ||
    trimmedText.startsWith("{") ||
    trimmedText.startsWith("[");

  if (!looksLikeJson) {
    return text;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const message = data.detail || data.message || data.error;

    if (typeof message === "string") {
      return message;
    }

    if (message) {
      return JSON.stringify(message);
    }
  }

  if (typeof data === "string") {
    if (data.toLowerCase().includes("<!doctype")) {
      return "The API returned an HTML error page. Check the Django server traceback.";
    }

    return data;
  }

  return "Request failed.";
}

async function request(endpoint, options = {}) {
  const accessToken = localStorage.getItem("access_token");
  const { headers: optionHeaders = {}, ...requestOptions } = options;

  const headers = new Headers(optionHeaders);

  const isFormData =
    typeof FormData !== "undefined" &&
    requestOptions.body instanceof FormData;

  if (requestOptions.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response;

  try {
    response = await fetch(
      `${API_URL}/${String(endpoint).replace(/^\/+/, "")}`,
      {
        ...requestOptions,
        headers,
      }
    );
  } catch (error) {
    throw new Error(`Could not connect to API: ${error.message}`);
  }

  const data = await readResponseBody(response);

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("admin-auth-expired"));

    throw new Error(
      "Your admin session has expired or is missing. Please log in again."
    );
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  if (
    typeof data === "string" &&
    data.toLowerCase().includes("<!doctype")
  ) {
    throw new Error(
      "Received an HTML page instead of JSON. Check the API URL and Django server."
    );
  }

  return data;
}

export const api = {
  get(endpoint, options = {}) {
    return request(endpoint, {
      ...options,
      method: "GET",
    });
  },

  post(endpoint, body, options = {}) {
    return request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  postRaw(endpoint, body, options = {}) {
    return request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  postFormData(endpoint, body, options = {}) {
    return request(endpoint, {
      ...options,
      method: "POST",
      body,
    });
  },

  put(endpoint, body, options = {}) {
    return request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  patch(endpoint, body, options = {}) {
    return request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete(endpoint, options = {}) {
    return request(endpoint, {
      ...options,
      method: "DELETE",
    });
  },
};