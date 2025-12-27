import React, { useState, useEffect } from 'react';
import { Participant, Category, TransponderEntry } from './types';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';
import TransponderView from './components/TransponderView';
import LiveParticipantList from './components/LiveParticipantList';
import WelcomeView from './components/WelcomeView';
import { ADMIN_PASSWORD } from './constants';
import { Bike, ShieldCheck, Lock, Radio, List } from 'lucide-react';

type ViewState = 'home' | 'registration' | 'admin' | 'login' | 'transponder' | 'public-list';

function App() {
  // Application State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transponderEntries, setTransponderEntries] = useState<TransponderEntry[]>([]);
  const [currentRaceName, setCurrentRaceName] = useState<string>("Carrera General");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Persistence (LocalStorage Mock Backend)
  useEffect(() => {
    const savedData = localStorage.getItem('motoReg_participants');
    const savedStatus = localStorage.getItem('motoReg_status');
    const savedTransponders = localStorage.getItem('motoReg_transponders');
    const savedRaceName = localStorage.getItem('motoReg_raceName');
    
    if (savedData) {
      setParticipants(JSON.parse(savedData));
    }
    if (savedStatus) {
      setIsRegistrationOpen(JSON.parse(savedStatus));
    }
    if (savedTransponders) {
      setTransponderEntries(JSON.parse(savedTransponders));
    }
    if (savedRaceName) {
      setCurrentRaceName(JSON.parse(savedRaceName));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('motoReg_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('motoReg_status', JSON.stringify(isRegistrationOpen));
  }, [isRegistrationOpen]);

  useEffect(() => {
    localStorage.setItem('motoReg_transponders', JSON.stringify(transponderEntries));
  }, [transponderEntries]);

  useEffect(() => {
    localStorage.setItem('motoReg_raceName', JSON.stringify(currentRaceName));
  }, [currentRaceName]);

  // Handlers
  const handleRegister = (newParticipantData: Omit<Participant, 'id' | 'registrationDate'>) => {
    const newParticipant: Participant = {
      ...newParticipantData,
      id: crypto.randomUUID(), // Modern browser UUID
      registrationDate: new Date().toISOString(),
    };
    setParticipants(prev => [newParticipant, ...prev]);
  };

  const handleTransponderCheckIn = (participantId: string) => {
    const newEntry: TransponderEntry = {
        id: crypto.randomUUID(),
        participantId,
        timestamp: new Date().toISOString()
    };
    setTransponderEntries(prev => [newEntry, ...prev]);
  };

  const handleStartNewRace = (raceName: string) => {
    setTransponderEntries([]);
    setCurrentRaceName(raceName);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setCurrentView('admin');
      setAdminPasswordInput('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const toggleStatus = () => {
    setIsRegistrationOpen(prev => !prev);
  };

  // Render Views
  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <WelcomeView 
            onGoToRegistration={() => setCurrentView('registration')}
            onGoToTransponder={() => setCurrentView('transponder')}
            onViewPublicList={() => setCurrentView('public-list')}
          />
        );

      case 'registration':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-center">
                 {/* Public List Section */}
                 <div className="flex flex-col gap-2 max-w-[340px] w-full">
                    <button 
                        onClick={() => setCurrentView('public-list')}
                        className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-6 py-4 rounded-xl shadow-md flex items-center gap-4 transform transition-transform hover:scale-105 w-full"
                    >
                        <List className="w-6 h-6 text-orange-500 shrink-0" />
                        <div className="text-left">
                            <span className="block text-xs text-slate-500 font-medium uppercase tracking-wide">Consulta</span>
                            <span className="block font-bold text-sm">Lista de Pilotos Registrados</span>
                        </div>
                    </button>
                 </div>
            </div>

            <RegistrationForm 
                onRegister={handleRegister} 
                isOpen={isRegistrationOpen} 
                existingParticipants={participants}
                onGoToTransponder={() => setCurrentView('transponder')}
            />
          </div>
        );

      case 'admin':
        return (
          <AdminPanel 
            participants={participants}
            transponderEntries={transponderEntries}
            isRegistrationOpen={isRegistrationOpen}
            currentRaceName={currentRaceName}
            onToggleStatus={toggleStatus}
            onLogout={() => setCurrentView('home')}
            onStartNewRace={handleStartNewRace}
          />
        );
      
      case 'transponder':
        return (
            <TransponderView 
                participants={participants}
                transponderEntries={transponderEntries}
                currentRaceName={currentRaceName}
                onCheckIn={handleTransponderCheckIn}
                onHome={() => setCurrentView('home')}
                onViewPublicList={() => setCurrentView('public-list')}
            />
        );

      case 'public-list':
        return (
          <LiveParticipantList 
            participants={participants}
            transponderEntries={transponderEntries}
            currentRaceName={currentRaceName}
            onBack={() => setCurrentView('home')}
          />
        );

      case 'login':
        return (
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg mt-10">
            <div className="text-center mb-6">
              <div className="bg-slate-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-slate-700" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Acceso Administrativo</h2>
              <p className="text-slate-500 text-sm">Ingresa la contraseña para gestionar el evento</p>
            </div>
            <form onSubmit={handleAdminLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <input 
                  type="password" 
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none placeholder-slate-400"
                  placeholder="••••••"
                  autoFocus
                />
                {loginError && <p className="text-red-500 text-xs mt-2">Contraseña incorrecta. Intenta "admin".</p>}
              </div>
              <div className="flex gap-3">
                 <button 
                  type="button" 
                  onClick={() => setCurrentView('home')}
                  className="w-1/3 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center gap-2 font-bold text-xl cursor-pointer hover:text-orange-400 transition-colors"
              onClick={() => setCurrentView('home')}
            >
              <Bike className="w-8 h-8 text-orange-500" />
              <span className="tracking-tight">MOTO<span className="text-orange-500">REG</span></span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <button 
                onClick={() => setCurrentView('public-list')}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <List className="w-4 h-4" /> 
                <span className="hidden sm:inline">Lista de Pilotos</span>
              </button>
              
              {currentView !== 'admin' && currentView !== 'login' && (
                <button 
                  onClick={() => setCurrentView('login')}
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;