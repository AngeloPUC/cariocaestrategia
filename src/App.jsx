// 📁 src/App.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";

// ⛑️ Componentes globais
import Header       from "./components/Header";
import Footer       from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import NotFound     from "./components/NotFound";

// 🌐 Páginas públicas
import Home           from "./pages/Home";
import Estrutura      from "./pages/Estrutura";
import Login          from "./pages/Login";
import Cadastro       from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import ExcluirUsuario from "./pages/ExcluirUsuario";

// 🔐 Páginas protegidas
import Dashboard  from "./pages/dashboard/Dashboard";
import Relatorios from "./pages/dashboard/relatorios";

// 🚀 CRUD principais (protegidas)
import Equipe    from "./pages/equipe/Equipe";
import Acoes     from "./pages/acoes/acoes";
import Tdv       from "./pages/tdv/Tdv";
import Consorcio from "./pages/consorcio/Consorcio";
import Tarefas   from "./pages/tarefas/Tarefas";
import Feedback  from "./pages/feedback/Feedback";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <main style={{ paddingBottom: "60px" }}>
        <Routes>
          {/* 🌐 Rotas públicas */}
          <Route path="/"                element={<Home />} />
          <Route path="/estrutura"       element={<Estrutura />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/cadastro"        element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/excluir-usuario" element={<ExcluirUsuario />} />

          {/* 🔒 Rotas protegidas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <PrivateRoute>
                <Relatorios />
              </PrivateRoute>
            }
          />

          {/* 🚀 Rotas CRUD */}
          <Route
            path="/equipe"
            element={
              <PrivateRoute>
                <Equipe />
              </PrivateRoute>
            }
          />
          <Route
            path="/acoes"
            element={
              <PrivateRoute>
                <Acoes />
              </PrivateRoute>
            }
          />
          <Route
            path="/tdv"
            element={
              <PrivateRoute>
                <Tdv />
              </PrivateRoute>
            }
          />
          <Route
            path="/consorcio"
            element={
              <PrivateRoute>
                <Consorcio />
              </PrivateRoute>
            }
          />
          <Route
            path="/tarefas"
            element={
              <PrivateRoute>
                <Tarefas />
              </PrivateRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <PrivateRoute>
                <Feedback />
              </PrivateRoute>
            }
          />

          {/* ❌ Página 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
