
import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    // الغرفة المحجوزة
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
      immutable: true,
      index: true,
    },

    // معلومات الزبون
    customerFullName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
      minlength: [7, "Phone number is too short"],
      maxlength: [20, "Phone number is too long"],
      index: true,
    },

    // تاريخ الوصول
    checkIn: {
      type: Date,
      required: [true, "Check-in date is required"],
    },

    // تاريخ المغادرة
    checkOut: {
      type: Date,
      required: [true, "Check-out date is required"],
    },

    // عدد الليالي، يُحسب من التاريخين في Service
    nights: {
      type: Number,
      required: [true, "Number of nights is required"],
      min: [1, "Reservation must be at least one night"],
      validate: {
        validator: Number.isInteger,
        message: "Number of nights must be an integer",
      },
    },

    // نسخة من سعر الليلة وقت الحجز، حتى لا يتغير الحجز
    // إذا تغيّر سعر الغرفة لاحقاً
    pricePerNight: {
      type: Number,
      required: [true, "Price per night is required"],
      min: [0, "Price cannot be negative"],
    },

    // السعر النهائي، يُحسب في Service وليس من العميل
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },

    // حالة الحجز
    status: {
      type: String,
      enum: ["Confirmed", "Cancelled", "CheckedIn", "CheckedOut"],
      default: "Confirmed",
      required: true,
      index: true,
    },

    // وقت إلغاء الحجز
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// لتسريع فحص الحجوزات المتداخلة للغرفة نفسها
reservationSchema.index({
  roomId: 1,
  status: 1,
  checkIn: 1,
  checkOut: 1,
});

// لتسهيل البحث عن حجوزات الزبون حسب رقم الهاتف
reservationSchema.index({
  customerPhone: 1,
  createdAt: -1,
});

// التأكد أن المغادرة بعد الوصول
reservationSchema.pre("validate", function () {
  if (
    this.checkIn instanceof Date &&
    this.checkOut instanceof Date &&
    !Number.isNaN(this.checkIn.getTime()) &&
    !Number.isNaN(this.checkOut.getTime()) &&
    this.checkOut <= this.checkIn
  ) {
    this.invalidate(
      "checkOut",
      "Check-out must be after check-in"
    );
  }
});

const Reservation = mongoose.model(
  "Reservation",
  reservationSchema
);

export default Reservation;
