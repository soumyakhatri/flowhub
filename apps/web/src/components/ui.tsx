import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, InputHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/format";

export const controlClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-tide-700 focus:ring-2 focus:ring-tide-700/15";

const buttonStyles = {
  primary: "bg-tide-700 text-white hover:bg-tide-800",
  secondary: "border border-slate-200 bg-white text-ink hover:bg-slate-50",
  danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  quiet: "text-tide-100 hover:bg-white/10",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles;
};

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "min-h-24 resize-y", className)} {...props} />;
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClass, className)} {...props} />;
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-white/80 bg-white/90 p-5 shadow-card", className)}>
      {children}
    </section>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
      {children}
    </p>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-tide-200 border-t-tide-700" />
      {label}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-muted">{body}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-6">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tide-700">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {description ? <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p> : null}
    </header>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {item.to ? (
            <Link to={item.to} className="hover:text-tide-800">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}