import React, { useState } from 'react';
import { Participant, RegistrationStats, TransponderEntry } from '../types';
import { analyzeRegistrations } from '../services/geminiService';
import { 
  Download, 
  Lock, 
  Unlock, 
  Search, 
  FileSpreadsheet, 
  BrainCircuit, 
  Users, 
  TrendingUp,
  LogOut,
  Radio,
  Flag,
  Database,
  List,
  Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdminPanelProps {
  participants: Participant[];
  transponderEntries: TransponderEntry[];
  isRegistrationOpen: boolean;
  currentRaceName: string;
  onToggleStatus: () => void;
  onLogout: () => void;
  onStartNewRace: (name: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  participants, 
  transponderEntries,
  isRegistrationOpen, 
  currentRaceName,
  onToggleStatus, 
  onLogout,
  onStartNewRace
}) => {
  const [activeTab, setActiveTab] = useState<'database' | 'live'>('database');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // New Race State
  const [showNewRaceForm, setShowNewRaceForm] = useState(false);
  const [newRaceName, setNewRaceName] = useState('');

  // Filtering Logic
  const filteredParticipants = participants.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.motoNumber.includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Combine Transponder Entry with Participant Details
  const activeRaceParticipants = transponderEntries.map(entry => {
    const participant = participants.find(p => p.id === entry.participantId);
    return {
      ...participant,
      checkInTime: entry.timestamp
    };
  }).filter(p => p.id) // Ensure valid participants found
  .filter(p => 
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.motoNumber?.includes(searchTerm) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics Calculation
  const stats: RegistrationStats = participants.reduce((acc, curr) => {
    acc.total++;
    acc.byCategory[curr.category] = (acc.byCategory[curr.category] || 0) + 1;
    return acc;
  }, { total: 0, byCategory: {} } as RegistrationStats);

  const chartData = Object.entries(stats.byCategory).map(([name, count]) => ({
    name,
    count
  }));

  // CSV Export (General Database)
  const downloadDatabaseCSV = () => {
    const headers = ["ID,Nombre Completo,Numero Moto,Categoria,Telefono,Residencia,Fecha Registro,Codigo Acceso"];
    const rows = participants.map(p => 
      `${p.id},"${p.fullName}",${p.motoNumber},"${p.category}","${p.phone}","${p.residence}",${p.registrationDate},${p.accessCode}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "base_datos_cie_2026.csv";
    link.click();
  };

  // CSV Export (Live Race)
  const downloadLiveRaceCSV = () => {
    const headers = ["Numero Moto,Piloto,Categoria,Hora Registro"];
    const rows = activeRaceParticipants.map(p => 
      `${p.motoNumber},"${p.fullName}","${p.category}",${new Date(p.checkInTime).toLocaleTimeString()}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `registro_transponder_${currentRaceName.replace(/\s+/g, '_').toLowerCase()}.csv`;
    link.click();
  };

  const handleAiAnalysis = async () => {
    setLoadingAnalysis(true);
    setAiAnalysis(null);
    const result = await analyzeRegistrations(participants);
    setAiAnalysis(result);
    setLoadingAnalysis(false);
  };

  const handleCreateRaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRaceName.trim()) {
      onStartNewRace(newRaceName);
      setNewRaceName('');
      setShowNewRaceForm(false);
      setActiveTab('live'); // Switch to live tab to see empty list
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Main Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Panel de Administración</h2>
          <p className="text-slate-500">Gestión de inscripciones y eventos</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors">
          <LogOut className="w-5 h-5" /> Salir
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Base de Datos CIE</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
            <Radio className="w-6 h-6" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-slate-500 font-medium truncate" title={currentRaceName}>
                Transponders: {currentRaceName}
            </p>
            <p className="text-2xl font-bold text-slate-800">{transponderEntries.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
           <div className={`p-2 rounded-lg ${isRegistrationOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isRegistrationOpen ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-medium">Registro Online</p>
            <div className="flex items-center gap-2">
                <p className={`font-bold ${isRegistrationOpen ? 'text-green-700' : 'text-red-700'}`}>
                {isRegistrationOpen ? 'Abierto' : 'Cerrado'}
                </p>
                <button onClick={onToggleStatus} className="text-xs underline text-slate-400 hover:text-slate-600">Cambiar</button>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 cursor-pointer hover:bg-slate-50" onClick={handleAiAnalysis}>
           <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Inteligencia Artificial</p>
            <p className="text-sm font-semibold text-purple-700">
                {loadingAnalysis ? 'Generando...' : 'Analizar Datos'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Result Section */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-6 relative">
            <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5" /> Análisis Gemini AI
            </h3>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{aiAnalysis}</p>
            <button 
                onClick={() => setAiAnalysis(null)} 
                className="absolute top-4 right-4 text-purple-400 hover:text-purple-600"
            >
                ✕
            </button>
        </div>
      )}

      {/* Main Content Area with Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Tabs Header */}
          <div className="flex border-b border-slate-200">
              <button 
                onClick={() => setActiveTab('database')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'database' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <Database className="w-4 h-4" /> Base de Datos (CIE)
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'live' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <Flag className="w-4 h-4" /> Carrera en Curso (Transponders)
              </button>
          </div>

          {/* Tab Content: Database (CIE) */}
          {activeTab === 'database' && (
             <div className="animate-fade-in">
                {/* Stats Chart only in database view */}
                <div className="p-6 border-b border-slate-200 bg-slate-50/30">
                     <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Distribución por Categoría
                    </h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={40} />
                                <YAxis allowDecimals={false} tick={{fontSize: 10}} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Pilotos" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                        type="text" 
                        placeholder="Buscar en base de datos..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button onClick={downloadDatabaseCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" /> Exportar CSV
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                            <th className="p-3 font-semibold">No. Moto</th>
                            <th className="p-3 font-semibold">Nombre</th>
                            <th className="p-3 font-semibold">Categoría</th>
                            <th className="p-3 font-semibold">Teléfono</th>
                            <th className="p-3 font-semibold">Código</th>
                            <th className="p-3 font-semibold">Fecha Registro</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {filteredParticipants.length > 0 ? (
                            filteredParticipants.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-blue-600">#{p.motoNumber}</td>
                                <td className="p-3 text-sm text-slate-800 font-medium">{p.fullName}</td>
                                <td className="p-3 text-sm text-slate-600">{p.category}</td>
                                <td className="p-3 text-xs text-slate-500">{p.phone}</td>
                                <td className="p-3 text-xs font-mono text-slate-500">{p.accessCode}</td>
                                <td className="p-3 text-xs text-slate-400">{new Date(p.registrationDate).toLocaleDateString()}</td>
                            </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-500">No se encontraron participantes.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
             </div>
          )}

          {/* Tab Content: Live Race (Transponders) */}
          {activeTab === 'live' && (
              <div className="animate-fade-in">
                  
                  {/* Actions Bar */}
                  <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                          <div className="bg-orange-200 p-2 rounded-full"><Flag className="w-5 h-5 text-orange-700" /></div>
                          <div>
                              <p className="text-xs text-orange-600 uppercase font-bold tracking-wider">Carrera Actual</p>
                              <h3 className="text-lg font-bold text-slate-800">{currentRaceName}</h3>
                          </div>
                      </div>

                      {showNewRaceForm ? (
                          <form onSubmit={handleCreateRaceSubmit} className="flex gap-2 w-full md:w-auto animate-fade-in">
                              <input 
                                type="text" 
                                placeholder="Nombre de la nueva carrera..."
                                value={newRaceName}
                                onChange={(e) => setNewRaceName(e.target.value)}
                                className="px-3 py-2 text-sm bg-white border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                autoFocus
                              />
                              <button type="submit" className="bg-orange-600 text-white px-3 py-2 rounded text-sm font-bold hover:bg-orange-700">Crear</button>
                              <button type="button" onClick={() => setShowNewRaceForm(false)} className="text-slate-500 px-2 hover:text-slate-700">✕</button>
                          </form>
                      ) : (
                        <button 
                            onClick={() => setShowNewRaceForm(true)}
                            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Iniciar Nueva Carrera
                        </button>
                      )}
                  </div>

                  {/* Toolbar */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                        type="text" 
                        placeholder="Buscar en lista de transponders..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <button onClick={downloadLiveRaceCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" /> Exportar Lista Transponders
                    </button>
                </div>

                {/* Specific Table for Transponders */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-orange-50 text-orange-800 text-xs uppercase tracking-wider">
                            <th className="p-4 font-bold border-b border-orange-100">No. Moto</th>
                            <th className="p-4 font-bold border-b border-orange-100">Piloto</th>
                            <th className="p-4 font-bold border-b border-orange-100">Categoría</th>
                            <th className="p-4 font-bold border-b border-orange-100 text-right">Hora Registro</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {activeRaceParticipants.length > 0 ? (
                            activeRaceParticipants.map((p) => (
                            <tr key={`${p.id}-${p.checkInTime}`} className="hover:bg-slate-50">
                                <td className="p-4 font-mono text-xl font-bold text-slate-800">#{p.motoNumber}</td>
                                <td className="p-4 text-base text-slate-700 font-medium">{p.fullName}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs uppercase font-bold tracking-wide">
                                        {p.category}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500 font-mono text-right">
                                    {new Date(p.checkInTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-400 flex flex-col items-center justify-center w-full">
                                    <List className="w-12 h-12 mb-2 opacity-20" />
                                    <p>No hay pilotos registrados en "{currentRaceName}" aún.</p>
                                    <p className="text-xs mt-1">Los pilotos aparecerán aquí cuando ingresen su código en la terminal.</p>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

              </div>
          )}

      </div>
    </div>
  );
};

export default AdminPanel;