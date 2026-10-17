import React from "react";
import { FiCreditCard } from "react-icons/fi";
import "./CustomerPages.css";

const Payments = () => {
    return (
        <section className="customer-page">
            <header className="customer-page-heading">
                <span>YOUR ACCOUNT</span>
                <h1>Payments</h1>
                <p>View your payment history.</p>
            </header>
            <div className="customer-empty-state">
                <FiCreditCard aria-hidden="true" />
                <h2>No payments yet</h2>
                <p>Your payments will appear here.</p>
            </div>
        </section>
    );
};

export default Payments;