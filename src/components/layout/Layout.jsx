import Sidebar from './Sidebar';
import SubSidebar from './SubSidebar';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/parents': 'Parents',
  '/marks': 'Marks',
  '/fees': 'Fees',
  '/attendance': 'Attendance',
  '/admin/registrations': 'School Registrations',
  '/configuration': 'Configuration',
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

export default function Layout({ children }) {
  const { pathname } = useLocation();

  const title = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key) && key !== '/')
    ? pageTitles[Object.keys(pageTitles).find((key) => pathname.startsWith(key) && key !== '/')]
    : pageTitles[pathname] || 'Vidyanet ERP';

  const subSection = Object.entries(subSidebarSections).find(([key]) =>
    pathname.startsWith(key)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      {subSection && <SubSidebar title={subSection[1].title} items={subSection[1].items} />}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto min-h-0 p-6">{children}</main>
      </div>
    </div>
  );
}
