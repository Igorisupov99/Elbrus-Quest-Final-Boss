'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Создаем Phases
    const phases = await queryInterface.bulkInsert('Phases', [
      {
        title: 'Фаза 0: Основы программирования',
        description: 'Введение в основы программирования, алгоритмы и структуры данных',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Фаза 1: Frontend разработка',
        description: 'HTML, CSS, JavaScript и современные фреймворки',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // 2. Создаем Topics
    const topics = await queryInterface.bulkInsert('Topics', [
      {
        phase_id: 1,
        title: 'Переменные и типы данных',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 1,
        title: 'Условные конструкции',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 2,
        title: 'HTML и семантическая верстка',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // 3. Создаем Questions
    await queryInterface.bulkInsert('Questions', [
      {
        topic_id: 1,
        question_text: 'Что такое переменная в программировании?',
        correct_answer: 'Именованная область памяти для хранения данных',
        question_type: 'тип',
        mentor_tip: 'Переменная это контейнер для хранения информации',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 2,
        question_text: 'Как работает оператор if-else?',
        correct_answer: 'Выполняет код в блоке if если условие истинно, иначе в блоке else',
        question_type: 'тип',
        mentor_tip: 'if (условие) { код } else { альтернативный код }',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // 4. Создаем Users
    const users = await queryInterface.bulkInsert('Users', [
      {
        username: 'admin',
        email: 'admin@elbrusbootcamp.com',
        password_hash: '$2b$10$examplehash',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'student1',
        email: 'student1@example.com',
        password_hash: '$2b$10$examplehash',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // 5. Создаем GameSessions
    const gameSessions = await queryInterface.bulkInsert('GameSessions', [
      {
        phase_id: 1,
        room_code: 'TEST123',
        room_name: 'Тестовая комната',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // 6. Создаем UserSessions
    await queryInterface.bulkInsert('UserSessions', [
      {
        game_session_id: 1,
        user_id: 2,
        player_name: 'Тестовый_игрок',
        score: 10,
        is_user_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Удаляем в обратном порядке
    await queryInterface.bulkDelete('UserSessions', null, {});
    await queryInterface.bulkDelete('GameSessions', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Questions', null, {});
    await queryInterface.bulkDelete('Topics', null, {});
    await queryInterface.bulkDelete('Phases', null, {});
  }
};