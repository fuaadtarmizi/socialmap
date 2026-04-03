import React, { useState } from 'react';
import { resetPassword } from '../lib/api';

interface ResetPasswordProps {
  token: string;
  onDone: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      // Clear token from URL
      window.history.replaceState({}, '', '/');
      setTimeout(onDone, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#101010] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">New password</h1>
          <p className="text-white/40 text-sm">Choose a new password for your account</p>
        </div>

        {success ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-2">
            <p className="text-white font-semibold">Password updated!</p>
            <p className="text-white/40 text-sm">Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
