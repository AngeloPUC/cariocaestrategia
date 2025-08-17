// src/components/WidgetT.jsx
import React, { useEffect, useState } from 'react';
import './Widget.css';

const API_URL = 'https://api-estrategia.vercel.app';

const WidgetT = () => {
  const [vencidas, setVencidas] = useState(0);
  const [semana, setSemana]     = useState(0);
  const [demais, setDemais]     = useState(0);
  const [erro, setErro]         = useState('');
  const token                    = localStorage.getItem('token');

  useEffect(() => {
    const fetchTarefas = async () => {
      try {
        const res = await fetch(`${API_URL}/tarefas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data     = await res.json();
        const hojeStr  = new Date().toISOString().split('T')[0];
        const limite   = new Date();
              limite.setDate(limite.getDate() + 7);
        const semanaStr = limite.toISOString().split('T')[0];

        // conta quantidades
        const qtdVencidas = data.filter(t => t.dt_venc < hojeStr).length;
        const qtdSemana   = data.filter(t => t.dt_venc >= hojeStr && t.dt_venc <= semanaStr).length;
        const qtdDemais   = data.filter(t => t.dt_venc > semanaStr).length;

        setVencidas(qtdVencidas);
        setSemana(qtdSemana);
        setDemais(qtdDemais);
      } catch (e) {
        console.error('WidgetT erro:', e);
        setErro('Falha ao carregar tarefas.');
      }
    };

    fetchTarefas();
  }, [token]);

  return (
    <div className="widget">
      <h3>Tarefas</h3>
      {erro
        ? <p className="error">{erro}</p>
        : <>
            <p><strong>Vencidas:</strong> {vencidas}</p>
            <p><strong>Da Semana:</strong> {semana}</p>
            <p><strong>Demais:</strong> {demais}</p>
          </>
      }
    </div>
  );
};

export default WidgetT;
