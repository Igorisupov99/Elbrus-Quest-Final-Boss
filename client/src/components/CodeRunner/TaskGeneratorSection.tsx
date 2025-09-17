import React from 'react';
import IDETaskGenerator from '../IDETaskGenerator/IDETaskGenerator';
import type { IDETask, IDETaskValidation } from '../../types/ideTask';
import styles from './CodeRunner.module.css';

interface TaskGeneratorSectionProps {
  showTaskGenerator: boolean;
  onTaskGenerated: (task: IDETask) => void;
  onCodeValidation: (validation: IDETaskValidation) => void;
  onHintReceived: (hint: string) => void;
  onSolutionReceived: (solution: string) => void;
  currentCode: string;
  language: 'javascript' | 'typescript';
}

const TaskGeneratorSection: React.FC<TaskGeneratorSectionProps> = ({
  showTaskGenerator,
  onTaskGenerated,
  onCodeValidation,
  onHintReceived,
  onSolutionReceived,
  currentCode,
  language
}) => {
  if (!showTaskGenerator) {
    return null;
  }

  return (
    <div className={styles.taskGeneratorContainer}>
      <IDETaskGenerator
        onTaskGenerated={onTaskGenerated}
        onCodeValidation={onCodeValidation}
        onHintReceived={onHintReceived}
        onSolutionReceived={onSolutionReceived}
        currentCode={currentCode}
        language={language}
      />
    </div>
  );
};

export default TaskGeneratorSection;
