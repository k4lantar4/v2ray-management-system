import { Chip, ChipProps } from '@mui/material';
import { useTranslations } from 'next-intl';

interface UserStatusChipProps extends Omit<ChipProps, 'label' | 'color'> {
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
}

const statusColors = {
  ACTIVE: 'success',
  BLOCKED: 'error',
  PENDING: 'warning',
} as const;

export default function UserStatusChip({ status, ...props }: UserStatusChipProps) {
  const t = useTranslations();

  return (
    <Chip
      label={t(`users.status.${status.toLowerCase()}`)}
      color={statusColors[status]}
      {...props}
    />
  );
}

// کامپوننت نمایش نقش کاربر
interface UserRoleChipProps extends Omit<ChipProps, 'label' | 'color'> {
  role: 'ADMIN' | 'SUPPORT' | 'USER' | 'VIP';
}

const roleColors = {
  ADMIN: 'primary',
  SUPPORT: 'info',
  USER: 'default',
  VIP: 'secondary',
} as const;

export function UserRoleChip({ role, ...props }: UserRoleChipProps) {
  const t = useTranslations();

  return (
    <Chip
      label={t(`users.roles.${role.toLowerCase()}`)}
      color={roleColors[role]}
      {...props}
    />
  );
}

// کامپوننت نمایش مبلغ به صورت فارسی
interface PriceDisplayProps {
  amount: number;
  currency?: string;
}

export function PriceDisplay({ amount, currency = 'ریال' }: PriceDisplayProps) {
  return (
    <span>
      {amount.toLocaleString('fa-IR')} {currency}
    </span>
  );
}
