import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { PharmacyItem } from '../types';

export const pharmacyService = {
  getAll(): PharmacyItem[] {
    return storageService.get<PharmacyItem[]>(KEYS.PHARMACY_INVENTORY, []);
  },

  getLowStock(): PharmacyItem[] {
    return this.getAll().filter(item => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK');
  },

  getExpired(): PharmacyItem[] {
    return this.getAll().filter(item => item.status === 'EXPIRED' || new Date(item.expiryDate).getTime() < Date.now());
  },

  add(item: Omit<PharmacyItem, 'id' | 'status' | 'lastRestocked'>): PharmacyItem {
    const list = this.getAll();
    
    let status: PharmacyItem['status'] = 'IN_STOCK';
    if (item.stockQuantity === 0) status = 'OUT_OF_STOCK';
    else if (item.stockQuantity < item.reorderLevel) status = 'LOW_STOCK';

    const newItem: PharmacyItem = {
      ...item,
      id: `pharm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      lastRestocked: new Date().toISOString().split('T')[0],
      status
    };
    storageService.set(KEYS.PHARMACY_INVENTORY, [...list, newItem]);
    return newItem;
  },

  updateStock(id: string, newQuantity: number): PharmacyItem | null {
    const list = this.getAll();
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;

    const currentItem = list[index];
    let status: PharmacyItem['status'] = 'IN_STOCK';
    if (newQuantity === 0) status = 'OUT_OF_STOCK';
    else if (newQuantity < currentItem.reorderLevel) status = 'LOW_STOCK';

    const updated: PharmacyItem = {
      ...currentItem,
      stockQuantity: newQuantity,
      status,
      lastRestocked: new Date().toISOString().split('T')[0]
    };

    list[index] = updated;
    storageService.set(KEYS.PHARMACY_INVENTORY, list);
    return updated;
  },

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter(item => item.id !== id);
    if (filtered.length === list.length) return false;
    storageService.set(KEYS.PHARMACY_INVENTORY, filtered);
    return true;
  }
};
