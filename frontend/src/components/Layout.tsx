import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography,
} from '@mui/material'
import {
  AccountTree, Assessment, ChevronLeft, ChevronRight, CloudUpload,
  Folder, ManageAccounts, Menu, People, PersonAdd, Psychology,
} from '@mui/icons-material'

const DRAWER_WIDTH = 240
const DRAWER_COLLAPSED_WIDTH = 60

const NAV = [
  { path: '/employees',     label: 'Employees',         icon: <People /> },
  { path: '/employees/new', label: 'Add Employee',       icon: <PersonAdd /> },
  { path: '/bulk-upload',   label: 'Bulk Upload',        icon: <CloudUpload /> },
  { path: '/roles',         label: 'Role Assignment',    icon: <ManageAccounts /> },
  { path: '/supervisors',   label: 'Supervisor Mapping', icon: <AccountTree /> },
  { path: '/competencies',  label: 'Competencies',       icon: <Psychology /> },
  { path: '/work-packages', label: 'Work Packages',      icon: <Folder /> },
  { path: '/reports',       label: 'Reports',            icon: <Assessment /> },
]

export default function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const drawerWidth = collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH

  const navList = (isMobile: boolean) =>
    NAV.map((item) => {
      const selected =
        pathname === item.path ||
        (item.path !== '/employees' && pathname.startsWith(item.path))
      const isCollapsed = collapsed && !isMobile
      return (
        <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
          <Tooltip title={isCollapsed ? item.label : ''} placement="right" arrow>
            <ListItemButton
              selected={selected}
              onClick={() => { navigate(item.path); setMobileOpen(false) }}
              sx={{
                minHeight: 48,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                px: 2,
                '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.contrastText' },
                '&.Mui-selected .MuiListItemIcon-root': { color: 'inherit' },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isCollapsed ? 0 : 2,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  opacity: isCollapsed ? 0 : 1,
                  maxWidth: isCollapsed ? 0 : 'auto',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.2s ease, max-width 0.2s ease',
                }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      )
    })

  const drawerContent = (isMobile: boolean) => {
    const isCollapsed = collapsed && !isMobile
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Drawer header */}
        <Toolbar
          sx={{
            bgcolor: 'primary.dark',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            px: isCollapsed ? 0 : 2,
            minHeight: '64px !important',
            transition: 'padding 0.2s ease',
          }}
        >
          {isCollapsed ? (
            <Typography variant="subtitle1" fontWeight={800} color="white">PM</Typography>
          ) : (
            <Typography variant="h6" fontWeight={700} color="white" noWrap>
              PeopleMatrix
            </Typography>
          )}
        </Toolbar>

        {/* Nav items */}
        <List dense sx={{ flex: 1, pt: 0.5 }}>
          {navList(isMobile)}
        </List>

        {/* Collapse / expand toggle — desktop only */}
        {!isMobile && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Tooltip
              title={collapsed ? 'Expand menu' : 'Collapse menu'}
              placement="right"
            >
              <IconButton
                onClick={() => setCollapsed((c) => !c)}
                size="small"
                sx={{ width: '100%', borderRadius: 0, py: 1.25 }}
              >
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          {/* Mobile hamburger */}
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 2, display: { sm: 'none' } }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" noWrap fontWeight={600}>
            PeopleMatrix
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
          transition: 'width 0.2s ease',
        }}
      >
        {/* Mobile temporary drawer — always full width, no collapse */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent(true)}
        </Drawer>

        {/* Desktop permanent drawer — collapsible */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              overflowX: 'hidden',
              transition: 'width 0.2s ease',
            },
          }}
        >
          {drawerContent(false)}
        </Drawer>
      </Box>

      {/* Main content — shifts as drawer collapses */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '64px',
          minHeight: '100vh',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          transition: 'width 0.2s ease',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
