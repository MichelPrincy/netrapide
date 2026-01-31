import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Trash2, Edit, FileDown, Plus, Monitor, Clock, AlertTriangle, Zap, Sun, Moon, Timer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TARIF_PAR_HEURE = 500; // Ar

const App = () => {
  // --- États et Logique ---
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('cyberSessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [inputs, setInputs] = useState({ card: '', motif: 'Payé', timeStr: '' });
  const [editingId, setEditingId] = useState(null);
  
  // --- NOUVEAU : État pour le thème ---
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    localStorage.setItem('cyberSessions', JSON.stringify(sessions));
  }, [sessions]);

  // --- Styles Cyberpunk (Dark) ---
  const darkStyles = `
    body { background-color: #050505; color: #00f3ff; }
    .cyber-card { background: rgba(16, 20, 24, 0.9); border: 1px solid #00f3ff; box-shadow: 0 0 10px rgba(0, 243, 255, 0.2); }
    .cyber-input { background: #000 !important; border: 1px solid #333 !important; color: #00f3ff !important; }
    .cyber-btn-primary { border: 1px solid #00f3ff; color: #00f3ff; }
    .cyber-btn-primary:hover { background: #00f3ff; color: #000; box-shadow: 0 0 20px #00f3ff; }
    .cyber-table-head { background-color: #1a1a1a; color: #d600ff; text-shadow: 0 0 5px #d600ff; }
    .main-bg { background-color: #050505; }
    .text-dynamic { color: #00f3ff; }
    .border-dynamic { border-color: #333 !important; }
  `;

  // --- NOUVEAU : Styles Light Mode ---
  const lightStyles = `
    body { background-color: #f0f2f5; color: #0056b3; }
    .cyber-card { background: #ffffff; border: 1px solid #0056b3; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
    .cyber-input { background: #fff !important; border: 1px solid #ccc !important; color: #000 !important; }
    .cyber-btn-primary { border: 1px solid #0056b3; color: #0056b3; }
    .cyber-btn-primary:hover { background: #0056b3; color: #fff; box-shadow: 0 0 10px rgba(0, 86, 179, 0.5); }
    .cyber-table-head { background-color: #e9ecef; color: #d600ff; }
    .main-bg { background-color: #f0f2f5; }
    .text-dynamic { color: #333; }
    .border-dynamic { border-color: #ddd !important; }
    /* Overrides for visibility in light mode */
    .table-hover tbody tr:hover { background-color: rgba(0,0,0,0.05); }
    .text-white { color: #333 !important; } 
    .bg-dark { background-color: #e2e6ea !important; color: #000 !important; border-color: #ccc !important; }
  `;

  // --- Base Styles (Commun) ---
  const commonStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
    body { font-family: 'Share Tech Mono', monospace; transition: background 0.3s ease; }
    .cyber-input { font-family: 'Share Tech Mono', monospace; }
    .cyber-input:focus { border-color: #d600ff !important; box-shadow: 0 0 8px rgba(214, 0, 255, 0.5) !important; }
    .cyber-btn-primary { background: transparent; text-transform: uppercase; letter-spacing: 2px; transition: all 0.3s ease; }
    .cyber-btn-danger { border: 1px solid #ff0055; color: #ff0055; background: transparent; }
    .cyber-btn-danger:hover { background: #ff0055; color: #fff; box-shadow: 0 0 15px #ff0055; }
    @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(255, 0, 85, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 0, 85, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 0, 85, 0); } }
    .status-alert { animation: pulse-red 2s infinite; color: #ff0055; font-weight: bold; }
    .neon-text { text-shadow: 0 0 5px currentColor; }
  `;

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
    const delayBetween = 5000;
    const speak = () => {
      if (count >= maxRepetitions) return;
      const text = `Carte numéro ${cardNum}, Votre temps de connexion est terminé`;
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'fr-FR';
      msg.rate = 0.9;
      msg.onend = () => {
        count++;
        if (count < maxRepetitions) {
          setTimeout(() => { speak(); }, delayBetween);
        }
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

  const calculateCost = (seconds) => {
    return Math.ceil((seconds / 3600) * TARIF_PAR_HEURE);
  };

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

  // --- NOUVEAU : Fonction pour Ajouter du Temps ---
  const handleExtendTime = (id) => {
    const timeToAdd = prompt("Ajouter combien de temps ? (ex: 1h, 30m, 15)");
    if (!timeToAdd) return;
    
    const secondsToAdd = parseTime(timeToAdd);
    
    setSessions(sessions.map(s => {
        if (s.id !== id) return s;
        
        // On recalcule le total
        const newTotal = s.durationTotal + secondsToAdd;
        
        // Si la session était terminée, on la réactive
        let newStatus = s.status;
        let newPaused = s.paused;
        
        if (s.status === 'Terminé') {
            newStatus = 'Actif';
            newPaused = false; // On relance automatiquement si on ajoute du temps
        }

        return { 
            ...s, 
            durationTotal: newTotal,
            status: newStatus,
            paused: newPaused
        };
    }));
  };

  const handleDelete = (id) => {
    if(confirm('SUPPRIMER LA SESSION ?')) setSessions(sessions.filter(s => s.id !== id));
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

    doc.setTextColor(0, 102, 204); 
    doc.setFontSize(22);
    doc.text(`RAPPORT CYBER MANAGER`, 14, 20);
    
    doc.setTextColor(100);
    doc.setFontSize(12);
    doc.text(`Date: ${today} | Revenu Total: ${totalRevenue} Ar`, 14, 30);

    const tableColumn = ["Carte", "Début", "Motif", "Durée", "Coût", "Status"];
    const tableRows = dailySessions.map(s => [
      s.card, s.debut, s.motif, formatTime(s.durationTotal), `${calculateCost(s.elapsed)} Ar`, s.status
    ]);

    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 248, 255] },
      styles: { fontSize: 10, cellPadding: 3 }
    });

    doc.save(`rapport_cyber_${today.replace(/\//g, '-')}.pdf`);
  };

  const currentTotal = sessions
    .filter(s => s.date === new Date().toLocaleDateString())
    .reduce((acc, curr) => acc + calculateCost(curr.elapsed), 0);

  // --- NOUVEAU : Logique de Tri (Sorting) ---
  // Online/Actif/Pause en premier, Terminé en bas
  const activeSessions = sessions.filter(s => s.status !== 'Terminé');
  const finishedSessions = sessions.filter(s => s.status === 'Terminé');
  const sortedSessions = [...activeSessions, ...finishedSessions];

  return (
    <div className="container-fluid min-vh-100 py-4 main-bg">
      <style>{commonStyles}</style>
      <style>{isDarkMode ? darkStyles : lightStyles}</style>
      
      {/* HEADER */}
      <header className="row mb-4 align-items-center cyber-card p-4 rounded mx-1">
        <div className="col-md-5 d-flex align-items-center gap-3">
          <div className="p-3 rounded border border-info shadow-lg" style={{ background: 'rgba(0, 243, 255, 0.1)' }}>
            <Monitor size={32} className="text-info" />
          </div>
          <div>
            <h1 className="h3 mb-0 neon-text fw-bold text-uppercase" style={{ letterSpacing: '4px' }}>CYBER MANAGER NETRAPIDE <span className="text-muted fs-6">v2.1</span></h1>
            <div className="d-flex align-items-center gap-2 text-secondary">
              <Zap size={14} className="text-warning" />
              <small className="font-monospace">SYSTEM: ONLINE</small>
            </div>
          </div>
        </div>
        
        {/* NOUVEAU : Toggle Dark/Light Mode */}
        <div className="col-md-2 text-center">
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="btn btn-sm border rounded-pill px-3"
                style={{ borderColor: isDarkMode ? '#00f3ff' : '#0056b3', color: isDarkMode ? '#00f3ff' : '#0056b3' }}
            >
                {isDarkMode ? <div className="d-flex align-items-center gap-2"><Sun size={16}/> Light</div> : <div className="d-flex align-items-center gap-2"><Moon size={16}/> Dark</div>}
            </button>
        </div>

        <div className="col-md-5 d-flex justify-content-end align-items-center gap-4">
          <div className="text-end">
            <div className="text-uppercase text-secondary" style={{ fontSize: '0.75rem', letterSpacing: '2px' }}>RECETTE DU JOUR</div>
            <div className="h2 mb-0 fw-bold neon-text" style={{ color: '#00ff00' }}>{currentTotal} <span className="fs-5">Ar</span></div>
          </div>
          <button className="btn cyber-btn-primary d-flex align-items-center gap-2 px-4 py-2" onClick={exportPDF}>
            <FileDown size={20} /> EXPORT
          </button>
        </div>
      </header>

      {/* FORMULAIRE */}
      <div className="cyber-card mb-4 mx-1 rounded">
        <div className="card-header bg-transparent d-flex align-items-center gap-2 p-3 border-dynamic" style={{ borderBottom: '1px solid' }}>
          <Clock size={20} color="#d600ff" />
          <span className="fw-bold text-uppercase" style={{ color: '#d600ff', letterSpacing: '2px' }}>
            {editingId ? 'MODIFICATION SESSION' : 'NOUVELLE SESSION'}
          </span>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleAddSession} className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label text-info small text-uppercase">N° Carte</label>
              <input 
                type="text" 
                className="form-control form-control-lg cyber-input"
                placeholder="01"
                value={inputs.card}
                onChange={e => setInputs({...inputs, card: e.target.value})}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-info small text-uppercase">Motif</label>
              <select 
                className="form-select form-select-lg cyber-input"
                value={inputs.motif}
                onChange={e => setInputs({...inputs, motif: e.target.value})}
              >
                <option value="Payé">Payé</option>
                <option value="Impayé">Impayé</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label text-info small text-uppercase">Temps (1h, 30m)</label>
              <input 
                type="text" 
                className="form-control form-control-lg cyber-input"
                placeholder="1h 30m"
                value={inputs.timeStr}
                onChange={e => setInputs({...inputs, timeStr: e.target.value})}
                required
              />
            </div>
            <div className="col-md-3">
              <button 
                type="submit" 
                className="btn btn-lg w-100 d-flex align-items-center justify-center gap-2 cyber-btn-primary"
                style={{ borderColor: editingId ? '#ffae00' : (isDarkMode ? '#00f3ff' : '#0056b3'), color: editingId ? '#ffae00' : (isDarkMode ? '#00f3ff' : '#0056b3') }}
              >
                {editingId ? <Edit size={20}/> : <Plus size={20}/>}
                {editingId ? 'UPDATE' : 'START'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="cyber-card mx-1 rounded overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle" style={{ backgroundColor: 'transparent', color: isDarkMode ? 'white' : 'black' }}>
            <thead className="cyber-table-head">
              <tr className="text-uppercase small" style={{ letterSpacing: '1px' }}>
                <th className="py-3 ps-4 border-dynamic">Carte</th>
                <th className="py-3 border-dynamic">Début</th>
                <th className="py-3 border-dynamic">Motif</th>
                <th className="py-3 text-center border-dynamic">Compteur</th>
                <th className="py-3 border-dynamic">Coût</th>
                <th className="py-3 border-dynamic">Status</th>
                <th className="py-3 text-end pe-4 border-dynamic">Commandes</th>
              </tr>
            </thead>
            <tbody style={{ borderTop: 'none' }}>
              {sortedSessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-secondary border-0">
                    <AlertTriangle size={40} className="mb-3 opacity-50" />
                    <div className="font-monospace">AUCUNE DONNÉE DANS LE SYSTÈME</div>
                  </td>
                </tr>
              ) : (
                sortedSessions.map(session => {
                  const remaining = session.durationTotal - session.elapsed;
                  const isFinished = session.status === 'Terminé';
                  
                  return (
                    <tr key={session.id} className={isFinished ? 'opacity-50' : ''} style={{ borderBottom: isDarkMode ? '1px solid #333' : '1px solid #ddd' }}>
                      <td className="ps-4 fw-bold fs-5 text-dynamic" style={{ fontFamily: 'sans-serif' }}>
                        <span className="badge bg-dark border border-secondary text-white">{session.card}</span>
                      </td>
                      <td className="text-secondary font-monospace">{session.debut}</td>
                      <td>
                        <span className={`badge rounded-0 text-uppercase ${session.motif === 'Payé' ? 'bg-success text-black' : 'bg-danger text-white'}`}>
                          {session.motif}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`font-monospace fs-4 ${remaining < 60 && !isFinished ? 'status-alert' : 'text-info'}`} style={{ textShadow: '0 0 5px rgba(0,243,255,0.5)' }}>
                          {isFinished ? '00:00:00' : formatTime(remaining)}
                        </span>
                      </td>
                      <td className="fw-bold" style={{ color: '#00ff00' }}>
                        {calculateCost(session.elapsed)} Ar
                      </td>
                      <td>
                        {isFinished ? (
                          <span className="badge bg-secondary rounded-0 text-dark">OFFLINE</span>
                        ) : (
                          <span className={`badge rounded-0 ${session.paused ? 'bg-warning text-dark' : 'bg-primary text-black'}`}>
                            {session.paused ? 'PAUSE' : 'ONLINE'}
                          </span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm" role="group">
                           {/* NOUVEAU BOUTON : AJOUTER TEMPS */}
                           <button 
                             className="btn btn-outline-success me-1" 
                             title="Ajouter du temps"
                             onClick={() => handleExtendTime(session.id)}
                           >
                             <Timer size={14} className="me-1"/>+
                           </button>

                          {!isFinished && (
                            <>
                              <button 
                                className={`btn ${session.paused ? 'btn-outline-info' : 'btn-outline-light'}`}
                                onClick={() => handleAction(session.id, 'pause')}
                              >
                                {session.paused ? <Play size={14} /> : <Pause size={14} />}
                              </button>
                              <button 
                                className="btn cyber-btn-danger"
                                onClick={() => handleAction(session.id, 'stop')}
                              >
                                <Square size={14} />
                              </button>
                            </>
                          )}
                          <button className="btn btn-outline-warning" onClick={() => handleEdit(session)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-outline-secondary" onClick={() => handleDelete(session.id)}>
                            <Trash2 size={14} />
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
    </div>
  );
};

export default App;