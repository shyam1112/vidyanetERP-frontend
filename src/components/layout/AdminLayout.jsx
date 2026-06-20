import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const adminNav = [
  { to: '/admin/registrations', label: 'School Registrations', icon: '📋' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/admin');
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col text-white">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🛡️</span>
            <h1 className="text-lg font-bold text-white">Vidyanet ERP</h1>
          </div>
          <p className="text-xs text-gray-500 ml-7">Internal Admin Panel</p>
        </div>

        <nav className="flex-1 p-4">
          <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold px-4 mb-3">Management</p>
          <ul className="space-y-1">
            {adminNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-gray-500 hover:text-red-400 transition-colors px-1"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-gray-950">
        <header className="border-b border-gray-800 px-6 py-4">
          <p className="text-sm text-gray-500">Internal Admin — <span className="text-gray-300">Vidyanet ERP</span></p>
        </header>
        <main className="flex-1 p-6 text-white">{children}</main>
      </div>
    </div>
  );
}
