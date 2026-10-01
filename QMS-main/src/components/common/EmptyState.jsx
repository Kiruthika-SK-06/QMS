import React from "react";
import { FileText } from "lucide-react";

export default function EmptyState({ title }) { return <div className="empty-state"><FileText size={32} /><h2>{title}</h2></div>; }
