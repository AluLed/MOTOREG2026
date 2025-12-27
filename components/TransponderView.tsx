import React, { useState } from 'react';
import { Participant, TransponderEntry } from '../types';
import { Key, Radio, CheckCircle, LogIn, List } from 'lucide-react';

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
      // Check if already checked in
      const isCheckedIn = transponderEntries.some(e => e.participantId === loggedInParticipant.id);
      if (!isCheckedIn) {
        onCheckIn(loggedInParticipant.id);
      }
    }
  };

  if (!loggedInParticipant) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <button onClick={onHome} className="mb-4 text-slate-500 hover:text-slate-800 flex items-center gap-1">
            ← Volver al inicio
        </button>
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <Radio className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Registro Transponder</h2>
            <p className="text-blue-600 font-semibold mt-1">{currentRaceName}</p>
            <p className="text-slate-500 text-sm mt-2">
                Ingresa el código de 4 dígitos que obtuviste en tu Registro de Números CIE 2026 para que se te asigne un transponder para esta carrera.
            </p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Key className="w-4 h-4 text-slate-500" /> Código de Acceso
              </label>
              <input 
                type="text" 
                maxLength={4}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g,''))}
                className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-center text-2xl tracking-widest font-mono"
                placeholder="0000"
                autoFocus
              />
              {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
            </div>
            <button 
              type="submit" 
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md"
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
    <div className="max-w-md mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => setLoggedInParticipant(null)} className="text-slate-500 hover:text-slate-800 text-sm">
                ← Salir / Cambiar Usuario
            </button>
            <div className="flex items-center gap-2 text-slate-700">
                <span className="font-semibold">{loggedInParticipant.fullName}</span>
                <span className="bg-slate-200 px-2 py-0.5 rounded text-xs">{loggedInParticipant.category}</span>
            </div>
        </div>

        <div className={`bg-white p-8 rounded-xl shadow-lg border-t-4 ${isCheckedIn ? 'border-green-500' : 'border-blue-500'}`}>
            <h3 className="font-bold text-lg mb-2 text-slate-800 text-center">Estado de Carrera</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 text-center border-b pb-2">{currentRaceName}</p>
            
            {isCheckedIn ? (
                <div className="text-center py-4">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <p className="text-green-700 font-bold text-xl mb-2">¡Registrado con Transponder!</p>
                    <p className="text-slate-500 text-sm">Listo, no olvides llevar una identificación para que te entreguen tu transponder el día de la carrera.</p>
                    
                    <button 
                        onClick={onViewPublicList}
                        className="mt-8 w-full py-3 px-4 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-2 font-bold hover:bg-slate-800 transition-colors"
                    >
                        <List className="w-5 h-5" /> Ver Lista de Participantes
                    </button>
                </div>
            ) : (
                <div className="text-center py-4">
                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Radio className="w-10 h-10 text-blue-500" />
                    </div>
                    <button 
                        onClick={handleCheckIn}
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg transform transition-transform active:scale-95"
                    >
                        Registrar Asistencia
                    </button>
                    <p className="text-xs text-slate-400 mt-4 px-4">Al dar clic en Registrar Asistencia se te asignará tu transponder para esta carrera. ¡Gracias!</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default TransponderView;