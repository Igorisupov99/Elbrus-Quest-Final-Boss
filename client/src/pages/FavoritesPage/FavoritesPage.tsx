import React, { useState, useEffect } from 'react';
import { favoriteApi } from '../../api/favorites/favoriteApi';
import type { FavoriteQuestion } from '../../types/favorite';
import { FavoriteButton } from '../../components/common/FavoriteButton';
import { AIChatModal } from '../../components/AIChatModal/AIChatModal';
import styles from './FavoritesPage.module.css';

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] =
    useState<FavoriteQuestion | null>(null);

  // Загрузка избранных вопросов
  const loadFavorites = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await favoriteApi.getUserFavorites({
        page,
        limit: pagination.itemsPerPage,
      });

      setFavorites(response.favorites || []);
      setPagination(
        response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
        }
      );
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке избранных вопросов');
      console.error('Ошибка загрузки избранных:', err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при первом рендере
  useEffect(() => {
    loadFavorites();
  }, []);

  // Обработчик изменения страницы
  const handlePageChange = (newPage: number) => {
    if (
      newPage !== pagination.currentPage &&
      newPage >= 1 &&
      newPage <= pagination.totalPages
    ) {
      loadFavorites(newPage);
    }
  };

  // Обработчик удаления из избранного
  const handleFavoriteToggle = (_questionId: number, isFavorite: boolean) => {
    if (!isFavorite) {
      // Если вопрос удален из избранного, перезагружаем список
      loadFavorites(pagination.currentPage);
    }
  };

  // Обработчик показа подсказки
  const handleShowHint = (questionId: number) => {
    setFavorites((prev) =>
      prev.map((fav) =>
        fav.questionId === questionId
          ? { ...fav, showAnswer: !fav.showAnswer }
          : fav
      )
    );
  };

  // Обработчик открытия чата с АИ
  const handleOpenAIChat = (question: FavoriteQuestion) => {
    setSelectedQuestion(question);
    setAiChatOpen(true);
  };

  // Обработчик закрытия чата с АИ
  const handleCloseAIChat = () => {
    setAiChatOpen(false);
    setSelectedQuestion(null);
  };

  if (loading && favorites.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка избранных вопросов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <img
            src="/ChatGPT Image Sep 16, 2025, 09_23_27 PM.png"
            alt="Books"
            className={styles.booksIcon}
          />
          Избранные вопросы
        </h1>
        <p className={styles.subtitle}>
          Всего: {pagination.totalItems} вопросов
        </p>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
          <button
            className={styles.retryButton}
            onClick={() => loadFavorites(pagination.currentPage)}
          >
            Повторить
          </button>
        </div>
      )}

      {favorites.length === 0 && !loading ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💭</div>
          <h3>Пока нет избранных вопросов</h3>
          <p>Добавляйте интересные вопросы в избранное во время игры!</p>
        </div>
      ) : (
        <>
          <div className={styles.questionsList}>
            {favorites.map((favorite) => (
              <div key={favorite.id} className={styles.questionCard}>
                <div className={styles.questionHeader}>
                  <div className={styles.topicInfo}>
                    <span className={styles.topicBadge}>
                      {favorite.question.topic.title}
                    </span>
                    <span className={styles.phaseInfo}>
                      Фаза {favorite.question.topic.phaseId}
                    </span>
                  </div>
                  <FavoriteButton
                    questionId={favorite.questionId}
                    size="small"
                    onToggle={(isFavorite) =>
                      handleFavoriteToggle(favorite.questionId, isFavorite)
                    }
                  />
                </div>

                <div className={styles.questionContent}>
                  <h3 className={styles.questionText}>
                    {favorite.question.text}
                  </h3>

                  <div className={styles.questionMeta}>
                    <span className={styles.questionType}>
                      Тип: {favorite.question.questionType}
                    </span>
                    <span className={styles.addedDate}>
                      Добавлено:{' '}
                      {new Date(favorite.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <div className={styles.questionActions}>
                    <button
                      className={styles.aiChatButton}
                      onClick={() => handleOpenAIChat(favorite)}
                    >
                      🤖 Обсудить с AI
                    </button>
                    {favorite.question.mentorTip && (
                      <button
                        className={styles.showAnswerButton}
                        onClick={() => handleShowHint(favorite.questionId)}
                      >
                        {favorite.showAnswer
                          ? 'Скрыть подсказку'
                          : 'Показать подсказку'}
                      </button>
                    )}
                  </div>

                  {favorite.showAnswer && favorite.question.mentorTip && (
                    <div className={styles.answerSection}>
                      <div className={styles.mentorTip}>
                        <h4>💡 Подсказка ментора:</h4>
                        <p>{favorite.question.mentorTip}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Пагинация */}
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                ← Предыдущая
              </button>

              <div className={styles.pageNumbers}>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.currentPage) <= 2
                  )
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className={styles.ellipsis}>...</span>
                        )}
                        <button
                          className={`${styles.pageNumber} ${
                            page === pagination.currentPage ? styles.active : ''
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Следующая →
              </button>
            </div>
          )}
        </>
      )}

      {loading && favorites.length > 0 && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Модальное окно чата с АИ */}
      {selectedQuestion && (
        <AIChatModal
          isOpen={aiChatOpen}
          onClose={handleCloseAIChat}
          question={selectedQuestion}
        />
      )}
    </div>
  );
};

export default FavoritesPage;
