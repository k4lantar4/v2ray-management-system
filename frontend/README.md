# پنل مدیریت V2Ray

پنل مدیریت V2Ray با رابط کاربری مدرن و کاربرپسند، پیاده‌سازی شده با Next.js و Material-UI

## ویژگی‌ها

- 🎨 رابط کاربری مدرن و ریسپانسیو
- 🌐 پشتیبانی کامل از RTL و زبان فارسی
- 👥 مدیریت کاربران و سطوح دسترسی
- 📊 مدیریت اشتراک‌ها و ترافیک
- 🎫 سیستم تیکت و پشتیبانی
- 📱 رابط کاربری موبایل‌فرندلی
- 🔒 احراز هویت امن
- 📈 نمودارها و گزارش‌های آماری

## تکنولوژی‌ها

- Next.js
- TypeScript
- Material-UI
- React Query
- Axios
- JWT Authentication
- Docker

## پیش‌نیازها

- Node.js 18+
- npm یا yarn
- Docker (اختیاری)

## نصب و راه‌اندازی

### روش اول: اجرا با npm

1. نصب وابستگی‌ها:
```bash
npm install
```

2. ایجاد فایل .env:
```bash
cp .env.example .env
```

3. اجرای برنامه در محیط توسعه:
```bash
npm run dev
```

### روش دوم: اجرا با Docker

1. ساخت ایمیج:
```bash
docker build -t v2ray-panel-frontend .
```

2. اجرای کانتینر:
```bash
docker run -p 3000:3000 v2ray-panel-frontend
```

یا با استفاده از docker-compose:
```bash
docker-compose up
```

## ساختار پروژه

```
frontend/
├── src/
│   ├── components/      # کامپوننت‌های قابل استفاده مجدد
│   ├── contexts/        # کانتکست‌های React
│   ├── pages/          # صفحات برنامه
│   ├── services/       # سرویس‌های API
│   ├── translations/   # فایل‌های ترجمه
│   └── utils/          # توابع کمکی
├── public/             # فایل‌های استاتیک
└── styles/            # استایل‌های سراسری
```

## مسیرهای برنامه

- `/login` - صفحه ورود
- `/dashboard` - داشبورد اصلی
- `/dashboard/users` - مدیریت کاربران
- `/dashboard/subscriptions` - مدیریت اشتراک‌ها
- `/dashboard/tickets` - سیستم تیکت و پشتیبانی
- `/dashboard/settings` - تنظیمات

## توسعه

1. برای اضافه کردن صفحه جدید:
   - ایجاد فایل در پوشه `pages`
   - استفاده از کامپوننت Layout
   - اضافه کردن مسیر به Sidebar

2. برای اضافه کردن ترجمه جدید:
   - اضافه کردن کلید به `translations/fa.json`
   - استفاده از هوک `useTranslations`

3. برای اضافه کردن API جدید:
   - اضافه کردن متد به `services/api.ts`
   - استفاده از Axios برای درخواست‌ها

## دیپلوی

برای دیپلوی در محیط تولید:

1. ساخت نسخه تولید:
```bash
npm run build
```

2. اجرای نسخه تولید:
```bash
npm start
```

## مشارکت

1. Fork کردن پروژه
2. ایجاد برنچ برای تغییرات
3. Commit کردن تغییرات
4. Push به برنچ
5. ایجاد Pull Request

## لایسنس

MIT
