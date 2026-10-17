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

export default function ProductCard({ product, onAddToCart }) {
    const navigate = useNavigate();

    const [quantity, setQuantity] = useState("1");
    const [cartStatus, setCartStatus] = useState("idle"); // idle | adding | added
    const [addedQty, setAddedQty] = useState(1);
    const [flyKey, setFlyKey] = useState(0);
    const [favorite, setFavorite] = useState(false);

    const timers = useRef([]);

    useEffect(() => {
        return () => timers.current.forEach(clearTimeout);
    }, []);

    if (!product) return null;

    const image = resolveProductImage(product);

    const stock = Number(product.stock) || 0;
    const inStock = stock > 0;
    const maxQty = Math.max(stock, 1);

    const currentPrice = product.discount_price || product.price;

    const hasDiscount =
        product.discount_price &&
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
                    className={`favorite-btn ${favorite ? "is-active" : ""}`}
                    aria-label={
                        favorite ? "Remove from favourites" : "Add to favourites"
                    }
                    aria-pressed={favorite}
                    onClick={(e) => {
                        stop(e);
                        setFavorite((f) => !f);
                    }}
                >
                    <Heart
                        size={18}
                        fill={favorite ? "currentColor" : "none"}
                    />
                </button>

                <div className="view-product">
                    <Eye size={14} />
                    View Product
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
                    {product.category?.name || "Uncategorized"}
                </span>

                <h3 className="product-title">{product.name}</h3>

                <div className="product-rating">
                    <div className="stars">
                        <Star size={14} fill="currentColor" />
                        <span>4.8</span>
                    </div>

                    <span className="reviews">(24 reviews)</span>
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
                                aria-label="Decrease quantity"
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
                                aria-label="Quantity"
                            />

                            <button
                                type="button"
                                onClick={increaseQty}
                                disabled={
                                    !inStock || (Number(quantity) || 0) >= maxQty
                                }
                                aria-label="Increase quantity"
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
                            {inStock ? "Add to cart" : "Out of stock"}
                        </span>

                        <span className="cart-state cart-state-adding">
                            <ShoppingCart size={16} className="cart-driving" />
                            Adding
                        </span>

                        <span className="cart-state cart-state-added">
                            <Check size={16} className="cart-check" />
                            Added to cart
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
            </div>
        </article>
    );
}