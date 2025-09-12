import React, { useEffect, useState } from 'react';

/**
 * Компонент для тестирования оптимизаций в браузере
 * Добавляет логи в консоль для отслеживания перерендеров
 */
export const BrowserOptimizationTest: React.FC = () => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState<number>(0);

  useEffect(() => {
    const now = performance.now();
    setRenderCount(prev => prev + 1);
    setLastRenderTime(now);
    
    console.log(`🔄 BrowserOptimizationTest render #${renderCount} at ${now.toFixed(2)}ms`);
  });

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>🔄 Renders: {renderCount}</div>
      <div>⏱️ Last: {lastRenderTime.toFixed(2)}ms</div>
      <div>📊 Performance: {renderCount > 10 ? '❌ Too many renders' : '✅ Good'}</div>
    </div>
  );
};

/**
 * Хук для отслеживания производительности компонентов
 */
export const usePerformanceTracker = (componentName: string) => {
  const [renderCount, setRenderCount] = useState(0);
  const [renderTimes, setRenderTimes] = useState<number[]>([]);

  useEffect(() => {
    const now = performance.now();
    setRenderCount(prev => prev + 1);
    setRenderTimes(prev => [...prev.slice(-9), now]); // Храним последние 10 рендеров
    
    console.log(`🎭 ${componentName} render #${renderCount} at ${now.toFixed(2)}ms`);
    
    if (renderCount > 1) {
      const timeSinceLastRender = now - (renderTimes[renderTimes.length - 2] || 0);
      console.log(`⏱️ ${componentName} time since last render: ${timeSinceLastRender.toFixed(2)}ms`);
    }
  });

  const averageRenderTime = renderTimes.length > 1 
    ? renderTimes.slice(1).reduce((acc, time, index) => acc + (time - renderTimes[index]), 0) / (renderTimes.length - 1)
    : 0;

  return {
    renderCount,
    averageRenderTime: averageRenderTime.toFixed(2),
    isPerformingWell: renderCount <= 5 && averageRenderTime < 50
  };
};

/**
 * Компонент для тестирования мемоизации AvatarCard
 */
export const AvatarCardPerformanceTest: React.FC<{ 
  avatar: any; 
  isOwned: boolean; 
  isEquipped: boolean; 
  canAfford: boolean; 
  userScore: number;
}> = ({ avatar, isOwned, isEquipped, canAfford, userScore }) => {
  const { renderCount, averageRenderTime, isPerformingWell } = usePerformanceTracker(`AvatarCard-${avatar.id}`);

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
      <div>Avatar: {avatar.name}</div>
      <div>Renders: {renderCount}</div>
      <div>Avg Time: {averageRenderTime}ms</div>
      <div>Performance: {isPerformingWell ? '✅' : '❌'}</div>
      <div>Props: Owned={isOwned ? '✅' : '❌'}, Equipped={isEquipped ? '✅' : '❌'}, CanAfford={canAfford ? '✅' : '❌'}</div>
    </div>
  );
};
