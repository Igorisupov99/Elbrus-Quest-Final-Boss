'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Achievements', [
      // 📚 Достижения за знания
      {
        key: 'first_steps',
        title: 'Первые шаги',
        description: 'Ответить правильно на первый вопрос',
        icon: '👶',
        category: 'knowledge',
        points: 10,
        rarity: 'common',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'know_it_all',
        title: 'Знаток',
        description: 'Ответить правильно на 10 вопросов подряд',
        icon: '🧠',
        category: 'knowledge',
        points: 50,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'erudite',
        title: 'Эрудит',
        description: 'Ответить правильно на 25 вопросов подряд',
        icon: '🎓',
        category: 'knowledge',
        points: 100,
        rarity: 'epic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'sage',
        title: 'Мудрец',
        description: 'Ответить правильно на 50 вопросов подряд',
        icon: '🧙‍♂️',
        category: 'knowledge',
        points: 200,
        rarity: 'legendary',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'perfectionist',
        title: 'Перфекционист',
        description: 'Пройти тему без единой ошибки',
        icon: '💯',
        category: 'knowledge',
        points: 25,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'phase1_expert',
        title: 'Эксперт фазы 1',
        description: 'Завершить все темы фазы 1',
        icon: '🏆',
        category: 'knowledge',
        points: 75,
        rarity: 'epic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'phase2_master',
        title: 'Мастер фазы 2',
        description: 'Завершить все темы фазы 2',
        icon: '👑',
        category: 'knowledge',
        points: 150,
        rarity: 'legendary',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 🎯 Достижения за экзамены
      {
        key: 'graduate',
        title: 'Выпускник',
        description: 'Сдать первый экзамен',
        icon: '🎓',
        category: 'exam',
        points: 50,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'master_degree',
        title: 'Магистр',
        description: 'Сдать второй экзамен',
        icon: '🏅',
        category: 'exam',
        points: 100,
        rarity: 'epic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'honor_student',
        title: 'Отличник',
        description: 'Сдать все экзамены без ошибок',
        icon: '⭐',
        category: 'exam',
        points: 200,
        rarity: 'legendary',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'lightning_exam',
        title: 'Молния',
        description: 'Сдать экзамен за время меньше 5 минут',
        icon: '⚡',
        category: 'speed',
        points: 75,
        rarity: 'epic',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ⚡ Достижения за скорость
      {
        key: 'quick_thinking',
        title: 'Быстрая мысль',
        description: 'Ответить на вопрос за 5 секунд',
        icon: '💨',
        category: 'speed',
        points: 15,
        rarity: 'common',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'sprinter',
        title: 'Спринтер',
        description: 'Ответить на 5 вопросов подряд за 10 секунд каждый',
        icon: '🏃‍♂️',
        category: 'speed',
        points: 50,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'record_holder',
        title: 'Рекордсмен',
        description: 'Самый быстрый ответ в лобби',
        icon: '🥇',
        category: 'speed',
        points: 30,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 💪 Достижения за упорство
      {
        key: 'failure_hero',
        title: 'Неудачник-герой',
        description: 'Дать 10 неправильных ответов, но продолжить игру',
        icon: '😅',
        category: 'persistence',
        points: 25,
        rarity: 'common',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'comeback',
        title: 'Возвращение',
        description: 'После 3 неправильных ответов дать 5 правильных подряд',
        icon: '🔥',
        category: 'persistence',
        points: 40,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'veteran',
        title: 'Ветеран',
        description: 'Завершить 10 игровых сессий',
        icon: '🎖️',
        category: 'persistence',
        points: 75,
        rarity: 'epic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'marathon_runner',
        title: 'Марафонец',
        description: 'Играть непрерывно 2 часа',
        icon: '🏃‍♀️',
        category: 'persistence',
        points: 100,
        rarity: 'epic',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 🤝 Социальные достижения
      {
        key: 'friend',
        title: 'Друг',
        description: 'Добавить первого друга',
        icon: '🤝',
        category: 'social',
        points: 20,
        rarity: 'common',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'popular',
        title: 'Популярный',
        description: 'Иметь 5 друзей',
        icon: '👥',
        category: 'social',
        points: 50,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'lobby_leader',
        title: 'Лидер лобби',
        description: 'Набрать наибольший счёт в лобби',
        icon: '👑',
        category: 'social',
        points: 30,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'team_player',
        title: 'Командный игрок',
        description: 'Играть в лобби с 4+ игроками',
        icon: '🤜🤛',
        category: 'social',
        points: 25,
        rarity: 'common',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 🏅 Достижения за очки
      {
        key: 'first_hundred',
        title: 'Первая сотня',
        description: 'Набрать 100 очков',
        icon: '💯',
        category: 'score',
        points: 10,
        rarity: 'common',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'thousand_points',
        title: 'Тысячник',
        description: 'Набрать 1000 очков',
        icon: '🔢',
        category: 'score',
        points: 50,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'millionaire',
        title: 'Миллионер',
        description: 'Набрать 10000 очков',
        icon: '💰',
        category: 'score',
        points: 200,
        rarity: 'legendary',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'session_rich',
        title: 'Богач сессии',
        description: 'Набрать 500+ очков за одну сессию',
        icon: '💎',
        category: 'score',
        points: 75,
        rarity: 'epic',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 🎪 Особые достижения
      {
        key: 'lucky_one',
        title: 'Счастливчик',
        description: 'Угадать правильный ответ с первой попытки в сложной теме',
        icon: '🍀',
        category: 'special',
        points: 40,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'explorer',
        title: 'Исследователь',
        description: 'Попробовать все доступные темы',
        icon: '🗺️',
        category: 'special',
        points: 60,
        rarity: 'epic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'creator',
        title: 'Создатель',
        description: 'Создать свою первую комнату',
        icon: '🏗️',
        category: 'special',
        points: 25,
        rarity: 'common',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'host',
        title: 'Хозяин',
        description: 'Быть создателем комнаты в 5 играх',
        icon: '🏠',
        category: 'special',
        points: 50,
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Achievements', null, {});
  }
};
