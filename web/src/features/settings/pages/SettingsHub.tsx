import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/Tabs';
import { UserListPage } from '../../users/pages/UserListPage';
import { SectorListPage } from '../../sectors/pages/SectorListPage';

export const SettingsHub: React.FC = () => {
  return (
    <div className="max-w-[1000px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-xl font-medium text-zinc-100 tracking-tight">Configurações</h1>
        <p className="text-sm text-zinc-500 mt-1">Gerencie os usuários e os setores da sua infraestrutura.</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-6">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="sectors">Setores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UserListPage />
        </TabsContent>
        
        <TabsContent value="sectors">
          <SectorListPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};
