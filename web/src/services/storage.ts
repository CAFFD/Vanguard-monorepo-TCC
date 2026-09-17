import type { User } from '../features/users/types';
import type { Equipment } from '../features/equipments/types';
import type { Occurrence } from '../features/occurrences/types';
import { mockedSectors } from '../mocks/sectors';
import type { Sector } from '../mocks/sectors';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const StorageService = {
  // POST /users placeholder
  async saveUser(user: User): Promise<void> {
    await delay(600); // Simulando rede
    const users = this.getUsers();
    
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error("E-mail já está em uso.");
    }

    users.push(user);
    localStorage.setItem('@gestaoAtivos:users', JSON.stringify(users));
  },

  getUsers(): User[] {
    const data = localStorage.getItem('@gestaoAtivos:users');
    return data ? JSON.parse(data) : [];
  },

  // POST /equipments placeholder
  async saveEquipment(equipment: Equipment): Promise<void> {
    await delay(600);
    const equipments = this.getEquipments();
    
    if (equipments.some(e => e.macAddress === equipment.macAddress)) {
      throw new Error("Endereço MAC já cadastrado.");
    }
    if (equipments.some(e => e.patrimonyTag === equipment.patrimonyTag)) {
      throw new Error("Número de patrimônio já cadastrado.");
    }
    if (equipments.some(e => e.hostname === equipment.hostname)) {
      throw new Error("Hostname já cadastrado.");
    }

    equipments.push(equipment);
    localStorage.setItem('@gestaoAtivos:equipments', JSON.stringify(equipments));
  },

  getEquipments(): Equipment[] {
    const data = localStorage.getItem('@gestaoAtivos:equipments');
    return data ? JSON.parse(data) : [];
  },

  // POST /sectors placeholder
  async saveSector(sector: Sector): Promise<void> {
    await delay(600);
    const sectors = await this.getSectors();
    
    // Validar duplicidade considerando case insensitive e acentos (forma simplificada)
    const normalizedNewName = sector.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    if (sectors.some(s => {
      const normalizedExisting = s.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return normalizedExisting === normalizedNewName;
    })) {
      throw new Error("Já existe um setor cadastrado com este nome.");
    }

    sectors.push(sector);
    localStorage.setItem('@gestaoAtivos:sectors', JSON.stringify(sectors));
  },

  // GET /sectors placeholder
  async getSectors(): Promise<Sector[]> {
    await delay(400);
    const data = localStorage.getItem('@gestaoAtivos:sectors');
    if (data) {
      return JSON.parse(data);
    }
    
    // Seed initial data if empty
    localStorage.setItem('@gestaoAtivos:sectors', JSON.stringify(mockedSectors));
    return mockedSectors;
  },

  // POST /occurrences placeholder
  async saveOccurrence(occurrence: Occurrence): Promise<void> {
    await delay(600);
    const occurrences = this.getOccurrences();
    occurrences.push(occurrence);
    localStorage.setItem('@gestaoAtivos:occurrences', JSON.stringify(occurrences));
  },

  getOccurrences(): Occurrence[] {
    const data = localStorage.getItem('@gestaoAtivos:occurrences');
    return data ? JSON.parse(data) : [];
  }
};
