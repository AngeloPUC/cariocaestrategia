// src/pages/acoes/Acoes.jsx
import React, { useState, useEffect } from 'react';
import './acoes.css';

const API_URL = 'https://api-estrategia.vercel.app';

export default function Acoes() {
  const [equipe, setEquipe]           = useState([]);
  const [selecionado, setSelecionado] = useState('');
  const [acoes, setAcoes]             = useState([]);
  const [detalhe, setDetalhe]         = useState(null);

  const [formMode, setFormMode]       = useState(null); // 'new' | 'edit'
  const [formData, setFormData]       = useState({
    id: null,
    titulo:    '',
    base:      '',
    descricao: '',
    dt_venc:   '',
  });

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type':  'application/json',
    Authorization:   `Bearer ${token}`,
  };

  // 1. carrega lista de funcionários
  useEffect(() => {
    fetch(`${API_URL}/equipe`, { headers })
      .then(r => r.json())
      .then(data => Array.isArray(data) && setEquipe(data))
      .catch(console.error);
  }, [token]);

  // 2. ao selecionar funcionário, busca todas as ações e filtra por quem_id
  const handleFuncionario = async (id) => {
    setSelecionado(id);
    setAcoes([]);
    setDetalhe(null);
    setFormMode(null);

    // busco todas as ações e filtro localmente
    const resAll = await fetch(`${API_URL}/acoes`, { headers });
    const listAll = await resAll.json();
    if (!Array.isArray(listAll)) return;

    const userActions = listAll.filter(a => a.quem_id === Number(id));

    // para cada ação, busco feedbacks e calculo média
    const enriched = await Promise.all(
      userActions.map(async action => {
        const resF = await fetch(
          `${API_URL}/feedback/search?quem_id=${action.id}`,
          { headers }
        );
        const feedbacks = await resF.json();
        let media = '—';
        if (Array.isArray(feedbacks) && feedbacks.length) {
          const soma = feedbacks.reduce((s, f) => s + (f.resultado || 0), 0);
          media = (soma / feedbacks.length).toFixed(2);
        }
        return { ...action, mediaFeedback: media };
      })
    );

    setAcoes(enriched);
  };

  // 3. excluir ação
  const handleDelete = async (acaoId) => {
    if (!window.confirm('Confirma exclusão desta ação?')) return;
    await fetch(`${API_URL}/acoes/${acaoId}`, {
      method: 'DELETE',
      headers,
    });
    setAcoes(prev => prev.filter(a => a.id !== acaoId));
    if (detalhe?.id === acaoId) setDetalhe(null);
    if (formMode === 'edit' && formData.id === acaoId) setFormMode(null);
  };

  // 4. consultar detalhes da ação
  const handleConsult = async (acaoId) => {
    setFormMode(null);
    const res = await fetch(`${API_URL}/acoes/${acaoId}`, { headers });
    const data = await res.json();
    setDetalhe(data);
  };

  // 5. abrir form de inclusão ou edição
  const openForm = async (mode, acaoId = null) => {
    setDetalhe(null);
    setFormMode(mode);

    if (mode === 'edit' && acaoId) {
      const res = await fetch(`${API_URL}/acoes/${acaoId}`, { headers });
      const d   = await res.json();
      setFormData({
        id:        acaoId,
        titulo:    d.titulo    || '',
        base:      d.base      || '',
        descricao: d.descricao || '',
        dt_venc:   d.dt_venc   || '',
      });
    } else {
      setFormData({ id: null, titulo: '', base: '', descricao: '', dt_venc: '' });
    }
  };

  // 6. criar ou atualizar ação
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      titulo:    formData.titulo,
      base:      formData.base,
      descricao: formData.descricao,
      dt_venc:   formData.dt_venc,
      quem_id:   selecionado,
    };

    const method = formMode === 'new' ? 'POST' : 'PUT';
    const url    = formMode === 'new'
      ? `${API_URL}/acoes`
      : `${API_URL}/acoes/${formData.id}`;

    await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload),
    });

    // recarrega lista
    await handleFuncionario(selecionado);
    setFormMode(null);
  };

  // 7. atualiza campo do form
  const updateField = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="acoes-container">
      <div className="acoes-header">
        <h2>Ações</h2>
        <button
          className="btn-novo"
          disabled={!selecionado}
          onClick={() => openForm('new')}
        >
          + Nova Ação
        </button>
      </div>

      <div className="select-funcionario-wrapper">
        <select
          className="select-funcionario"
          value={selecionado}
          onChange={e => handleFuncionario(e.target.value)}
        >
          <option value="">Selecione o funcionário</option>
          {equipe.map(u => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </div>

      {selecionado && !formMode && (
        <table className="tabela-acoes">
          <thead>
            <tr>
              <th>Título</th>
              <th>Base</th>
              <th>Descrição</th>
              <th>Vencimento</th>
              <th>Média Feedback</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {acoes.length
              ? acoes.map(a => (
                  <tr key={a.id}>
                    <td>{a.titulo}</td>
                    <td>{a.base}</td>
                    <td>{a.descricao}</td>
                    <td>{a.dt_venc}</td>
                    <td>{a.mediaFeedback}</td>
                    <td className="acoes-tabela">
                      <button onClick={() => openForm('edit', a.id)}>✏️</button>
                      <button onClick={() => handleDelete(a.id)}>🗑️</button>
                      <button onClick={() => handleConsult(a.id)}>🔍</button>
                    </td>
                  </tr>
                ))
              : (
                <tr>
                  <td colSpan="6" className="sem-acoes">
                    Nenhuma ação vinculada
                  </td>
                </tr>
              )
            }
          </tbody>
        </table>
      )}

      {formMode && (
        <form className="form-acao form-grid" onSubmit={handleSubmit}>
          <h3>{formMode === 'new' ? '➕ Nova Ação' : '✏️ Editar Ação'}</h3>

          <div className="form-group">
            <label>Título</label>
            <input
              type="text"
              value={formData.titulo}
              onChange={e => updateField('titulo', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Base</label>
            <input
              type="text"
              value={formData.base}
              onChange={e => updateField('base', e.target.value)}
              required
            />
          </div>

          <div className="form-group form-span-2">
            <label>Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={e => updateField('descricao', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Dt. Venc.</label>
            <input
              type="date"
              value={formData.dt_venc}
              onChange={e => updateField('dt_venc', e.target.value)}
              required
            />
          </div>

          <div className="form-actions form-span-2">
            <button type="submit" className="btn-salvar">
              {formMode === 'new' ? 'Criar' : 'Atualizar'}
            </button>
            <button
              type="button"
              className="btn-cancelar"
              onClick={() => setFormMode(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {detalhe && !formMode && (
        <div className="detalhes-acao">
          <h4>📄 Detalhes da Ação</h4>
          <p><strong>Título:</strong> {detalhe.titulo}</p>
          <p><strong>Base:</strong> {detalhe.base}</p>
          <p><strong>Descrição:</strong> {detalhe.descricao}</p>
          <p><strong>Dt. Venc.:</strong> {detalhe.dt_venc}</p>
        </div>
      )}
    </div>
  );
}
