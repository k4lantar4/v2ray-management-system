"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast";

// Temporary mock data
const users = [
  { id: 1, username: "user1" },
  { id: 2, username: "user2" },
  { id: 3, username: "user3" },
];

const plans = [
  { id: 1, name: "پلن طلایی", price: 29.99 },
  { id: 2, name: "پلن نقره‌ای", price: 19.99 },
  { id: 3, name: "پلن برنزی", price: 9.99 },
];

const servers = [
  { id: 1, name: "سرور آلمان ۱" },
  { id: 2, name: "سرور هلند ۱" },
  { id: 3, name: "سرور فرانسه ۱" },
];

const subscriptionFormSchema = z.object({
  userId: z.string().min(1, "انتخاب کاربر الزامی است"),
  planId: z.string().min(1, "انتخاب پلن الزامی است"),
  serverId: z.string().min(1, "انتخاب سرور الزامی است"),
  startDate: z.string().min(1, "تاریخ شروع الزامی است"),
  duration: z
    .string()
    .min(1, "مدت زمان الزامی است")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 12, "مدت زمان باید بین ۱ تا ۱۲ ماه باشد"),
  status: z.enum(["active", "expired", "cancelled"]),
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionFormPageProps {
  params: {
    action: "new" | string;
  };
}

export default function SubscriptionFormPage({
  params,
}: SubscriptionFormPageProps) {
  const { action } = params;
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = action !== "new";

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      userId: "",
      planId: "",
      serverId: "",
      startDate: new Date().toISOString().split("T")[0],
      duration: "1",
      status: "active",
    },
  });

  useEffect(() => {
    if (isEditing) {
      // TODO: Fetch subscription data and set form values
    }
  }, [isEditing]);

  const onSubmit = async (data: SubscriptionFormValues) => {
    try {
      // TODO: Implement subscription creation/update
      console.log("Form data:", data);
      
      toast({
        title: isEditing ? "اشتراک ویرایش شد" : "اشتراک جدید ایجاد شد",
        description: "اشتراک با موفقیت " + (isEditing ? "ویرایش" : "ایجاد") + " شد.",
      });

      router.push("/dashboard/subscriptions");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در ذخیره اطلاعات پیش آمده است.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? "ویرایش اشتراک" : "افزودن اشتراک جدید"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>کاربر</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کاربر" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>پلن</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب پلن" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} - ${plan.price}/ماه
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سرور</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب سرور" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servers.map((server) => (
                        <SelectItem key={server.id} value={server.id.toString()}>
                          {server.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاریخ شروع</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      dir="ltr"
                      className="text-left"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مدت زمان (ماه)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      {...field}
                      dir="ltr"
                      className="text-left"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وضعیت</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب وضعیت" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">فعال</SelectItem>
                      <SelectItem value="expired">منقضی شده</SelectItem>
                      <SelectItem value="cancelled">لغو شده</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit">
              {form.formState.isSubmitting && (
                <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "ویرایش اشتراک" : "افزودن اشتراک"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/subscriptions")}
            >
              انصراف
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 