import { describe, it, expect, beforeEach } from 'vitest';
import { noteService } from './noteService';
import { dbService } from './dbService';

describe('noteService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  it('should return initial logs and notes', () => {
    const list = noteService.getAll();
    expect(list.length).toBe(2);
    expect(list[0].id).toBe('note-1');
  });

  it('should get notes by patient ID', () => {
    const list = noteService.getByPatientId('pat-1');
    expect(list.length).toBe(1);
    expect(list[0].category).toBe('FOLLOW_UP');
  });

  it('should record a new note', () => {
    const note = noteService.create({
      patientId: 'pat-1',
      authorId: 'staff-1',
      authorName: 'Dr. Sarah Jenkins',
      content: 'Blood pressure is stabilizing nicely.',
      category: 'FOLLOW_UP'
    });

    expect(note.id).toBeDefined();
    expect(noteService.getById(note.id)).toBeDefined();
    expect(noteService.getAll().length).toBe(3);
  });

  it('should fail note logging if content is blank', () => {
    expect(() => {
      noteService.create({
        patientId: 'pat-1',
        authorId: 'staff-1',
        authorName: 'Dr. Sarah Jenkins',
        content: '', // blank!
        category: 'GENERAL'
      });
    }).toThrow('Note content cannot be empty');
  });

  it('should delete a note', () => {
    noteService.delete('note-1');
    expect(noteService.getById('note-1')).toBeUndefined();
  });
});
