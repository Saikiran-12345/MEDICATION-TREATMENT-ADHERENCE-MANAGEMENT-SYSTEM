import { describe, it, expect, beforeEach } from 'vitest';
import { drugInteractionService } from './drugInteractionService';
import { dbService } from './dbService';
import type { DrugInteraction } from '../types';

describe('drugInteractionService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  describe('checkInteraction', () => {
    it('should find interaction if it exists in rules', () => {
      // Add a test rule
      const rule: Omit<DrugInteraction, 'id'> = {
        drugA: 'Aspirin',
        drugB: 'Warfarin',
        severity: 'MAJOR',
        description: 'Increases bleeding risk',
        clinicalEffect: 'Severe bleeding',
        recommendation: 'Avoid concurrent use'
      };
      
      drugInteractionService.add(rule);

      const interaction = drugInteractionService.checkInteraction('Aspirin', 'Warfarin');
      expect(interaction).not.toBeNull();
      expect(interaction!.severity).toBe('MAJOR');
      
      // Case-insensitivity check
      const lcInteraction = drugInteractionService.checkInteraction('aspirin', 'warfarin');
      expect(lcInteraction).not.toBeNull();

      // Reverse order check
      const reverse = drugInteractionService.checkInteraction('Warfarin', 'Aspirin');
      expect(reverse).not.toBeNull();
    });

    it('should return null if no interaction exists', () => {
      expect(drugInteractionService.checkInteraction('Water', 'Oxygen')).toBeNull();
    });
  });
});
