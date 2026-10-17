import { api } from "./client";

export async function getPayments() {
    return api.get("/payments/");
}

export async function getPayment(uuid) {
    return api.get(`/payments/${uuid}/`);
}

export async function updatePayment(uuid, data) {
    return api.patch(`/payments/${uuid}/`, data);
}

export async function deletePayment(uuid) {
    return api.delete(`/payments/${uuid}/`);
}

export async function bulkDeletePayments(uuids) {
    return api.postRaw("/payments/bulk-delete/", {
        uuids,
    });
}