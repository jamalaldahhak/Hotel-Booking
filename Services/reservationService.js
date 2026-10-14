
import mongoose from "mongoose";
import Room from "../Model/Room.js";
import Reservation from "../Model/Reservation.js";

// إنشاء خطأ مع تحديد HTTP status
const fail = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

// التحقق من التاريخ وتحويله إلى Date
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

// التحقق من الفترة وحساب عدد الليالي
const getDateRange = (checkIn, checkOut) => {
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);

  if (end <= start) {
    fail("Check-out must be after check-in", 400);
  }

  const totalNights = (end - start) / 86400000;

  return { start, end, totalNights };
};

// شرط البحث عن الحجوزات المتداخلة
const overlapFilter = (start, end) => ({
  checkIn: { $lt: end },
  checkOut: { $gt: start },
});

// الحالات التي تمنع حجز الغرفة مرة ثانية
const activeReservationFilter = {
  status: { $in: ["Confirmed", "CheckedIn"] },
};

// جلب الحجوزات مع الفلترة وتقسيم الصفحات
export const getReservations = async (query = {}) => {
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
    const allowedStatuses = [
      "Confirmed",
      "Cancelled",
      "CheckedIn",
      "CheckedOut",
    ];

    if (!allowedStatuses.includes(query.status)) {
      fail("Invalid reservation status", 400);
    }

    filter.status = query.status;
  }

  if (query.roomId) {
    if (!mongoose.isValidObjectId(query.roomId)) {
      fail("Invalid room ID", 400);
    }

    filter.roomId = query.roomId;
  }

  if (query.customerPhone) {
    if (typeof query.customerPhone !== "string") {
      fail("Invalid customer phone", 400);
    }

    filter.customerPhone = query.customerPhone.trim();
  }

  const [reservations, total] = await Promise.all([
    Reservation.find(filter)
      .populate("roomId", "roomNumber roomType roomCategory pricePerNight")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Reservation.countDocuments(filter),
  ]);

  return {
    data: reservations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// جلب الغرف المتاحة ضمن فترة محددة
export const getAvailableRooms = async (checkIn, checkOut) => {
  const { start, end } = getDateRange(checkIn, checkOut);

  const bookedRoomIds = await Reservation.find({
    ...activeReservationFilter,
    ...overlapFilter(start, end),
  }).distinct("roomId");

  return Room.find({
    _id: { $nin: bookedRoomIds },
  }).sort({ roomNumber: 1 });
};

// إنشاء حجز جديد
export const createReservation = async (data) => {
  const {
    roomId,
    customerFullName,
    customerPhone,
    checkIn,
    checkOut,
  } = data ?? {};

  if (!mongoose.isValidObjectId(roomId)) {
    fail("Invalid room ID", 400);
  }

  if (
    typeof customerFullName !== "string" ||
    customerFullName.trim().length < 2 ||
    customerFullName.trim().length > 100
  ) {
    fail("Valid customer name is required", 400);
  }

  if (
    typeof customerPhone !== "string" ||
    !/^\+?[0-9\s()-]{7,20}$/.test(customerPhone.trim())
  ) {
    fail("Valid customer phone is required", 400);
  }

  const { start, end, totalNights } = getDateRange(
    checkIn,
    checkOut
  );

  const room = await Room.findById(roomId);

  if (!room) {
    fail("Room not found", 404);
  }

  const conflict = await Reservation.exists({
    roomId: room._id,
    ...activeReservationFilter,
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
    customerFullName: customerFullName.trim(),
    customerPhone: customerPhone.trim(),
    checkIn: start,
    checkOut: end,
    nights: totalNights,
    pricePerNight: room.pricePerNight,
    totalPrice,
    status: "Confirmed",
  });
};

// جلب حجز واحد حسب ID
export const getReservationById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    fail("Invalid reservation ID", 400);
  }

  const reservation = await Reservation.findById(id).populate(
    "roomId",
    "roomNumber roomType roomCategory pricePerNight"
  );

  if (!reservation) {
    fail("Reservation not found", 404);
  }

  return reservation;
};

// إلغاء الحجز دون حذفه نهائياً
export const cancelReservation = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    fail("Invalid reservation ID", 400);
  }

  const reservation = await Reservation.findById(id);

  if (!reservation) {
    fail("Reservation not found", 404);
  }

  if (reservation.status !== "Confirmed") {
    fail("Only confirmed reservations can be cancelled", 409);
  }

  reservation.status = "Cancelled";
  reservation.cancelledAt = new Date();

  await reservation.save();

  return reservation;
};
