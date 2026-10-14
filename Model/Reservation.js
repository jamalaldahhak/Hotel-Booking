import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
    },

    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Customer name is too short"],
      maxlength: [150, "Customer name is too long"],
    },

    customerNumber: {
      type: String,
      required: [true, "Customer number is required"],
      trim: true,
      match: [
        /^\+?[0-9\s()-]{7,20}$/,
        "Invalid customer phone number",
      ],
    },

    checkIn: {
      type: Date,
      required: [true, "Check-in date is required"],
    },

    checkOut: {
      type: Date,
      required: [true, "Check-out date is required"],
    },

    totalNights: {
      type: Number,
      required: true,
      min: 1,
    },

    pricePerNight: {
      type: Number,
      required: true,
      min: 0.01,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  { timestamps: true }
);

// بيساعد في البحث عن حجوزات الغرفة المتداخلة
reservationSchema.index({
  roomId: 1,
  checkIn: 1,
  checkOut: 1,
});

const Reservation = mongoose.model(
  "Reservation",
  reservationSchema
);

export default Reservation;
