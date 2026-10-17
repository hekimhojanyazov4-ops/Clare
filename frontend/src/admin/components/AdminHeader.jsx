import { useMemo } from "react";
import {
    Menu,
    LogOut,
    UserCircle,
} from "lucide-react";

export default function AdminHeader({ onMenu, onLogout }) {
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    const displayName =
        user?.first_name || user?.username || "Administrator";
    const roleLabel =
        user?.is_superuser || user?.is_staff || user?.role === "ADMIN"
            ? "Administrator"
            : "Admin";

    return (
        <header className="admin-header">

            <button
                className="mobile-menu-btn"
                type="button"
                onClick={onMenu}
                aria-label="Open admin menu"
            >
                <Menu size={21} />
            </button>

            <div className="admin-header-title">
                <strong>Administration</strong>
                <span>Manage your online store</span>
            </div>

            <div className="admin-header-actions">
                <div className="admin-account">

                    <div className="admin-account-avatar">
                        <UserCircle size={20} />
                    </div>

                    <div>
                        <strong>{displayName}</strong>
                        <span>{roleLabel}</span>
                    </div>

                    <button
                        className="admin-logout-link"
                        type="button"
                        onClick={onLogout}
                        aria-label="Log out"
                    >
                        <LogOut size={16} />
                        <span>Log out</span>
                    </button>

                </div>

            </div>

        </header>
    );
}