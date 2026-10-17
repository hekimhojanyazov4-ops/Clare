import { apiRequest } from "./api";

export  async function getProducts() {
    return apiRequest("/products/");
}

export async function getProduct(uuid) {
    if (!uuid) {
        throw new Error("Product UUID is required.");
    }

    return apiRequest(`/products/${uuid}/`);
}

export async function createProduct(productData) {
    return apiRequest("/products/", {
        method: "POST",
        body: JSON.stringify(productData)
    });
}

export async function updateProduct(uuid, productData) {
    return apiRequest(`/products/${uuid}/`, {
        method: "PATCH",
        body: JSON.stringify(productData),
    });
}

export async function deleteProduct(uuid) {
    return apiRequest(`/products/${uuid}/`, {
        method: "DELETE",
    });
}