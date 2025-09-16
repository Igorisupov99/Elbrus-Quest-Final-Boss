import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/axios";
import { achievementApi } from "../../api/achievements/achievementApi";
import { 
  checkFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getIncomingRequests,
  getOutgoingRequests,
  type User as FriendUser,
  type Friendship, 
} from "../../api/friendship/friendshipApi";
import { getFriendsCountText } from "../../utils/declination";

import { AchievementCard } from "../../components/Achievement/AchievementCard/AchievementCard";
import { AchievementModal } from "../../components/Achievement/AchievementModal/AchievementModal";
import { FavoriteQuestionModal } from "../../components/FavoriteQuestionModal/FavoriteQuestionModal";
import { UserAvatar } from "../../components/common/UserAvatar";
import { SuccessModal } from "../../components/common/modals/SuccessModal/SuccessModal";
import { ConfirmModal } from "../../components/common/modals/ConfirmModal/ConfirmModal";
import type { Achievement } from "../../types/achievement";
import type { FavoriteQuestion } from "../../types/favorite";
import type { User } from "../../types/auth";
import { useAppSelector } from "../../store/hooks";
import { Link } from "react-router-dom";
import { avatarApi } from "../../api/avatar/avatarApi";
import styles from "./UserPage.module.css";



interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Форматирование даты регистрации
const formatRegistrationDate = (dateString?: string) => {
  if (!dateString) return "Дата регистрации: неизвестна";
  
  try {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `Дата регистрации: ${formattedDate}`;
  } catch {
    return "Дата регистрации: неизвестна";
  }
};

export function UserPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector(state => state.auth.user);
  
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<{ imageUrl: string } | null>(null);

  // Для друзей
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(false);
  const [currentFriendsIndex, setCurrentFriendsIndex] = useState<number>(0);
  
  // Для статуса дружбы
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'accepted' | 'blocked' | 'loading'>('loading');
  const [incomingRequest, setIncomingRequest] = useState<Friendship | null>(null);
  const [outgoingRequest, setOutgoingRequest] = useState<Friendship | null>(null);

  // Для достижений
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState<boolean>(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState<number>(0);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState<boolean>(false);

  // Для избранных вопросов
  const [favoriteQuestions, setFavoriteQuestions] = useState<FavoriteQuestion[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(false);
  const [currentFavoriteIndex, setCurrentFavoriteIndex] = useState<number>(0);
  const [selectedQuestion, setSelectedQuestion] = useState<FavoriteQuestion | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);

  // Для модальных окон уведомлений
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning';
  } | null>(null);

  // Для модального окна подтверждения
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    type?: 'warning' | 'danger' | 'info';
  } | null>(null);


  // Загрузка данных профиля пользователя
  useEffect(() => {
    if (!userId) {
      setError("ID пользователя не найден");
      setLoading(false);
      return;
    }

    // Проверяем, не пытается ли пользователь зайти на свой собственный профиль
    if (currentUser && currentUser.id.toString() === userId) {
      navigate('/profile');
      return;
    }

    // Загружаем аватар пользователя
    const loadUserAvatar = async () => {
      try {
        const avatar = await avatarApi.getUserAvatar(parseInt(userId));
        setUserAvatar(avatar);
      } catch (err) {
        console.error('Ошибка загрузки аватара пользователя:', err);
        setUserAvatar(null);
      }
    };
    
    loadUserAvatar();

    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ApiResponse<User>>(`/api/auth/user/id/${userId}`, {
          withCredentials: true,
        });


        if (!response.data.success) {
          throw new Error(response.data.message || "Ошибка при загрузке профиля");
        }

        setUser(response.data.data);
      } catch (err) {
        let errorMessage = "Ошибка при загрузке профиля";
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

    loadUserProfile();
  }, [userId, currentUser, navigate]);

  // Загрузка друзей пользователя
  useEffect(() => {
    if (!user?.id) return;

    const loadUserFriends = async () => {
      try {
        setFriendsLoading(true);
        
        // Получаем друзей конкретного пользователя
        const response = await api.get<ApiResponse<FriendUser[]>>(`/api/friendship/user/${user.id}/friends`, {
          withCredentials: true,
        });

        if (response.data.success) {
          setFriends(response.data.data || []);
        }
      } catch (err) {
        console.error('Ошибка при загрузке друзей пользователя:', err);
        setFriends([]);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadUserFriends();
  }, [user?.id]);

  // Проверка статуса дружбы и заявок
  useEffect(() => {
    if (!user?.id) return;

    const checkStatus = async () => {
      try {
        setFriendshipStatus('loading');
        setIncomingRequest(null);
        setOutgoingRequest(null);
        
        // Проверяем общий статус дружбы
        const statusResponse = await checkFriendshipStatus(user.id);
        
        if (statusResponse.success && statusResponse.data) {
          setFriendshipStatus(statusResponse.data.status);
        } else {
          setFriendshipStatus('none');
        }

        // Если статус pending, проверяем входящие и исходящие заявки
        if (statusResponse.success && statusResponse.data?.status === 'pending') {
          // Проверяем входящие заявки
          const incomingResponse = await getIncomingRequests();
          if (incomingResponse.success && incomingResponse.data) {
            const foundIncomingRequest = incomingResponse.data.find(
              (request: Friendship) => request.user?.id === user.id
            );
            setIncomingRequest(foundIncomingRequest || null);
          }

          // Проверяем исходящие заявки
          const outgoingResponse = await getOutgoingRequests();
          if (outgoingResponse.success && outgoingResponse.data) {
            const foundOutgoingRequest = outgoingResponse.data.find(
              (request: Friendship) => request.friend?.id === user.id
            );
            setOutgoingRequest(foundOutgoingRequest || null);
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке статуса дружбы:', error);
        setFriendshipStatus('none');
      }
    };

    checkStatus();
  }, [user?.id]);

  // Загрузка достижений пользователя
  useEffect(() => {
    if (!user?.id) return;

    const loadUserAchievements = async () => {
      setAchievementsLoading(true);
      try {
        // Получаем достижения конкретного пользователя
        const data = await achievementApi.getUserAchievementsById(user.id);

        if (data?.achievements) {
          // Преобразуем полученные достижения в нужный формат
          const earnedAchievements = data.achievements.map(userAchievement => ({
            id: userAchievement.achievement.id,
            key: userAchievement.achievement.key,
            title: userAchievement.achievement.title,
            description: userAchievement.achievement.description,
            icon: userAchievement.achievement.icon,
            category: userAchievement.achievement.category,
            points: userAchievement.achievement.points,
            rarity: userAchievement.achievement.rarity,
            earned: true,
            earned_at: userAchievement.earned_at
          }));
          setAchievements(earnedAchievements);
        } else {
          // Если нет достижений
          setAchievements([]);
        }
      } catch (error) {
        console.error('Ошибка при загрузке достижений пользователя:', error);
        setAchievements([]);
      } finally {
        setAchievementsLoading(false);
      }
    };

    loadUserAchievements();
  }, [user?.id]);

  // Загрузка избранных вопросов пользователя (публичных)
  useEffect(() => {
    if (!user?.id) return;

    const loadUserFavorites = async () => {
      setFavoritesLoading(true);
      try {
        // Получаем публичные избранные вопросы пользователя
        const response = await api.get<ApiResponse<{ favorites: FavoriteQuestion[] }>>(`/api/favorites/user/${user.id}`, {
          withCredentials: true,
        });

        if (response.data.success && response.data.data.favorites) {
          setFavoriteQuestions(response.data.data.favorites.slice(0, 15));
        } else {
          setFavoriteQuestions([]);
        }
      } catch (error) {
        console.error('Ошибка при загрузке избранных вопросов пользователя:', error);
        setFavoriteQuestions([]);
      } finally {
        setFavoritesLoading(false);
      }
    };

    loadUserFavorites();
  }, [user?.id]);

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

  // Обработчики для модального окна достижений
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setIsAchievementModalOpen(true);
  };

  const handleCloseAchievementModal = () => {
    setIsAchievementModalOpen(false);
    setSelectedAchievement(null);
  };

  // Обработчики для модального окна вопросов
  const handleQuestionClick = (question: FavoriteQuestion) => {
    setSelectedQuestion(question);
    setIsQuestionModalOpen(true);
  };

  const handleCloseQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setSelectedQuestion(null);
  };

  // Функции для модальных окон уведомлений
  const showSuccessModal = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setSuccessModalData({ title, message, type });
    setIsSuccessModalOpen(true);
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setSuccessModalData(null);
  };

  // Функции для модального окна подтверждения
  const showConfirmModal = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    confirmText: string = 'Подтвердить',
    type: 'warning' | 'danger' | 'info' = 'warning'
  ) => {
    setConfirmModalData({ title, message, onConfirm, confirmText, type });
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setConfirmModalData(null);
  };

  // Функции для карусели избранных вопросов
  const nextFavorites = () => {
    if (favoriteQuestions.length > 3) {
      setCurrentFavoriteIndex((prev) => 
        prev + 3 >= favoriteQuestions.length ? 0 : prev + 3
      );
    }
  };

  const prevFavorites = () => {
    if (favoriteQuestions.length > 3) {
      setCurrentFavoriteIndex((prev) => 
        prev - 3 < 0 ? Math.max(0, favoriteQuestions.length - 3) : prev - 3
      );
    }
  };

  const getVisibleFavorites = () => {
    return favoriteQuestions.slice(currentFavoriteIndex, currentFavoriteIndex + 3);
  };

  // Функции для карусели друзей
  const nextFriends = () => {
    if (friends.length > 5) {
      setCurrentFriendsIndex((prev) => 
        prev + 5 >= friends.length ? 0 : prev + 5
      );
    }
  };

  const prevFriends = () => {
    if (friends.length > 5) {
      setCurrentFriendsIndex((prev) => 
        prev - 5 < 0 ? Math.max(0, friends.length - 5) : prev - 5
      );
    }
  };

  const getVisibleFriends = () => {
    return friends.slice(currentFriendsIndex, currentFriendsIndex + 5);
  };

  // Отправить заявку на дружбу
  const handleSendFriendRequest = async () => {
    if (!user?.id) return;

    try {
      const response = await sendFriendRequest(user.id);
      
      if (response.success) {
        setFriendshipStatus('pending');
        showSuccessModal('Успешно!', `Заявка на дружбу отправлена пользователю ${user.username}`);
      } else {
        showSuccessModal('Ошибка', response.message || 'Ошибка при отправке заявки на дружбу', 'warning');
      }
    } catch (error) {
      console.error('Ошибка при отправке заявки на дружбу:', error);
      showSuccessModal('Ошибка', 'Ошибка при отправке заявки на дружбу', 'warning');
    }
  };

  // Принять заявку на дружбу
  const handleAcceptRequest = async () => {
    if (!incomingRequest?.id) return;

    try {
      const response = await acceptFriendRequest(incomingRequest.id);
      
      if (response.success) {
        setFriendshipStatus('accepted');
        setIncomingRequest(null);
        showSuccessModal('Успешно!', `Заявка на дружбу от ${user?.username} принята!`);
      } else {
        showSuccessModal('Ошибка', response.message || 'Ошибка при принятии заявки', 'warning');
      }
    } catch (error) {
      console.error('Ошибка при принятии заявки:', error);
      showSuccessModal('Ошибка', 'Ошибка при принятии заявки', 'warning');
    }
  };

  // Отклонить заявку на дружбу
  const handleRejectRequest = async () => {
    if (!incomingRequest?.id) return;

    try {
      const response = await rejectFriendRequest(incomingRequest.id);
      
      if (response.success) {
        setFriendshipStatus('none');
        setIncomingRequest(null);
        showSuccessModal('Успешно!', `Заявка на дружбу от ${user?.username} отклонена`);
      } else {
        showSuccessModal('Ошибка', response.message || 'Ошибка при отклонении заявки', 'warning');
      }
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
      showSuccessModal('Ошибка', 'Ошибка при отклонении заявки', 'warning');
    }
  };

  // Удалить из друзей
  const handleRemoveFriend = async () => {
    if (!user?.id) return;

    showConfirmModal(
      'Подтверждение удаления',
      `Вы уверены, что хотите удалить ${user.username} из друзей?`,
      async () => {
        try {
          const response = await removeFriend(user.id);
          
          if (response.success) {
            setFriendshipStatus('none');
            setIncomingRequest(null);
            setOutgoingRequest(null);
            showSuccessModal('Успешно!', `${user.username} удален из друзей`);
          } else {
            showSuccessModal('Ошибка', response.message || 'Ошибка при удалении из друзей', 'warning');
          }
        } catch (error) {
          console.error('Ошибка при удалении из друзей:', error);
          showSuccessModal('Ошибка', 'Ошибка при удалении из друзей', 'warning');
        }
      },
      'Удалить',
      'danger'
    );
  };

  // Переход на страницу друга
  const handleFriendClick = (friendId: number) => {
    navigate(`/user/${friendId}`);
  };

  if (loading) return <div className={styles.loading}>Загрузка профиля...</div>;
  if (error) return <div className={styles.error}>Ошибка: {error}</div>;
  if (!user) return <div className={styles.notFound}>Пользователь не найден</div>;

  return (
    <section className={styles.profileSection}>
      <div className={styles.userPageHeader}>
        <button 
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          ← Назад
        </button>
      </div>

      <div className={styles.mainContainer}>
        {/* Левый блок (2/3 ширины) */}
        <div className={styles.leftBlock}>
          
          {/* Блок 1.1 - Основная информация */}
          <h3 className={styles.blockTitle}>👤 Профиль</h3>
          <div className={styles.profileInfoBlock}>
            <div className={`${styles.avatarSection} ${styles.avatarSectionRelative}`}>
              <Link 
                to="/avatar-shop" 
                className={`${styles.avatarShopLink} ${styles.avatarShopLinkPositioned}`}
              >
                🛒
              </Link>
              
              <img
                src={userAvatar?.imageUrl || (user?.image_url && user.image_url !== null ? user.image_url : "/default-avatar.svg")}
                alt="Аватар"
                className={styles.avatar}
              />
              
              {/* Кнопки управления дружбой */}
              {friendshipStatus === 'none' && (
                <button 
                  className={`${styles.editButton} ${styles.actionButtonGold} ${styles.actionButtonWithMargin}`}
                  onClick={handleSendFriendRequest}
                >
                  Добавить в друзья
                </button>
              )}
              
              {friendshipStatus === 'pending' && incomingRequest && (
                <div className={styles.friendRequestContainer}>
                  <div className={styles.friendRequestButtonsRow}>
                    <button
                      className={`${styles.requestActionButton} ${styles.requestActionButtonAccept}`}
                      onClick={handleAcceptRequest}
                    >
                      ✅ Принять
                    </button>
                    <button
                      className={`${styles.requestActionButton} ${styles.requestActionButtonReject}`}
                      onClick={handleRejectRequest}
                    >
                      ❌ Отклонить
                    </button>
                  </div>
                </div>
              )}
              
              {friendshipStatus === 'pending' && !incomingRequest && outgoingRequest && (
                <div className={`${styles.editButton} ${styles.pendingRequestStatus}`}>
                  Заявка отправлена
                </div>
              )}

              {friendshipStatus === 'pending' && !incomingRequest && !outgoingRequest && (
                <div className={`${styles.editButton} ${styles.pendingRequestStatus}`}>
                  Заявка отправлена
                </div>
              )}
              
              {friendshipStatus === 'accepted' && (
                <div className={styles.friendStatusContainer}>
                  <div className={styles.friendsButton}>
                    ✓ В друзьях
                  </div>
                  <button
                    className={styles.removeFriendButton}
                    onClick={handleRemoveFriend}
                  >
                    🗑️ Удалить
                  </button>
                </div>
              )}
            </div>
            <div className={styles.basicInfo}>
              <h2 className={styles.username}>{user.username}</h2>
              <p className={styles.registrationDate}>{formatRegistrationDate(user.createdAt)}</p>
              <p className={styles.friendsCount}>{getFriendsCountText(friends.length)}</p>
            </div>
          </div>

          {/* Блок 1.2 - Достижения */}
          <div className={styles.achievementsBlock}>
            <div className={styles.achievementsHeader}>
              <h3 className={styles.blockTitle}>🏆 Достижения</h3>
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
                <div className={styles.emptyMessage}>У пользователя пока нет достижений</div>
              ) : (
                <div className={styles.achievementsList}>
                  {getVisibleAchievements().map((achievement) => (
                    <div key={achievement.id} className={styles.achievementWrapper}>
                      <AchievementCard 
                        achievement={achievement}
                        className={styles.profileAchievementCard}
                        onClick={handleAchievementClick}
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

          {/* Блок избранных вопросов */}
          <div className={styles.favoriteQuestionsSection}>
            <div className={styles.favoritesHeader}>
              <h3 className={styles.blockTitle}>⭐ Избранные вопросы</h3>
              {favoriteQuestions.length > 3 && (
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
                <div className={styles.emptyMessage}>У пользователя нет публичных избранных вопросов</div>
              ) : (
                <div className={styles.questionsList}>
                  {getVisibleFavorites().map((favorite) => (
                    <div 
                      key={favorite.id} 
                      className={styles.questionCard}
                      onClick={() => handleQuestionClick(favorite)}
                    >
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
                {favoriteQuestions.length > 3 ? `${currentFavoriteIndex + 1}-${Math.min(currentFavoriteIndex + 3, favoriteQuestions.length)} из ${favoriteQuestions.length}` : `${favoriteQuestions.length} вопрос${favoriteQuestions.length === 1 ? '' : favoriteQuestions.length < 5 ? 'а' : 'ов'}`}
              </div>
            )}
          </div>
        </div>

        {/* Правый блок (1/3 ширины) */}
        <div className={styles.rightBlock}>
          
          {/* Секция статистики */}
          <div className={styles.statisticsBlock}>
            <h3 className={styles.blockTitle}>📊 Статистика</h3>
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

          {/* Секция друзей */}
          <div className={styles.friendsSection}>
            <h3 className={styles.blockTitle}>👥 Друзья</h3>
            
            {friendsLoading ? (
              <div className={styles.loading}>Загрузка...</div>
            ) : (
              <>
                {/* Информация о количестве друзей с кнопками карусели */}
                <div className={styles.friendsCarouselNavigation}>
                  {friends.length > 5 && (
                    <button 
                      onClick={prevFriends}
                      className={styles.carouselNavigationButton}
                    >
                      ←
                    </button>
                  )}
                  
                  <div className={styles.friendsCountCenter}>
                    👥 {getFriendsCountText(friends.length)}
                  </div>
                  
                  {friends.length > 5 && (
                    <button 
                      onClick={nextFriends}
                      className={styles.carouselNavigationButton}
                    >
                      →
                    </button>
                  )}
                </div>
                
                <div className={styles.friendsList}>
                  {friends.length === 0 ? (
                    <div className={styles.emptyMessage}>У пользователя еще нет друзей</div>
                  ) : (
                    getVisibleFriends().map((friend) => (
                      <div 
                        key={friend.id} 
                        className={`${styles.friendCard} ${styles.friendCardClickable}`}
                        onClick={() => handleFriendClick(friend.id)}
                      >
                        {/* Декоративная полоска сверху */}
                        <div className={styles.friendCardTopStripe} />
                        <div className={styles.friendCardContent}>
                          <UserAvatar
                            userId={friend.id}
                            fallbackImageUrl={friend.image_url || "/default-avatar.svg"}
                            size="medium"
                            shape="square"
                            alt={`Аватар ${friend.username}`}
                            className={styles.friendAvatar}
                          />
                          <div className={styles.friendCardInfo}>
                            <h4 className={styles.friendName}>{friend.username}</h4>
                            <p className={styles.friendScore}>
                              🏆 {friend.score ?? 0} очков
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Индикатор карусели друзей */}
                {friends.length > 0 && (
                  <div className={styles.carouselIndicator}>
                    {friends.length > 5 ? 
                      `${currentFriendsIndex + 1}-${Math.min(currentFriendsIndex + 5, friends.length)} из ${friends.length}` : 
                      getFriendsCountText(friends.length)
                    }
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно для достижений */}
      <AchievementModal
        achievement={selectedAchievement}
        isOpen={isAchievementModalOpen}
        onClose={handleCloseAchievementModal}
        earnedDate={selectedAchievement?.earned_at}
      />

      {/* Модальное окно для избранных вопросов */}
      <FavoriteQuestionModal
        question={selectedQuestion}
        isOpen={isQuestionModalOpen}
        onClose={handleCloseQuestionModal}
      />

      {/* Модальное окно успешных операций */}
      {successModalData && (
        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={closeSuccessModal}
          title={successModalData.title}
          message={successModalData.message}
          type={successModalData.type}
        />
      )}

      {/* Модальное окно подтверждения */}
      {confirmModalData && (
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={closeConfirmModal}
          onConfirm={confirmModalData.onConfirm}
          title={confirmModalData.title}
          message={confirmModalData.message}
          confirmText={confirmModalData.confirmText}
          type={confirmModalData.type}
        />
      )}

    </section>
  );
}
