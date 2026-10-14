
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


export async function getReservations(query = {}) {
  const page = Math.max(
    1,
    Number.parseInt(query.page, 10) || 1
  );

  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 10)
  );

  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.roomId) {
    filter.roomId = query.roomId;
  }

  if (query.customerPhone) {
    filter.customerPhone = query.customerPhone.trim();
  }

  const [reservations, total] = await Promise.all([
    Reservation.find(filter)
      .populate("roomId", "roomNumber roomType roomCategory")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Reservation.countDocuments(filter),
  ]);

  return {
    reservations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
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
    customerFullName,
    customerPhone,
    checkIn,
    checkOut,
  } = data;

  if (
    typeof customerFullName !== "string" ||
    customerFullName.trim().length < 2 ||
    customerFullName.trim().length > 100
  ) {
    fail("Valid customer name is required", 400);
  }

  // التحقق من رقم الهاتف
  if (
    typeof customerPhone !== "string" ||
    !/^\+?[0-9\s()-]{7,20}$/.test(customerPhone.trim())
  ) {
    fail("Valid customer phone is required", 400);
  }

  // التحقق من التاريخين وحساب عدد الليالي
  const { start, end, totalNights } = getDateRange(
    checkIn,
    checkOut
  );

  // جلب الغرفة وسعر الليلة من قاعدة البيانات
  const room = await Room.findById(roomId);

  if (!room) {
    fail("Room not found", 404);
  }

  // التأكد من عدم وجود حجز متداخل غير ملغى
  const conflict = await Reservation.exists({
    roomId: room._id,
    status: { $in: ["Confirmed", "CheckedIn"] },
    ...overlapFilter(start, end),
  });

  if (conflict) {
    fail("Room is already booked for these dates", 409);
  }

  // حساب السعر الإجمالي من سعر الغرفة
  const totalPrice = Number(
    (totalNights * room.pricePerNight).toFixed(2)
  );

  // حفظ الحجز بالأسماء المطابقة للـ Model
  return Reservation.create({
    roomId: room._id,
    customerFullName: customerFullName.trim(),
    customerPhone: customerPhone.trim(),
    checkIn: start,
    checkOut: end,
    nights: totalNights,
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
