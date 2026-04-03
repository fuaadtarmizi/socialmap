import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../lib/api';

interface ForgotPasswordProps {
  onBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#101010] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} />
          Back to login
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Forgot password?</h1>
          <p className="text-white/40 text-sm">Enter your email and we'll send you a reset link</p>
        </div>

        {sent ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-2">
            <p className="text-white font-semibold">Check your email</p>
            <p className="text-white/40 text-sm">We sent a password reset link to <span className="text-white">{email}</span></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
