import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";

import { getCheckoutStatus } from "../api";
import { useSitePreferences } from "../context/SitePreferencesContext";
import "./Checkout.css";

const CHECKOUT_KEY = "clare-checkout-idempotency-key";

export default function CheckoutResult() {
    const [searchParams] = useSearchParams();
    const { t } = useSitePreferences();
    const [status, setStatus] = useState("checking");
    const [orderUuid, setOrderUuid] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const sessionId = searchParams.get("session_id");
        let cancelled = false;
        let timer;
        let attempts = 0;

        if (!sessionId) {
            setStatus("error");
            setError(t("Checkout session is missing."));
            return undefined;
        }

        async function verifyPayment() {
            try {
                const result = await getCheckoutStatus(sessionId);
                if (cancelled) return;
                setOrderUuid(result.order_uuid || "");
                if (result.status === "CONFIRMED") {
                    sessionStorage.removeItem(CHECKOUT_KEY);
                    setStatus("confirmed");
                } else if (result.status === "CANCELLED") {
                    sessionStorage.removeItem(CHECKOUT_KEY);
                    setStatus("cancelled");
                } else if (attempts < 8) {
                    attempts += 1;
                    timer = window.setTimeout(verifyPayment, 2000);
                    setStatus("pending");
                } else {
                    setStatus("pending");
                }
            } catch (verifyError) {
                if (!cancelled) {
                    setError(
                        verifyError?.message ||
                            t("Unable to verify payment status.")
                    );
                    setStatus("error");
                }
            }
        }

        verifyPayment();
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [searchParams, t]);

    const confirmed = status === "confirmed";
    const cancelled = status === "cancelled";
    const pending = status === "pending" || status === "checking";

    return (
        <section className="checkout-page checkout-result">
            <div
                className={`checkout-panel checkout-result-panel ${confirmed ? "is-success" : ""} ${cancelled ? "is-cancelled" : ""}`}
                role={status === "error" ? "alert" : "status"}
                aria-live="polite"
            >
                {confirmed ? <FiCheckCircle aria-hidden="true" /> : cancelled ? (
                    <FiXCircle aria-hidden="true" />
                ) : <FiClock aria-hidden="true" />}
                <h1>
                    {confirmed
                        ? t("Payment confirmed")
                        : cancelled
                            ? t("Checkout cancelled")
                            : pending
                                ? t("Verifying payment")
                                : t("Payment status unavailable")}
                </h1>
                <p>
                    {confirmed
                        ? t("Your order has been confirmed.")
                        : cancelled
                            ? t("No payment was confirmed. You can return to your cart.")
                            : pending
                                ? t("Stripe is processing your payment. This page will update when it is verified.")
                                : error}
                </p>
                {confirmed && orderUuid && (
                    <p className="checkout-order-reference">
                        {t("Order reference")}: {orderUuid}
                    </p>
                )}
                <div className="checkout-result-actions">
                    {confirmed && <Link to="/orders/">{t("View orders")}</Link>}
                    {!confirmed && <Link to="/cart/">{t("Return to cart")}</Link>}
                    <Link className="checkout-secondary-link" to="/products/">
                        {t("Continue shopping")}
                    </Link>
                </div>
            </div>
        </section>
    );
}
