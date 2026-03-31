import React, { useState } from 'react';
import { signup, appleAuth, googleAuth } from '../lib/api';
import { InstallButton } from '../components/InstallButton';

// Google GSI global type
declare const google: {
  accounts: {
    oauth2: {
      initCodeClient: (config: {
        client_id: string;
        scope: string;
        ux_mode: 'popup';
        callback: (response: { code: string }) => void;
        error_callback?: (error: { type: string }) => void;
      }) => { requestCode: () => void };
    };
  };
};

// Apple JS SDK global type
declare const AppleID: {
  auth: {
    init: (config: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }) => void;
    signIn: () => Promise<{
      authorization: { id_token: string };
      user?: { name?: { firstName?: string; lastName?: string }; email?: string };
    }>;
  };
};

interface SignupProps {
  onSignup: (user: { id: string; username: string; email: string }, token: string) => void;
  onGoLogin: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSignup, onGoLogin }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      AppleID.auth.init({
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: import.meta.env.VITE_APPLE_REDIRECT_URI,
        usePopup: true,
      });
      const response = await AppleID.auth.signIn();
      const { token, user } = await appleAuth(response.authorization.id_token, response.user);
      localStorage.setItem('lumina_token', token);
      localStorage.setItem('lumina_user', JSON.stringify(user));
      onSignup(user, token);
    } catch (err: any) {
      if (err?.error !== 'popup_closed_by_user') {
        setError(err.message || 'Apple sign in failed');
      }
    }
  };

  const handleGoogleSignIn = () => {
    if (typeof google === 'undefined') {
      setError('Google sign in is not ready. Please refresh and try again.');
      return;
    }
    const client = google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: async (response) => {
        try {
          const { token, user } = await googleAuth(response.code);
          localStorage.setItem('lumina_token', token);
          localStorage.setItem('lumina_user', JSON.stringify(user));
          onSignup(user, token);
        } catch (err: any) {
          setError(err.message || 'Google sign in failed');
        }
      },
      error_callback: (err) => {
        if (err.type !== 'popup_closed') setError('Google sign in failed');
      },
    });
    client.requestCode();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const { token, user } = await signup(email, password, username);
      localStorage.setItem('lumina_token', token);
      localStorage.setItem('lumina_user', JSON.stringify(user));
      onSignup(user, token);
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
          <p className="text-white/40">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            name="username"
            type="text"
            placeholder="Username"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={onGoLogin}
            className="text-white/40 text-sm hover:text-white transition-colors"
          >
            Already have an account? Log in
          </button>
        </div>
        <div className="flex gap-4">
          <button onClick={handleAppleSignIn} className="bg-black w-full py-2 rounded-sm flex items-center justify-center hover:bg-black/80">
            <img
            className="w-6 h-6"
            src="./images/apple.svg"
            alt="Apple Login"
            />
          </button>
          <button onClick={handleGoogleSignIn} className="bg-white w-full py-2 rounded-sm flex items-center justify-center hover:bg-white/80">
            <img
            className="w-6 h-6"
            src="./images/google.png"
            alt="Google Login"
            />
          </button>
        </div>
        <InstallButton />
      </div>
    </div>
  );
};
