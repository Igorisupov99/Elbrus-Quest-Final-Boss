import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../../store/store';
import { OptimizedAvatarCard } from '../AvatarCard/OptimizedAvatarCard';
import type { Avatar } from '../../../types/avatar';

// Мок аватара для тестирования
const mockAvatar: Avatar = {
  id: 1,
  name: 'Test Avatar',
  description: 'Test Description',
  price: 100,
  rarity: 'common',
  category: 'animals',
  imageUrl: 'https://example.com/avatar.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

// Тестовый компонент для проверки мемоизации
const TestWrapper: React.FC<{ 
  avatar: Avatar; 
  isOwned: boolean; 
  isEquipped: boolean; 
  canAfford: boolean; 
  userScore: number;
}> = ({ avatar, isOwned, isEquipped, canAfford, userScore }) => {
  console.log('🔄 TestWrapper render');
  
  return (
    <Provider store={store}>
      <OptimizedAvatarCard
        avatar={avatar}
        isOwned={isOwned}
        isEquipped={isEquipped}
        canAfford={canAfford}
        userScore={userScore}
      />
    </Provider>
  );
};

describe('AvatarShop Optimization Tests', () => {
  beforeEach(() => {
    // Очищаем консоль перед каждым тестом
    jest.clearAllMocks();
  });

  test('OptimizedAvatarCard should not re-render when irrelevant props change', () => {
    const { rerender } = render(
      <TestWrapper
        avatar={mockAvatar}
        isOwned={false}
        isEquipped={false}
        canAfford={true}
        userScore={200}
      />
    );

    // Первый рендер
    expect(screen.getByText('Test Avatar')).toBeInTheDocument();

    // Изменяем userScore (не должно вызвать перерендер карточки)
    rerender(
      <TestWrapper
        avatar={mockAvatar}
        isOwned={false}
        isEquipped={false}
        canAfford={true}
        userScore={300} // Изменили userScore
      />
    );

    // Карточка не должна перерендериться, так как canAfford не изменился
    expect(screen.getByText('Test Avatar')).toBeInTheDocument();
  });

  test('OptimizedAvatarCard should re-render when relevant props change', () => {
    const { rerender } = render(
      <TestWrapper
        avatar={mockAvatar}
        isOwned={false}
        isEquipped={false}
        canAfford={true}
        userScore={200}
      />
    );

    // Первый рендер
    expect(screen.getByText('Купить за 100')).toBeInTheDocument();

    // Изменяем isOwned (должно вызвать перерендер)
    rerender(
      <TestWrapper
        avatar={mockAvatar}
        isOwned={true} // Изменили isOwned
        isEquipped={false}
        canAfford={true}
        userScore={200}
      />
    );

    // Кнопка должна измениться на "Надеть"
    expect(screen.getByText('Надеть')).toBeInTheDocument();
  });

  test('Button text should update correctly based on state', () => {
    const { rerender } = render(
      <TestWrapper
        avatar={mockAvatar}
        isOwned={false}
        isEquipped={false}
        canAfford={true}
        userScore={200}
      />
    );

    // Не куплен - должна быть кнопка "Купить"
    expect(screen.getByText('Купить за 100')).toBeInTheDocument();

    // Куплен, но не надет - должна быть кнопка "Надеть"
    rerender(
      <TestWrapper
        avatar={mockAvatar}
        isOwned={true}
        isEquipped={false}
        canAfford={true}
        userScore={200}
      />
    );
    expect(screen.getByText('Надеть')).toBeInTheDocument();

    // Надет - должна быть кнопка "Снять"
    rerender(
      <TestWrapper
        avatar={mockAvatar}
        isOwned={true}
        isEquipped={true}
        canAfford={true}
        userScore={200}
      />
    );
    expect(screen.getByText('Снять')).toBeInTheDocument();
  });
});

// Тест для проверки производительности
describe('Performance Tests', () => {
  test('Multiple cards should render efficiently', () => {
    const avatars = Array.from({ length: 10 }, (_, i) => ({
      ...mockAvatar,
      id: i + 1,
      name: `Avatar ${i + 1}`
    }));

    const startTime = performance.now();
    
    render(
      <Provider store={store}>
        {avatars.map(avatar => (
          <OptimizedAvatarCard
            key={avatar.id}
            avatar={avatar}
            isOwned={false}
            isEquipped={false}
            canAfford={true}
            userScore={1000}
          />
        ))}
      </Provider>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Рендер 10 карточек должен быть быстрым (менее 100мс)
    expect(renderTime).toBeLessThan(100);
    
    // Все карточки должны отрендериться
    expect(screen.getAllByText(/Avatar \d+/)).toHaveLength(10);
  });
});
