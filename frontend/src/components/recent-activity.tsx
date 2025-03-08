"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const activities = [
  {
    user: {
      name: "علی محمدی",
      email: "ali@example.com",
      image: "/avatars/01.png",
    },
    type: "subscription",
    description: "اشتراک جدید خریداری کرد",
    time: "10 دقیقه پیش",
  },
  {
    user: {
      name: "سارا احمدی",
      email: "sara@example.com",
      image: "/avatars/02.png",
    },
    type: "server",
    description: "به سرور جدید منتقل شد",
    time: "30 دقیقه پیش",
  },
  {
    user: {
      name: "رضا کریمی",
      email: "reza@example.com",
      image: "/avatars/03.png",
    },
    type: "payment",
    description: "پرداخت جدید انجام داد",
    time: "2 ساعت پیش",
  },
  {
    user: {
      name: "مریم حسینی",
      email: "maryam@example.com",
      image: "/avatars/04.png",
    },
    type: "subscription",
    description: "اشتراک خود را تمدید کرد",
    time: "3 ساعت پیش",
  },
  {
    user: {
      name: "حسین رضایی",
      email: "hossein@example.com",
      image: "/avatars/05.png",
    },
    type: "server",
    description: "تنظیمات سرور را تغییر داد",
    time: "5 ساعت پیش",
  },
];

export function RecentActivity() {
  return (
    <div className="space-y-8">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={activity.user.image} alt={activity.user.name} />
            <AvatarFallback>
              {activity.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="mr-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {activity.user.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {activity.description}
            </p>
          </div>
          <div className="mr-auto text-sm text-muted-foreground">
            {activity.time}
          </div>
        </div>
      ))}
    </div>
  );
} 