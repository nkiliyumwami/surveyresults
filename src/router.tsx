import { createBrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TrainerLogin from "./pages/trainer/Login";
import TrainerHome from "./pages/trainer/Home";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import TrainerProfile from "./pages/trainer/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/trainer/login",
    element: <TrainerLogin />,
  },
  {
    path: "/trainer",
    element: (
      <ProtectedRoute>
        <TrainerHome />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trainer/profile",
    element: (
      <ProtectedRoute>
        <TrainerProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);



