import React, { useState } from 'react';
import { login } from '../lib/api';
import { ForgotPassword } from '../components/ForgotPassword';

interface LoginProps {
  onLogin: (user: { id: string; username: string; email: string }, token: string) => void;
  onGoSignup: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onGoSignup }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState(() => localStorage.getItem('lumina_saved_email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('lumina_saved_password') || '');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('lumina_saved_email'));

  if (showForgot) return <ForgotPassword onBack={() => setShowForgot(false)} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token, user } = await login(email, password);
      localStorage.setItem('lumina_token', token);
      localStorage.setItem('lumina_user', JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem('lumina_saved_email', email);
        localStorage.setItem('lumina_saved_password', password);
      } else {
        localStorage.removeItem('lumina_saved_email');
        localStorage.removeItem('lumina_saved_password');
      }
      onLogin(user, token);
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#101010] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Social Map</h1>
          <p className="text-white/40">Connect with your local community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setRememberMe(v => !v)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                rememberMe ? 'bg-white border-white' : 'bg-transparent border-white/30'
              }`}
            >
              {rememberMe && (
                <svg viewBox="0 0 12 10" width="12" height="10" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 5l3 3 7-7" />
                </svg>
              )}
            </div>
            <span onClick={() => setRememberMe(v => !v)} className="text-white/50 text-sm">
              Remember me
            </span>
          </label>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-white/40 text-sm hover:text-white transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={onGoSignup}
            className="text-white/40 text-sm hover:text-white transition-colors"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
};
