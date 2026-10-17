import { api } from "./client";

export async function getOrders() {
    return api.get("/orders/");
}

export async function getOrder(uuid) {
    return api.get(`/orders/${uuid}/`);
}

export async function updateOrder(uuid, data) {
    return api.patch(`/orders/${uuid}/`, data);
}

export async function deleteOrder(uuid) {
    return api.delete(`/orders/${uuid}/`);
}

export async function bulkDeleteOrders(uuids) {
    return api.postRaw("/orders/bulk-delete/", {
        uuids,
    });
}