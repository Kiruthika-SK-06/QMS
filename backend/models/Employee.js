import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String },
    designation: { type: String },
    status: { type: String, default: "Active" }
  },
  { timestamps: true }
);

export const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
export default Employee;
