import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    employee: { type: String, required: true },
    assignedTo: { type: String },
    assignedBy: { type: String },
    process: { type: String },
    document: { type: String },
    assigned: { type: String },
    due: { type: String },
    dueDate: { type: String },
    priority: { type: String, default: "Medium" },
    status: { type: String, default: "Pending" },
    category: { type: String, default: "General" }
  },
  { timestamps: true }
);

taskSchema.pre("save", function (next) {
  if (!this.assignedTo && this.employee) this.assignedTo = this.employee;
  if (!this.employee && this.assignedTo) this.employee = this.assignedTo;
  if (!this.dueDate && this.due) this.dueDate = this.due;
  if (!this.due && this.dueDate) this.due = this.dueDate;
  next();
});

export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
export default Task;
