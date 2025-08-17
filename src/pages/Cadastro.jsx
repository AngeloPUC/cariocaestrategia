import { useState } from "react";
import "./Cadastro.css";

function Cadastro() {
  const [etapa, setEtapa] = useState(1);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleCadastroInicial = async (e) => {
    e.preventDefault();

    if (senha.length !== 8) {
      alert("A senha deve conter exatamente 8 caracteres.");
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch("https://api-senhas.vercel.app/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (res.ok) {
        setEtapa(2);
        alert(data.mensagem || "Código enviado ao seu e-mail.");
      } else {
        alert(data.detail || data.mensagem || "Erro ao cadastrar. Verifique os dados.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar dados. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleConfirmacao = async (e) => {
    e.preventDefault();
    setCarregando(true);
    try {
      const res = await fetch("https://api-senhas.vercel.app/auth/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.mensagem || "Cadastro confirmado com sucesso!");
        setEtapa(1);
        setEmail("");
        setSenha("");
        setCodigo("");
      } else {
        alert(data.detail || data.mensagem || "Código inválido ou expirado.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro na confirmação. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="cadastro">
      <h2>Cadastro de Usuário</h2>

      {etapa === 1 && (
        <form onSubmit={handleCadastroInicial}>
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
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            maxLength={8}
          />
          <button type="submit" disabled={carregando}>
            {carregando ? "Enviando..." : "Enviar Código"}
          </button>
        </form>
      )}

      {etapa === 2 && (
        <form onSubmit={handleConfirmacao}>
          <input
            type="text"
            placeholder="Código de 6 dígitos"
            autoComplete="one-time-code"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
            maxLength={6}
          />
          <button type="submit" disabled={carregando}>
            {carregando ? "Confirmando..." : "Confirmar Cadastro"}
          </button>
        </form>
      )}
    </div>
  );
}

export default Cadastro;
