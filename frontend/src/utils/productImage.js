const API_ORIGIN = import.meta.env.VITE_API_URL
    ? new URL(import.meta.env.VITE_API_URL).origin
    : "http://127.0.0.1:8000";

function resolveImageUrl(imageValue) {
    if (!imageValue) return null;

    if (typeof imageValue === "string" && /^https?:\/\//i.test(imageValue)) {
        return imageValue;
    }

    const normalizedPath =
        typeof imageValue === "string"
            ? imageValue.startsWith("/")
                ? imageValue
                : `/${imageValue}`
            : "";

    if (!normalizedPath) return null;

    return normalizedPath.startsWith("/media/")
        ? `${API_ORIGIN}${normalizedPath}`
        : `${API_ORIGIN}/media${normalizedPath}`;
}

export function resolveProductImage(product) {
    if (!product) return null;

    const images = Array.isArray(product.images) ? product.images : [];
    const primaryImage =
        images.find((image) => image?.is_primary) ?? images[0] ?? null;

    const imageValue =
        primaryImage?.image ||
        product.image?.url ||
        product.image ||
        null;

    return resolveImageUrl(imageValue);
}

export function resolveProductImages(product) {
    if (!product) return [];

    const images = Array.isArray(product.images) ? product.images : [];
    const primaryImage =
        images.find((image) => image?.is_primary) ?? images[0] ?? null;
    const orderedImages = primaryImage
        ? [primaryImage, ...images.filter((image) => image !== primaryImage)]
        : [];
    const resolvedImages = orderedImages
        .map((image) => resolveImageUrl(image?.image))
        .filter(Boolean);

    if (resolvedImages.length) {
        return [...new Set(resolvedImages)];
    }

    const fallbackImage = resolveProductImage(product);
    return fallbackImage ? [fallbackImage] : [];
}
