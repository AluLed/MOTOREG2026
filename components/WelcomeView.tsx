import React from 'react';
import { ArrowRight, Radio, FileText, List, Key } from 'lucide-react';

interface WelcomeViewProps {
  onGoToRegistration: () => void;
  onGoToTransponder: () => void;
  onViewPublicList: () => void;
  onGoToRecovery: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ 
  onGoToRegistration, 
  onGoToTransponder, 
  onViewPublicList,
  onGoToRecovery
}) => {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in mt-4 md:mt-10">
      <div className="p-8 md:p-12 space-y-10">
        {/* Párrafo 1 */}
        <div className="space-y-6">
          <p className="text-slate-700 text-lg leading-relaxed text-justify">
            Para poder competir en cada una de las fechas del CIE 2026, es obligatorio escoger un número de piloto de acuerdo a la categoría en la que quieras participar. 
            Si aún no lo tienes, da clic en el botón de abajo y sigue las instrucciones.
          </p>
          <div>
            <button 
              onClick={onGoToRegistration}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-100 transition-all transform hover:scale-[1.02] active:scale-95 w-full sm:w-auto justify-center"
            >
              <FileText className="w-6 h-6" /> Registro de Números CIE 2026
            </button> 
          </div>
        </div>

        {/* Párrafo 2 */}
        <div className="space-y-6">
          <p className="text-slate-700 text-lg leading-relaxed text-justify">
            Si ya hiciste el paso anterior (Registro de Números CIE 2026), entonces ya cuentas con tú código de 4 dígitos. 
            Ese código es único y es valido para toda la temporada, <span className="font-black text-slate-900">"GUÁRDALO BIEN"</span> ya que lo necesitaras para ingresar al REGISTRO DE TRANSPONDER de cada fecha del calendario CIE 2026.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={onGoToTransponder}
                className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] active:scale-95 w-full sm:w-auto justify-center"
              >
                <Radio className="w-6 h-6 animate-pulse" />
                Ir al REGISTRO DE TRANSPONDER
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={onViewPublicList}
                className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg shadow-sm transition-all transform hover:scale-[1.02] active:scale-95 w-full sm:w-auto justify-center"
              >
                <List className="w-6 h-6 text-slate-400" />
                Ver Lista de Pilotos
              </button>
            </div>
            
            <div className="pt-2 text-center sm:text-left">
              <button 
                onClick={onGoToRecovery}
                className="inline-flex items-center gap-2 text-slate-400 hover:text-orange-600 text-xs font-black uppercase tracking-widest transition-colors group"
              >
                <Key className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                ¿Olvidaste tu código de 4 dígitos? Recuperar aquí
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer decorativo o informativo sutil */}
      <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
        <span>Sistema Oficial CIE 2026</span>
        <span>MotoReg v2.9</span>
      </div>
    </div>
  );
};

export default WelcomeView;