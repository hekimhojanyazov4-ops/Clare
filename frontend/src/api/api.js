const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";


export async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || "Something went wrong"
        );
    }
    return data;
}