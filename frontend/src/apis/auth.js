import { API_URL } from "../api.js";

export async function loginUser(username, password) {
    const endpoints = [`${API_URL}/auth/login/`, `${API_URL}/token/`];

    let lastError = null;

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            const text = await response.text();
            const data = text ? JSON.parse(text) : null;

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.message ||
                    "Login failed."
                );
            }

            return data;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Login failed.");
}