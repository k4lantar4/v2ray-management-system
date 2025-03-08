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
  FormDescription,
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

const userFormSchema = z.object({
  username: z
    .string()
    .min(3, "نام کاربری باید حداقل ۳ کاراکتر باشد")
    .max(50, "نام کاربری نمی‌تواند بیشتر از ۵۰ کاراکتر باشد"),
  email: z
    .string()
    .min(1, "ایمیل الزامی است")
    .email("ایمیل نامعتبر است"),
  telegramId: z
    .string()
    .min(1, "شناسه تلگرام الزامی است")
    .regex(/^\d+$/, "شناسه تلگرام باید عددی باشد"),
  credit: z
    .string()
    .min(1, "اعتبار الزامی است")
    .transform((val) => parseFloat(val))
    .refine((val) => val >= 0, "اعتبار نمی‌تواند منفی باشد"),
  status: z.enum(["active", "inactive", "blocked"]),
  password: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormPageProps {
  params: {
    action: "new" | string;
  };
}

export default function UserFormPage({ params }: UserFormPageProps) {
  const { action } = params;
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = action !== "new";

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      telegramId: "",
      credit: "0",
      status: "active",
      password: "",
    },
  });

  useEffect(() => {
    if (isEditing) {
      // TODO: Fetch user data and set form values
    }
  }, [isEditing]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      // TODO: Implement user creation/update
      console.log("Form data:", data);
      
      toast({
        title: isEditing ? "کاربر ویرایش شد" : "کاربر جدید ایجاد شد",
        description: `کاربر ${data.username} با موفقیت ${
          isEditing ? "ویرایش" : "ایجاد"
        } شد.`,
      });

      router.push("/dashboard/users");
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
          {isEditing ? "ویرایش کاربر" : "افزودن کاربر جدید"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام کاربری</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="نام کاربری را وارد کنید"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ایمیل</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@domain.com"
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
              name="telegramId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شناسه تلگرام</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="شناسه تلگرام را وارد کنید"
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
              name="credit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اعتبار</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      dir="ltr"
                      className="text-left"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز عبور</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="رمز عبور را وارد کنید"
                        {...field}
                        dir="ltr"
                        className="text-left"
                      />
                    </FormControl>
                    <FormDescription>
                      در صورت خالی بودن، از تلگرام برای احراز هویت استفاده می‌شود
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                      <SelectItem value="inactive">غیرفعال</SelectItem>
                      <SelectItem value="blocked">مسدود شده</SelectItem>
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
              {isEditing ? "ویرایش کاربر" : "افزودن کاربر"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/users")}
            >
              انصراف
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 