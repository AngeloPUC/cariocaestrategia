// src/pages/feedback/Feedback.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Feedback.css';


const API_URL = 'https://api-estrategia.vercel.app';

export default function Feedback() {
  const [equipe, setEquipe] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [acoes, setAcoes] = useState([]);
  const [actionDetail, setActionDetail] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nota: '', feedback: '' });

  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackDetail, setFeedbackDetail] = useState(null);
  const [filters, setFilters] = useState({ titulo: '', nota: '' });

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // carrega equipe
  useEffect(() => {
    fetch(`${API_URL}/equipe`, { headers })
      .then(res => res.json())
      .then(data => Array.isArray(data) && setEquipe(data))
      .catch(console.error);
  }, [token]);

  // limpa somente o form (sem fechar o modal de detalhes)
  const clearForm = () => {
    setEditId(null);
    setForm({ nota: '', feedback: '' });
  };

  // ao trocar de funcionário, busca ações e feedbacks
  const handleMemberChange = async memberId => {
    setSelectedMember(memberId);
    setAcoes([]);
    setActionDetail(null);
    setShowForm(false);
    clearForm();
    setFeedbackDetail(null);
    setFeedbackList([]);

    if (!memberId) return;

    // 1) traz todas as Ações e filtra por quem_id
    try {
      const resA = await fetch(`${API_URL}/acoes`, { headers });
      const allA = await resA.json();
      const userActions = Array.isArray(allA)
        ? allA.filter(a => Number(a.quem_id) === Number(memberId))
        : [];
      userActions.sort((a, b) => new Date(a.dt_venc) - new Date(b.dt_venc));
      setAcoes(userActions);
    } catch (err) {
      console.error('Falha ao buscar ações', err);
    }

    // 2) busca feedbacks pelo endpoint de search
    try {
      const resF = await fetch(
        `${API_URL}/feedback/search/?quem_id=${memberId}`,
        { headers }
      );
      const listF = await resF.json();
      setFeedbackList(Array.isArray(listF) ? listF : []);
    } catch (err) {
      console.error('Falha ao buscar feedbacks', err);
    }
  };

  // carrega detalhe da ação e só depois abre o form
  const handleActionConsult = async acaoId => {
    clearForm();
    setFeedbackDetail(null);
    try {
      const res = await fetch(`${API_URL}/acoes/${acaoId}`, { headers });
      const data = await res.json();
      setActionDetail(data);
      setEditId(null);
      setShowForm(true);
    } catch (err) {
      console.error('Falha ao buscar ação', err);
    }
  };

  // envia novo feedback (POST) ou edição (PUT)
  const handleFormSubmit = async e => {
    e.preventDefault();
    if (!actionDetail) return;

    const payload = {
      titulo: actionDetail.titulo,
      base: actionDetail.base,
      descricao: actionDetail.descricao,
      resultado: Number(form.nota),
      quem_id: Number(selectedMember),
      feedback: form.feedback
    };
    const url = editId
      ? `${API_URL}/feedback/${editId}`
      : `${API_URL}/feedback`;
    const method = editId ? 'PUT' : 'POST';

    try {
      await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      // recarrega lista de feedbacks
      const resF = await fetch(
        `${API_URL}/feedback/search/?quem_id=${selectedMember}`,
        { headers }
      );
      const listF = await resF.json();
      setFeedbackList(Array.isArray(listF) ? listF : []);

      setShowForm(false);
      clearForm();
    } catch (err) {
      console.error('Falha ao enviar feedback', err);
    }
  };

  // preenche form para edição
  const handleFeedbackEdit = async id => {
    try {
      const res = await fetch(`${API_URL}/feedback/${id}`, { headers });
      const f = await res.json();
      setEditId(id);
      setForm({
        nota: f.resultado.toString(),
        feedback: f.feedback
      });
      setActionDetail({
        titulo: f.titulo,
        base: f.base,
        descricao: f.descricao
      });
      setShowForm(true);
      setFeedbackDetail(null);
    } catch (err) {
      console.error('Falha ao carregar feedback para edição', err);
    }
  };

  // deleta feedback
  const handleFeedbackDelete = async id => {
    if (!window.confirm('Confirma exclusão deste feedback?')) return;
    try {
      await fetch(`${API_URL}/feedback/${id}`, {
        method: 'DELETE',
        headers
      });
      setFeedbackList(prev => prev.filter(f => f.id !== id));
      if (feedbackDetail?.id === id) setFeedbackDetail(null);
    } catch (err) {
      console.error('Falha ao excluir feedback', err);
    }
  };

  // mostra detalhes de um feedback
  const handleFeedbackConsult = async id => {
    clearForm();
    setShowForm(false);
    try {
      const res = await fetch(`${API_URL}/feedback/${id}`, { headers });
      const f = await res.json();
      setFeedbackDetail(f);
    } catch (err) {
      console.error('Falha ao buscar detalhes do feedback', err);
    }
  };

  // filtros do relatório
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredFeedback = feedbackList
    .filter(f =>
      !filters.titulo ||
      f.titulo.toLowerCase().includes(filters.titulo.toLowerCase())
    )
    .filter(f =>
      !filters.nota || f.resultado === Number(filters.nota)
    );

  return (
    <div className="feedback-container">
      <header className="feedback-header">
        <button
          className="btn-voltar"
          onClick={() => navigate('/dashboard')}
        >
          ← Voltar
        </button>
        <h2>Feedback</h2>
      </header>

      <section className="create-feedback">
        {/* seletor de "Quem" padronizado */}
        <select
          className="custom-select"
          value={selectedMember}
          onChange={e => handleMemberChange(e.target.value)}
        >
          <option value="">Selecione o funcionário</option>
          {equipe.map(u => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>

        {acoes.length > 0 && (
          <table className="tabela-acoes">
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Título</th>
                <th>Base</th>
                <th>Descrição</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {acoes.map(a => (
                <tr key={a.id}>
                  <td>{a.dt_venc}</td>
                  <td>{a.titulo}</td>
                  <td>{a.base}</td>
                  <td>{a.descricao}</td>
                  <td>
                    <button onClick={() => handleActionConsult(a.id)}>
                      📝
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showForm && actionDetail && (
          <div className="feedback-form-container">
            <h4>{editId ? 'Editar Feedback' : 'Novo Feedback'}</h4>
            <form
              className="feedback-form"
              onSubmit={handleFormSubmit}
            >
              <label>
                Nota (1–10):
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.nota}
                  onChange={e =>
                    setForm(prev => ({ ...prev, nota: e.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Comentário:
                <textarea
                  rows="3"
                  value={form.feedback}
                  onChange={e =>
                    setForm(prev => ({ ...prev, feedback: e.target.value }))
                  }
                  required
                />
              </label>

              <button type="submit">
                {editId ? 'Salvar' : 'Enviar'}
              </button>
            </form>
          </div>
        )}
      </section>

      <section className="report-feedback">
        <h3>Relatório de Feedback</h3>
        <div className="filters">
          <input
            className="filter-input"
            type="text"
            name="titulo"
            placeholder="Filtrar por título"
            value={filters.titulo}
            onChange={handleFilterChange}
          />
          <input
            className="filter-input"
            type="number"
            name="nota"
            placeholder="Filtrar por nota"
            min="1"
            max="10"
            value={filters.nota}
            onChange={handleFilterChange}
          />
        </div>

        <table className="tabela-feedback">
          <thead>
            <tr>
              <th>Título</th>
              <th>Resultado</th>
              <th>Quem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedback.map(fb => (
              <tr key={fb.id}>
                <td>{fb.titulo}</td>
                <td>{fb.resultado}</td>
                <td>
                  {equipe.find(u => u.id === fb.quem_id)?.nome}
                </td>
                <td className="acoes-tabela">
                  <button onClick={() => handleFeedbackConsult(fb.id)}>
                    🔍
                  </button>
                  <button onClick={() => handleFeedbackEdit(fb.id)}>
                    ✏️
                  </button>
                  <button onClick={() => handleFeedbackDelete(fb.id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {feedbackDetail && (
          <div className="detalhes-feedback">
            <button
              className="btn-voltar"
              onClick={() => setFeedbackDetail(null)}
            >
              ← Voltar
            </button>
            <h4>Detalhes do Feedback</h4>
            <p>
              <strong>Título:</strong> {feedbackDetail.titulo}
            </p>
            <p>
              <strong>Base:</strong> {feedbackDetail.base}
            </p>
            <p>
              <strong>Descrição:</strong> {feedbackDetail.descricao}
            </p>
            <p>
              <strong>Resultado:</strong> {feedbackDetail.resultado}
            </p>
            <p>
              <strong>Comentário:</strong> {feedbackDetail.feedback}
            </p>
            <p>
              <strong>Quem:</strong>{' '}
              {equipe.find(u => u.id === feedbackDetail.quem_id)?.nome}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
