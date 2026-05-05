import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useDiagnostic } from '../contexts/DiagnosticContext.tsx';

export const TopNavBar = () => {
  const location = useLocation();
  const isWelcome = location.pathname === '/';

  if (isWelcome) return null;

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-3 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 font-display antialiased tracking-tight shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-12">
        <Link to="/" className="text-xl font-bold text-white tracking-tighter">OncoVision AI</Link>
      </div>
      <div className="flex items-center gap-4">
        <button className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">settings</button>
      </div>
    </header>
  );
};

export const SideNavBar = () => {
  const location = useLocation();
  const { isSimulationStarted } = useDiagnostic();
  const isWelcome = location.pathname === '/';

  if (isWelcome) return null;

  const navItems = [
    { label: 'Panel', icon: 'grid_view', path: '/dashboard' },
    { label: 'Configurador de Tumor', icon: 'biotech', path: '/tumor-config' },
    { label: 'Sim. Tratamiento', icon: 'monitoring', path: '/simulation', hidden: !isSimulationStarted },
  ].filter(item => !item.hidden);

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col p-4 z-40 bg-slate-950/60 backdrop-blur-2xl border-r border-white/5 w-64 shadow-2xl font-display text-sm font-medium pt-20">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg glass-panel flex items-center justify-center border border-white/10">
            <span className="material-symbols-outlined text-primary">biotech</span>
          </div>
          <div>
            <h2 className="text-lg font-extrabold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">OncoVision AI</h2>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all scale-100 active:scale-95 ${
              location.pathname === item.path
                ? 'bg-primary/10 text-primary border-r-4 border-primary shadow-[0_0_15px_rgba(173,198,255,0.2)]'
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-8 border-t border-white/5 px-4 pb-4">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <span className="material-symbols-outlined text-primary text-xl mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          <p className="text-[11px] leading-relaxed text-slate-400 font-medium italic">
            "La ciencia y la esperanza avanzan juntas. Cada paso en el tratamiento es un paso hacia la recuperación."
          </p>
        </div>
      </div>
    </aside>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isWelcome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#0e0e10]">
      <SideNavBar />
      <main className={`${!isWelcome ? 'ml-64' : ''} min-h-screen`}>
        {children}
      </main>
    </div>
  );
};
