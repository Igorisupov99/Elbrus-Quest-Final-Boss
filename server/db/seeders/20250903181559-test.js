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
      },
      {
        title: 'Фаза 2: Backend разработка',
        description: 'Node.js, Express, базы данных и API разработка',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Фаза 3: React',
        description: 'React, компоненты, хуки и современные паттерны',
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
      },
      // === ФАЗА 2: BACKEND ===
      {
        phase_id: 3,
        title: 'Node.js и основы серверной разработки',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 3,
        title: 'Express.js и маршрутизация',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 3,
        title: 'Работа с базами данных',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 3,
        title: 'REST API и HTTP методы',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 3,
        title: 'Аутентификация и авторизация',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // === ФАЗА 3: REACT ===
      {
        phase_id: 4,
        title: 'Основы React и компоненты',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 4,
        title: 'Props и State',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 4,
        title: 'Хуки (Hooks)',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 4,
        title: 'Управление состоянием',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 4,
        title: 'Роутинг и навигация',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // 3. Questions
    await queryInterface.bulkInsert('Questions', [
      {
        topic_id: 1,
        question_text: 'Какой тип данных для чисел?',
        correct_answer: 'number',
        mentor_tip: 'Number используется для целых и дробных чисел',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 1,
        question_text: 'Какой тип для true/false?',
        correct_answer: 'boolean',
        mentor_tip: 'Boolean может быть true или false',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 1,
        question_text: 'Какой тип для строк?',
        correct_answer: 'string',
        mentor_tip: 'String представляет текстовые данные',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 2. Условные конструкции
      {
        topic_id: 2,
        question_text: 'Какой оператор для проверки условия?',
        correct_answer: 'if',
        mentor_tip: 'if проверяет условие и выполняет код если true',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 2,
        question_text: 'Какой оператор для альтернативного блока?',
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
        question_text: 'Какой цикл использует счетчик?',
        correct_answer: 'for',
        mentor_tip: 'for используется когда известно количество итераций',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 3,
        question_text: 'Какой цикл проверяет условие в начале?',
        correct_answer: 'while',
        mentor_tip: 'while выполняется пока условие истинно',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 3,
        question_text: 'Какой цикл проверяет условие в конце?',
        correct_answer: 'do-while',
        mentor_tip: 'do-while выполняется хотя бы один раз',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 4. Функции
      {
        topic_id: 4,
        question_text: 'Какое ключевое слово объявляет функцию?',
        correct_answer: 'function',
        mentor_tip: 'function имя() { } объявляет функцию',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 4,
        question_text: 'Какое ключевое слово возвращает значение?',
        correct_answer: 'return',
        mentor_tip: 'return возвращает значение из функции',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 4,
        question_text: 'Как называются функции со стрелкой?',
        correct_answer: 'arrow',
        mentor_tip: 'Стрелочные функции: () => { }',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 5. Массивы и объекты
      {
        topic_id: 5,
        question_text: 'Какие скобки создают массив?',
        correct_answer: '[]',
        mentor_tip: 'Квадратные скобки создают массив',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 5,
        question_text: 'Какие скобки создают объект?',
        correct_answer: '{}',
        mentor_tip: 'Фигурные скобки создают объект',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 5,
        question_text: 'Какой символ для доступа к свойству?',
        correct_answer: '.',
        mentor_tip: 'Точка: объект.свойство',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // === ФАЗА 1 ===
      
      // 6. HTML
      {
        topic_id: 6,
        question_text: 'Какой тег создает заголовок?',
        correct_answer: 'h1',
        mentor_tip: 'h1-h6 для заголовков разного уровня',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 6,
        question_text: 'Какой тег создает ссылку?',
        correct_answer: 'a',
        mentor_tip: 'Тег <a> создает гиперссылки',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 6,
        question_text: 'Какой тег вставляет изображение?',
        correct_answer: 'img',
        mentor_tip: 'Тег <img> вставляет изображение',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 7. CSS
      {
        topic_id: 7,
        question_text: 'Какое свойство меняет цвет текста?',
        correct_answer: 'color',
        mentor_tip: 'Свойство color меняет цвет текста',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 7,
        question_text: 'Какое свойство меняет размер шрифта?',
        correct_answer: 'font-size',
        mentor_tip: 'font-size изменяет размер шрифта',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 7,
        question_text: 'Какое значение выравнивает по центру?',
        correct_answer: 'center',
        mentor_tip: 'text-align: center выравнивает текст',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 8. Основы JavaScript
      {
        topic_id: 8,
        question_text: 'Какое ключевое слово объявляет изменяемую переменную?',
        correct_answer: 'let',
        mentor_tip: 'let и const для объявления переменных',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 8,
        question_text: 'Какой оператор строгого равенства?',
        correct_answer: '===',
        mentor_tip: '=== строгое равенство без приведения типов',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 8,
        question_text: 'Какой оператор объединяет строки?',
        correct_answer: '+',
        mentor_tip: 'Оператор + объединяет строки',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 9. DOM manipulation
      {
        topic_id: 9,
        question_text: 'Какой метод находит элемент?',
        correct_answer: 'querySelector',
        mentor_tip: 'document.querySelector("селектор")',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 9,
        question_text: 'Какое свойство меняет текст?',
        correct_answer: 'textContent',
        mentor_tip: 'element.textContent = "новый текст"',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 9,
        question_text: 'Какое свойство управляет классами?',
        correct_answer: 'classList',
        mentor_tip: 'element.classList.add("класс")',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 10. События
      {
        topic_id: 10,
        question_text: 'Какое событие срабатывает при клике?',
        correct_answer: 'click',
        mentor_tip: 'element.addEventListener("click", функция)',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 10,
        question_text: 'Какое событие срабатывает при загрузке?',
        correct_answer: 'load',
        mentor_tip: 'window.addEventListener("load", функция)',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 10,
        question_text: 'Какое событие срабатывает при вводе?',
        correct_answer: 'input',
        mentor_tip: 'input.addEventListener("input", функция)',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // === ФАЗА 2: BACKEND ===
      
      // 11. Node.js и основы серверной разработки
      {
        topic_id: 11,
        question_text: 'Какая команда запускает Node.js файл?',
        correct_answer: 'node',
        mentor_tip: 'node filename.js запускает JavaScript файл',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 11,
        question_text: 'Какой модуль создает HTTP сервер?',
        correct_answer: 'http',
        mentor_tip: 'const http = require("http") для создания сервера',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 11,
        question_text: 'Какой метод создает сервер?',
        correct_answer: 'createServer',
        mentor_tip: 'http.createServer() создает HTTP сервер',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 12. Express.js и маршрутизация
      {
        topic_id: 12,
        question_text: 'Какая команда устанавливает Express?',
        correct_answer: 'npm',
        mentor_tip: 'npm install express устанавливает фреймворк',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 12,
        question_text: 'Какая функция создает Express приложение?',
        correct_answer: 'express',
        mentor_tip: 'const app = express() создает приложение',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 12,
        question_text: 'Какой метод создает GET маршрут?',
        correct_answer: 'get',
        mentor_tip: 'app.get("/путь", функция) создает GET маршрут',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 13. Работа с базами данных
      {
        topic_id: 13,
        question_text: 'Какой ORM используется в Node.js?',
        correct_answer: 'sequelize',
        mentor_tip: 'Sequelize - популярный ORM для работы с БД',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 13,
        question_text: 'Какой метод проверяет подключение к БД?',
        correct_answer: 'authenticate',
        mentor_tip: 'sequelize.authenticate() проверяет подключение',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 13,
        question_text: 'Какой метод создает модель?',
        correct_answer: 'define',
        mentor_tip: 'sequelize.define() создает модель таблицы',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 14. REST API и HTTP методы
      {
        topic_id: 14,
        question_text: 'Какой HTTP метод получает данные?',
        correct_answer: 'GET',
        mentor_tip: 'GET используется для получения ресурсов',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 14,
        question_text: 'Какой HTTP метод создает данные?',
        correct_answer: 'POST',
        mentor_tip: 'POST создает новые ресурсы',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 14,
        question_text: 'Какой HTTP метод обновляет данные?',
        correct_answer: 'PUT',
        mentor_tip: 'PUT полностью обновляет ресурс',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 15. Аутентификация и авторизация
      {
        topic_id: 15,
        question_text: 'Какой алгоритм хеширует пароли?',
        correct_answer: 'bcrypt',
        mentor_tip: 'bcrypt безопасно хеширует пароли',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 15,
        question_text: 'Какой формат используется для токенов?',
        correct_answer: 'JWT',
        mentor_tip: 'JSON Web Token для аутентификации',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 15,
        question_text: 'Какой метод проверяет токен?',
        correct_answer: 'verify',
        mentor_tip: 'jwt.verify() проверяет валидность токена',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // === ФАЗА 3: REACT ===
      
      // 16. Основы React и компоненты
      {
        topic_id: 16,
        question_text: 'Какой способ создания React компонента?',
        correct_answer: 'function',
        mentor_tip: 'function ComponentName() { return JSX }',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 16,
        question_text: 'Как называется синтаксис React?',
        correct_answer: 'JSX',
        mentor_tip: 'JSX позволяет писать HTML в JavaScript',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 16,
        question_text: 'Какой метод отображает компонент?',
        correct_answer: 'render',
        mentor_tip: 'ReactDOM.render() отображает компонент',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 17. Props и State
      {
        topic_id: 17,
        question_text: 'Как называются данные компонента?',
        correct_answer: 'props',
        mentor_tip: 'Props передаются как атрибуты компонента',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 17,
        question_text: 'Какой хук создает состояние?',
        correct_answer: 'useState',
        mentor_tip: 'const [state, setState] = useState(начальное)',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 17,
        question_text: 'Как называется функция обновления состояния?',
        correct_answer: 'setState',
        mentor_tip: 'setState(новое_значение) обновляет состояние',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 18. Хуки (Hooks)
      {
        topic_id: 18,
        question_text: 'Какой хук выполняет побочные эффекты?',
        correct_answer: 'useEffect',
        mentor_tip: 'useEffect() выполняет побочные эффекты',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 18,
        question_text: 'Какой хук получает контекст?',
        correct_answer: 'useContext',
        mentor_tip: 'useContext() получает значение контекста',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 18,
        question_text: 'Какой хук кэширует вычисления?',
        correct_answer: 'useMemo',
        mentor_tip: 'useMemo() кэширует вычисления',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 19. Управление состоянием
      {
        topic_id: 19,
        question_text: 'Какой паттерн управляет глобальным состоянием?',
        correct_answer: 'redux',
        mentor_tip: 'Redux управляет глобальным состоянием',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 19,
        question_text: 'Какой хук получает данные из Redux?',
        correct_answer: 'useSelector',
        mentor_tip: 'useSelector() получает данные из store',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 19,
        question_text: 'Какой хук отправляет actions в Redux?',
        correct_answer: 'useDispatch',
        mentor_tip: 'useDispatch() отправляет actions',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 20. Роутинг и навигация
      {
        topic_id: 20,
        question_text: 'Какой пакет используется для роутинга?',
        correct_answer: 'react-router',
        mentor_tip: 'react-router-dom для навигации в React',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 20,
        question_text: 'Какой компонент определяет маршруты?',
        correct_answer: 'Route',
        mentor_tip: '<Route path="/путь" component={Компонент} />',
        question_type: 'тип',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topic_id: 20,
        question_text: 'Какой компонент создает навигационные ссылки?',
        correct_answer: 'Link',
        mentor_tip: '<Link to="/путь">Текст</Link> создает ссылку',
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
        room_name: 'Тестовая комната - Основы',
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
        room_name: 'Комната TestUser - Frontend',
        room_creator: 'testuser',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 3,
        current_topic_id: 11,
        current_question_id: 31,
        room_code: 'BACKEND1',
        room_name: 'Backend комната - Node.js',
        room_creator: 'admin',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        phase_id: 4,
        current_topic_id: 16,
        current_question_id: 46,
        room_code: 'REACT1',
        room_name: 'React комната - Компоненты',
        room_creator: 'admin',
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
      },
      {
        game_session_id: 3,
        user_id: 1, // admin
        player_name: 'Admin_Backend',
        score: 25,
        is_user_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        game_session_id: 4,
        user_id: 2, // student1
        player_name: 'Student_React',
        score: 15,
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
