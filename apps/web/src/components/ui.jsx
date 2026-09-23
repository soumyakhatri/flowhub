import { Link } from "react-router-dom";
import { cn } from "../lib/format";
const controlClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-tide-700 focus:ring-2 focus:ring-tide-700/15";
const buttonStyles = {
  primary: "bg-tide-700 text-white hover:bg-tide-800",
  secondary: "border border-slate-200 bg-white text-ink hover:bg-slate-50",
  danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  quiet: "text-tide-100 hover:bg-white/10"
};
function Button({ variant = "primary", className, type = "button", ...props }) {
  return <button
    type={type}
    className={cn(
      "inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
      buttonStyles[variant],
      className
    )}
    {...props}
  />;
}
function Field({ label, children }) {
  return <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>;
}
function TextInput({ className, ...props }) {
  return <input className={cn(controlClass, className)} {...props} />;
}
function TextArea({ className, ...props }) {
  return <textarea className={cn(controlClass, "min-h-24 resize-y", className)} {...props} />;
}
function SelectInput({ className, ...props }) {
  return <select className={cn(controlClass, className)} {...props} />;
}
function Panel({ children, className }) {
  return <section className={cn("rounded-2xl border border-white/80 bg-white/90 p-5 shadow-card", className)}>
      {children}
    </section>;
}
function Alert({ children }) {
  return <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
      {children}
    </p>;
}
function Spinner({ label = "Loading" }) {
  return <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-tide-200 border-t-tide-700" />
      {label}
    </span>;
}
function EmptyState({ title, body }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-muted">{body}</p>
    </div>;
}
function PageHeader({
  eyebrow,
  title,
  description
}) {
  return <header className="mb-6">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tide-700">{eyebrow}</p> : null}
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {description ? <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p> : null}
    </header>;
}
function Breadcrumbs({ items }) {
  return <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
      {items.map((item, index) => <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {item.to ? <Link to={item.to} className="hover:text-tide-800">
              {item.label}
            </Link> : <span className="text-ink">{item.label}</span>}
        </span>)}
    </nav>;
}
export {
  Alert,
  Breadcrumbs,
  Button,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  SelectInput,
  Spinner,
  TextArea,
  TextInput,
  controlClass
};
