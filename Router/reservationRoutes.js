
import { Router } from "express";
import {
  getAvailableRooms,
  createReservation,
  getAllReservations,
  getReservationById,
  deleteReservation,
} from "../controllers/reservationController.js";

const router = Router();

router.get("/available", getAvailableRooms);

router.route("/")
  .get(getAllReservations)
  .post(createReservation);

router.route("/:id")
  .get(getReservationById)
  .delete(deleteReservation);

export default router;
