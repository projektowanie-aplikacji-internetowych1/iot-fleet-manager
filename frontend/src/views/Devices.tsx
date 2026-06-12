import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Search, Trash2, Eye, Server, RefreshCw, X, AlertTriangle, Key, Edit } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  snmpUsername: string;
  authProtocol: string;
  privacyProtocol: string;
  organizationId: string;
  organization: {
    name: string;
  };
  metrics: Array<{
    battery: number;
    status: string;
    collectedAt: string;
  }>;
}

export const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = api.getCurrentUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState({
    name: '',
    ipAddress: '',
    port: 161,
    snmpUsername: 'bootstrapUser',
    authProtocol: 'SHA',
    authPasswordHash: 'authPassword123',
    privacyProtocol: 'AES',
    privacyPasswordHash: 'privPassword456',
    organizationId: '',
  });

  const fetchDevices = async () => {
    try {
      const data = await api.getDevices();
      setDevices(data);

      if (currentUser?.role === 'ADMIN') {
        const orgs = await api.getOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0) {
          setNewDevice((prev) => ({ ...prev, organizationId: orgs[0].id }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Błąd podczas wczytywania urządzeń');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.pollAllDevices();
      const data = await api.getDevices();
      setDevices(data);
    } catch (err: any) {
      alert(err.message || 'Błąd podczas odpytywania urządzeń');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć urządzenie "${name}"?`)) {
      return;
    }

    try {
      await api.deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Błąd podczas usuwania urządzenia');
    }
  };

  const handleOpenCreate = () => {
    setEditingDevice(null);
    setNewDevice({
      name: '',
      ipAddress: '',
      port: 161,
      snmpUsername: 'bootstrapUser',
      authProtocol: 'SHA',
      authPasswordHash: 'authPassword123',
      privacyProtocol: 'AES',
      privacyPasswordHash: 'privPassword456',
      organizationId: organizations[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (device: Device) => {
    setEditingDevice(device);
    setNewDevice({
      name: device.name,
      ipAddress: device.ipAddress,
      port: device.port,
      snmpUsername: device.snmpUsername,
      authProtocol: device.authProtocol,
      authPasswordHash: '',
      privacyProtocol: device.privacyProtocol,
      privacyPasswordHash: '',
      organizationId: device.organizationId,
    });
    setIsModalOpen(true);
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      const payload: any = {
        name: newDevice.name,
        ipAddress: newDevice.ipAddress,
        port: Number(newDevice.port),
        snmpUsername: newDevice.snmpUsername,
        authProtocol: newDevice.authProtocol,
        privacyProtocol: newDevice.privacyProtocol,
      };

      if (editingDevice) {
        if (newDevice.authProtocol !== 'NONE') {
          if (newDevice.authPasswordHash) {
            payload.authPasswordHash = newDevice.authPasswordHash;
          }
        } else {
          payload.authPasswordHash = null;
        }

        if (newDevice.privacyProtocol !== 'NONE') {
          if (newDevice.privacyPasswordHash) {
            payload.privacyPasswordHash = newDevice.privacyPasswordHash;
          }
        } else {
          payload.privacyPasswordHash = null;
        }
      } else {
        if (newDevice.authProtocol !== 'NONE') {
          payload.authPasswordHash = newDevice.authPasswordHash;
        }
        if (newDevice.privacyProtocol !== 'NONE') {
          payload.privacyPasswordHash = newDevice.privacyPasswordHash;
        }
      }

      if (currentUser?.role === 'ADMIN' && newDevice.organizationId) {
        payload.organizationId = newDevice.organizationId;
      }

      if (editingDevice) {
        await api.updateDevice(editingDevice.id, payload);
        const allDevices = await api.getDevices();
        setDevices(allDevices);
      } else {
        await api.createDevice(payload);
        const allDevices = await api.getDevices();
        setDevices(allDevices);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Nie udało się zapisać urządzenia');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredDevices = devices.filter((device) => {
    const latestMetric = device.metrics?.[0];
    const status = latestMetric ? latestMetric.status : 'OFFLINE';

    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ipAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            SPRAWNY
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
            OSTRZEŻENIE
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">
            BŁĄD SYSTEMU
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-400">
            OFFLINE
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center gap-4">
        <RefreshCw className="animate-spin text-brand-indigo" size={32} />
        <p className="text-slate-400 text-sm">Wczytywanie listy urządzeń...</p>
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
            placeholder="Szukaj po nazwie lub adresie IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/45 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-brand-indigo/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-950/45 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-indigo/50 cursor-pointer"
          >
            <option value="ALL">Wszystkie statusy</option>
            <option value="ONLINE">Sprawne (Online)</option>
            <option value="WARNING">Ostrzeżenia</option>
            <option value="ERROR">Błędy</option>
            <option value="OFFLINE">Wyłączone (Offline)</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Odświeżanie...' : 'Odśwież'}
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-indigo to-indigo-600 hover:from-brand-indigo hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-indigo/15 hover:shadow-brand-indigo/35 transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} />
            Dodaj urządzenie
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900/80 bg-slate-900/10">
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Urządzenie</th>
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Adres IP & Port</th>
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Organizacja</th>
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Bateria</th>
                <th className="px-6 py-4.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-sm">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    Brak urządzeń spełniających kryteria wyszukiwania.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const latestMetric = device.metrics?.[0];
                  const status = latestMetric ? latestMetric.status : 'OFFLINE';
                  const battery = latestMetric ? latestMetric.battery : 0;

                  return (
                    <tr key={device.id} className="hover:bg-slate-900/15 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${status === 'ONLINE'
                            ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-500'
                            : status === 'OFFLINE'
                              ? 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                              : 'bg-rose-500/5 border-rose-500/15 text-rose-400'
                            }`}>
                            <Server size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">{device.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium uppercase tracking-wider">SNMPv3 Secured</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {device.ipAddress}:{device.port}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                        {device.organization?.name || 'Brak'}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(status)}</td>
                      <td className="px-6 py-4">
                        {status === 'OFFLINE' ? (
                          <span className="text-xs text-slate-600">—</span>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${battery < 20 ? 'bg-rose-500' : battery < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                style={{ width: `${battery}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-bold ${battery < 20 ? 'text-rose-400' : battery < 50 ? 'text-amber-400' : 'text-slate-200'
                              }`}>
                              {battery}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/devices/${device.id}`}
                            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                            title="Szczegóły"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(device)}
                            className="p-2 bg-slate-900 border border-slate-800 hover:border-brand-indigo/25 hover:bg-brand-indigo/10 text-slate-500 hover:text-brand-indigo rounded-lg transition-all cursor-pointer"
                            title="Edytuj"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(device.id, device.name)}
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
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-900 bg-slate-900/20">
              <div className="flex items-center gap-2 text-brand-indigo font-bold">
                {editingDevice ? <Edit size={18} /> : <Plus size={18} />}
                <span>{editingDevice ? 'Edytuj Urządzenie SNMPv3' : 'Dodaj Nowe Urządzenie SNMPv3'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="p-6 space-y-6">
              {modalError && (
                <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl flex items-start gap-3 text-rose-400 text-xs">
                  <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Nazwa urządzenia</label>
                  <input
                    type="text"
                    required
                    placeholder="np. Drone Delta"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-indigo/50 focus:ring-1 focus:ring-brand-indigo/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Adres IP / Host</label>
                  <input
                    type="text"
                    required
                    placeholder="np. mock-device-3"
                    value={newDevice.ipAddress}
                    onChange={(e) => setNewDevice((prev) => ({ ...prev, ipAddress: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-indigo/50 focus:ring-1 focus:ring-brand-indigo/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Port UDP</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={65535}
                    value={newDevice.port}
                    onChange={(e) => setNewDevice((prev) => ({ ...prev, port: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-indigo/50 focus:ring-1 focus:ring-brand-indigo/20 transition-all"
                  />
                </div>
              </div>

              {currentUser?.role === 'ADMIN' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Wybierz organizację</label>
                  <select
                    value={newDevice.organizationId}
                    onChange={(e) => setNewDevice((prev) => ({ ...prev, organizationId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-900/30 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-indigo/50 cursor-pointer"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-5 bg-slate-900/10 rounded-2xl border border-slate-900/60 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Key size={14} className="text-brand-indigo" />
                  <span>Poświadczenia Bezpieczeństwa SNMPv3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400">Security Username</label>
                    <input
                      type="text"
                      required
                      placeholder="bootstrapUser"
                      value={newDevice.snmpUsername}
                      onChange={(e) => setNewDevice((prev) => ({ ...prev, snmpUsername: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-slate-950/45 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-indigo/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400">Protokół autoryzacji</label>
                    <select
                      value={newDevice.authProtocol}
                      onChange={(e) => setNewDevice((prev) => ({ ...prev, authProtocol: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950/45 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-indigo/50"
                    >
                      <option value="NONE">NONE</option>
                      <option value="MD5">MD5</option>
                      <option value="SHA">SHA</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400">Klucz autoryzacji</label>
                    <input
                      type="password"
                      disabled={newDevice.authProtocol === 'NONE'}
                      placeholder="Wpisz klucz..."
                      value={newDevice.authPasswordHash}
                      onChange={(e) => setNewDevice((prev) => ({ ...prev, authPasswordHash: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-slate-950/45 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-indigo/50 disabled:opacity-30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1"></div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400">Protokół prywatności (Szyfr)</label>
                    <select
                      value={newDevice.privacyProtocol}
                      disabled={newDevice.authProtocol === 'NONE'}
                      onChange={(e) => setNewDevice((prev) => ({ ...prev, privacyProtocol: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950/45 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-indigo/50 disabled:opacity-30"
                    >
                      <option value="NONE">NONE</option>
                      <option value="DES">DES</option>
                      <option value="AES">AES</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400">Klucz prywatności (Szyfru)</label>
                    <input
                      type="password"
                      disabled={newDevice.privacyProtocol === 'NONE' || newDevice.authProtocol === 'NONE'}
                      placeholder="Wpisz klucz..."
                      value={newDevice.privacyPasswordHash}
                      onChange={(e) => setNewDevice((prev) => ({ ...prev, privacyPasswordHash: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-slate-950/45 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-indigo/50 disabled:opacity-30"
                    />
                  </div>
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
