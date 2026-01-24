import React, { useState, useEffect } from 'react';
import { Participant, TransponderEntry } from './types';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';
import TransponderView from './components/TransponderView';
import LiveParticipantList from './components/LiveParticipantList';
import WelcomeView from './components/WelcomeView';
import CodeRecoveryView from './components/CodeRecoveryView';
import { ADMIN_PASSWORD } from './constants';
import { supabase, mapFromDb, mapToDb } from './services/supabase';
import { Bike, ShieldCheck, Lock, Radio, List, Loader2 } from 'lucide-react';

type ViewState = 'home' | 'registration' | 'admin' | 'login' | 'transponder' | 'public-list' | 'code-recovery';

function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transponderEntries, setTransponderEntries] = useState<TransponderEntry[]>([]);
  const [currentRaceName, setCurrentRaceName] = useState<string>("Carrera General");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Carga inicial de datos desde Supabase
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // 1. Participantes
        const { data: partData } = await supabase.from('participants').select('*');
        if (partData) setParticipants(mapFromDb(partData));

        // 2. Transponders
        const { data: transData } = await supabase.from('transponder_entries').select('*');
        if (transData) setTransponderEntries(mapFromDb(transData));

        // 3. Settings (Race Name & Status)
        const { data: settingsData } = await supabase.from('settings').select('*');
        if (settingsData) {
          const raceName = settingsData.find(s => s.key === 'race_name')?.value;
          const regStatus = settingsData.find(s => s.key === 'registration_open')?.value;
          if (raceName) setCurrentRaceName(raceName);
          if (regStatus !== undefined) setIsRegistrationOpen(regStatus === 'true');
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Suscripciones en tiempo real
    const participantsChannel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setParticipants(prev => [mapFromDb(payload.new) as Participant, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transponder_entries' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTransponderEntries(prev => [mapFromDb(payload.new) as TransponderEntry, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setTransponderEntries(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (payload) => {
        if (payload.new.key === 'race_name') setCurrentRaceName(payload.new.value);
        if (payload.new.key === 'registration_open') setIsRegistrationOpen(payload.new.value === 'true');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
    };
  }, []);

  const handleRegister = async (newParticipantData: Omit<Participant, 'id' | 'registrationDate'>) => {
    const dbData = mapToDb({
      ...newParticipantData,
      registrationDate: new Date().toISOString(),
    });

    const { error } = await supabase.from('participants').insert([dbData]);
    if (error) console.error("Error al registrar:", error);
  };

  const handleTransponderCheckIn = async (participantId: string) => {
    // Evitar duplicados
    if (transponderEntries.some(e => e.participantId === participantId)) return;

    const dbData = mapToDb({
        participantId,
        timestamp: new Date().toISOString()
    });

    const { error } = await supabase.from('transponder_entries').insert([dbData]);
    if (error) console.error("Error en check-in:", error);
  };

  const handleStartNewRace = async (raceName: string) => {
    // 1. Limpiar transponders en DB
    await supabase.from('transponder_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    setTransponderEntries([]);

    // 2. Actualizar nombre de carrera en settings
    await supabase.from('settings').upsert({ key: 'race_name', value: raceName });
    setCurrentRaceName(raceName);
  };

  const handleDeleteParticipant = async (id: string) => {
    // Eliminar de transponders primero (si hay FK) o manual
    await supabase.from('transponder_entries').delete().eq('participant_id', id);
    await supabase.from('participants').delete().eq('id', id);
  };

  const handleRemoveTransponderEntry = async (entryId: string) => {
    await supabase.from('transponder_entries').delete().eq('id', entryId);
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

  const toggleStatus = async () => {
    const newStatus = !isRegistrationOpen;
    await supabase.from('settings').upsert({ key: 'registration_open', value: newStatus.toString() });
    setIsRegistrationOpen(newStatus);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Conectando con CIE Cloud...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <WelcomeView onGoToRegistration={() => setCurrentView('registration')} onGoToTransponder={() => setCurrentView('transponder')} onViewPublicList={() => setCurrentView('public-list')} onGoToRecovery={() => setCurrentView('code-recovery')} />;
      case 'registration':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-center">
                 <div className="flex flex-col gap-2 max-w-[340px] w-full">
                    <button onClick={() => setCurrentView('public-list')} className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-6 py-4 rounded-xl shadow-md flex items-center gap-4 transition-transform hover:scale-105 w-full">
                        <List className="w-6 h-6 text-orange-500 shrink-0" />
                        <div className="text-left">
                            <span className="block text-xs text-slate-500 font-medium uppercase tracking-wide">Consulta</span>
                            <span className="block font-bold text-sm">Lista de Pilotos Registrados</span>
                        </div>
                    </button>
                 </div>
            </div>
            <RegistrationForm onRegister={handleRegister} isOpen={isRegistrationOpen} existingParticipants={participants} onGoToTransponder={() => setCurrentView('transponder')} />
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
            onDeleteParticipant={handleDeleteParticipant}
            onRemoveTransponderEntry={handleRemoveTransponderEntry}
          />
        );
      case 'transponder':
        return <TransponderView participants={participants} transponderEntries={transponderEntries} currentRaceName={currentRaceName} onCheckIn={handleTransponderCheckIn} onHome={() => setCurrentView('home')} onViewPublicList={() => setCurrentView('public-list')} />;
      case 'public-list':
        return <LiveParticipantList participants={participants} transponderEntries={transponderEntries} currentRaceName={currentRaceName} onBack={() => setCurrentView('home')} />;
      case 'code-recovery':
        return <CodeRecoveryView participants={participants} onBack={() => setCurrentView('home')} />;
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
                <input type="password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none placeholder-slate-400" placeholder="••••••" autoFocus />
                {loginError && <p className="text-red-500 text-xs mt-2">Contraseña incorrecta.</p>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setCurrentView('home')} className="w-1/3 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="w-2/3 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium">Entrar</button>
              </div>
            </form>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 font-bold text-xl cursor-pointer hover:text-orange-400 transition-colors" onClick={() => setCurrentView('home')}>
              <Bike className="w-8 h-8 text-orange-500" />
              <span className="tracking-tight">MOTO<span className="text-orange-500">REG</span></span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={() => setCurrentView('public-list')} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                <List className="w-4 h-4" /><span className="hidden sm:inline">Lista de Pilotos</span>
              </button>
              <button onClick={() => setCurrentView('login')} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                <ShieldCheck className="w-4 h-4" /><span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">{renderContent()}</main>
    </div>
  );
}

export default App;