import React from 'react';
import Editor from '@monaco-editor/react';
import type { ExecutionResult } from './CodeRunner';
import styles from './CodeRunner.module.css';

interface EditorSectionProps {
  code: string;
  language: 'javascript' | 'typescript';
  height: string;
  output: ExecutionResult[];
  isRunning: boolean;
  showTaskGenerator: boolean;
  onCodeChange: (value: string | undefined) => void;
  onEditorDidMount: (editor: any) => void;
  onRunCode: () => void;
  onClearOutput: () => void;
  onCopyCode: () => void;
  onLoadExample: () => void;
  onToggleTaskGenerator: () => void;
  getMessageIcon: (type: ExecutionResult['type']) => string;
  getMessageClass: (type: ExecutionResult['type']) => string;
  formatTime: (date: Date) => string;
}

const EditorSection: React.FC<EditorSectionProps> = ({
  code,
  language,
  height,
  output,
  isRunning,
  showTaskGenerator,
  onCodeChange,
  onEditorDidMount,
  onRunCode,
  onClearOutput,
  onCopyCode,
  onLoadExample,
  onToggleTaskGenerator,
  getMessageIcon,
  getMessageClass,
  formatTime
}) => {
  return (
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
              onClick={onToggleTaskGenerator}
              title="Генератор задач"
            >
              {showTaskGenerator ? '🎯 Скрыть задачи' : '🎯 IDE Задачи'}
            </button>
            <button
              className={styles.exampleButton}
              onClick={onLoadExample}
              title="Загрузить пример"
            >
              📚 Пример
            </button>
            <button
              className={styles.copyButton}
              onClick={onCopyCode}
              title="Копировать код"
            >
              📋 Копировать
            </button>
            <button
              className={styles.clearButton}
              onClick={onClearOutput}
              title="Очистить вывод"
            >
              🧹 Очистить
            </button>
            <button
              className={styles.runButton}
              onClick={onRunCode}
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
            onChange={onCodeChange}
            onMount={onEditorDidMount}
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
            {output.length > 0 && (
              <button
                className={styles.clearButton}
                onClick={onClearOutput}
                title="Очистить вывод"
              >
                🧹 Очистить
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
  );
};

export default EditorSection;
