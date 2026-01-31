import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Trash2, Edit, FileDown, Plus, Monitor, Clock, AlertTriangle, Zap, Sun, Moon, Timer, CreditCard, LayoutDashboard } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TARIF_PAR_HEURE = 500; // Ar

const App = () => {
  // --- États et Logique (INCHANGÉS) ---
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('cyberSessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [inputs, setInputs] = useState({ card: '', motif: 'Payé', timeStr: '' });
  const [editingId, setEditingId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    localStorage.setItem('cyberSessions', JSON.stringify(sessions));
  }, [sessions]);

  // --- STYLES CSS MODERNES ET PROFESSIONNELS ---
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

    :root {
      --primary: ${isDarkMode ? '#3b82f6' : '#2563eb'};
      --primary-glow: ${isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(37, 99, 235, 0.3)'};
      --bg-app: ${isDarkMode ? '#0f172a' : '#f8fafc'};
      --bg-card: ${isDarkMode ? '#1e293b' : '#ffffff'};
      --text-main: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
      --text-muted: ${isDarkMode ? '#94a3b8' : '#64748b'};
      --border-color: ${isDarkMode ? '#334155' : '#e2e8f0'};
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
    }

    body {
      background-color: var(--bg-app);
      color: var(--text-main);
      font-family: 'Inter', sans-serif;
      transition: all 0.3s ease;
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }

    .dashboard-container {
      padding: 2rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Cards avec effet Glassmorphism subtil */
    .pro-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .input-group-custom {
      background: ${isDarkMode ? '#0f172a' : '#f1f5f9'};
      border: 1px solid var(--border-color);
      color: var(--text-main);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      width: 100%;
      outline: none;
      transition: border-color 0.2s;
    }

    .input-group-custom:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }

    /* Boutons Modernes */
    .btn-pro {
      border-radius: 8px;
      font-weight: 600;
      padding: 0.75rem 1.5rem;
      transition: all 0.2s;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), #2563eb);
      color: white;
      box-shadow: 0 4px 12px var(--primary-glow);
    }
    .btn-primary:hover { filter: brightness(110%); transform: translateY(-1px); }

    .btn-icon {
      padding: 0.5rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-icon:hover { background: var(--bg-app); color: var(--primary); border-color: var(--primary); }
    .btn-icon.danger:hover { color: var(--danger); border-color: var(--danger); }

    /* Table Design */
    .table-container {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }
    
    .custom-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    .custom-table th {
      background: ${isDarkMode ? '#1e293b' : '#f8fafc'};
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      padding: 1rem 1.5rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .custom-table td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-main);
    }

    .custom-table tr:last-child td { border-bottom: none; }
    .custom-table tr:hover td { background: ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'}; }

    /* Elements Spécifiques */
    .mono-font { font-family: 'Share Tech Mono', monospace; letter-spacing: 0.5px; }
    
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    .badge-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
    .badge-neutral { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }

    .timer-display {
      font-size: 1.25rem;
      font-weight: bold;
      color: var(--primary);
      text-shadow: ${isDarkMode ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none'};
    }
    .timer-alert { color: var(--danger); animation: pulse 2s infinite; }

    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
  `;

  // --- Logique (INCHANGÉE sauf pour le timer) ---
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
    let count = 0;
    const maxRepetitions = 1;
    const speak = () => {
      if (count >= maxRepetitions) return;
      const msg = new SpeechSynthesisUtterance(`Carte numéro ${cardNum}, terminé`);
      msg.lang = 'fr-FR';
      msg.onend = () => {
        count++;
        if (count < maxRepetitions) setTimeout(speak, 5000);
      };
      window.speechSynthesis.speak(msg);
    };
    speak();
  };

  const parseTime = (str) => {
    let totalSeconds = 0;
    const hours = str.match(/(\d+)h/);
    const minutes = str.match(/(\d+)m/);
    if (hours) totalSeconds += parseInt(hours[1]) * 3600;
    if (minutes) totalSeconds += parseInt(minutes[1]) * 60;
    if (!hours && !minutes && !isNaN(str) && str.trim() !== '') totalSeconds += parseInt(str) * 60;
    return totalSeconds > 0 ? totalSeconds : 3600;
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
    const timeToAdd = prompt("Ajouter temps (ex: 30m) :");
    if (!timeToAdd) return;
    const secondsToAdd = parseTime(timeToAdd);
    
    setSessions(sessions.map(s => {
        if (s.id !== id) return s;
        const newTotal = s.durationTotal + secondsToAdd;
        let newStatus = s.status === 'Terminé' ? 'Actif' : s.status;
        let newPaused = s.status === 'Terminé' ? false : s.paused;
        return { ...s, durationTotal: newTotal, status: newStatus, paused: newPaused };
    }));
  };

  const handleDelete = (id) => {
    if(confirm('Supprimer cette session ?')) setSessions(sessions.filter(s => s.id !== id));
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

    doc.setTextColor(37, 99, 235); // Bleu pro
    doc.setFontSize(22);
    doc.text(`Rapport Journalier`, 14, 20);
    
    doc.setTextColor(100);
    doc.setFontSize(11);
    doc.text(`Cyber Manager - ${today}`, 14, 28);
    doc.text(`Revenu: ${totalRevenue} Ar`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [["Carte", "Début", "Motif", "Durée", "Coût", "Status"]],
      body: dailySessions.map(s => [s.card, s.debut, s.motif, formatTime(s.durationTotal), `${calculateCost(s.elapsed)} Ar`, s.status]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save(`Rapport_${today.replace(/\//g, '-')}.pdf`);
  };

  // Tri
  const sortedSessions = [
    ...sessions.filter(s => s.status !== 'Terminé'),
    ...sessions.filter(s => s.status === 'Terminé')
  ];
  
  const currentTotal = sessions
    .filter(s => s.date === new Date().toLocaleDateString())
    .reduce((acc, curr) => acc + calculateCost(curr.elapsed), 0);

  return (
    <div className="dashboard-container">
      <style>{styles}</style>
      
      {/* HEADER & STATS */}
      <div className="row mb-4 align-items-center">
        <div className="col-md-6">
          <div className="d-flex align-items-center gap-3">
            <div className={`p-3 rounded-xl shadow-sm ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <LayoutDashboard size={28} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
            </div>
            <div>
              <h1 className="h4 mb-0 fw-bold">Cyber Manager Pro</h1>
              <div className="d-flex align-items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span className="d-flex align-items-center gap-1 text-success"><Zap size={12}/> Système Actif</span>
                <span>•</span>
                <span>v2.2 Stable</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 d-flex justify-content-end align-items-center gap-3">
          <div className="pro-card px-4 py-2 text-end">
            <div className="text-uppercase small fw-bold" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Recette du Jour</div>
            <div className="fs-4 fw-bold mono-font" style={{ color: 'var(--success)' }}>{currentTotal} Ar</div>
          </div>

          <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn-icon">
            {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
          </button>
          
          <button className="btn-pro btn-primary" onClick={exportPDF}>
            <FileDown size={18} /> Rapport PDF
          </button>
        </div>
      </div>

      {/* ACTION BAR (FORMULAIRE) */}
      <div className="pro-card p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-3">
            <Clock size={18} className="text-primary" />
            <h6 className="mb-0 fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {editingId ? 'Modification en cours' : 'Nouvelle Session'}
            </h6>
        </div>
        
        <form onSubmit={handleAddSession} className="row g-3">
          <div className="col-md-3">
            <div className="d-flex align-items-center position-relative">
                <CreditCard size={18} className="position-absolute ms-3 text-muted" />
                <input 
                  type="text" 
                  className="input-group-custom ps-5" 
                  placeholder="Numéro Carte (ex: 01)"
                  value={inputs.card}
                  onChange={e => setInputs({...inputs, card: e.target.value})}
                  required
                />
            </div>
          </div>
          <div className="col-md-3">
             <select 
                className="input-group-custom"
                value={inputs.motif}
                onChange={e => setInputs({...inputs, motif: e.target.value})}
              >
                <option value="Payé">Payé (Standard)</option>
                <option value="Impayé">Impayé (Crédit)</option>
              </select>
          </div>
          <div className="col-md-3">
            <div className="d-flex align-items-center position-relative">
                <Timer size={18} className="position-absolute ms-3 text-muted" />
                <input 
                  type="text" 
                  className="input-group-custom ps-5" 
                  placeholder="Temps (ex: 1h, 30m)"
                  value={inputs.timeStr}
                  onChange={e => setInputs({...inputs, timeStr: e.target.value})}
                  required
                />
            </div>
          </div>
          <div className="col-md-3">
            <button type="submit" className="btn-pro btn-primary w-100">
              {editingId ? <><Edit size={18}/> Mettre à jour</> : <><Plus size={18}/> Démarrer</>}
            </button>
          </div>
        </form>
      </div>

      {/* MAIN TABLE */}
      <div className="pro-card table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th className="ps-4">Client / Carte</th>
              <th>Heure Début</th>
              <th>Paiement</th>
              <th className="text-center">Chrono</th>
              <th>Montant</th>
              <th>État</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedSessions.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  <div className="d-flex flex-column align-items-center opacity-50">
                    <Monitor size={48} className="mb-3" strokeWidth={1} />
                    <span>Aucune session active</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedSessions.map(session => {
                const remaining = session.durationTotal - session.elapsed;
                const isFinished = session.status === 'Terminé';
                
                return (
                  <tr key={session.id} style={{ opacity: isFinished ? 0.6 : 1 }}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center fw-bold ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ width: '40px', height: '40px' }}>
                            {session.card}
                        </div>
                      </div>
                    </td>
                    <td className="mono-font text-muted">{session.debut}</td>
                    <td>
                        <span className={`status-badge ${session.motif === 'Payé' ? 'badge-success' : 'badge-danger'}`}>
                            {session.motif}
                        </span>
                    </td>
                    <td className="text-center">
                      <span className={`mono-font timer-display ${remaining < 60 && !isFinished ? 'timer-alert' : ''}`}>
                        {isFinished ? 'Terminé' : formatTime(remaining)}
                      </span>
                    </td>
                    <td className="fw-bold mono-font text-success">
                      {calculateCost(session.elapsed)} Ar
                    </td>
                    <td>
                        {isFinished ? (
                           <span className="status-badge badge-neutral">Offline</span>
                        ) : session.paused ? (
                           <span className="status-badge badge-warning">Pause</span>
                        ) : (
                           <span className="status-badge badge-success">En Ligne</span>
                        )}
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-1">
                        <button className="btn-icon text-success" onClick={() => handleExtendTime(session.id)} title="Ajouter temps">
                           <Plus size={16} />
                        </button>
                        
                        {!isFinished && (
                            <>
                                <button className="btn-icon" onClick={() => handleAction(session.id, 'pause')} title={session.paused ? "Reprendre" : "Pause"}>
                                    {session.paused ? <Play size={16} /> : <Pause size={16} />}
                                </button>
                                <button className="btn-icon danger" onClick={() => handleAction(session.id, 'stop')} title="Arrêter">
                                    <Square size={16} />
                                </button>
                            </>
                        )}
                        
                        <button className="btn-icon" onClick={() => handleEdit(session)}>
                            <Edit size={16} />
                        </button>
                        <button className="btn-icon danger" onClick={() => handleDelete(session.id)}>
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

export default App;
