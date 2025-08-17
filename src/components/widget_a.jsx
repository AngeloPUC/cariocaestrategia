// src/components/WidgetA.jsx
import React, { useEffect, useState } from 'react';
import './Widget.css';

const API_URL = 'https://api-estrategia.vercel.app';

const WidgetA = () => {
  const [vencidas, setVencidas]         = useState(0);
  const [vencendoHoje, setVencendoHoje] = useState(0);
  const [emDia, setEmDia]               = useState(0);
  const [erro, setErro]                 = useState('');
  const token                            = localStorage.getItem('token');

  useEffect(() => {
    const fetchAcoes = async () => {
      try {
        const res  = await fetch(`${API_URL}/acoes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();

        const hoje = new Date().toISOString().split('T')[0];

        // categorização usando dt_venc
        const arrVencidas     = data.filter(a => a.dt_venc < hoje);
        const arrVencendoHoje = data.filter(a => a.dt_venc === hoje);
        const arrEmDia        = data.filter(a => a.dt_venc > hoje);

        setVencidas(arrVencidas.length);
        setVencendoHoje(arrVencendoHoje.length);
        setEmDia(arrEmDia.length);
      } catch (e) {
        console.error('WidgetA erro:', e);
        setErro('Não foi possível carregar ações.');
      }
    };

    fetchAcoes();
  }, [token]);

  return (
    <div className="widget">
      <h3>Ações</h3>
      {erro
        ? <p className="error">{erro}</p>
        : (
          <>
            <p><strong>Vencidas:</strong> {vencidas}</p>
            <p><strong>Vencendo hoje:</strong> {vencendoHoje}</p>
            <p><strong>Em dia:</strong> {emDia}</p>
          </>
        )
      }
    </div>
  );
};

export default WidgetA;
