import { describe, it, expect, beforeEach } from 'vitest';
import { pharmacyService } from './pharmacyService';
import { dbService } from './dbService';
import type { PharmacyItem } from '../types';

describe('pharmacyService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  describe('getAll', () => {
    it('should return all pharmacy inventory items', () => {
      const list = pharmacyService.getAll();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('updateStock', () => {
    it('should update stock quantities and status flags accordingly', () => {
      const item: Omit<PharmacyItem, 'id' | 'status' | 'lastRestocked'> = {
        medicationName: 'Gabapentin',
        genericName: 'Gabapentin',
        manufacturer: 'PharmaCorp',
        batchNumber: 'BAT-123',
        stockQuantity: 100,
        reorderLevel: 30,
        unitPrice: 1.5,
        expiryDate: '2027-01-01',
        category: 'Prescription',
        location: 'Bin A'
      };

      const added = pharmacyService.add(item);
      expect(added.status).toBe('IN_STOCK');

      // Update to low stock
      const updated1 = pharmacyService.updateStock(added.id, 20);
      expect(updated1!.status).toBe('LOW_STOCK');

      // Update to out of stock
      const updated2 = pharmacyService.updateStock(added.id, 0);
      expect(updated2!.status).toBe('OUT_OF_STOCK');
    });
  });
});
