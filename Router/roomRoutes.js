
import { Router } from "express";
import { createRoomController, deleteRoomController, getRoomByIdController, getRoomsController, updateRoomController } from "../Controllers/roomController.js";


const roomRouter = Router();

roomRouter
  .route("/")
  .get(getRoomsController)
  .post(createRoomController);

roomRouter
  .route("/:id")
  .get(getRoomByIdController)
  .put(updateRoomController)
  .delete(deleteRoomController);

export default roomRouter;
