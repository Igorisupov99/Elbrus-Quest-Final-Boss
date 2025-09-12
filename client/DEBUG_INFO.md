# 🔍 Отладка перерендеров в магазине аватаров

## 📊 Добавлено логирование для отладки:

### 1. Селекторы Redux:
- `📦 avatars selector` - когда вызывается селектор аватаров
- `👤 userAvatars selector` - когда вызывается селектор аватаров пользователя  
- `🎭 currentAvatar selector` - когда вызывается селектор текущего аватара
- `💰 userScore selector` - когда вызывается селектор очков пользователя

### 2. Мемоизированные вычисления:
- `🔄 avatarCardsData recalculating` - когда пересчитываются данные карточек
- `🔍 filteredAvatarCardsData recalculating` - когда пересчитывается фильтрация

### 3. Рендеры компонентов:
- `🚀 SimpleAvatarShop render` - когда рендерится основной компонент

## 🎯 Как использовать для отладки:

1. **Откройте консоль браузера** (F12)
2. **Перейдите в магазин аватаров**
3. **Нажмите "надеть/снять"** на любом аватаре
4. **Посмотрите на логи** - какие селекторы вызываются

## 🔍 Ожидаемое поведение (хорошо):

```
🚀 SimpleAvatarShop render
📦 avatars selector
👤 userAvatars selector  
🎭 currentAvatar selector
💰 userScore selector
🔄 avatarCardsData recalculating
🔍 filteredAvatarCardsData recalculating
```

## ❌ Проблемное поведение (плохо):

```
🚀 SimpleAvatarShop render
🚀 SimpleAvatarShop render  // Множественные рендеры
📦 avatars selector
📦 avatars selector  // Дублирующиеся селекторы
👤 userAvatars selector
👤 userAvatars selector
```

## 🎯 Цель:

Найти, какой именно селектор вызывает лишние перерендеры, и исправить его.

## 📝 Следующие шаги:

1. Протестировать в браузере
2. Найти проблемный селектор
3. Исправить зависимости или логику
4. Убрать отладочные логи
