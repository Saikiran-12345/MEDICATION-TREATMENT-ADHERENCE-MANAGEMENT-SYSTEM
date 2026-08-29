/**
 * Telehealth/Video Consultation Service
 * Manages video consultations, scheduling, recording, and communication
 */

import { storageService } from './storageService';
import { notificationService } from './notificationService';
import { dbService } from './dbService';

const STORAGE_KEY_CONSULTATIONS = 'telehealth_consultations';
const STORAGE_KEY_SESSIONS = 'telehealth_sessions';
const STORAGE_KEY_RECORDINGS = 'telehealth_recordings';
const STORAGE_KEY_MESSAGES = 'consultation_messages';
const STORAGE_KEY_NOTES = 'consultation_notes';

interface ConsultationSchedule {
  id: string;
  patientId: string;
  providerId: string;
  appointmentId: string;
  scheduledTime: string;
  duration: number; // in minutes
  type: 'VIDEO' | 'AUDIO' | 'CHAT';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface VideoSession {
  id: string;
  consultationId: string;
  sessionToken: string;
  roomId: string;
  patientId: string;
  providerId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in seconds
  status: 'INITIALIZING' | 'ACTIVE' | 'COMPLETED';
  participantCount: number;
  recordingId?: string;
  metrics: {
    videoQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DISCONNECTED';
    latency: number; // in ms
    packetLoss: number; // percentage
    audioLevel: number; // 0-100
    screenShared: boolean;
    cameraActive: boolean;
    microphoneActive: boolean;
  };
}

interface ConsultationRecording {
  id: string;
  sessionId: string;
  consultationId: string;
  recordingUrl: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  fileSize: number; // in MB
  format: 'MP4' | 'WEBM' | 'MKV';
  status: 'RECORDING' | 'PROCESSING' | 'READY' | 'ARCHIVED';
  encryptionKey?: string;
  accessLog: Array<{ userId: string; timestamp: string }>;
  retentionDays: number;
  expiryDate: string;
}

interface ConsultationMessage {
  id: string;
  sessionId: string;
  consultationId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  fileAttachment?: {
    name: string;
    type: string;
    size: number;
    url: string;
  };
  timestamp: string;
  isRead: boolean;
  editedAt?: string;
}

interface ConsultationNote {
  id: string;
  consultationId: string;
  authorId: string;
  authorName: string;
  content: string;
  medications?: Array<{ medicationId: string; change: string }>;
  followUpActions: Array<{
    action: string;
    assignedTo: string;
    dueDate: string;
    status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  }>;
  diagnosis?: string;
  assessment?: string;
  plan?: string;
  vitalsRecorded?: { type: string; value: number; unit: string }[];
  createdAt: string;
  updatedAt: string;
  isSignedOff: boolean;
  signedOffAt?: string;
  signedOffBy?: string;
}

interface TelehealthMetrics {
  totalConsultations: number;
  completedConsultations: number;
  averageDuration: number;
  averageQualityScore: number;
  patientSatisfaction: number;
  noShowRate: number;
  cancellationRate: number;
  recordingUtilization: number;
}

class TelehealthService {
  private videoAPI = {
    generateSessionToken: (roomId: string) => `token_${roomId}_${Date.now()}`,
    generateRoomId: () => `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  /**
   * Schedule a telehealth consultation
   */
  scheduleConsultation(
    patientId: string,
    providerId: string,
    appointmentId: string,
    scheduledTime: string,
    duration: number,
    type: 'VIDEO' | 'AUDIO' | 'CHAT' = 'VIDEO',
    reason: string,
    notes?: string
  ): ConsultationSchedule {
    const consultation: ConsultationSchedule = {
      id: this.generateId(),
      patientId,
      providerId,
      appointmentId,
      scheduledTime,
      duration,
      type,
      status: 'SCHEDULED',
      reason,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const consultations = this.getConsultations();
    consultations.push(consultation);
    storageService.set(STORAGE_KEY_CONSULTATIONS, consultations);

    // Log activity
    dbService.logActivity(providerId, `Scheduled ${type} consultation with patient ${patientId}`);

    // Notify patient
    notificationService.addNotification({
      id: `notif_${Date.now()}`,
      userId: patientId,
      title: 'Video Consultation Scheduled',
      message: `Your telehealth consultation is scheduled for ${scheduledTime}`,
      date: new Date().toISOString(),
      type: 'SYSTEM',
      isRead: false,
    });

    return consultation;
  }

  /**
   * Confirm consultation (patient confirms attendance)
   */
  confirmConsultation(consultationId: string): ConsultationSchedule | null {
    const consultations = this.getConsultations();
    const consultation = consultations.find((c) => c.id === consultationId);

    if (!consultation) {
      return null;
    }

    consultation.status = 'CONFIRMED';
    consultation.updatedAt = new Date().toISOString();
    storageService.set(STORAGE_KEY_CONSULTATIONS, consultations);

    dbService.logActivity(consultation.patientId, `Confirmed telehealth consultation`);

    return consultation;
  }

  /**
   * Start a video session
   */
  startVideoSession(consultationId: string): VideoSession | null {
    const consultation = this.getConsultationById(consultationId);
    if (!consultation) {
      return null;
    }

    if (consultation.status !== 'CONFIRMED' && consultation.status !== 'SCHEDULED') {
      return null;
    }

    const roomId = this.videoAPI.generateRoomId();
    const sessionToken = this.videoAPI.generateSessionToken(roomId);

    const session: VideoSession = {
      id: this.generateId(),
      consultationId,
      sessionToken,
      roomId,
      patientId: consultation.patientId,
      providerId: consultation.providerId,
      startTime: new Date().toISOString(),
      status: 'INITIALIZING',
      participantCount: 0,
      metrics: {
        videoQuality: 'GOOD',
        latency: 0,
        packetLoss: 0,
        audioLevel: 0,
        screenShared: false,
        cameraActive: false,
        microphoneActive: false,
      },
    };

    const sessions = this.getSessions();
    sessions.push(session);
    storageService.set(STORAGE_KEY_SESSIONS, sessions);

    // Update consultation status
    const consultations = this.getConsultations();
    const consultationIndex = consultations.findIndex((c) => c.id === consultationId);
    if (consultationIndex >= 0) {
      consultations[consultationIndex].status = 'IN_PROGRESS';
      storageService.set(STORAGE_KEY_CONSULTATIONS, consultations);
    }

    dbService.logActivity(consultation.providerId, `Started video session for consultation ${consultationId}`);

    return session;
  }

  /**
   * End video session and create recording
   */
  endVideoSession(sessionId: string, recordingData?: { url: string; fileSize: number; format: string }): VideoSession | null {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      return null;
    }

    const endTime = new Date().toISOString();
    const duration = Math.floor((new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 1000);

    session.endTime = endTime;
    session.duration = duration;
    session.status = 'COMPLETED';

    // Create recording if data provided
    if (recordingData) {
      const recording: ConsultationRecording = {
        id: this.generateId(),
        sessionId,
        consultationId: session.consultationId,
        recordingUrl: recordingData.url,
        startTime: session.startTime,
        endTime: endTime,
        duration,
        fileSize: recordingData.fileSize,
        format: recordingData.format as 'MP4' | 'WEBM' | 'MKV',
        status: 'PROCESSING',
        retentionDays: 90,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        accessLog: [
          {
            userId: session.providerId,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const recordings = this.getRecordings();
      recordings.push(recording);
      storageService.set(STORAGE_KEY_RECORDINGS, recordings);

      session.recordingId = recording.id;
    }

    storageService.set(STORAGE_KEY_SESSIONS, sessions);

    // Update consultation to completed
    const consultations = this.getConsultations();
    const consultationIndex = consultations.findIndex((c) => c.id === session.consultationId);
    if (consultationIndex >= 0) {
      consultations[consultationIndex].status = 'COMPLETED';
      storageService.set(STORAGE_KEY_CONSULTATIONS, consultations);
    }

    dbService.logActivity(session.providerId, `Ended video session. Duration: ${Math.floor(duration / 60)} minutes`);

    return session;
  }

  /**
   * Send message in consultation session
   */
  sendMessage(sessionId: string, senderId: string, senderName: string, content: string): ConsultationMessage {
    const message: ConsultationMessage = {
      id: this.generateId(),
      sessionId,
      consultationId: this.getSessionById(sessionId)?.consultationId || '',
      senderId,
      senderName,
      content,
      messageType: 'TEXT',
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    const messages = this.getMessages();
    messages.push(message);
    storageService.set(STORAGE_KEY_MESSAGES, messages);

    return message;
  }

  /**
   * Get messages for session
   */
  getSessionMessages(sessionId: string): ConsultationMessage[] {
    const messages = this.getMessages();
    return messages.filter((m) => m.sessionId === sessionId);
  }

  /**
   * Create consultation note
   */
  createConsultationNote(
    consultationId: string,
    authorId: string,
    authorName: string,
    content: string,
    noteData?: Partial<ConsultationNote>
  ): ConsultationNote {
    const note: ConsultationNote = {
      id: this.generateId(),
      consultationId,
      authorId,
      authorName,
      content,
      medications: noteData?.medications || [],
      followUpActions: noteData?.followUpActions || [],
      diagnosis: noteData?.diagnosis,
      assessment: noteData?.assessment,
      plan: noteData?.plan,
      vitalsRecorded: noteData?.vitalsRecorded,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSignedOff: false,
    };

    const notes = this.getNotes();
    notes.push(note);
    storageService.set(STORAGE_KEY_NOTES, notes);

    dbService.logActivity(authorId, `Created consultation note for consultation ${consultationId}`);

    return note;
  }

  /**
   * Sign off consultation note
   */
  signOffNote(noteId: string, signedOffBy: string): ConsultationNote | null {
    const notes = this.getNotes();
    const note = notes.find((n) => n.id === noteId);

    if (!note) {
      return null;
    }

    note.isSignedOff = true;
    note.signedOffAt = new Date().toISOString();
    note.signedOffBy = signedOffBy;
    note.updatedAt = new Date().toISOString();

    storageService.set(STORAGE_KEY_NOTES, notes);
    dbService.logActivity(signedOffBy, `Signed off consultation note ${noteId}`);

    return note;
  }

  /**
   * Cancel consultation
   */
  cancelConsultation(consultationId: string, reason: string): ConsultationSchedule | null {
    const consultations = this.getConsultations();
    const consultation = consultations.find((c) => c.id === consultationId);

    if (!consultation) {
      return null;
    }

    consultation.status = 'CANCELLED';
    consultation.notes = `Cancelled: ${reason}`;
    consultation.updatedAt = new Date().toISOString();
    storageService.set(STORAGE_KEY_CONSULTATIONS, consultations);

    // Notify patient
    notificationService.addNotification({
      id: `notif_${Date.now()}`,
      userId: consultation.patientId,
      title: 'Consultation Cancelled',
      message: `Your telehealth consultation has been cancelled. Reason: ${reason}`,
      date: new Date().toISOString(),
      type: 'SYSTEM',
      isRead: false,
    });

    dbService.logActivity(consultation.providerId, `Cancelled consultation ${consultationId}`);

    return consultation;
  }

  /**
   * Get consultation by ID
   */
  getConsultationById(consultationId: string): ConsultationSchedule | null {
    const consultations = this.getConsultations();
    return consultations.find((c) => c.id === consultationId) || null;
  }

  /**
   * Get all consultations for patient
   */
  getPatientConsultations(patientId: string): ConsultationSchedule[] {
    return this.getConsultations().filter((c) => c.patientId === patientId);
  }

  /**
   * Get all consultations for provider
   */
  getProviderConsultations(providerId: string): ConsultationSchedule[] {
    return this.getConsultations().filter((c) => c.providerId === providerId);
  }

  /**
   * Get recording by ID
   */
  getRecordingById(recordingId: string): ConsultationRecording | null {
    const recordings = this.getRecordings();
    return recordings.find((r) => r.id === recordingId) || null;
  }

  /**
   * Access recording (log access)
   */
  accessRecording(recordingId: string, userId: string): ConsultationRecording | null {
    const recordings = this.getRecordings();
    const recording = recordings.find((r) => r.id === recordingId);

    if (!recording) {
      return null;
    }

    recording.accessLog.push({
      userId,
      timestamp: new Date().toISOString(),
    });

    storageService.set(STORAGE_KEY_RECORDINGS, recordings);
    dbService.logActivity(userId, `Accessed recording ${recordingId}`);

    return recording;
  }

  /**
   * Get telehealth metrics
   */
  getTelehealthMetrics(): TelehealthMetrics {
    const consultations = this.getConsultations();
    const completed = consultations.filter((c) => c.status === 'COMPLETED').length;
    const cancelled = consultations.filter((c) => c.status === 'CANCELLED').length;
    const noShow = consultations.filter((c) => c.status === 'NO_SHOW').length;

    const avgDuration = completed > 0
      ? consultations
          .filter((c) => c.status === 'COMPLETED')
          .reduce((sum, c) => sum + c.duration, 0) / completed
      : 0;

    return {
      totalConsultations: consultations.length,
      completedConsultations: completed,
      averageDuration: Math.round(avgDuration),
      averageQualityScore: 85, // Simulated
      patientSatisfaction: 4.5, // Out of 5
      noShowRate: (noShow / consultations.length) * 100,
      cancellationRate: (cancelled / consultations.length) * 100,
      recordingUtilization: (this.getRecordings().length / completed) * 100,
    };
  }

  /**
   * Update video quality metrics
   */
  updateSessionMetrics(sessionId: string, metrics: Partial<VideoSession['metrics']>): boolean {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      return false;
    }

    session.metrics = { ...session.metrics, ...metrics };
    storageService.set(STORAGE_KEY_SESSIONS, sessions);

    return true;
  }

  /**
   * Private: Get all consultations
   */
  private getConsultations(): ConsultationSchedule[] {
    return (storageService.get(STORAGE_KEY_CONSULTATIONS) || []) as ConsultationSchedule[];
  }

  /**
   * Private: Get all sessions
   */
  private getSessions(): VideoSession[] {
    return (storageService.get(STORAGE_KEY_SESSIONS) || []) as VideoSession[];
  }

  /**
   * Private: Get session by ID
   */
  private getSessionById(sessionId: string): VideoSession | null {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  }

  /**
   * Private: Get all recordings
   */
  private getRecordings(): ConsultationRecording[] {
    return (storageService.get(STORAGE_KEY_RECORDINGS) || []) as ConsultationRecording[];
  }

  /**
   * Private: Get all messages
   */
  private getMessages(): ConsultationMessage[] {
    return (storageService.get(STORAGE_KEY_MESSAGES) || []) as ConsultationMessage[];
  }

  /**
   * Private: Get all notes
   */
  private getNotes(): ConsultationNote[] {
    return (storageService.get(STORAGE_KEY_NOTES) || []) as ConsultationNote[];
  }

  /**
   * Private: Generate ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const telehealthService = new TelehealthService();
