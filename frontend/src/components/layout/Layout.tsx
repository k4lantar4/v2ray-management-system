import { ReactNode, useState } from 'react';
import styled from '@emotion/styled'; // Updated import statement
import { Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Sidebar from './Sidebar';
import Header from './Header';

const drawerWidth = 240;

interface MainProps {
  open?: boolean;
}

const Main = styled('main')<MainProps>(({ open }) => ({
  flexGrow: 1,
  padding: '24px',
  transition: 'margin 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
  marginRight: -drawerWidth,
  ...(open && {
    transition: 'margin 225ms cubic-bezier(0.0, 0, 0.2, 1) 0ms',
    marginRight: 0,
  }),
}));

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'داشبورد' }: LayoutProps) {
  const [open, setOpen] = useState(true);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex', direction: 'rtl' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
          mr: open ? `${drawerWidth}px` : 0,
          transition: 'margin 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms, width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            {open ? <ChevronRightIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {title}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Header />
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
          },
        }}
        variant="persistent"
        anchor="right"
        open={open}
      >
        <Sidebar />
      </Drawer>
      <Main open={open}>
        <Toolbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {children}
        </Container>
      </Main>
    </Box>
  );
}
