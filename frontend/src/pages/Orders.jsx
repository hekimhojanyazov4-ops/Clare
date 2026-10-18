import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiPackage } from "react-icons/fi";
import { getOrders } from "../api";
import { useSitePreferences } from "../context/SitePreferencesContext";
import "./CustomerPages.css";

const Orders = () => {
    const { t } = useSitePreferences();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getOrders()
            .then((data) => {
                if (!cancelled) setOrders(Array.isArray(data) ? data : []);
            })
            .catch((loadError) => {
                if (!cancelled) {
                    setError(loadError?.message || t("Unable to load your orders."));
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [t]);

    return (
        <section className="customer-page">
            <header className="customer-page-heading">
                <span>{t("YOUR ACCOUNT")}</span>
                <h1>{t("Orders")}</h1>
                <p>{t("View and manage your orders.")}</p>
            </header>
            {loading ? (
                <div className="customer-empty-state" role="status">
                    <p>{t("Loading your orders...")}</p>
                </div>
            ) : error ? (
                <div className="customer-empty-state customer-orders-error" role="alert">
                    <FiPackage aria-hidden="true" />
                    <h2>{t("Unable to load orders")}</h2>
                    <p>{error}</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="customer-empty-state">
                    <FiPackage aria-hidden="true" />
                    <h2>{t("No orders yet")}</h2>
                    <p>{t("Your orders will appear here.")}</p>
                    <Link to="/products/">{t("Explore the collection")}</Link>
                </div>
            ) : (
                <div className="customer-order-list">
                    {orders.map((order) => (
                        <article className="customer-order-card" key={order.uuid}>
                            <header>
                                <div>
                                    <span>{t("Order")}</span>
                                    <strong>{order.uuid}</strong>
                                </div>
                                <span className={`customer-order-status is-${String(order.status || "pending").toLowerCase()}`}>
                                    {t(order.status || "Pending")}
                                </span>
                            </header>
                            <ul>
                                {(order.order_items || []).map((item) => (
                                    <li key={item.uuid}>
                                        <span>
                                            {item.product_name || item.product?.name}
                                            {" × "}
                                            {item.quantity}
                                        </span>
                                        <strong>
                                            ${(
                                                Number(item.unit_price ?? item.product?.current_price ?? item.product?.price) *
                                                Number(item.quantity)
                                            ).toFixed(2)}
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                            <footer>
                                <time dateTime={order.created_at}>
                                    {new Date(order.created_at).toLocaleString()}
                                </time>
                                <strong>${Number(order.total_price).toFixed(2)}</strong>
                            </footer>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
};

export default Orders;