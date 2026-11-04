import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { UserRegistrationPage } from '../features/users/pages/UserRegistrationPage';
import { EquipmentRegistrationPage } from '../features/equipments/pages/EquipmentRegistrationPage';
import { EquipmentListPage } from '../features/equipments/pages/EquipmentListPage';
import { EquipmentDetail } from '../features/equipments/pages/EquipmentDetail';
import { SectorRegistrationPage } from '../features/sectors/pages/SectorRegistrationPage';
import { OccurrenceRegistrationPage } from '../features/occurrences/pages/OccurrenceRegistrationPage';
import { OccurrenceListPage } from '../features/occurrences/pages/OccurrenceListPage';
import { TelemetryDashboard } from '../features/dashboard/pages/TelemetryDashboard';
import { SettingsHub } from '../features/settings/pages/SettingsHub';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Rota pública de autenticação */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas protegidas (GESTOR e TECNICO) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<TelemetryDashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Hub de Chamados (ambos os perfis) */}
          <Route path="/chamados" element={<OccurrenceListPage />} />
          <Route path="/chamados/cadastrar" element={<OccurrenceRegistrationPage />} />

          {/* Hub de Equipamentos / Prontuários */}
          <Route path="/equipamentos" element={<EquipmentListPage />} />
          <Route path="/equipamentos/:id" element={<EquipmentDetail />} />

          {/* Hub de Configurações (visualização aberta; ações de criação/exclusão restritas a GESTOR) */}
          <Route path="/configuracoes" element={<SettingsHub />} />

          {/* Rotas administrativas exclusivas do perfil GESTOR */}
          <Route element={<ProtectedRoute allowedRoles={['GESTOR']} />}>
            <Route path="/equipamentos/cadastrar" element={<EquipmentRegistrationPage />} />
            <Route path="/usuarios/cadastrar" element={<UserRegistrationPage />} />
            <Route path="/setores/cadastrar" element={<SectorRegistrationPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};
