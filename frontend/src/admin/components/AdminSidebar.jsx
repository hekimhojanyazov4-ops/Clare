import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    ShoppingBag,
    CreditCard,
    Heart,
    LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useSitePreferences } from "../../context/SitePreferencesContext";

const links = [
    {
        label: "Dashboard",
        path: "/admin/",
        icon: LayoutDashboard,
    },
    {
        label: "Users",
        path: "/admin/users/",
        icon: Users,
    },
    {
        label: "Products",
        path: "/admin/products/",
        icon: Package,
    },
    {
        label: "Carts",
        path: "/admin/carts/",
        icon: ShoppingCart,
    },
    {
        label: "Orders",
        path: "/admin/orders/",
        icon: ShoppingBag,
    },
    {
        label: "Payments",
        path: "/admin/payments/",
        icon: CreditCard,
    },
    {
        label: "Favourites",
        path: "/admin/favourites/",
        icon: Heart,
    },
];

export default function AdminSidebar({ open, onClose, onLogout }) {
    const { t } = useSitePreferences();

    return (
        <aside className={`admin-sidebar ${open ? "open" : ""}`}>

            <div className="admin-brand">

                <div className="admin-brand-logo">
                    S
                </div>

                <div>
                    <strong>Clare</strong>
                    <span>{t("Administration")}</span>
                </div>

            </div>

            <nav className="admin-sidebar-nav">

                <p className="sidebar-label">
                    {t("MANAGEMENT")}
                </p>

                {links.map(link => {

                    const Icon = link.icon;

                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            end={
                                link.path ===
                                "/admin/"
                            }
                            className={({ isActive }) =>
                                `admin-sidebar-link ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`
                            }
                                onClick={onClose}
                        >
                            <Icon size={19} />

                            <span>
                                {t(link.label)}
                            </span>
                        </NavLink>
                    );

                })}

            </nav>

            <div className="sidebar-bottom">

                <button type="button" onClick={onLogout}>
                    <LogOut size={18} />
                    {t("Logout")}
                </button>

            </div>

        </aside>
    );
}