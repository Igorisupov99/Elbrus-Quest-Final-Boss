const axios = require('axios');

async function testFilterValidation() {
  try {
    console.log('🧪 Тестируем валидацию функции filterArray...\n');
    
    const testData = {
      taskId: 'test-filter',
      userCode: `function filterArray(numbers, predicate) {
    // Инициализируем пустой массив для хранения отфильтрованных элементов     
    let filteredArray = [];

    // Проходим по каждому элементу исходного массива
    for (let i = 0; i < numbers.length; i++) {
        // Проверяем, удовлетворяет ли текущий элемент условию, заданному функцией-предикатом
        if (predicate(numbers[i])) {
            // Если элемент удовлетворяет условию, добавляем его в отфильтрованный массив
            filteredArray.push(numbers[i]);
        }
    }

    // Возвращаем отфильтрованный массив
    return filteredArray;
}`,
      taskDescription: 'Функция для фильтрации массива с помощью предиката',
      testCases: [
        { 
          input: [[1, 2, 3, 4, 5], (x) => x > 2], 
          expectedOutput: [3, 4, 5], 
          description: 'Фильтрация чисел больше 2' 
        },
        { 
          input: [[10, 20, 30, 40], (x) => x < 25], 
          expectedOutput: [10, 20], 
          description: 'Фильтрация чисел меньше 25' 
        },
        { 
          input: [[1, 3, 5, 7, 9], (x) => x % 2 === 0], 
          expectedOutput: [], 
          description: 'Фильтрация четных чисел из нечетных' 
        }
      ]
    };

    console.log('📤 Отправляем запрос на валидацию...');
    const response = await axios.post('http://localhost:3000/api/ai/ide/validate-code-test', testData);
    
    console.log('📥 Получен ответ:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.passedTests > 0) {
      console.log('\n✅ Исправление работает! Тесты проходят.');
    } else {
      console.log('\n❌ Проблема все еще существует.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    if (error.response) {
      console.error('Ответ сервера:', error.response.data);
    } else if (error.request) {
      console.error('Запрос не был отправлен:', error.request);
    } else {
      console.error('Ошибка настройки запроса:', error.message);
    }
  }
}

// Ждем немного, чтобы сервер запустился
setTimeout(testFilterValidation, 3000);
