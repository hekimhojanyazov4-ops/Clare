import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { useSitePreferences } from "../../context/SitePreferencesContext";

export default function BestBuyersChart({
    orders = [],
}) {
    const { theme, t } = useSitePreferences();
    const chartTheme = theme === "dark"
        ? {
            axis: "#b7c0c9",
            grid: "#35404a",
            tooltipBackground: "#20272e",
            tooltipBorder: "#46525e",
            tooltipText: "#f3f5f7",
        }
        : {
            axis: "#625e58",
            grid: "#e7e3dc",
            tooltipBackground: "#ffffff",
            tooltipBorder: "#e5e1da",
            tooltipText: "#20262d",
        };

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
                {t("No buyer data available.")}
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

                    <CartesianGrid
                        vertical={false}
                        stroke={chartTheme.grid}
                        strokeDasharray="3 3"
                    />

                    <XAxis
                        dataKey="name"
                        tick={{ fill: chartTheme.axis, fontSize: 11 }}
                        axisLine={{ stroke: chartTheme.grid }}
                        tickLine={false}
                    />

                    <YAxis
                        tick={{ fill: chartTheme.axis, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        formatter={(value) =>
                            `$${Number(value).toLocaleString()}`
                        }
                        contentStyle={{
                            background: chartTheme.tooltipBackground,
                            border: `1px solid ${chartTheme.tooltipBorder}`,
                            borderRadius: 6,
                            color: chartTheme.tooltipText,
                        }}
                        itemStyle={{ color: chartTheme.tooltipText }}
                        labelStyle={{ color: chartTheme.tooltipText }}
                    />

                    <Bar
                        dataKey="amount"
                        fill="#ffb629"
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
