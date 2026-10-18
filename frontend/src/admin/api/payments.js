import { api } from "./client";

export async function getPayments() {
    return api.get("/payments/");
}

export async function getPayment(uuid) {
    return api.get(`/payments/${uuid}/`);
}
