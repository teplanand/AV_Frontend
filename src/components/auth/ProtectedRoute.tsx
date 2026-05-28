// src/components/auth/ProtectedRoute.tsx
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import Loader from "../Loader/loader";
import { removeToken, decodeToken, getToken } from "../../utils/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  routeType: "public" | "private";
}

export const ProtectedRoute = ({
  children,
  routeType,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();

      if (!token) {
        setAuthStatus("unauthenticated");
        return;
      }

      try {
        decodeToken(token);
        setAuthStatus("authenticated");
      } catch {
        removeToken();
        setAuthStatus("unauthenticated");
      }
    };

    checkAuth();
  }, [location]);

  if (authStatus === "loading") {
    return (
      <div>
        <Loader />
      </div>
    ); // Or your custom loader
  }

  // Public route rules
  if (routeType === "public") {
    // If authenticated, redirect to home
    if (authStatus === "authenticated") {
      return <Navigate to="/apps" replace />;
    }
    // If unauthenticated, show public route
    return <>{children}</>;
  }

  // Private route rules
  if (routeType === "private") {
    // If unauthenticated, redirect to login
    if (authStatus === "unauthenticated") {
      return <Navigate to="/signin" replace />;
    }
    // If authenticated, show protected content
    return <>{children}</>;
  }

  // Fallback (should never reach here)
  return <Navigate to="/signin" replace />;
};
