import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ShoppingCart,
    Heart,
    Star,
    Package,
    Eye,
    Minus,
    Plus,
    Check,
} from "lucide-react";

import "./ProductCard.css";
import { resolveProductImage } from "../utils/productImage";
import { useSitePreferences } from "../context/SitePreferencesContext";

export default function ProductCard({
    product,
    onAddToCart,
    isFavourite = false,
    onToggleFavourite,
    isBusy = false,
}) {
    const navigate = useNavigate();
    const { t } = useSitePreferences();

    const [quantity, setQuantity] = useState("1");
    const [cartStatus, setCartStatus] = useState("idle"); // idle | adding | added
    const [addedQty, setAddedQty] = useState(1);
    const [flyKey, setFlyKey] = useState(0);
    const [favoriteAnimationKey, setFavoriteAnimationKey] = useState(0);
    const previousFavorite = useRef(isFavourite);

    const timers = useRef([]);

    useEffect(() => {
        return () => timers.current.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        if (previousFavorite.current !== isFavourite) {
            previousFavorite.current = isFavourite;
            setFavoriteAnimationKey((key) => key + 1);
        }
    }, [isFavourite]);

    if (!product) return null;

    const image = resolveProductImage(product);
    const favorite = isFavourite;
    const reviewCount = Number(product.review_count) || 0;
    const rating = Number(product.rating_average);
    const hasRating = reviewCount > 0 && Number.isFinite(rating);

    const stock = Number(product.stock);
    const stockKnown =
        product.stock !== null &&
        product.stock !== undefined &&
        product.stock !== "" &&
        Number.isSafeInteger(stock) &&
        stock >= 0;
    const inStock = stockKnown && stock > 0;
    const maxQty = inStock ? stock : 1;

    const currentPrice = product.discount_price ?? product.price;

    const hasDiscount =
        product.discount_price !== null &&
        product.discount_price !== undefined &&
        Number(product.discount_price) < Number(product.price);

    const discountPercent = hasDiscount
        ? Math.round(
              (1 - Number(product.discount_price) / Number(product.price)) * 100
          )
        : 0;

    /* ---------- quantity ---------- */

    const clamp = (n) => Math.min(Math.max(n, 1), maxQty);

    const handleQuantityChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "");

        if (digits === "") {
            setQuantity("");
            return;
        }

        setQuantity(String(Math.min(Number(digits), maxQty)));
    };

    const handleQuantityBlur = () => {
        setQuantity(String(clamp(Number(quantity) || 1)));
    };

    const increaseQty = () =>
        setQuantity(String(clamp((Number(quantity) || 0) + 1)));

    const decreaseQty = () =>
        setQuantity(String(clamp((Number(quantity) || 2) - 1)));

    /* ---------- add to cart ---------- */

    const handleAddToCart = () => {
        if (!inStock || cartStatus !== "idle") return;

        const qty = clamp(Number(quantity) || 1);

        setQuantity(String(qty));
        setAddedQty(qty);
        setFlyKey((k) => k + 1);
        setCartStatus("adding");

        // Connect your real cart logic here (context / Redux / API)
        if (onAddToCart) {
            onAddToCart(product, qty);
        } else {
            window.dispatchEvent(
                new CustomEvent("cart:add", {
                    detail: { product, quantity: qty },
                })
            );
        }

        timers.current.push(
            setTimeout(() => setCartStatus("added"), 800),
            setTimeout(() => setCartStatus("idle"), 2400)
        );
    };

    const handleFavouriteClick = (event) => {
        stop(event);
        if (isBusy) return;
        onToggleFavourite?.(product);
    };

    const openProduct = () => navigate(`/products/${product.uuid}`);

    const stop = (e) => e.stopPropagation();

    return (
        <article
            className="product-card"
            role="link"
            tabIndex={0}
            onClick={openProduct}
            onKeyDown={(e) => {
                if (e.key === "Enter") openProduct();
            }}
        >
            {/* Image */}
            <div className="product-image-wrapper">
                {image ? (
                    <img
                        className="product-image"
                        src={image}
                        alt={product.name}
                        loading="lazy"
                    />
                ) : (
                    <div className="product-image-placeholder">
                        <Package size={54} />
                    </div>
                )}

                {hasDiscount && (
                    <span className="discount-badge">-{discountPercent}%</span>
                )}

                <button
                    type="button"
                    className={`favorite-btn${favorite ? " is-active" : ""}${favoriteAnimationKey ? " has-favorite-animation" : ""}`}
                    aria-label={
                        favorite ? t("Remove from favourites") : t("Add to favourites")
                    }
                    aria-pressed={favorite}
                    disabled={isBusy}
                    onClick={handleFavouriteClick}
                >
                    <Heart
                        key={favoriteAnimationKey}
                        size={18}
                        fill={favorite ? "currentColor" : "none"}
                    />
                </button>

                <div className="view-product">
                    <Eye size={14} />
                    {t("View Product")}
                </div>

                {/* Flying product on add */}
                {flyKey > 0 && (
                    <span className="fly-to-cart" key={flyKey} aria-hidden="true">
                        {image ? (
                            <img src={image} alt="" />
                        ) : (
                            <ShoppingCart size={22} />
                        )}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="product-info">
                <span className="product-category">
                    {product.category?.name || t("Uncategorized")}
                </span>

                <h3 className="product-title">{product.name}</h3>

                <div className="product-rating">
                    <div
                        className="stars"
                        aria-label={
                            hasRating
                                ? `${rating.toFixed(1)} out of 5`
                                : t("No ratings yet")
                        }
                    >
                        <Star size={14} fill="currentColor" />
                        <span>{hasRating ? rating.toFixed(1) : "—"}</span>
                    </div>

                    <span className="reviews">
                        ({reviewCount} {t(reviewCount === 1 ? "review" : "reviews")})
                    </span>
                </div>

                {/* Price + Quantity (same row) */}
                <div className="product-price-row">
                    <div className="product-price">
                        <span className="current-price">
                            ${Number(currentPrice).toFixed(2)}
                        </span>

                        {hasDiscount && (
                            <span className="old-price">
                                ${Number(product.price).toFixed(2)}
                            </span>
                        )}
                    </div>

                    {/* clicks here must not open the product */}
                    <div className="qty-wrap" onClick={stop} onKeyDown={stop}>
                        <div
                            className={`qty-selector ${
                                !inStock ? "is-disabled" : ""
                            }`}
                        >
                            <button
                                type="button"
                                onClick={decreaseQty}
                                disabled={!inStock || (Number(quantity) || 0) <= 1}
                                aria-label={t("Decrease quantity")}
                            >
                                <Minus size={13} />
                            </button>

                            <input
                                type="text"
                                inputMode="numeric"
                                value={quantity}
                                disabled={!inStock}
                                onChange={handleQuantityChange}
                                onBlur={handleQuantityBlur}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddToCart();
                                }}
                                aria-label={t("Quantity")}
                            />

                            <button
                                type="button"
                                onClick={increaseQty}
                                disabled={
                                    !inStock || (Number(quantity) || 0) >= maxQty
                                }
                                aria-label={t("Increase quantity")}
                            >
                                <Plus size={13} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add to cart (clicks here must not open the product) */}
                <div className="product-actions" onClick={stop} onKeyDown={stop}>
                    <button
                        type="button"
                        className="add-cart-btn"
                        data-status={cartStatus}
                        disabled={!inStock}
                        onClick={handleAddToCart}
                    >
                        <span className="cart-sweep" />

                        <span className="cart-state cart-state-idle">
                            <ShoppingCart size={16} />
                            {inStock
                                ? t("Add to cart")
                                : stockKnown
                                    ? t("Out of stock")
                                    : t("Availability unavailable")}
                        </span>

                        <span className="cart-state cart-state-adding">
                            <ShoppingCart size={16} className="cart-driving" />
                            {t("Adding")}
                        </span>

                        <span className="cart-state cart-state-added">
                            <Check size={16} className="cart-check" />
                            {t("Added to cart")}
                        </span>

                        <span
                            className="cart-badge"
                            key={cartStatus === "added" ? "on" : "off"}
                        >
                            +{addedQty}
                        </span>
                    </button>
                </div>

                {inStock && stock <= 5 && (
                    <span className="low-stock">Only {stock} left</span>
                )}
                {stockKnown && stock > 5 && (
                    <span className="stock-status is-available">
                        In stock - {stock} available
                    </span>
                )}
                {stockKnown && stock === 0 && (
                    <span className="stock-status is-unavailable">
                        {t("Out of stock")}
                    </span>
                )}
                {!stockKnown && (
                    <span className="stock-status is-unknown">
                        {t("Availability unavailable")}
                    </span>
                )}
            </div>
        </article>
    );
}