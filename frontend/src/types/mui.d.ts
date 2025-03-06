import { ReactNode } from 'react';
import { AutocompleteProps, TextFieldProps } from '@mui/material';

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

declare module '@mui/x-date-pickers' {
  interface DatePickerProps {
    label?: ReactNode;
    value: Date | null;
    onChange: (date: Date | null) => void;
  }
}
