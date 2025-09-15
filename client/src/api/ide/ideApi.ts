import api from '../axios';
import type { 
  IDETaskValidation, 
  IDETaskGenerationRequest, 
  IDETaskGenerationResponse 
} from '../../types/ideTask';

class IDEApi {
  // Генерация новой IDE задачи через AI
  async generateTask(request: IDETaskGenerationRequest): Promise<IDETaskGenerationResponse> {
    const response = await api.post('/api/ai/ide/generate-task', {
      language: request.language,
      difficulty: request.difficulty,
      topic: request.topic
    });
    return response.data;
  }

  // Валидация кода пользователя через AI
  async validateCode(taskId: string, userCode: string, taskDescription: string, testCases: any[]): Promise<IDETaskValidation> {
    const response = await api.post('/api/ai/ide/validate-code', {
      taskId,
      userCode,
      taskDescription,
      testCases
    });
    return response.data;
  }

  // Получение подсказки для задачи через AI
  async getHint(taskId: string, hintIndex: number, taskDescription: string, userCode?: string): Promise<{ hint: string }> {
    const response = await api.post('/api/ai/ide/get-hint', {
      taskId,
      hintIndex,
      taskDescription,
      userCode
    });
    return response.data;
  }

  // Получение решения задачи через AI
  async getSolution(taskId: string, taskDescription: string): Promise<{ solution: string }> {
    const response = await api.post('/api/ai/ide/get-solution', {
      taskId,
      taskDescription
    });
    return response.data;
  }
}

export const ideApi = new IDEApi();
