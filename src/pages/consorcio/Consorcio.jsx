// src/pages/consorcio/Consorcio.jsx
import React, { useEffect, useState } from 'react';
import './Consorcio.css';

function formatCurrency(value) {
  return Number(value)
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
}

const API = 'https://api-estrategia.vercel.app';

export default function ConsorcioPage() {
  const [list, setList] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [paidTotal, setPaidTotal] = useState(0);
  const [pendingValueTotal, setPendingValueTotal] = useState(0);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const [newData, setNewData] = useState({
    proposta: '',
    dt_venda: '',
    tipo: 'imovel',
    valor: '',
    dia_pg: '1',
  });

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('usuario') || '';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const res = await fetch(`${API}/consorcio`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mine = Array.isArray(data)
        ? data.filter(item => item.owner_email === email)
        : [];
      setList(mine);
      calcPaidTotal(mine);
      calcPendentes(mine);
    } catch (err) {
      console.error('Erro ao buscar Consórcio:', err);
    }
  }

  function calcPaidTotal(items) {
    const today    = new Date();
    const month    = today.getMonth();
    const semStart = month <= 5 ? 0 : 6;
    const semEnd   = month <= 5 ? 5 : 11;

    const sum = items.reduce((acc, item) => {
      const parcelaValor = Number(item.valor) || 0;
      const pagos        = parseInt(item.dia_pg, 10) || 0;
      const vendMonth    = new Date(item.dt_venda).getMonth();

      let count = 0;
      for (let parcela = 1; parcela <= pagos; parcela++) {
        // sem shift aqui, pois são parcelas já quitadas
        const instMonth = vendMonth + (parcela - 1);
        if (instMonth >= semStart && instMonth <= semEnd) {
          count++;
        }
      }
      return acc + parcelaValor * count;
    }, 0);

    setPaidTotal(sum);
  }

  function calcPendentes(items) {
    const today    = new Date();
    const month    = today.getMonth();
    const year     = today.getFullYear();
    const semStart = month <= 5 ? 0 : 6;
    const semEnd   = month <= 5 ? 5 : 11;

    let totalValue = 0;
    const listMonth = [];

    items.forEach(item => {
      const parcelaValor = Number(item.valor) || 0;
      const pagos        = parseInt(item.dia_pg, 10) || 0;
      const vendDate     = new Date(item.dt_venda);
      const vendMonth    = vendDate.getMonth();
      const vendDay      = vendDate.getDate();
      const dueDay       = item.tipo === 'imovel' ? 15 : 10;

      // se venda após o dia de vencimento, desloca todas as parcelas em 1 mês
      const offsetShift = vendDay > dueDay ? 1 : 0;

      // 1) soma todas as parcelas não pagas no semestre (parcelas pagos+1 até 4)
      for (let parcela = pagos + 1; parcela <= 4; parcela++) {
        const instMonth = vendMonth + offsetShift + (parcela - 1);
        if (instMonth >= semStart && instMonth <= semEnd) {
          totalValue += parcelaValor;
        }
      }

      // 2) identifica a próxima parcela pendente no mês atual ou no anterior
      if (pagos < 4) {
        // índice 0-based da próxima parcela
        const nextIndex = offsetShift + pagos;
        const dueMonth  = vendMonth + nextIndex;
        const dueYear   = year + Math.floor(dueMonth / 12);
        const normMonth = ((dueMonth % 12) + 12) % 12;

        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear  = month === 0 ? year - 1 : year;

        if (
          dueYear === year &&
          (normMonth === month ||
           (normMonth === prevMonth && dueYear === prevYear))
        ) {
          listMonth.push(item);
        }
      }
    });

    setPendentes(listMonth);
    setPendingValueTotal(totalValue);
  }

  async function handleConfirm(id, currentPg) {
    const nextPg = Math.min(4, parseInt(currentPg, 10) + 1);
    try {
      await fetch(`${API}/consorcio/${id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ dia_pg: String(nextPg), owner_email: email }),
      });
      fetchAll();
    } catch (err) {
      console.error('Erro ao confirmar pgto:', err);
    }
  }

  function handleEdit(row) {
    setEditingId(row.id);
    setEditData({ ...row });
  }

  function handleChange(e) {
    setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(id) {
    try {
      await fetch(`${API}/consorcio/${id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      setEditingId(null);
      fetchAll();
    } catch (err) {
      console.error('Erro ao salvar edição:', err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este consórcio?')) return;
    try {
      await fetch(`${API}/consorcio/${id}`, { method: 'DELETE', headers });
      fetchAll();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  }

  function handleNew() {
    setIsCreating(true);
    setNewData({ proposta: '', dt_venda: '', tipo: 'imovel', valor: '', dia_pg: '1' });
  }

  function handleNewChange(e) {
    setNewData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleNewSave() {
    try {
      await fetch(`${API}/consorcio`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newData, owner_email: email }),
      });
      setIsCreating(false);
      fetchAll();
    } catch (err) {
      console.error('Erro ao criar novo consórcio:', err);
    }
  }

  function handleNewCancel() {
    setIsCreating(false);
  }

  function renderRow(row) {
    if (editingId === row.id) {
      return (
        <tr key={row.id}>
          <td><input name="proposta" value={editData.proposta} onChange={handleChange} /></td>
          <td><input name="dt_venda" type="date" value={editData.dt_venda} onChange={handleChange} /></td>
          <td>
            <select name="tipo" value={editData.tipo} onChange={handleChange}>
              <option value="imovel">imovel</option>
              <option value="veiculo">veiculo</option>
              <option value="pesado">pesado</option>
            </select>
          </td>
          <td><input name="valor" value={editData.valor} onChange={handleChange} /></td>
          <td>
            <input
              name="dia_pg"
              type="number"
              min="1"
              max="4"
              value={editData.dia_pg}
              onChange={handleChange}
            />
          </td>
          <td className="acao-consorcio">
            <button onClick={() => handleSave(row.id)}>💾</button>
            <button onClick={() => setEditingId(null)}>✖️</button>
          </td>
        </tr>
      );
    }

    return (
      <tr key={row.id}>
        <td>{row.proposta}</td>
        <td>{row.dt_venda}</td>
        <td>{row.tipo}</td>
        <td>{row.valor}</td>
        <td>{row.dia_pg}</td>
        <td className="acao-consorcio">
          {row.dia_pg < 4 && (
            <button onClick={() => handleConfirm(row.id, row.dia_pg)} className="btn-confirm">
              ✔️
            </button>
          )}
          <button onClick={() => handleEdit(row)}>✏️</button>
          <button onClick={() => handleDelete(row.id)}>🗑️</button>
        </td>
      </tr>
    );
  }

  return (
    <div className="consorcio-container">
      <div className="consorcio-header">
        <button onClick={() => window.history.back()} className="btn-back">
          ← Voltar
        </button>
        <h2>Consórcio</h2>
        <button onClick={handleNew} className="btn-new">Novo</button>
      </div>

      <div className="stats">
        <div className="stat-box">
          <h4>Valores já pagos (semestre)</h4>
          <p>{formatCurrency(paidTotal)}</p>
        </div>
        <div className="stat-box">
          <h4>Valor pendente (semestre)</h4>
          <p>{formatCurrency(pendingValueTotal)}</p>
        </div>
      </div>

      {isCreating && (
        <div className="section">
          <h3>Novo Consórcio</h3>
          <table className="tabela-consorcio">
            <thead>
              <tr>
                <th>Proposta</th><th>Dt. venda</th><th>Tipo</th>
                <th>Valor</th><th>Pg pagos</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input name="proposta" value={newData.proposta} onChange={handleNewChange} /></td>
                <td><input name="dt_venda" type="date" value={newData.dt_venda} onChange={handleNewChange} /></td>
                <td>
                  <select name="tipo" value={newData.tipo} onChange={handleNewChange}>
                    <option value="imovel">imovel</option>
                    <option value="veiculo">veiculo</option>
                    <option value="pesado">pesado</option>
                  </select>
                </td>
                <td><input name="valor" value={newData.valor} onChange={handleNewChange} /></td>
                <td>
                  <input
                    name="dia_pg"
                    type="number"
                    min="1"
                    max="4"
                    value={newData.dia_pg}
                    onChange={handleNewChange}
                  />
                </td>
                <td className="acao-consorcio">
                  <button onClick={handleNewSave}>💾</button>
                  <button onClick={handleNewCancel}>✖️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="section">
        <h3>Pendentes este mês</h3>
        <table className="tabela-consorcio">
          <thead>
            <tr>
              <th>Proposta</th><th>Dt. venda</th><th>Tipo</th>
              <th>Valor</th><th>Pg pagos</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>{pendentes.map(renderRow)}</tbody>
        </table>
      </div>

      <div className="section">
        <h3>Todos os consórcios</h3>
        <table className="tabela-consorcio">
          <thead>
            <tr>
              <th>Proposta</th><th>Dt. venda</th><th>Tipo</th>
              <th>Valor</th><th>Pg pagos</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>{list.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
}
