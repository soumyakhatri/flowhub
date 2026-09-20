import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { listOrganizations, organizationKeys } from "../api/organizations";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/format";
import { Button } from "./ui";

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const orgs = useQuery({
    queryKey: organizationKeys.all,
    queryFn: listOrganizations,
  });

  const activeOrgId = location.pathname.match(/^\/organizations\/([^/]+)/)?.[1];

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col bg-tide-950 text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            FlowHub
          </Link>
          <button type="button" className="text-sm text-tide-100 lg:hidden" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>

        <nav className="px-3" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "block rounded-lg px-3 py-2 text-sm font-medium",
                isActive ? "bg-white/10 text-white" : "text-tide-100/80 hover:bg-white/5 hover:text-white",
              )
            }
          >
            Organizations
          </NavLink>
        </nav>

        <div className="mt-6 flex min-h-0 flex-1 flex-col px-3">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-tide-200/70">Your orgs</p>
          <div className="mt-2 flex-1 space-y-1 overflow-y-auto pb-4">
            {orgs.isLoading ? <p className="px-3 py-2 text-sm text-tide-100/70">Loading...</p> : null}
            {orgs.isError ? <p className="px-3 py-2 text-sm text-rose-200">Could not load organizations.</p> : null}
            {orgs.data?.map((org) => (
              <Link
                key={org.id}
                to={`/organizations/${org.id}`}
                className={cn(
                  "block truncate rounded-lg px-3 py-2 text-sm",
                  activeOrgId === org.id
                    ? "bg-white/10 font-medium text-white"
                    : "text-tide-100/80 hover:bg-white/5 hover:text-white",
                )}
              >
                {org.name}
              </Link>
            ))}
            {orgs.data && orgs.data.length === 0 ? (
              <p className="px-3 py-2 text-sm text-tide-100/60">No organizations yet.</p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-tide-100/70">{user?.email}</p>
          <Button variant="quiet" className="mt-3 w-full" onClick={() => void logout()}>
            Log out
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-[#f4f7f6]/90 px-4 py-3 backdrop-blur lg:hidden">
          <button type="button" className="text-sm font-medium text-tide-800" onClick={() => setOpen(true)}>
            Menu
          </button>
          <span className="font-semibold">FlowHub</span>
          <button type="button" className="text-sm text-ink-muted" onClick={() => void logout()}>
            Log out
          </button>
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}