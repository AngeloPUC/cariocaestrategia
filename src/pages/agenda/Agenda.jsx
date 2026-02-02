import React, { useEffect, useState } from 'react'
import './Agenda.css'

const API_URL = 'https://api-estrategia.vercel.app'

export default function Agenda() {
  const [events, setEvents] = useState([]) // todos os eventos vindos da API
  const [selected, setSelected] = useState(null) // evento selecionado (detalhe)
  const [editing, setEditing] = useState(null) // evento em edição
  const [creating, setCreating] = useState(false) // modo criar
  const [form, setForm] = useState({ // form controlado
    titulo: '',
    data: '',
    hora: '',
    obs: ''
  })

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line
  }, [token])

  // --- Fetch list (usa rota com barra final para evitar redirect) ---
  async function fetchList() {
    try {
      const res = await fetch(`${API_URL}/agenda/`, { headers })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      if (!Array.isArray(data)) {
        setEvents([])
        return
      }
      // normalizar: garantir data/hora em campos previsíveis (data_iso, hora)
      const normalized = data.map(e => ({
        ...e,
        data_iso: e.data || null,
        hora: e.hora || ''
      }))
      // ordenar por data + hora
      normalized.sort((a, b) => {
        const ta = (a.data_iso || '') + ' ' + (a.hora || '')
        const tb = (b.data_iso || '') + ' ' + (b.hora || '')
        return ta.localeCompare(tb)
      })
      setEvents(normalized)
    } catch (err) {
      console.error('Erro fetchList agenda:', err)
      setEvents([])
    }
  }

  // --- CRUD básico (rotas com barra final) ---
  const handleConsult = async id => {
    try {
      const res = await fetch(`${API_URL}/agenda/${id}/`, { headers })
      const data = await res.json()
      setSelected(data)
      setCreating(false)
      setEditing(null)
    } catch (err) {
      console.error('Erro consultar agenda:', err)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Confirma exclusão deste agendamento?')) return
    try {
      const res = await fetch(`${API_URL}/agenda/${id}/`, { method: 'DELETE', headers })
      if (!res.ok) {
        const txt = await res.text()
        console.error('Erro delete:', res.status, txt)
        alert('Erro ao excluir. Veja console.')
        return
      }
      setEvents(prev => prev.filter(e => e.id !== id))
      setSelected(null)
      setEditing(null)
    } catch (err) {
      console.error('Erro excluir agenda:', err)
      alert('Erro ao excluir. Veja console.')
    }
  }

  const handleEditClick = ev => {
    setEditing(ev)
    setCreating(false)
    setSelected(null)
    setForm({
      titulo: ev.titulo || '',
      data: ev.data || ev.data_iso || '',
      hora: ev.hora || '',
      obs: ev.obs || ''
    })
  }

  const handleNewClick = () => {
    setCreating(true)
    setEditing(null)
    setSelected(null)
    setForm({ titulo: '', data: '', hora: '', obs: '' })
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleFormSubmit = async () => {
    if (!form.titulo) {
      alert('Preencha o título.')
      return
    }
    const payload = { titulo: form.titulo, obs: form.obs || '' }
    if (form.data) payload.data = form.data
    if (form.hora) payload.hora = form.hora

    try {
      let res
      if (creating) {
        res = await fetch(`${API_URL}/agenda/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })
      } else if (editing) {
        res = await fetch(`${API_URL}/agenda/${editing.id}/`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        })
      } else return

      const ct = res.headers.get('content-type') || ''
      const body = ct.includes('application/json') ? await res.json() : await res.text()
      if (!res.ok) {
        console.error('Erro salvar agenda:', res.status, body)
        alert('Erro: ' + (body && body.detail ? body.detail : JSON.stringify(body)))
        return
      }
      await fetchList()
      setCreating(false)
      setEditing(null)
      setSelected(body)
    } catch (err) {
      console.error('Exceção salvar agenda:', err)
      alert('Erro de rede ou CORS. Veja console.')
    }
  }

  // --- Helpers de data e agrupamento ---
  const startOfWeek = (() => {
    const today = new Date()
    const day = today.getDay()
    const diff = (day === 0 ? -6 : 1 - day) // monday as start
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  })()

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })

  // Horários de 09:00 às 18:00 em passos de 30min (exibir apenas 9-18)
  const times = []
  for (let h = 9; h <= 18; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`)
    if (h !== 18) times.push(`${String(h).padStart(2, '0')}:30`)
  }

  // Mapear eventos por chave "YYYY-MM-DD HH:MM"
  const eventsBySlot = {}
  events.forEach(ev => {
    if (!ev.data_iso) return
    const key = `${ev.data_iso} ${ev.hora || ''}`.trim()
    eventsBySlot[key] = eventsBySlot[key] || []
    eventsBySlot[key].push(ev)
  })

  // Próximos Eventos: relação por dia/hora (aparecem abaixo)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)

  const beyondWeek = events.filter(e => {
    if (!e.data_iso) return false
    const d = new Date(`${e.data_iso}T${(e.hora || '00:00')}:00`)
    return d > endOfWeek
  })

  // Eventos em sábado/domingo: aparecerão como observação no topo
  const weekend = events.filter(e => {
    if (!e.data_iso) return false
    const d = new Date(e.data_iso)
    const wd = d.getDay()
    return wd === 0 || wd === 6
  })

  // ------- Agendas vencidas (antes de hoje) -------
  const todayStart = (() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  })()

  const overdue = events.filter(e => {
    if (!e.data_iso) return false
    // consideramos vencidas as com data anterior ao início de hoje
    const d = new Date(e.data_iso)
    d.setHours(0, 0, 0, 0)
    return d < todayStart
  })

  const renderSelectedDateTime = sel => {
    if (!sel) return '—'
    if (sel.data && sel.hora) {
      try {
        const dt = new Date(`${sel.data}T${sel.hora}:00`)
        return dt.toLocaleString()
      } catch {
        return `${sel.data} ${sel.hora}`
      }
    }
    if (sel.data) return sel.data
    return '—'
  }

  // --- Render ---
  return (
    <div className="agenda-container">
      <div className="agenda-header">
        <div className="linha-topo">
          <button className="btn-voltar" onClick={() => window.history.back()}>← Voltar</button>
          <h2>Agenda</h2>
        </div>

        <div className="linha-novo">
          <button className="btn-novo" onClick={handleNewClick}>➕ Incluir</button>
        </div>
      </div>

      {/* Observações: eventos em Sáb/Dom */}
      {weekend.length > 0 && (
        <div className="agenda-weekend-note">
          <strong>Agendas para Sábado, Domingo e prox. Segunda:</strong>
          <ul>
            {weekend.map(ev => (
              <li key={ev.id}>
                {ev.data_iso} {ev.hora ? ev.hora + ' • ' : ''}{ev.titulo}
                <button className="btn-consultar small" onClick={() => handleConsult(ev.id)}>🔍</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form de criação/edição/detalhe */}
      {(creating || editing || selected) && (
        <div className="agenda-topbox">
          {!creating && selected && !editing && (
            <div className="detalhes-agenda">
              <button className="btn-voltar" onClick={() => setSelected(null)}>← Fechar</button>
              <h4>{selected.titulo}</h4>
              <p><strong>Data/Hora:</strong> {renderSelectedDateTime(selected)}</p>
              <p><strong>Obs:</strong> {selected.obs || '—'}</p>
              <div className="detalhe-actions">
                <button className="btn-editar" onClick={() => handleEditClick(selected)}>✏️ Alterar</button>
                <button className="btn-excluir" onClick={() => handleDelete(selected.id)}>🗑️ Excluir</button>
              </div>
            </div>
          )}

          {(creating || editing) && (
            <div className="form-agenda">
              <h4>{creating ? '➕ Nova Agenda' : '✏️ Editar Agenda'}</h4>
              <label>
                Título:
                <input name="titulo" value={form.titulo} onChange={handleChange} />
              </label>
              <label>
                Data:
                <input type="date" name="data" value={form.data} onChange={handleChange} />
              </label>
              <label>
                Hora:
                <input type="time" name="hora" value={form.hora} onChange={handleChange} />
              </label>
              <label>
                Observações:
                <textarea name="obs" value={form.obs} onChange={handleChange} />
              </label>
              <div className="form-actions">
                <button onClick={handleFormSubmit}>Salvar</button>
                <button className="btn-voltar" onClick={() => { setCreating(false); setEditing(null); setSelected(null) }}>← Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grade tipo Outlook: colunas de segunda a sexta entre 09:00 e 18:00 */}
      <div className="agenda-grid-wrapper">
        <div className="agenda-grid">
          <div className="agenda-grid-header">
            <div className="time-col header">Horário</div>
            {days.map((d, i) => {
              const wd = d.getDay()
              // pular Sáb (6) e Dom (0) visualmente na grade principal
              if (wd === 0 || wd === 6) return null
              const label = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'][(d.getDay() + 6) % 7]
              return (
                <div key={i} className="day-col header">
                  <div className="day-title">{label} {String(d.getDate()).padStart(2, '0')}/{String(d.getMonth()+1).padStart(2, '0')}</div>
                </div>
              )
            })}
          </div>

          <div className="agenda-grid-body">
            {times.map((t, ti) => (
              <div key={ti} className="agenda-row">
                <div className="time-col">{t}</div>
                {days.map((d, di) => {
                  const wd = d.getDay()
                  if (wd === 0 || wd === 6) return null
                  const dateKey = d.toISOString().slice(0,10)
                  const slotKey = `${dateKey} ${t}`
                  const cellEvents = eventsBySlot[slotKey] || []
                  return (
                    <div key={di} className="day-cell">
                      {cellEvents.map(ev => (
                        <div key={ev.id} className="agenda-event" onClick={() => handleConsult(ev.id)}>
                          <div className="ev-title">{ev.titulo}</div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Próximos agendamentos após a semana, listagem por dia/hora */}
      <section className="agenda-upcoming">
        <h3>Próximos Eventos ({beyondWeek.length})</h3>
        {beyondWeek.length === 0 ? (
          <p className="vazio">Nenhum agendamento além desta semana</p>
        ) : (
          <table className="tabela-upcoming">
            <thead>
              <tr>
                <th>Data</th>
                <th>Hora</th>
                <th>Título</th>
                <th>Obs</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {beyondWeek.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.data_iso || '—'}</td>
                  <td>{ev.hora || '—'}</td>
                  <td>{ev.titulo}</td>
                  <td>{ev.obs || '—'}</td>
                  <td className="acoes-tabela">
                    <button className="btn-consultar" onClick={() => handleConsult(ev.id)}>🔍</button>
                    <button className="btn-editar" onClick={() => handleEditClick(ev)}>✏️</button>
                    <button className="btn-excluir" onClick={() => handleDelete(ev.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* NOVO: Agendas vencidas (antes de hoje) - aparece após "Próximos Eventos" */}
      <section className="agenda-overdue">
        <h3>Vencidas ({overdue.length})</h3>
        {overdue.length === 0 ? (
          <p className="vazio">Nenhuma agenda vencida</p>
        ) : (
          <table className="tabela-overdue">
            <thead>
              <tr>
                <th>Data</th>
                <th>Hora</th>
                <th>Título</th>
                <th>Obs</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.data_iso || '—'}</td>
                  <td>{ev.hora || '—'}</td>
                  <td>{ev.titulo}</td>
                  <td>{ev.obs || '—'}</td>
                  <td className="acoes-tabela">
                    <button className="btn-consultar" onClick={() => handleConsult(ev.id)}>🔍</button>
                    <button className="btn-editar" onClick={() => handleEditClick(ev)}>✏️</button>
                    <button className="btn-excluir" onClick={() => handleDelete(ev.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
