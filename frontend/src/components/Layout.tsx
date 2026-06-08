import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
} from '@mui/material'
import {
  AccountTree, Assessment, CloudUpload, Folder, ManageAccounts, Menu, People,
  PersonAdd, Psychology,
} from '@mui/icons-material'

const DRAWER_WIDTH = 240

const NAV = [
  { path: '/employees',     label: 'Employees',          icon: <People /> },
  { path: '/employees/new', label: 'Add Employee',        icon: <PersonAdd /> },
  { path: '/bulk-upload',   label: 'Bulk Upload',         icon: <CloudUpload /> },
  { path: '/roles',         label: 'Role Assignment',     icon: <ManageAccounts /> },
  { path: '/supervisors',   label: 'Supervisor Mapping',  icon: <AccountTree /> },
  { path: '/competencies',  label: 'Competencies',        icon: <Psychology /> },
  { path: '/work-packages', label: 'Work Packages',       icon: <Folder /> },
  { path: '/reports',       label: 'Reports',             icon: <Assessment /> },
]

export default function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const drawer = (
    <Box>
      <Toolbar sx={{ bgcolor: 'primary.dark' }}>
        <Typography variant="h6" fontWeight={700} color="white" noWrap>
          HR Manager
        </Typography>
      </Toolbar>
      <List dense>
        {NAV.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={pathname === item.path || (item.path !== '/employees' && pathname.startsWith(item.path))}
              onClick={() => { navigate(item.path); setMobileOpen(false) }}
              sx={{ '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.contrastText' } }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit" edge="start" sx={{ mr: 2, display: { sm: 'none' } }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" noWrap fontWeight={600}>
            PeopleMatrix
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent" open
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: '64px', minHeight: '100vh' }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
