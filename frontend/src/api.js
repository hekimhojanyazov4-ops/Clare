export const API_URL = (
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api/"
).replace(/\/+$/, "");

const parseApiResponse = async (response) => {
    const text = await response.text();

    if (!text) {
        return null;
    }

    const contentType =
        response.headers.get("content-type") || "";

    const looksLikeJson =
        contentType.includes("application/json") ||
        text.trim().startsWith("{") ||
        text.trim().startsWith("[");

    if (!looksLikeJson) {
        return text;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

const apiRequest = async (endpoint, options = {}) => {
    const accessToken = localStorage.getItem("access_token");

    const response = await fetch(
        `${API_URL}/${String(endpoint).replace(/^\/+/, "")}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...(accessToken
                    ? { Authorization: `Bearer ${accessToken}` }
                    : {}),
                ...options.headers,
            },
            ...options,
        }
    );

    const data = await parseApiResponse(response);

    if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        if (window.location.pathname !== "/login/") {
            window.location.replace("/login/");
        }

        throw new Error("Your session has expired or is missing. Please log in again.");
    }

    if (!response.ok) {
        const message =
            typeof data === "object"
                ? data.detail ||
                  data.message ||
                  "Something went wrong"
                : typeof data === "string" && data.includes("<!DOCTYPE")
                    ? "The backend API is unreachable. Check that Django is running and that the VITE_API_URL points to the API server."
                    : data || "Something went wrong";

        throw new Error(message);
    }

    if (typeof data === "string" && data.includes("<!DOCTYPE")) {
        throw new Error(
            "Received an HTML page instead of JSON. Check the backend URL or route."
        );
    }

    return data;
};


export const getProducts = async () => {
    const data = await apiRequest("/products/");
    return data.results ?? data;
};


export const getProduct = (uuid) => {
    return apiRequest(`products/${uuid}/`);
};


export const getCategories = () => {
    return apiRequest("/categories/").then((data) => data?.results ?? data);
};

export const getOrders = async () => {
    const data = await apiRequest("/orders/");
    return data.results ?? data;
};

export const getPayments = async () => {
    const data = await apiRequest("/payments/");
    return data.results ?? data;
};

export const createOrderFromCart = () => apiRequest("/orders/create_from_cart/", {
    method: "POST",
});

export const createPayment = (amount, orderUuid) => apiRequest("/payments/", {
    method: "POST",
    body: JSON.stringify({ amount, ...(orderUuid ? { order_uuid: orderUuid } : {}) }),
});

const readLocalList = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
        return [];
    }
};

const writeLocalList = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export const addToCart = async (productUuid, quantity = 1) => {
    if (localStorage.getItem("access_token")) {
        const data = await apiRequest("/cart/add_item/", {
            method: "POST",
            body: JSON.stringify({
                product_uuid: productUuid,
                quantity,
            }),
        });
        window.dispatchEvent(new Event("commerce-cart-updated"));
        return data;
    }

    const cart = readLocalList("guest_cart");
    const existing = cart.find((item) => item.product_uuid === productUuid);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ product_uuid: productUuid, quantity });
    }

    writeLocalList("guest_cart", cart);
    window.dispatchEvent(new Event("commerce-cart-updated"));
    return cart;
};

export const getCart = async () => {
    if (localStorage.getItem("access_token")) {
        const data = await apiRequest("/cart/");
        return Array.isArray(data) ? data[0] || null : data;
    }

    return readLocalList("guest_cart");
};

export const getFavourites = async () => {
    if (localStorage.getItem("access_token")) {
        return apiRequest("/favourites/");
    }

    return readLocalList("guest_favourites");
};

export const toggleFavourite = async (productUuid) => {
    if (localStorage.getItem("access_token")) {
        const favourites = await getFavourites();
        const existing = favourites.find(
            (favourite) => favourite.product?.uuid === productUuid
        );

        if (existing) {
            await apiRequest(`favourites/${existing.uuid}/`, {
                method: "DELETE",
            });
            window.dispatchEvent(new Event("commerce-favourites-updated"));
            return { active: false };
        }

        await apiRequest("/favourites/", {
            method: "POST",
            body: JSON.stringify({ product_uuid: productUuid }),
        });
        window.dispatchEvent(new Event("commerce-favourites-updated"));
        return { active: true };
    }

    const favourites = readLocalList("guest_favourites");
    const index = favourites.indexOf(productUuid);

    if (index >= 0) {
        favourites.splice(index, 1);
        writeLocalList("guest_favourites", favourites);
        window.dispatchEvent(new Event("commerce-favourites-updated"));
        return { active: false };
    }

    favourites.push(productUuid);
    writeLocalList("guest_favourites", favourites);
    window.dispatchEvent(new Event("commerce-favourites-updated"));
    return { active: true };
};


export const registerUser = (userData) => {
    return apiRequest("/users/", {
        method: "POST",
        body: JSON.stringify(userData),
    });
};

export const updateCartItem = async (itemUuid, quantity) => {
    if (localStorage.getItem("access_token")) {
        const data = await apiRequest(`/cart-items/${itemUuid}/`, {
            method: "PATCH",
            body: JSON.stringify({ quantity }),
        });
        window.dispatchEvent(new Event("commerce-cart-updated"));
        return data;
    }

    const cart = readLocalList("guest_cart");
    const item = cart.find((entry) => entry.product_uuid === itemUuid);
    if (item) item.quantity = quantity;
    writeLocalList("guest_cart", cart);
    window.dispatchEvent(new Event("commerce-cart-updated"));
    return cart;
};

export const removeCartItem = async (itemUuid, productUuid = itemUuid) => {
    if (localStorage.getItem("access_token")) {
        const data = await apiRequest(`/cart-items/${itemUuid}/`, { method: "DELETE" });
        window.dispatchEvent(new Event("commerce-cart-updated"));
        return data;
    }

    const cart = readLocalList("guest_cart").filter(
        (item) => item.product_uuid !== productUuid
    );
    writeLocalList("guest_cart", cart);
    window.dispatchEvent(new Event("commerce-cart-updated"));
    return cart;
};