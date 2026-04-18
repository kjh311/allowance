import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { 
  Plus, 
  Minus, 
  LayoutDashboard, 
  User, 
  Settings, 
  ChevronRight,
  Wallet
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function App() {
  const [ledgers, setLedgers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchLedgers()
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('ledgers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledgers' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setLedgers(prev => prev.map(l => l.id === payload.new.id ? payload.new : l))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  async function fetchLedgers() {
    try {
      const { data, error } = await supabase
        .from('ledgers')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setLedgers(data)
    } catch (e) {
      console.error('Error fetching ledgers:', e.message)
      // Fallback data for design preview if Supabase is not connected
      setLedgers([
        { id: 1, name: 'Lyriana', balance: 42.50, color: 'primary' },
        { id: 2, name: 'Alexander', balance: 18.25, color: 'tertiary' }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface select-none">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 glass shadow-[0_10px_30px_-15px_rgba(5,52,92,0.05)]">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-800">
              <Wallet size={20} />
            </div>
            <h1 className="text-lg font-extrabold text-emerald-900 tracking-tight">The Nurtured Ledger</h1>
          </div>
          <div className="w-9 h-9 rounded-full bg-surface-container-high border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmSo01kzndXMcBLvOBjlVAvyyWtnO0GS8_W9tRPP3NmQIzCoTR4Y_ZElbv-K5EIpOrKKEpOuRro1Ctq2vR25zdqWx3SpMahpu0_Fesl4c_ORuePPJb_XIxoaDh2wU_EeqYSt6QUcMEZJ885sXMtICxdgVhPLOQK0YjYuEetTESIxWoZyo45plPXWxVv7HY0HHiMgW_aagiXp4jM1FDwry6FcxjGvZ4rKyiBpQpJb2CjtxPd5HnfEUY6G2Hh4DgZil3R0Fx_l-D4DM"
              alt="Profile"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-20 mb-28 px-4 flex flex-col gap-4 overflow-y-auto pb-6">
        {ledgers.map((ledger) => (
          <LedgerCard key={ledger.id} ledger={ledger} />
        ))}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-8 pt-4 glass rounded-t-[2.5rem] z-50 shadow-[0_-15px_40px_-15px_rgba(5,52,92,0.08)] border-t border-white/20">
        <NavButton 
          icon={<LayoutDashboard size={22} />} 
          label="Overview" 
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        />
        <NavButton 
          icon={<User size={22} />} 
          label="Lyriana" 
          active={activeTab === 'lyriana'}
          onClick={() => setActiveTab('lyriana')}
        />
        <NavButton 
          icon={<User size={22} />} 
          label="Alexander" 
          active={activeTab === 'alexander'}
          onClick={() => setActiveTab('alexander')}
        />
        <NavButton 
          icon={<Settings size={22} />} 
          label="Settings" 
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </nav>
    </div>
  )
}

function LedgerCard({ ledger }) {
  const [spent, setSpent] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async (type) => {
    const amount = parseFloat(spent) || 0
    if (amount <= 0 && type === 'spent') return
    
    setIsUpdating(true)
    const newBalance = type === 'add' ? ledger.balance + amount : ledger.balance - amount

    try {
      const { error } = await supabase
        .from('ledgers')
        .update({ balance: newBalance })
        .eq('id', ledger.id)

      if (error) throw error
      setSpent('')
    } catch (e) {
      console.error('Update failed:', e.message)
      // Fallback for demo
      ledger.balance = newBalance
      setSpent('')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <section className={cn(
      "relative overflow-hidden bg-surface-container-low rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-300 ease-out active:scale-[0.98] border-l-[6px]",
      ledger.color === 'tertiary' ? "border-tertiary" : "border-primary"
    )}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-on-surface-variant font-bold text-xs tracking-[0.15em] uppercase opacity-60 mb-1">
            {ledger.name}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-4xl font-extrabold tracking-tight",
              ledger.color === 'tertiary' ? "text-tertiary" : "text-primary"
            )}>
              ${ledger.balance.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-on-surface-variant/50">current balance</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => handleUpdate('add')}
            className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all"
          >
            <Plus size={24} />
          </button>
          <button 
            onClick={() => handleUpdate('spent')}
            className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-md active:scale-90 transition-all"
          >
            <Minus size={24} />
          </button>
        </div>
      </div>

      <div className="mt-8 flex gap-3 items-center">
        <div className="relative flex-1">
          <input 
            type="number"
            value={spent}
            onChange={(e) => setSpent(e.target.value)}
            placeholder="Enter amount..."
            className="w-full bg-white dark:bg-white/10 border-none rounded-2xl px-5 py-4 text-base font-semibold focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-on-surface-variant/30 text-on-surface"
          />
        </div>
        <button 
          onClick={() => handleUpdate('spent')}
          disabled={!spent || isUpdating}
          className={cn(
            "h-[56px] px-8 rounded-2xl font-bold text-sm transition-all flex items-center gap-2",
            ledger.color === 'tertiary' 
              ? "bg-tertiary/10 text-tertiary hover:bg-tertiary hover:text-white" 
              : "bg-primary/10 text-primary hover:bg-primary hover:text-white",
            "disabled:opacity-40 disabled:pointer-events-none"
          )}
        >
          {isUpdating ? '...' : 'Submit'}
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  )
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 px-6 py-2 rounded-3xl transition-all duration-500",
        active 
          ? "bg-emerald-100 text-emerald-900 scale-110" 
          : "text-slate-400 hover:text-slate-600 active:scale-90"
      )}
    >
      <div className={cn("transition-transform", active && "scale-110")}>
        {icon}
      </div>
      <span className="text-[10px] font-bold tracking-wider uppercase">{label}</span>
    </button>
  )
}
