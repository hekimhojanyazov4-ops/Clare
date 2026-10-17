import { api } from "./client";

export async function getUsers() {
    return api.get("/users/");
}

export async function getUser(uuid) {
    return api.get(`/users/${uuid}/`);
}

export async function createUser(data) {
    return api.post("/users/", data);
}

export async function deleteUser(uuid) {
    return api.delete(`/users/${uuid}/`);
}

export async function updateUser(uuid, data) {
    return api.patch(`/users/${uuid}/`, data);
}


export async function bulkDeleteUsers(uuids) {
    return Promise.all(uuids.map((uuid) => deleteUser(uuid)));
}