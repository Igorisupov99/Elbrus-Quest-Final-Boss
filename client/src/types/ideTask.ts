export interface IDETask {
  id: string;
  title: string;
  description: string;
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'cpp';
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  initialCode: string;
  expectedOutput: string;
  testCases: TestCase[];
  hints: string[];
  solution?: string;
  isCompleted?: boolean;
  userCode?: string;
  passedTests?: number;
  totalTests?: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

export interface IDETaskValidation {
  isCorrect: boolean;
  passedTests: number;
  totalTests: number;
  testResults: TestResult[];
  errorMessage?: string;
  executionTime?: number;
}

export interface TestResult {
  testCase: TestCase;
  passed: boolean;
  actualOutput?: string;
  errorMessage?: string;
}

export interface IDETaskGenerationRequest {
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface IDETaskGenerationResponse {
  task: IDETask;
}
