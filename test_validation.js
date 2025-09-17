const axios = require('axios');

// Тестовые данные для функции fibonacci
const testData = {
  taskId: 'test-fibonacci',
  userCode: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// И возвращаем, и выводим
const result = fibonacci(5);
console.log(result);
result;`,
  taskDescription: 'Напишите функцию fibonacci, которая возвращает n-е число Фибоначчи',
  testCases: [
    {
      "input": "5",
      "expectedOutput": "5",
      "description": "fibonacci(5) должно возвращать 5"
    },
    {
      "input": "10", 
      "expectedOutput": "55",
      "description": "fibonacci(10) должно возвращать 55"
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
