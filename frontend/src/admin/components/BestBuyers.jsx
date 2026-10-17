import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

export default function BestBuyersChart({
    orders = [],
}) {

    const buyerMap = {};

    orders.forEach((order) => {

        const status =
            String(order.status || "")
                .toLowerCase();

        if (
            status === "cancelled" ||
            status === "failed"
        ) {
            return;
        }

        const user =
            order.user ||
            order.customer;

        if (!user) {
            return;
        }

        const uuid =
            user.uuid ||
            user.id;

        const name =
            user.fullname ||
            user.username ||
            user.name ||
            user.email ||
            "Unknown";

        const amount =
            Number(
                order.total ||
                order.total_price ||
                order.amount ||
                0
            );

        if (!buyerMap[uuid]) {
            buyerMap[uuid] = {
                name,
                amount: 0,
                orders: 0,
            };
        }

        buyerMap[uuid].amount += amount;
        buyerMap[uuid].orders += 1;
    });

    const data = Object.values(buyerMap)
        .sort(
            (a, b) =>
                b.amount - a.amount
        )
        .slice(0, 8);

    if (!data.length) {
        return (
            <div className="chart-empty">
                No buyer data available.
            </div>
        );
    }

    return (
        <div className="best-buyers-chart">

            <ResponsiveContainer
                width="100%"
                height={360}
            >

                <BarChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 20,
                        left: 10,
                        bottom: 10,
                    }}
                >

                    <XAxis
                        dataKey="name"
                    />

                    <YAxis />

                    <Tooltip
                        formatter={(value) =>
                            `$${Number(value).toLocaleString()}`
                        }
                    />

                    <Bar
                        dataKey="amount"
                        radius={[
                            7,
                            7,
                            0,
                            0,
                        ]}
                    />

                </BarChart>

            </ResponsiveContainer>

        </div>
    );
}