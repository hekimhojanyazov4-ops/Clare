import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

import "./AdminLayout.css";

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const redirectToLogin = () => navigate("/login/");

        if (!localStorage.getItem("access_token")) {
            redirectToLogin();
        }

        window.addEventListener("admin-auth-expired", redirectToLogin);

        return () => {
            window.removeEventListener("admin-auth-expired", redirectToLogin);
        };
    }, [navigate]);

    function handleLogout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        navigate("/login/");
    }

    return (
        <div className={`admin-layout ${sidebarOpen ? "admin-menu-open" : ""}`}>

            <AdminSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            <div className="admin-main">

                <AdminHeader
                    onMenu={() => setSidebarOpen((open) => !open)}
                    onLogout={handleLogout}
                />

                <main className="admin-content">
                    <Outlet />
                </main>

            </div>

            {sidebarOpen && (
                <button
                    className="admin-sidebar-backdrop"
                    type="button"
                    aria-label="Close admin menu"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

        </div>
    );
}