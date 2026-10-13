import mongoose from "mongoose";
import Room from "../Model/Room.js";

const allowedSortFields = [
  "roomNumber",
  "pricePerNight",
  "roomType",
  "roomCategory",
  "createdAt",
];

export const getAllRoomsService = async ({
  sortField = "roomNumber",
  sortOrder = "ASC",
  start = 0,
  end = 10,
}) => {
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
  const room = await Room.create(data);
  return room;
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

//   const reservation = await Reservation.findOne({
//     roomId: room._id,
//   });

//   if (reservation) {
//     const error = new Error("Cannot update a room that has reservations");
//     error.statusCode = 409;
//     throw error;
//   }

  const updatedRoom = await Room.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  return updatedRoom;
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

  const today = new Date();

//   const reservation = await Reservation.findOne({
//     roomId: room._id,
//     checkOut: { $gt: today },
//   });

//   if (reservation) {
//     const error = new Error(
//       "Cannot delete a room with a current or future reservation",
//     );
//     error.statusCode = 409;
//     throw error;
//   }

  await Room.findByIdAndDelete(id);

  return { message: "Room deleted successfully" };
};
