// src/pages/consorcio/Consorcio.jsx
import React, { useEffect, useState } from 'react';
import './Consorcio.css';

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

const API = 'https://api-estrategia.vercel.app';

export default function ConsorcioPage() {
  const [list, setList] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [vencidos, setVencidos] = useState([]);
  const [paidTotal, setPaidTotal] = useState(0);
  const [pendingValueTotal, setPendingValueTotal] = useState(0);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const [newData, setNewData] = useState({
    proposta: '',
    dt_venda: '',
    tipo: '', // usado como Prox. vencimento (DD/MM)
    valor: '',
    pagos: 0,
    pagos_semestre: 0
  });

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('usuario') || '';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
  }, []);

  function splitDiaPg(dia_pg) {
    if (!dia_pg || typeof dia_pg !== "string") return [0, 0];
    const parts = dia_pg.split("-");
    const pagos = parseInt(parts[0], 10) || 0;
    const pagosSemestre = parseInt(parts[1], 10) || 0;
    return [pagos, pagosSemestre];
  }

  function calcPaidTotal(items) {
    const sum = items.reduce((acc, item) => {
      const valorNum = parseFloat(item.valor) || 0;
      const [, pagosSemestre] = splitDiaPg(item.dia_pg);
      return acc + (valorNum * pagosSemestre);
    }, 0);
    setPaidTotal(sum);
  }

  // ✅ Ajuste 1: cálculo correto do pendente (semestre)
  function calcPendentes(items) {
    const sum = items.reduce((acc, item) => {
      const valorNum = parseFloat(item.valor) || 0;
      const [pagos] = splitDiaPg(item.dia_pg);
      const faltantes = Math.max(0, 4 - pagos);
      return acc + (valorNum * faltantes);
    }, 0);
    setPendingValueTotal(sum);
  }

  function getMonthFromTipo(tipo) {
    if (!tipo) return null;
    const parts = tipo.split("/");
    if (parts.length < 2) return null;
    return parseInt(parts[1], 10) || null;
  }

  async function fetchAll() {
    try {
      const res = await fetch(`${API}/consorcio`, { headers });
      const data = await res.json();
      const mine = Array.isArray(data)
        ? data.filter(item => item.owner_email === email)
        : [];

      setList(mine);
      calcPaidTotal(mine);
      calcPendentes(mine);

      const currentMonth = new Date().getMonth() + 1;

      const pendentesMes = mine.filter(item => {
        const mes = getMonthFromTipo(item.tipo);
        return mes === currentMonth;
      });

      // ✅ Ajuste 3: lógica vencidos (dezembro antes de jan/fev)
      const vencidosList = mine.filter(item => {
        const mes = getMonthFromTipo(item.tipo);
        if (mes === null) return false;
        if (mes < currentMonth) return true;
        if (mes === 12 && currentMonth <= 2) return true;
        return false;
      });

      setPendentes(pendentesMes);
      setVencidos(vencidosList);
    } catch (err) {
      console.error('Erro ao buscar Consórcio:', err);
    }
  }

  // ✅ Ajuste 2 e 4: botão ✔️ incrementa Pg, Pg semestre e próximo vencimento
  async function handleConfirm(id, currentDiaPg, tipo) {
    const [pagos, pagosSemestre] = splitDiaPg(currentDiaPg);
    const nextPagos = Math.min(4, pagos + 1);
    const nextSemestre = pagos < 4 ? pagosSemestre + 1 : pagosSemestre;

    // incrementar mês do próximo vencimento
    let proxParts = tipo.split("/");
    let dia = proxParts[0];
    let mes = parseInt(proxParts[1], 10);
    mes = mes === 12 ? 1 : mes + 1;
    const newTipo = `${dia}/${mes.toString().padStart(2, "0")}`;

    const newDiaPg = `${nextPagos}-${nextSemestre}`;
    await fetch(`${API}/consorcio/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dia_pg: newDiaPg, tipo: newTipo, owner_email: email }),
    });
    fetchAll();
  }

  function handleEdit(row) {
    const [pagos, pagosSemestre] = splitDiaPg(row.dia_pg);
    setEditingId(row.id);
    setEditData({ ...row, pagos, pagos_semestre: pagosSemestre });
  }

  function handleChange(e) {
    setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(id) {
    const pagos = parseInt(editData.pagos, 10) || 0;
    const sem = parseInt(editData.pagos_semestre, 10) || 0;
    const dia_pg = `${pagos}-${sem}`;
    await fetch(`${API}/consorcio/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editData, dia_pg }),
    });
    setEditingId(null);
    fetchAll();
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este consórcio?')) return;
    await fetch(`${API}/consorcio/${id}`, { method: 'DELETE', headers });
    fetchAll();
  }

  function handleNew() {
    setIsCreating(true);
    setNewData({ proposta: '', dt_venda: '', tipo: '', valor: '', pagos: 0, pagos_semestre: 0 });
  }

  function handleNewChange(e) {
    setNewData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleNewSave() {
    const pagos = parseInt(newData.pagos, 10) || 0;
    const sem = parseInt(newData.pagos_semestre, 10) || 0;
    const dia_pg = `${pagos}-${sem}`;
    await fetch(`${API}/consorcio`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newData, dia_pg, owner_email: email }),
    });
    setIsCreating(false);
    fetchAll();
  }

  function handleNewCancel() {
    setIsCreating(false);
  }

  function renderRow(row) {
    const valorFormatado = formatCurrency(Number(row.valor) || 0);
    const proxVenc = row.tipo || "";
    const pagosLabel = row.dia_pg || "0-0";
    const [pagos] = splitDiaPg(row.dia_pg);

    if (editingId === row.id) {
      return (
        <tr key={row.id}>
          <td><input name="proposta" value={editData.proposta} onChange={handleChange} /></td>
          <td><input name="dt_venda" type="date" value={editData.dt_venda} onChange={handleChange} /></td>
          <td><input name="tipo" value={editData.tipo} onChange={handleChange} placeholder="DD/MM" /></td>
          <td><input name="valor" value={editData.valor} onChange={handleChange} /></td>
          <td>
            <input name="pagos" type="number" value={editData.pagos} onChange={handleChange} /> -
            <input name="pagos_semestre" type="number" value={editData.pagos_semestre} onChange={handleChange} />
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
        <td>{proxVenc}</td>
        <td>{valorFormatado}</td>
        <td>{pagosLabel}</td>
        <td className="acao-consorcio">
          {pagos < 4 && (
            <button onClick={() => handleConfirm(row.id, row.dia_pg, row.tipo)} className="btn-confirm">✔️</button>
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
        <button onClick={() => window.history.back()} className="btn-back">← Voltar</button>
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
                <th>Proposta</th>
                <th>Dt. venda</th>
                <th>Prox. vencimento (DD/MM)</th>
                <th>Valor</th>
                <th>Pg - Pg semestre</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input name="proposta" value={newData.proposta} onChange={handleNewChange} />
                </td>
                <td>
                  <input name="dt_venda" type="date" value={newData.dt_venda} onChange={handleNewChange} />
                </td>
                <td>
                  <input name="tipo" value={newData.tipo} onChange={handleNewChange} placeholder="DD/MM" />
                </td>
                <td>
                  <input name="valor" value={newData.valor} onChange={handleNewChange} />
                </td>
                <td>
                  <input name="pagos" type="number" value={newData.pagos} onChange={handleNewChange} /> -
                  <input name="pagos_semestre" type="number" value={newData.pagos_semestre} onChange={handleNewChange} />
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

      {/* Ordem ajustada: primeiro Vencidos */}
      <div className="section">
        <h3>Vencidos</h3>
        <table className="tabela-consorcio">
          <thead>
            <tr>
              <th>Proposta</th>
              <th>Dt. venda</th>
              <th>Prox. vencimento (DD/MM)</th>
              <th>Valor</th>
              <th>Pg - Pg semestre</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>{vencidos.map(renderRow)}</tbody>
        </table>
      </div>

      <div className="section">
        <h3>Pendentes este mês</h3>
        <table className="tabela-consorcio">
          <thead>
            <tr>
              <th>Proposta</th>
              <th>Dt. venda</th>
              <th>Prox. vencimento (DD/MM)</th>
              <th>Valor</th>
              <th>Pg - Pg semestre</th>
              <th>Ações</th>
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
              <th>Proposta</th>
              <th>Dt. venda</th>
              <th>Prox. vencimento (DD/MM)</th>
              <th>Valor</th>
              <th>Pg - Pg semestre</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>{list.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
}