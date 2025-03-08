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
import { useServerStore } from "@/store";
import { Server, CreateServerDto, UpdateServerDto } from "@/types/api";

const serverFormSchema = z.object({
  name: z.string().min(1, "نام سرور الزامی است"),
  location: z.string().min(1, "مکان سرور الزامی است"),
  ip: z
    .string()
    .min(1, "آدرس IP الزامی است")
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      "آدرس IP نامعتبر است"
    ),
  portRangeStart: z
    .string()
    .min(1, "شروع محدوده پورت الزامی است")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 65535, "پورت باید بین 1 تا 65535 باشد"),
  portRangeEnd: z
    .string()
    .min(1, "پایان محدوده پورت الزامی است")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 65535, "پورت باید بین 1 تا 65535 باشد"),
  status: z.enum(["online", "offline", "maintenance"]),
});

type ServerFormValues = z.infer<typeof serverFormSchema>;

interface ServerFormPageProps {
  params: {
    action: "new" | "edit";
    id?: string;
  };
}

export default function ServerFormPage({ params }: ServerFormPageProps) {
  const { action } = params;
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = action === "edit";
  const serverStore = useServerStore();

  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      name: "",
      location: "",
      ip: "",
      portRangeStart: "",
      portRangeEnd: "",
      status: "online",
    },
  });

  useEffect(() => {
    if (isEditing && params.id) {
      const fetchServer = async () => {
        try {
          await serverStore.getServer(parseInt(params.id!, 10));
          const server = serverStore.selectedServer;
          if (server) {
            form.reset({
              name: server.name,
              location: server.location,
              ip: server.ip,
              portRangeStart: server.portRangeStart.toString(),
              portRangeEnd: server.portRangeEnd.toString(),
              status: server.status as "online" | "offline" | "maintenance",
            });
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "خطا",
            description: "مشکلی در دریافت اطلاعات سرور پیش آمده است.",
          });
          router.push("/dashboard/servers");
        }
      };
      fetchServer();
    }
  }, [isEditing, params.id, form, serverStore, toast, router]);

  const onSubmit = async (data: ServerFormValues) => {
    try {
      const serverData: CreateServerDto | UpdateServerDto = {
        name: data.name,
        location: data.location,
        ip: data.ip,
        portRangeStart: parseInt(data.portRangeStart.toString(), 10),
        portRangeEnd: parseInt(data.portRangeEnd.toString(), 10),
        status: data.status,
      };

      if (isEditing && params.id) {
        await serverStore.updateServer(parseInt(params.id, 10), serverData);
      } else {
        await serverStore.createServer(serverData as CreateServerDto);
      }

      toast({
        title: isEditing ? "سرور ویرایش شد" : "سرور جدید ایجاد شد",
        description: `سرور ${data.name} با موفقیت ${
          isEditing ? "ویرایش" : "ایجاد"
        } شد.`,
      });

      router.push("/dashboard/servers");
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
          {isEditing ? "ویرایش سرور" : "افزودن سرور جدید"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام سرور</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: سرور آلمان ۱" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مکان</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: آلمان" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آدرس IP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: 192.168.1.1"
                      {...field}
                      dir="ltr"
                      className="text-left"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="portRangeStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شروع محدوده پورت</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000"
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
                name="portRangeEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>پایان محدوده پورت</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="20000"
                        {...field}
                        dir="ltr"
                        className="text-left"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      <SelectItem value="online">آنلاین</SelectItem>
                      <SelectItem value="offline">آفلاین</SelectItem>
                      <SelectItem value="maintenance">در حال تعمیر</SelectItem>
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
              {isEditing ? "ویرایش سرور" : "افزودن سرور"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/servers")}
            >
              انصراف
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 