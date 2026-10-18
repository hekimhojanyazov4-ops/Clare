import { apiRequest } from "../api.js";

export async function getPayments() {
    const data = await apiRequest("/payments/");
    return data?.results ?? data;
}
