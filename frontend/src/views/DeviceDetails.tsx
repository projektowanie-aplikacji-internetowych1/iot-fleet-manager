import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArrowLeft, RefreshCw, Cpu, Server, Key, Calendar, Activity, Battery, Thermometer, Clock } from 'lucide-react';

interface MetricPoint {
  id: string;
  battery: number;
  uptime: number;
  temperature: number;
  status: string;
  collectedAt: string;
}

interface DeviceDetails {
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
}

export const DeviceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<DeviceDetails | null>(null);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isSilent = false) => {
    if (!id) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [deviceData, metricsData] = await Promise.all([
        api.getDevice(id),
        api.getDeviceMetrics(id),
      ]);
      setDevice(deviceData);
      setMetrics(metricsData);
    } catch (err: any) {
      setError(err.message || 'Błąd wczytywania danych urządzenia');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}g`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);

    return parts.join(' ');
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center gap-4">
        <RefreshCw className="animate-spin text-brand-indigo" size={32} />
        <p className="text-slate-400 text-sm">Pobieranie historii odczytów...</p>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 px-6 py-5 rounded-3xl flex flex-col items-center gap-4 text-center max-w-md mx-auto my-10 text-rose-400">
        <Cpu size={40} />
        <h3 className="font-bold text-lg text-white">Błąd wczytywania</h3>
        <p className="text-sm">{error || 'Urządzenie nie zostało znalezione'}</p>
        <div className="flex gap-3">
          <Link
            to="/devices"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white"
          >
            <ArrowLeft size={14} />
            Powrót
          </Link>
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-brand-indigo hover:bg-indigo-600 text-xs font-semibold rounded-xl text-white cursor-pointer"
          >
            Ponów próbę
          </button>
        </div>
      </div>
    );
  }

  const latestMetric = metrics[metrics.length - 1];
  const currentStatus = latestMetric ? latestMetric.status : 'OFFLINE';
  const currentUptime = latestMetric ? latestMetric.uptime : 0;
  const currentTemp = latestMetric ? latestMetric.temperature : 0;
  const currentBattery = latestMetric ? latestMetric.battery : 0;

  const chartData = [...metrics].map((m) => ({
    time: formatTime(m.collectedAt),
    'Bateria (%)': m.battery,
    'Temperatura (°C)': m.temperature,
    'Czas Uptime (s)': m.uptime,
  }));

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'Sprawne działanie';
      case 'WARNING':
        return 'Wymagany przegląd (Ostrzeżenie)';
      case 'ERROR':
        return 'Błąd krytyczny hardware';
      default:
        return 'Offline';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'WARNING':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'ERROR':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/devices"
            className="p-2.5 bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{device.name}</h3>
            <p className="text-slate-400 text-xs mt-0.5">Szczegółowa analityka telemetryczna urządzenia IoT</p>
          </div>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl text-slate-300 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Aktualizowanie...' : 'Odśwież dane'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className={`p-3 rounded-xl border ${getStatusBadgeClass(currentStatus)}`}>
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status SNMP</p>
            <p className="text-xs font-extrabold text-slate-200 mt-1 uppercase">{currentStatus}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{getStatusText(currentStatus)}</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-brand-cyan/10 p-3 rounded-xl border border-brand-cyan/20 text-brand-cyan">
            <Battery size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Poziom Baterii</p>
            <p className="text-xl font-extrabold text-white mt-1">{currentStatus === 'OFFLINE' ? '—' : `${currentBattery}%`}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Zasilanie ogniw litowych</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 text-orange-500">
            <Thermometer size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Temperatura OID</p>
            <p className="text-xl font-extrabold text-white mt-1">{currentStatus === 'OFFLINE' ? '—' : `${currentTemp}°C`}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Odczyt sensora pokładowego</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-500">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Czas Pracy (Uptime)</p>
            <p className="text-sm font-extrabold text-white mt-1.5 truncate max-w-[150px]">{currentStatus === 'OFFLINE' ? '—' : formatUptime(currentUptime)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Nieprzerwane działanie</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 rounded-2xl space-y-6 lg:col-span-1">
          <h4 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-slate-900 pb-3">Konfiguracja Połączenia</h4>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
              <span className="text-slate-500 flex items-center gap-1.5"><Server size={14} /> Adres hosta</span>
              <span className="font-mono text-slate-200 font-semibold">{device.ipAddress}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
              <span className="text-slate-500 flex items-center gap-1.5"><Clock size={14} /> Port UDP</span>
              <span className="font-mono text-slate-200 font-semibold">{device.port}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
              <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={14} /> Organizacja</span>
              <span className="text-slate-200 font-semibold">{device.organization?.name || 'Brak'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
              <span className="text-slate-500 flex items-center gap-1.5"><Key size={14} /> Protokół SNMP</span>
              <span className="text-brand-indigo font-bold">SNMPv3</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
              <span className="text-slate-500 flex items-center gap-1.5">Security User</span>
              <span className="font-mono text-slate-200 font-semibold">{device.snmpUsername}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
              <span className="text-slate-500">Uwierzytelnienie</span>
              <span className="text-slate-200 font-semibold uppercase">{device.authProtocol}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Prywatność (Szyfr)</span>
              <span className="text-slate-200 font-semibold uppercase">{device.privacyProtocol}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[350px] lg:col-span-2">
          <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Battery size={16} className="text-brand-cyan" />
            <span>Wykres Poziomu Baterii (%)</span>
          </h4>
          {chartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Brak historii odczytów dla tego urządzenia
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#475569" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Bateria (%)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#batteryGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[300px]">
          <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Thermometer size={16} className="text-orange-500" />
            <span>Wykres Temperatury (°C)</span>
          </h4>
          {chartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Brak historii odczytów dla tego urządzenia
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Temperatura (°C)"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[300px]">
          <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={16} className="text-emerald-500" />
            <span>Logarytm Przyrostu Uptime (sekundy)</span>
          </h4>
          {chartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Brak historii odczytów dla tego urządzenia
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Czas Uptime (s)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#uptimeGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
