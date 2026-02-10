
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
import { Bike, ShieldCheck, Lock, Radio, List, Loader2, AlertCircle, WifiOff, CloudOff } from 'lucide-react';

type ViewState = 'home' | 'registration' | 'admin' | 'login' | 'transponder' | 'public-list' | 'code-recovery';

function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transponderEntries, setTransponderEntries] = useState<TransponderEntry[]>([]);
  const [currentRaceName, setCurrentRaceName] = useState<string>("Carrera General");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Cargar datos locales o de Supabase
  const fetchData = async () => {
    // Si es la primera carga, mostramos el loader
    if (isLoading) setIsLoading(true);
    setDataError(null);

    // Intentar cargar de localStorage primero (Respaldo local rápido)
    const localParts = localStorage.getItem('motoreg_participants');
    const localTrans = localStorage.getItem('motoreg_transponders');
    const localRace = localStorage.getItem('motoreg_race_name');
    const localStatus = localStorage.getItem('motoreg_reg_open');

    if (localParts) setParticipants(JSON.parse(localParts));
    if (localTrans) setTransponderEntries(JSON.parse(localTrans));
    if (localRace) setCurrentRaceName(localRace);
    if (localStatus) setIsRegistrationOpen(localStatus === 'true');

    // Si Supabase está conectado, sincronizar todo
    if (supabase) {
      try {
        // 1. Sincronizar Participantes
        const { data: partData, error: partError } = await supabase.from('participants').select('*');
        if (!partError && partData) {
          const mapped = mapFromDb(partData);
          setParticipants(mapped);
          localStorage.setItem('motoreg_participants', JSON.stringify(mapped));
        }

        // 2. Sincronizar Transponders
        const { data: transData } = await supabase.from('transponder_entries').select('*');
        if (transData) {
          const mapped = mapFromDb(transData);
          setTransponderEntries(mapped);
          localStorage.setItem('motoreg_transponders', JSON.stringify(mapped));
        }

        // 3. Sincronizar Ajustes (Nombre de carrera y estado de registro)
        const { data: settingsData } = await supabase.from('settings').select('*');
        if (settingsData) {
          settingsData.forEach(s => {
            if (s.key === 'race_name') {
                setCurrentRaceName(s.value);
                localStorage.setItem('motoreg_race_name', s.value);
            }
            if (s.key === 'registration_open') {
                const isOpen = s.value === 'true';
                setIsRegistrationOpen(isOpen);
                localStorage.setItem('motoreg_reg_open', String(isOpen));
            }
          });
        }
      } catch (error) {
        console.warn("Error en sincronización con Supabase:", error);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Suscripciones en tiempo real para todas las tablas críticas
    if (supabase) {
      const channel = supabase.channel('app-sync-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
          fetchData(); 
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transponder_entries' }, () => {
          fetchData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
          fetchData(); // Esto actualizará el nombre de la carrera en todos los dispositivos
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, []);

  const handleRegister = async (newParticipantData: Omit<Participant, 'id' | 'registrationDate'>) => {
    const tempId = 'p_' + Date.now();
    const registrationDate = new Date().toISOString();
    const fullParticipant: Participant = { ...newParticipantData, id: tempId, registrationDate };

    // Optimismo local
    setParticipants(prev => [fullParticipant, ...prev]);

    if (supabase) {
      try {
        const dbData = mapToDb({ ...newParticipantData, registrationDate });
        const { data, error } = await supabase.from('participants').insert([dbData]).select();
        if (!error && data && data[0]) {
          const real = mapFromDb(data[0]) as Participant;
          setParticipants(prev => prev.map(p => p.id === tempId ? real : p));
        }
      } catch (e) { console.error("Error sincronizando registro:", e); }
    }
  };

  const handleTransponderCheckIn = async (participantId: string) => {
    const tempEntry: TransponderEntry = {
      id: 'temp_' + Date.now(),
      participantId: participantId,
      timestamp: new Date().toISOString()
    };
    
    setTransponderEntries(prev => [tempEntry, ...prev]);

    if (supabase) {
      try {
        const dbData = mapToDb({ participantId, timestamp: tempEntry.timestamp });
        const { data, error } = await supabase.from('transponder_entries').insert([dbData]).select();
        if (!error && data && data[0]) {
          const realEntry = mapFromDb(data[0]) as TransponderEntry;
          setTransponderEntries(prev => prev.map(e => e.id === tempEntry.id ? realEntry : e));
        }
      } catch (e) { console.error("Error sincronizando check-in:", e); }
    }
  };

  const handleStartNewRace = async (raceName: string) => {
    // 1. Limpieza local
    setTransponderEntries([]);
    setCurrentRaceName(raceName);
    
    // 2. Limpieza en Nube
    if (supabase) {
      try {
        // Eliminar todos los transponders de la tabla
        await supabase.from('transponder_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Actualizar el nombre de la carrera para que otros dispositivos lo vean
        await supabase.from('settings').upsert({ key: 'race_name', value: raceName });
      } catch (e) { console.error("Error al iniciar nueva carrera:", e); }
    }
  };

  const handleDeleteParticipant = async (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    setTransponderEntries(prev => prev.filter(e => e.participantId !== id));

    if (supabase) {
      try {
        await supabase.from('transponder_entries').delete().eq('participant_id', id);
        await supabase.from('participants').delete().eq('id', id);
      } catch (e) { console.error("Error al eliminar:", e); }
    }
  };

  const handleRemoveTransponderEntry = async (entryId: string) => {
    setTransponderEntries(prev => prev.filter(e => e.id !== entryId));
    if (supabase) {
      try {
        await supabase.from('transponder_entries').delete().eq('id', entryId);
      } catch (e) { console.error(e); }
    }
  };

  const toggleStatus = async () => {
    const nextStatus = !isRegistrationOpen;
    setIsRegistrationOpen(nextStatus);
    if (supabase) {
      try {
        await supabase.from('settings').upsert({ key: 'registration_open', value: String(nextStatus) });
      } catch (e) { console.error(e); }
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput.trim() === ADMIN_PASSWORD) {
      setCurrentView('admin');
      setAdminPasswordInput('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando MotoReg...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => setCurrentView('home')}>
            <Bike className="w-8 h-8 text-orange-500" />
            <span className="tracking-tight">MOTO<span className="text-orange-500">REG</span></span>
            {!supabase && (
              <span className="ml-2 flex items-center gap-1 bg-red-500/20 text-red-400 text-[8px] px-2 py-0.5 rounded-full border border-red-500/30 font-black uppercase tracking-widest">
                <WifiOff className="w-2 h-2" /> Local
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('public-list')} className="text-sm text-slate-300 hover:text-white flex items-center gap-1">
              <List className="w-4 h-4" /> <span className="hidden sm:inline">Pilotos</span>
            </button>
            <button onClick={() => setCurrentView('login')} className="text-sm text-slate-300 hover:text-white flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        {!supabase && currentView === 'home' && (
          <div className="mb-6 bg-blue-50 border border-blue-100 text-blue-700 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
            <CloudOff className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold">Modo Local: Los cambios se guardan solo en este equipo.</p>
          </div>
        )}

        {currentView === 'home' && <WelcomeView onGoToRegistration={() => setCurrentView('registration')} onGoToTransponder={() => setCurrentView('transponder')} onViewPublicList={() => setCurrentView('public-list')} onGoToRecovery={() => setCurrentView('code-recovery')} />}
        {currentView === 'registration' && <RegistrationForm onRegister={handleRegister} isOpen={isRegistrationOpen} existingParticipants={participants} onGoToTransponder={() => setCurrentView('transponder')} />}
        {currentView === 'transponder' && <TransponderView participants={participants} transponderEntries={transponderEntries} currentRaceName={currentRaceName} onCheckIn={handleTransponderCheckIn} onHome={() => setCurrentView('home')} onViewPublicList={() => setCurrentView('public-list')} />}
        {currentView === 'admin' && (
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
        )}
        {currentView === 'public-list' && <LiveParticipantList participants={participants} transponderEntries={transponderEntries} currentRaceName={currentRaceName} onBack={() => setCurrentView('home')} />}
        {currentView === 'code-recovery' && <CodeRecoveryView participants={participants} onBack={() => setCurrentView('home')} />}
        {currentView === 'login' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-2xl mt-10">
            <h2 className="text-2xl font-black text-slate-800 text-center mb-6">Acceso Admin</h2>
            <form onSubmit={handleAdminLogin}>
              <input 
                type="password" 
                value={adminPasswordInput} 
                onChange={(e) => setAdminPasswordInput(e.target.value)} 
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4 outline-none focus:ring-4 focus:ring-orange-500/10 text-center text-xl font-bold tracking-widest" 
                placeholder="••••••" 
                autoFocus 
              />
              {loginError && <p className="text-red-500 text-xs mb-4 font-bold text-center">Contraseña incorrecta.</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setCurrentView('home')} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-xs">Atrás</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs">Entrar</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
