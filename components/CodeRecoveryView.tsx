import React, { useState } from 'react';
import { Participant } from '../types';
import { User, Phone, Search, ArrowLeft, Key, ShieldAlert, CheckCircle } from 'lucide-react';

interface CodeRecoveryViewProps {
  participants: Participant[];
  onBack: () => void;
}

const CodeRecoveryView: React.FC<CodeRecoveryViewProps> = ({ participants, onBack }) => {
  const [formData, setFormData] = useState({ fullName: '', phone: '' });
  const [foundCode, setFoundCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFoundCode(null);

    const participant = participants.find(p => 
      p.fullName.trim().toLowerCase() === formData.fullName.trim().toLowerCase() &&
      p.phone.replace(/\D/g, '') === formData.phone.replace(/\D/g, '')
    );

    if (participant) {
      setFoundCode(participant.accessCode);
    } else {
      setError("No se encontró ningún registro con esos datos. Verifica que el nombre y teléfono sean los mismos que usaste en tu Registro de Números.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 md:mt-10 animate-fade-in">
      <button 
        onClick={onBack} 
        className="mb-4 text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors text-sm font-bold"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-6 text-center">
          <div className="bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Key className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Recuperar mi Código</h2>
          <p className="text-slate-400 text-xs mt-1">Ingresa tus datos registrados para recuperar tu acceso</p>
        </div>

        <div className="p-8">
          {foundCode ? (
            <div className="text-center animate-fade-in-up">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-green-700 font-bold uppercase tracking-widest mb-2">¡Código Encontrado!</p>
                <div className="text-5xl font-mono font-black text-slate-800 tracking-[0.2em] bg-white py-4 rounded-xl shadow-inner border border-green-200">
                  {foundCode}
                </div>
              </div>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Este es tu código único para el <span className="font-bold">Registro de Transponder</span> en cada fecha del CIE 2026.
              </p>
              <button 
                onClick={onBack}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
              >
                Entendido, ir al inicio
              </button>
            </div>
          ) : (
            <form onSubmit={handleRecover} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" /> Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-slate-300"
                  placeholder="Tal como lo registraste"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono Registrado
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-slate-300"
                  placeholder="Número de 10 dígitos"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-xs animate-shake">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span className="leading-tight font-medium">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-100 transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" /> Buscar mi código
              </button>
            </form>
          )}
        </div>
      </div>
      
      <p className="text-center mt-8 text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">CIE Security Layer // MotoReg v2.9</p>
    </div>
  );
};

export default CodeRecoveryView;