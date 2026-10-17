import {
    Routes,
    Route,
} from "react-router-dom";

import AdminLayout from "./AdminLayout";

import AdminDashboard
    from "./components/AdminDashboard";

import AdminUsers
    from "./pages/AdminUsers";

import AdminProducts
    from "./pages/AdminProducts";

import AdminCarts
    from "./pages/AdminCarts";

import AdminOrders
    from "./pages/AdminOrders";

import AdminPayments
    from "./pages/AdminPayments";

import AdminFavourites
    from "./pages/AdminFavourites";

export default function App() {

    return (
        <Routes>

            {/* ADMIN */}

            <Route
                path="/admin/"
                element={<AdminLayout />}
            >

                <Route
                    index
                    element={
                        <AdminDashboard />
                    }
                />

                <Route
                    path="users/"
                    element={
                        <AdminUsers />
                    }
                />

                <Route
                    path="products/"
                    element={
                        <AdminProducts />
                    }
                />

                <Route
                    path="carts/"
                    element={
                        <AdminCarts />
                    }
                />

                <Route
                    path="orders/"
                    element={
                        <AdminOrders />
                    }
                />

                <Route
                    path="payments/"
                    element={
                        <AdminPayments />
                    }
                />

                <Route
                    path="favourites/"
                    element={
                        <AdminFavourites />
                    }
                />

            </Route>

        </Routes>
    );
}