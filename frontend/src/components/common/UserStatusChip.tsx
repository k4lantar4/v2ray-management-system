import * as React from 'react';
import { useTranslations } from 'next-intl';

type ColorType = 'success' | 'error' | 'warning' | 'primary' | 'info' | 'default' | 'secondary';

interface UserStatusChipProps {
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  className?: string;
  onClick?: () => void;
}

const statusColors = {
  ACTIVE: '#4caf50', // success green
  BLOCKED: '#f44336', // error red
  PENDING: '#ff9800', // warning orange
} as const;

export default function UserStatusChip({ status, className, onClick }: UserStatusChipProps) {
  const t = useTranslations();

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '16px',
        backgroundColor: statusColors[status],
        color: 'white',
        fontSize: '0.875rem',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {t(`users.status.${status.toLowerCase()}`)}
    </div>
  );
}

// کامپوننت نمایش نقش کاربر
interface UserRoleChipProps {
  role: 'ADMIN' | 'SUPPORT' | 'USER' | 'VIP';
  className?: string;
  onClick?: () => void;
}

const roleColors = {
  ADMIN: '#2196f3', // primary blue
  SUPPORT: '#00bcd4', // info cyan
  USER: '#9e9e9e', // default grey
  VIP: '#9c27b0', // secondary purple
} as const;

export function UserRoleChip({ role, className, onClick }: UserRoleChipProps) {
  const t = useTranslations();

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '16px',
        backgroundColor: roleColors[role],
        color: 'white',
        fontSize: '0.875rem',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {t(`users.roles.${role.toLowerCase()}`)}
    </div>
  );
}

// کامپوننت نمایش مبلغ به صورت فارسی
interface PriceDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
}

export function PriceDisplay({ amount, currency = 'ریال', className }: PriceDisplayProps) {
  return (
    <span className={className}>
      {amount.toLocaleString('fa-IR')} {currency}
    </span>
  );
}
