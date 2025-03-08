"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Overview } from "@/components/overview";
import { RecentActivity } from "@/components/recent-activity";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const stats = [
    {
      title: "کاربران فعال",
      value: "2,350",
      icon: Icons.users,
      description: "↗️ 180+ نسبت به ماه قبل",
    },
    {
      title: "سرورهای فعال",
      value: "15",
      icon: Icons.server,
      description: "↗️ 3+ نسبت به ماه قبل",
    },
    {
      title: "درآمد ماهانه",
      value: "$12,234",
      icon: Icons.dollar,
      description: "↗️ 4% نسبت به ماه قبل",
    },
    {
      title: "اشتراک‌های فعال",
      value: "573",
      icon: Icons.subscription,
      description: "↗️ 150+ نسبت به ماه قبل",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/dashboard/servers/new")}
        >
          <Icons.plus className="ml-2 h-4 w-4" />
          افزودن سرور جدید
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/dashboard/users/new")}
        >
          <Icons.plus className="ml-2 h-4 w-4" />
          افزودن کاربر جدید
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/dashboard/subscriptions/new")}
        >
          <Icons.plus className="ml-2 h-4 w-4" />
          ایجاد اشتراک جدید
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/dashboard/transactions")}
        >
          <Icons.list className="ml-2 h-4 w-4" />
          مشاهده تراکنش‌ها
        </Button>
      </div>

      {/* Overview Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>نمودار کلی</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <Overview />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>فعالیت‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity />
        </CardContent>
      </Card>
    </div>
  );
} 