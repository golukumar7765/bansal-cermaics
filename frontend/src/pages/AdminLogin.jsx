import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  Mail,
  Loader2
} from 'lucide-react';
import api from '../lib/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await api.post(
        '/auth/login',
        {
          email,
          password
        }
      );

      if (response.data?.success && response.data?.token) {
        localStorage.setItem(
          'adminToken',
          response.data.token
        );

        localStorage.setItem(
          'adminEmail',
          response.data.admin?.email || email
        );

        navigate('/admin');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto border border-blue-500/30">
            <Lock size={24} />
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">
            Bansal Scientific Admin
          </h1>

          <p className="text-xs text-slate-400">
            Restricted portal for product management
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Admin Email
            </label>

            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-3.5 text-slate-500"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Admin Password
            </label>

            <div className="relative">
              <KeyRound
                size={16}
                className="absolute left-3 top-3.5 text-slate-500"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-600/20 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Lock size={17} />
                Authenticate & Access
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
