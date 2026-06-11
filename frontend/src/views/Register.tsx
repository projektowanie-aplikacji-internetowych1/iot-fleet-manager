import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Cpu, Mail, Lock, Building, Shield, AlertTriangle } from 'lucide-react';

import { translateError } from '../utils/errors';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.register({
        email,
        password,
        organizationName,
        role,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-brand-indigo/10 rounded-full blur-[120px] top-[-100px] left-[-100px] pointer-events-none"></div>
      <div className="absolute w-[400px] h-[400px] bg-brand-cyan/5 rounded-full blur-[100px] bottom-[-50px] right-[-50px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative">
        <div className="flex flex-col items-center text-center">
          <div className="bg-brand-indigo/10 p-3.5 rounded-2xl border border-brand-indigo/20 mb-4">
            <Cpu className="text-brand-indigo" size={32} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Rejestracja w systemie
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Zarejestruj się, aby założyć flotę lub dołączyć do istniejącej
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl flex items-start gap-3 text-rose-400 text-xs">
                <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Adres e-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="nazwa@firma.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/30 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-indigo/50 focus:ring-1 focus:ring-brand-indigo/30 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Hasło (min. 6 znaków)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/30 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-indigo/50 focus:ring-1 focus:ring-brand-indigo/30 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Nazwa organizacji / floty
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Building size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="np. SpaceX Fleet"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/30 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-indigo/50 focus:ring-1 focus:ring-brand-indigo/30 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Rola systemowa
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${role === 'USER'
                      ? 'bg-brand-indigo/20 border-brand-indigo/60 text-brand-indigo font-bold'
                      : 'bg-slate-900/20 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                >
                  Użytkownik
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${role === 'ADMIN'
                      ? 'bg-brand-indigo/20 border-brand-indigo/60 text-brand-indigo font-bold'
                      : 'bg-slate-900/20 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                >
                  <Shield size={14} />
                  Administrator
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-indigo to-indigo-600 hover:from-brand-indigo hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md shadow-brand-indigo/25 hover:shadow-brand-indigo/40 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Trwa rejestracja...' : 'Zarejestruj się'}
            </button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            Masz już konto?{' '}
            <Link
              to="/login"
              className="text-brand-indigo hover:text-indigo-400 font-semibold transition-colors duration-150"
            >
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
