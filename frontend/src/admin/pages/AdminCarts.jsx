import AdminResourcePage from "../components/AdminResourcePage";
import { getCarts, deleteCart, updateCart } from "../api/carts";

const columns = [
    { key: "customer", label: "Customer" },
    { key: "cart_items", label: "Items" },
    { key: "created_at", label: "Created" },
];

export default function AdminCarts() {
    return (
        <AdminResourcePage
            title="Carts"
            description="Review active customer carts."
            load={getCarts}
            remove={deleteCart}
            update={updateCart}
            columns={columns}
            editFields={[
                {
                    key: "cart_items",
                    label: "Cart items JSON",
                    type: "json",
                    required: true,
                },
            ]}
            emptyMessage="There are no active carts."
        />
    );
}
