import React, { useState, useMemo } from 'react';
import { Participant, TransponderEntry, Category } from '../types';
import { CATEGORIES } from '../constants';
import { Search, Bike, Trophy, ArrowLeft, Filter, CheckCircle } from 'lucide-react';

interface LiveParticipantListProps {
  participants: Participant[];
  transponderEntries: TransponderEntry[];
  currentRaceName: string;
  onBack: () => void;
}

const LiveParticipantList: React.FC<LiveParticipantListProps> = ({ 
  participants, 
  transponderEntries, 
  currentRaceName,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // RULE: Strictly filter only participants who have a transponder entry for the current race
  const transponderPilotIds = useMemo(() => {
    return new Set(transponderEntries.map(e => e.participantId));
  }, [transponderEntries]);

  // Priority mapping based on CATEGORIES constant (Expertos -> 50cc)
  const categoryOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    CATEGORIES.forEach((cat, index) => { map[cat] = index; });
    return map;
  }, []);

  const filteredList = useMemo(() => {
    // Only process participants that actually performed the transponder check-in
    return participants
      .filter(p => transponderPilotIds.has(p.id))
      .filter(p => {
        const matchesSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.motoNumber.includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
          // 1. Sort by official category hierarchy
          const orderA = categoryOrderMap[a.category] ?? 999;
          const orderB = categoryOrderMap[b.category] ?? 999;
          if (orderA !== orderB) return orderA - orderB;
          
          // 2. Sort by moto number numerically
          const numA = parseInt(a.motoNumber.replace(/\D/g,'')) || 0;
          const numB = parseInt(b.motoNumber.replace(/\D/g,'')) || 0;
          if (numA !== numB) return numA - numB;
          
          // 3. Alphabetical sort if categories and numbers are the same (rare)
          return a.fullName.localeCompare(b.fullName);
      });
  }, [participants, transponderPilotIds, searchTerm, selectedCategory, categoryOrderMap]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1 mb-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver al Inicio
            </button>
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <Trophy className="text-orange-500 w-8 h-8 shrink-0" />
                Lista Oficial de Pilotos
            </h2>
            <p className="text-slate-500 flex items-center gap-2">
                Evento: <span className="font-bold text-blue-600 uppercase tracking-tight">{currentRaceName}</span>
            </p>
        </div>
        
        <div className="bg-orange-100 border border-orange-200 px-6 py-3 rounded-xl shadow-sm text-center min-w-[160px]">
            <p className="text-[10px] text-orange-700 font-black uppercase tracking-widest mb-1">Confirmados</p>
            <p className="text-3xl font-black text-slate-800 leading-none">{transponderEntries.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o número de moto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm outline-none"
                />
            </div>

            <div className="relative min-w-[240px]">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer shadow-sm text-slate-700 outline-none font-bold text-sm"
                >
                    <option value="all">Todas las Categorías</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-[0.2em] font-black">
                        <th className="p-4 border-b border-slate-800">No. Moto</th>
                        <th className="p-4 border-b border-slate-800">Nombre del Piloto</th>
                        <th className="p-4 border-b border-slate-800">Categoría</th>
                        <th className="p-4 border-b border-slate-800 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredList.length > 0 ? (
                        filteredList.map((p) => (
                            <tr key={p.id} className="hover:bg-green-50/30 transition-colors">
                                <td className="p-4">
                                    <div className="bg-slate-100 text-slate-800 font-mono font-black text-lg w-12 h-12 flex items-center justify-center rounded-lg border border-slate-200 shadow-inner">
                                        #{p.motoNumber}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{p.fullName}</div>
                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Piloto Oficial CIE</div>
                                </td>
                                <td className="p-4">
                                    <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black whitespace-nowrap uppercase tracking-widest border border-slate-300">
                                        {p.category}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-black text-[10px] border border-green-200 animate-fade-in uppercase tracking-widest">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        CONFIRMADO
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="p-20 text-center">
                                <Bike className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold text-lg">No hay pilotos con transponder registrado para esta carrera.</p>
                                <p className="text-slate-300 text-sm mt-1">La lista está actualmente vacía.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
            <p>Sincronizado en tiempo real</p>
            <p>MotoReg v2.9 // CIE Official</p>
        </div>
      </div>
    </div>
  );
};

export default LiveParticipantList;