import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useLoginStore from "../login/store/LoginStore";

function ProtectedRoute({ children }) {
  const user = useLoginStore((state) => state.user);
  const authInitialized = useLoginStore((state) => state.authInitialized);

  // Jab tak Firebase auth check complete nahi hota, screen wait karegi
  if (!authInitialized) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#070a13",
        color: "#60a5fa",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: "0.9rem"
      }}>
        Verifying session...
      </div>
    );
  }

  // Auth initialize hone ke baad hi agar user nahi hai, tabhi login bhejo
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;