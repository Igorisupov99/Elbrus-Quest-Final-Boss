export interface IDETask {
  id: string;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  topic: string;
  initialCode: string;
  expectedOutput: string;
  testCases: IDETestCase[];
  hints: string[];
  solution: string;
  isCompleted?: boolean;
  passedTests?: number;
  totalTests?: number;
  userCode?: string;
}

export interface IDETestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface IDETaskValidation {
  isCorrect: boolean;
  isValid: boolean;
  passedTests: number;
  totalTests: number;
  testResults: IDETestResult[];
  message: string;
  errorMessage?: string;
}

export interface IDETestResult {
  testCase: IDETestCase;
  passed: boolean;
  actualOutput?: string;
  errorMessage?: string;
}

export interface IDETaskGenerationRequest {
  language: string;
  difficulty: string;
  topic: string;
}

export interface IDETaskGenerationResponse {
  task: IDETask;
}
