
import mongoose from "mongoose";
import Room from "../Model/Room.js";
import Reservation from "../Model/Reservation.js";

const allowedSortFields = [
  "roomNumber",
  "pricePerNight",
  "roomType",
  "roomCategory",
  "createdAt",
];

// التحقق من وجود حجوزات حالية أو مستقبلية للغرفة
const checkRoomReservations = async (roomId) => {
  const reservation = await Reservation.findOne({
    roomId,
    status: { $in: ["Confirmed", "CheckedIn"] },
    checkOut: { $gt: new Date() },
  });

  if (reservation) {
    const error = new Error(
      "Cannot modify or delete a room with active or future reservations",
    );
    error.statusCode = 409;
    throw error;
  }
};

export const getAllRoomsService = async ({
  sortField = "roomNumber",
  sortOrder = "ASC",
  start = 0,
  end = 10,
} = {}) => {
  if (!allowedSortFields.includes(sortField)) {
    const error = new Error("Invalid sort field");
    error.statusCode = 400;
    throw error;
  }

  const sortDirection = sortOrder === "DESC" ? -1 : 1;

  const [rooms, total] = await Promise.all([
    Room.find()
      .sort({ [sortField]: sortDirection })
      .skip(start)
      .limit(end - start),
    Room.countDocuments(),
  ]);

  return { rooms, total };
};

export const getRoomByIdService = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid room ID");
    error.statusCode = 400;
    throw error;
  }

  const room = await Room.findById(id);

  if (!room) {
    const error = new Error("Room not found");
    error.statusCode = 404;
    throw error;
  }

  return room;
};

export const createRoomService = async (data) => {
  return Room.create(data);
};

export const updateRoomService = async (id, data) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid room ID");
    error.statusCode = 400;
    throw error;
  }

  const room = await Room.findById(id);

  if (!room) {
    const error = new Error("Room not found");
    error.statusCode = 404;
    throw error;
  }

  // منع تعديل الغرفة إذا كان عليها حجز حالي أو مستقبلي
  await checkRoomReservations(room._id);

  return Room.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

export const deleteRoomService = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid room ID");
    error.statusCode = 400;
    throw error;
  }

  const room = await Room.findById(id);

  if (!room) {
    const error = new Error("Room not found");
    error.statusCode = 404;
    throw error;
  }

  // منع حذف الغرفة إذا كان عليها حجز حالي أو مستقبلي
  await checkRoomReservations(room._id);

  await Room.findByIdAndDelete(id);

  return { message: "Room deleted successfully" };
};
