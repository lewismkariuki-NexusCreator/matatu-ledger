'use client';
import { useState, useEffect } from 'react';
import { 
  Bus, Shield, Navigation, CreditCard, Fuel, TrendingUp, AlertTriangle, 
  CheckCircle, Send, RefreshCw, BarChart2, Users, LayoutDashboard, Settings, Info, ArrowUpRight 
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
  leakageVal: number;
  mpesaRef?: string;
  routeLen: number;
}

const initialMatatus: Matatu[] = [
  { 
    reg: 'KAA 456B', 
    driverName: 'John Kamau', 
    route: 'CBD to Kawangware', 
    dailyTarget: 7000, 
    status: 'Ended Shift', 
    gpsDistanceKm: 308, 
    declaredOdometerDiff: 224, 
    declaredCash: 6000, 
    declaredFuel: 3800, 
    reconciled: false,
    leakageFlagged: true,
    leakageVal: 2000,
    routeLen: 28
  },
  { 
    reg: 'KBB 789C', 
    driverName: 'Peter Mwangi', 
    route: 'CBD to Eastleigh', 
    dailyTarget: 7000, 
    status: 'Ended Shift', 
    gpsDistanceKm: 176, 
    declaredOdometerDiff: 128, 
    declaredCash: 4000, 
    declaredFuel: 2800, 
    reconciled: false,
    leakageFlagged: true,
    leakageVal: 3000,
    routeLen: 16
  },
  { 
    reg: 'KCC 123D', 
    driverName: 'Moses Ochieng', 
    route: 'CBD to Ngong', 
    dailyTarget: 5000, 
    status: 'Ended Shift', 
    gpsDistanceKm: 396, 
    declaredOdometerDiff: 380, 
    declaredCash: 5000, 
    declaredFuel: 3200, 
    reconciled: true,
    leakageFlagged: false,
    leakageVal: 30,
    routeLen: 44,
    mpesaRef: 'MPESA993821'
  }
];

interface ShiftReport {
  vehicle: string;
  driver: string;
  date: string;
  gpsKm: number;
  declared: number;
  expected: number;
  leakage: number;
  status: 'ALERT' | 'WARN' | 'OK';
}

const initialShiftReports: ShiftReport[] = [
  { vehicle: 'KCC 123D', driver: 'Moses Ochieng', date: '2026-06-22', gpsKm: 484, declared: 6000, expected: 7000, leakage: 503, status: 'WARN' },
  { vehicle: 'KBB 789C', driver: 'Peter Mwangi', date: '2026-06-22', gpsKm: 176, declared: 4000, expected: 7000, leakage: 3000, status: 'ALERT' },
  { vehicle: 'KAA 456B', driver: 'John Kamau', date: '2026-06-22', gpsKm: 224, declared: 4000, expected: 5000, leakage: 2000, status: 'WARN' },
  { vehicle: 'KCC 123D', driver: 'Moses Ochieng', date: '2026-06-23', gpsKm: 352, declared: 4000, expected: 5000, leakage: 468, status: 'WARN' },
  { vehicle: 'KBB 789C', driver: 'Peter Mwangi', date: '2026-06-23', gpsKm: 128, declared: 3000, expected: 5000, leakage: 2000, status: 'ALERT' },
  { vehicle: 'KAA 456B', driver: 'John Kamau', date: '2026-06-23', gpsKm: 280, declared: 5000, expected: 6000, leakage: 2000, status: 'WARN' }
];

interface ChatMessage {
  sender: 'driver' | 'bot';
  text: string;
  time: string;
}

export default function HomeView() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'fleet' | 'settings'>('dashboard');
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
      { sender: 'bot', text: `🛡️ [Safiri Bot] Shift started for ${m.reg}. Target is KES ${m.dailyTarget.toLocaleString()}. Drive safely!`, time: '06:01 AM' }
    ]);
    setCurrentStep(0);
  };

  const triggerNextChatStep = async () => {
    if (!selectedMatatu || currentStep >= 2) return;
    
    setLoading(true);
    setLoadingMsg('Processing WhatsApp webhook payload...');
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);

    if (currentStep === 0) {
      setChatHistory(prev => [
        ...prev,
        { 
          sender: 'driver', 
          text: `Ending shift for ${selectedMatatu.reg}.\nOdometer photo: [IMG_5502.jpg]\nEnding: 142,628 km.\nFuel receipt: [IMG_5503.jpg] KES ${selectedMatatu.declaredFuel}.\nDeclared cash: KES ${selectedMatatu.declaredCash}.`, 
          time: '08:30 PM' 
        }
      ]);
      setCurrentStep(1);
    } else if (currentStep === 1) {
      const gpsKm = selectedMatatu.gpsDistanceKm;
      const expectedFuel = Math.round(gpsKm * 21);
      const fuelDelta = selectedMatatu.declaredFuel - expectedFuel;
      const totalLeakage = selectedMatatu.leakageVal;

      setChatHistory(prev => [
        ...prev,
        { 
          sender: 'bot', 
          text: `🚨 [Safiri Audit] SHIFT AUDIT REPORT for ${selectedMatatu.reg}:\n` +
                `- GPS Tracked: ${gpsKm} km\n` +
                `- Driver Declared: ${selectedMatatu.declaredOdometerDiff} km\n` +
                `⚠️ Discrepancy: +${gpsKm - selectedMatatu.declaredOdometerDiff} km untracked.\n` +
                `- Fuel claimed: KES ${selectedMatatu.declaredFuel} (Expected: KES ${expectedFuel})\n` +
                `❌ Profit Leakage: KES ${totalLeakage.toLocaleString()}.\n\n` +
                `Please submit target KES ${selectedMatatu.dailyTarget.toLocaleString()} via Paybill 882194 to settle.`, 
          time: '08:32 PM' 
        }
      ]);
      setCurrentStep(2);
    }
  };

  const handleMpesaPush = async () => {
    if (!selectedMatatu) return;
    setLoading(true);
    setLoadingMsg(`Triggering Safaricom Daraja STK Push to driver's phone...`);
    await new Promise(r => setTimeout(r, 1200));
    setLoadingMsg(`Awaiting target payment confirmation...`);
    await new Promise(r => setTimeout(r, 1000));
    
    const updated = matatus.map(m => {
      if (m.reg === selectedMatatu.reg) {
        return { 
          ...m, 
          reconciled: true, 
          leakageFlagged: false,
          leakageVal: 0,
          mpesaRef: 'MPESA' + Math.floor(100000 + Math.random() * 900000) 
        };
      }
      return m;
    });
    setMatatus(updated);
    const targetMatatu = updated.find(m => m.reg === selectedMatatu.reg);
    if (targetMatatu) setSelectedMatatu(targetMatatu);
    
    setLoading(false);
    alert(`Target payment settled via M-Pesa. Shift reconciled successfully!`);
  };

  const totalLeakageToday = matatus.reduce((acc, m) => acc + m.leakageVal, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0f14] text-[#f3f4f6] font-sans">
      {/* Top Header */}
      <header className="bg-[#080a0f]/90 border-b border-white/5 px-8 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-lg shadow-orange-500/10">
            <Bus size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Safiri
          </span>
          <span className="text-[10px] bg-orange-500/10 text-orange-400 font-bold px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-wider">Fleet Intelligence</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">Connected System: <b>Nairobi PSRA/NTSA Roster</b></span>
          <button className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-white/10" onClick={() => { setMatatus(initialMatatus); alert('Demo parameters reset.'); }}>Reset Demo</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-[#080a0f] border-r border-white/5 p-5 flex flex-col justify-between">
          <div className="space-y-6">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 block">Operations</span>
            
            <div className="space-y-1.5">
              <div 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${activeTab === 'dashboard' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <LayoutDashboard size={14} /> Fleet Dashboard
              </div>
              <div 
                onClick={() => { setActiveTab('ledger'); if(!selectedMatatu && matatus.length > 0) setSelectedMatatu(matatus[0]); }}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${activeTab === 'ledger' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex items-center gap-3">
                  <Navigation size={14} /> Trip Ledger
                </div>
                {matatus.some(m => !m.reconciled) && (
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                )}
              </div>
              <div 
                onClick={() => setActiveTab('fleet')}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${activeTab === 'fleet' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Users size={14} /> Active Drivers
              </div>
              <div 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${activeTab === 'settings' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Settings size={14} /> Settings
              </div>
            </div>
          </div>

          {/* Sidebar Bottom Widgets */}
          <div className="space-y-4">
            <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-4 space-y-2">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Total Fleet Revenue</span>
              <strong className="text-xl font-extrabold text-white block">KES 15K</strong>
              <span className="text-[10px] text-emerald-400 font-semibold block">31 trips declared today</span>
            </div>

            <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-4 space-y-2">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Today's Leakage</span>
              <strong className="text-xl font-extrabold text-orange-400 block">KES {totalLeakageToday.toLocaleString()}</strong>
              <span className="text-[10px] text-gray-400 block">Across {matatus.filter(m => m.leakageVal > 50).length} vehicles</span>
            </div>
          </div>
        </aside>

        {/* Main Viewport Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-gradient-to-b from-[#f97316]/[0.01] to-transparent">
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Hero Leakage Card */}
              <div className="bg-[#1c1d24]/65 border border-white/5 rounded-3xl p-6 shadow-2xl backdrop-blur-md grid grid-cols-3 gap-6 items-center">
                <div className="col-span-2 space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Estimated Daily Leakage</span>
                  <div className="text-5xl font-extrabold tracking-tight text-white flex items-baseline gap-2">
                    KES {totalLeakageToday.toLocaleString()}
                  </div>
                  <span className="text-xs text-gray-400 block">Identified across active routes today</span>
                </div>
                <div className="space-y-3 border-l border-white/5 pl-6">
                  {matatus.map((m, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400">
                        <span>{m.reg}</span>
                        <span>KES {m.leakageVal.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${m.leakageVal > 1000 ? 'bg-orange-500' : 'bg-orange-500/40'}`} 
                          style={{ width: `${Math.min(100, (m.leakageVal / 3500) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Second Metrics Row */}
              <div className="grid grid-cols-4 gap-5">
                <div className="bg-gray-900/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Declared Revenue</span>
                  <strong className="text-xl font-extrabold text-white">KES 15K</strong>
                  <span className="text-[10px] text-gray-400">31 trips declared</span>
                </div>
                <div className="bg-gray-900/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Expected Revenue</span>
                  <strong className="text-xl font-extrabold text-white">KES 19K</strong>
                  <span className="text-[10px] text-gray-400">GPS estimated total</span>
                </div>
                <div className="bg-gray-900/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fuel Discrepancy</span>
                  <strong className="text-xl font-extrabold text-white">KES 2K</strong>
                  <span className="text-[10px] text-orange-400 font-medium">Declared vs expected</span>
                </div>
                <div className="bg-gray-900/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">GPS Mileage</span>
                  <strong className="text-xl font-extrabold text-white">880 km</strong>
                  <span className="text-[10px] text-gray-400">Fleet total today</span>
                </div>
              </div>

              {/* Fleet Scan Cards Grid */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-base text-white">Fleet Scan</h3>
                <div className="grid grid-cols-3 gap-5">
                  {matatus.map((m, idx) => (
                    <div 
                      key={idx}
                      onClick={() => { setSelectedMatatu(m); resetChat(m); setActiveTab('ledger'); }}
                      className="bg-gray-900/40 border border-white/5 hover:border-orange-500/30 rounded-2xl p-5 space-y-4 cursor-pointer transition-all hover:shadow-2xl"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-base font-extrabold text-white block">{m.reg}</strong>
                          <span className="text-[10px] text-gray-400">{m.route} • {m.routeLen}km</span>
                        </div>
                        <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${m.leakageVal > 1000 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-gray-500/10 text-gray-400 border border-white/5'}`}>
                          {m.leakageVal > 1000 ? 'HIGH LEAK' : 'FLAGGED'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs border-b border-white/5 pb-3">
                        <div className="flex justify-between"><span className="text-gray-400">Driver</span><span className="text-white font-semibold">{m.driverName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">GPS km</span><span className="text-orange-400 font-bold">{m.gpsDistanceKm}km</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Cash declared</span><span className="text-white">KES {(m.declaredCash/1000)}K</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Expected Target</span><span className="text-emerald-400 font-bold">KES {(m.dailyTarget/1000)}K</span></div>
                      </div>

                      <div className="text-center bg-white/5 rounded-xl py-3 border border-white/5">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">LEAKAGE</span>
                        <strong className="text-lg font-extrabold text-white">KES {m.leakageVal.toLocaleString()}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Shift Reports Table */}
              <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-white">Recent Shift Reports</h3>
                  <span className="text-[10px] text-gray-500">Showing last 6 records</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400">
                      <th className="py-2.5">Vehicle</th>
                      <th className="py-2.5">Driver</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">GPS km</th>
                      <th className="py-2.5">Declared</th>
                      <th className="py-2.5">Expected</th>
                      <th className="py-2.5">Leakage</th>
                      <th className="py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialShiftReports.map((s, idx) => (
                      <tr key={idx} className="border-b border-white/[0.02]">
                        <td className="py-3 font-bold text-white">{s.vehicle}</td>
                        <td className="py-3">{s.driver}</td>
                        <td className="py-3 text-gray-400">{s.date}</td>
                        <td className="py-3 font-semibold text-orange-400">{s.gpsKm}km</td>
                        <td className="py-3">KES {s.declared.toLocaleString()}</td>
                        <td className="py-3 text-emerald-400 font-medium text-left">KES {s.expected.toLocaleString()}</td>
                        <td className="py-3 text-orange-500 font-bold">KES {s.leakage.toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${s.status === 'ALERT' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : s.status === 'WARN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: TRIP LEDGER DETAILS */}
          {activeTab === 'ledger' && selectedMatatu && (
            <div className="space-y-6">
              
              {/* Detailed Header Switcher */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-extrabold text-white">{selectedMatatu.reg}</h1>
                    <select 
                      value={selectedMatatu.reg} 
                      onChange={(e) => {
                        const target = matatus.find(m => m.reg === e.target.value);
                        if(target) { setSelectedMatatu(target); resetChat(target); }
                      }}
                      className="bg-gray-900 border border-white/5 text-gray-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {matatus.map((m, i) => (
                        <option key={i} value={m.reg}>{m.reg}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs text-gray-400">Driver: <b>{selectedMatatu.driverName}</b> • {selectedMatatu.route}</span>
                </div>
                <div className="flex gap-2">
                  {!selectedMatatu.reconciled && (
                    <button onClick={handleMpesaPush} className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                      <CreditCard size={13} /> Settle Target (STK Push)
                    </button>
                  )}
                  <button onClick={() => resetChat(selectedMatatu)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3.5 py-2 rounded-lg border border-white/5 flex items-center gap-1.5">
                    <RefreshCw size={12} /> Reset Audit
                  </button>
                </div>
              </div>

              {/* 3-Card Detailed Metrics Grid */}
              <div className="grid grid-cols-3 gap-5">
                <div className="bg-gray-900/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-1.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-[3px] before:h-full before:bg-orange-500">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><Navigation size={10} /> GPS Trip Verification</span>
                  <span className="text-xl font-extrabold text-white">{selectedMatatu.gpsDistanceKm} km</span>
                  <span className="text-[10px] text-gray-400">Expected: ~{Math.round(selectedMatatu.gpsDistanceKm/selectedMatatu.routeLen)} complete trips</span>
                </div>
                <div className="bg-gray-900/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-1.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-[3px] before:h-full before:bg-blue-400">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><Fuel size={10} /> Expected Fuel Burn</span>
                  <span className="text-xl font-extrabold text-white">KES {Math.round(selectedMatatu.gpsDistanceKm * 21).toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400">Declared expense: KES {selectedMatatu.declaredFuel.toLocaleString()}</span>
                </div>
                <div className={`bg-gray-900/45 border border-white/5 rounded-2xl p-5 flex flex-col gap-1.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-[3px] before:h-full ${selectedMatatu.leakageFlagged ? 'before:bg-orange-500' : 'before:bg-emerald-400'}`}>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><TrendingUp size={10} /> Leakage Delta</span>
                  <span className="text-xl font-extrabold text-white">
                    KES {selectedMatatu.leakageVal.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-400">{selectedMatatu.leakageFlagged ? 'Unreconciled mileage detected' : 'Perfect reconciliation'}</span>
                </div>
              </div>

              {/* Split layout: Details vs WhatsApp simulator */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* COLUMN 1: SHIFT DETAILS */}
                <div className="bg-gray-900/40 border border-white/5 rounded-3xl p-6 space-y-6 shadow-2xl">
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
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/20">Awaiting Target Settlement</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedMatatu.leakageFlagged && (
                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                        <AlertTriangle size={14} /> Discrepancy Analysis
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        The driver claims <b>{selectedMatatu.declaredOdometerDiff} km</b> covered on route cycles. However, GPS audit trackers register <b>{selectedMatatu.gpsDistanceKm} km</b> of active travel. This indicates approximately <b>{selectedMatatu.gpsDistanceKm - selectedMatatu.declaredOdometerDiff} km</b> of untracked travel (approx. {Math.round((selectedMatatu.gpsDistanceKm - selectedMatatu.declaredOdometerDiff)/selectedMatatu.routeLen)} passenger trips) pocketed directly by the driver.
                      </p>
                    </div>
                  )}
                </div>

                {/* COLUMN 2: WHATSAPP SIMULATOR */}
                <div className="bg-[#0b141a] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[420px] shadow-2xl">
                  {/* WhatsApp Header */}
                  <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center">
                        <Shield size={14} className="text-white" />
                      </div>
                      <div>
                        <strong className="text-xs text-white block">Safiri Audit Bot</strong>
                        <span className="text-[9px] text-[#f97316] font-semibold">Online & Verified</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-400">WhatsApp Gateway</span>
                  </div>

                  {/* Message logs */}
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

                  {/* Simulator action footer */}
                  <div className="bg-[#202c33] p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 bg-[#2a3942] rounded-xl px-4 py-2 text-xs text-gray-400 italic">
                      {currentStep === 0 && "Simulate Driver submitting end-of-shift logs..."}
                      {currentStep === 1 && "Simulate Bot issuing discrepancy audit..."}
                      {currentStep === 2 && "Audit complete. Target is awaiting settlement."}
                    </div>
                    {currentStep < 2 && (
                      <button onClick={triggerNextChatStep} className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-all shadow">
                        <Send size={12} />
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: ACTIVE DRIVERS / MY FLEET */}
          {activeTab === 'fleet' && (
            <div className="space-y-6">
              
              {/* Fleet Analytics Summary header */}
              <div className="bg-gray-900/40 border border-white/5 rounded-3xl p-6 space-y-4 shadow-2xl">
                <div>
                  <h3 className="font-extrabold text-base text-white">Driver Grading & Compliance Audit</h3>
                  <span className="text-xs text-gray-400 font-medium">Monthly performance evaluations, rating status, and target compliance scores.</span>
                </div>
                <div className="grid grid-cols-3 gap-5 border-t border-white/5 pt-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Average Driver Compliance</span>
                    <strong className="text-lg font-extrabold text-white block">86%</strong>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: '86%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Top Rated Route</span>
                    <strong className="text-lg font-extrabold text-emerald-400 block">CBD to Ngong</strong>
                    <span className="text-[10px] text-gray-400">Moses Ochieng (Grade A+)</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Flagged Discrepancies</span>
                    <strong className="text-lg font-extrabold text-orange-400 block">2 Drivers Warned</strong>
                    <span className="text-[10px] text-gray-400">John Kamau & Peter Mwangi</span>
                  </div>
                </div>
              </div>

              {/* Driver Scorecards Grid */}
              <div className="grid grid-cols-3 gap-5">
                {matatus.map((m, idx) => {
                  const compliance = m.reg === 'KCC 123D' ? 98 : m.reg === 'KAA 456B' ? 82 : 65;
                  const grade = m.reg === 'KCC 123D' ? 'A+' : m.reg === 'KAA 456B' ? 'B-' : 'D-';
                  const gradeColor = grade === 'A+' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : grade === 'B-' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-orange-500 bg-orange-500/10 border-orange-500/20';

                  return (
                    <div key={idx} className="bg-gray-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">
                            {m.driverName.charAt(0)}
                          </div>
                          <div>
                            <strong className="text-sm block text-white font-bold">{m.driverName}</strong>
                            <span className="text-[10px] text-gray-400">{m.reg}</span>
                          </div>
                        </div>
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${gradeColor}`}>
                          {grade}
                        </span>
                      </div>

                      <div className="space-y-3 pt-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Target Compliance Rate</span>
                            <span className="font-bold text-white">{compliance}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${compliance > 90 ? 'bg-emerald-400' : compliance > 70 ? 'bg-amber-400' : 'bg-orange-500'}`} 
                              style={{ width: `${compliance}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
                          <span className="text-gray-400">Accrued Leakage</span>
                          <strong className={m.leakageVal > 1000 ? 'text-orange-500' : 'text-white'}>
                            KES {m.leakageVal.toLocaleString()}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Rating Status</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${grade === 'A+' ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {grade === 'A+' ? 'Top Performer' : 'Under Review'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 bg-gray-900/40 border border-white/5 rounded-3xl p-6 shadow-2xl">
              <h3 className="font-extrabold text-base text-white">System Settings</h3>
              <p className="text-xs text-gray-400 leading-normal">
                Configure GPS API integrations, M-Pesa Business callback URLs, and WhatsApp gateway connection hooks.
              </p>
              <div className="border-t border-white/5 pt-4">
                <button className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs px-4 py-2 rounded-lg border border-white/10" onClick={() => alert('Configuration updated.')}>Save Configurations</button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-8 text-center space-y-3 max-w-xs animate-fade-in">
            <div className="w-8 h-8 mx-auto border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <strong className="block text-xs text-gray-300 animate-pulse">{loadingMsg}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
