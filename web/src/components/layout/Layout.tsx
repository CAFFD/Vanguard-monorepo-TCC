import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, X, Users, Monitor, Shield, Building2, ClipboardList, Server } from 'lucide-react';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navLinks = [
    { to: '/equipamentos', label: 'Prontuário', icon: <Server size={18} /> },
    { to: '/usuarios/cadastrar', label: 'Cadastrar usuário', icon: <Users size={18} /> },
    { to: '/equipamentos/cadastrar', label: 'Cadastrar equipamento', icon: <Monitor size={18} /> },
    { to: '/chamados/cadastrar', label: 'Cadastrar chamado', icon: <ClipboardList size={18} /> },
    { to: '/setores/cadastrar', label: 'Cadastrar setor', icon: <Building2 size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[var(--color-border)]">
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)]">
          <Shield className="text-[var(--color-primary)] mr-2" size={24} />
          <div>
            <h1 className="font-bold text-[var(--color-text-main)] leading-tight text-sm">Gestão de Ativos</h1>
            <p className="text-xs text-[var(--color-text-secondary)]">Prefeitura Municipal</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text-main)]'
                }`
              }
            >
              <span className="mr-3">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="md:hidden h-16 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-4">
          <div className="flex items-center">
            <Shield className="text-[var(--color-primary)] mr-2" size={24} />
            <div>
              <h1 className="font-bold text-[var(--color-text-main)] leading-tight text-sm">Gestão de Ativos</h1>
            </div>
          </div>
          <button onClick={toggleSidebar} className="text-[var(--color-text-main)] p-2">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={toggleSidebar}>
            <aside className="w-64 h-full bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-border)]">
                <div className="flex items-center">
                  <Shield className="text-[var(--color-primary)] mr-2" size={24} />
                  <div>
                    <h1 className="font-bold text-sm leading-tight">Gestão de Ativos</h1>
                    <p className="text-xs text-gray-500">Prefeitura Municipal</p>
                  </div>
                </div>
                <button onClick={toggleSidebar} className="p-2">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={toggleSidebar}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'
                      }`
                    }
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
