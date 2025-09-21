import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [open, setOpen] = useState(false);
  const [logado, setLogado] = useState(false);
  const navigate = useNavigate();

  const verificarLogin = () => {
    const token = localStorage.getItem('token');
    setLogado(!!token);
  };

  useEffect(() => {
    verificarLogin();
    const atualizador = () => verificarLogin();
    window.addEventListener('storage', atualizador);
    return () => window.removeEventListener('storage', atualizador);
  }, []);

  const sair = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    verificarLogin();
    navigate('/');
  };

  return (
    <header className="cabecalho">
      <div className="logo">
        <img
          src="/logocariocaestrategia.png"
          alt="Logo Carioca PDCA"
          style={{ height: '50px', verticalAlign: 'middle', margin: '0 12px 0 0' }}
        />
      </div>

      <button
        className="menu-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      <nav className={`menu ${open ? 'aberto' : ''}`}>
        <Link to="/">🏠 Início</Link>
        <Link to="/estrutura">🧩 Estrutura</Link>
        <Link to="/login">🔐 Login</Link>

        {logado && (
          <>
            <Link to="/dashboard">🧭 DashBoard</Link>
            <Link to="/dashday">📌 Dash Day</Link>

            <Link to="/equipe">👥 Módulo Equipe</Link>
            <Link to="/acoes">⚙️ Módulo Ações</Link>
            <Link to="/feedback">💬 Módulo Feedback</Link>
            <Link to="/tarefas">✅ Módulo Tarefas</Link>
            <Link to="/tdv">🏷️ Módulo TDV</Link>
            <Link to="/consorcio">🔗 Módulo Consórcio</Link>

            {/* mover Esteira e Agenda para após Consórcio */}
            <Link to="/esteira">🛒 Esteira</Link>
            <Link to="/agenda">📅 Agenda</Link>

            <Link to="/relatorios">📊 Relatórios</Link>

            <button className="btn-sair" onClick={sair}>
              🔓 Sair
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
