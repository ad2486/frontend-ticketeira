import { Navigate, Outlet, useLocation } from "react-router";
import { useIsLoggedIn } from "@/auth/use-is-logged-in";

export function RequireAuth() {
	const isLoggedIn = useIsLoggedIn();
	const location = useLocation();

	if (!isLoggedIn) {
		return <Navigate to="/login" replace state={{ from: location.pathname }} />;
	}
	return <Outlet />;
}
