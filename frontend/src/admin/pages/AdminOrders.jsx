import AdminResourcePage from "../components/AdminResourcePage";
import { getOrders, deleteOrder, updateOrder } from "../api/orders";

const columns = [
    { key: "customer", label: "Customer" },
    { key: "order_items", label: "Items" },
    { key: "total_price", label: "Total" },
    { key: "created_at", label: "Created" },
];

export default function AdminOrders() {
    return (
        <AdminResourcePage
            title="Orders"
            description="Review and manage customer orders."
            load={getOrders}
            remove={deleteOrder}
            update={updateOrder}
            columns={columns}
            editFields={[
                {
                    key: "order_items",
                    label: "Order items JSON",
                    type: "json",
                    required: true,
                },
            ]}
            emptyMessage="No orders have been placed yet."
        />
    );
}
