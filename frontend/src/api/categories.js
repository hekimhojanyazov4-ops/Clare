import { apiRequest } from "../api.js";

export async function getCategories() {
    const data = await apiRequest("/categories/");
    return data?.results ?? data;
}