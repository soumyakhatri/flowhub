function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}
function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(void 0, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}
function formatDay(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(void 0, { month: "short", day: "numeric" }).format(date);
}
function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
function fromDateInput(value) {
  if (!value) return null;
  const date = /* @__PURE__ */ new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
function statusLabel(status) {
  if (status === "todo") return "To do";
  if (status === "in_progress") return "In progress";
  if (status === "done") return "Done";
  return status.replace(/_/g, " ");
}
function priorityLabel(priority) {
  if (priority === "low") return "Low";
  if (priority === "medium") return "Medium";
  if (priority === "high") return "High";
  return priority;
}
export {
  cn,
  formatDay,
  formatWhen,
  fromDateInput,
  priorityLabel,
  statusLabel,
  toDateInput
};
