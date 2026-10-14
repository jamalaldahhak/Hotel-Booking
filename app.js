
import express from "express";
import roomRouter from "./Router/roomRoutes.js";
import reservationRouter from "./Router/reservationRoutes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hotel Booking API is running",
  });
});

app.use("/api/rooms", roomRouter);
app.use("/api/reservations", reservationRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({
      message: "Room number already exists",
    });
  }

  if (
    err.name === "ValidationError" ||
    err.name === "CastError" ||
    err instanceof SyntaxError
  ) {
    return res.status(400).json({
      message: err.message,
    });
  }

  const status = err.status || 500;

  res.status(status).json({
    message:
      status >= 500 ? "Internal server error" : err.message,
  });
});

export default app;
