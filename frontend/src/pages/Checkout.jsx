import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiCreditCard, FiShield } from "react-icons/fi";

import { cancelCheckout, getCart, getProducts, startCheckout } from "../api";
import { useSitePreferences } from "../context/SitePreferencesContext";
import "./Checkout.css";

const CHECKOUT_KEY = "clare-checkout-idempotency-key";

function getIdempotencyKey() {
    const existing = sessionStorage.getItem(CHECKOUT_KEY);
    if (existing) return existing;

    const key = crypto.randomUUID();
    sessionStorage.setItem(CHECKOUT_KEY, key);
    return key;
}

export default function Checkout() {
    const [searchParams] = useSearchParams();
    const { t } = useSitePreferences();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const authenticated = Boolean(localStorage.getItem("access_token"));

    useEffect(() => {
        let cancelled = false;

        async function loadCart() {
            setLoading(true);
            setError("");
            try {
                const [cart, products] = await Promise.all([
                    getCart(),
                    getProducts(),
                ]);
                const productList = Array.isArray(products) ? products : [];
                const cartItems = cart?.cart_items || cart || [];
                if (!cancelled) {
                    setItems(cartItems.map((item) => {
                        const productUuid = item.product?.uuid || item.product_uuid;
                        return {
                            ...item,
                            product: item.product || productList.find(
                                (product) => product.uuid === productUuid
                            ),
                        };
                    }).filter((item) => item.product));
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(loadError?.message || t("Unable to load your cart."));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        const cancelledOrderUuid = searchParams.get("order_uuid");
        if (searchParams.get("cancelled") === "1" && cancelledOrderUuid && authenticated) {
            cancelCheckout(cancelledOrderUuid)
                .then((result) => {
                    sessionStorage.removeItem(CHECKOUT_KEY);
                    if (!cancelled) {
                        setNotice(
                            result.status === "CANCELLED"
                                ? t("Checkout was cancelled. Your cart is ready to try again.")
                                : t("Payment is still processing. Check your orders for updates.")
                        );
                    }
                    loadCart();
                })
                .catch((cancelError) => {
                    if (!cancelled) {
                        setError(
                            cancelError?.message ||
                                t("Unable to cancel this checkout session.")
                        );
                    }
                    loadCart();
                });
        } else {
            loadCart();
        }

        return () => {
            cancelled = true;
        };
    }, [authenticated, searchParams, t]);

    const subtotal = useMemo(() => items.reduce((sum, item) => {
        const price = Number(item.product.discount_price ?? item.product.price);
        if (!Number.isFinite(price) || price < 0) return sum;
        return sum + Math.round(price * 100) * Number(item.quantity || 0);
    }, 0), [items]);

    async function handleCheckout() {
        if (submitting) return;
        setSubmitting(true);
        setError("");
        try {
            const result = await startCheckout(getIdempotencyKey());
            if (result.checkout_url) {
                window.location.assign(result.checkout_url);
                return;
            }
            setNotice(
                result.status === "CONFIRMED"
                    ? t("Payment confirmed. Your order is ready.")
                    : t("Payment is still processing. Check your orders for updates.")
            );
            if (result.status === "CANCELLED") {
                sessionStorage.removeItem(CHECKOUT_KEY);
            }
        } catch (checkoutError) {
            sessionStorage.removeItem(CHECKOUT_KEY);
            setError(checkoutError?.message || t("Unable to start secure checkout."));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="checkout-page">
            <Link className="checkout-back-link" to="/cart/">
                <FiArrowLeft aria-hidden="true" />
                {t("Back to cart")}
            </Link>
            <header className="checkout-heading">
                <span>{t("SECURE CHECKOUT")}</span>
                <h1>{t("Checkout")}</h1>
                <p>{t("Review your order before continuing to Stripe.")}</p>
            </header>

            {error && <p className="checkout-message is-error" role="alert">{error}</p>}
            {notice && <p className="checkout-message is-notice" role="status">{notice}</p>}

            {loading ? (
                <div className="checkout-panel" role="status">{t("Loading checkout...")}</div>
            ) : items.length === 0 ? (
                <div className="checkout-panel checkout-empty">
                    <h2>{t("Your cart is empty")}</h2>
                    <p>{t("Add products to your cart to see them here.")}</p>
                    <Link to="/products/">{t("Browse products")}</Link>
                </div>
            ) : (
                <div className="checkout-layout">
                    <section className="checkout-panel checkout-items" aria-labelledby="checkout-items-title">
                        <h2 id="checkout-items-title">{t("Order summary")}</h2>
                        {items.map((item) => {
                            const price = Number(
                                item.product.discount_price ?? item.product.price
                            );
                            return (
                                <article className="checkout-item" key={item.uuid || item.product.uuid}>
                                    <div>
                                        <h3>{item.product.name}</h3>
                                        <span>{t("Quantity")}: {item.quantity}</span>
                                    </div>
                                    <strong>
                                        ${(price * Number(item.quantity || 0)).toFixed(2)}
                                    </strong>
                                </article>
                            );
                        })}
                    </section>

                    <aside className="checkout-panel checkout-total">
                        <div>
                            <span>{t("Subtotal")}</span>
                            <strong>${(subtotal / 100).toFixed(2)}</strong>
                        </div>
                        <p>{t("Final price and stock are verified securely before payment.")}</p>
                        {!authenticated ? (
                            <Link className="checkout-submit" to="/login/">
                                {t("Sign in to checkout")}
                            </Link>
                        ) : (
                            <button
                                className="checkout-submit"
                                type="button"
                                onClick={handleCheckout}
                                disabled={submitting || items.length === 0}
                            >
                                {submitting ? t("Opening secure checkout...") : (
                                    <>
                                        <FiCreditCard aria-hidden="true" />
                                        {t("Continue to secure payment")}
                                    </>
                                )}
                            </button>
                        )}
                        <small><FiShield aria-hidden="true" /> {t("Payment details are handled securely by Stripe.")}</small>
                    </aside>
                </div>
            )}
        </section>
    );
}
