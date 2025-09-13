import api from '../axios';

export interface AIChatMessage {
  message: string;
  context?: string;
}

export interface AIChatResponse {
  message: string;
  timestamp: string;
  userId: string;
  usage?: {
    inputTextTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIQuestionRequest {
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface AIQuestionResponse {
  question: string;
  answer: string;
  hint: string;
  topic: string;
  difficulty: string;
}

export interface AICheckAnswerRequest {
  userAnswer: string;
  correctAnswer: string;
  question: string;
}

export interface AICheckAnswerResponse {
  result: 'CORRECT' | 'INCORRECT' | 'PARTIAL';
  isCorrect: boolean;
  isPartial: boolean;
}

class AIApi {
  // Отправить сообщение АИ с контекстом
  async sendMessage(data: AIChatMessage): Promise<AIChatResponse> {
    const response = await api.post('/api/ai/chat', data);
    return response.data;
  }

  // Сгенерировать вопрос от АИ
  async generateQuestion(data: AIQuestionRequest): Promise<AIQuestionResponse> {
    const response = await api.post('/api/ai/generate-question', data);
    return response.data;
  }

  // Проверить ответ через АИ
  async checkAnswer(data: AICheckAnswerRequest): Promise<AICheckAnswerResponse> {
    const response = await api.post('/api/ai/check-answer', data);
    return response.data;
  }
}

export const aiApi = new AIApi();
