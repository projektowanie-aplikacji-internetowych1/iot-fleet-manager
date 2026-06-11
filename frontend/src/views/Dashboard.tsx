import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Cpu, AlertCircle, BatteryCharging, AlertTriangle, ShieldCheck, Activity, RefreshCw, Wifi, HardDrive } from 'lucide-react';

interface BatteryData {
  averageBattery: number;
  devices: Array<{
    id: string;
    name: string;
    battery: number;
    ipAddress: string;
  }>;
}

interface StatusData {
  ONLINE: number;
  WARNING: number;
  ERROR: number;
  OFFLINE: number;
}

export const Dashboard: React.FC = () => {
  const [batteryData, setBatteryData] = useState<BatteryData | null>(null);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [devicesList, setDevicesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [battery, status, devices] = await Promise.all([
        api.getBatteryAnalytics(),
        api.getStatusAnalytics(),
        api.getDevices(),
      ]);
      setBatteryData(battery);
      setStatusData(status);
      setDevicesList(devices);
    } catch (err: any) {
      setError(err.message || 'Błąd podczas ładowania analityki');
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
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center gap-4">
        <RefreshCw className="animate-spin text-brand-indigo" size={32} />
        <p className="text-slate-400 text-sm">Wczytywanie analiz telemetrycznych...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 px-6 py-5 rounded-3xl flex flex-col items-center gap-4 text-center max-w-md mx-auto my-10 text-rose-400">
        <AlertCircle size={40} />
        <h3 className="font-bold text-lg text-white">Wystąpił błąd</h3>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => fetchData()}
          className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl text-slate-200 transition-all cursor-pointer"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  const totalDevices = statusData
    ? statusData.ONLINE + statusData.WARNING + statusData.ERROR + statusData.OFFLINE
    : 0;

  const onlineCount = statusData ? statusData.ONLINE + statusData.WARNING + statusData.ERROR : 0;
  const offlineCount = statusData ? statusData.OFFLINE : 0;
  const activeAlarms = statusData ? statusData.WARNING + statusData.ERROR : 0;
  const avgBattery = batteryData ? Math.round(batteryData.averageBattery) : 0;

  const onlineDevices = devicesList.filter(d => {
    const m = d.metrics?.[0];
    return m && m.status !== 'OFFLINE';
  });

  const avgMemory = onlineDevices.length > 0
    ? Math.round(onlineDevices.reduce((acc, d) => acc + (d.metrics?.[0]?.memoryUsage ?? 0), 0) / onlineDevices.length)
    : 0;

  const avgSignal = onlineDevices.length > 0
    ? Math.round(onlineDevices.reduce((acc, d) => acc + (d.metrics?.[0]?.signalStrength ?? -100), 0) / onlineDevices.length)
    : -100;

  const pieData = statusData
    ? [
      { name: 'Sprawne (Online)', value: statusData.ONLINE, color: '#10b981' },
      { name: 'Ostrzeżenie', value: statusData.WARNING, color: '#f59e0b' },
      { name: 'Błąd systemu', value: statusData.ERROR, color: '#f43f5e' },
      { name: 'Wyłączone (Offline)', value: statusData.OFFLINE, color: '#64748b' },
    ].filter(d => d.value > 0)
    : [];

  const barData = batteryData
    ? batteryData.devices.slice(0, 6).map(d => ({
      name: d.name,
      'Bateria (%)': d.battery,
    }))
    : [];

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight">Status Telemetryczny Floty</h3>
          <p className="text-slate-400 text-xs mt-1">Zagregowane podsumowanie odczytów w czasie rzeczywistym</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl text-slate-300 transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Odświeżanie...' : 'Odśwież'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <div className="glass-panel glass-panel-hover p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Urządzenia Online</p>
              <h4 className="text-2xl font-extrabold text-white mt-1.5">
                {onlineCount} <span className="text-slate-600 text-xs font-medium">/ {totalDevices}</span>
              </h4>
            </div>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-500 group-hover:scale-110 transition-transform">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Aktywne w sieci</span>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Urządzenia Offline</p>
              <h4 className="text-2xl font-extrabold text-white mt-1.5">
                {offlineCount} <span className="text-slate-600 text-xs font-medium">/ {totalDevices}</span>
              </h4>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-slate-400 group-hover:scale-110 transition-transform">
              <Cpu size={16} />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500">
            <span>Brak odpowiedzi SNMP</span>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Średnia Bateria</p>
              <h4 className="text-2xl font-extrabold text-white mt-1.5">
                {avgBattery}%
              </h4>
            </div>
            <div className="bg-brand-cyan/10 p-2.5 rounded-xl border border-brand-cyan/20 text-brand-cyan group-hover:scale-110 transition-transform">
              <BatteryCharging size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
              <div
                className="bg-brand-cyan h-1 rounded-full transition-all duration-500"
                style={{ width: `${avgBattery}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Średnie RAM</p>
              <h4 className="text-2xl font-extrabold text-white mt-1.5">
                {avgMemory}%
              </h4>
            </div>
            <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <HardDrive size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
              <div
                className="bg-indigo-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${avgMemory}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Średni Sygnał</p>
              <h4 className="text-2xl font-extrabold text-white mt-1.5">
                {avgSignal} <span className="text-xs text-slate-500 font-medium">dBm</span>
              </h4>
            </div>
            <div className="bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
              <Wifi size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
              <div
                className="bg-teal-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (avgSignal + 100) * 1.4))}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Aktywne Alarmy</p>
              <h4 className={`text-2xl font-extrabold mt-1.5 ${activeAlarms > 0 ? 'text-amber-500' : 'text-white'}`}>
                {activeAlarms}
              </h4>
            </div>
            <div className={`p-2.5 rounded-xl border group-hover:scale-110 transition-transform ${activeAlarms > 0
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
            <Activity size={10} className={activeAlarms > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-500'} />
            <span>Wymaga uwagi</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[400px]">
          <h4 className="text-base font-bold text-white mb-4">Rozkład Statusów Urządzeń</h4>
          {pieData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Brak danych do wyrenderowania wykresu
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#cbd5e1',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[400px]">
          <h4 className="text-base font-bold text-white mb-4">Stan Baterii Urządzeń</h4>
          {barData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Brak urządzeń do wyrenderowania wykresu
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#cbd5e1',
                    }}
                  />
                  <Bar dataKey="Bateria (%)" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry['Bateria (%)'] < 20 ? '#f43f5e' : entry['Bateria (%)'] < 50 ? '#f59e0b' : '#06b6d4'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {batteryData && batteryData.devices.some(d => d.battery < 30) && (
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-rose-500">
          <div className="flex items-center gap-2 text-rose-400 font-bold mb-4 text-sm">
            <AlertCircle size={18} />
            <span>Urządzenia wymagające natychmiastowej obsługi</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batteryData.devices
              .filter(d => d.battery < 30)
              .map(d => (
                <div key={d.id} className="bg-rose-950/20 border border-rose-500/10 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{d.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Host: {d.ipAddress}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-500 font-extrabold text-sm">
                    <BatteryCharging size={16} />
                    <span>{d.battery}%</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
