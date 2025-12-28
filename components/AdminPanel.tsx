import React, { useState, useMemo } from 'react';
import { Participant, RegistrationStats, TransponderEntry } from '../types';
import { CATEGORIES } from '../constants';
import { analyzeRegistrations } from '../services/geminiService';
import { 
  Download, 
  Lock, 
  Unlock, 
  Search, 
  FileSpreadsheet, 
  BrainCircuit, 
  Users, 
  LogOut,
  Radio,
  Flag,
  Plus,
  Trash2,
  X,
  Check,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface AdminPanelProps {
  participants: Participant[];
  transponderEntries: TransponderEntry[];
  isRegistrationOpen: boolean;
  currentRaceName: string;
  onToggleStatus: () => void;
  onLogout: () => void;
  onStartNewRace: (name: string) => void;
  onDeleteParticipant: (id: string) => void;
  onRemoveTransponderEntry: (entryId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  participants, 
  transponderEntries,
  isRegistrationOpen, 
  currentRaceName,
  onToggleStatus, 
  onLogout,
  onStartNewRace,
  onDeleteParticipant,
  onRemoveTransponderEntry
}) => {
  const [activeTab, setActiveTab] = useState<'database' | 'live'>('database');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showNewRaceForm, setShowNewRaceForm] = useState(false);
  const [newRaceName, setNewRaceName] = useState('');
  const [isConfirmingNewRace, setIsConfirmingNewRace] = useState(false);

  // States for row-level confirmation (avoids window.confirm)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);

  const categoryOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    CATEGORIES.forEach((cat, index) => { map[cat] = index; });
    return map;
  }, []);

  const sortedDatabase = useMemo(() => {
    return participants
      .filter(p => 
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.motoNumber.includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const orderA = categoryOrderMap[a.category] ?? 999;
        const orderB = categoryOrderMap[b.category] ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.fullName.localeCompare(b.fullName);
      });
  }, [participants, searchTerm, categoryOrderMap]);

  const sortedRaceParticipants = useMemo(() => {
    return transponderEntries.map(entry => {
      const participant = participants.find(p => p.id === entry.participantId);
      if (!participant) return null;
      return { ...participant, entryId: entry.id, checkInTime: entry.timestamp };
    })
    .filter((p): p is any => p !== null && !!p.id)
    .filter(p => 
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.motoNumber.includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const orderA = categoryOrderMap[a.category] ?? 999;
      const orderB = categoryOrderMap[b.category] ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [transponderEntries, participants, searchTerm, categoryOrderMap]);

  const stats: RegistrationStats = useMemo(() => {
    return participants.reduce((acc, curr) => {
      acc.total++;
      acc.byCategory[curr.category] = (acc.byCategory[curr.category] || 0) + 1;
      return acc;
    }, { total: 0, byCategory: {} } as RegistrationStats);
  }, [participants]);

  const handleStartNewRaceClick = () => {
    if (newRaceName.trim()) {
      setIsConfirmingNewRace(true);
    } else {
      alert("Por favor ingresa un nombre para la carrera.");
    }
  };

  const handleConfirmRaceCreation = () => {
    const name = newRaceName.trim();
    if (name) {
      onStartNewRace(name);
      setNewRaceName('');
      setShowNewRaceForm(false);
      setIsConfirmingNewRace(false);
      setActiveTab('live');
    }
  };

  const downloadDatabaseCSV = () => {
    const headers = ["ID,Nombre,Moto,Categoria,Telefono,Residencia,Fecha,Codigo"];
    const rows = participants.map(p => `${p.id},"${p.fullName}",${p.motoNumber},"${p.category}","${p.phone}","${p.residence}",${p.registrationDate},${p.accessCode}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "base_cie_completa.csv";
    link.click();
  };

  const downloadLiveRaceCSV = () => {
    const headers = ["Moto,Piloto,Categoria,Hora Registro"];
    const rows = sortedRaceParticipants.map(p => `${p.motoNumber},"${p.fullName}","${p.category}",${new Date(p.checkInTime).toLocaleTimeString()}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `lista_${currentRaceName.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  const handleAiAnalysis = async () => {
    setLoadingAnalysis(true);
    setAiAnalysis(null);
    try {
        const result = await analyzeRegistrations(participants);
        setAiAnalysis(result);
    } catch (e) {
        setAiAnalysis("Error fatal al procesar el análisis.");
    } finally {
        setLoadingAnalysis(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Panel Administrativo</h2>
          <p className="text-slate-500">Control de Eventos Oficial CIE 2026</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-bold bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <LogOut className="w-5 h-5" /> Salir del Panel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="w-6 h-6" /></div>
          <div><p className="text-xs text-slate-500 font-medium">Base de Datos</p><p className="text-2xl font-bold text-slate-800">{stats.total}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Radio className="w-6 h-6" /></div>
          <div className="flex-1 overflow-hidden"><p className="text-xs text-slate-500 font-medium truncate">{currentRaceName}</p><p className="text-2xl font-bold text-slate-800">{transponderEntries.length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
           <div className={`p-2 rounded-lg ${isRegistrationOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{isRegistrationOpen ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}</div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-medium">Inscripciones</p>
            <div className="flex items-center gap-2">
                <p className={`font-bold text-sm ${isRegistrationOpen ? 'text-green-700' : 'text-red-700'}`}>{isRegistrationOpen ? 'Abierto' : 'Cerrado'}</p>
                <button onClick={onToggleStatus} className="text-[10px] underline text-slate-400 hover:text-slate-600 uppercase font-black">Cambiar</button>
            </div>
          </div>
        </div>
        <button 
          onClick={handleAiAnalysis} 
          disabled={loadingAnalysis} 
          className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 hover:bg-slate-50 disabled:opacity-50 text-left transition-all ${loadingAnalysis ? 'animate-pulse border-purple-300' : ''}`}
        >
          <div className={`p-2 rounded-lg ${loadingAnalysis ? 'bg-purple-200 text-purple-700' : 'bg-purple-100 text-purple-600'}`}>
            {loadingAnalysis ? <RefreshCw className="w-6 h-6 animate-spin" /> : <BrainCircuit className="w-6 h-6" />}
          </div>
          <div><p className="text-xs text-slate-500 font-medium">Análisis IA</p><p className="text-sm font-bold text-purple-700">{loadingAnalysis ? 'Procesando...' : 'Generar Informe'}</p></div>
        </button>
      </div>

      {aiAnalysis && (
        <div className={`rounded-xl p-6 relative animate-fade-in shadow-inner border ${aiAnalysis.startsWith('Error') ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100'}`}>
            <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${aiAnalysis.startsWith('Error') ? 'text-red-800' : 'text-indigo-800'}`}>
                {aiAnalysis.startsWith('Error') ? <AlertTriangle className="w-5 h-5" /> : <BrainCircuit className="w-5 h-5" />} 
                {aiAnalysis.startsWith('Error') ? 'Problema Detectado' : 'Análisis Gemini IA'}
            </h3>
            <p className={`${aiAnalysis.startsWith('Error') ? 'text-red-700' : 'text-slate-700'} text-sm whitespace-pre-line leading-relaxed`}>
                {aiAnalysis}
            </p>
            <button onClick={() => setAiAnalysis(null)} className={`absolute top-4 right-4 ${aiAnalysis.startsWith('Error') ? 'text-red-400 hover:text-red-600' : 'text-indigo-400 hover:text-indigo-600'}`}>✕</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50">
              <button onClick={() => { setActiveTab('database'); setConfirmingDeleteId(null); setConfirmingRemoveId(null); }} className={`flex-1 py-4 text-xs font-black tracking-widest transition-all ${activeTab === 'database' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}>BASE DE DATOS CIE</button>
              <button onClick={() => { setActiveTab('live'); setConfirmingDeleteId(null); setConfirmingRemoveId(null); }} className={`flex-1 py-4 text-xs font-black tracking-widest transition-all ${activeTab === 'live' ? 'text-orange-600 border-b-2 border-orange-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}>CARRERA ACTUAL</button>
          </div>

          {activeTab === 'database' && (
             <div className="animate-fade-in">
                <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="text" placeholder="Filtrar por nombre, número o categoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button onClick={downloadDatabaseCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"><FileSpreadsheet className="w-4 h-4 text-green-600" /> Exportar Base</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="bg-slate-900 text-white text-[10px] uppercase tracking-widest font-black"><th className="p-4">No. Moto</th><th className="p-4">Piloto</th><th className="p-4">Categoría</th><th className="p-4 text-center">Acciones</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                        {sortedDatabase.length > 0 ? sortedDatabase.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-mono font-black text-blue-600">#{p.motoNumber}</td>
                                <td className="p-4"><div className="text-sm font-bold text-slate-800">{p.fullName}</div><div className="text-[10px] text-slate-400">ID: {p.accessCode}</div></td>
                                <td className="p-4 text-xs font-bold text-slate-500 uppercase">{p.category}</td>
                                <td className="p-4 text-center min-w-[120px]">
                                    {confirmingDeleteId === p.id ? (
                                        <div className="flex items-center justify-center gap-2 animate-fade-in">
                                            <button 
                                              onClick={() => { onDeleteParticipant(p.id); setConfirmingDeleteId(null); }}
                                              className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm"
                                              title="Confirmar eliminación"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button 
                                              onClick={() => setConfirmingDeleteId(null)}
                                              className="p-1.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300"
                                              title="Cancelar"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                          onClick={() => setConfirmingDeleteId(p.id)} 
                                          className="p-2 text-slate-300 hover:text-red-600 transition-colors" 
                                          title="Borrar de la Base"
                                        >
                                          <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic">No hay registros coincidentes.</td></tr>}
                        </tbody>
                    </table>
                </div>
             </div>
          )}

          {activeTab === 'live' && (
              <div className="animate-fade-in">
                  <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                          <Flag className="w-5 h-5 text-orange-700" />
                          <div><p className="text-[10px] text-orange-600 uppercase font-black tracking-widest">Estado de Carrera</p><h3 className="text-lg font-black text-slate-800">{currentRaceName}</h3></div>
                      </div>
                      
                      {isConfirmingNewRace ? (
                        <div className="flex items-center gap-4 bg-red-600 text-white px-6 py-3 rounded-xl shadow-xl animate-pulse">
                          <AlertTriangle className="w-6 h-6 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest">¿Confirmar Reinicio?</span>
                            <span className="text-xs opacity-90">Se borrarán todos los transponders actuales.</span>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button 
                              onClick={handleConfirmRaceCreation}
                              className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-slate-100 transition-colors shadow-sm"
                            >
                              SÍ, REINICIAR
                            </button>
                            <button 
                              onClick={() => setIsConfirmingNewRace(false)}
                              className="bg-red-800 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-red-900 transition-colors"
                            >
                              CANCELAR
                            </button>
                          </div>
                        </div>
                      ) : showNewRaceForm ? (
                          <div className="flex gap-2 animate-fade-in p-1 bg-white rounded-lg border border-orange-200 shadow-sm items-center">
                              <input 
                                type="text" 
                                placeholder="Nombre de la nueva fecha..." 
                                value={newRaceName} 
                                onChange={(e) => setNewRaceName(e.target.value)} 
                                className="px-3 py-2 text-sm outline-none w-48 font-medium text-slate-800" 
                                autoFocus 
                                onKeyDown={(e) => e.key === 'Enter' && handleStartNewRaceClick()}
                              />
                              <button 
                                onClick={handleStartNewRaceClick}
                                className="bg-orange-600 text-white px-4 py-2 rounded-md text-xs font-black uppercase tracking-tight hover:bg-orange-700 transition-colors flex items-center gap-1 shadow-md"
                              >
                                <Check className="w-3 h-3" /> Iniciar
                              </button>
                              <button onClick={() => setShowNewRaceForm(false)} className="text-slate-400 px-2 hover:text-slate-600 transition-colors">✕</button>
                          </div>
                      ) : (
                        <button onClick={() => setShowNewRaceForm(true)} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase shadow-md hover:bg-slate-800 transition-all active:scale-95"><Plus className="w-4 h-4" /> Iniciar Nueva Fecha</button>
                      )}
                  </div>
                  <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="text" placeholder="Filtrar pilotos en carrera..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <button onClick={downloadLiveRaceCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"><FileSpreadsheet className="w-4 h-4 text-green-600" /> Exportar Lista</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b border-slate-200"><th className="p-4">No. Moto</th><th className="p-4">Piloto</th><th className="p-4">Hora</th><th className="p-4 text-center">Quitar</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                        {sortedRaceParticipants.length > 0 ? sortedRaceParticipants.map(p => (
                            <tr key={p.entryId} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-mono text-xl font-black text-slate-800">#{p.motoNumber}</td>
                                <td className="p-4"><div className="text-sm font-bold text-slate-800">{p.fullName}</div><div className="text-[9px] text-orange-600 uppercase font-black tracking-widest">{p.category}</div></td>
                                <td className="p-4 text-xs text-slate-500 font-mono">{new Date(p.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                <td className="p-4 text-center min-w-[120px]">
                                    {confirmingRemoveId === p.entryId ? (
                                        <div className="flex items-center justify-center gap-2 animate-fade-in">
                                            <button 
                                              onClick={() => { onRemoveTransponderEntry(p.entryId); setConfirmingRemoveId(null); }}
                                              className="p-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 shadow-sm"
                                              title="Confirmar remover"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button 
                                              onClick={() => setConfirmingRemoveId(null)}
                                              className="p-1.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300"
                                              title="Cancelar"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                          onClick={() => setConfirmingRemoveId(p.entryId)} 
                                          className="p-2 text-slate-300 hover:text-red-600 transition-colors" 
                                          title="Remover de esta carrera"
                                        >
                                          <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : <tr><td colSpan={4} className="p-20 text-center text-slate-400 italic">La carrera está vacía. Registra pilotos con transponder para verlos aquí.</td></tr>}
                        </tbody>
                    </table>
                </div>
              </div>
          )}
      </div>
      <div className="mt-8 text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">ENGINE v2.9 // CIE OFFICIAL</div>
    </div>
  );
};

export default AdminPanel;