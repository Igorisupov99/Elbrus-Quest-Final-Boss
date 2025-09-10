'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Phases
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

    // 2. Topics
    const topics = await queryInterface.bulkInsert('Topics', [
      {
        phase_id: 1,
        title: 'Переменные и типы данных',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 1,
        title: 'Условные конструкции и операторы',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 1,
        title: 'Циклы и итерации',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 1,
        title: 'Функции и область видимости',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 1,
        title: 'Массивы и объекты',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 2,
        title: 'HTML и семантическая верстка',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 2,
        title: 'CSS: Flexbox и Grid',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 2,
        title: 'Основы JavaScript',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 2,
        title: 'DOM manipulation',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 2,
        title: 'События и обработчики',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // 3. Questions
    await queryInterface.bulkInsert('Questions', [
      {
        topic_id: 1,
        question_text: 'Какой тип данных для целых чисел?',
        correct_answer: 'number',
        mentor_tip: 'Number используется для целых и дробных чисел',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 1,
        question_text: 'Какой тип для истина/ложь?',
        correct_answer: 'boolean',
        mentor_tip: 'Boolean может быть true или false',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 1,
        question_text: 'Какой тип для текста?',
        correct_answer: 'string',
        mentor_tip: 'String представляет текстовые данные',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 2. Условные конструкции
      {
        topic_id: 2,
        question_text: 'Какой оператор для условия?',
        correct_answer: 'if',
        mentor_tip: 'if проверяет условие и выполняет код если true',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 2,
        question_text: 'Какой оператор для альтернативы?',
        correct_answer: 'else',
        mentor_tip: 'else выполняется если условие if false',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 2,
        question_text: 'Какой оператор для множественного выбора?',
        correct_answer: 'switch',
        mentor_tip: 'switch сравнивает значение с несколькими case',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 3. Циклы
      {
        topic_id: 3,
        question_text: 'Какой цикл с счетчиком?',
        correct_answer: 'for',
        mentor_tip: 'for используется когда известно количество итераций',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 3,
        question_text: 'Какой цикл с условием?',
        correct_answer: 'while',
        mentor_tip: 'while выполняется пока условие истинно',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 3,
        question_text: 'Какой цикл с пост-условием?',
        correct_answer: 'do-while',
        mentor_tip: 'do-while выполняется хотя бы один раз',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 4. Функции
      {
        topic_id: 4,
        question_text: 'Как объявить функцию?',
        correct_answer: 'function',
        mentor_tip: 'function имя() { } объявляет функцию',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 4,
        question_text: 'Как вернуть значение?',
        correct_answer: 'return',
        mentor_tip: 'return возвращает значение из функции',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 4,
        question_text: 'Какие функции без имени?',
        correct_answer: 'arrow',
        mentor_tip: 'Стрелочные функции: () => { }',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 5. Массивы и объекты
      {
        topic_id: 5,
        question_text: 'Как создать массив?',
        correct_answer: '[]',
        mentor_tip: 'Квадратные скобки создают массив',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 5,
        question_text: 'Как создать объект?',
        correct_answer: '{}',
        mentor_tip: 'Фигурные скобки создают объект',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 5,
        question_text: 'Как получить свойство объекта?',
        correct_answer: 'dot',
        mentor_tip: 'Через точку: объект.свойство',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // === ФАЗА 1 ===
      
      // 6. HTML
      {
        topic_id: 6,
        question_text: 'Какой тег для заголовка?',
        correct_answer: 'h1',
        mentor_tip: 'h1-h6 для заголовков разного уровня',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 6,
        question_text: 'Какой тег для ссылки?',
        correct_answer: 'a',
        mentor_tip: 'Тег <a> создает гиперссылки',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 6,
        question_text: 'Какой тег для изображения?',
        correct_answer: 'img',
        mentor_tip: 'Тег <img> вставляет изображение',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 7. CSS
      {
        topic_id: 7,
        question_text: 'Как изменить цвет?',
        correct_answer: 'color',
        mentor_tip: 'Свойство color меняет цвет текста',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 7,
        question_text: 'Как изменить размер?',
        correct_answer: 'font-size',
        mentor_tip: 'font-size изменяет размер шрифта',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 7,
        question_text: 'Как выровнять по центру?',
        correct_answer: 'center',
        mentor_tip: 'text-align: center выравнивает текст',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 8. Основы JavaScript
      {
        topic_id: 8,
        question_text: 'Как объявить переменную?',
        correct_answer: 'let',
        mentor_tip: 'let и const для объявления переменных',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 8,
        question_text: 'Как проверить равенство?',
        correct_answer: '===',
        mentor_tip: '=== строгое равенство без приведения типов',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 8,
        question_text: 'Как объединить строки?',
        correct_answer: 'concat',
        mentor_tip: 'Метод concat или оператор +',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 9. DOM manipulation
      {
        topic_id: 9,
        question_text: 'Как найти элемент?',
        correct_answer: 'querySelector',
        mentor_tip: 'document.querySelector("селектор")',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 9,
        question_text: 'Как изменить текст?',
        correct_answer: 'textContent',
        mentor_tip: 'element.textContent = "новый текст"',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 9,
        question_text: 'Как добавить класс?',
        correct_answer: 'classList',
        mentor_tip: 'element.classList.add("класс")',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 10. События
      {
        topic_id: 10,
        question_text: 'Событие клика?',
        correct_answer: 'click',
        mentor_tip: 'element.addEventListener("click", функция)',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 10,
        question_text: 'Событие загрузки?',
        correct_answer: 'load',
        mentor_tip: 'window.addEventListener("load", функция)',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 10,
        question_text: 'Событие ввода?',
        correct_answer: 'input',
        mentor_tip: 'input.addEventListener("input", функция)',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // 4. Users
    const passwordHash = await bcrypt.hash('1234Oo', 10);

    const users = await queryInterface.bulkInsert('Users', [
      {
        username: 'admin',
        email: 'admin@elbrusbootcamp.com',
        password_hash: passwordHash,
        role: 'admin',
        score: 0,
        games_completed: 0,
        image_url: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'student1',
        email: 'student1@example.com',
        password_hash: passwordHash,
        role: 'user',
        score: 150,
        games_completed: 2,
        image_url: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'testuser',
        email: 'testuser@example.com',
        password_hash: passwordHash,
        role: 'user',
        score: 0,
        games_completed: 0,
        image_url: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // 5. GameSessions
    const gameSessions = await queryInterface.bulkInsert('GameSessions', [
      {
        phase_id: 1,
        current_topic_id: 1,
        current_question_id: 1,
        room_code: 'TEST123',
        room_name: 'Тестовая комната',
        room_creator: 'student1',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 1,
        current_topic_id: 2,
        current_question_id: 4,
        room_code: 'USER123',
        room_name: 'Комната TestUser',
        room_creator: 'testuser',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // 6. UserSessions
    await queryInterface.bulkInsert('UserSessions', [
      {
        game_session_id: 1,
        user_id: 2,
        player_name: 'Тестовый_игрок',
        score: 10,
        is_user_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        game_session_id: 2,
        user_id: 3, // testuser
        player_name: 'Игрок_TestUser',
        score: 0,
        is_user_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // 7. Achievements will be seeded by the dedicated achievements seeder
    // Remove duplicate achievements from test seeder to avoid conflicts

    // UserAchievements will be handled separately or by the achievements seeder
    // to avoid foreign key constraint issues with achievement_id references
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserSessions', null, {});
    await queryInterface.bulkDelete('GameSessions', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Questions', null, {});
    await queryInterface.bulkDelete('Topics', null, {});
    await queryInterface.bulkDelete('Phases', null, {});
  }
};
