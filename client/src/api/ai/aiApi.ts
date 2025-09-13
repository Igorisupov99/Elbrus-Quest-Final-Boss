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

class AIApi {
  // Отправить сообщение АИ с контекстом
  async sendMessage(data: AIChatMessage): Promise<AIChatResponse> {
    const response = await api.post('/api/ai/chat', data);
    return response.data;
  }
}

export const aiApi = new AIApi();
