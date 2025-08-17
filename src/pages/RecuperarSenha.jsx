import { useState } from "react";
import "./RecuperarSenha.css";

function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleRecuperacao = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://api-senhas.vercel.app/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setEnviado(true);
      } else {
        alert("Erro ao enviar recuperação.");
      }
    } catch (err) {
      alert("Erro na conexão.");
    }
  };

  return (
    <div className="recuperar">
      <h2>Recuperar Senha</h2>
      {enviado ? (
        <p>Se o e-mail estiver cadastrado, enviaremos instruções de redefinição.</p>
      ) : (
        <form onSubmit={handleRecuperacao}>
          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Enviar</button>
        </form>
      )}
    </div>
  );
}

export default RecuperarSenha;
