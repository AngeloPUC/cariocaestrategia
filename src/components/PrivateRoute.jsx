import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  if (token === null) return null; // ainda carregando, não renderiza nada
  return token ? children : <Navigate to="/login" />;
}

export default PrivateRoute;
