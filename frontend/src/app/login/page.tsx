"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Icons } from "@/components/icons";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store';
import { BrandTelegram } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loginWithToken } = useAuthStore();

  // Handle token from Telegram bot
  useEffect(() => {
    const token = searchParams.get('token');
    if (token && !isAuthenticated) {
      loginWithToken(token).then(() => {
        router.push('/dashboard');
      });
    } else if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, searchParams]);

  const onPasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      window.location.href = "/dashboard";
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطا در ورود",
        description: "نام کاربری یا رمز عبور اشتباه است",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramLogin = () => {
    // Replace with your Telegram bot link
    window.location.href = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || 'https://t.me/your_bot';
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">ورود به سیستم</CardTitle>
            <CardDescription>
              برای ورود به سیستم از یکی از روش‌های زیر استفاده کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">رمز عبور</TabsTrigger>
                <TabsTrigger value="telegram">تلگرام</TabsTrigger>
              </TabsList>
              <TabsContent value="password">
                <form onSubmit={onPasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">نام کاربری</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="نام کاربری خود را وارد کنید"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="رمز عبور خود را وارد کنید"
                      required
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    ورود
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="telegram">
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    برای ورود با تلگرام روی دکمه زیر کلیک کنید
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleTelegramLogin}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    <BrandTelegram className="ml-2 h-4 w-4" />
                    ورود با تلگرام
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 