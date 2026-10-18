import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiMinus, FiPlus, FiShoppingCart, FiTrash2 } from "react-icons/fi";

import { getProducts } from "../api";
import { getCart, removeCartItem, updateCartItem } from "../api";
import { resolveProductImage } from "../utils/productImage";
import { useNotifications } from "../context/NotificationContext";
import { useSitePreferences } from "../context/SitePreferencesContext";
import "./ShopLists.css";

export default function Cart() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Holds what the user is currently typing, keyed by product_uuid
    const [drafts, setDrafts] = useState({});
    const { error: showError, success: showSuccess } = useNotifications();
    const { t } = useSitePreferences();

    useEffect(() => {
        async function loadCart() {
            try {
                const [cart, products] = await Promise.all([getCart(), getProducts()]);
                const productList = Array.isArray(products) ? products : [];
                const rawItems = cart?.cart_items || cart || [];
                setItems(rawItems.map((item) => {
                    const productUuid = item.product?.uuid || item.product_uuid;
                    return {
                        ...item,
                        product: item.product || productList.find((product) => product.uuid === productUuid),
                        product_uuid: productUuid,
                        quantity: Number(item.quantity || 1),
                    };
                }).filter((item) => item.product));
            } catch (loadError) {
                setError(loadError.message || "Unable to load your cart.");
            } finally {
                setLoading(false);
            }
        }

        loadCart();
    }, []);

    function clearDraft(productUuid) {
        setDrafts((current) => {
            const next = { ...current };
            delete next[productUuid];
            return next;
        });
    }

    async function changeQuantity(item, quantity) {
        const stock = Number(item.product.stock);
        const stockKnown =
            item.product.stock !== null &&
            item.product.stock !== undefined &&
            item.product.stock !== "" &&
            Number.isSafeInteger(stock) &&
            stock >= 0;
        const maxStock = stockKnown ? Math.max(stock, 1) : item.quantity;
        const nextQuantity = Math.max(1, Math.min(maxStock, Math.floor(Number(quantity)) || 1));

        clearDraft(item.product_uuid);

        if (nextQuantity === item.quantity) return;

        try {
            await updateCartItem(item.uuid || item.product_uuid, nextQuantity);
            setItems((current) => current.map((entry) =>
                entry.product_uuid === item.product_uuid ? { ...entry, quantity: nextQuantity } : entry
            ));
            showSuccess(`${item.product.name} quantity updated.`);
        } catch (updateError) {
            showError(updateError.message || "Unable to update quantity.");
        }
    }

    function handleInputChange(item, value) {
        // Allow only digits (and empty string while typing)
        if (value !== "" && !/^\d+$/.test(value)) return;
        setDrafts((current) => ({ ...current, [item.product_uuid]: value }));
    }

    function commitDraft(item) {
        const draft = drafts[item.product_uuid];
        if (draft === undefined) return;

        if (draft === "") {
            clearDraft(item.product_uuid);
            return;
        }
        changeQuantity(item, Number(draft));
    }

    function handleInputKeyDown(event, item) {
        if (event.key === "Enter") {
            event.currentTarget.blur();
        } else if (event.key === "Escape") {
            clearDraft(item.product_uuid);
            event.currentTarget.blur();
        }
    }

    async function removeItem(item) {
        try {
            await removeCartItem(item.uuid || item.product_uuid, item.product_uuid);
            setItems((current) => current.filter((entry) => entry.product_uuid !== item.product_uuid));
            showSuccess(`${item.product.name} removed from your cart.`);
        } catch (removeError) {
            showError(removeError.message || "Unable to remove item.");
        }
    }

    const totalCents = items.reduce(
        (sum, item) => {
            const unitPrice = Number(item.product.discount_price ?? item.product.price);
            return sum + Math.round(unitPrice * 100) * item.quantity;
        },
        0
    );
    const total = totalCents / 100;

    if (loading) return <section className="shop-list-page"><p>{t("Loading your cart...")}</p></section>;
    if (error) return <section className="shop-list-page"><div className="shop-list-error">{error}</div></section>;

    return (
        <section className="shop-list-page">
            <div className="shop-list-heading">
                <span className="shop-list-kicker">{t("YOUR SHOPPING BAG")}</span>
                <h1>{t("Shopping Cart")}</h1>
                <p>{t("Review your products before checkout.")}</p>
            </div>

            {!items.length ? (
                <div className="shop-list-empty">
                    <FiShoppingCart size={45} />
                    <h2>{t("Your cart is empty")}</h2>
                    <p>{t("Add products to your cart to see them here.")}</p>
                    <Link to="/products/" className="shop-list-button">{t("Browse products")} <FiArrowRight /></Link>
                </div>
            ) : (
                <div className="shop-list-layout">
                    <div className="shop-list-items">
                        {items.map((item) => {
                            const stock = Number(item.product.stock);
                            const stockKnown =
                                item.product.stock !== null &&
                                item.product.stock !== undefined &&
                                item.product.stock !== "" &&
                                Number.isSafeInteger(stock) &&
                                stock >= 0;
                            const maxStock = stockKnown
                                ? Math.max(stock, 1)
                                : item.quantity;
                            const draft = drafts[item.product_uuid];
                            const inputValue = draft !== undefined ? draft : item.quantity;

                            return (
                                <article className="shop-list-item" key={item.product_uuid}>
                                    <div className="shop-list-thumb">
                                        <img src={resolveProductImage(item.product)} alt={item.product.name} />
                                    </div>
                                    <div className="shop-list-item-info">
                                        <h2>{item.product.name}</h2>
                                        <span>${Number(item.product.discount_price ?? item.product.price).toFixed(2)}</span>
                                        <div className="quantity-control">
                                            <button
                                                type="button"
                                                onClick={() => changeQuantity(item, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                                aria-label={t("Decrease quantity")}
                                            >
                                                <FiMinus />
                                            </button>
                                            <input
                                                className="quantity-input"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={inputValue}
                                                onChange={(event) => handleInputChange(item, event.target.value)}
                                                onBlur={() => commitDraft(item)}
                                                onKeyDown={(event) => handleInputKeyDown(event, item)}
                                                onFocus={(event) => event.target.select()}
                                                aria-label={`${t("Quantity")} for ${item.product.name}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => changeQuantity(item, item.quantity + 1)}
                                                disabled={item.quantity >= maxStock}
                                                aria-label={t("Increase quantity")}
                                            >
                                                <FiPlus />
                                            </button>
                                        </div>
                                        {stockKnown && (
                                            <small className="quantity-hint">{t("Max available:")} {maxStock}</small>
                                        )}
                                        {!stockKnown && (
                                            <small className="quantity-hint">
                                                {t("Availability unavailable. Quantity cannot be increased.")}
                                            </small>
                                        )}
                                    </div>
                                    <button
                                        className="shop-list-remove"
                                        type="button"
                                        onClick={() => removeItem(item)}
                                        aria-label={`${t("Remove")} ${item.product.name}`}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                    <aside className="shop-list-summary">
                        <span>{t("Total")}</span>
                        <strong>${total.toFixed(2)}</strong>
                        <Link className="shop-list-checkout" to="/checkout/">
                            {t("Checkout")}
                        </Link>
                    </aside>
                </div>
            )}
        </section>
    );
}
