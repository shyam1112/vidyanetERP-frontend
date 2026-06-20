import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { BOARDS } from '../constants/academicYears';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    {children}
  </div>
);

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    schoolName: '', phone: '', city: '', state: '', board: '', website: '', message: '',
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await axiosInstance.post('/auth/register', form);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Your registration request has been submitted successfully. The super admin will review your application and notify you once approved.
          </p>
          <Link to="/login" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4 py-10">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏫</div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your School</h1>
          <p className="text-gray-500 mt-1 text-sm">Submit a request to join Vidyanet ERP. Your account will be active after super admin approval.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">School Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="School Name" required>
                  <input required value={form.schoolName} onChange={set('schoolName')} className={inputCls} placeholder="e.g. Delhi Public School" />
                </Field>
              </div>
              <Field label="Board">
                <select value={form.board} onChange={set('board')} className={inputCls}>
                  <option value="">Select board</option>
                  {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="School Website">
                <input value={form.website} onChange={set('website')} className={inputCls} placeholder="https://yourschool.com" type="url" />
              </Field>
              <Field label="City">
                <input value={form.city} onChange={set('city')} className={inputCls} placeholder="City" />
              </Field>
              <Field label="State">
                <input value={form.state} onChange={set('state')} className={inputCls} placeholder="State" />
              </Field>
            </div>
          </div>

          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Admin Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Your Full Name" required>
                <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="Admin Name" />
              </Field>
              <Field label="Phone Number" required>
                <input required value={form.phone} onChange={set('phone')} className={inputCls} placeholder="+91 9876543210" type="tel" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email Address" required>
                  <input required type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="admin@yourschool.com" />
                </Field>
              </div>
              <Field label="Password" required>
                <input required type="password" value={form.password} onChange={set('password')} className={inputCls} placeholder="Min 6 characters" />
              </Field>
              <Field label="Confirm Password" required>
                <input required type="password" value={form.confirmPassword} onChange={set('confirmPassword')} className={inputCls} placeholder="Confirm password" />
              </Field>
            </div>
          </div>

          <Field label="Message to Admin (optional)">
            <textarea value={form.message} onChange={set('message')} rows={3} className={inputCls} placeholder="Any additional information you'd like to share..." />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Registration Request'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
