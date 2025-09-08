const express = require('express');
const roomRouter = express.Router();
const roomController = require('../controllers/room.controller');
const authMiddleware = require('../middlewares/auth.middleware');

roomRouter.get("/all", roomController.getAllRooms)  // отдать перечень всех комнат
roomRouter.post("/new", authMiddleware, roomController.createRoom)  // создать новую комнату
roomRouter.put("/change/:id",authMiddleware, roomController.changeRoomName); //изменить название комнаты
roomRouter.delete('/:id',authMiddleware, roomController.deleteRoom)  // удалить комнату
roomRouter.get("/:id/check-access", roomController.checkAccess); // новый GET для открытия модалки на клиенте
roomRouter.post("/:id/verify", roomController.verifyRoomCode); // (на потом) POST для проверки пароля из модалки
roomRouter.get('/creator-check', authMiddleware, roomController.checkCreator);// Проверить, является ли текущий пользователь создателем комнаты



module.exports = roomRouter;