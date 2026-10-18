import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiLogIn, FiUser } from "react-icons/fi";

import { loginUser } from "../apis/auth";
import { useNotifications } from "../context/NotificationContext";
import { useSitePreferences } from "../context/SitePreferencesContext";
import "./Auth.css";

const Login = () => {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const { error: showError, success: showSuccess } = useNotifications();
    const { t } = useSitePreferences();

    const handleSubmit = async (event) => {

        event.preventDefault();

        setLoading(true);

        try {

            const data = await loginUser(
                username,
                password
            );

            /*
             * Save JWT tokens.
             */
            localStorage.setItem(
                "access_token",
                data.access
            );

            localStorage.setItem(
                "refresh_token",
                data.refresh
            );

            /*
             * Save user information.
             */
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            /*
             * Navigate based on role.
             */
            const isAdminUser =
                data?.user?.role === "ADMIN" ||
                data?.user?.is_staff === true ||
                data?.user?.is_superuser === true;

            if (isAdminUser) {
                showSuccess("Welcome back. You are now signed in.");
                navigate("/admin/");
            } else {
                showSuccess("Welcome back. You are now signed in.");
                navigate("/home/");
            }

        } catch (error) {

            showError(
                error.message ||
                "Invalid username or password."
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <section className="auth-page">
            <div className="auth-card">
                <div className="auth-heading">
                    <span className="auth-kicker">{t("WELCOME BACK")}</span>
                    <h1>{t("Login")}</h1>
                    <p>{t("Login to your account.")}</p>
                </div>

                <form onSubmit={handleSubmit}>

                    <label className="auth-field">
                        <span>{t("Username")}</span>
                        <FiUser />
                        <input
                            type="text"
                            placeholder={t("Enter your username")}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </label>

                    <label className="auth-field">
                        <span>{t("Password")}</span>
                        <FiLock />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder={t("Enter your password")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            className="password-toggle"
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            aria-label={t(showPassword ? "Hide password" : "Show password")}
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </label>

                    <button className="auth-submit" type="submit" disabled={loading}>
                        <FiLogIn />
                        {loading
                            ? t("Logging in...")
                            : t("Login")}
                    </button>

                </form>

                <p className="auth-footer-text">
                    {t("Don't have an account?")}{" "}

                    <Link to="/register/">
                        {t("Register")}
                    </Link>
                </p>

            </div>

        </section>
    );
};

export default Login;
