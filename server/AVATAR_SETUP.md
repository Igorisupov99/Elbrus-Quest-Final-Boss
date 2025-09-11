# Настройка системы аватаров

## Шаги для запуска системы аватаров:

### 1. Запустить миграции
```bash
cd server
npx sequelize-cli db:migrate
```

### 2. Запустить сидеры
```bash
npx sequelize-cli db:seed:all
```

### 3. Перезапустить сервер
```bash
npm start
```

## Что создается:

### Таблицы:
- `avatars` - таблица аватаров
- `user_avatars` - связь пользователей с аватарами

### API эндпоинты:
- `GET /api/avatars` - получить все аватары с фильтрацией
- `GET /api/avatars/user` - получить аватары пользователя
- `POST /api/avatars/purchase` - купить аватар
- `POST /api/avatars/equip` - надеть аватар
- `POST /api/avatars/unequip` - снять аватар
- `GET /api/avatars/current` - получить текущий аватар

### Тестовые данные:
- 14 аватаров разных категорий и редкости
- Цены от 50 до 600 очков
