import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    process: { type: String },
    role: { type: String, default: "employee" },
    assigned: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
    designation: { type: String },
    department: { type: String }
  },
  { timestamps: true }
);

export const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
export default Employee;
