import {
  getAllRoomsService,
  getRoomByIdService,
  createRoomService,
  updateRoomService,
  deleteRoomService,
} from "../Services/roomService.js";

const allowedFields = [
  "roomNumber",
  "pricePerNight",
  "roomType",
  "roomCategory",
];

const pickRoomFields = (body) =>
  Object.fromEntries(
    Object.entries(body).filter(
      ([key, value]) => allowedFields.includes(key) && value !== undefined,
    ),
  );

const handleError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "Room number already exists",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Room validation failed",
      errors: Object.values(error.errors).map((item) => item.message),
    });
  }

  return res.status(error.statusCode || 500).json({
    message:
      error.statusCode && error.statusCode < 500
        ? error.message
        : "Internal server error",
  });
};

export const getRoomsController = async (req, res) => {
  try {
    const start = Number(req.query._start ?? 0);
    const end = Number(req.query._end ?? start + 10);
    const sortField = req.query._sort || "roomNumber";
    const sortOrder = req.query._order || "ASC";

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      end <= start ||
      !["ASC", "DESC"].includes(sortOrder)
    ) {
      return res.status(400).json({
        message: "Invalid pagination or sorting parameters",
      });
    }

    const { rooms, total } = await getAllRoomsService({
      sortField,
      sortOrder,
      start,
      end,
    });

    res.setHeader(
      "Content-Range",
      `rooms ${start}-${start + rooms.length - 1}/${total}`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(rooms);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getRoomByIdController = async (req, res) => {
  try {
    const room = await getRoomByIdService(req.params.id);
    return res.json(room);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createRoomController = async (req, res) => {
  try {
    const data = pickRoomFields(req.body);
    const room = await createRoomService(data);

    return res.status(201).json(room);
  } catch (error) {
    return handleError(res, error);
  }
};

// export const updateRoomController = async (req, res) => {
//   try {
//     const data = pickRoomFields(req.body);

//     if (Object.keys(data).length === 0) {
//       return res.status(400).json({
//         message: "No valid room fields provided",
//       });
//     }

//     const room = await updateRoomService(req.params.id, data);

//     return res.json(room);
//   } catch (error) {
//     return handleError(res, error);
//   }
// };

export const updateRoomController = async (req, res) => {
  try {
    const data = pickRoomFields(req.body);

    const requiredFields = [
      "roomNumber",
      "pricePerNight",
      "roomType",
      "roomCategory",
    ];

    const missingFields = requiredFields.filter(
      (field) => data[field] === undefined,
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "All room fields are required for PUT",
        missingFields,
      });
    }

    const room = await updateRoomService(req.params.id, data);

    return res.json(room);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteRoomController = async (req, res) => {
  try {
    const result = await deleteRoomService(req.params.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
};
