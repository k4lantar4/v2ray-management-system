declare module 'react' {
  export = React;
  export as namespace React;
  
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    css?: any;
  }
}

declare module 'next-intl' {
  export function useTranslations(namespace?: string): (key: string) => string;
}

declare module '@mui/material' {
  export { default as Box } from '@mui/material/Box';
  export { default as IconButton } from '@mui/material/IconButton';
  export { default as Menu } from '@mui/material/Menu';
  export { default as MenuItem } from '@mui/material/MenuItem';
  export { default as Typography } from '@mui/material/Typography';
  export { default as Avatar } from '@mui/material/Avatar';
  export { default as Divider } from '@mui/material/Divider';
  export { default as ListItemIcon } from '@mui/material/ListItemIcon';
}

declare module '@mui/icons-material' {
  export { default as Person } from '@mui/icons-material/Person';
  export { default as Settings } from '@mui/icons-material/Settings';
  export { default as Logout } from '@mui/icons-material/Logout';
  export { default as Notifications } from '@mui/icons-material/Notifications';
}

declare module 'next/router' {
  export function useRouter(): {
    push: (url: string) => Promise<boolean>;
    pathname: string;
    query: { [key: string]: string | string[] };
  };
}
