// src/components/WidgetN.jsx
import React, { useEffect, useState } from 'react';
import './Widget.css';

const API = 'https://api-estrategia.vercel.app';

export default function WidgetN() {
  const [counts, setCounts] = useState({ dia: 0, semana: 0, mes: 0 });
  const [erro, setErro]     = useState('');

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('usuario');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !email) {
      setErro('Usuário ou sessão inválidos');
      return;
    }

    const pad = n => String(n).padStart(2, '0');
    const toMD = date => `${pad(date.getMonth()+1)}-${pad(date.getDate())}`;

    // Normaliza qualquer data de fim de semana para sexta-feira
    const normalizeWeekend = date => {
      const d = new Date(date);
      const w = d.getDay();
      if (w === 6) d.setDate(d.getDate() - 1);  // sábado → sexta
      if (w === 0) d.setDate(d.getDate() - 2);  // domingo → sexta
      return d;
    };

    // gera um Set de MM-DD para os próximos 7 dias (sem normalizar)
    const buildWeekSet = today => {
      const s = new Set();
      for (let i = 0; i < 7; i++) {
        const dt = new Date(today);
        dt.setDate(today.getDate() + i);
        s.add(toMD(dt));
      }
      return s;
    };

    const fetchAniversariantes = async () => {
      try {
        const res    = await fetch(`${API}/equipe`, { headers });
        if (!res.ok) throw new Error(`Equipe(${res.status})`);
        const equipe = await res.json();

        // só quem é do seu time
        const meute = equipe.filter(u => u.owner_email === email);

        const hojeRaw   = new Date();
        // normalize para sexta se hoje for sábado/domingo
        const hojeNorm  = normalizeWeekend(hojeRaw);
        const keyHoje   = toMD(hojeNorm);

        const weekSet   = buildWeekSet(hojeNorm);
        const mesAtual  = hojeNorm.getMonth() + 1;
        const diaHoje   = hojeNorm.getDate();

        // normalizar cada aniversário p/ comparar MM-DD
        const anivers = meute.map(u => {
          const dt = normalizeWeekend(new Date(u.dt_niver));
          return toMD(dt);
        });

        const qtdDia    = anivers.filter(md => md === keyHoje).length;
        const qtdSemana = anivers.filter(md => weekSet.has(md)).length;
        const qtdMes    = meute
          .filter(u => {
            const [_, mStr, dStr] = u.dt_niver.split('-');
            const m = +mStr, d = +dStr;
            return m === mesAtual && d > diaHoje;
          })
          .length;

        setCounts({ dia: qtdDia, semana: qtdSemana, mes: qtdMes });
      } catch (e) {
        console.error('WidgetN erro →', e);
        setErro('Falha ao carregar aniversariantes.');
      }
    };

    fetchAniversariantes();
  }, [token, email]);

  return (
    <div className="widget">
      <h3>Aniversariantes</h3>
      {erro
        ? <p className="error">{erro}</p>
        : (
          <>
            <p><strong>Hoje:</strong> {counts.dia}</p>
            <p><strong>Semana:</strong> {counts.semana}</p>
            <p><strong>Mês:</strong> {counts.mes}</p>
          </>
        )
      }
    </div>
  );
}
