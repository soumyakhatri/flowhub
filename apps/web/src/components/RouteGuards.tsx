import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Spinner } from "./ui";

function ScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner label="Checking session" />
    </div>
  );
}

export function ProtectedRoute() {
  const { status } = useAuth();
  if (status === "loading") return <ScreenLoader />;
  if (status === "anonymous") return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { status } = useAuth();
  if (status === "loading") return <ScreenLoader />;
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <Outlet />;
}