// src/components/WidgetF.jsx
import React, { useEffect, useState } from 'react';
import './Widget.css';

const API_URL = 'https://api-estrategia.vercel.app';

const WidgetF = () => {
  const [stats, setStats] = useState({
    media: 'N/A',
    total: 0,
    aprovados: 0,
    reprovados: 0
  });
  const [erro, setErro] = useState('');
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('usuario');

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await fetch(`${API_URL}/feedback`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();

        // filtra só feedbacks da sua equipe (mesmo owner_email)
        const teamFB = data.filter(f => f.owner_email === email);

        // extrai somente as notas válidas
        const notas = teamFB
          .map(f => Number(f.resultado))
          .filter(v => !isNaN(v));

        const total = teamFB.length;
        const soma = notas.reduce((acc, v) => acc + v, 0);
        const media = notas.length > 0
          ? (soma / notas.length).toFixed(2)
          : 'N/A';

        const aprovados  = notas.filter(v => v >= 7).length;
        const reprovados = notas.filter(v => v < 7).length;

        setStats({ media, total, aprovados, reprovados });
      } catch (e) {
        console.error('WidgetF erro:', e);
        setErro('Não foi possível carregar feedbacks.');
      }
    };

    fetchFeedbacks();
  }, [token, email]);

  return (
    <div className="widget">
      <h3>Feedbacks</h3>
      {erro
        ? <p className="error">{erro}</p>
        : (
          <>
            <p><strong>Média da equipe:</strong> {stats.media}</p>
            <p><strong>Total registrados:</strong> {stats.total}</p>
            <p><strong>Nota ≥ 7:</strong> {stats.aprovados}</p>
            <p><strong>Nota &lt; 7:</strong> {stats.reprovados}</p>
          </>
        )
      }
    </div>
  );
};

export default WidgetF;
