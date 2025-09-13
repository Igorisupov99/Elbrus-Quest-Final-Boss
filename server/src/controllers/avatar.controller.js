const db = require('../../db/models');
const { Op } = require('sequelize');

// Получить все аватары с фильтрацией
const getAvatars = async (req, res) => {
  try {
    const { category, rarity, showOwned, showLocked, search } = req.query;
    const userId = req.user.id;

    // Базовые условия
    const where = { isActive: true };
    
    // Фильтр по категории
    if (category) {
      where.category = category;
    }
    
    // Фильтр по редкости
    if (rarity) {
      where.rarity = rarity;
    }
    
    // Фильтр по поиску
    if (search) {
      where.name = {
        [Op.iLike]: `%${search}%`
      };
    }

    // Получаем аватары
    const avatars = await db.Avatar.findAll({
      where,
      order: [['price', 'ASC']]
    });

    // Получаем аватары пользователя
    const userAvatars = await db.UserAvatar.findAll({
      where: { userId },
      include: [{
        model: db.Avatar,
        as: 'avatar'
      }]
    });

    const ownedAvatarIds = new Set(userAvatars.map(ua => ua.avatarId));

    // Добавляем информацию о владении
    const avatarsWithOwnership = avatars.map(avatar => {
      const isOwned = ownedAvatarIds.has(avatar.id);
      
      // Применяем фильтры владения
      if (showOwned === 'true' && !isOwned) return null;
      if (showLocked === 'true' && isOwned) return null;
      
      return {
        ...avatar.toJSON(),
        isOwned: isOwned
      };
    }).filter(Boolean);

    res.json(avatarsWithOwnership);
  } catch (error) {
    console.error('Ошибка получения аватаров:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка получения аватаров' 
    });
  }
};

// Получить аватары пользователя
const getUserAvatars = async (req, res) => {
  try {
    const userId = req.user.id;

    const userAvatars = await db.UserAvatar.findAll({
      where: { userId },
      include: [{
        model: db.Avatar,
        as: 'avatar'
      }],
      order: [['purchasedAt', 'DESC']]
    });

    res.json(userAvatars);
  } catch (error) {
    console.error('Ошибка получения аватаров пользователя:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка получения аватаров пользователя' 
    });
  }
};

// Купить аватар
const purchaseAvatar = async (req, res) => {
  try {
    const { avatarId } = req.body;
    const userId = req.user.id;

    // Проверяем, существует ли аватар
    const avatar = await db.Avatar.findByPk(avatarId);
    if (!avatar) {
      return res.status(404).json({ 
        success: false, 
        message: 'Аватар не найден' 
      });
    }

    // Проверяем, не куплен ли уже аватар
    const existingPurchase = await db.UserAvatar.findOne({
      where: { userId, avatarId }
    });

    if (existingPurchase) {
      return res.status(400).json({ 
        success: false, 
        message: 'Аватар уже куплен' 
      });
    }

    // Получаем пользователя
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }

    // Проверяем, хватает ли очков
    if (user.score < avatar.price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Недостаточно очков для покупки' 
      });
    }

    // Выполняем покупку в транзакции
    const transaction = await db.sequelize.transaction();

    try {
      // Создаем запись о покупке
      await db.UserAvatar.create({
        userId,
        avatarId,
        isEquipped: false,
        purchasedAt: new Date()
      }, { transaction });

      // Списываем очки
      const newScore = user.score - avatar.price;
      await user.update({
        score: newScore
      }, { transaction });

      await transaction.commit();

      res.json({ 
        success: true, 
        score: newScore,
        message: 'Аватар успешно куплен' 
      });
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error('Ошибка покупки аватара:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка покупки аватара' 
    });
  }
};

// Надеть аватар
const equipAvatar = async (req, res) => {
  try {
    const { avatarId } = req.body;
    const userId = req.user.id;

    // Проверяем, куплен ли аватар
    const userAvatar = await db.UserAvatar.findOne({
      where: { userId, avatarId },
      include: [{
        model: db.Avatar,
        as: 'avatar'
      }]
    });

    if (!userAvatar) {
      return res.status(404).json({ 
        success: false, 
        message: 'Аватар не куплен' 
      });
    }

    // Снимаем все другие аватары
    await db.UserAvatar.update(
      { isEquipped: false },
      { where: { userId } }
    );

    // Надеваем выбранный аватар
    await userAvatar.update({ isEquipped: true });

    res.json({ 
      success: true, 
      message: 'Аватар успешно надет' 
    });
  } catch (error) {
    console.error('Ошибка надевания аватара:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка надевания аватара' 
    });
  }
};

// Снять аватар
const unequipAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    // Снимаем все аватары
    await db.UserAvatar.update(
      { isEquipped: false },
      { where: { userId } }
    );

    res.json({ 
      success: true, 
      message: 'Аватар успешно снят' 
    });
  } catch (error) {
    console.error('Ошибка снятия аватара:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка снятия аватара' 
    });
  }
};

// Получить текущий аватар пользователя
const getCurrentAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const currentAvatar = await db.UserAvatar.findOne({
      where: { userId, isEquipped: true },
      include: [{
        model: db.Avatar,
        as: 'avatar'
      }]
    });

    if (!currentAvatar) {
      return res.json(null);
    }

    res.json(currentAvatar.avatar);
  } catch (error) {
    console.error('Ошибка получения текущего аватара:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка получения текущего аватара' 
    });
  }
};

// Получить аватар пользователя по ID
const getUserAvatar = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentAvatar = await db.UserAvatar.findOne({
      where: { userId, isEquipped: true },
      include: [{
        model: db.Avatar,
        as: 'avatar'
      }]
    });

    if (!currentAvatar) {
      return res.json(null);
    }

    res.json(currentAvatar.avatar);
  } catch (error) {
    console.error('Ошибка получения аватара пользователя:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка получения аватара пользователя' 
    });
  }
};

module.exports = {
  getAvatars,
  getUserAvatars,
  purchaseAvatar,
  equipAvatar,
  unequipAvatar,
  getCurrentAvatar,
  getUserAvatar
};
