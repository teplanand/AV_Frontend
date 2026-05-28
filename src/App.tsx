// src/App.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ScrollToTop } from "./components/common/ScrollToTop";
import SignIn from "./pages/AuthPages/SignIn";
import AppPortal from "./pages/AppPortal";
import NotFound from "./pages/OtherPage/NotFound";
import Loader from "./components/Loader/loader";

// Lazy loading the apps
const AdvancePaymentRoutes = lazy(() => import("./apps/AdvancePaymentApp/routes"));

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route
            path="/signin"
            element={
              <ProtectedRoute routeType="public">
                <SignIn />
              </ProtectedRoute>
            }
          />

          <Route
            path="/apps"
            element={
              <ProtectedRoute routeType="private">
                <AppPortal />
              </ProtectedRoute>
            }
          />

          {/* Module/App specific routes */}
          <Route
            path="/app/advance-payment/*"
            element={
              <ProtectedRoute routeType="private">
                <AdvancePaymentRoutes />
              </ProtectedRoute>
            }
          />

          {/* Redirect to /apps for / or unknown routes (temporarily handle not found below) */}
          <Route path="/" element={<Navigate to="/apps" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
