
import mongoose from "mongoose";
import * as reservationService from "../services/reservationService.js";

export async function checkAvailability(req, res, next) {
  try {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "checkIn and checkOut are required",
      });
    }

    const rooms = await reservationService.getAvailableRooms(
      checkIn,
      checkOut
    );

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
}
const fail = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};


export async function createReservation(req, res, next) {
  try {
    const reservation =
      await reservationService.createReservation(req.body);

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}


export async function getReservations(req, res, next) {
  try {
    const result = await reservationService.getReservations(
      req.query
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReservationById(req, res, next) {
  try {
    const reservation =
      await reservationService.getReservationById(req.params.id);

    return res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelReservation(req, res, next) {
  try {
    const reservation =
      await reservationService.cancelReservation(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully",
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}
