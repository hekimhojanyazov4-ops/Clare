import { api } from "./client";

export async function getFavourites() {
    return api.get("/favourites/");
}

export async function getFavourite(uuid) {
    return api.get(`/favourites/${uuid}/`);
}

export async function deleteFavourite(uuid) {
    return api.delete(`/favourites/${uuid}/`);
}

export async function bulkDeleteFavourites(uuids) {
    return api.post("/favourites/bulk-delete/", {
        uuids,
    });
}