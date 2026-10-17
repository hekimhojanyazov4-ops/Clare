import { api } from "./client";

export async function getCarts() {
    return api.get("/cart/");
}

export async function getCart(uuid) {
    return api.get(`/cart/${uuid}/`);
}

export async function deleteCart(uuid) {
    return api.delete(`/cart/${uuid}/`);
}

export async function updateCart(uuid, data) {
    return api.patch(`/cart/${uuid}/`, data);
}

export async function bulkDeleteCarts(uuids) {
    return api.postRaw("/cart/bulk-delete/", {
        uuids,
    });
}