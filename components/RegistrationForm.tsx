import React, { useState, useMemo } from 'react';
import { Category, Participant } from '../types';
import { CATEGORIES } from '../constants';
import { Send, User, Hash, Phone, MapPin, Award, CheckCircle, AlertCircle } from 'lucide-react';

interface RegistrationFormProps {
  onRegister: (participant: Omit<Participant, 'id' | 'registrationDate'>) => void;
  isOpen: boolean;
  existingParticipants: Participant[];
  onGoToTransponder: () => void;
}

interface CategoryRule {
  min?: number;
  max?: number;
  prefix?: string;
  prefixMin?: number;
  prefixMax?: number;
  desc: string;
}

const CATEGORY_RULES: Record<string, CategoryRule> = {
  [Category.Expertos]: { min: 1, max: 99, desc: "01 - 99" },
  [Category.Expertos30]: { min: 100, max: 199, desc: "100 - 199" },
  [Category.Avanzados]: { min: 200, max: 299, desc: "200 - 299" },
  [Category.Expertos40]: { min: 300, max: 399, desc: "300 - 399" },
  [Category.Intermedios]: { min: 400, max: 499, desc: "400 - 499" },
  [Category.Clase30]: { min: 500, max: 599, desc: "500 - 599" },
  [Category.Clase40]: { min: 600, max: 699, desc: "600 - 699" },
  [Category.Clase50]: { min: 700, max: 799, desc: "700 - 799" },
  [Category.Novatos]: { min: 800, max: 999, desc: "800 - 999" },
  [Category.Promocionales]: { min: 1000, max: 1099, desc: "1000 - 1099" },
  [Category.Femenil]: { prefix: 'F', prefixMin: 1, prefixMax: 99, desc: "F01 - F99" },
  [Category.CC85]: { prefix: 'J', prefixMin: 1, prefixMax: 99, desc: "J01 - J99" },
  [Category.CC65]: { prefix: 'I', prefixMin: 1, prefixMax: 99, desc: "I01 - I99" },
  [Category.CC50]: { prefix: 'I', prefixMin: 1, prefixMax: 99, desc: "I01 - I99" },
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegister, isOpen, existingParticipants, onGoToTransponder }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    motoNumber: '',
    category: CATEGORIES[0],
    phone: '',
    residence: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Calculate available numbers for the selected category
  const availableNumbers = useMemo(() => {
    const rule = CATEGORY_RULES[formData.category];
    if (!rule) return [];

    const allPossible: string[] = [];
    if (rule.prefix) {
      for (let i = rule.prefixMin!; i <= rule.prefixMax!; i++) {
        const formatted = `${rule.prefix}${i.toString().padStart(2, '0')}`;
        allPossible.push(formatted);
      }
    } else {
      for (let i = rule.min!; i <= rule.max!; i++) {
        const formatted = rule.desc.startsWith('0') && i < 10 ? i.toString().padStart(2, '0') : i.toString();
        allPossible.push(formatted);
      }
    }

    // Filter out numbers already taken in the general database
    const takenSet = new Set(existingParticipants.map(p => p.motoNumber.toUpperCase()));
    return allPossible.filter(n => !takenSet.has(n.toUpperCase()));
  }, [formData.category, existingParticipants]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If category changes, reset the moto number since the list changes
    if (name === 'category') {
      setFormData(prev => ({ ...prev, category: value as Category, motoNumber: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName || !formData.motoNumber || !formData.phone || !formData.residence) {
      setError("Por favor completa todos los campos y selecciona un número de moto disponible.");
      return;
    }

    // Generate 4 digit code
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(newCode);

    const normalizedData = {
      ...formData,
      motoNumber: formData.motoNumber.toUpperCase(),
      accessCode: newCode
    };

    onRegister(normalizedData);
    setSubmitted(true);
    setFormData({
      fullName: '',
      motoNumber: '',
      category: CATEGORIES[0],
      phone: '',
      residence: ''
    });
  };

  const handleFinishAndRedirect = () => {
    setSubmitted(false);
    setGeneratedCode("");
    onGoToTransponder();
  };

  if (!isOpen) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-8 bg-red-50 border border-red-200 rounded-xl text-center shadow-lg">
        <h2 className="text-2xl font-bold text-red-700 mb-2">Registro Cerrado</h2>
        <p className="text-red-600">Lo sentimos, las inscripciones para este evento han finalizado.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-8 bg-green-50 border border-green-200 rounded-xl text-center shadow-lg animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-green-700 mb-2 text-center">¡Registro de Números CIE 2026 Exitoso!</h2>
        <p className="text-green-600 mb-6">Tus datos han sido guardados correctamente.</p>
        
        <div className="bg-white p-6 rounded-lg border-2 border-dashed border-green-300 mb-6">
          <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide font-semibold">Tu código de acceso para el Registro de Transponder</p>
          <div className="text-5xl font-mono font-bold text-slate-800 tracking-widest">{generatedCode}</div>
          <p className="text-xs text-red-500 mt-2 font-medium">⚠️ GUARDA ESTE CÓDIGO. LO NECESITARÁS PARA QUE SE TE ASIGNE UN TRANSPONDER EN CADA FECHA</p>
        </div>

        <button 
          onClick={handleFinishAndRedirect}
          className="mt-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md flex items-center justify-center gap-2 mx-auto"
        >
          Entendido, ir a Registro de Transponder
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="bg-slate-900 px-6 py-6 border-b border-slate-700">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2 mb-2 text-center whitespace-nowrap overflow-hidden">
          <Award className="text-orange-500 w-6 h-6 sm:w-8 sm:h-8 shrink-0" />
          Registro de Números CIE 2026
        </h2>
        <p className="text-orange-400 italic text-sm px-4 text-justify">
          "Este paso se hace una sola vez al año. Si ya hiciste tu "Registro de Números CIE 2026" entonces ve directamente al "Registro de Transponder" (Botón en color Azul) con tu código de 4 números para que se te asigne un Transponder."
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-4 h-4 text-slate-500" /> Nombre Completo
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-slate-400"
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           {/* Category */}
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Award className="w-4 h-4 text-slate-500" /> Categoría
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Moto Number Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Hash className="w-4 h-4 text-slate-500" /> Número de Moto
            </label>
            <select
              name="motoNumber"
              value={formData.motoNumber}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 bg-slate-50 text-slate-900 border rounded-lg focus:ring-2 outline-none transition-all ${error && error.includes('número') ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-orange-500 focus:border-orange-500'}`}
            >
              <option value="">Selecciona un número disponible...</option>
              {availableNumbers.length > 0 ? (
                availableNumbers.map(num => (
                  <option key={num} value={num}>#{num}</option>
                ))
              ) : (
                <option disabled>No hay números disponibles en esta categoría</option>
              )}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Rango de categoría: <span className="font-semibold text-slate-700">{CATEGORY_RULES[formData.category].desc}</span>
            </p>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <Phone className="w-4 h-4 text-slate-500" /> Teléfono
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-slate-400"
            placeholder="Ej. 555-123-4567"
          />
        </div>

        {/* Residence */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-slate-500" /> Lugar de Residencia
          </label>
          <input
            type="text"
            name="residence"
            value={formData.residence}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-slate-400"
            placeholder="Ciudad, Estado"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-transform duration-100 active:scale-95 flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" /> Registrar mi número
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;