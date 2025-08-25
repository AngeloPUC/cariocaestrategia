// src/components/WidgetN2.jsx
import React, { useEffect, useState } from 'react';
import './Widget.css';

const API_URL = 'https://api-estrategia.vercel.app';

export default function WidgetN2() {
  const [aniversariantes, setAniversariantes] = useState([]);
  const [erro, setErro]                       = useState('');
  const token                                  = localStorage.getItem('token');

  useEffect(() => {
    async function fetchAniversariantes() {
      if (!token) {
        setErro('Usuário não autenticado');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/equipe`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Equipe(${res.status})`);
        const equipe = await res.json();

        const hoje    = new Date();
        const mesAlvo = hoje.getMonth() + 1;

        // filtra quem faz aniversário no mês atual
        const lista = equipe
          .filter(u => {
            if (!u.dt_niver) return false;
            const [year, month, day] = u.dt_niver.split('-').map(Number);
            return month === mesAlvo;
          })
          .map(u => {
            const [year, month, day] = u.dt_niver.split('-').map(Number);
            const dt    = new Date(year, month - 1, day);
            const nome  = u.nome || '—';
            const func  = u.funcao || u.role || '—';
            return {
              nome,
              funcao: func,
              dia: dt.getDate(),
              mes: dt.getMonth() + 1
            };
          });

        // ordena por data (mês e dia)
        lista.sort((a, b) => {
          if (a.mes !== b.mes) return a.mes - b.mes;
          return a.dia - b.dia;
        });

        setAniversariantes(lista);
      } catch (e) {
        console.error('WidgetN2 erro:', e);
        setErro('Não foi possível carregar aniversariantes.');
      }
    }
    fetchAniversariantes();
  }, [token]);

  return (
    <div className="widget-container">
      <h3>Aniversariantes do Mês</h3>
      {erro && <p className="error">{erro}</p>}

      <div
        className="widget-blocos"
        // largura mínima reduzida de 240px para 200px para quadros menores
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        {aniversariantes.length > 0
          ? aniversariantes.map((u, idx) => (
              <div
                className="bloco"
                key={idx}
                // reduz levemente altura e padding
                style={{ padding: '0.75rem', minHeight: '120px' }}
              >
                <h4>{u.nome}</h4>
                <p>{u.funcao}</p>
                <p>
                  {String(u.dia).padStart(2, '0')}/
                  {String(u.mes).padStart(2, '0')}
                </p>
              </div>
            ))
          : (
            <div className="bloco" style={{ gridColumn: '1/-1', padding: '0.75rem', minHeight: '120px' }}>
              — nenhum aniversariante este mês
            </div>
          )
        }
      </div>
    </div>
  );
}
