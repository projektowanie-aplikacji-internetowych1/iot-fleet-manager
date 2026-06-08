import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { LayoutDashboard, Cpu, LogOut, Shield, Building, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = api.getCurrentUser();

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Panel Główny',
      path: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: 'Urządzenia Fleet',
      path: '/devices',
      icon: <Cpu size={20} />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <aside className="w-64 glass-panel border-r border-slate-900 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-brand-indigo/10 p-2 rounded-xl border border-brand-indigo/30">
              <Cpu className="text-brand-indigo animate-pulse" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wider uppercase text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Fleet IoT
              </h1>
              <span className="text-xs text-slate-500 font-medium">Control Manager</span>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-brand-indigo/20 to-brand-indigo/5 text-brand-indigo border border-brand-indigo/25 shadow-lg shadow-brand-indigo/10 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                    }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-900/60">
          {currentUser && (
            <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-900/50 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="bg-slate-800 p-1.5 rounded-lg">
                  <User size={16} className="text-slate-400" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    {currentUser.role === 'ADMIN' ? (
                      <>
                        <Shield size={10} className="text-amber-500" />
                        <span>Administrator</span>
                      </>
                    ) : (
                      <span>Użytkownik</span>
                    )}
                  </p>
                </div>
              </div>

              {currentUser.organization && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/50 px-2 py-1.5 rounded-lg border border-slate-800/40">
                  <Building size={12} className="text-brand-indigo" />
                  <span className="truncate">{currentUser.organization.name}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-semibold">Wyloguj się</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <header className="py-5 px-8 flex justify-between items-center border-b border-slate-900/60 bg-slate-950/45 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-white">
              {location.pathname === '/dashboard' ? 'Panel Główny' : 'Zarządzanie Flotą Urządzeń'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {location.pathname === '/dashboard'
                ? 'Przegląd telemetryczny i agregaty stanu floty urządzeń'
                : 'Konfiguracja, dodawanie, usuwanie i podgląd szczegółów urządzeń IoT'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-semibold text-slate-400">System aktywny</span>
          </div>
        </header>

        <div className="p-8 flex-1">{children}</div>
      </main>
    </div>
  );
};
