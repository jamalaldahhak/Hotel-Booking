
import express from "express";

import {
  checkAvailability,
  createReservation,
  getReservations,
  getReservationById,
  cancelReservation,
} from "../controllers/reservationController.js";

const router = express.Router();

router.get("/availability", checkAvailability);

router.route("/")
  .post(createReservation)
  .get(getReservations);

router.get("/:id", getReservationById);

router.patch("/:id/cancel", cancelReservation);

export default router;
