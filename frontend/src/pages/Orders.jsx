import React from "react";
import { Link } from "react-router-dom";
import { FiPackage } from "react-icons/fi";
import "./CustomerPages.css";

const Orders = () => {
    return (
        <section className="customer-page">
            <header className="customer-page-heading">
                <span>YOUR ACCOUNT</span>
                <h1>Orders</h1>
                <p>View and manage your orders.</p>
            </header>
            <div className="customer-empty-state">
                <FiPackage aria-hidden="true" />
                <h2>No orders yet</h2>
                <p>Your orders will appear here.</p>
                <Link to="/products/">Explore the collection</Link>
            </div>
        </section>
    );
};

export default Orders;