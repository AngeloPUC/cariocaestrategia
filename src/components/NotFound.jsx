// src/pages/PaginaNaoEncontrada.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

function PaginaNaoEncontrada() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", padding: "60px" }}>
      <h1 style={{ fontSize: "48px", color: "#f44336" }}>404</h1>
      <p style={{ fontSize: "20px" }}>Página não localizada.</p>
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#0266c8",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        🔙 Voltar ao Início
      </button>
    </div>
  );
}

export default PaginaNaoEncontrada;
