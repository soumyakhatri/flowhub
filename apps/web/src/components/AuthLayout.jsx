function AuthLayout({
  title,
  subtitle,
  children,
  footer
}) {
  return <div className="grid min-h-screen lg:grid-cols-[minmax(280px,380px)_1fr]">
      <aside className="hidden flex-col justify-between bg-tide-950 p-10 text-white lg:flex">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-tide-200">FLOWHUB</p>
          <p className="mt-10 max-w-xs text-3xl font-semibold leading-tight">
            Organizations, workspaces, and tasks.
          </p>
          <p className="mt-4 max-w-xs text-sm leading-6 text-tide-100/75">
            Sign in to open the work already in progress.
          </p>
        </div>
        <p className="text-xs text-tide-200/60">Phase 1</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <p className="text-sm font-semibold tracking-[0.16em] text-tide-700 lg:hidden">FLOWHUB</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-6 rounded-2xl border border-white/80 bg-white/90 p-5 shadow-card">{children}</div>
          <div className="mt-4 text-sm text-ink-muted">{footer}</div>
        </div>
      </main>
    </div>;
}
export {
  AuthLayout
};
