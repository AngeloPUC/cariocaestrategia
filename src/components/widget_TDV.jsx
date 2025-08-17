// src/components/WidgetTDV.jsx
import React, { useEffect, useState } from 'react';
import './Widget.css';

const API_URL = 'https://api-estrategia.vercel.app';

function parseProxVenc(text) {
  const parts = String(text).split('/');
  const day = parseInt(parts[0], 10) || 1;
  const month = parts.length > 1
    ? parseInt(parts[1], 10) - 1
    : new Date().getMonth();
  return { day, month };
}

function calcPointsThisMonth(list) {
  const today        = new Date();
  const currentMonth = today.getMonth();
  const prevMonth    = currentMonth === 0 ? 11 : currentMonth - 1;
  const year         = today.getFullYear();

  let total = 0;
  list.forEach(item => {
    const remaining = parseInt(item.n_meses, 10);
    if (remaining <= 0) return;

    const vendaDate = new Date(item.dt_venda);
    const { day: vencDay, month: vencMonth } = parseProxVenc(item.dia_venc);

    // só interessa se a próxima parcela vence neste mês ou no anterior
    if (vencMonth !== currentMonth && vencMonth !== prevMonth) return;

    const due = new Date(year, vencMonth, vencDay);
    if (due <= vendaDate) return;

    total += Number(item.pmt_pontos) || 0;
  });

  return total;
}

function calcPointsSemester(list) {
  const today        = new Date();
  const year         = today.getFullYear();
  const currentMonth = today.getMonth();
  const semEnd       = currentMonth <= 5 ? 5 : 11;

  let sum = 0;
  list.forEach(item => {
    const pontos    = Number(item.pmt_pontos) || 0;
    const remaining = parseInt(item.n_meses, 10);
    if (remaining <= 0) return;

    const vendaDate = new Date(item.dt_venda);
    const { day: vencDay, month: vencMonth } = parseProxVenc(item.dia_venc);

    // determinar meses de débito dentro do semestre
    const firstDueMonth = vencMonth;
    const lastDueMonth  = Math.min(vencMonth + remaining - 1, semEnd);

    for (let m = firstDueMonth; m <= lastDueMonth; m++) {
      const due = new Date(year, m, vencDay);
      if (due > vendaDate) {
        sum += pontos;
      }
    }
  });

  return sum;
}

const WidgetTDV = () => {
  const [pontosMes, setPontosMes]             = useState(0);
  const [pontosSemestre, setPontosSemestre]   = useState(0);
  const [erro, setErro]                       = useState('');
  const token                                  = localStorage.getItem('token');
  const email                                  = localStorage.getItem('usuario') || '';

  useEffect(() => {
    async function fetchTDV() {
      try {
        const res = await fetch(`${API_URL}/tdv`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();

        const mine = Array.isArray(data)
          ? data.filter(item => item.owner_email === email)
          : [];

        setPontosMes(calcPointsThisMonth(mine));
        setPontosSemestre(calcPointsSemester(mine));

      } catch (e) {
        console.error('WidgetTDV erro:', e);
        setErro('Falha ao carregar TDVs.');
      }
    }

    fetchTDV();
  }, [token, email]);

  return (
    <div className="widget">
      <h3>TDV</h3>
      {erro ? (
        <p className="error">{erro}</p>
      ) : (
        <>
          <p>
            <strong>Pts mes:</strong> {pontosMes}
          </p>
          <p>
            <strong>Pts semestre:</strong> {pontosSemestre}
          </p>
        </>
      )}
    </div>
  );
};

export default WidgetTDV;
