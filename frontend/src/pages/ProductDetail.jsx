
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./ProductDetail.css";

import {
    FiArrowLeft,
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
    toggleFavourite,
} from "../api";
import { resolveProductImage } from "../utils/productImage";
import { useNotifications } from "../context/NotificationContext";

const ProductDetail = () => {
    const { uuid } = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Default quantity is 1, but the input remains editable.
    const [quantity, setQuantity] = useState("1");
    const [quantityError, setQuantityError] = useState("");

    const [isFavourite, setIsFavourite] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const { error: showError, success: showSuccess } = useNotifications();

    const productImage = resolveProductImage(product);
    const currentPrice = product?.discount_price || product?.price;

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

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            setLoading(true);
            setError("");
            setProduct(null);
            setQuantity("1");
            setQuantityError("");

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
                <h2>Product not found</h2>
                <p>{error || "This product could not be found."}</p>

                <Link to="/products/" className="detail-back-link">
                    <FiArrowLeft />
                    Back to Products
                </Link>
            </div>
        );
    }

    return (
        <section className="product-detail-page">
            <Link to="/products/" className="detail-back-link">
                <FiArrowLeft />
                Back to Products
            </Link>

            <div className="product-detail-layout">
                <div className="product-detail-image">
                    {productImage ? (
                        <img src={productImage} alt={product.name} />
                    ) : (
                        <div className="product-detail-image-placeholder">
                            <FiShoppingCart size={60} />
                        </div>
                    )}
                </div>

                <div className="product-detail-info">
                    <h1>{product.name}</h1>

                    <h2>
                        ${Number(currentPrice).toFixed(2)}

                        {hasDiscount && (
                            <del className="detail-old-price">
                                ${Number(product.price).toFixed(2)}
                            </del>
                        )}
                    </h2>

                    <p className="product-detail-description">
                        {product.description ||
                            "No description available."}
                    </p>

                    <div className="product-stock-status">
                        {hasStock ? (
                            <span className="stock-available">
                                In stock: {stock} item
                                {stock === 1 ? "" : "s"}
                            </span>
                        ) : (
                            <span className="stock-unavailable">
                                {!validStock
                                    ? "Stock information unavailable"
                                    : "Out of stock"}
                            </span>
                        )}
                    </div>

                    <div className="detail-actions">
                        <div className="detail-quantity">
                            <label htmlFor="product-quantity">
                                Quantity
                            </label>

                            <div className="quantity-control">
                                <button
                                    type="button"
                                    className="quantity-btn"
                                    aria-label="Decrease quantity"
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
                                    aria-label="Increase quantity"
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
                                Min. 1 · Max. {validStock ? stock : 0}
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
                                ? "Working..."
                                : "Add to Cart"}
                        </button>

                        <button
                            className={`detail-favorite-btn ${
                                isFavourite ? "active" : ""
                            }`}
                            type="button"
                            aria-label={
                                isFavourite
                                    ? "Remove from favourites"
                                    : "Add to favourites"
                            }
                            aria-pressed={isFavourite}
                            onClick={handleToggleFavourite}
                            disabled={actionLoading}
                        >
                            <FiHeart
                                fill={isFavourite ? "currentColor" : "none"}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductDetail;
