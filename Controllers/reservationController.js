
import * as reservationService from "../services/reservationService.js";

export const getAvailableRooms = async (req, res, next) => {
  try {
    const { checkIn, checkOut } = req.query;

    const rooms = await reservationService.getAvailableRooms(
      checkIn,
      checkOut
    );

    res.status(200).json({
      results: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

export const createReservation = async (req, res, next) => {
  try {
    const reservation =
      await reservationService.createReservation(req.body);

    res.status(201).json({
      message: "Reservation created successfully",
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReservations = async (req, res, next) => {
  try {
    const reservations =
      await reservationService.getAllReservations();

    res.status(200).json({
      results: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (req, res, next) => {
  try {
    const reservation =
      await reservationService.getReservationById(req.params.id);

    res.status(200).json({ data: reservation });
  } catch (error) {
    next(error);
  }
};

export const deleteReservation = async (req, res, next) => {
  try {
    const result =
      await reservationService.deleteReservation(req.params.id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
