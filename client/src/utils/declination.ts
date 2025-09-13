/**
 * Утилиты для склонения слов в русском языке
 */

/**
 * Склоняет слово "друг" в зависимости от числа
 * @param count - количество друзей
 * @returns правильную форму слова "друг"
 */
export function declineFriend(count: number): string {
  // Получаем последнюю цифру числа
  const lastDigit = count % 10;
  // Получаем последние две цифры числа
  const lastTwoDigits = count % 100;

  // Если число заканчивается на 1 (но не 11) — "друг"
  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'друг';
  }
  
  // Если заканчивается на 2, 3, 4 (но не 12–14) — "друга"
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return 'друга';
  }
  
  // Во всех остальных случаях — "друзей"
  return 'друзей';
}

/**
 * Возвращает строку с правильным склонением количества друзей
 * @param count - количество друзей
 * @returns строка вида "5 друзей", "1 друг", "3 друга"
 */
export function getFriendsCountText(count: number): string {
  return `${count} ${declineFriend(count)}`;
}

/**
 * Тесты для проверки правильности склонения
 */
export function testDeclination(): void {
  const testCases = [
    { count: 0, expected: 'друзей' },
    { count: 1, expected: 'друг' },
    { count: 2, expected: 'друга' },
    { count: 3, expected: 'друга' },
    { count: 4, expected: 'друга' },
    { count: 5, expected: 'друзей' },
    { count: 10, expected: 'друзей' },
    { count: 11, expected: 'друзей' },
    { count: 12, expected: 'друзей' },
    { count: 13, expected: 'друзей' },
    { count: 14, expected: 'друзей' },
    { count: 15, expected: 'друзей' },
    { count: 20, expected: 'друзей' },
    { count: 21, expected: 'друг' },
    { count: 22, expected: 'друга' },
    { count: 23, expected: 'друга' },
    { count: 24, expected: 'друга' },
    { count: 25, expected: 'друзей' },
    { count: 101, expected: 'друг' },
    { count: 102, expected: 'друга' },
    { count: 105, expected: 'друзей' },
    { count: 111, expected: 'друзей' },
    { count: 112, expected: 'друзей' },
    { count: 121, expected: 'друг' },
    { count: 122, expected: 'друга' },
  ];

  console.log('🧪 Тестирование склонения слова "друг":');
  
  let allTestsPassed = true;
  testCases.forEach(({ count, expected }) => {
    const result = declineFriend(count);
    const passed = result === expected;
    if (!passed) {
      console.error(`❌ ОШИБКА: ${count} -> ожидалось "${expected}", получено "${result}"`);
      allTestsPassed = false;
    } else {
      console.log(`✅ ${count} ${result}`);
    }
  });

  if (allTestsPassed) {
    console.log('🎉 Все тесты пройдены успешно!');
  } else {
    console.error('❌ Некоторые тесты не прошли');
  }
}
