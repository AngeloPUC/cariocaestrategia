// src/pages/dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

import WidgetE   from '../../components/widget_e';
import WidgetN   from '../../components/widget_n';
import WidgetA   from '../../components/widget_a';
import WidgetF   from '../../components/widget_f';
import WidgetTDV from '../../components/widget_TDV';
import WidgetCON from '../../components/widget_CON';
import WidgetT   from '../../components/widget_t';

export default function Dashboard() {
  const [equipe, setEquipe]                     = useState([]);
  const [selecionado, setSelecionado]           = useState('');
  const [acoesFuncionario, setAcoesFuncionario] = useState([]);
  const [feedbackMedia, setFeedbackMedia]       = useState(null);
  const [acaoDetalhada, setAcaoDetalhada]       = useState(null);
  const [kpis, setKpis]                         = useState([]);
  const navigate                                = useNavigate();

  const token  = localStorage.getItem('token');
  const email  = localStorage.getItem('usuario') || '';
  const headers = { Authorization: `Bearer ${token}` };
  const API    = 'https://api-estrategia.vercel.app';

  // 1) Carrega lista de equipe (membros)
  useEffect(() => {
    fetch(`${API}/equipe/`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(data => {
        const lista = Array.isArray(data) ? data : [];
        // Ordena alfabeticamente por nome antes de guardar
        lista.sort((a, b) => a.nome.localeCompare(b.nome));
        setEquipe(lista);
      })
      .catch(err => console.error('Erro ao carregar equipes:', err));
  }, [token]);

  // 2) Busca ações e feedback ao selecionar funcionário
  const handleFuncionario = async (id) => {
    setSelecionado(id);
    setAcaoDetalhada(null);
    setKpis([]);
    setAcoesFuncionario([]);
    setFeedbackMedia(null);

    let listaA = [];
    try {
      const resA = await fetch(
        `${API}/acoes/search?quem_id=${id}`,
        { headers }
      );
      if (resA.ok) {
        const dataA = await resA.json();
        if (Array.isArray(dataA) && dataA.length > 0) {
          listaA = dataA;
        }
      }
    } catch (err) {
      console.error('Erro na busca filtrada de ações:', err);
    }

    if (listaA.length === 0) {
      try {
        const resAll = await fetch(`${API}/acoes/`, { headers });
        if (resAll.ok) {
          const all = await resAll.json();
          if (Array.isArray(all)) {
            listaA = all.filter(a => String(a.quem_id) === String(id));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar todas as ações:', err);
      }
    }

    setAcoesFuncionario(listaA);

    try {
      const resF = await fetch(
        `${API}/feedback/search/?quem_id=${id}`,
        { headers }
      );
      if (!resF.ok) throw new Error(`Feedback: ${resF.status}`);
      const listaF = await resF.json();

      if (Array.isArray(listaF) && listaF.length > 0) {
        const notas = listaF
          .map(f => parseFloat(f.resultado))
          .filter(n => !isNaN(n));

        if (notas.length > 0) {
          const soma  = notas.reduce((sum, n) => sum + n, 0);
          const media = soma / notas.length;
          setFeedbackMedia(media.toFixed(2));
        } else {
          setFeedbackMedia('—');
        }
      } else {
        setFeedbackMedia('—');
      }
    } catch (err) {
      console.error('Erro ao buscar feedback:', err);
      setFeedbackMedia('—');
    }
  };

  // 3) Consulta detalhada de uma ação
  const consultarAcao = async (id) => {
    try {
      const res     = await fetch(`${API}/acoes/${id}`, { headers });
      if (!res.ok) throw new Error(`Detalhe Ação: ${res.status}`);
      const detalhe = await res.json();
      setAcaoDetalhada(detalhe);
      setKpis(Array.isArray(detalhe.kpis) ? detalhe.kpis : []);
    } catch (err) {
      console.error('Erro ao consultar ação:', err);
    }
  };

  // 4) Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/');
  };

  return (
    <>
      <div className="plan-voltar-wrapper">
        <button onClick={handleLogout} className="btn-voltar-dashboard">
          🔐 Logout
        </button>
      </div>

      <div className="plan-container">
        <h2>Painel Estratégico</h2>

        {/* Primeira linha de widgets */}
        <div className="widgets-grid">
          <div className="widget-wrapper"><WidgetE login={email} /></div>
          <div className="widget-wrapper"><WidgetN /></div>
          <div className="widget-wrapper"><WidgetA /></div>
          <div className="widget-wrapper"><WidgetF /></div>
        </div>

        {/* Segunda linha de widgets */}
        <div className="widgets-grid">
          <div className="widget-wrapper"><WidgetTDV /></div>
          <div className="widget-wrapper"><WidgetCON /></div>
          <div className="widget-wrapper"><WidgetT /></div>
        </div>

        <div className="swot-prazo">
          <button onClick={() => navigate('/equipe')}    className="btn-criar">
            👥 Gerir Equipes
          </button>
          <button onClick={() => navigate('/relatorios')} className="btn-criar">
            📊 Relatórios
          </button>
        </div>

        {/* Ações por Funcionário */}
        <div className="acoes-por-funcionario">
          <h3>👤 Detalhamento da Equipe</h3>
          <select
            value={selecionado}
            onChange={e => handleFuncionario(e.target.value)}
            className="select-funcionario"
          >
            <option value="">Selecione o funcionário</option>
            {equipe.map(u => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>

          {selecionado && (
            <p className="feedback-media">
              ⭐ Média de Feedback: <strong>{feedbackMedia}</strong>
            </p>
          )}

          {acoesFuncionario.length > 0 && (
            <table className="tabela-acoes-funcionario">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Consultar</th>
                </tr>
              </thead>
              <tbody>
                {acoesFuncionario.map(a => {
                  const venc  = a.dt_venc || a.quando;
                  const hoje  = new Date().toISOString().slice(0, 10);
                  const status =
                    venc < hoje ? '🔴'
                    : venc === hoje ? '🟡'
                    : '🔵';

                  return (
                    <tr key={a.id}>
                      <td>{a.titulo}</td>
                      <td>{venc}</td>
                      <td>{status}</td>
                      <td>
                        <button
                          className="btn-consultar"
                          onClick={() => consultarAcao(a.id)}
                        >
                          🔍
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {acaoDetalhada && (
            <div className="detalhes-acao">
              <h4>📄 Detalhes da Ação</h4>
              <p><strong>Título:</strong>  {acaoDetalhada.titulo   || '—'}</p>
              <p><strong>Base:</strong>    {acaoDetalhada.base     || '—'}</p>
              <p><strong>Descrição:</strong> {acaoDetalhada.descricao || '—'}</p>
              <p><strong>Vencimento:</strong> {acaoDetalhada.dt_venc   || '—'}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
