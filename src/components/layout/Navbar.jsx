import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800">{user?.schoolName || 'Vidyanet ERP'}</h2>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-red-600 transition-colors"
      >
        Logout
      </button>
    </header>
  );
}
