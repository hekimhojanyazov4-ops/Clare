export function getRelatedProducts(products, currentProduct, limit = 4) {
    if (!currentProduct?.uuid || !Array.isArray(products)) return [];

    const categoryKey =
        currentProduct.category?.uuid ??
        currentProduct.category?.id ??
        currentProduct.category?.name;

    if (categoryKey == null) return [];

    const seen = new Set([currentProduct.uuid]);
    return products
        .filter((product) => {
            const productCategoryKey =
                product?.category?.uuid ??
                product?.category?.id ??
                product?.category?.name;

            if (
                !product?.uuid ||
                productCategoryKey !== categoryKey ||
                seen.has(product.uuid)
            ) {
                return false;
            }

            seen.add(product.uuid);
            return true;
        })
        .slice(0, limit);
}

export function getRecentlyViewedProducts(
    products,
    viewedIds,
    currentProductUuid,
    limit = 4
) {
    if (!Array.isArray(products) || !Array.isArray(viewedIds)) return [];

    const productsById = new Map(
        products.filter((product) => product?.uuid).map((product) => [product.uuid, product])
    );

    return [...new Set(viewedIds)]
        .filter((id) => id !== currentProductUuid)
        .map((id) => productsById.get(id))
        .filter(Boolean)
        .slice(0, limit);
}
