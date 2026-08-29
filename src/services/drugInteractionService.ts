import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { DrugInteraction } from '../types';

export const drugInteractionService = {
  getAll(): DrugInteraction[] {
    return storageService.get<DrugInteraction[]>(KEYS.DRUG_INTERACTIONS, []);
  },

  checkInteraction(drugA: string, drugB: string): DrugInteraction | null {
    const nameA = drugA.trim().toUpperCase();
    const nameB = drugB.trim().toUpperCase();

    const rules = this.getAll();
    return rules.find(rule => {
      const ruleA = rule.drugA.trim().toUpperCase();
      const ruleB = rule.drugB.trim().toUpperCase();
      
      return (ruleA === nameA && ruleB === nameB) || (ruleA === nameB && ruleB === nameA);
    }) || null;
  },

  checkMultiple(drugs: string[]): DrugInteraction[] {
    const interactions: DrugInteraction[] = [];
    if (drugs.length < 2) return [];

    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const interaction = this.checkInteraction(drugs[i], drugs[j]);
        if (interaction) {
          interactions.push(interaction);
        }
      }
    }
    return interactions;
  },

  add(rule: Omit<DrugInteraction, 'id'>): DrugInteraction {
    const rules = this.getAll();
    const newRule: DrugInteraction = {
      ...rule,
      id: `di-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    storageService.set(KEYS.DRUG_INTERACTIONS, [...rules, newRule]);
    return newRule;
  },

  delete(id: string): boolean {
    const rules = this.getAll();
    const filtered = rules.filter(r => r.id !== id);
    if (filtered.length === rules.length) return false;
    storageService.set(KEYS.DRUG_INTERACTIONS, filtered);
    return true;
  }
};
