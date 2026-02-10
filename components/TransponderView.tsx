import React, { useState, useEffect } from 'react';
import { Participant, TransponderEntry } from '../types';
import { Key, Radio, CheckCircle, LogIn, List, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [isConfirming, setIsConfirming] = useState(false);

  // Limpiar errores visuales al escribir
  useEffect(() => {
    if (error) setError(null);
  }, [accessCode]);

  // Si ya estamos logueados y la lista de confirmados cambia, desactivar el spinner
  useEffect(() => {
    if (loggedInParticipant && transponderEntries.some(e => e.participantId === loggedInParticipant.id)) {
      setIsConfirming(false);
    }
  }, [transponderEntries, loggedInParticipant]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInputCode = accessCode.trim();
    
    if (cleanInputCode.length < 4) {
      setError("Ingresa el código completo de 4 dígitos.");
      return;
    }

    const found = (participants || []).find(p => {
      const pCode = String(p.accessCode || (p as any).access_code || '').trim();
      return pCode === cleanInputCode;
    });
    
    if (found && found.id) {
      setLoggedInParticipant(found);
      setAccessCode('');
      setError(null);
    } else {
      setError(participants.length === 0 
        ? "La base de datos está cargando. Espera unos segundos." 
        : "Código no reconocido. Verifica tus datos.");
    }
  };

  const handleConfirmCheckIn = async () => {
    if (loggedInParticipant && !isConfirming) {
      setIsConfirming(true);
      try {
        await onCheckIn(loggedInParticipant.id);
        // El useEffect se encargará de detectar el cambio en transponderEntries
      } catch (err) {
        setIsConfirming(false);
        setError("Error al enviar confirmación. Reintenta.");
      }
    }
  };

  // VISTA 1: FORMULARIO DE ACCESO
  if (!loggedInParticipant) {
    return (
      <div className="max-w-md mx-auto mt-6 px-4 animate-fade-in">
        <button onClick={onHome} className="mb-4 text-slate-400 hover:text-slate-800 flex items-center gap-1 transition-colors text-[10px] font-black uppercase tracking-widest">
            ← Menú Principal
        </button>
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4 rotate-3 shadow-xl shadow-blue-100">
              <Radio className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-3">Aparta tu Transponder</h2>
            <div className="inline-block bg-blue-50 text-blue-700 px-6 py-2 rounded-2xl font-black text-xl uppercase tracking-tight border border-blue-100 shadow-sm">
              {currentRaceName}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Código de Acceso (4 dígitos)</label>
              <input 
                type="text" 
                maxLength={4}
                inputMode="numeric"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g,''))}
                className="w-full px-4 py-6 bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-3xl focus:ring-0 outline-none text-center text-5xl tracking-[0.4em] font-mono transition-all focus:border-blue-500 shadow-inner"
                placeholder="0000"
                autoFocus
              />
              {error && (
                <div className="flex items-start gap-2 text-red-500 text-xs mt-4 bg-red-50 p-4 rounded-2xl border border-red-100 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-bold leading-tight">{error}</span>
                </div>
              )}
            </div>
            <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 active:scale-[0.97] transition-all font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-blue-100">
              <LogIn className="w-6 h-6" /> Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA 2: VENTANA DE CONFIRMACIÓN
  const isCheckedIn = (transponderEntries || []).some(e => e.participantId === loggedInParticipant.id);
  
  return (
    <div className="max-w-md mx-auto animate-fade-in pt-4 px-4">
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => setLoggedInParticipant(null)} className="text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest">
                ← Salir
            </button>
            <div className="flex flex-col items-end">
                <span className="font-black text-slate-900 text-sm">{loggedInParticipant.fullName}</span>
                <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-black tracking-tighter uppercase">#{loggedInParticipant.motoNumber} - {loggedInParticipant.category}</span>
            </div>
        </div>

        <div className={`bg-white p-8 rounded-[2.5rem] shadow-2xl border-t-[12px] transition-all transform ${isCheckedIn ? 'border-green-500' : 'border-blue-500'}`}>
            <div className="text-center mb-8">
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-1">Evento Activo:</h3>
                <p className="text-xl font-black text-slate-800 uppercase tracking-tight">{currentRaceName}</p>
            </div>
            
            {isCheckedIn ? (
                <div className="text-center py-4 animate-fade-in">
                    <CheckCircle className="w-28 h-28 text-green-500 mx-auto mb-8" />
                    <p className="text-green-700 font-black text-2xl mb-4 uppercase tracking-tighter">¡LISTO PARA CORRER!</p>
                    <p className="text-slate-500 text-sm leading-relaxed mb-10 px-4 font-medium">
                        Se te ha asignado tu Transponder. Recuerda entregar una identificación oficial a la hora de recoger tu Transponder en la Carpa de Meta.
                    </p>
                    <button onClick={onViewPublicList} className="w-full py-5 px-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl">
                        <List className="w-6 h-6" /> Ver Lista de Pilotos
                    </button>
                </div>
            ) : (
                <div className="text-center py-4">
                    <div className="bg-blue-50 w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-blue-100 rotate-6 shadow-inner">
                        <Radio className={`w-12 h-12 text-blue-500 ${isConfirming ? 'animate-spin' : 'animate-pulse'}`} />
                    </div>
                    <button 
                      onClick={handleConfirmCheckIn} 
                      disabled={isConfirming}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-6 px-8 rounded-3xl shadow-2xl transition-all active:scale-95 text-xl uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                        {isConfirming ? (
                          <> <RefreshCw className="w-6 h-6 animate-spin" /> Procesando... </>
                        ) : (
                          "CONFIRMAR"
                        )}
                    </button>
                    <p className="mt-8 text-[9px] text-slate-400 font-black uppercase tracking-widest px-6 leading-relaxed">
                        AL DAR CLIC EN CONFIRMAR, SE TE ASIGNARA UN TRANSPONDER PARA LA COMPETENCIA EN CUESTIÓN
                    </p>
                </div>
            )}
        </div>
        <p className="text-center mt-12 text-[9px] text-slate-300 font-black uppercase tracking-[0.5em]">CIE CLOUD SYSTEM // MOTOREG v2.9</p>
    </div>
  );
};

export default TransponderView;