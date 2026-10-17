import { api } from "./client";

export async function getProducts() {
    return api.get("/products/");
}

export async function getCategories() {
    return api.get("/categories/");
}

export async function getProduct(uuid) {
    return api.get(`/products/${uuid}/`);
}

export async function createProduct(data) {
    const { images = [], ...productData } = data;

    if (images.length) {
        const formData = new FormData();

        Object.entries(productData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, String(value));
            }
        });
        images.forEach((image) => formData.append("images", image));

        return api.postFormData("/products/", formData);
    }

    return api.post("/products/", productData);
}

export async function updateProduct(uuid, data) {
    return api.patch(`/products/${uuid}/`, data);
}

export async function deleteProduct(uuid) {
    return api.delete(`/products/${uuid}/`);
}

export async function bulkDeleteProducts(uuids) {
    return Promise.all(uuids.map((uuid) => deleteProduct(uuid)));
}