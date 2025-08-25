// src/components/WidgetA2.jsx
import React, { useEffect, useState } from 'react';
import './Widget.css';

const API_URL = 'https://api-estrategia.vercel.app';

export default function WidgetA2() {
  const [acoesHoje, setAcoesHoje]         = useState([]);
  const [acoesVencidas, setAcoesVencidas] = useState([]);
  const [erro, setErro]                   = useState('');
  const token                              = localStorage.getItem('token');

  useEffect(() => {
    async function fetchAcoesDetalhadas() {
      if (!token) {
        setErro('Usuário não autenticado');
        return;
      }

      try {
        const [resAcoes, resEquipe] = await Promise.all([
          fetch(`${API_URL}/acoes`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/equipe`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!resAcoes.ok)   throw new Error(`Ações(${resAcoes.status})`);
        if (!resEquipe.ok)  throw new Error(`Equipe(${resEquipe.status})`);

        const [acoes, equipe] = await Promise.all([
          resAcoes.json(),
          resEquipe.json()
        ]);

        const nameMap = {};
        equipe.forEach(u => {
          const id   = u.id || u.owner_id;
          const nome = u.nome || u.owner_name || u.owner_email;
          nameMap[id] = nome;
        });

        const hoje = new Date().toISOString().split('T')[0];
        const listas = { hoje: [], vencidas: [] };

        acoes.forEach(a => {
          if (!a.dt_venc) return;
          const registro = {
            funcionario: nameMap[a.quem_id] || '—',
            acao:        a.titulo || a.nome || a.descricao || '—'
          };
          if (a.dt_venc < hoje)        listas.vencidas.push(registro);
          else if (a.dt_venc === hoje) listas.hoje.push(registro);
        });

        // Ordena alfabeticamente por funcionário e depois por ação
        const ordenar = arr =>
          arr.sort((x, y) => {
            const cmpFn = x.funcionario.localeCompare(y.funcionario);
            return cmpFn !== 0
              ? cmpFn
              : x.acao.localeCompare(y.acao);
          });

        ordenar(listas.vencidas);
        ordenar(listas.hoje);

        setAcoesVencidas(listas.vencidas);
        setAcoesHoje(listas.hoje);
      } catch (e) {
        console.error('WidgetA2 erro:', e);
        setErro('Não foi possível carregar as ações detalhadas.');
      }
    }

    fetchAcoesDetalhadas();
  }, [token]);

  return (
    <div className="widget-container">
      <h3>Ações Detalhadas</h3>
      {erro && <p className="error">{erro}</p>}

      <div
        className="widget-blocos"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'start',
          justifyItems: 'stretch'
        }}
      >
        <div className="bloco" style={{ maxWidth: 'none', width: '100%' }}>
          <h4>Vencidas</h4>
          {acoesVencidas.length > 0
            ? acoesVencidas.map((item, idx) => (
                <p key={idx}>
                  <strong>{item.funcionario}</strong>: {item.acao}
                </p>
              ))
            : <p>— nenhuma ação vencida</p>
          }
        </div>

        <div className="bloco" style={{ maxWidth: 'none', width: '100%' }}>
          <h4>Hoje</h4>
          {acoesHoje.length > 0
            ? acoesHoje.map((item, idx) => (
                <p key={idx}>
                  <strong>{item.funcionario}</strong>: {item.acao}
                </p>
              ))
            : <p>— nenhuma ação hoje</p>
          }
        </div>
      </div>
    </div>
  );
}
