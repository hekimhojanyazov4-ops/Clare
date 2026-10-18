
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import "./ProductDetail.css";

import {
    FiArrowLeft,
    FiChevronLeft,
    FiChevronRight,
    FiShoppingCart,
    FiHeart,
    FiPlus,
    FiMinus,
} from "react-icons/fi";

import Loading from "../components/Loading";
import {
    addToCart,
    getFavourites,
    getProduct,
    getProducts,
    toggleFavourite,
} from "../api";
import {
    resolveProductImage,
    resolveProductImages,
} from "../utils/productImage";
import {
    getRecentlyViewedProducts,
    getRelatedProducts,
} from "../utils/productRecommendations";
import { recordRecentlyViewedProduct } from "../utils/recentlyViewed";
import { useNotifications } from "../context/NotificationContext";
import { useSitePreferences } from "../context/SitePreferencesContext";
import ProductReviews from "../components/ProductReviews";

const RECOMMENDATION_LIMIT = 4;

const ProductDetail = () => {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const navigationDirection =
        location.state?.productNavigationDirection ?? 0;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const [error, setError] = useState("");
    const [catalogProducts, setCatalogProducts] = useState([]);
    const [catalogError, setCatalogError] = useState("");
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);
    const [historyError, setHistoryError] = useState("");
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Default quantity is 1, but the input remains editable.
    const [quantity, setQuantity] = useState("1");
    const [quantityError, setQuantityError] = useState("");

    const [isFavourite, setIsFavourite] = useState(false);
    const [favoriteAnimationKey, setFavoriteAnimationKey] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);
    const { error: showError, success: showSuccess } = useNotifications();
    const { t } = useSitePreferences();
    const productImageStageRef = useRef(null);
    const previousFavorite = useRef(isFavourite);

    useEffect(() => {
        if (previousFavorite.current !== isFavourite) {
            previousFavorite.current = isFavourite;
            setFavoriteAnimationKey((key) => key + 1);
        }
    }, [isFavourite]);

    const productImage = resolveProductImage(product);
    const galleryImages = resolveProductImages(product);
    const activeGalleryIndex = galleryImages.length
        ? activeImageIndex % galleryImages.length
        : 0;
    const currentPrice = product?.discount_price ?? product?.price;
    const relatedProducts = useMemo(
        () => getRelatedProducts(catalogProducts, product, RECOMMENDATION_LIMIT),
        [catalogProducts, product]
    );
    const recentlyViewedProducts = useMemo(
        () =>
            getRecentlyViewedProducts(
                catalogProducts,
                recentlyViewedIds,
                product?.uuid,
                RECOMMENDATION_LIMIT
            ),
        [catalogProducts, product?.uuid, recentlyViewedIds]
    );

    const hasDiscount =
        product?.discount_price != null &&
        product?.discount_price !== "" &&
        Number(product.discount_price) < Number(product.price);

    const stock = Number(product?.stock);

    const validStock =
        product?.stock !== null &&
        product?.stock !== undefined &&
        product?.stock !== "" &&
        Number.isSafeInteger(stock) &&
        stock >= 0;

    const hasStock = validStock && stock > 0;
    const currentProductIndex = catalogProducts.findIndex(
        (item) => item?.uuid === product?.uuid
    );
    const previousProduct = catalogProducts[currentProductIndex - 1];
    const nextProduct = catalogProducts[currentProductIndex + 1];

    function navigateToProduct(targetProduct, direction) {
        if (!targetProduct?.uuid || catalogLoading || isNavigating) return;

        setIsNavigating(true);
        navigate(`/products/${targetProduct.uuid}/`, {
            state: { productNavigationDirection: direction },
        });
    }

    function handleProductImagePointerMove(event) {
        if (event.pointerType !== "mouse" || !productImageStageRef.current) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;

        const horizontalPosition =
            (event.clientX - bounds.left) / bounds.width - 0.5;
        const verticalPosition =
            (event.clientY - bounds.top) / bounds.height - 0.5;

        productImageStageRef.current.style.setProperty(
            "--product-tilt-x",
            `${horizontalPosition * 12}deg`
        );
        productImageStageRef.current.style.setProperty(
            "--product-tilt-y",
            `${verticalPosition * -12}deg`
        );
    }

    function resetProductImageTilt() {
        productImageStageRef.current?.style.setProperty("--product-tilt-x", "0deg");
        productImageStageRef.current?.style.setProperty("--product-tilt-y", "0deg");
    }

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            setLoading(true);
            setIsNavigating(false);
            setError("");
            setProduct(null);
            setQuantity("1");
            setQuantityError("");
            setActiveImageIndex(0);

            try {
                const data = await getProduct(uuid);

                if (!cancelled) {
                    setProduct(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err?.message || "Unable to load this product."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [uuid]);

    useEffect(() => {
        let cancelled = false;

        async function loadCatalog() {
            setCatalogLoading(true);
            setCatalogError("");

            try {
                const data = await getProducts();
                if (!Array.isArray(data)) {
                    throw new Error("Product recommendations are unavailable.");
                }

                if (!cancelled) {
                    setCatalogProducts(data);
                }
            } catch (catalogLoadError) {
                if (!cancelled) {
                    setCatalogError(
                        catalogLoadError?.message ||
                            "Unable to load product recommendations."
                    );
                }
            } finally {
                if (!cancelled) {
                    setCatalogLoading(false);
                }
            }
        }

        loadCatalog();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!product?.uuid) return;

        setHistoryError("");

        try {
            setRecentlyViewedIds(recordRecentlyViewedProduct(product.uuid));
        } catch (storageError) {
            setRecentlyViewedIds([]);
            setHistoryError(
                storageError?.message ||
                    "Recently viewed items could not be saved."
            );
        }
    }, [product?.uuid]);

    useEffect(() => {
        let cancelled = false;

        getFavourites()
            .then((data) => {
                if (cancelled) return;

                const favourites = Array.isArray(data) ? data : [];

                setIsFavourite(
                    favourites.some(
                        (favourite) =>
                            (favourite?.product?.uuid ||
                                favourite?.uuid ||
                                favourite) === uuid
                    )
                );
            })
            .catch(() => {
                if (!cancelled) {
                    setIsFavourite(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [uuid]);

    // Let users temporarily clear the input and type manually.
    function handleQuantityChange(event) {
        const value = event.target.value;

        // Accept digits only, while preserving an empty input.
        if (!/^\d*$/.test(value)) {
            return;
        }

        setQuantity(value);
        setQuantityError("");
    }

    // Validate quantity only when a cart action is requested.
    function validateQuantity() {
        if (quantity.trim() === "") {
            setQuantityError("Please enter a quantity.");
            return null;
        }

        const parsedQuantity = Number(quantity);

        if (
            !Number.isSafeInteger(parsedQuantity) ||
            parsedQuantity < 1
        ) {
            setQuantityError(
                "Enter a whole number greater than zero."
            );
            return null;
        }

        if (!validStock) {
            setQuantityError("Stock information is unavailable.");
            return null;
        }

        if (parsedQuantity > stock) {
            setQuantityError(
                `Only ${stock} item${stock === 1 ? "" : "s"} available.`
            );
            return null;
        }

        return parsedQuantity;
    }

    // Increase quantity by one without exceeding available stock.
    function increaseQuantity() {
        if (!hasStock || actionLoading) return;

        const current = /^\d+$/.test(quantity)
            ? Number(quantity)
            : 0;

        if (current >= stock) {
            setQuantityError(`Maximum available quantity is ${stock}.`);
            return;
        }

        setQuantity(String(current + 1));
        setQuantityError("");
    }

    // Decrease quantity by one, with a minimum of 1.
    function decreaseQuantity() {
        if (!hasStock || actionLoading) return;

        const current = /^\d+$/.test(quantity)
            ? Number(quantity)
            : 1;

        setQuantity(String(Math.max(1, current - 1)));
        setQuantityError("");
    }

    async function handleAddToCart() {
        if (actionLoading) return;

        const validatedQuantity = validateQuantity();

        if (validatedQuantity === null) return;

        if (!product?.uuid) {
            showError("Product information is unavailable.");
            return;
        }

        try {
            setActionLoading(true);

            await addToCart(product.uuid, validatedQuantity);

            showSuccess(
                `${product.name} was added to your cart (${validatedQuantity}).`
            );
        } catch (actionError) {
            showError(
                actionError?.message || "Unable to add to cart."
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleToggleFavourite() {
        if (actionLoading || !product?.uuid) return;

        try {
            setActionLoading(true);

            const result = await toggleFavourite(product.uuid);

            setIsFavourite(result.active);

            showSuccess(
                result.active
                    ? `${product.name} saved to favourites.`
                    : `${product.name} removed from favourites.`
            );
        } catch (actionError) {
            showError(
                actionError?.message || "Unable to update favourites."
            );
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return <Loading />;
    }

    if (error || !product) {
        return (
            <div className="error-message">
                <h2>{t("Product not found")}</h2>
                <p>{error || t("This product could not be found.")}</p>

                <Link to="/products/" className="detail-back-link">
                    <FiArrowLeft />
                    {t("Back to Products")}
                </Link>
            </div>
        );
    }

    return (
        <section className="product-detail-page">
            <Link to="/products/" className="detail-back-link">
                <FiArrowLeft />
                {t("Back to Products")}
            </Link>

            <div className="product-navigation-frame">
                <button
                    type="button"
                    className="product-navigation-button previous"
                    aria-label={t("Previous product")}
                    title={t("Previous product")}
                    disabled={catalogLoading || isNavigating || !previousProduct}
                    onClick={() => navigateToProduct(previousProduct, -1)}
                >
                    <FiChevronLeft aria-hidden="true" />
                </button>

                <div
                    key={product.uuid}
                    className="product-detail-layout"
                    data-navigation-direction={navigationDirection}
                >
                <div
                    className={`product-detail-gallery${
                        galleryImages.length > 1 ? " has-thumbnails" : ""
                    }`}
                >
                    {galleryImages.length > 1 && (
                        <div
                            className="product-gallery-thumbnails"
                            role="group"
                            aria-label={t("Product images")}
                        >
                            {galleryImages.map((image, index) => (
                                <button
                                    key={image}
                                    type="button"
                                    className={`product-gallery-thumbnail${
                                        index === activeGalleryIndex ? " active" : ""
                                    }`}
                                    aria-label={`Show product image ${index + 1}`}
                                    aria-pressed={index === activeGalleryIndex}
                                    onClick={() => setActiveImageIndex(index)}
                                >
                                    <img src={image} alt="" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div
                        className="product-detail-image"
                        ref={productImageStageRef}
                        onPointerMove={handleProductImagePointerMove}
                        onPointerLeave={resetProductImageTilt}
                    >
                        {galleryImages.length ? (
                            <img
                                key={`${product.uuid}-${activeGalleryIndex}`}
                                className="product-detail-main-image"
                                src={galleryImages[activeGalleryIndex]}
                                alt={`${product.name} image ${activeGalleryIndex + 1}`}
                            />
                        ) : productImage ? (
                            <img
                                className="product-detail-main-image"
                                src={productImage}
                                alt={product.name}
                            />
                        ) : (
                            <div className="product-detail-image-placeholder">
                                <FiShoppingCart size={60} />
                            </div>
                        )}

                        {galleryImages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="product-gallery-arrow previous"
                                    aria-label={t("Show previous product image")}
                                    onClick={() =>
                                        setActiveImageIndex(
                                            (activeGalleryIndex - 1 + galleryImages.length) %
                                                galleryImages.length
                                        )
                                    }
                                >
                                    <FiChevronLeft />
                                </button>
                                <button
                                    type="button"
                                    className="product-gallery-arrow next"
                                    aria-label={t("Show next product image")}
                                    onClick={() =>
                                        setActiveImageIndex(
                                            (activeGalleryIndex + 1) %
                                                galleryImages.length
                                        )
                                    }
                                >
                                    <FiChevronRight />
                                </button>
                                <span className="product-gallery-count" aria-live="polite">
                                    {activeGalleryIndex + 1} / {galleryImages.length}
                                </span>
                            </>
                        )}
                        {hasDiscount && (
                            <span className="product-detail-discount">
                                {Math.round(
                                    (1 - Number(product.discount_price) / Number(product.price)) *
                                        100
                                )}
                                % OFF
                            </span>
                        )}
                    </div>
                </div>

                <div className="product-detail-info">
                    <div className="product-detail-meta">
                        <span>{product.category?.name || t("PRODUCT DETAILS")}</span>
                        <span>{t("PRODUCT CODE")}: {String(product.uuid).slice(0, 8).toUpperCase()}</span>
                    </div>
                    <h1>{product.name}</h1>

                    <div className="product-detail-price">
                        <h2>${Number(currentPrice).toFixed(2)}</h2>

                        {hasDiscount && (
                            <del className="detail-old-price">
                                ${Number(product.price).toFixed(2)}
                            </del>
                        )}
                        {hasDiscount && (
                            <span className="product-detail-savings">
                                {t("SAVE")}{" "}
                                {Math.round(
                                    (1 - Number(product.discount_price) / Number(product.price)) *
                                        100
                                )}
                                %
                            </span>
                        )}
                    </div>

                    <p className="product-detail-description">
                        {product.description ||
                            t("No description available.")}
                    </p>

                    <div className="product-stock-status">
                        {hasStock ? (
                            <span className="stock-available">
                                {t("In stock")}: {stock} {t(stock === 1 ? "item" : "items")}
                            </span>
                        ) : (
                            <span className="stock-unavailable">
                                {!validStock
                                    ? t("Stock information unavailable")
                                    : t("Out of stock")}
                            </span>
                        )}
                    </div>

                    <div className="detail-actions">
                        <div className="detail-quantity">
                            <label htmlFor="product-quantity">
                                {t("Quantity")}
                            </label>

                            <div className="quantity-control">
                                <button
                                    type="button"
                                    className="quantity-btn"
                                    aria-label={t("Decrease quantity")}
                                    onClick={decreaseQuantity}
                                    disabled={
                                        !hasStock ||
                                        actionLoading ||
                                        (quantity !== "" &&
                                            /^\d+$/.test(quantity) &&
                                            Number(quantity) <= 1)
                                    }
                                >
                                    <FiMinus />
                                </button>

                                <input
                                    id="product-quantity"
                                    name="quantity"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="off"
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            handleAddToCart();
                                        }
                                    }}
                                    aria-invalid={Boolean(quantityError)}
                                    aria-describedby={
                                        quantityError
                                            ? "quantity-error"
                                            : "quantity-help"
                                    }
                                    disabled={!hasStock || actionLoading}
                                />

                                <button
                                    type="button"
                                    className="quantity-btn"
                                    aria-label={t("Increase quantity")}
                                    onClick={increaseQuantity}
                                    disabled={
                                        !hasStock ||
                                        actionLoading ||
                                        (quantity !== "" &&
                                            /^\d+$/.test(quantity) &&
                                            Number(quantity) >= stock)
                                    }
                                >
                                    <FiPlus />
                                </button>
                            </div>

                            <span
                                id="quantity-help"
                                className="quantity-help"
                            >
                                {t("Min. 1 · Max.")} {validStock ? stock : 0}
                            </span>

                            {quantityError && (
                                <p
                                    id="quantity-error"
                                    className="quantity-error"
                                    role="alert"
                                >
                                    {quantityError}
                                </p>
                            )}
                        </div>

                        <button
                            className="cart-btn"
                            type="button"
                            onClick={handleAddToCart}
                            disabled={!hasStock || actionLoading}
                        >
                            <FiShoppingCart />
                            {actionLoading
                                ? t("Working...")
                                : t("Add to Cart")}
                        </button>

                        <button
                            className={`detail-favorite-btn ${
                                isFavourite ? "active" : ""
                            }${favoriteAnimationKey ? " has-favorite-animation" : ""}`}
                            type="button"
                            aria-label={
                                isFavourite
                                    ? t("Remove from favourites")
                                    : t("Add to favourites")
                            }
                            aria-pressed={isFavourite}
                            onClick={handleToggleFavourite}
                            disabled={actionLoading}
                        >
                            <FiHeart
                                key={favoriteAnimationKey}
                                fill={isFavourite ? "currentColor" : "none"}
                            />
                        </button>
                    </div>
                </div>
            </div>

                <button
                    type="button"
                    className="product-navigation-button next"
                    aria-label={t("Next product")}
                    title={t("Next product")}
                    disabled={catalogLoading || isNavigating || !nextProduct}
                    onClick={() => navigateToProduct(nextProduct, 1)}
                >
                    <FiChevronRight aria-hidden="true" />
                </button>
            </div>

            <ProductShelf
                id="all-products"
                className="product-suggestions-mini"
                eyebrow={t("BROWSE THE COLLECTION")}
                title={t("All products")}
                products={catalogProducts}
                loading={catalogLoading}
                error={catalogError}
                loadingMessage={t("Loading all products...")}
                emptyMessage={t("No products are available right now.")}
            />

            <ProductShelf
                id="related-products"
                eyebrow={t("MORE TO EXPLORE")}
                title={t("Related products")}
                products={relatedProducts}
                loading={catalogLoading}
                error={catalogError}
                emptyMessage={t("No related products are available right now.")}
            />

            <ProductShelf
                id="recently-viewed"
                eyebrow={t("YOUR BROWSING HISTORY")}
                title={t("Recently viewed")}
                products={recentlyViewedProducts}
                loading={catalogLoading}
                error={historyError}
                loadingMessage={t("Loading recently viewed products...")}
                emptyMessage={t("Products you view will appear here.")}
            />

            <ProductReviews productUuid={product.uuid} />
        </section>
    );
};

function ProductShelf({
    id,
    className = "",
    eyebrow,
    title,
    products,
    loading,
    error,
    loadingMessage = "Loading recommendations...",
    emptyMessage,
}) {
    const trackRef = useRef(null);

    function scrollTrack(direction) {
        const track = trackRef.current;
        if (!track) return;

        track.scrollBy({
            left: direction * Math.max(track.clientWidth * 0.8, 220),
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
        });
    }

    return (
        <section
            id={id}
            className={`product-suggestions ${className}`.trim()}
            aria-labelledby={`${id}-heading`}
        >
            <div className="product-suggestions-heading">
                <div>
                    <span>{eyebrow}</span>
                    <h2 id={`${id}-heading`}>{title}</h2>
                </div>
                {products.length > 1 && (
                    <div className="product-suggestions-controls">
                        <button
                            type="button"
                            aria-label={`Scroll ${title.toLowerCase()} left`}
                            onClick={() => scrollTrack(-1)}
                        >
                            <FiChevronLeft />
                        </button>
                        <button
                            type="button"
                            aria-label={`Scroll ${title.toLowerCase()} right`}
                            onClick={() => scrollTrack(1)}
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                )}
            </div>
            {error ? (
                <p className="product-suggestions-message" role="status">{error}</p>
            ) : loading ? (
                <p className="product-suggestions-message">{loadingMessage}</p>
            ) : products.length ? (
                <div
                    className="product-suggestions-track"
                    ref={trackRef}
                    role="group"
                    tabIndex={0}
                    aria-label={title}
                >
                    {products.map((item) => (
                        <RecommendationCard key={item.uuid} product={item} />
                    ))}
                </div>
            ) : (
                <p className="product-suggestions-message">{emptyMessage}</p>
            )}
        </section>
    );
}

function RecommendationCard({ product }) {
    const image = resolveProductImage(product);
    const price = product.discount_price || product.price;

    return (
        <Link
            to={`/products/${product.uuid}/`}
            className="product-recommendation-card"
        >
            <div className="product-recommendation-image">
                {image ? (
                    <img src={image} alt={product.name} loading="lazy" />
                ) : (
                    <FiShoppingCart size={32} aria-hidden="true" />
                )}
            </div>
            <div className="product-recommendation-info">
                <span>{product.category?.name || "Shop the collection"}</span>
                <h3>{product.name}</h3>
                <strong>${Number(price).toFixed(2)}</strong>
            </div>
        </Link>
    );
}

export default ProductDetail;
