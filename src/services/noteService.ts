import { storageService } from './storageService';
import { KEYS, dbService } from './dbService';
import type { Note } from '../types';

export const noteService = {
  getAll(): Note[] {
    return storageService.get<Note[]>(KEYS.NOTES, []);
  },

  getByPatientId(patientId: string): Note[] {
    return this.getAll().filter((n) => n.patientId === patientId);
  },

  getById(id: string): Note | undefined {
    return this.getAll().find((n) => n.id === id);
  },

  create(noteData: Omit<Note, 'id' | 'date'>): Note {
    const notes = this.getAll();

    if (!noteData.content.trim()) throw new Error('Note content cannot be empty');
    if (!noteData.patientId) throw new Error('Patient association is required');

    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}`,
      date: new Date().toISOString()
    };

    storageService.set(KEYS.NOTES, [...notes, newNote]);
    dbService.logActivity(noteData.authorId, 'Note Created', `Added note to patient ${noteData.patientId} under category ${noteData.category}`);
    return newNote;
  },

  delete(id: string): void {
    const notes = this.getAll();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) throw new Error(`Note "${id}" not found`);

    const note = notes[index];
    const filtered = notes.filter((n) => n.id !== id);
    storageService.set(KEYS.NOTES, filtered);
    dbService.logActivity('SYSTEM', 'Note Deleted', `Deleted note ID: ${id} by author: ${note.authorName}`);
  }
};
