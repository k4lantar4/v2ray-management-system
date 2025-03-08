"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

const data = [
  {
    name: "فروردین",
    users: 2400,
    subscriptions: 1800,
  },
  {
    name: "اردیبهشت",
    users: 1398,
    subscriptions: 1210,
  },
  {
    name: "خرداد",
    users: 9800,
    subscriptions: 7290,
  },
  {
    name: "تیر",
    users: 3908,
    subscriptions: 2900,
  },
  {
    name: "مرداد",
    users: 4800,
    subscriptions: 3800,
  },
  {
    name: "شهریور",
    users: 3800,
    subscriptions: 2800,
  },
  {
    name: "مهر",
    users: 4300,
    subscriptions: 3300,
  },
];

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <Card className="p-2">
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary ml-2" />
                      <span className="text-sm">کاربران: {payload[0].value}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 ml-2" />
                      <span className="text-sm">اشتراک‌ها: {payload[1].value}</span>
                    </div>
                  </div>
                </Card>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="users"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="subscriptions"
          stroke="hsl(217, 91%, 60%)"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 