import { useState } from "react";
import "./ExcluirUsuario.css";

function ExcluirUsuario() {
  const [etapa, setEtapa] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  // Envia código de verificação para exclusão
  const handleEnviarCodigo = async (e) => {
    e.preventDefault();
    setCarregando(true);
    try {
      const res = await fetch("https://api-senhas.vercel.app/auth/codigo-verificacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          finalidade: "exclusao"
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || "Código de exclusão enviado ao e-mail.");
        setEtapa(2);
      } else {
        alert(data.detail || data.mensagem || "Não foi possível enviar o código.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  // Realiza a exclusão com código inserido
  const handleExclusao = async (e) => {
    e.preventDefault();
    const confirma = window.confirm("Tem certeza que deseja excluir sua conta?");
    if (!confirma) return;

    setCarregando(true);
    try {
      const res = await fetch(`https://api-senhas.vercel.app/auth/excluir?email=${email}&codigo=${codigo}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || "Conta excluída com sucesso!");
        setConfirmado(true);
      } else {
        alert(data.detail || data.mensagem || "Código inválido ou já expirado.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro na conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="excluir">
      <h2>Excluir Conta</h2>

      {confirmado ? (
        <p>✅ Sua conta foi excluída com sucesso.</p>
      ) : etapa === 1 ? (
        <form onSubmit={handleEnviarCodigo}>
          <input
            type="email"
            placeholder="E-mail cadastrado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={carregando}>
            {carregando ? "Enviando..." : "Enviar Código de Exclusão"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleExclusao}>
          <input
            type="text"
            placeholder="Código recebido por e-mail"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
            maxLength={6}
          />
          <button type="submit" disabled={carregando}>
            {carregando ? "Excluindo..." : "Confirmar Exclusão"}
          </button>
        </form>
      )}
    </div>
  );
}

export default ExcluirUsuario;
