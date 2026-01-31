import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Square, Trash2, Edit, FileDown, Plus, 
  Monitor, Clock, AlertCircle, Zap, Sun, Moon, 
  CreditCard, CheckCircle2, History 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TARIF_PAR_HEURE = 500; // Ar

const App = () => {
  // --- ÉTATS (inchangés) ---
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('cyberSessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [inputs, setInputs] = useState({ card: '', motif: 'Payé', timeStr: '' });
  const [editingId, setEditingId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false); // Par défaut en mode clair (plus pro/classique)

  useEffect(() => {
    localStorage.setItem('cyberSessions', JSON.stringify(sessions));
  }, [sessions]);

  // --- LOGIQUE METIER (inchangée mais optimisée) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.status === 'Terminé' || session.paused) return session;

          const newElapsed = session.elapsed + 1;
          const isFinished = newElapsed >= session.durationTotal;

          if (isFinished && session.status !== 'Terminé') {
            triggerAudioAlert(session.card);
            return { ...session, elapsed: session.durationTotal, status: 'Terminé' };
          }

          return { ...session, elapsed: newElapsed };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerAudioAlert = (cardNum) => {
    if (!window.speechSynthesis) return;
    const msg = new SpeechSynthesisUtterance(`Le poste numéro ${cardNum} est terminé`);
    msg.lang = 'fr-FR';
    window.speechSynthesis.speak(msg);
  };

  const parseTime = (str) => {
    let totalSeconds = 0;
    const hours = str.match(/(\d+)h/);
    const minutes = str.match(/(\d+)m/);
    if (hours) totalSeconds += parseInt(hours[1]) * 3600;
    if (minutes) totalSeconds += parseInt(minutes[1]) * 60;
    if (!hours && !minutes && !isNaN(str) && str.trim() !== '') totalSeconds += parseInt(str) * 60;
    return totalSeconds > 0 ? totalSeconds : 3600; // Défaut 1h
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const calculateCost = (seconds) => Math.ceil((seconds / 3600) * TARIF_PAR_HEURE);

  const handleAddSession = (e) => {
    e.preventDefault();
    if (!inputs.card || !inputs.timeStr) return;
    const duration = parseTime(inputs.timeStr);
    
    const newSession = {
      id: Date.now(),
      card: inputs.card,
      debut: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      motif: inputs.motif,
      durationTotal: duration,
      elapsed: 0,
      paused: false,
      status: 'Actif',
      date: new Date().toLocaleDateString()
    };

    if (editingId) {
        setSessions(sessions.map(s => s.id === editingId ? { ...newSession, elapsed: s.elapsed, id: s.id, debut: s.debut } : s));
        setEditingId(null);
    } else {
        setSessions([...sessions, newSession]);
    }
    setInputs({ card: '', motif: 'Payé', timeStr: '' });
  };

  const handleAction = (id, action) => {
    setSessions(sessions.map(s => {
      if (s.id !== id) return s;
      if (action === 'pause') return { ...s, paused: !s.paused };
      if (action === 'stop') return { ...s, status: 'Terminé', elapsed: s.durationTotal, paused: true };
      return s;
    }));
  };

  const handleExtendTime = (id) => {
    const timeToAdd = prompt("Temps à ajouter (ex: 30m, 1h) :");
    if (!timeToAdd) return;
    const secondsToAdd = parseTime(timeToAdd);
    
    setSessions(sessions.map(s => {
        if (s.id !== id) return s;
        const newTotal = s.durationTotal + secondsToAdd;
        let newStatus = s.status === 'Terminé' ? 'Actif' : s.status;
        return { ...s, durationTotal: newTotal, status: newStatus, paused: false };
    }));
  };

  const handleDelete = (id) => {
    if(confirm('Confirmer la suppression définitive ?')) setSessions(sessions.filter(s => s.id !== id));
  };

  const handleEdit = (session) => {
    setInputs({ card: session.card, motif: session.motif, timeStr: '0m' });
    setEditingId(session.id);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();
    const dailySessions = sessions.filter(s => s.date === today);
    const totalRevenue = dailySessions.reduce((acc, curr) => acc + calculateCost(curr.elapsed), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(41, 50, 65);
    doc.text(`Rapport Journalier`, 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${today}`, 14, 26);
    doc.text(`Total Recette: ${totalRevenue} Ar`, 14, 31);

    autoTable(doc, {
      startY: 40,
      head: [["#", "Début", "Type", "Durée", "Coût", "État"]],
      body: dailySessions.map(s => [
        s.card, 
        s.debut, 
        s.motif, 
        formatTime(s.durationTotal), 
        `${calculateCost(s.elapsed)} Ar`, 
        s.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 50, 65], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 }
    });
    doc.save(`Rapport_Cyber_${today.replace(/\//g, '-')}.pdf`);
  };

  // --- STYLE SYSTEM (CSS-in-JS) ---
  const colors = {
    bg: isDarkMode ? '#111827' : '#f3f4f6',
    cardBg: isDarkMode ? '#1f2937' : '#ffffff',
    text: isDarkMode ? '#f9fafb' : '#111827',
    textMuted: isDarkMode ? '#9ca3af' : '#6b7280',
    primary: '#3b82f6', // Bleu standard professionnel
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    border: isDarkMode ? '#374151' : '#e5e7eb',
    hover: isDarkMode ? '#374151' : '#f9fafb'
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    body {
      background-color: ${colors.bg};
      color: ${colors.text};
      font-family: 'Inter', sans-serif;
      margin: 0;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    .app-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* HEADER */
    .header-stat {
      background: ${colors.cardBg};
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid ${colors.border};
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* INPUT SECTION */
    .control-panel {
      background: ${colors.cardBg};
      border-radius: 12px;
      border: 1px solid ${colors.border};
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${colors.textMuted};
      margin-bottom: 0.5rem;
      display: block;
    }

    .input-field {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid ${colors.border};
      background: ${isDarkMode ? '#374151' : '#fff'};
      color: ${colors.text};
      font-size: 0.95rem;
      transition: all 0.2s;
      outline: none;
    }
    .input-field:focus {
      border-color: ${colors.primary};
      box-shadow: 0 0 0 3px ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    }

    /* TABLE */
    .table-card {
      background: ${colors.cardBg};
      border-radius: 12px;
      border: 1px solid ${colors.border};
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .clean-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .clean-table th {
      padding: 1rem 1.5rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
      color: ${colors.textMuted};
      background: ${isDarkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc'};
      border-bottom: 1px solid ${colors.border};
    }

    .clean-table td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid ${colors.border};
      vertical-align: middle;
    }

    .clean-table tr:last-child td { border-bottom: none; }
    .clean-table tr:hover td { background: ${colors.hover}; }

    /* COMPONENTS */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary { background: ${colors.primary}; color: white; }
    .btn-primary:hover { filter: brightness(110%); }

    .btn-ghost { background: transparent; color: ${colors.textMuted}; border: 1px solid ${colors.border}; padding: 0.5rem; }
    .btn-ghost:hover { border-color: ${colors.primary}; color: ${colors.primary}; background: ${isDarkMode ? 'rgba(59,130,246,0.1)' : '#eff6ff'}; }
    
    .btn-danger-ghost:hover { border-color: ${colors.danger}; color: ${colors.danger}; background: rgba(239,68,68,0.1); }

    .mono { font-family: 'JetBrains Mono', monospace; }
    
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.75rem;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .status-active { background: rgba(16, 185, 129, 0.15); color: ${colors.success}; }
    .status-paused { background: rgba(245, 158, 11, 0.15); color: ${colors.warning}; }
    .status-done { background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#f3f4f6'}; color: ${colors.textMuted}; }

    .card-avatar {
      width: 42px; height: 42px;
      border-radius: 10px;
      background: ${isDarkMode ? '#374151' : '#f1f5f9'};
      color: ${colors.text};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Actions row visibility on hover */
    .row-actions { opacity: 0.3; transition: opacity 0.2s; }
    .clean-table tr:hover .row-actions { opacity: 1; }
  `;

  // Tri des sessions : Actifs d'abord
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.status === 'Terminé' && b.status !== 'Terminé') return 1;
    if (a.status !== 'Terminé' && b.status === 'Terminé') return -1;
    return b.id - a.id;
  });

  const todayTotal = sessions
    .filter(s => s.date === new Date().toLocaleDateString())
    .reduce((acc, curr) => acc + calculateCost(curr.elapsed), 0);

  return (
    <div className="app-container">
      <style>{styles}</style>

      {/* TOP BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Monitor size={28} color={colors.primary} />
            Cyber Manager
          </h1>
          <p style={{ margin: '5px 0 0 0', color: colors.textMuted, fontSize: '0.9rem' }}>
            Tableau de bord de gestion
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="header-stat">
            <div style={{display:'flex', flexDirection:'column'}}>
               <span style={{ fontSize: '0.7rem', textTransform:'uppercase', color: colors.textMuted, fontWeight:'600' }}>Recette du jour</span>
               <span className="mono" style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.success }}>{todayTotal} Ar</span>
            </div>
            <Zap size={20} color={colors.success} fill={colors.success} style={{ opacity: 0.2 }} />
          </div>
          
          <button className="btn btn-ghost" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* ACTION BAR (FORM) */}
      <div className="control-panel">
        <form onSubmit={handleAddSession} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Numéro de Poste</label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Ex: 05"
                value={inputs.card}
                onChange={e => setInputs({...inputs, card: e.target.value})}
                autoFocus
              />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <label className="form-label">Durée</label>
            <div style={{ position: 'relative' }}>
              <Clock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Ex: 1h, 30m"
                value={inputs.timeStr}
                onChange={e => setInputs({...inputs, timeStr: e.target.value})}
              />
            </div>
          </div>

          <div style={{ width: '200px' }}>
            <label className="form-label">Type de Paiement</label>
            <select 
              className="input-field"
              value={inputs.motif}
              onChange={e => setInputs({...inputs, motif: e.target.value})}
            >
              <option value="Payé">✅ Payé</option>
              <option value="Impayé">⚠️ Crédit / Impayé</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '46px' }}>
            {editingId ? <><Edit size={18}/> Mettre à jour</> : <><Plus size={18}/> Démarrer Session</>}
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Sessions en cours</h2>
        <button onClick={exportPDF} className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            <FileDown size={16} /> Exporter PDF
        </button>
      </div>

      <div className="table-card">
        <table className="clean-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Poste</th>
              <th>Horaire</th>
              <th>Temps Restant</th>
              <th>Montant</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedSessions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: colors.textMuted }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Monitor size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
                    <span>Aucune session active pour le moment.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedSessions.map(session => {
                const remaining = session.durationTotal - session.elapsed;
                const isFinished = session.status === 'Terminé';
                
                return (
                  <tr key={session.id} style={{ opacity: isFinished ? 0.6 : 1 }}>
                    {/* Colonne Poste */}
                    <td>
                      <div className="card-avatar">
                        {session.card}
                      </div>
                    </td>

                    {/* Colonne Horaire */}
                    <td>
                      <div style={{ fontWeight: '500' }}>{session.debut}</div>
                      <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>{session.motif}</div>
                    </td>

                    {/* Colonne Temps */}
                    <td>
                      <div className="mono" style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600',
                        color: remaining < 300 && !isFinished ? colors.danger : colors.text 
                      }}>
                        {isFinished ? '00:00:00' : formatTime(remaining)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                         Total: {formatTime(session.durationTotal)}
                      </div>
                    </td>

                    {/* Colonne Montant */}
                    <td>
                      <span className="mono" style={{ fontWeight: '600' }}>
                        {calculateCost(session.elapsed)} Ar
                      </span>
                    </td>

                    {/* Colonne Statut */}
                    <td>
                        {isFinished ? (
                           <span className="status-pill status-done"><CheckCircle2 size={12}/> Terminé</span>
                        ) : session.paused ? (
                           <span className="status-pill status-paused"><Pause size={12}/> Pause</span>
                        ) : (
                           <span className="status-pill status-active"><ActivityIndicator/> En ligne</span>
                        )}
                    </td>

                    {/* Colonne Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        
                        <button className="btn btn-ghost" title="Ajouter du temps" onClick={() => handleExtendTime(session.id)}>
                            <Plus size={16} />
                        </button>

                        {!isFinished && (
                          <>
                            <button className="btn btn-ghost" onClick={() => handleAction(session.id, 'pause')} title={session.paused ? "Reprendre" : "Pause"}>
                              {session.paused ? <Play size={16} /> : <Pause size={16} />}
                            </button>
                            <button className="btn btn-ghost btn-danger-ghost" onClick={() => handleAction(session.id, 'stop')} title="Arrêter">
                              <Square size={16} />
                            </button>
                          </>
                        )}
                        
                        <button className="btn btn-ghost" onClick={() => handleEdit(session)} title="Modifier">
                          <Edit size={16} />
                        </button>
                        
                        <button className="btn btn-ghost btn-danger-ghost" onClick={() => handleDelete(session.id)} title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Petit composant pour l'animation du point vert
const ActivityIndicator = () => (
    <span style={{ position: 'relative', display: 'flex', height: '8px', width: '8px' }}>
      <span style={{ 
        position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', 
        borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.75,
        animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' 
      }}></span>
      <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '8px', width: '8px', backgroundColor: '#10b981' }}></span>
      <style>{`@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`}</style>
    </span>
);

export default App;
