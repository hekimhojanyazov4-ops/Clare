import AdminResourcePage from "../components/AdminResourcePage";
import { getPayments, deletePayment, updatePayment } from "../api/payments";

const columns = [
    { key: "user", label: "Customer" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Created" },
];

export default function AdminPayments() {
    return (
        <AdminResourcePage
            title="Payments"
            description="Monitor payment records and statuses."
            load={getPayments}
            remove={deletePayment}
            update={updatePayment}
            columns={columns}
            filters={[
                {
                    key: "status",
                    label: "All statuses",
                    options: [
                        { value: "PENDING", label: "Pending" },
                        { value: "CONFIRMED", label: "Confirmed" },
                        { value: "CANCELLED", label: "Cancelled" },
                    ],
                },
            ]}
            editFields={[
                { key: "amount", label: "Amount", type: "number", min: "0.01", step: "0.01", required: true },
                {
                    key: "status",
                    label: "Status",
                    type: "select",
                    options: [
                        { value: "PENDING", label: "Pending" },
                        { value: "CONFIRMED", label: "Confirmed" },
                        { value: "CANCELLED", label: "Cancelled" },
                    ],
                },
            ]}
            emptyMessage="No payment records are available."
        />
    );
}
