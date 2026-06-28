'use client';
import { useState, useEffect } from 'react';
import { 
  Bus, Shield, Bell, Navigation, CreditCard, Fuel, TrendingUp, AlertTriangle, 
  CheckCircle, MessageSquare, Send, RefreshCw, LogOut, ArrowRight, User 
} from 'lucide-react';

interface Matatu {
  reg: string;
  driverName: string;
  route: string;
  dailyTarget: number;
  status: 'Online' | 'In-transit' | 'Ended Shift';
  gpsDistanceKm: number;
  declaredOdometerDiff: number;
  declaredCash: number;
  declaredFuel: number;
  reconciled: boolean;
  leakageFlagged: boolean;
  mpesaRef?: string;
}

const initialMatatus: Matatu[] = [
  { 
    reg: 'KCA 789X', 
    driverName: 'Peter Mwangi', 
    route: '111 - Ngong to Nairobi CBD', 
    dailyTarget: 5000, 
    status: 'Ended Shift', 
    gpsDistanceKm: 148, 
    declaredOdometerDiff: 110, // Driver reports 110km, but GPS shows 148km!
    declaredCash: 3500, 
    declaredFuel: 3800, // Claimed more fuel expenses
    reconciled: false,
    leakageFlagged: true 
  },
  { 
    reg: 'KCC 102Y', 
    driverName: 'Josphat Otieno', 
    route: '46 - Kawangware to CBD', 
    dailyTarget: 4500, 
    status: 'Ended Shift', 
    gpsDistanceKm: 122, 
    declaredOdometerDiff: 120, // Honest driver
    declaredCash: 4500, 
    declaredFuel: 2800, 
    reconciled: true,
    leakageFlagged: false,
    mpesaRef: 'QKN7M1P9X'
  },
  { 
    reg: 'KCD 456Z', 
    driverName: 'Evans Kiprop', 
    route: '14 - Thika Road to CBD', 
    dailyTarget: 6000, 
    status: 'In-transit', 
    gpsDistanceKm: 85, 
    declaredOdometerDiff: 0, 
    declaredCash: 0, 
    declaredFuel: 0, 
    reconciled: false,
    leakageFlagged: false 
  }
];

interface ChatMessage {
  sender: 'driver' | 'bot';
  text: string;
  time: string;
}

export default function HomeView() {
  const [matatus, setMatatus] = useState<Matatu[]>([]);
  const [selectedMatatu, setSelectedMatatu] = useState<Matatu | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  // WhatsApp Bot Simulation States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setMatatus(initialMatatus);
    setSelectedMatatu(initialMatatus[0]);
    resetChat(initialMatatus[0]);
  }, []);

  const resetChat = (m: Matatu) => {
    setChatHistory([
      { sender: 'driver', text: `/start ${m.reg}. Starting shift. Odometer: 142,500 km.`, time: '06:00 AM' },
      { sender: 'bot', text: `🛡️ [Ma3 Ledger] Shift started for ${m.reg}. Target for route "${m.route}" is KES ${m.dailyTarget.toLocaleString()}. Drive safely!`, time: '06:01 AM' }
    ]);
    setCurrentStep(0);
  };

  // Simulate Driver submitting reports
  const triggerNextChatStep = async () => {
    if (!selectedMatatu || currentStep >= 2) return;
    
    setLoading(true);
    setLoadingMsg('Processing WhatsApp incoming webhook...');
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);

    if (currentStep === 0) {
      // Step 1: Driver submits end of shift details
      setChatHistory(prev => [
        ...prev,
        { 
          sender: 'driver', 
          text: `Ending shift for ${selectedMatatu.reg}.\nOdometer photo: [IMG_4902.jpg]\nEnding: 142,610 km (Diff: 110 km).\nFuel receipt: [IMG_4903.jpg] KES ${selectedMatatu.declaredFuel}.\nDeclared cash: KES ${selectedMatatu.declaredCash}.`, 
          time: '08:30 PM' 
        }
      ]);
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Step 2: Bot responds with Audit report
      const gpsKm = selectedMatatu.gpsDistanceKm;
      const expectedFuel = Math.round(gpsKm * 21); // KES 21 per km estimate
      const fuelDelta = selectedMatatu.declaredFuel - expectedFuel;
      const tripShortfall = selectedMatatu.dailyTarget - selectedMatatu.declaredCash;
      const totalLeakage = (gpsKm - selectedMatatu.declaredOdometerDiff) * 35 + Math.max(0, fuelDelta); // KES 35 per km trip estimate

      setChatHistory(prev => [
        ...prev,
        { 
          sender: 'bot', 
          text: `🚨 [Ma3 Ledger] SHIFT AUDIT LOG for ${selectedMatatu.reg}:\n` +
                `- GPS Distance: ${gpsKm} km (~10 trips)\n` +
                `- Driver Declared: ${selectedMatatu.declaredOdometerDiff} km (~7 trips)\n` +
                `⚠️ Discrepancy Mileage: +${gpsKm - selectedMatatu.declaredOdometerDiff} km untracked.\n` +
                `- Fuel claimed: KES ${selectedMatatu.declaredFuel} (Expected: KES ${expectedFuel})\n` +
                `❌ Profit Leakage Flagged: KES ${Math.round(totalLeakage).toLocaleString()}.\n\n` +
                `Please submit target KES ${selectedMatatu.dailyTarget.toLocaleString()} via Till 882194 to reconcile.`, 
          time: '08:32 PM' 
        }
      ]);
      setCurrentStep(2);
    }
  };

  // Reconcile / Lipa Na M-Pesa push
  const handleMpesaPush = async () => {
    if (!selectedMatatu) return;
    setLoading(true);
    setLoadingMsg(`Triggering Safaricom Daraja STK Push to driver's phone...`);
    await new Promise(r => setTimeout(r, 1500));
    setLoadingMsg(`Awaiting payment confirmation webhook...`);
    await new Promise(r => setTimeout(r, 1200));
    
    // Update local state to reconciled
    const updated = matatus.map(m => {
      if (m.reg === selectedMatatu.reg) {
        return { 
          ...m, 
          reconciled: true, 
          leakageFlagged: false,
          mpesaRef: 'MPESA' + Math.floor(100000 + Math.random() * 900000) 
        };
      }
      return m;
    });
    setMatatus(updated);
    const targetMatatu = updated.find(m => m.reg === selectedMatatu.reg);
    if (targetMatatu) setSelectedMatatu(targetMatatu);
    
    setLoading(false);
    alert(`M-Pesa payment received! Shift successfully reconciled.`);
  };

  const totalGPSMileage = matatus.reduce((acc, m) => acc + m.gpsDistanceKm, 0);
  const totalTargetShortfalls = matatus.filter(m => !m.reconciled).reduce((acc, m) => acc + (m.dailyTarget - m.declaredCash), 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-[#f3f4f6]">
      {/* Top Header */}
      <header className="bg-[#0b0f19] border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Bus size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white font-sans">
            Ma3<span className="text-[#10B981]">Ledger</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">Owner Portal: <b>Kawangware/Ngong Routes</b></span>
          <button className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-white/10" onClick={() => alert('Logs cleared.')}>Reset Demo</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0b0f19] border-r border-white/5 p-5 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3">Fleet Overview</span>
              {matatus.map((m, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setSelectedMatatu(m); resetChat(m); }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${selectedMatatu?.reg === m.reg ? 'bg-emerald-500/10 border border-emerald-500/20 text-[#10B981]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bus size={14} />
                    <span className="text-xs font-bold">{m.reg}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${m.status === 'Ended Shift' ? 'bg-gray-500' : 'bg-emerald-400 animate-pulse'}`}></span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-4 space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3">Leakage Alerts</span>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <AlertTriangle size={14} /> Fuel & Mileage Discrepancy
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">
                  GPS mileage exceeds driver logs by <b>38 km</b> in KCA 789X. Target shortfall: KES 1,500.
                </p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 text-center">
            Ma3Ledger v1.0 • eTIMS Compliant
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto bg-gradient-to-b from-[#10B981]/[0.02] to-transparent">
          {selectedMatatu && (
            <div className="space-y-6">
              
              {/* Header Stats */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-extrabold text-white">{selectedMatatu.reg}</h1>
                  <span className="text-xs text-gray-400">Driver: <b>{selectedMatatu.driverName}</b> • {selectedMatatu.route}</span>
                </div>
                <div className="flex gap-2">
                  {!selectedMatatu.reconciled && selectedMatatu.status === 'Ended Shift' && (
                    <button onClick={handleMpesaPush} className="bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                      <CreditCard size={13} /> Settle Target (STK Push)
                    </button>
                  )}
                  <button onClick={() => resetChat(selectedMatatu)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3.5 py-2 rounded-lg border border-white/5 flex items-center gap-1.5">
                    <RefreshCw size={12} /> Reset Audit
                  </button>
                </div>
              </div>

              {/* Audit Summary Grid */}
              <div className="grid grid-cols-3 gap-5">
                <div className="bg-gray-900/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-1.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-[3px] before:h-full before:bg-[#10B981]">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><Navigation size={10} /> GPS Trip verification</span>
                  <span className="text-xl font-extrabold text-white">{selectedMatatu.gpsDistanceKm} km</span>
                  <span className="text-[10px] text-gray-400">Expected: ~10 complete route cycles</span>
                </div>
                <div className="bg-gray-900/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-1.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-[3px] before:h-full before:bg-blue-400">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><Fuel size={10} /> expected fuel burn</span>
                  <span className="text-xl font-extrabold text-white">KES {Math.round(selectedMatatu.gpsDistanceKm * 21).toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400">Declared expense: KES {selectedMatatu.declaredFuel.toLocaleString()}</span>
                </div>
                <div className={`bg-gray-900/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-1.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-[3px] before:h-full ${selectedMatatu.leakageFlagged ? 'before:bg-amber-400' : 'before:bg-emerald-400'}`}>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><TrendingUp size={10} /> Leakage delta</span>
                  <span className="text-xl font-extrabold text-white">
                    {selectedMatatu.leakageFlagged 
                      ? `KES ${Math.round((selectedMatatu.gpsDistanceKm - selectedMatatu.declaredOdometerDiff) * 35).toLocaleString()}`
                      : 'KES 0'
                    }
                  </span>
                  <span className="text-[10px] text-gray-400">{selectedMatatu.leakageFlagged ? 'Unreconciled mileage detected' : 'Perfect reconciliation'}</span>
                </div>
              </div>

              {/* Two Column Layout: Reconciler vs WhatsApp Bot Simulator */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* COLUMN 1: TRIP LEDGER RECONCILER */}
                <div className="bg-gray-900/45 border border-white/5 rounded-3xl p-6 space-y-6 shadow-2xl backdrop-blur-md">
                  <h3 className="font-extrabold text-base text-white">Shift Audit Details</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className="text-gray-400">Daily Target Limit</span>
                      <strong className="text-white">KES {selectedMatatu.dailyTarget.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className="text-gray-400">Driver Declared Cash</span>
                      <strong className="text-white">KES {selectedMatatu.declaredCash.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className="text-gray-400">GPS Tracked Distance</span>
                      <strong className="text-white">{selectedMatatu.gpsDistanceKm} km</strong>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className="text-gray-400">Odometer Reported Distance</span>
                      <strong className="text-white">{selectedMatatu.declaredOdometerDiff} km</strong>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className="text-gray-400">Reconciliation Status</span>
                      <div>
                        {selectedMatatu.reconciled ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-[#10B981] border-emerald-500/20">Reconciled ({selectedMatatu.mpesaRef})</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">Awaiting Target Settlement</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedMatatu.leakageFlagged && (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <AlertTriangle size={14} /> Audit Explanation
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        The driver reports <b>110 km</b> covered (approx. 7 cycles) but the vehicle's onboard GPS tracker logged <b>148 km</b>. This indicates an estimated <b>38 km</b> of untracked travel (approx. 3 unregistered trips) pocketed directly by the driver.
                      </p>
                    </div>
                  )}
                </div>

                {/* COLUMN 2: WHATSAPP BOT EMULATOR */}
                <div className="bg-[#0b141a] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[420px] shadow-2xl">
                  {/* WhatsApp Header */}
                  <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                        <Shield size={14} className="text-white" />
                      </div>
                      <div>
                        <strong className="text-xs text-white block">Ma3 Ledger Audit Bot</strong>
                        <span className="text-[9px] text-[#10B981] font-semibold">Online & Verified</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-400">WhatsApp Gateway</span>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-slate-900 bg-blend-multiply">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl p-3.5 text-xs shadow ${msg.sender === 'driver' ? 'bg-[#005c4b] text-white rounded-tr-none' : 'bg-[#202c33] text-gray-100 rounded-tl-none'}`}>
                          <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                          <span className="text-[8px] text-gray-400 text-right block mt-1">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input Simulation Footer */}
                  <div className="bg-[#202c33] p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 bg-[#2a3942] rounded-xl px-4 py-2 text-xs text-gray-400 italic">
                      {currentStep === 0 && "Simulate Driver submitting end-of-shift logs..."}
                      {currentStep === 1 && "Simulate Bot issuing discrepancy report..."}
                      {currentStep === 2 && "Audit complete. Target is awaiting settlement."}
                    </div>
                    {currentStep < 2 && (
                      <button onClick={triggerNextChatStep} className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#008f72] flex items-center justify-center text-white transition-all shadow">
                        <Send size={12} />
                      </button>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}
        </main>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-8 text-center space-y-3 max-w-xs">
            <div className="spinner"></div>
            <strong className="block text-xs text-gray-300 animate-pulse">{loadingMsg}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
