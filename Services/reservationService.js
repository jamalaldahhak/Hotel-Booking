
import mongoose from "mongoose";
import Room from "../Model/Room.js";
import Reservation from "../Model/Reservation.js";

const fail = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const parseDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    fail("Dates must use YYYY-MM-DD format", 400);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    fail("Invalid calendar date", 400);
  }

  return date;
};

const getDateRange = (checkIn, checkOut) => {
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);

  if (end <= start) {
    fail("Check-out must be after check-in", 400);
  }

  const totalNights = (end - start) / 86400000;

  return { start, end, totalNights };
};

const overlapFilter = (start, end) => ({
  checkIn: { $lt: end },
  checkOut: { $gt: start },
});

export const getAvailableRooms = async (checkIn, checkOut) => {
  const { start, end } = getDateRange(checkIn, checkOut);

  const bookedRoomIds = await Reservation.find(
    overlapFilter(start, end)
  ).distinct("roomId");

  return Room.find({
    _id: { $nin: bookedRoomIds },
  }).sort({ roomNumber: 1 });
};

export const createReservation = async (data) => {
  const {
    roomId,
    customerName,
    customerNumber,
    checkIn,
    checkOut,
  } = data;

  if (!mongoose.isValidObjectId(roomId)) {
    fail("Invalid room ID", 400);
  }

  if (
    typeof customerName !== "string" ||
    customerName.trim().length < 2 ||
    customerName.trim().length > 150
  ) {
    fail("Valid customer name is required", 400);
  }

  if (
    typeof customerNumber !== "string" ||
    !/^\+?[0-9\s()-]{7,20}$/.test(customerNumber.trim())
  ) {
    fail("Valid customer number is required", 400);
  }

  const { start, end, totalNights } = getDateRange(
    checkIn,
    checkOut
  );

  // جلب الغرفة وسعر الليلة من قاعدة البيانات
  const room = await Room.findById(roomId);

  if (!room) {
    fail("Room not found", 404);
  }

  // منع التداخل بين الحجوزات الموجودة
  const conflict = await Reservation.exists({
    roomId: room._id,
    ...overlapFilter(start, end),
  });

  if (conflict) {
    fail("Room is already booked for these dates", 409);
  }

  const totalPrice = Number(
    (totalNights * room.pricePerNight).toFixed(2)
  );

  return Reservation.create({
    roomId: room._id,
    customerName: customerName.trim(),
    customerNumber: customerNumber.trim(),
    checkIn: start,
    checkOut: end,
    totalNights,
    pricePerNight: room.pricePerNight,
    totalPrice,
  });
};

export const getAllReservations = async () => {
  return Reservation.find()
    .populate("roomId", "roomNumber roomType pricePerNight")
    .sort({ createdAt: -1 });
};

export const getReservationById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    fail("Invalid reservation ID", 400);
  }

  const reservation = await Reservation.findById(id).populate(
    "roomId",
    "roomNumber roomType pricePerNight"
  );

  if (!reservation) {
    fail("Reservation not found", 404);
  }

  return reservation;
};

export const deleteReservation = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    fail("Invalid reservation ID", 400);
  }

  const reservation = await Reservation.findByIdAndDelete(id);

  if (!reservation) {
    fail("Reservation not found", 404);
  }

  return { message: "Reservation cancelled successfully" };
};
