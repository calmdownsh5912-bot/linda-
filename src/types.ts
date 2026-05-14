export interface AnalogousQuestion {
  question: string;
  answer: string;
  analysis: string;
}

export interface Mistake {
  id?: string;
  userId: string;
  originalText: string;
  originalImageUrl?: string;
  options?: string[];
  userAnswer?: string;
  correctAnswer?: string;
  knowledgePoint: string;
  createdAt: any; // Firestore Timestamp
  analogousQuestions: AnalogousQuestion[];
}

export enum AppTab {
  RECOGNITION = 'recognition',
  BANK = 'bank'
}

export interface OCRResult {
  text: string;
  options?: string[];
  userAnswer?: string;
  correctAnswer?: string;
  knowledgePoint: string;
}
