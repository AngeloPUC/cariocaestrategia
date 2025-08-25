// src/pages/dashboard/relatorios.jsx

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './relatorios.css';

const API_URL = 'https://api-estrategia.vercel.app';

export default function Relatorios() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // 1. Aniversariantes do mês em Excel
  const downloadBirthdaysXLS = async () => {
    setError('');
    setLoading(true);
    try {
      const res    = await fetch(`${API_URL}/equipe`, { headers });
      if (!res.ok) throw new Error(`Equipe(${res.status})`);
      const equipe = await res.json();

      const mesAlvo = new Date().getMonth() + 1;
      const aniversariantes = equipe.filter(u => {
        if (!u.dt_niver) return false;
        return new Date(u.dt_niver).getMonth() + 1 === mesAlvo;
      });

      const rows = aniversariantes.map(u => ({
        Nome: u.nome || '—',
        'Data de Nascimento': u.dt_niver || '—'
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Aniversariantes');
      XLSX.writeFile(wb, 'aniversariantes_mes.xlsx');

    } catch (e) {
      console.error(e);
      setError('Falha ao gerar Excel de aniversariantes');
    } finally {
      setLoading(false);
    }
  };

  // 2. Equipe + Ações em Excel
  const downloadTeamActionsXLS = async () => {
    setError('');
    setLoading(true);
    try {
      const [equipeRes, acoesRes] = await Promise.all([
        fetch(`${API_URL}/equipe`, { headers }),
        fetch(`${API_URL}/acoes`,  { headers })
      ]);
      if (!equipeRes.ok) throw new Error(`Equipe(${equipeRes.status})`);
      if (!acoesRes.ok)  throw new Error(`Ações(${acoesRes.status})`);

      const [equipe, acoes] = await Promise.all([
        equipeRes.json(),
        acoesRes.json()
      ]);

      const acoesPorId = acoes.reduce((acc, a) => {
        const id = a.quem_id;
        if (!acc[id]) acc[id] = [];
        acc[id].push(a.titulo || a.nome || a.descricao);
        return acc;
      }, {});

      const rows = equipe.map(u => ({
        Nome: u.nome || '—',
        Ações: (acoesPorId[u.id] || []).join(', ') || '—'
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Equipe_Ações');
      XLSX.writeFile(wb, 'equipe_acoes.xlsx');

    } catch (e) {
      console.error(e);
      setError('Falha ao gerar Excel de equipe/ações');
    } finally {
      setLoading(false);
    }
  };

  // 3. Consórcios em Excel (remove id, owner_email)
  const downloadConsorciosXLS = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/consorcio`, { headers });
      if (!res.ok) throw new Error(`Consórcio(${res.status})`);
      const data = await res.json();
      const arr  = Array.isArray(data) ? data : [];

      const rows = arr.map(({ id, owner_email, ...rest }) => rest);

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Consórcios');
      XLSX.writeFile(wb, 'consorcios.xlsx');

    } catch (e) {
      console.error(e);
      setError('Falha ao gerar Excel de consórcios');
    } finally {
      setLoading(false);
    }
  };

  // 4. Seguros em Excel (usa todos os TDVs, sem filtrar tipo)
  const downloadSegurosXLS = async () => {
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/tdv`, { headers });
      if (!res.ok) throw new Error(`TDV(${res.status})`);
      const data = await res.json();
      const arr  = Array.isArray(data) ? data : [];

      const rows = arr.map(({ id, owner_email, ...rest }) => rest);

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Seguros');
      XLSX.writeFile(wb, 'seguros.xlsx');

    } catch (e) {
      console.error(e);
      setError('Falha ao gerar Excel de seguros');
    } finally {
      setLoading(false);
    }
  };

  // 5. Tarefas em Excel (remove id, owner_email)
  const downloadTarefasXLS = async () => {
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/tarefas`, { headers });
      if (!res.ok) throw new Error(`Tarefas(${res.status})`);
      const data = await res.json();
      const arr  = Array.isArray(data) ? data : [];

      const rows = arr.map(({ id, owner_email, ...rest }) => rest);

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tarefas');
      XLSX.writeFile(wb, 'tarefas.xlsx');

    } catch (e) {
      console.error(e);
      setError('Falha ao gerar Excel de tarefas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relatorios-container">
      <header className="relatorios-header">
        <h1>Relatórios</h1>
      </header>

      {error   && <div className="error-box">{error}</div>}
      {loading && <div className="loading">Gerando relatório…</div>}

      <div className="buttons-group">
        <button onClick={downloadBirthdaysXLS}   disabled={loading}>
          🎂 Aniversariantes (Excel)
        </button>
        <button onClick={downloadTeamActionsXLS} disabled={loading}>
          👥 Equipe & Ações (Excel)
        </button>
        <button onClick={downloadConsorciosXLS}  disabled={loading}>
          💼 Consórcios (Excel)
        </button>
        <button onClick={downloadSegurosXLS}     disabled={loading}>
          🛡️ Seguros (Excel)
        </button>
        <button onClick={downloadTarefasXLS}     disabled={loading}>
          📋 Tarefas (Excel)
        </button>
      </div>
    </div>
  );
}
