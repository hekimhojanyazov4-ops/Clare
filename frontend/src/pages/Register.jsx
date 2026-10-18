import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FiAtSign,
    FiEye,
    FiEyeOff,
    FiLock,
    FiMail,
    FiPhone,
    FiUser,
} from "react-icons/fi";

import { registerUser } from "../api";
import { useNotifications } from "../context/NotificationContext";
import { useSitePreferences } from "../context/SitePreferencesContext";
import "./Auth.css";

const Register = () => {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        phone: "",
        first_name: "",
        last_name: "",
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { error: showError, success: showSuccess } = useNotifications();
    const { t } = useSitePreferences();

    const handleChange = (event) => {

        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });

    };


    const handleSubmit = async (event) => {

        event.preventDefault();

        try {

            setLoading(true);

            await registerUser(form);

            showSuccess("Your account is ready. Please sign in to continue.");
            navigate("/login/");

        } catch (err) {

            showError(err.message || "Unable to create your account.");

        } finally {

            setLoading(false);

        }
    };


    return (
        <section className="auth-page auth-register-page">
            <div className="auth-card">
                <div className="auth-heading">
                    <span className="auth-kicker">{t("JOIN CLARE")}</span>
                    <h1>{t("Create Account")}</h1>
                    <p>{t("Create an account to manage your Clare shopping experience.")}</p>
                </div>

                <form onSubmit={handleSubmit}>

                    <label className="auth-field">
                        <span>{t("Username")}</span>
                        <FiUser />
                        <input
                            name="username"
                            placeholder={t("Choose a username")}
                            value={form.username}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <div className="auth-name-grid">
                        <label className="auth-field">
                            <span>{t("First name")}</span>
                            <FiUser />
                            <input
                                name="first_name"
                                placeholder={t("First name")}
                                value={form.first_name}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="auth-field">
                            <span>{t("Last name")}</span>
                            <FiUser />
                            <input
                            name="last_name"
                            placeholder={t("Last name")}
                            value={form.last_name}
                            onChange={handleChange}
                            />
                        </label>

                    </div>

                    <label className="auth-field">
                        <span>{t("Email")}</span>
                        <FiMail />
                        <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </label>

                    <label className="auth-field">
                        <span>{t("Phone")}</span>
                        <FiPhone />
                        <input name="phone" placeholder="+993..." value={form.phone} onChange={handleChange} required />
                    </label>

                    <label className="auth-field">
                        <span>{t("Password")}</span>
                        <FiLock />
                        <input name="password" type={showPassword ? "text" : "password"} placeholder={t("Create a password")} value={form.password} onChange={handleChange} required />
                        <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={t(showPassword ? "Hide password" : "Show password")}>
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </label>

                    <button className="auth-submit" type="submit" disabled={loading}>
                        <FiAtSign />
                        {loading
                            ? t("Creating...")
                            : t("Create Account")}
                    </button>

                </form>


                <p className="auth-footer-text">
                    {t("Already have an account?")}{" "}
                    <Link to="/login/">
                        {t("Login")}
                    </Link>
                </p>

            </div>

        </section>
    );
};

export default Register;
