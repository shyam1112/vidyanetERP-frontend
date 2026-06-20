import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar, { MobileDrawer } from './Sidebar';
import SubSidebar from './SubSidebar';
import Navbar from './Navbar';

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/parents': 'Parents',
  '/attendance': 'Attendance',
  '/marks': 'Marks',
  '/fees': 'Fees',
  '/team': 'Team',
  '/whatsapp': 'WhatsApp',
  '/admin/registrations': 'School Registrations',
  '/configuration': 'Configuration',
  '/documents': 'Documents',
};

const subSidebarSections = {
  '/configuration': {
    title: 'Configuration',
    items: [
      { to: '/configuration/school', label: 'School Config', icon: '🏫' },
      { to: '/configuration/grade', label: 'Grade Config', icon: '📊' },
      { to: '/configuration/fees', label: 'Fees Config', icon: '💰' },
    ],
  },
  '/documents': {
    title: 'Documents',
    items: [
      { to: '/documents/leaving-certificate',   label: 'Leaving Certificate',   icon: '🎓' },
      { to: '/documents/admission-form',        label: 'Admission Form',        icon: '📋' },
      { to: '/documents/bonafide-certificate',  label: 'Bonafide Certificate',  icon: '✅' },
      { to: '/documents/character-certificate', label: 'Character Certificate', icon: '🏅' },
      { to: '/documents/dob-certificate',       label: 'DOB Certificate',       icon: '🎂' },
    ],
  },
};

// Bottom nav items visible on mobile (most-used only)
const bottomNavItems = [
  { to: '/students',   label: 'Students',   icon: '🎒' },
  { to: '/attendance', label: 'Attendance', icon: '📅' },
  { to: '/marks',      label: 'Marks',      icon: '📝' },
  { to: '/fees',       label: 'Fees',       icon: '💰' },
];

function BottomNav({ user }) {
  const { pathname } = useLocation();
  const items = user?.role === 'admin'
    ? [{ to: '/', label: 'Home', icon: '🏠' }, ...bottomNavItems]
    : bottomNavItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex safe-bottom">
      {items.map((item) => {
        const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              active ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-tight">{item.icon}</span>
            <span className="leading-tight">{item.label}</span>
            {active && <span className="absolute bottom-0 h-0.5 w-8 bg-indigo-600 rounded-t-full" />}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key) && key !== '/')
    ? pageTitles[Object.keys(pageTitles).find((key) => pathname.startsWith(key) && key !== '/')]
    : pageTitles[pathname] || 'Vidyanet ERP';

  const subSection = Object.entries(subSidebarSections).find(([key]) => pathname.startsWith(key));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {subSection && <SubSidebar title={subSection[1].title} items={subSection[1].items} />}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Navbar title={title} onMenuClick={() => setDrawerOpen(true)} />
        {/* pb-16 on mobile so content isn't hidden behind bottom nav */}
        <main className="flex-1 overflow-y-auto min-h-0 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav user={user} />
    </div>
  );
}
