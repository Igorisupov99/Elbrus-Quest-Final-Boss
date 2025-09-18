import React, { useState, useRef, useCallback } from 'react';
import { getRandomExample } from './examples';
import TaskGeneratorSection from './TaskGeneratorSection';
import EditorSection from './EditorSection';
import type { IDETask, IDETaskValidation } from '../../types/ideTask';
import styles from './CodeRunner.module.css';
import * as monaco from 'monaco-editor';

interface CodeRunnerProps {
  initialCode?: string;
  language?: 'javascript' | 'typescript';
  height?: string;
  onCodeChange?: (code: string) => void;
}

export interface ExecutionResult {
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
  const [showTaskGenerator, setShowTaskGenerator] = useState(false);
  const editorRef = useRef<any>(null);

  // Обработчик изменения кода в редакторе
  const handleEditorChange = useCallback((value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);
  }, [onCodeChange]);

  // Обработчик монтирования редактора
  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor;
    
    // Добавляем горячие клавиши
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunCode();
    });
  }, []);

  // Выполнение кода
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setOutput(prev => [...prev, { type: 'clear', message: '', timestamp: new Date() }]);

    try {
      // Если код пустой, просто выводим сообщение
      if (!code.trim()) {
        setOutput(prev => [...prev, { type: 'log', message: 'Код пустой. Напишите что-нибудь для выполнения.', timestamp: new Date() }]);
        return;
      }

      // Создаем изолированную среду выполнения
      const console = {
        log: (...args: any[]) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          setOutput(prev => [...prev, { type: 'log', message, timestamp: new Date() }]);
        },
        error: (...args: any[]) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          setOutput(prev => [...prev, { type: 'error', message, timestamp: new Date() }]);
        },
        warn: (...args: any[]) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          setOutput(prev => [...prev, { type: 'warn', message, timestamp: new Date() }]);
        }
      };

      // Выполняем код
      const result = new Function('console', code)(console);
      
      // Если код возвращает значение, выводим его
      if (result !== undefined) {
        const message = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
        setOutput(prev => [...prev, { type: 'result', message, timestamp: new Date() }]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setOutput(prev => [...prev, { type: 'error', message: errorMessage, timestamp: new Date() }]);
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning]);

  // Очистка вывода
  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  // Копирование кода
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setOutput(prev => [...prev, { type: 'log', message: 'Код скопирован в буфер обмена', timestamp: new Date() }]);
    } catch (error) {
      setOutput(prev => [...prev, { type: 'error', message: 'Не удалось скопировать код', timestamp: new Date() }]);
    }
  }, [code]);

  // Загрузка примера
  const loadExample = useCallback(() => {
    const example = getRandomExample(language);
    setCode(example);
    onCodeChange?.(example);
  }, [language, onCodeChange]);

  // Обработчики для генератора задач
  const handleTaskGenerated = useCallback((task: IDETask) => {
    setCode(task.initialCode || '');
    onCodeChange?.(task.initialCode || '');
    setOutput(prev => [...prev, { type: 'log', message: `Задача сгенерирована: ${task.title}`, timestamp: new Date() }]);
  }, [onCodeChange]);

  const handleCodeValidation = useCallback((validation: IDETaskValidation) => {
    const validationMessage = validation.message || 'Нет дополнительной информации';
    const message = validation.isValid 
      ? `✅ Код прошел валидацию: ${validationMessage}`
      : `❌ Ошибка валидации: ${validationMessage}`;
    setOutput(prev => [...prev, { type: validation.isValid ? 'log' : 'error', message, timestamp: new Date() }]);
  }, []);

  const handleHintReceived = useCallback((hint: string) => {
    setOutput(prev => [...prev, { type: 'log', message: `💡 Подсказка: ${hint}`, timestamp: new Date() }]);
  }, []);

  const handleSolutionReceived = useCallback((solution: string) => {
    setCode(solution);
    onCodeChange?.(solution);
    setOutput(prev => [...prev, { type: 'log', message: '🔧 Решение загружено', timestamp: new Date() }]);
  }, [onCodeChange]);

  // Форматирование времени
  const formatTime = useCallback((date: Date): string => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }, []);

  // Получение иконки для типа сообщения
  const getMessageIcon = useCallback((type: ExecutionResult['type']): string => {
    switch (type) {
      case 'log': return '📝';
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'result': return '✅';
      case 'clear': return '🧹';
      default: return '📝';
    }
  }, []);

  // Получение CSS класса для типа сообщения
  const getMessageClass = useCallback((type: ExecutionResult['type']): string => {
    switch (type) {
      case 'log': return styles.logMessage;
      case 'error': return styles.errorMessage;
      case 'warn': return styles.warnMessage;
      case 'result': return styles.resultMessage;
      case 'clear': return styles.clearMessage;
      default: return styles.logMessage;
    }
  }, []);

  return (
    <>
      <TaskGeneratorSection
        showTaskGenerator={showTaskGenerator}
        onTaskGenerated={handleTaskGenerated}
        onCodeValidation={handleCodeValidation}
        onHintReceived={handleHintReceived}
        onSolutionReceived={handleSolutionReceived}
        currentCode={code}
        language={language}
      />

      <EditorSection
        code={code}
        language={language}
        height={height}
        output={output}
        isRunning={isRunning}
        showTaskGenerator={showTaskGenerator}
        onCodeChange={handleEditorChange}
        onEditorDidMount={handleEditorDidMount}
        onRunCode={handleRunCode}
        onClearOutput={clearOutput}
        onCopyCode={copyCode}
        onLoadExample={loadExample}
        onToggleTaskGenerator={() => setShowTaskGenerator(!showTaskGenerator)}
        getMessageIcon={getMessageIcon}
        getMessageClass={getMessageClass}
        formatTime={formatTime}
      />
    </>
  );
};

export default CodeRunner;