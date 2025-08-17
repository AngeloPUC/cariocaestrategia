// src/components/WidgetCON.jsx
import React, { useEffect, useState } from 'react';
import './Widget.css';

const API_URL = 'https://api-estrategia.vercel.app';

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function calcPaidTotal(items) {
  const today    = new Date();
  const month    = today.getMonth();
  const semStart = month <= 5 ? 0 : 6;
  const semEnd   = month <= 5 ? 5 : 11;

  return items.reduce((acc, item) => {
    const parcelaValor = Number(item.valor) || 0;
    const pagos        = parseInt(item.dia_pg, 10) || 0;
    const vendMonth    = new Date(item.dt_venda).getMonth();

    let count = 0;
    // parcelas pagas: 1 até 'pagos'
    for (let parcela = 1; parcela <= pagos; parcela++) {
      const instMonth = vendMonth + (parcela - 1);
      if (instMonth >= semStart && instMonth <= semEnd) {
        count++;
      }
    }
    return acc + parcelaValor * count;
  }, 0);
}

function calcPendingValueTotal(items) {
  const today    = new Date();
  const month    = today.getMonth();
  const year     = today.getFullYear();
  const semStart = month <= 5 ? 0 : 6;
  const semEnd   = month <= 5 ? 5 : 11;

  let total = 0;

  items.forEach(item => {
    const parcelaValor = Number(item.valor) || 0;
    const pagos        = parseInt(item.dia_pg, 10) || 0;
    const vendDate     = new Date(item.dt_venda);
    const vendMonth    = vendDate.getMonth();
    const vendDay      = vendDate.getDate();
    const dueDay       = item.tipo === 'imovel' ? 15 : 10;

    // se a venda foi após o dia de vencimento, desloca todas as parcelas em 1 mês
    const offsetShift = vendDay > dueDay ? 1 : 0;

    // soma parcelas não pagas (pagos+1 até 4) dentro do semestre
    for (let parcela = pagos + 1; parcela <= 4; parcela++) {
      const instMonth = vendMonth + offsetShift + (parcela - 1);
      if (instMonth >= semStart && instMonth <= semEnd) {
        total += parcelaValor;
      }
    }
  });

  return total;
}

const WidgetCON = () => {
  const [paidTotal, setPaidTotal]         = useState(0);
  const [pendingValue, setPendingValue]   = useState(0);
  const [erro, setErro]                   = useState('');
  const token                              = localStorage.getItem('token');
  const email                              = localStorage.getItem('usuario') || '';

  useEffect(() => {
    async function fetchConsorcios() {
      try {
        const res = await fetch(`${API_URL}/consorcio`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();

        // filtra apenas seus consórcios
        const mine = Array.isArray(data)
          ? data.filter(c => c.owner_email === email)
          : [];

        const paid   = calcPaidTotal(mine);
        const pend   = calcPendingValueTotal(mine);

        setPaidTotal(paid);
        setPendingValue(pend);
      } catch (e) {
        console.error('WidgetCON erro:', e);
        setErro('Falha ao carregar consórcios.');
      }
    }

    fetchConsorcios();
  }, [token, email]);

  return (
    <div className="widget">
      <h3>Consórcios</h3>

      {erro ? (
        <p className="error">{erro}</p>
      ) : (
        <>
          <p>
            <strong>Pagos:</strong>{' '}
            {formatCurrency(paidTotal)}
          </p>
          <p>
            <strong>Pendentes:</strong>{' '}
            {formatCurrency(pendingValue)}
          </p>
        </>
      )}
    </div>
  );
};

export default WidgetCON;
