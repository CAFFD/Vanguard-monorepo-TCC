import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { UserRegistrationPage } from '../features/users/pages/UserRegistrationPage';
import { EquipmentRegistrationPage } from '../features/equipments/pages/EquipmentRegistrationPage';
import { EquipmentListPage } from '../features/equipments/pages/EquipmentListPage';
import { EquipmentDetail } from '../features/equipments/pages/EquipmentDetail';
import { SectorRegistrationPage } from '../features/sectors/pages/SectorRegistrationPage';
import { OccurrenceRegistrationPage } from '../features/occurrences/pages/OccurrenceRegistrationPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/usuarios/cadastrar" element={<UserRegistrationPage />} />
        <Route path="/equipamentos" element={<EquipmentListPage />} />
        <Route path="/equipamentos/cadastrar" element={<EquipmentRegistrationPage />} />
        <Route path="/equipamentos/:id" element={<EquipmentDetail />} />
        <Route path="/setores/cadastrar" element={<SectorRegistrationPage />} />
        <Route path="/chamados/cadastrar" element={<OccurrenceRegistrationPage />} />
        <Route path="*" element={<Navigate to="/usuarios/cadastrar" replace />} />
      </Route>
    </Routes>
  );
};
