import { useEffect, useState } from "react";
import {
    Users,
    Package,
    ShoppingBag,
    DollarSign,
    ShoppingCart,
    CreditCard,
} from "lucide-react";

import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import BestBuyersChart from "../components/BestBuyersChart";

import { getUsers } from "../api/users";
import { getProducts } from "../api/products";
import { getOrders } from "../api/orders";
import { getPayments } from "../api/payments";
import { getCarts } from "../api/carts";
import { useSitePreferences } from "../../context/SitePreferencesContext";

export default function AdminDashboard() {
    const { t } = useSitePreferences();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadDashboard() {

        try {
            setLoading(true);
            setError("");

            const [
                users,
                products,
                orders,
                payments,
                carts,
            ] = await Promise.all([
                getUsers(),
                getProducts(),
                getOrders(),
                getPayments(),
                getCarts(),
            ]);

            setData({
                users,
                products,
                orders,
                payments,
                carts,
            });

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDashboard();
    }, []);

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={loadDashboard}
            />
        );
    }

    const users =
        Array.isArray(data.users)
            ? data.users
            : data.users.results || [];

    const products =
        Array.isArray(data.products)
            ? data.products
            : data.products.results || [];

    const orders =
        Array.isArray(data.orders)
            ? data.orders
            : data.orders.results || [];

    const payments =
        Array.isArray(data.payments)
            ? data.payments
            : data.payments.results || [];

    const carts =
        Array.isArray(data.carts)
            ? data.carts
            : data.carts.results || [];

    const cartProductCount = carts.reduce(
        (total, cart) => {
            const items = cart.cart_items || cart.items || [];

            return (
                total +
                items.reduce(
                    (sum, item) =>
                        sum +
                        Number(item.quantity || 0),
                    0
                )
            );
        },
        0
    );

    const revenue = payments.reduce(
        (total, payment) => {
            const status =
                String(payment.status || "")
                    .toLowerCase();

            if (
                status !== "paid" &&
                status !== "confirmed" &&
                status !== "completed" &&
                status !== "success" &&
                status !== "successful"
            ) {
                return total;
            }

            return (
                total +
                Number(
                    payment.amount ||
                    payment.total ||
                    0
                )
            );
        },
        0
    );

    return (
        <div>

            <div className="admin-page-header">
                <div>
                    <h1>{t("Dashboard")}</h1>
                    <p>
                        {t("Overview of your store")}
                    </p>
                </div>
            </div>

            <div className="admin-stats-grid">

                <StatCard
                    title={t("Users")}
                    value={users.length}
                    icon={Users}
                />

                <StatCard
                    title={t("Products")}
                    value={products.length}
                    icon={Package}
                />

                <StatCard
                    title={t("Orders")}
                    value={orders.length}
                    icon={ShoppingBag}
                />

                <StatCard
                    title={t("Revenue")}
                    value={`$${revenue.toLocaleString()}`}
                    icon={DollarSign}
                />

                <StatCard
                    title={t("Products in carts")}
                    value={cartProductCount}
                    icon={ShoppingCart}
                />

                <StatCard
                    title={t("Payments")}
                    value={payments.length}
                    icon={CreditCard}
                />

            </div>

            <div className="admin-dashboard-grid">

                <section className="admin-panel">

                    <div className="admin-panel-heading">

                        <div>
                            <h2>
                                {t("Best buyers")}
                            </h2>

                            <p>
                                {t("Customers by completed purchase value")}
                            </p>
                        </div>

                    </div>

                    <BestBuyersChart
                        orders={orders}
                    />

                </section>

            </div>

        </div>
    );
}