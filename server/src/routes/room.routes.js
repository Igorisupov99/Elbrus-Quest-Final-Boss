const express = require('express');
const roomRouter = express.Router();
const roomController = require('../controllers/room.controller');

roomRouter.get("/all", roomController.getAllRooms)  // отдать перечень всех комнат
roomRouter.get("/users", roomController.getUsers)  // отдать всех пользователей в комнате
roomRouter.post("/new", roomController.createRoom)  // создать новую комнату
roomRouter.put("/change", authMiddleware, roomController.changeRoomName); //изменить название комнаты
roomRouter.delete('/:id', authMiddleware, roomController.deleteRoom)  // удалить комнату


module.exports = roomRouter;