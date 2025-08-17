// 📄 login.jsx — versão final corrigida
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (senha.length !== 8) {
      alert("A senha deve conter exatamente 8 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch("https://api-senhas.vercel.app/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", data.email);

        alert(data.mensagem || "Login realizado com sucesso!");

        // ✅ Recarrega a página para garantir leitura do token no PrivateRoute
        setTimeout(() => {
          window.location.reload();
        }, 200);
      } else {
        alert(data.detail || data.mensagem || "Credenciais inválidas ou conta não verificada.");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login">
      <h2>Acesso ao Sistema</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="E-mail"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha (8 caracteres)"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          maxLength={8}
        />

        <button type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="login-opcoes">
        <p>
          Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
        <p>
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
        </p>
        <p className="danger">
          <Link to="/excluir-usuario">Excluir minha conta</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
