// src/pages/tdv/Tdv.jsx
import React, { useEffect, useState } from 'react';
import './Tdv.css';

const API = 'https://api-estrategia.vercel.app';

export default function TdvPage() {
  const [tdvs, setTdvs]               = useState([]);
  const [upcoming, setUpcoming]       = useState([]);
  const [vencidas, setVencidas]       = useState([]);
  const [monthPoints, setMonthPoints] = useState(0);
  const [semPoints, setSemPoints]     = useState(0);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData]   = useState({});

  const [isCreating, setIsCreating] = useState(false);
  const [newData, setNewData]       = useState({
    proposta:   '',
    n_meses:    '',
    dia_venc:   '',
    pmt_pontos: '',
    dt_venda:   ''
  });

  const token   = localStorage.getItem('token');
  const email   = localStorage.getItem('usuario') || '';
  const headers = { Authorization: `Bearer ${token}` };

  // parse "DD/MM" ou legado "18" → { day, month }
  function parseProxVenc(text) {
    const parts = String(text).split('/');
    const day   = parseInt(parts[0], 10) || 1;
    const month = parts.length > 1
      ? parseInt(parts[1], 10) - 1
      : new Date().getMonth();
    return { day, month };
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  async function fetchAll() {
    try {
      const res = await fetch(`${API}/tdv`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mine = Array.isArray(data)
        ? data.filter(item => item.owner_email === email)
        : [];

      setTdvs(mine);
      calcUpcoming(mine);
      calcVencidas(mine);
      calcPoints(mine);
    } catch (err) {
      console.error('Erro ao buscar TDV:', err);
    }
  }

  function calcUpcoming(list) {
    const today        = new Date();
    const currentMonth = today.getMonth();
    const prevMonth    = currentMonth === 0 ? 11 : currentMonth - 1;
    const year         = today.getFullYear();

    const upcomingList = list.filter(item => {
      const remaining = parseInt(item.n_meses, 10);
      if (remaining <= 0) return false;

      const vendaDate = new Date(item.dt_venda);
      const { day: vencDay, month: vencMonth } = parseProxVenc(item.dia_venc);

      if (vencMonth !== currentMonth && vencMonth !== prevMonth) {
        return false;
      }

      const due = new Date(year, vencMonth, vencDay);
      if (due <= vendaDate) return false;

      return true;
    })
    .sort((a, b) => {
      const A = parseProxVenc(a.dia_venc);
      const B = parseProxVenc(b.dia_venc);
      return A.month !== B.month
        ? A.month - B.month
        : A.day - B.day;
    });

    setUpcoming(upcomingList);

    const pts = upcomingList.reduce(
      (sum, item) => sum + Number(item.pmt_pontos || 0),
      0
    );
    setMonthPoints(pts);
  }

  function calcVencidas(list) {
    const today        = new Date();
    const currentMonth = today.getMonth();
    const year         = today.getFullYear();

    const prevMonths = [
      (currentMonth + 11) % 12,
      (currentMonth + 10) % 12,
      (currentMonth + 9)  % 12
    ];

    const vencidasList = list.filter(item => {
      const remaining = parseInt(item.n_meses, 10);
      if (remaining <= 0) return false;

      const { day: vencDay, month: vencMonth } = parseProxVenc(item.dia_venc);
      if (!prevMonths.includes(vencMonth)) return false;

      const due = new Date(year, vencMonth, vencDay);
      if (due > today) return false;

      return true;
    })
    .sort((a, b) => {
      const A = parseProxVenc(a.dia_venc);
      const B = parseProxVenc(b.dia_venc);
      return A.month !== B.month
        ? A.month - B.month
        : A.day - B.day;
    });

    setVencidas(vencidasList);
  }

  function calcPoints(list) {
    const today        = new Date();
    const year         = today.getFullYear();
    const currentMonth = today.getMonth();
    const semEnd       = currentMonth <= 5 ? 5 : 11;

    let sSum = 0;
    list.forEach(item => {
      const pontos    = Number(item.pmt_pontos) || 0;
      const remaining = parseInt(item.n_meses, 10);
      if (remaining <= 0) return;

      const vendaDate = new Date(item.dt_venda);
      const { day: vencDay, month: vencMonth } = parseProxVenc(item.dia_venc);

      const firstDueMonth = vencMonth;
      const lastDueMonth  = Math.min(vencMonth + remaining - 1, semEnd);

      let flowCount = 0;
      for (let m = firstDueMonth; m <= lastDueMonth; m++) {
        const due = new Date(year, m, vencDay);
        if (due > vendaDate) flowCount++;
      }
      sSum += pontos * flowCount;
    });

    setSemPoints(sSum);
  }

  async function handleConfirm(id, nMeses, diaVencText) {
    const novaMeses = String(Math.max(0, parseInt(nMeses, 10) - 1));
    const { day, month } = parseProxVenc(diaVencText);
    const next  = new Date(new Date().getFullYear(), month + 1, day);
    const dd    = String(next.getDate()).padStart(2, '0');
    const mm    = String(next.getMonth() + 1).padStart(2, '0');
    const novoProx = `${dd}/${mm}`;

    try {
      await fetch(`${API}/tdv/${id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          n_meses: novaMeses,
          dia_venc: novoProx
        })
      });
      fetchAll();
    } catch (err) {
      console.error('Erro ao confirmar:', err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este registro?')) return;
    try {
      await fetch(`${API}/tdv/${id}`, { method: 'DELETE', headers });
      fetchAll();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  }

  function handleEdit(row) {
    setEditingId(row.id);
    setEditData({
      proposta:   row.proposta,
      n_meses:    row.n_meses,
      dia_venc:   row.dia_venc,
      pmt_pontos: row.pmt_pontos,
      dt_venda:   row.dt_venda
    });
  }

  function handleChange(e) {
    setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(id) {
    try {
      await fetch(`${API}/tdv/${id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      setEditingId(null);
      fetchAll();
    } catch (err) {
      console.error('Erro ao salvar edição:', err);
    }
  }

  function handleCancel() {
    setEditingId(null);
    setEditData({});
  }

  function handleNew() {
    setIsCreating(true);
    setNewData({
      proposta:   '',
      n_meses:    '',
      dia_venc:   '',
      pmt_pontos: '',
      dt_venda:   ''
    });
  }

  function handleNewChange(e) {
    setNewData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleNewSave() {
    try {
      await fetch(`${API}/tdv`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newData, owner_email: email })
      });
      setIsCreating(false);
      fetchAll();
    } catch (err) {
      console.error('Erro ao criar novo:', err);
    }
  }

  function handleNewCancel() {
    setIsCreating(false);
  }

  function renderRow(row) {
    const isEditing = editingId === row.id;
    if (isEditing) {
      return (
        <tr key={row.id}>
          <td><input name="proposta"   value={editData.proposta}   onChange={handleChange} /></td>
          <td><input name="n_meses"    value={editData.n_meses}    onChange={handleChange} /></td>
          <td><input name="dia_venc"   value={editData.dia_venc}   onChange={handleChange} placeholder="DD/MM" /></td>
          <td><input name="pmt_pontos" value={editData.pmt_pontos} onChange={handleChange} /></td>
          <td>
            <input
              name="dt_venda"
              type="date"
              value={editData.dt_venda}
              onChange={handleChange}
            />
          </td>
          <td className="acao-tdv">
            <button onClick={() => handleSave(row.id)}>💾</button>
            <button onClick={handleCancel}>✖️</button>
          </td>
        </tr>
      );
    }

    return (
      <tr key={row.id}>
        <td>{row.proposta}</td>
        <td>{row.n_meses}</td>
        <td>{row.dia_venc}</td>
        <td>{row.pmt_pontos}</td>
        <td>{row.dt_venda}</td>
        <td className="acao-tdv">
          <button
            onClick={() => handleConfirm(row.id, row.n_meses, row.dia_venc)}
            className="btn-confirm"
          >
            ✔️
          </button>
          <button onClick={() => handleEdit(row)}>✏️</button>
          <button onClick={() => handleDelete(row.id)}>🗑️</button>
        </td>
      </tr>
    );
  }

  return (
    <div className="tdv-container">
      <div className="tdv-header">
        <button onClick={() => window.history.back()} className="btn-back">
          ← Voltar
        </button>
        <h2>Fluxo de TDV</h2>
        <button onClick={handleNew} className="btn-new">
          Novo Seguro
        </button>
      </div>

      <div className="stats">
        <div className="stat-box">
          <h4>Pontos este mês</h4>
          <p>{monthPoints}</p>
        </div>
        <div className="stat-box">
          <h4>Pontos no semestre</h4>
          <p>{semPoints}</p>
        </div>
      </div>

      {isCreating && (
        <div className="section">
          <h3>Novo Seguro</h3>
          <table className="tabela-tdv">
            <thead>
              <tr>
                <th>Proposta</th>
                <th>Fluxo pendente</th>
                <th>Próx. venc</th>
                <th>Pontos/mês</th>
                <th>Dt. venda</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input name="proposta"   value={newData.proposta}   onChange={handleNewChange} /></td>
                <td><input name="n_meses"    value={newData.n_meses}    onChange={handleNewChange} /></td>
                <td><input name="dia_venc"   value={newData.dia_venc}   onChange={handleNewChange} placeholder="DD/MM" /></td>
                <td><input name="pmt_pontos" value={newData.pmt_pontos} onChange={handleNewChange} /></td>
                <td>
                  <input
                    name="dt_venda"
                    type="date"
                    value={newData.dt_venda}
                    onChange={handleNewChange}
                  />
                </td>
                <td className="acao-tdv">
                  <button onClick={handleNewSave}>💾</button>
                  <button onClick={handleNewCancel}>✖️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="section">
        <h3>Vencidas</h3>
        <table className="tabela-tdv">
          <thead>
            <tr>
              <th>Proposta</th>
              <th>Fluxo pendente</th>
              <th>Próx. venc</th>
              <th>Pontos/mês</th>
              <th>Dt. venda</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {vencidas.map(renderRow)}
          </tbody>
        </table>
      </div>

      <div className="section">
        <h3>Fluxo Pendentes</h3>
        <table className="tabela-tdv">
          <thead>
            <tr>
              <th>Proposta</th>
              <th>Fluxo pendente</th>
              <th>Próx. venc</th>
              <th>Pontos/mês</th>
              <th>Dt. venda</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map(renderRow)}
          </tbody>
        </table>
      </div>

      <div className="section">
        <h3>Todos os seguros</h3>
        <table className="tabela-tdv">
          <thead>
            <tr>
              <th>Proposta</th>
              <th>Fluxo pendente</th>
              <th>Próx. venc</th>
                <th>Pontos/mês</th>
                <th>Dt. venda</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {[...tdvs]
                .sort((a, b) => {
                  const A = parseProxVenc(a.dia_venc);
                  const B = parseProxVenc(b.dia_venc);
                  return A.month !== B.month
                    ? A.month - B.month
                    : A.day - B.day;
                })
                .map(renderRow)}
            </tbody>
        </table>
      </div>
    </div>
  );
}
