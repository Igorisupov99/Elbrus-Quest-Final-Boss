import { useState, useEffect } from 'react';
import styles from './AchievementsPage.module.css';
import { AchievementCard } from '../../components/Achievement/AchievementCard/AchievementCard';
import { AchievementGroup } from '../../components/Achievement/AchievementGroup/AchievementGroup';
import { AchievementModal } from '../../components/Achievement/AchievementModal/AchievementModal';
import { achievementApi } from '../../api/achievements/achievementApi';
import type { Achievement, AchievementStats } from '../../types/achievement';
import { ACHIEVEMENT_CATEGORIES } from '../../types/achievement';

export function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      // Загружаем все достижения (API уже возвращает их с флагом earned)
      const allData = await achievementApi.getAllAchievements();

      setAchievements(allData.achievements);

      // Пытаемся загрузить статистику пользователя
      try {
        const userData = await achievementApi.getUserAchievements();
        setStats(userData.stats);
      } catch (userError) {
        // Если пользователь не авторизован, вычисляем статистику из загруженных достижений
        const earnedCount = allData.achievements.filter((a) => a.earned).length;
        const totalPoints = allData.achievements
          .filter((a) => a.earned)
          .reduce((sum, a) => sum + a.points, 0);

        setStats({
          totalAchievements: allData.achievements.length,
          earnedAchievements: earnedCount,
          totalBonusPoints: totalPoints,
          completionPercentage:
            allData.achievements.length > 0
              ? Math.round((earnedCount / allData.achievements.length) * 100)
              : 0,
        });
      }
    } catch (err) {
      console.error('Ошибка при загрузке достижений:', err);
      setError('Не удалось загрузить достижения');
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter((achievement) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'earned') return achievement.earned;
    if (activeFilter === 'not_earned') return !achievement.earned;
    return achievement.category === activeFilter;
  });

  // Группируем ачивки только для основных фильтров (all, earned, not_earned)
  const shouldGroupAchievements = ['all', 'earned', 'not_earned'].includes(
    activeFilter
  );

  const groupedAchievements = shouldGroupAchievements
    ? filteredAchievements.reduce((groups, achievement) => {
        if (!groups[achievement.category]) {
          groups[achievement.category] = [];
        }
        groups[achievement.category].push(achievement);
        return groups;
      }, {} as Record<string, Achievement[]>)
    : {};

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAchievement(null);
  };

  const handleToggleGroup = (category: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    const allCategories = Object.keys(groupedAchievements);
    setExpandedGroups(new Set(allCategories));
  };

  const handleCollapseAll = () => {
    setExpandedGroups(new Set());
  };

  if (loading) {
    return (
      <div className={styles.achievementsPage}>
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка достижений...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.achievementsPage}>
        <div className={styles.container}>
          <div className={styles.error}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.achievementsPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <img
              src="/ChatGPT Image Sep 16, 2025, 09_15_37 PM.png"
              alt="Trophy"
              className={styles.trophyIcon}
            />
            Достижения
          </h1>
          <p className={styles.subtitle}>
            Собирайте достижения, играя в игру и развивая свои навыки!
          </p>
        </div>

        {stats && (
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.earnedAchievements}</div>
              <div className={styles.statLabel}>Получено</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalAchievements}</div>
              <div className={styles.statLabel}>Всего</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalBonusPoints}</div>
              <div className={styles.statLabel}>Бонусных очков</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {stats.completionPercentage}%
              </div>
              <div className={styles.statLabel}>Завершено</div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${stats.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className={styles.filters}>
          <button
            className={`${styles.filterButton} ${
              activeFilter === 'all' ? styles.active : ''
            }`}
            onClick={() => setActiveFilter('all')}
          >
            Все
          </button>
          <button
            className={`${styles.filterButton} ${
              activeFilter === 'earned' ? styles.active : ''
            }`}
            onClick={() => setActiveFilter('earned')}
          >
            Получены
          </button>
          <button
            className={`${styles.filterButton} ${
              activeFilter === 'not_earned' ? styles.active : ''
            }`}
            onClick={() => setActiveFilter('not_earned')}
          >
            Не получены
          </button>
          {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              className={`${styles.filterButton} ${
                activeFilter === key ? styles.active : ''
              }`}
              onClick={() => setActiveFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {shouldGroupAchievements && (
          <div className={styles.groupControls}>
            <button
              className={styles.groupControlButton}
              onClick={handleExpandAll}
            >
              Развернуть все
            </button>
            <button
              className={styles.groupControlButton}
              onClick={handleCollapseAll}
            >
              Свернуть все
            </button>
          </div>
        )}

        <div className={styles.achievements}>
          {shouldGroupAchievements ? (
            // Группированное отображение для основных фильтров
            Object.entries(groupedAchievements).map(
              ([category, categoryAchievements]) => (
                <AchievementGroup
                  key={category}
                  category={category}
                  achievements={categoryAchievements}
                  onAchievementClick={handleAchievementClick}
                  isExpanded={expandedGroups.has(category)}
                  onToggle={() => handleToggleGroup(category)}
                />
              )
            )
          ) : (
            // Сетка для фильтров по категориям
            <div className={styles.achievementsGrid}>
              {filteredAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClick={handleAchievementClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AchievementModal
        achievement={selectedAchievement}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
