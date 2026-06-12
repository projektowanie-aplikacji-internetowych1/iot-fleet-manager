import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Search, Trash2, Shield, User, RefreshCw, X, AlertTriangle, Edit3 } from 'lucide-react';
import { translateError } from '../utils/errors';

interface UserItem {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  organizationId: string;
  organization?: {
    name: string;
  };
  createdAt: string;
}

export const Users: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [organizationId, setOrganizationId] = useState('');

  const currentUser = api.getCurrentUser();

  const fetchData = async () => {
    try {
      const usersData = await api.getUsers();
      setUsers(usersData);

      const orgs = await api.getOrganizations();
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setOrganizationId(orgs[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Błąd podczas wczytywania danych użytkowników');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setEmail('');
    setPassword('');
    setRole('USER');
    if (organizations.length > 0) {
      setOrganizationId(organizations[0].id);
    }
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEmail(user.email);
    setPassword(''); // keep blank if unchanged
    setRole(user.role);
    setOrganizationId(user.organizationId || (organizations[0]?.id || ''));
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, userEmail: string) => {
    const isSelf = currentUser && currentUser.email === userEmail;
    const confirmMsg = isSelf
      ? 'Czy na pewno chcesz usunąć swoje własne konto? Ta operacja jest nieodwracalna, a Twoje dane zostaną bezpowrotnie skasowane.'
      : `Czy na pewno chcesz usunąć użytkownika "${userEmail}"?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      if (isSelf) {
        await api.deleteProfile();
        alert('Twoje konto zostało pomyślnie usunięte.');
        api.logout();
        navigate('/login');
      } else {
        await api.deleteUser(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (err: any) {
      const translated = translateError(err.message || 'Błąd podczas usuwania użytkownika');
      alert(translated);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      const payload: any = {
        email,
        role,
        organizationId,
      };

      if (editingUser) {
        if (password) {
          if (password.length < 6) {
            throw new Error('Hasło musi mieć co najmniej 6 znaków');
          }
          payload.password = password;
        }
        await api.updateUser(editingUser.id, payload);
      } else {
        if (!password || password.length < 6) {
          throw new Error('Hasło jest wymagane i musi mieć co najmniej 6 znaków');
        }
        payload.password = password;
        await api.createUser(payload);
      }

      const updatedList = await api.getUsers();
      setUsers(updatedList);
      setIsModalOpen(false);
    } catch (err: any) {
      const translated = translateError(err.message || 'Błąd zapisu użytkownika');
      setModalError(translated);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.organization?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center gap-4">
        <RefreshCw className="animate-spin text-brand-indigo" size={32} />
        <p className="text-slate-400 text-sm">Wczytywanie listy użytkowników...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl flex items-start gap-3 text-rose-400 text-xs">
          <AlertTriangle className="shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/25 p-5 rounded-2xl border border-slate-900/50 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Szukaj po emailu lub organizacji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/45 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-brand-indigo/50 transition-all"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-indigo to-indigo-600 hover:from-brand-indigo hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-indigo/15 hover:shadow-brand-indigo/35 transition-all duration-200 cursor-pointer"
        >
          <Plus size={16} />
          Dodaj użytkownika
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900/80 bg-slate-900/10">
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Użytkownik</th>
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Rola</th>
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Organizacja</th>
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Zarejestrowany</th>
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                    Brak użytkowników spełniających kryteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const dateString = new Date(user.createdAt).toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });

                  return (
                    <tr key={user.id} className="hover:bg-slate-900/15 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-100">{user.email}</td>
                      <td className="px-6 py-4">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <Shield size={12} />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo">
                            <User size={12} />
                            USER
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                        {user.organization?.name || 'Brak'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{dateString}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-2 bg-slate-900 border border-slate-800 hover:border-brand-indigo/25 hover:bg-brand-indigo/10 text-slate-500 hover:text-brand-indigo rounded-lg transition-all cursor-pointer"
                            title="Edytuj"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.email)}
                            className="p-2 bg-slate-900 border border-slate-800 hover:border-rose-500/20 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                            title="Usuń"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-900 bg-slate-900/20">
              <div className="flex items-center gap-2 text-brand-indigo font-bold">
                {editingUser ? <Edit3 size={18} /> : <Plus size={18} />}
                <span>{editingUser ? 'Edytuj Użytkownika' : 'Dodaj Nowego Użytkownika'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-5">
              {modalError && (
                <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl flex items-start gap-3 text-rose-400 text-xs">
                  <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Adres Email</label>
                <input
                  type="email"
                  required
                  placeholder="np. user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-indigo/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  {editingUser ? 'Zmień hasło (opcjonalnie)' : 'Hasło'}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? 'Pozostaw puste, aby nie zmieniać...' : 'Wpisz hasło (min 6 znaków)...'}
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-indigo/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Rola w systemie</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-indigo/50 cursor-pointer"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Organizacja</label>
                  <select
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-indigo/50 cursor-pointer"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl text-slate-300 cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-indigo to-indigo-600 hover:from-brand-indigo hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
