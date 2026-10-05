import express from "express";
import { getAllEmployees, getEmployeeById, createEmployee } from "../controllers/employeeController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllEmployees);
router.post("/", authenticateToken, createEmployee);
router.get("/:id", getEmployeeById);

export default router;
