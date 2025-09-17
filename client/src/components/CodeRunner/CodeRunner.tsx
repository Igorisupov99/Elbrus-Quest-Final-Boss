import React, { useState, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { getRandomExample } from './examples';
import IDETaskGenerator from '../IDETaskGenerator/IDETaskGenerator';
import type { IDETask, IDETaskValidation } from '../../types/ideTask';
import styles from './CodeRunner.module.css';

interface CodeRunnerProps {
  initialCode?: string;
  language?: 'javascript' | 'typescript';
  height?: string;
  onCodeChange?: (code: string) => void;
}

interface ExecutionResult {
  type: 'log' | 'error' | 'warn' | 'result' | 'clear';
  message: string;
  timestamp: Date;
}

const CodeRunner: React.FC<CodeRunnerProps> = ({
  initialCode = '',
  language = 'javascript',
  height = '400px',
  onCodeChange
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<ExecutionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef<any>(null);
  
  // IDE Task состояния
  const [currentTask, setCurrentTask] = useState<IDETask | null>(null);
  const [validation, setValidation] = useState<IDETaskValidation | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [showTaskGenerator, setShowTaskGenerator] = useState(false);

  // Обработка изменения кода в редакторе
  const handleEditorChange = useCallback((value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);
  }, [onCodeChange]);

  // Обработка загрузки редактора
  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor;
    
    // Добавляем обработчик клавиш для Ctrl+Enter
    editor.onKeyDown((event: any) => {
      if (event.ctrlKey && event.keyCode === 3) { // Ctrl+Enter
        event.preventDefault();
        handleRunCode();
      }
    });
  }, []);

  // Очистка вывода
  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  // Копирование кода в буфер обмена
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      // Можно добавить уведомление об успешном копировании
    } catch (err) {
      console.error('Не удалось скопировать код:', err);
    }
  }, [code]);

  // Экспорт результатов
  const exportResults = useCallback(() => {
    const results = {
      code,
      output: output.map(item => ({
        type: item.type,
        message: item.message,
        timestamp: item.timestamp.toISOString()
      })),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-runner-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, output]);

  // Загрузка примера
  const loadExample = useCallback(() => {
    const exampleCode = getRandomExample(language);
    setCode(exampleCode);
    onCodeChange?.(exampleCode);
  }, [language, onCodeChange]);

  // Обработчики IDE задач
  const handleTaskGenerated = useCallback((task: IDETask) => {
    setCurrentTask(task);
    setCode(task.initialCode);
    onCodeChange?.(task.initialCode);
    setValidation(null);
    setHint(null);
    setSolution(null);
  }, [onCodeChange]);

  const handleCodeValidation = useCallback((validation: IDETaskValidation) => {
    setValidation(validation);
    
    // Добавляем результаты валидации в вывод
    const validationMessage = validation.isCorrect 
      ? `✅ Задача решена правильно! Пройдено тестов: ${validation.passedTests}/${validation.totalTests}`
      : `❌ Задача решена неправильно. Пройдено тестов: ${validation.passedTests}/${validation.totalTests}`;
    
    setOutput(prev => [...prev, {
      type: validation.isCorrect ? 'result' : 'error',
      message: validationMessage,
      timestamp: new Date()
    }]);

    // Добавляем общую ошибку, если есть
    if (validation.errorMessage) {
      setOutput(prev => [...prev, {
        type: 'error',
        message: `🔍 Детали ошибки: ${validation.errorMessage}`,
        timestamp: new Date()
      }]);
    }

    // Добавляем детали тестов
    if (validation.testResults && validation.testResults.length > 0) {
      validation.testResults.forEach((test, index) => {
        let testMessage = `Тест ${index + 1}: ${test.passed ? '✅' : '❌'} ${test.testCase.description}`;
        
        // Добавляем детали для неудачных тестов
        if (!test.passed) {
          if (test.errorMessage) {
            testMessage += `\n   Ошибка: ${test.errorMessage}`;
          } else if (test.actualOutput !== undefined) {
            testMessage += `\n   Ожидалось: ${JSON.stringify(test.testCase.expectedOutput)}`;
            testMessage += `\n   Получено: ${JSON.stringify(test.actualOutput)}`;
          }
        }
        
        setOutput(prev => [...prev, {
          type: test.passed ? 'log' : 'error',
          message: testMessage,
          timestamp: new Date()
        }]);
      });
    }
  }, []);

  const handleHintReceived = useCallback((hintText: string) => {
    setHint(hintText);
    setOutput(prev => [...prev, {
      type: 'log',
      message: `💡 Подсказка: ${hintText}`,
      timestamp: new Date()
    }]);
  }, []);

  const handleSolutionReceived = useCallback((solutionText: string) => {
    setSolution(solutionText);
    setOutput(prev => [...prev, {
      type: 'result',
      message: `🔍 Решение:\n${solutionText}`,
      timestamp: new Date()
    }]);
  }, []);

  // Безопасное выполнение кода
  const executeCode = useCallback((codeToExecute: string): any => {
    // Создаем безопасный контекст выполнения
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      clear: console.clear
    };

    const logs: ExecutionResult[] = [];
    
    // Перехватываем console методы
    const captureConsole = (_method: 'log' | 'error' | 'warn' | 'info', type: 'log' | 'error' | 'warn') => {
      return (...args: any[]) => {
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');
        
        logs.push({
          type,
          message,
          timestamp: new Date()
        });
      };
    };

    // Перехватываем console.clear
    const captureClear = () => {
      logs.push({
        type: 'clear',
        message: 'Console cleared',
        timestamp: new Date()
      });
    };

    // Временно заменяем console методы
    console.log = captureConsole('log', 'log');
    console.error = captureConsole('error', 'error');
    console.warn = captureConsole('warn', 'warn');
    console.info = captureConsole('info', 'log');
    console.clear = captureClear;

    try {
      // Выполняем код в безопасном контексте
      const func = new Function(`
        "use strict";
        ${codeToExecute}
      `);
      
      const result = func();
      
      // Восстанавливаем оригинальные console методы
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.clear = originalConsole.clear;
      
      return { result, logs };
    } catch (err) {
      // Восстанавливаем оригинальные console методы в случае ошибки
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.clear = originalConsole.clear;
      
      throw err;
    }
  }, []);

  // Запуск кода
  const handleRunCode = useCallback(async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    
    try {
      const { result, logs } = executeCode(code);
      
      // Добавляем логи в вывод
      setOutput(prev => [...prev, ...logs]);
      
      // Если есть возвращаемое значение, добавляем его в вывод
      if (result !== undefined) {
        setOutput(prev => [...prev, {
          type: 'result',
          message: typeof result === 'object' 
            ? JSON.stringify(result, null, 2)
            : String(result),
          timestamp: new Date()
        }]);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Произошла ошибка при выполнении кода';
      setOutput(prev => [...prev, {
        type: 'error',
        message: errorMessage,
        timestamp: new Date()
      }]);
    } finally {
      setIsRunning(false);
    }
  }, [code, executeCode]);

  // Форматирование времени
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ru-RU', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // Получение иконки для типа сообщения
  const getMessageIcon = (type: ExecutionResult['type']): string => {
    switch (type) {
      case 'log': return '📝';
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'result': return '📤';
      case 'clear': return '🧹';
      default: return '📝';
    }
  };

  // Получение CSS класса для типа сообщения
  const getMessageClass = (type: ExecutionResult['type']): string => {
    switch (type) {
      case 'log': return styles.logMessage;
      case 'error': return styles.errorMessage;
      case 'warn': return styles.warnMessage;
      case 'result': return styles.resultMessage;
      case 'clear': return styles.clearMessage;
      default: return styles.logMessage;
    }
  };

  return (
    <div className={styles.container}>
      {/* Генератор задач */}
      {showTaskGenerator && (
        <div className={styles.taskGeneratorContainer}>
          <IDETaskGenerator
            onTaskGenerated={handleTaskGenerated}
            onCodeValidation={handleCodeValidation}
            onHintReceived={handleHintReceived}
            onSolutionReceived={handleSolutionReceived}
            currentCode={code}
            language={language}
          />
        </div>
      )}

      {/* Редактор и вывод */}
      <div className={styles.editorAndOutputContainer}>
        {/* Левая панель - Редактор */}
        <div className={styles.editorPanel}>
        <div className={styles.editorHeader}>
          <span className={styles.editorTitle}>
            {language === 'typescript' ? '🔷 TypeScript' : '🟨 JavaScript'} Редактор
          </span>
          <div className={styles.editorActions}>
            <button
              className={styles.taskButton}
              onClick={() => {
                console.log('🎯 Переключаем генератор задач:', !showTaskGenerator);
                setShowTaskGenerator(!showTaskGenerator);
              }}
              title="Генератор задач"
            >
              {showTaskGenerator ? '🎯 Скрыть задачи' : '🎯 IDE Задачи'}
            </button>
            <button
              className={styles.exampleButton}
              onClick={loadExample}
              title="Загрузить пример"
            >
              📚 Пример
            </button>
            <button
              className={styles.copyButton}
              onClick={copyCode}
              title="Копировать код"
            >
              📋 Копировать
            </button>
            <button
              className={styles.clearButton}
              onClick={clearOutput}
              title="Очистить вывод"
            >
              🧹 Очистить
            </button>
            <button
              className={styles.runButton}
              onClick={handleRunCode}
              disabled={!code.trim() || isRunning}
            >
              {isRunning ? '⏳ Выполняю...' : '▶️ Запустить'}
            </button>
          </div>
        </div>
        
        <div className={styles.editorContainer}>
          <Editor
            height={height}
            language={language}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              suggest: {
                showKeywords: true,
                showSnippets: true,
                showFunctions: true,
                showConstructors: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showIssues: true,
                showUsers: true,
                showWords: true
              },
              quickSuggestions: true,
              parameterHints: { enabled: true },
              hover: { enabled: true },
              contextmenu: true,
              selectOnLineNumbers: true,
              renderLineHighlight: 'line',
              cursorBlinking: 'blink',
              cursorStyle: 'line',
              fontLigatures: true,
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              }
            }}
          />
        </div>
        
        <div className={styles.editorFooter}>
          <span className={styles.hotkeyHint}>Ctrl+Enter для запуска</span>
        </div>
      </div>

      {/* Правая панель - Вывод результатов */}
      <div className={styles.outputPanel}>
        <div className={styles.outputHeader}>
          <span className={styles.outputTitle}>📊 Результат выполнения</span>
          <div className={styles.outputActions}>
            <span className={styles.outputCount}>
              Сообщений: {output.length}
            </span>
            {currentTask && (
              <span className={styles.taskInfo}>
                Задача: {currentTask.title}
              </span>
            )}
            {validation && (
              <span className={styles.validationInfo}>
                Тестов: {validation.passedTests}/{validation.totalTests}
              </span>
            )}
            {hint && (
              <span className={styles.hintInfo}>
                💡 Подсказка получена
              </span>
            )}
            {solution && (
              <span className={styles.solutionInfo}>
                🔍 Решение получено
              </span>
            )}
            {output.length > 0 && (
              <button
                className={styles.exportButton}
                onClick={exportResults}
                title="Экспортировать результаты"
              >
                💾 Экспорт
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.outputContainer}>
          {output.length === 0 ? (
            <div className={styles.emptyOutput}>
              <div className={styles.emptyIcon}>🚀</div>
              <p>Нажмите "Запустить" чтобы выполнить код</p>
              <p className={styles.emptyHint}>
                Используйте console.log() для вывода информации
              </p>
            </div>
          ) : (
            <div className={styles.outputList}>
              {output.map((item, index) => (
                <div key={index} className={`${styles.outputItem} ${getMessageClass(item.type)}`}>
                  <div className={styles.outputItemHeader}>
                    <span className={styles.outputIcon}>
                      {getMessageIcon(item.type)}
                    </span>
                    <span className={styles.outputTime}>
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <pre className={styles.outputMessage}>
                    {item.message}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default CodeRunner;
