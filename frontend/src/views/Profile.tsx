import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, Shield, Key, AlertTriangle, CheckCircle, RefreshCw, Building, Trash2 } from 'lucide-react';
import { translateError } from '../utils/errors';

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);



  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
      setEmail(data.email);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas wczytywania profilu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password && password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload: any = { email };
      if (password) {
        payload.password = password;
      }

      const updated = await api.updateProfile(payload);
      setSuccess('Profil został zaktualizowany pomyślnie');

      const current = api.getCurrentUser();
      if (current) {
        current.email = updated.email;
        localStorage.setItem('user_info', JSON.stringify(current));
      }

      setPassword('');
      setConfirmPassword('');
      setProfile((prev: any) => ({ ...prev, email: updated.email }));
    } catch (err: any) {
      const translated = translateError(err.message || 'Błąd podczas aktualizacji profilu');
      setError(translated);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna, a Twoje dane zostaną bezpowrotnie skasowane.')) {
      return;
    }

    try {
      await api.deleteProfile();
      alert('Konto zostało pomyślnie usunięte.');
      api.logout();
    } catch (err: any) {
      setError(err.message || 'Nie udało się usunąć konta');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center gap-4">
        <RefreshCw className="animate-spin text-brand-indigo" size={32} />
        <p className="text-slate-400 text-sm">Wczytywanie profilu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl flex items-start gap-3 text-rose-400 text-xs">
          <AlertTriangle className="shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-2xl flex items-start gap-3 text-emerald-400 text-xs">
          <CheckCircle className="shrink-0 mt-0.5" size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="glass-panel p-6 rounded-3xl border border-slate-900 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-900/60">
          <div className="bg-brand-indigo/10 p-3 rounded-2xl border border-brand-indigo/25 text-brand-indigo">
            <User size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Informacje o profilu</h3>
            <p className="text-xs text-slate-500 mt-0.5">Twoje dane autoryzacyjne w systemie</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Rola w systemie</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/40 border border-slate-900/80 rounded-xl text-xs text-slate-300 font-medium">
                {profile?.role === 'ADMIN' ? (
                  <>
                    <Shield size={14} className="text-amber-500" />
                    <span>Administrator</span>
                  </>
                ) : (
                  <>
                    <User size={14} className="text-brand-indigo" />
                    <span>Użytkownik standardowy</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Przynależność do organizacji</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/40 border border-slate-900/80 rounded-xl text-xs text-slate-300 font-medium">
                <Building size={14} className="text-brand-indigo/70" />
                <span>{profile?.organization?.name || 'Brak'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Adres Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-indigo/50 focus:ring-1 focus:ring-brand-indigo/20 transition-all"
            />
          </div>

          <div className="p-5 bg-slate-900/10 rounded-2xl border border-slate-900/60 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Key size={14} className="text-brand-indigo" />
              <span>Zmień hasło (opcjonalnie)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">Nowe hasło</label>
                <input
                  type="password"
                  placeholder="Wpisz nowe hasło..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/45 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-indigo/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">Potwierdź nowe hasło</label>
                <input
                  type="password"
                  placeholder="Powtórz nowe hasło..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/45 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-indigo/50"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-900">
            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-indigo to-indigo-600 hover:from-brand-indigo hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
            >
              {submitLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-rose-500/10 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-rose-500/10">
          <div className="bg-rose-500/10 p-3 rounded-2xl border border-rose-500/25 text-rose-400">
            <Trash2 size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Usuń konto</h3>
            <p className="text-xs text-slate-500 mt-0.5">Trwałe usunięcie Twojego konta użytkownika w systemie</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs text-slate-400 max-w-md">
            Po usunięciu konta zostaniesz wylogowany. Twój adres e-mail zostanie zwolniony i będzie można go użyć do ponownej rejestracji.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer"
          >
            <Trash2 size={14} />
            Usuń konto
          </button>
        </div>
      </div>
    </div>
  );
};
