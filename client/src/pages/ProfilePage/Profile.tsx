import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import axios from "axios";
import api from "../../api/axios";
import { 
  getFriends, 
  getIncomingRequests, 
  getOutgoingRequests,
  acceptFriendRequest, 
  rejectFriendRequest,
  removeFriend,
  type User as FriendUser, 
  type Friendship 
} from "../../api/friendship/friendshipApi";
import { achievementApi } from "../../api/achievements/achievementApi";
import { AchievementCard } from "../../components/Achievement/AchievementCard/AchievementCard";
import type { Achievement } from "../../types/achievement";
import { favoriteApi } from "../../api/favorites/favoriteApi";
import type { FavoriteQuestion } from "../../types/favorite";
import styles from "./Profile.module.css";

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  score?: number;
  image_url?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Для модального окна настроек
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Для друзей и заявок
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friendship[]>([]);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(false);
  
  // Для модальных окон заявок
  const [isIncomingModalOpen, setIsIncomingModalOpen] = useState(false);
  const [isOutgoingModalOpen, setIsOutgoingModalOpen] = useState(false);

  // Для достижений
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState<boolean>(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState<number>(0);

  // Для избранных вопросов
  const [favoriteQuestions, setFavoriteQuestions] = useState<FavoriteQuestion[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(false);
  const [currentFavoriteIndex, setCurrentFavoriteIndex] = useState<number>(0);


  // Для управления формой настроек
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  // Загрузка данных профиля
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ApiResponse<User>>("/api/auth/profile", {
          withCredentials: true,
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Ошибка при загрузке профиля");
        }

        setUser(response.data.data);

        // Инициализируем форму
        setFormData((f) => ({
          ...f,
          username: response.data.data.username,
          email: response.data.data.email,
        }));
      } catch (err) {
        let errorMessage = "Ошибка";
        if (axios.isAxiosError(err)) {
          errorMessage =
            err.response?.data?.message || err.message || "Ошибка";
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Загрузка друзей и заявок
  useEffect(() => {
    const loadFriendsData = async () => {
      try {
        setFriendsLoading(true);

        const [friendsResponse, incomingResponse, outgoingResponse] = await Promise.all([
          getFriends(),
          getIncomingRequests(),
          getOutgoingRequests()
        ]);

        if (friendsResponse.success) {
          setFriends(friendsResponse.data || []);
        }

        if (incomingResponse.success) {
          setIncomingRequests(incomingResponse.data || []);
        }

        if (outgoingResponse.success) {
          setOutgoingRequests(outgoingResponse.data || []);
        }
      } catch (err) {
        console.error('Ошибка при загрузке друзей:', err);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadFriendsData();
  }, []);

  // Загрузка достижений
  useEffect(() => {
    const loadAchievements = async () => {
      setAchievementsLoading(true);
      try {
        // Сначала пытаемся загрузить пользовательские достижения
        try {
          const userData = await achievementApi.getUserAchievements();
          // Фильтруем только полученные достижения
          const earnedAchievements = userData.achievements
            .filter(ua => ua.achievement)
            .map(ua => ({
              ...ua.achievement,
              earned: true,
              earned_at: ua.earned_at
            }));
          setAchievements(earnedAchievements);
        } catch {
          // Если пользователь не авторизован, показываем все достижения
          const allData = await achievementApi.getAllAchievements();
          setAchievements(allData.achievements.slice(0, 6)); // Показываем первые 6
        }
      } catch (error) {
        console.error('Ошибка при загрузке достижений:', error);
        setAchievements([]);
      } finally {
        setAchievementsLoading(false);
      }
    };

    loadAchievements();
  }, []);

  // Загрузка избранных вопросов
  useEffect(() => {
    const loadFavorites = async () => {
      setFavoritesLoading(true);
      try {
        const response = await favoriteApi.getUserFavorites({ 
          page: 1, 
          limit: 15 // Загружаем 15 вопросов для карусели
        });
        setFavoriteQuestions(response.favorites || []);
      } catch (error) {
        console.error('Ошибка при загрузке избранных вопросов:', error);
        setFavoriteQuestions([]);
      } finally {
        setFavoritesLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Обработчик открытия/закрытия модалки
  const openSettings = () => {
    setError(null); // очищаем ошибки при открытии модального окна
    setIsSettingsOpen(true);
  };
  const closeSettings = () => {
    setError(null); // очищаем ошибки при закрытии модального окна
    setIsSettingsOpen(false);
  };

  // Функции для модальных окон заявок
  const openIncomingModal = () => setIsIncomingModalOpen(true);
  const closeIncomingModal = () => setIsIncomingModalOpen(false);
  const openOutgoingModal = () => setIsOutgoingModalOpen(true);
  const closeOutgoingModal = () => setIsOutgoingModalOpen(false);

  // Функции для карусели достижений
  const nextAchievements = () => {
    if (achievements.length > 3) {
      setCurrentAchievementIndex((prev) => 
        prev + 3 >= achievements.length ? 0 : prev + 3
      );
    }
  };

  const prevAchievements = () => {
    if (achievements.length > 3) {
      setCurrentAchievementIndex((prev) => 
        prev - 3 < 0 ? Math.max(0, achievements.length - 3) : prev - 3
      );
    }
  };

  const getVisibleAchievements = () => {
    return achievements.slice(currentAchievementIndex, currentAchievementIndex + 3);
  };

  // Функции для карусели избранных вопросов
  const nextFavorites = () => {
    if (favoriteQuestions.length > 5) {
      setCurrentFavoriteIndex((prev) => 
        prev + 5 >= favoriteQuestions.length ? 0 : prev + 5
      );
    }
  };

  const prevFavorites = () => {
    if (favoriteQuestions.length > 5) {
      setCurrentFavoriteIndex((prev) => 
        prev - 5 < 0 ? Math.max(0, favoriteQuestions.length - 5) : prev - 5
      );
    }
  };

  const getVisibleFavorites = () => {
    return favoriteQuestions.slice(currentFavoriteIndex, currentFavoriteIndex + 5);
  };


  // Принять заявку на дружбу
  const handleAcceptRequest = async (friendshipId: number) => {
    try {
      const response = await acceptFriendRequest(friendshipId);
      
      if (response.success) {
        // Обновляем списки
        const [friendsResponse, incomingResponse] = await Promise.all([
          getFriends(),
          getIncomingRequests()
        ]);
        
        if (friendsResponse.success) setFriends(friendsResponse.data || []);
        if (incomingResponse.success) setIncomingRequests(incomingResponse.data || []);
        
        alert('Заявка на дружбу принята!');
      } else {
        alert(response.message || 'Ошибка при принятии заявки');
      }
    } catch (error) {
      console.error('Ошибка при принятии заявки:', error);
      alert('Ошибка при принятии заявки');
    }
  };

  // Отклонить заявку на дружбу
  const handleRejectRequest = async (friendshipId: number) => {
    try {
      const response = await rejectFriendRequest(friendshipId);
      if (response.success) {
        // Обновляем список заявок
        const requestsResponse = await getIncomingRequests();
        if (requestsResponse.success) setIncomingRequests(requestsResponse.data || []);
        
        alert('Заявка на дружбу отклонена');
      } else {
        alert(response.message || 'Ошибка при отклонении заявки');
      }
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
      alert('Ошибка при отклонении заявки');
    }
  };

  // Удалить из друзей
  const handleRemoveFriend = async (friendId: number, friendName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить ${friendName} из друзей?`)) {
      return;
    }

    try {
      const response = await removeFriend(friendId);
      if (response.success) {
        // Обновляем список друзей
        const friendsResponse = await getFriends();
        if (friendsResponse.success) setFriends(friendsResponse.data || []);
        
        alert(`${friendName} удален из друзей`);
      } else {
        alert(response.message || 'Ошибка при удалении из друзей');
      }
    } catch (error) {
      console.error('Ошибка при удалении из друзей:', error);
      alert('Ошибка при удалении из друзей');
    }
  };


  // Обработчик изменения полей формы
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Обработчик отправки формы
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Отправляем данные на сервер для обновления профиля
      const response = await api.put<ApiResponse<User>>('/api/auth/update-profile', {
        username: formData.username,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword || undefined, // отправляем только если есть новый пароль
      }, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Ошибка при обновлении профиля");
      }

      // Обновляем локальное состояние пользователя с данными с сервера
      setUser(response.data.data);

      // Очищаем пароли из формы после успешного обновления
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        username: response.data.data.username,
        email: response.data.data.email,
      }));

      closeSettings();
      
      // Можно добавить уведомление об успешном обновлении
      alert("Профиль успешно обновлен!");
      
    } catch (err) {
      let errorMessage = "Ошибка при обновлении профиля";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик удаления аккаунта
  const handleDelete = async () => {
    if (!window.confirm("Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.")) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // вызов API для удаления аккаунта
      await api.delete("/api/auth/delete-account", { withCredentials: true });
      // например, редирект на страницу входа или главную
      window.location.href = "/register";
    } catch (err) {
      let errorMessage = "Ошибка удаления аккаунта";
      if (axios.isAxiosError(err)) {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка профиля...</div>;
  if (error) return <div className={styles.error}>Ошибка: {error}</div>;
  if (!user) return <div className={styles.notFound}>Пользователь не найден</div>;

  return (
<section className={styles.profileSection}>
  <h1 className={styles.header}>Профиль</h1>

  <div className={styles.mainContainer}>
    {/* Левый блок (2/3 ширины) */}
    <div className={styles.leftBlock}>
      
      {/* Блок 1.1 - Основная информация */}
      <div className={styles.profileInfoBlock}>
        <div className={styles.avatarSection}>
    <img
      src={user.image_url || "/default-avatar.png"}
      alt="Аватар"
      className={styles.avatar}
    />
          <button className={styles.editButton} onClick={openSettings}>
            Редактировать
          </button>
        </div>
        <div className={styles.basicInfo}>
          <h2 className={styles.username}>{user.username}</h2>
          <p className={styles.friendsCount}>Друзей: {friends.length}</p>
        </div>
      </div>

      {/* Блок 1.2 - Статистика */}
      <div className={styles.statisticsBlock}>
        <h3 className={styles.blockTitle}>Статистика</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.score ?? 0}</div>
            <div className={styles.statLabel}>Очки</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>Игры</div>
          </div>
        </div>
      </div>

      {/* Блок достижений */}
      <div className={styles.achievementsBlock}>
        <div className={styles.achievementsHeader}>
          <h3 className={styles.blockTitle}>Достижения</h3>
          {achievements.length > 3 && (
            <div className={styles.carouselControls}>
              <button 
                className={styles.carouselButton}
                onClick={prevAchievements}
                aria-label="Предыдущие достижения"
              >
                ←
              </button>
              <button 
                className={styles.carouselButton}
                onClick={nextAchievements}
                aria-label="Следующие достижения"
              >
                →
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.achievementsCarousel}>
          {achievementsLoading ? (
            <div className={styles.loading}>Загрузка достижений...</div>
          ) : achievements.length === 0 ? (
            <div className={styles.emptyMessage}>У вас пока нет достижений</div>
          ) : (
            <div className={styles.achievementsList}>
              {getVisibleAchievements().map((achievement) => (
                <div key={achievement.id} className={styles.achievementWrapper}>
                  <AchievementCard 
                    achievement={achievement}
                    className={styles.profileAchievementCard}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {achievements.length > 0 && (
          <div className={styles.achievementsIndicator}>
            {achievements.length > 3 ? `${currentAchievementIndex + 1}-${Math.min(currentAchievementIndex + 3, achievements.length)} из ${achievements.length}` : `${achievements.length} достижени${achievements.length === 1 ? 'е' : achievements.length < 5 ? 'я' : 'й'}`}
          </div>
        )}
      </div>
    </div>

    {/* Правый блок (1/3 ширины) */}
    <div className={styles.rightBlock}>
      
      {/* Секция друзей */}
      <div className={styles.friendsSection}>
        <h3 className={styles.blockTitle}>Друзья</h3>
        
        {friendsLoading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <>
            <div className={styles.friendsStats}>
              <p>Друзей: {friends.length}</p>
            </div>
            
            <div className={styles.friendsActions}>
              <button 
                className={styles.requestButton}
                onClick={openIncomingModal}
                style={{
                  padding: '12px 24px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  borderRadius: '8px',
                  border: '2px solid #6b3e15',
                  background: 'linear-gradient(180deg, #d8a35d, #b0752d)',
                  color: '#2c1810',
                  textShadow: '0 1px 0 #f3e0c0',
                  boxShadow: '0 4px 0 #6b3e15, 0 6px 10px rgba(0, 0, 0, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Входящие заявки ({incomingRequests.length})
              </button>
              <button 
                className={styles.requestButton}
                onClick={openOutgoingModal}
                style={{
                  padding: '12px 24px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  borderRadius: '8px',
                  border: '2px solid #6b3e15',
                  background: 'linear-gradient(180deg, #d8a35d, #b0752d)',
                  color: '#2c1810',
                  textShadow: '0 1px 0 #f3e0c0',
                  boxShadow: '0 4px 0 #6b3e15, 0 6px 10px rgba(0, 0, 0, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Отправленные заявки ({outgoingRequests.length})
              </button>
            </div>
            
            <div className={styles.friendsList}>
              {friends.length === 0 ? (
                <div className={styles.emptyMessage}>У вас еще нет друзей</div>
              ) : (
                friends.map((friend) => (
                  <div 
                    key={friend.id} 
                    className={styles.friendCard}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '16px',
                      background: '#fffaf0',
                      borderRadius: '8px',
                      border: '2px solid #6b3e15',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <div className={styles.friendCardContent} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <img
                        src={friend.image_url || "/default-avatar.png"}
                        alt={`Аватар ${friend.username}`}
                        className={styles.friendAvatar}
                      />
                      <div className={styles.friendInfo}>
                        <h4 className={styles.friendName}>{friend.username}</h4>
                      </div>
                    </div>
                    <button
                      className={styles.removeFriendButton}
                      onClick={() => handleRemoveFriend(friend.id, friend.username)}
                      style={{
                        padding: '8px 16px',
                        background: '#dc3545',
                        color: 'white',
                        border: '1px solid #c82333',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Секция избранных вопросов */}
      <div className={styles.favoriteQuestionsSection}>
        <div className={styles.favoritesHeader}>
          <h3 className={styles.blockTitle}>Избранные вопросы</h3>
          {favoriteQuestions.length > 5 && (
            <div className={styles.carouselControls}>
              <button 
                className={styles.carouselButton}
                onClick={prevFavorites}
                aria-label="Предыдущие вопросы"
              >
                ↑
              </button>
              <button 
                className={styles.carouselButton}
                onClick={nextFavorites}
                aria-label="Следующие вопросы"
              >
                ↓
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.favoritesCarousel}>
          {favoritesLoading ? (
            <div className={styles.loading}>Загрузка избранных вопросов...</div>
          ) : favoriteQuestions.length === 0 ? (
            <div className={styles.emptyMessage}>У вас нет избранных вопросов</div>
          ) : (
            <div className={styles.questionsList}>
              {getVisibleFavorites().map((favorite) => (
                <div key={favorite.id} className={styles.questionCard}>
                  <div className={styles.questionHeader}>
                    <span className={styles.topicBadge}>
                      {favorite.question.topic.title}
                    </span>
                    <span className={styles.phaseInfo}>
                      Фаза {favorite.question.topic.phaseId}
                    </span>
                  </div>
                  
                  <div className={styles.questionContent}>
                    <p className={styles.questionText}>
                      {favorite.question.text}
                    </p>
                    
                    <div className={styles.questionMeta}>
                      <span className={styles.questionType}>
                        {favorite.question.questionType}
                      </span>
                      <span className={styles.addedDate}>
                        {new Date(favorite.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {favoriteQuestions.length > 0 && (
          <div className={styles.favoritesIndicator}>
            {favoriteQuestions.length > 5 ? `${currentFavoriteIndex + 1}-${Math.min(currentFavoriteIndex + 5, favoriteQuestions.length)} из ${favoriteQuestions.length}` : `${favoriteQuestions.length} вопрос${favoriteQuestions.length === 1 ? '' : favoriteQuestions.length < 5 ? 'а' : 'ов'}`}
          </div>
        )}
      </div>
    </div>
  </div>


      {/* Модальное окно */}
      {isSettingsOpen && (
        <div className={styles.modalOverlay} onClick={closeSettings}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()} // чтобы клик по содержимому не закрывал модал
          >
            <button className={styles.closeBtn} onClick={closeSettings} aria-label="Закрыть модальное окно">
              &times;
            </button>
            <h2 className={styles.modalHeader}>Настройки профиля</h2>

            {error && (
              <div className={styles.error} style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Логин</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Текущий пароль *</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  placeholder="Введите текущий пароль для подтверждения изменений"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newPassword">Новый пароль (оставьте пустым, если не хотите менять)</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Введите новый пароль или оставьте пустым"
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={`${styles.button} ${styles.saveBtn}`}>
                  Сохранить изменения
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.deleteBtn}`}
                  onClick={handleDelete}
                >
                  Удалить аккаунт
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно входящих заявок */}
      {isIncomingModalOpen && (
        <div className={styles.modalOverlay} onClick={closeIncomingModal}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <button className={styles.closeBtn} onClick={closeIncomingModal} aria-label="Закрыть модальное окно">
              &times;
            </button>
            <h2 className={styles.modalHeader}>Входящие заявки ({incomingRequests.length})</h2>
            
            <div className={styles.requestsList}>
              {incomingRequests.length === 0 ? (
                <div className={styles.emptyMessage}>Нет входящих заявок</div>
              ) : (
                incomingRequests.map((request) => (
                  <div key={request.id} className={styles.requestCard}>
                    <img
                      src={request.user?.image_url || "/default-avatar.png"}
                      alt={`Аватар ${request.user?.username}`}
                      className={styles.friendAvatar}
                    />
                    <div className={styles.friendInfo}>
                      <h4 className={styles.friendName}>{request.user?.username}</h4>
                      <p className={styles.friendEmail}>{request.user?.email}</p>
                      {request.user?.score !== undefined && (
                        <p className={styles.friendScore}>Очки: {request.user.score}</p>
                      )}
                    </div>
                    <div className={styles.requestButtons}>
                      <button
                        className={styles.acceptButton}
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        Принять
                      </button>
                      <button
                        className={styles.rejectButton}
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно исходящих заявок */}
      {isOutgoingModalOpen && (
        <div className={styles.modalOverlay} onClick={closeOutgoingModal}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <button className={styles.closeBtn} onClick={closeOutgoingModal} aria-label="Закрыть модальное окно">
              &times;
            </button>
            <h2 className={styles.modalHeader}>Отправленные заявки ({outgoingRequests.length})</h2>
            
            <div className={styles.requestsList}>
              {outgoingRequests.length === 0 ? (
                <div className={styles.emptyMessage}>Нет отправленных заявок</div>
              ) : (
                outgoingRequests.map((request) => (
                  <div key={request.id} className={styles.requestCard}>
                    <img
                      src={request.friend?.image_url || "/default-avatar.png"}
                      alt={`Аватар ${request.friend?.username}`}
                      className={styles.friendAvatar}
                    />
                    <div className={styles.friendInfo}>
                      <h4 className={styles.friendName}>{request.friend?.username}</h4>
                      <p className={styles.friendEmail}>{request.friend?.email}</p>
                      {request.friend?.score !== undefined && (
                        <p className={styles.friendScore}>Очки: {request.friend.score}</p>
                      )}
                    </div>
                    <div className={styles.requestStatus}>
                      <span className={styles.pendingStatus}>Ожидает ответа</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}