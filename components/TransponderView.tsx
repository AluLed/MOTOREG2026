import React, { useState } from 'react';
import { Participant, TransponderEntry } from '../types';
import { Key, Radio, CheckCircle, LogIn, List, AlertCircle } from 'lucide-react';

interface TransponderViewProps {
  participants: Participant[];
  transponderEntries: TransponderEntry[];
  currentRaceName: string;
  onCheckIn: (participantId: string) => void;
  onHome: () => void;
  onViewPublicList: () => void;
}

const TransponderView: React.FC<TransponderViewProps> = ({ 
  participants, 
  transponderEntries,
  currentRaceName, 
  onCheckIn, 
  onHome,
  onViewPublicList
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [loggedInParticipant, setLoggedInParticipant] = useState<Participant | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const participant = participants.find(p => p.accessCode === accessCode);
    
    if (participant) {
      setLoggedInParticipant(participant);
      setError(null);
      setAccessCode('');
    } else {
      setError("Código inválido. Verifica el código de 4 dígitos generado en tu registro CIE.");
    }
  };

  const handleCheckIn = () => {
    if (loggedInParticipant) {
      // Logic to check if already checked in
      const isCheckedIn = transponderEntries.some(e => e.participantId === loggedInParticipant.id);
      if (!isCheckedIn) {
        onCheckIn(loggedInParticipant.id);
      }
    }
  };

  if (!loggedInParticipant) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <button onClick={onHome} className="mb-4 text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
            ← Volver al inicio
        </button>
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100">
          <div className="text-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <Radio className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Registro Transponder</h2>
            <p className="text-blue-600 font-black uppercase text-xs tracking-[0.2em] mt-2">{currentRaceName}</p>
            <p className="text-slate-500 text-sm mt-4 leading-relaxed">
                Ingresa el código de 4 dígitos de tu <span className="font-bold">Registro de Números CIE 2026</span> para confirmar tu asistencia a esta fecha.
            </p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Key className="w-4 h-4 text-slate-400" /> Código de Acceso
              </label>
              <input 
                type="text" 
                maxLength={4}
                inputMode="numeric"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g,''))}
                className="w-full px-4 py-4 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-slate-300 text-center text-3xl tracking-[0.5em] font-mono shadow-inner"
                placeholder="0000"
                autoFocus
              />
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs mt-3 bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <button 
              type="submit" 
              className="w-full px-4 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" /> Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isCheckedIn = transponderEntries.some(e => e.participantId === loggedInParticipant.id);
  
  return (
    <div className="max-w-md mx-auto animate-fade-in pt-4">
        <div className="flex justify-between items-center mb-6 px-1">
            <button onClick={() => setLoggedInParticipant(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest transition-colors">
                ← Cambiar Usuario
            </button>
            <div className="flex flex-col items-end">
                <span className="font-black text-slate-800">{loggedInParticipant.fullName}</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase">{loggedInParticipant.category}</span>
            </div>
        </div>

        <div className={`bg-white p-8 rounded-2xl shadow-xl border-t-8 transition-all ${isCheckedIn ? 'border-green-500' : 'border-blue-500'}`}>
            <div className="text-center mb-8">
                <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 mb-1">Estado de Fecha</h3>
                <p className="text-lg font-bold text-slate-800">{currentRaceName}</p>
            </div>
            
            {isCheckedIn ? (
                <div className="text-center py-4 animate-fade-in">
                    <div className="relative inline-block mb-6">
                        <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-sm border border-green-100">
                           <span className="text-[10px] font-black text-green-600 uppercase whitespace-nowrap">Listo para Carrera</span>
                        </div>
                    </div>
                    <p className="text-green-700 font-black text-xl mb-3 uppercase tracking-tight">Ya tienes tu transponder asignado</p>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
                        ¡Excelente! Tu registro para esta fecha está confirmado. Presenta una identificación oficial el día del evento para recibir tu Transponder.
                    </p>
                    
                    <button 
                        onClick={onViewPublicList}
                        className="w-full py-4 px-4 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                        <List className="w-5 h-5" /> Ver Lista de Pilotos
                    </button>
                </div>
            ) : (
                <div className="text-center py-4">
                    <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-blue-100">
                        <Radio className="w-10 h-10 text-blue-500 animate-pulse" />
                    </div>
                    <button 
                        onClick={handleCheckIn}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-6 rounded-2xl shadow-xl shadow-blue-100 transform transition-all active:scale-95 text-lg uppercase tracking-widest"
                    >
                        Registrar Asistencia
                    </button>
                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider">
                            Al confirmar asistencia se te incluirá en la lista oficial de la fecha <span className="text-blue-600">"{currentRaceName}"</span>.
                        </p>
                    </div>
                </div>
            )}
        </div>
        <p className="text-center mt-10 text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">CIE Official System // MotoReg v2.9</p>
    </div>
  );
};

export default TransponderView;