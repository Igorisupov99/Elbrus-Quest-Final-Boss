// Примеры кода для CodeRunner компонента

export const examples = {
  javascript: {
    basic: `// Базовый пример JavaScript
console.log('Привет, мир!');

// Переменные
const name = 'CodeRunner';
const version = '1.0.0';

console.log(\`Добро пожаловать в \${name} v\${version}\`);

// Функции
function greet(name) {
  return \`Привет, \${name}!\`;
}

console.log(greet('Пользователь'));`,

    algorithms: `// Алгоритмы и структуры данных
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Числа Фибоначчи:');
for (let i = 0; i <= 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}

// Сортировка пузырьком
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log('Исходный массив:', numbers);
console.log('Отсортированный массив:', bubbleSort([...numbers]));`,

    async: `// Асинхронное программирование
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function asyncExample() {
  console.log('Начало выполнения...');
  
  await delay(1000);
  console.log('Прошла 1 секунда');
  
  await delay(1000);
  console.log('Прошло 2 секунды');
  
  return 'Выполнение завершено!';
}

// Запуск асинхронной функции
asyncExample().then(result => {
  console.log('Результат:', result);
});`,

    objects: `// Работа с объектами и массивами
const users = [
  { id: 1, name: 'Алексей', age: 25, city: 'Москва' },
  { id: 2, name: 'Мария', age: 30, city: 'Санкт-Петербург' },
  { id: 3, name: 'Дмитрий', age: 28, city: 'Москва' },
  { id: 4, name: 'Анна', age: 22, city: 'Казань' }
];

console.log('Все пользователи:', users);

// Фильтрация
const moscowUsers = users.filter(user => user.city === 'Москва');
console.log('Пользователи из Москвы:', moscowUsers);

// Сортировка по возрасту
const sortedByAge = users.sort((a, b) => a.age - b.age);
console.log('Отсортировано по возрасту:', sortedByAge);

// Группировка по городу
const groupedByCity = users.reduce((acc, user) => {
  if (!acc[user.city]) {
    acc[user.city] = [];
  }
  acc[user.city].push(user);
  return acc;
}, {});

console.log('Группировка по городам:', groupedByCity);`
  },

  typescript: {
    basic: `// Базовый пример TypeScript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // Опциональное свойство
}

class UserManager {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
    console.log(\`Пользователь \${user.name} добавлен\`);
  }

  findUser(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  getAllUsers(): User[] {
    return [...this.users];
  }
}

// Использование
const userManager = new UserManager();

userManager.addUser({
  id: 1,
  name: 'Иван',
  email: 'ivan@example.com',
  age: 25
});

userManager.addUser({
  id: 2,
  name: 'Елена',
  email: 'elena@example.com'
});

console.log('Все пользователи:', userManager.getAllUsers());`,

    generics: `// Дженерики в TypeScript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function createApiResponse<T>(data: T, status: number = 200, message: string = 'Success'): ApiResponse<T> {
  return { data, status, message };
}

// Использование с разными типами
const userResponse = createApiResponse({ id: 1, name: 'Алексей' });
const productResponse = createApiResponse({ id: 1, title: 'Товар', price: 1000 });

console.log('Ответ пользователя:', userResponse);
console.log('Ответ товара:', productResponse);

// Функция с ограничениями дженериков
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = { name: 'Мария', age: 30, city: 'Москва' };
console.log('Имя:', getProperty(person, 'name'));
console.log('Возраст:', getProperty(person, 'age'));`,

    advanced: `// Продвинутые возможности TypeScript
type Status = 'loading' | 'success' | 'error';

interface State<T> {
  data: T | null;
  status: Status;
  error: string | null;
}

class AsyncState<T> {
  private state: State<T> = {
    data: null,
    status: 'loading',
    error: null
  };

  async fetchData(fetcher: () => Promise<T>): Promise<void> {
    try {
      this.state.status = 'loading';
      this.state.error = null;
      
      const data = await fetcher();
      this.state.data = data;
      this.state.status = 'success';
      
      console.log('Данные загружены:', data);
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Неизвестная ошибка';
      this.state.status = 'error';
      
      console.error('Ошибка загрузки:', this.state.error);
    }
  }

  getState(): State<T> {
    return { ...this.state };
  }
}

// Использование
const asyncState = new AsyncState<string>();

// Имитация асинхронной загрузки
asyncState.fetchData(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return 'Данные успешно загружены!';
});`
  }
};

export const getRandomExample = (language: 'javascript' | 'typescript'): string => {
  const examplesList = Object.values(examples[language]);
  const randomIndex = Math.floor(Math.random() * examplesList.length);
  return examplesList[randomIndex];
};
