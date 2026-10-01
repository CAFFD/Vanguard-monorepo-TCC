import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/chamados', label: 'Chamados' },
    { to: '/equipamentos', label: 'Equipamentos' },
    { to: '/configuracoes', label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-zinc-800">
      {/* Top-Nav estilo Vercel */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-6 max-w-[1400px] mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-3 pr-6 border-r border-white/10 mr-6">
            <div className="w-3 h-3 bg-zinc-100" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            <span className="font-semibold text-sm text-zinc-100 tracking-tight">Vanguard</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'text-zinc-100 bg-white/10 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      
      {/* Conteúdo Principal */}
      <main className="max-w-[1400px] mx-auto w-full p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
};
