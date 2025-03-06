import { ReactNode } from 'react';

declare module '@mui/material' {
  interface SelectChangeEvent<T = string> {
    target: {
      value: T;
      name: string;
    };
  }

  interface AutocompleteRenderInputParams extends TextFieldProps {
    InputProps: {
      ref?: React.Ref<any>;
      className?: string;
      startAdornment?: ReactNode;
      endAdornment?: ReactNode;
    };
    inputProps: {
      disabled?: boolean;
      'aria-expanded'?: boolean;
      'aria-owns'?: string;
      'aria-controls'?: string;
    };
  }
}

declare module '@mui/material/Chip' {
  export interface ChipProps {
    label?: ReactNode;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    variant?: 'filled' | 'outlined';
    size?: 'small' | 'medium';
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onDelete?: (event: React.MouseEvent<HTMLDivElement>) => void;
    className?: string;
    style?: React.CSSProperties;
  }
  const Chip: React.ComponentType<ChipProps>;
  export default Chip;
}

declare module '@mui/material/Typography' {
  export interface TypographyProps {
    component?: React.ElementType;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'button' | 'overline' | 'inherit';
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }
  const Typography: React.ComponentType<TypographyProps>;
  export default Typography;
}

declare module '@mui/x-date-pickers' {
  interface DatePickerProps {
    label?: ReactNode;
    value: Date | null;
    onChange: (date: Date | null) => void;
  }
}
