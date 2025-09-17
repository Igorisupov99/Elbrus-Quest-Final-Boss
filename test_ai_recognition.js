// Тест для проверки распознавания вопросов по программированию
const MessageManager = require('./server/src/services/MessageManager.js');

// Тестовые вопросы
const testQuestions = [
  // Оригинальный вопрос
  'Какой оператор для альтернативного блока?',
  
  // Дополнительные вопросы об операторах
  'Какой оператор используется для условного блока?',
  'Какой блок кода выполняется в else?',
  'Какая конструкция нужна для альтернативного блока?',
  'Оператор для альтернативного блока',
  'Блок кода в else',
  'Что означает оператор ?',
  'Что делает символ : в коде?',
  'Как работает оператор &&?',
  'Для чего нужен оператор ||?',
  'Что такое if в программировании?',
  'Что делает else в коде?',
  'Как работает switch конструкция?',
  'Синтаксис для условного блока',
  'Конструкция для альтернативного блока',
  'Инструкция для циклического блока',
  'Выражение для логического оператора',
  'Условие для ветвления кода',
  'Цикл для перебора массива',
  'Ветвление для обработки ошибок',
  'Альтернатива для условного выполнения',
  
  // Непрограммистские вопросы (должны быть отклонены)
  'Что такое любовь?',
  'Как приготовить борщ?',
  'Какая сегодня погода?',
  'Расскажи анекдот'
];

console.log('🧪 Тестирование распознавания вопросов по программированию\n');

let passedTests = 0;
let totalTests = testQuestions.length;

testQuestions.forEach((question, index) => {
  const isRelated = MessageManager.isProgrammingRelated(question);
  const shouldBeRelated = index < testQuestions.length - 4; // Последние 4 - непрограммистские
  
  const status = isRelated === shouldBeRelated ? '✅' : '❌';
  const category = isRelated ? 'ПРОГРАММИРОВАНИЕ' : 'НЕ ПРОГРАММИРОВАНИЕ';
  
  console.log(`${status} ${index + 1}. "${question}"`);
  console.log(`   Результат: ${category}`);
  
  if (isRelated === shouldBeRelated) {
    passedTests++;
  } else {
    console.log(`   ⚠️  Ожидалось: ${shouldBeRelated ? 'ПРОГРАММИРОВАНИЕ' : 'НЕ ПРОГРАММИРОВАНИЕ'}`);
  }
  console.log('');
});

console.log(`📊 Результаты тестирования:`);
console.log(`   Пройдено: ${passedTests}/${totalTests} тестов`);
console.log(`   Успешность: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('🎉 Все тесты пройдены успешно!');
} else {
  console.log('⚠️  Некоторые тесты не прошли. Требуется доработка.');
}
