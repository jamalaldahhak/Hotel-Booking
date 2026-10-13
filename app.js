import express from "express";
import roomRouter from "./Router/roomRoutes.js";

const app = express();

app.use(express.json());
app.use("/rooms", roomRouter);
app.get("/", (req, res) => {
  res.send("Hotel Booking API is running");
});

export default app;
