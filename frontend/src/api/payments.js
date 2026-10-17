import { apiRequest } from "../api.js";

export async function getPayments() {
    const data = await apiRequest("/payments/");
    return data?.results ?? data;
}

export function createPayment(amount, orderUuid) {
    return apiRequest("/payments/", {
        method: "POST",
        body: JSON.stringify({ amount, ...(orderUuid ? { order_uuid: orderUuid } : {}) }),
    });
}