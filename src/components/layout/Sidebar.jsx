import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠', adminOnly: true },
  { to: '/students', label: 'Students', icon: '🎒' },
  { to: '/attendance', label: 'Attendance', icon: '📅' },
  { to: '/marks', label: 'Marks', icon: '📝' },
  { to: '/fees', label: 'Fees', icon: '💰' },
  { to: '/team', label: 'Team', icon: '👥', adminOnly: true },
  { to: '/whatsapp', label: 'WhatsApp', icon: '💬' },
  { to: '/documents/leaving-certificate', label: 'Documents', icon: '📄', adminOnly: true, matchPrefix: '/documents' },
  { to: '/configuration/school', label: 'Configuration', icon: '⚙️', adminOnly: true, matchPrefix: '/configuration' },
];

function ProfileModal({ user, onClose }) {
  const [view, setView] = useState('profile'); // 'profile' | 'password'
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/auth/change-password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed successfully');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setView('profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {view === 'profile' ? (
          <>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{user?.name}</p>
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize mt-0.5">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span>✉️</span>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-gray-800 font-medium">{user?.email}</p>
                </div>
              </div>
              {user?.schoolName && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span>🏫</span>
                  <div>
                    <p className="text-xs text-gray-400">School</p>
                    <p className="text-gray-800 font-medium">{user.schoolName}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setView('password')}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Change Password
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setView('profile')} className="text-gray-400 hover:text-gray-600 text-lg">‹</button>
              <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Old Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={form.oldPassword}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter old password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Re-enter new password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <aside className="w-64 bg-indigo-900 h-screen flex flex-col text-white overflow-y-auto shrink-0">
        <div className="p-6 border-b border-indigo-700">
          <h1 className="text-xl font-bold">Vidyanet ERP</h1>
          <p className="text-indigo-300 text-sm mt-1">School Management</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => {
                    const active = isActive || (item.matchPrefix && location.pathname.startsWith(item.matchPrefix));
                    return `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                    }`;
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          onClick={() => setShowProfile(true)}
          className="p-4 border-t border-indigo-700 w-full text-left hover:bg-indigo-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-indigo-300">{user?.schoolName || user?.role}</p>
            </div>
            <span className="text-indigo-400 text-xs">›</span>
          </div>
        </button>
      </aside>

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
    </>
  );
}
