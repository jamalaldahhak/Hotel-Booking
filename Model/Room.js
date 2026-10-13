import mongoose from "mongoose";
const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: Number, required: true, unique: true },
    pricePerNight: { type: Number, required: true },
    roomType: {
      type: String,
      enum: ["Single", "Double", "Suite"],
      required: true,
    },
    roomCategory: {
      type: String,
      enum: ["Standard", "VIP"],
      required: true,
      default: "Standard",
    },
  },
  { timestamps: true },
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
