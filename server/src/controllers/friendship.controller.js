const db = require('../../db/models');

class FriendshipController {
  // Отправить запрос на дружбу
  async sendFriendRequest(req, res) {
    try {
      const { friend_id } = req.body;
      const user_id = req.user.id;

      if (user_id === friend_id) {
        return res.status(400).json({ 
          message: 'Нельзя добавить себя в друзья' 
        });
      }

      // Проверяем, существует ли пользователь
      const friend = await db.User.findByPk(friend_id);
      if (!friend) {
        return res.status(404).json({ 
          message: 'Пользователь не найден' 
        });
      }

      // Проверяем, не существует ли уже запрос на дружбу
      const existingFriendship = await db.Friendship.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { user_id, friend_id },
            { user_id: friend_id, friend_id: user_id }
          ]
        }
      });

      if (existingFriendship) {
        return res.status(400).json({ 
          message: 'Запрос на дружбу уже существует' 
        });
      }

      // Создаем запрос на дружбу
      const friendship = await db.Friendship.create({
        user_id,
        friend_id,
        status: 'pending'
      });

      res.status(201).json({ 
        message: 'Запрос на дружбу отправлен',
        data: friendship 
      });
    } catch (error) {
      console.error('Ошибка при отправке запроса на дружбу:', error);
      res.status(500).json({ 
        message: 'Ошибка сервера', 
        error: error.message 
      });
    }
  }

  // Принять запрос на дружбу
  async acceptFriendRequest(req, res) {
    try {
      const { friendship_id } = req.params;
      const user_id = req.user.id;

      const friendship = await db.Friendship.findOne({
        where: {
          id: friendship_id,
          friend_id: user_id,
          status: 'pending'
        }
      });

      if (!friendship) {
        return res.status(404).json({ 
          message: 'Запрос на дружбу не найден' 
        });
      }

      // Обновляем статус на принятый
      await friendship.update({ status: 'accepted' });

      res.json({ 
        message: 'Запрос на дружбу принят',
        data: friendship 
      });
    } catch (error) {
      console.error('Ошибка при принятии запроса на дружбу:', error);
      res.status(500).json({ 
        message: 'Ошибка сервера', 
        error: error.message 
      });
    }
  }

  // Отклонить запрос на дружбу
  async rejectFriendRequest(req, res) {
    try {
      const { friendship_id } = req.params;
      const user_id = req.user.id;

      const friendship = await db.Friendship.findOne({
        where: {
          id: friendship_id,
          friend_id: user_id,
          status: 'pending'
        }
      });

      if (!friendship) {
        return res.status(404).json({ 
          message: 'Запрос на дружбу не найден' 
        });
      }

      // Удаляем запрос на дружбу
      await friendship.destroy();

      res.json({ 
        message: 'Запрос на дружбу отклонен' 
      });
    } catch (error) {
      console.error('Ошибка при отклонении запроса на дружбу:', error);
      res.status(500).json({ 
        message: 'Ошибка сервера', 
        error: error.message 
      });
    }
  }

  // Удалить из друзей
  async removeFriend(req, res) {
    try {
      const { friend_id } = req.params;
      const user_id = req.user.id;

      const friendship = await db.Friendship.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { user_id, friend_id },
            { user_id: friend_id, friend_id: user_id }
          ],
          status: 'accepted'
        }
      });

      if (!friendship) {
        return res.status(404).json({ 
          message: 'Дружба не найдена' 
        });
      }

      // Удаляем дружбу
      await friendship.destroy();

      res.json({ 
        message: 'Пользователь удален из друзей' 
      });
    } catch (error) {
      console.error('Ошибка при удалении из друзей:', error);
      res.status(500).json({ 
        message: 'Ошибка сервера', 
        error: error.message 
      });
    }
  }

  // Заблокировать пользователя
  async blockUser(req, res) {
    try {
      const { friend_id } = req.body;
      const user_id = req.user.id;

      if (user_id === friend_id) {
        return res.status(400).json({ 
          message: 'Нельзя заблокировать себя' 
        });
      }

      // Удаляем существующую дружбу, если есть
      await db.Friendship.destroy({
        where: {
          [db.Sequelize.Op.or]: [
            { user_id, friend_id },
            { user_id: friend_id, friend_id: user_id }
          ]
        }
      });

      // Создаем блокировку
      const friendship = await db.Friendship.create({
        user_id,
        friend_id,
        status: 'blocked'
      });

      res.status(201).json({ 
        message: 'Пользователь заблокирован',
        data: friendship 
      });
    } catch (error) {
      console.error('Ошибка при блокировке пользователя:', error);
      res.status(500).json({ 
        message: 'Ошибка сервера', 
        error: error.message 
      });
    }
  }

  // Получить список друзей
  async getFriends(req, res) {
    try {
      const user_id = req.user.id;

      const friends = await db.User.findAll({
        include: [{
          model: db.Friendship,
          as: 'sent_friendships',
          where: {
            user_id,
            status: 'accepted'
          },
          include: [{
            model: db.User,
            as: 'friend',
            attributes: ['id', 'username', 'email', 'image_url', 'score']
          }]
        }],
        where: {
          id: user_id
        }
      });

      // Также получаем друзей, которые добавили этого пользователя
      const receivedFriends = await db.User.findAll({
        include: [{
          model: db.Friendship,
          as: 'received_friendships',
          where: {
            friend_id: user_id,
            status: 'accepted'
          },
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'image_url', 'score']
          }]
        }],
        where: {
          id: user_id
        }
      });

      // Объединяем списки друзей
      const allFriends = [
        ...friends[0]?.sent_friendships?.map(f => f.friend) || [],
        ...receivedFriends[0]?.received_friendships?.map(f => f.user) || []
      ];

      res.json({ 
        data: allFriends 
      });
    } catch (error) {
      console.error('Ошибка при получении списка друзей:', error);
      res.status(500).json({ 
        message: 'Ошибка сервера', 
        error: error.message 
      });
    }
  }

  // Получить входящие запросы на дружбу
  async getIncomingRequests(req, res) {
    try {
      const user_id = req.user.id;

      const requests = await db.Friendship.findAll({
        where: {
          friend_id: user_id,
          status: 'pending'
        },
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'image_url', 'score']
        }]
      });

      res.json({ 
        data: requests 
      });
    } catch (error) {
      console.error('Ошибка при получении входящих запросов:', error);
      res.status(500).json({ 
        message: 'Ошибка сервера', 
        error: error.message 
      });
    }
  }

  // Получить исходящие запросы на дружбу
  async getOutgoingRequests(req, res) {
    try {
      const user_id = req.user.id;

      const requests = await db.Friendship.findAll({
        where: {
          user_id,
          status: 'pending'
        },
        include: [{
          model: db.User,
          as: 'friend',
          attributes: ['id', 'username', 'email', 'image_url', 'score']
        }]
      });

      res.json({ 
        data: requests 
      });
    } catch (error) {
      console.error('Ошибка при получении исходящих запросов:', error);
      res.status(500).json({ 
        message: 'Ошибка сервера', 
        error: error.message 
      });
    }
  }

  // Поиск пользователей для добавления в друзья
  async searchUsers(req, res) {
    try {
      const { query } = req.query;
      const user_id = req.user.id;

      if (!query || query.length < 2) {
        return res.status(400).json({ 
          message: 'Поисковый запрос должен содержать минимум 2 символа' 
        });
      }

      // Получаем ID уже добавленных в друзья пользователей
      const existingFriendships = await db.Friendship.findAll({
        where: {
          [db.Sequelize.Op.or]: [
            { user_id },
            { friend_id: user_id }
          ]
        },
        attributes: ['user_id', 'friend_id']
      });

      const friendIds = new Set();
      existingFriendships.forEach(friendship => {
        if (friendship.user_id !== user_id) {
          friendIds.add(friendship.user_id);
        }
        if (friendship.friend_id !== user_id) {
          friendIds.add(friendship.friend_id);
        }
      });

      // Ищем пользователей по имени пользователя или email
      const users = await db.User.findAll({
        where: {
          id: {
            [db.Sequelize.Op.ne]: user_id, // Исключаем текущего пользователя
            [db.Sequelize.Op.notIn]: Array.from(friendIds) // Исключаем уже добавленных в друзья
          },
          [db.Sequelize.Op.or]: [
            { username: { [db.Sequelize.Op.iLike]: `%${query}%` } },
            { email: { [db.Sequelize.Op.iLike]: `%${query}%` } }
          ]
        },
        attributes: ['id', 'username', 'email', 'image_url', 'score'],
        limit: 20
      });

      res.json({ 
        data: users 
      });
    } catch (error) {
      console.error('Ошибка при поиске пользователей:', error);
      res.status(500).json({ 
        message: 'Ошибка сервера', 
        error: error.message 
      });
    }
  }
}

module.exports = new FriendshipController();
