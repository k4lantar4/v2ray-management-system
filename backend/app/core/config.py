from typing import List, Optional
from pydantic import BaseSettings, PostgresDsn, validator
import secrets
from functools import lru_cache

class Settings(BaseSettings):
    # 🔐 تنظیمات امنیتی
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 روز
    
    # 🌐 تنظیمات API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "V2Ray Management System"
    
    # 🤖 تنظیمات ربات تلگرام
    TELEGRAM_BOT_TOKEN: str
    ADMIN_GROUP_ID: int
    PAYMENT_CHANNEL_ID: int
    
    # 🗄️ تنظیمات دیتابیس
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            user=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    # 🔒 تنظیمات پنل 3x-ui
    XUI_PANEL_URL: str
    XUI_USERNAME: str
    XUI_PASSWORD: str
    
    # 💳 تنظیمات پرداخت
    BANK_CARDS: List[str] = []  # لیست شماره کارت‌های بانکی
    MIN_DEPOSIT_AMOUNT: int = 50000  # حداقل مبلغ شارژ کیف پول
    MIN_SELLER_DEPOSIT: int = 500000  # حداقل شارژ برای فروشندگان
    
    # 🎁 تنظیمات تخفیف و پاداش
    REFERRAL_BONUS_PERCENT: int = 10  # درصد پاداش معرف
    VIP_DISCOUNT_PERCENT: int = 15  # درصد تخفیف کاربران VIP
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# ⚙️ ایجاد تنظیمات به صورت Singleton
@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
