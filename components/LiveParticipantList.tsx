import React, { useState, useMemo } from 'react';
import { Participant, TransponderEntry, Category } from '../types';
import { CATEGORIES } from '../constants';
import { Search, Bike, Trophy, ArrowLeft, Filter } from 'lucide-react';

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

  const transponderMap = useMemo(() => {
    return new Set(transponderEntries.map(e => e.participantId));
  }, [transponderEntries]);

  const filteredList = useMemo(() => {
    return participants.filter(p => {
      const matchesSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.motoNumber.includes(searchTerm);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        // Sort by registered first, then category, then number
        const aHas = transponderMap.has(a.id);
        const bHas = transponderMap.has(b.id);
        if (aHas !== bHas) return aHas ? -1 : 1;
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.motoNumber.localeCompare(b.motoNumber);
    });
  }, [participants, transponderMap, searchTerm, selectedCategory]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1 mb-2">
                <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Trophy className="text-orange-500 w-8 h-8" />
                Lista de Pilotos
            </h2>
            <p className="text-slate-500 flex items-center gap-2">
                Evento: <span className="font-semibold text-blue-600">{currentRaceName}</span>
            </p>
        </div>
        
        <div className="bg-orange-100 border border-orange-200 px-4 py-2 rounded-lg">
            <p className="text-xs text-orange-700 font-bold uppercase tracking-wider">Transponders Asignados</p>
            <p className="text-2xl font-black text-slate-800">{transponderEntries.length} / {participants.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o número de moto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm"
                />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer shadow-sm text-slate-700"
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
                    <tr className="bg-slate-900 text-white uppercase text-xs tracking-widest font-bold">
                        <th className="p-4 border-b border-slate-800">No. Moto</th>
                        <th className="p-4 border-b border-slate-800">Nombre del Piloto</th>
                        <th className="p-4 border-b border-slate-800">Categoría</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredList.length > 0 ? (
                        filteredList.map((p) => {
                            const hasTransponder = transponderMap.has(p.id);
                            return (
                                <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${hasTransponder ? 'bg-green-50/30' : ''}`}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 text-slate-800 font-mono font-black text-lg w-12 h-12 flex items-center justify-center rounded-lg border border-slate-200">
                                                #{p.motoNumber}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{p.fullName}</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-tighter">Piloto Oficial CIE</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold whitespace-nowrap">
                                            {p.category}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={3} className="p-20 text-center">
                                <Bike className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium text-lg">No se encontraron pilotos con estos criterios.</p>
                                <button 
                                    onClick={() => {setSearchTerm(''); setSelectedCategory('all');}}
                                    className="mt-4 text-orange-600 font-bold hover:underline"
                                >
                                    Limpiar filtros
                                </button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 font-medium">
            <p>Mostrando {filteredList.length} pilotos de la base de datos.</p>
            <p>MotoReg v2.0 - Sistema Oficial CIE</p>
        </div>
      </div>
    </div>
  );
};

export default LiveParticipantList;