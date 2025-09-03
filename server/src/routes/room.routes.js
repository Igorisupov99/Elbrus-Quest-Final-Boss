const express = require('express');
const roomRouter = express.Router();
const roomController = require('../controllers/room.controller');
const authMiddleware = require('../middlewares/auth.middleware');

roomRouter.get("/all", roomController.getAllRooms)  // отдать перечень всех комнат
roomRouter.post("/new", roomController.createRoom)  // создать новую комнату
roomRouter.put("/change/:id",authMiddleware, roomController.changeRoomName); //изменить название комнаты
roomRouter.delete('/:id',authMiddleware, roomController.deleteRoom)  // удалить комнату


module.exports = roomRouter;