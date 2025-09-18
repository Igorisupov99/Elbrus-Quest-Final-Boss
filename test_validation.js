const axios = require('axios');

// Тестовые данные для функции countFrequency
const testData = {
  taskId: 'test-count-frequency',
  userCode: `function countFrequency(input) {
  // Если входной параметр - объект, возвращаем его ключи
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    return Object.keys(input);
  }
  
  // Если это массив, работаем как раньше
  if (Array.isArray(input)) {
    // Инициализируем пустой объект для хранения частот элементов
    const frequency = {};

    // Проходим по каждому элементу массива
    for (let i = 0; i < input.length; i++) {
      const element = input[i];

      // Если элемент уже есть в объекте, увеличиваем его частоту на 1
      if (frequency[element]) {
        frequency[element]++;
      } else {
        // Если элемента ещё нет в объекте, добавляем его с частотой 1
        frequency[element] = 1;
      }
    }

    // Находим элементы, которые встречаются только один раз (уникальные)
    const uniqueElements = [];
    for (const element in frequency) {
      if (frequency[element] === 1) {
        uniqueElements.push(Number(element));
      }
    }

    // Возвращаем массив уникальных элементов
    return uniqueElements;
  }
  
  // Для других типов данных возвращаем пустой массив
  return [];
}`,
  taskDescription: 'Напишите функцию countFrequency, которая принимает объект и возвращает массив его ключей',
  testCases: [
    {
      "input": {"a": 1, "b": 2, "c": 3},
      "expectedOutput": ["a", "b", "c"],
      "description": "Ключи объекта"
    },
    {
      "input": {"x": 10, "y": 20},
      "expectedOutput": ["x", "y"],
      "description": "Значения объекта"
    },
    {
      "input": {},
      "expectedOutput": [],
      "description": "Пустой объект"
    }
  ]
};

async function testValidation() {
  try {
    console.log('🧪 Тестируем валидацию кода...');
    console.log('Код:', testData.userCode);
    console.log('Тестовые случаи:', JSON.stringify(testData.testCases, null, 2));
    
    const response = await axios.post('http://localhost:3001/api/ai/ide/validate-code', testData);
    
    console.log('\n✅ Результат валидации:');
    console.log('Пройдено тестов:', response.data.passedTests, '/', response.data.totalTests);
    console.log('Все тесты пройдены:', response.data.isCorrect);
    
    if (response.data.testResults) {
      console.log('\n📊 Детали тестов:');
      response.data.testResults.forEach((test, index) => {
        console.log(`Тест ${index + 1}: ${test.passed ? '✅' : '❌'} ${test.testCase.description}`);
        console.log(`  Ожидалось: ${test.expectedOutput} (${typeof test.expectedOutput})`);
        console.log(`  Получено: ${test.actualOutput} (${typeof test.actualOutput})`);
      });
    }
    
    if (response.data.errorMessage) {
      console.log('❌ Ошибка:', response.data.errorMessage);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    if (error.response) {
      console.error('Ответ сервера:', error.response.data);
    }
  }
}

// Ждем немного, чтобы сервер запустился
setTimeout(testValidation, 3000);
