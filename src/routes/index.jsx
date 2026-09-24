import {
  createBrowserRouter,
} from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import AuthCard from "../login/page/AuthCard";

import ConfigureProfile from "../configuration/ConfigureProfile";

import Dashboard from "../dashboard/Dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthCard />,
  },

  {
    path: "/login",
    element: <AuthCard />,
  },

  {
    path: "/configure",
    element : (
    <ProtectedRoute>
      <ConfigureProfile />
    </ProtectedRoute>
    )
   
  },

  {
    path: "/dashboard",
    element : (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
    )
   
  },

]);

export default router;