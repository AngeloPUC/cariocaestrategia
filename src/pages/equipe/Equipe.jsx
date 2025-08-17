// src/pages/equipe/Equipe.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Equipe.css';

const API_URL = 'https://api-estrategia.vercel.app';

export default function EquipePage() {
  const navigate = useNavigate();

  const [equipe, setEquipe]       = useState([]);
  const [filters, setFilters]     = useState({
    nome: '', funcao: '', dt_niver: '', mediaFeedback: ''
  });
  const [loading, setLoading]     = useState(true);
  const [erro, setErro]           = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newData, setNewData]     = useState({
    nome: '', funcao: '', dt_niver: ''
  });

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('usuario');
  const headers = {
    Authorization: `Bearer ${token}`
  };

  useEffect(() => {
    const fetchEquipe = async () => {
      setLoading(true);
      if (!token || !email) {
        setErro('Usuário ou sessão inválidos');
        setLoading(false);
        return;
      }

      try {
        // 1) busca toda a equipe
        const r1 = await fetch(`${API_URL}/equipe`, { headers });
        if (!r1.ok) throw new Error(`Equipe(${r1.status})`);
        const all = await r1.json();

        // 2) filtra só os do seu time
        const mine = all.filter(m => m.owner_email === email);

        // 3) calcula média de feedback apenas do campo 'resultado'
        const enriched = await Promise.all(
          mine.map(async u => {
            let media = '—';
            try {
              const r2 = await fetch(
                `${API_URL}/feedback/search/?quem_id=${u.id}`,
                { headers }
              );
              if (r2.ok) {
                const feedbacks = await r2.json();
                if (Array.isArray(feedbacks)) {
                  const notas = feedbacks
                    .map(fb => parseFloat(fb.resultado))
                    .filter(n => !isNaN(n));
                  if (notas.length) {
                    const soma = notas.reduce((a, b) => a + b, 0);
                    media = (soma / notas.length).toFixed(2);
                  }
                }
              }
            } catch (err) {
              console.error(`Erro ao buscar feedback de ${u.id}:`, err);
            }
            return {
              ...u,
              nome: u.nome || '',
              funcao: u.funcao || '',
              dt_niver: u.dt_niver || '',
              mediaFeedback: media
            };
          })
        );

        setEquipe(enriched);
      } catch (e) {
        console.error(e);
        setErro('Falha ao carregar equipe.');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipe();
  }, [token, email]);


  // filtros
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const filtered = equipe.filter(u => {
    return u.nome.toLowerCase().includes(filters.nome.toLowerCase()) &&
           u.funcao.toLowerCase().includes(filters.funcao.toLowerCase()) &&
           u.dt_niver.includes(filters.dt_niver) &&
           u.mediaFeedback.includes(filters.mediaFeedback);
  });


  // edição inline
  const handleEditClick = u => {
    setEditingId(u.id);
    setEditingData({
      nome: u.nome,
      funcao: u.funcao,
      dt_niver: u.dt_niver
    });
  };
  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditingData(d => ({ ...d, [name]: value }));
  };
  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`${API_URL}/equipe/${editingId}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingData)
      });
      if (!res.ok) throw new Error(res.status);
      setEquipe(eq => eq.map(u =>
        u.id === editingId
          ? { ...u, ...editingData, mediaFeedback: u.mediaFeedback }
          : u
      ));
      setEditingId(null);
    } catch (e) {
      console.error('Erro ao salvar edição:', e);
      alert('Falha ao salvar alterações.');
    }
  };
  const handleCancelEdit = () => setEditingId(null);


  // novo inline
  const handleNewClick = () => setShowNewForm(true);
  const handleNewChange = e => {
    const { name, value } = e.target;
    setNewData(d => ({ ...d, [name]: value }));
  };
  const handleSaveNew = async () => {
    try {
      const payload = { ...newData, owner_email: email };
      const res = await fetch(`${API_URL}/equipe`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(res.status);
      const created = await res.json();
      setEquipe(eq => [...eq, { ...created, mediaFeedback: '—' }]);
      setShowNewForm(false);
      setNewData({ nome:'', funcao:'', dt_niver:'' });
    } catch (e) {
      console.error('Erro ao criar membro:', e);
      alert('Falha ao cadastrar novo membro.');
    }
  };
  const handleCancelNew = () => {
    setShowNewForm(false);
    setNewData({ nome:'', funcao:'', dt_niver:'' });
  };


  // delete
  const handleDelete = async id => {
    if (!window.confirm('Deseja excluir este membro?')) return;
    try {
      const res = await fetch(`${API_URL}/equipe/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error(res.status);
      setEquipe(eq => eq.filter(u => u.id !== id));
    } catch (e) {
      console.error('Erro ao deletar:', e);
      alert('Falha ao excluir membro.');
    }
  };

  return (
    <div className="equipe-container">
      <div className="equipe-header">
        <button onClick={() => navigate('/dashboard')} className="btn-voltar">
          ← Voltar
        </button>
        <h2>Modulo Equipe</h2>
        <button onClick={handleNewClick} className="btn-novo">
          + Novo
        </button>
      </div>

      {loading
        ? <p>Carregando equipe...</p>
        : erro
          ? <p className="error">{erro}</p>
          : (
            <table className="tabela-equipe">
              <thead>
                <tr>
                  <th>Nome
                    <input
                      type="text"
                      name="nome"
                      value={filters.nome}
                      onChange={handleFilterChange}
                      className="filter-input"
                      placeholder="Filtrar"
                    />
                  </th>
                  <th>Função
                    <input
                      type="text"
                      name="funcao"
                      value={filters.funcao}
                      onChange={handleFilterChange}
                      className="filter-input"
                      placeholder="Filtrar"
                    />
                  </th>
                  <th>Aniversário
                    <input
                      type="date"
                      name="dt_niver"
                      value={filters.dt_niver}
                      onChange={handleFilterChange}
                      className="filter-input"
                    />
                  </th>
                  <th>Média Feedback
                    <input
                      type="text"
                      name="mediaFeedback"
                      value={filters.mediaFeedback}
                      onChange={handleFilterChange}
                      className="filter-input"
                      placeholder="Filtrar"
                    />
                  </th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {showNewForm && (
                  <tr>
                    <td>
                      <input
                        type="text"
                        name="nome"
                        value={newData.nome}
                        onChange={handleNewChange}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="funcao"
                        value={newData.funcao}
                        onChange={handleNewChange}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        name="dt_niver"
                        value={newData.dt_niver}
                        onChange={handleNewChange}
                      />
                    </td>
                    <td />
                    <td className="acoes-tabela">
                      <button onClick={handleSaveNew}>Salvar</button>
                      <button onClick={handleCancelNew}>Cancelar</button>
                    </td>
                  </tr>
                )}

                {filtered.map(user => (
                  <tr key={user.id}>
                    {editingId === user.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            name="nome"
                            value={editingData.nome}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="funcao"
                            value={editingData.funcao}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            name="dt_niver"
                            value={editingData.dt_niver}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>{user.mediaFeedback}</td>
                        <td className="acoes-tabela">
                          <button onClick={handleSaveEdit}>Salvar</button>
                          <button onClick={handleCancelEdit}>Cancelar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{user.nome}</td>
                        <td>{user.funcao}</td>
                        <td>{user.dt_niver}</td>
                        <td>{user.mediaFeedback}</td>
                        <td className="acoes-tabela">
                          <button onClick={() => handleEditClick(user)}>✏️</button>
                          <button onClick={() => handleDelete(user.id)}>🗑️</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )
      }
    </div>
  );
}
