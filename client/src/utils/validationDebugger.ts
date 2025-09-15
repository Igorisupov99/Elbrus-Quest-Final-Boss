// Утилита для отладки валидации IDE задач

import { ideApi } from '../api/ide/ideApi';
import type { IDETaskValidation } from '../types/ideTask';

export interface ValidationDebugInfo {
  success: boolean;
  error?: string;
  validation?: IDETaskValidation;
  requestData?: any;
  responseData?: any;
}

export const debugValidation = async (
  taskId: string,
  userCode: string,
  taskDescription: string,
  testCases: any[]
): Promise<ValidationDebugInfo> => {
  const requestData = {
    taskId,
    userCode,
    taskDescription,
    testCases
  };

  console.log('🔍 Отладка валидации - Отправляемые данные:', requestData);

  try {
    const validation = await ideApi.validateCode(
      taskId,
      userCode,
      taskDescription,
      testCases
    );

    console.log('✅ Валидация успешна:', validation);

    return {
      success: true,
      validation,
      requestData
    };
  } catch (error: any) {
    console.error('❌ Ошибка валидации:', error);

    const errorInfo = {
      success: false,
      error: error.message || 'Неизвестная ошибка',
      requestData,
      responseData: error.response?.data || null
    };

    console.log('📊 Информация об ошибке:', errorInfo);

    return errorInfo;
  }
};

export const validateTestCases = (testCases: any[]): string[] => {
  const errors: string[] = [];

  if (!Array.isArray(testCases)) {
    errors.push('testCases должен быть массивом');
    return errors;
  }

  testCases.forEach((testCase, index) => {
    if (!testCase.input) {
      errors.push(`Тест ${index + 1}: отсутствует input`);
    }
    if (!testCase.expectedOutput) {
      errors.push(`Тест ${index + 1}: отсутствует expectedOutput`);
    }
    if (!testCase.description) {
      errors.push(`Тест ${index + 1}: отсутствует description`);
    }
  });

  return errors;
};

export const validateTaskData = (taskId: string, userCode: string, taskDescription: string): string[] => {
  const errors: string[] = [];

  if (!taskId || typeof taskId !== 'string') {
    errors.push('taskId должен быть непустой строкой');
  }

  if (!userCode || typeof userCode !== 'string') {
    errors.push('userCode должен быть непустой строкой');
  }

  if (!taskDescription || typeof taskDescription !== 'string') {
    errors.push('taskDescription должен быть непустой строкой');
  }

  return errors;
};
