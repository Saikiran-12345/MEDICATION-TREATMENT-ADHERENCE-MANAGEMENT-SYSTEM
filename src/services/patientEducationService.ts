/**
 * Patient Education Service
 * Manages educational content, learning paths, and knowledge assessment
 */

import { storageService } from './storageService';
import type { Patient } from '../types';

const STORAGE_KEY_CONTENT = 'patient_education_content';
const STORAGE_KEY_PATHS = 'patient_learning_paths';
const STORAGE_KEY_PROGRESS = 'patient_learning_progress';
const STORAGE_KEY_ASSESSMENTS = 'patient_assessments';

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  category: 'MEDICATION' | 'DISEASE' | 'LIFESTYLE' | 'ADHERENCE' | 'SIDE_EFFECTS' | 'NUTRITION' | 'EXERCISE';
  contentType: 'VIDEO' | 'ARTICLE' | 'INFOGRAPHIC' | 'INTERACTIVE' | 'QUIZ' | 'PDF';
  content: string; // URL or embedded content
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: number; // in minutes
  keywords: string[];
  relatedConditions: string[];
  relatedMedications: string[];
  targetAudience: 'PATIENT' | 'CAREGIVER' | 'BOTH';
  language: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  rating?: number; // 1-5
  viewCount: number;
  approvedBy?: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  objective: string;
  targetCondition?: string;
  targetMedication?: string;
  modules: Array<{
    id: string;
    title: string;
    contentIds: string[];
    sequenceOrder: number;
    isRequired: boolean;
    duration: number;
  }>;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: number; // total in minutes
  createdAt: string;
  isActive: boolean;
  successCriteria: {
    minScore: number;
    requiredModules: number;
  };
}

interface LearningProgress {
  id: string;
  patientId: string;
  pathId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
  enrollmentDate: string;
  completionDate?: string;
  modulesCompleted: number;
  totalModules: number;
  overallProgress: number; // percentage
  timeSpent: number; // in minutes
  modules: Array<{
    moduleId: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    contentProgress: Array<{
      contentId: string;
      viewed: boolean;
      timeSpent: number;
      completedAt?: string;
    }>;
  }>;
  lastAccessedAt?: string;
  nextDueDate?: string;
}

interface KnowledgeAssessment {
  id: string;
  contentId?: string;
  pathId?: string;
  patientId: string;
  title: string;
  type: 'QUIZ' | 'SURVEY' | 'COMPREHENSION_CHECK' | 'PRACTICAL_TEST';
  questions: Array<{
    id: string;
    question: string;
    questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'MULTIPLE_SELECT';
    options?: string[];
    correctAnswer?: string | string[];
    explanation?: string;
  }>;
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  maxAttempts: number;
}

interface AssessmentResult {
  id: string;
  assessmentId: string;
  patientId: string;
  attemptNumber: number;
  score: number; // percentage
  passed: boolean;
  answers: Array<{
    questionId: string;
    answer: string | string[];
    isCorrect: boolean;
  }>;
  timeSpent: number; // in minutes
  completedAt: string;
  feedback?: string;
}

interface EducationRecommendation {
  patientId: string;
  recommendation: string;
  contentIds: string[];
  pathIds: string[];
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedAt: string;
  deadline?: string;
}

class PatientEducationService {
  /**
   * Create educational content
   */
  createContent(
    title: string,
    description: string,
    category: 'MEDICATION' | 'DISEASE' | 'LIFESTYLE' | 'ADHERENCE' | 'SIDE_EFFECTS' | 'NUTRITION' | 'EXERCISE',
    contentType: 'VIDEO' | 'ARTICLE' | 'INFOGRAPHIC' | 'INTERACTIVE' | 'QUIZ' | 'PDF',
    content: string,
    options?: Partial<EducationalContent>
  ): EducationalContent {
    const educContent: EducationalContent = {
      id: this.generateId(),
      title,
      description,
      category,
      contentType,
      content,
      difficulty: options?.difficulty || 'BEGINNER',
      estimatedDuration: options?.estimatedDuration || 10,
      keywords: options?.keywords || [],
      relatedConditions: options?.relatedConditions || [],
      relatedMedications: options?.relatedMedications || [],
      targetAudience: options?.targetAudience || 'PATIENT',
      language: options?.language || 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      viewCount: 0,
    };

    const contents = this.getContents();
    contents.push(educContent);
    storageService.set(STORAGE_KEY_CONTENT, contents);

    return educContent;
  }

  /**
   * Create learning path
   */
  createLearningPath(
    title: string,
    description: string,
    objective: string,
    modules: LearningPath['modules'],
    options?: Partial<LearningPath>
  ): LearningPath {
    const totalDuration = modules.reduce((sum, m) => sum + m.duration, 0);

    const path: LearningPath = {
      id: this.generateId(),
      title,
      description,
      objective,
      targetCondition: options?.targetCondition,
      targetMedication: options?.targetMedication,
      modules,
      difficulty: options?.difficulty || 'BEGINNER',
      estimatedDuration: totalDuration,
      createdAt: new Date().toISOString(),
      isActive: true,
      successCriteria: options?.successCriteria || {
        minScore: 70,
        requiredModules: Math.ceil(modules.length * 0.8),
      },
    };

    const paths = this.getPaths();
    paths.push(path);
    storageService.set(STORAGE_KEY_PATHS, paths);

    return path;
  }

  /**
   * Enroll patient in learning path
   */
  enrollPatient(patientId: string, pathId: string): LearningProgress {
    const path = this.getPathById(pathId);
    if (!path) {
      throw new Error('Learning path not found');
    }

    const progress: LearningProgress = {
      id: this.generateId(),
      patientId,
      pathId,
      status: 'NOT_STARTED',
      enrollmentDate: new Date().toISOString(),
      modulesCompleted: 0,
      totalModules: path.modules.length,
      overallProgress: 0,
      timeSpent: 0,
      modules: path.modules.map((m) => ({
        moduleId: m.id,
        status: 'NOT_STARTED',
        contentProgress: m.contentIds.map((contentId) => ({
          contentId,
          viewed: false,
          timeSpent: 0,
        })),
      })),
    };

    const allProgress = this.getProgressRecords();
    allProgress.push(progress);
    storageService.set(STORAGE_KEY_PROGRESS, allProgress);

    return progress;
  }

  /**
   * Record content view
   */
  recordContentView(patientId: string, pathId: string, contentId: string, timeSpent: number): LearningProgress | null {
    const allProgress = this.getProgressRecords();
    const progress = allProgress.find((p) => p.patientId === patientId && p.pathId === pathId);

    if (!progress) {
      return null;
    }

    // Update content progress
    for (const module of progress.modules) {
      const contentProgress = module.contentProgress.find((cp) => cp.contentId === contentId);
      if (contentProgress) {
        contentProgress.viewed = true;
        contentProgress.timeSpent += timeSpent;
        contentProgress.completedAt = new Date().toISOString();
        progress.status = 'IN_PROGRESS';
        progress.timeSpent += timeSpent;
        progress.lastAccessedAt = new Date().toISOString();
      }
    }

    // Update overall progress
    const totalContent = progress.modules.reduce((sum, m) => sum + m.contentProgress.length, 0);
    const viewedContent = progress.modules.reduce((sum, m) => sum + m.contentProgress.filter((cp) => cp.viewed).length, 0);
    progress.overallProgress = Math.round((viewedContent / totalContent) * 100);

    storageService.set(STORAGE_KEY_PROGRESS, allProgress);

    return progress;
  }

  /**
   * Create knowledge assessment/quiz
   */
  createAssessment(
    title: string,
    questions: KnowledgeAssessment['questions'],
    type: 'QUIZ' | 'SURVEY' | 'COMPREHENSION_CHECK' | 'PRACTICAL_TEST' = 'QUIZ',
    options?: Partial<KnowledgeAssessment>
  ): KnowledgeAssessment {
    const assessment: KnowledgeAssessment = {
      id: this.generateId(),
      title,
      type,
      questions,
      timeLimit: options?.timeLimit,
      passingScore: options?.passingScore || 70,
      maxAttempts: options?.maxAttempts || 3,
      contentId: options?.contentId,
      pathId: options?.pathId,
    };

    const assessments = this.getAssessments();
    assessments.push(assessment);
    storageService.set(STORAGE_KEY_ASSESSMENTS, assessments);

    return assessment;
  }

  /**
   * Submit assessment results
   */
  submitAssessment(assessmentId: string, patientId: string, answers: Array<{ questionId: string; answer: string | string[] }>): AssessmentResult {
    const assessment = this.getAssessmentById(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const assessments = this.getAssessments();
    const assessmentIdx = assessments.findIndex((a) => a.id === assessmentId);
    const previousResults = this.getAssessmentResults().filter((r) => r.assessmentId === assessmentId && r.patientId === patientId);

    let score = 0;
    let correctCount = 0;

    const processedAnswers = assessment.questions.map((q) => {
      const submitted = answers.find((a) => a.questionId === q.id);
      const isCorrect =
        JSON.stringify(submitted?.answer) === JSON.stringify(q.correctAnswer) || (submitted?.answer === q.correctAnswer);

      if (isCorrect) {
        correctCount++;
        score = Math.round((correctCount / assessment.questions.length) * 100);
      }

      return {
        questionId: q.id,
        answer: submitted?.answer || '',
        isCorrect,
      };
    });

    const result: AssessmentResult = {
      id: this.generateId(),
      assessmentId,
      patientId,
      attemptNumber: previousResults.length + 1,
      score,
      passed: score >= assessment.passingScore,
      answers: processedAnswers,
      timeSpent: 0,
      completedAt: new Date().toISOString(),
      feedback: this.generateAssessmentFeedback(score, assessment.passingScore),
    };

    const results = this.getAssessmentResults();
    results.push(result);
    storageService.set(STORAGE_KEY_ASSESSMENTS, results);

    return result;
  }

  /**
   * Get personalized education recommendations
   */
  getRecommendations(patientId: string, condition?: string, medication?: string): EducationRecommendation[] {
    const recommendations: EducationRecommendation[] = [];
    const contents = this.getContents();

    let relevantContent = contents;

    if (medication) {
      relevantContent = relevantContent.filter((c) => c.relatedMedications.includes(medication));
    }

    if (condition) {
      relevantContent = relevantContent.filter((c) => c.relatedConditions.includes(condition));
    }

    // Create recommendations
    const categories = ['MEDICATION', 'ADHERENCE', 'LIFESTYLE', 'SIDE_EFFECTS'];
    for (const category of categories) {
      const categoryContent = relevantContent.filter((c) => c.category === category);

      if (categoryContent.length > 0) {
        recommendations.push({
          patientId,
          recommendation: `Learn about ${category.toLowerCase()} management`,
          contentIds: categoryContent.slice(0, 3).map((c) => c.id),
          pathIds: [],
          reason: 'Relevant to your condition or medications',
          priority: 'MEDIUM',
          recommendedAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    return recommendations;
  }

  /**
   * Get learning progress for patient
   */
  getPatientProgress(patientId: string): LearningProgress[] {
    const allProgress = this.getProgressRecords();
    return allProgress.filter((p) => p.patientId === patientId);
  }

  /**
   * Get assessment results for patient
   */
  getPatientAssessmentResults(patientId: string): AssessmentResult[] {
    const results = this.getAssessmentResults();
    return results.filter((r) => r.patientId === patientId).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  /**
   * Get content by category
   */
  getContentByCategory(category: string): EducationalContent[] {
    return this.getContents().filter((c) => c.category === category && c.isActive);
  }

  /**
   * Search educational content
   */
  searchContent(query: string): EducationalContent[] {
    const contents = this.getContents();
    const lowerQuery = query.toLowerCase();

    return contents.filter(
      (c) =>
        c.isActive &&
        (c.title.toLowerCase().includes(lowerQuery) ||
          c.description.toLowerCase().includes(lowerQuery) ||
          c.keywords.some((k) => k.toLowerCase().includes(lowerQuery)))
    );
  }

  /**
   * Rate educational content
   */
  rateContent(contentId: string, rating: number): EducationalContent | null {
    const contents = this.getContents();
    const content = contents.find((c) => c.id === contentId);

    if (!content) {
      return null;
    }

    const currentRating = content.rating || 0;
    const currentRatingCount = Math.round(currentRating * 10);
    const newRatingCount = currentRatingCount + rating;
    content.rating = Math.round((newRatingCount / (currentRatingCount / currentRating + 1 || 1)) * 10) / 10;

    storageService.set(STORAGE_KEY_CONTENT, contents);
    return content;
  }

  /**
   * Get popular content
   */
  getPopularContent(limit = 10): EducationalContent[] {
    return this.getContents()
      .filter((c) => c.isActive)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, limit);
  }

  /**
   * Get content by difficulty
   */
  getContentByDifficulty(difficulty: string): EducationalContent[] {
    return this.getContents().filter((c) => c.difficulty === difficulty && c.isActive);
  }

  /**
   * Private: Get all contents
   */
  private getContents(): EducationalContent[] {
    return (storageService.get(STORAGE_KEY_CONTENT) || []) as EducationalContent[];
  }

  /**
   * Private: Get all paths
   */
  private getPaths(): LearningPath[] {
    return (storageService.get(STORAGE_KEY_PATHS) || []) as LearningPath[];
  }

  /**
   * Private: Get path by ID
   */
  private getPathById(pathId: string): LearningPath | null {
    const paths = this.getPaths();
    return paths.find((p) => p.id === pathId) || null;
  }

  /**
   * Private: Get progress records
   */
  private getProgressRecords(): LearningProgress[] {
    return (storageService.get(STORAGE_KEY_PROGRESS) || []) as LearningProgress[];
  }

  /**
   * Private: Get assessments
   */
  private getAssessments(): KnowledgeAssessment[] {
    return (storageService.get(STORAGE_KEY_ASSESSMENTS) || []) as KnowledgeAssessment[];
  }

  /**
   * Private: Get assessment by ID
   */
  private getAssessmentById(assessmentId: string): KnowledgeAssessment | null {
    const assessments = this.getAssessments();
    return assessments.find((a) => a.id === assessmentId) || null;
  }

  /**
   * Private: Get assessment results
   */
  private getAssessmentResults(): AssessmentResult[] {
    // Note: Storing results in same key for simplicity
    const stored = (storageService.get(STORAGE_KEY_ASSESSMENTS) || []) as any[];
    return stored.filter((item) => item.assessmentId && item.patientId && item.completedAt) as AssessmentResult[];
  }

  /**
   * Private: Generate feedback
   */
  private generateAssessmentFeedback(score: number, passingScore: number): string {
    if (score >= passingScore + 20) {
      return 'Excellent! You have demonstrated strong understanding of this material.';
    } else if (score >= passingScore) {
      return 'Good job! You passed the assessment. Review any missed areas for reinforcement.';
    } else {
      return 'Keep learning! Please review the material and try again to improve your score.';
    }
  }

  /**
   * Private: Generate ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const patientEducationService = new PatientEducationService();
