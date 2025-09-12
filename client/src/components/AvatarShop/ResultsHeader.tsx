import React, { memo } from 'react';
import type { Avatar } from '../../types/avatar';

interface ResultsHeaderProps {
  count: number;
  currentAvatar: Avatar | null;
}

/**
 * Мемоизированный заголовок результатов
 * Перерендерится только при изменении количества или текущего аватара
 */
const ResultsHeaderComponent: React.FC<ResultsHeaderProps> = ({ count, currentAvatar }) => {
  console.log('📊 ResultsHeader render');
  
  return (
    <div className="results-header" style={{ marginBottom: '1rem', padding: '0 1rem' }}>
      <h3>Найдено аватаров: {count}</h3>
      {currentAvatar && (
        <div className="current-avatar" style={{ marginTop: '0.5rem', color: '#666' }}>
          <span>Текущий аватар: </span>
          <strong>{currentAvatar.name}</strong>
        </div>
      )}
    </div>
  );
};

// Мемоизируем заголовок - он перерендерится только при изменении данных
export const ResultsHeader = memo(ResultsHeaderComponent, (prevProps, nextProps) => {
  return (
    prevProps.count === nextProps.count &&
    prevProps.currentAvatar?.id === nextProps.currentAvatar?.id &&
    prevProps.currentAvatar?.name === nextProps.currentAvatar?.name
  );
});
