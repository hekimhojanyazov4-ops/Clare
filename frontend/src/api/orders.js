import { apiRequest } from "../api.js";

export async function getOrders() {
    const data = await apiRequest("/orders/");
    return data?.results ?? data;
}

export function createOrderFromCart() {
    return apiRequest("/orders/create_from_cart/", { method: "POST" });
}