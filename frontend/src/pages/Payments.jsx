import React from "react";
import { FiCreditCard } from "react-icons/fi";
import { useSitePreferences } from "../context/SitePreferencesContext";
import "./CustomerPages.css";

const Payments = () => {
    const { t } = useSitePreferences();

    return (
        <section className="customer-page">
            <header className="customer-page-heading">
                <span>{t("YOUR ACCOUNT")}</span>
                <h1>{t("Payments")}</h1>
                <p>{t("View your payment history.")}</p>
            </header>
            <div className="customer-empty-state">
                <FiCreditCard aria-hidden="true" />
                <h2>{t("No payments yet")}</h2>
                <p>{t("Your payments will appear here.")}</p>
            </div>
        </section>
    );
};

export default Payments;