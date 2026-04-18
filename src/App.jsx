import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function App() {
  const [ledgers, setLedgers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
        { id: 1, name: 'Lyriana', balance: 42.50, color: 'primary', increment_amount: 1.00 },
        { id: 2, name: 'Alexander', balance: 18.25, color: 'tertiary', increment_amount: 0.50 }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface text-on-surface">
      {/* TopAppBar - Locked at top */}
      <header className="shrink-0 z-[60] bg-white border-b border-black/5">
        <div className="flex justify-between items-center w-full px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px] font-bold" style={{fontVariationSettings: "'FILL' 1"}}>account_balance_wallet</span>
            <h1 className="text-xl font-extrabold text-on-surface tracking-tighter">Allowance</h1>
          </div>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[28px] text-on-surface">
              {isMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-[64px] right-5 w-56 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col py-2">
              <MenuButton 
                icon="dashboard" 
                label="Overview" 
                active={activeTab === 'overview'} 
                onClick={() => { setActiveTab('overview'); setIsMenuOpen(false); }} 
              />
              <MenuButton 
                icon="settings" 
                label="Settings" 
                active={activeTab === 'settings'} 
                onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }} 
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area - Scrollable with fixed viewport height */}
      <main className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-4">
        {activeTab === 'overview' ? (
          <>
            {ledgers.map((ledger) => (
              <LedgerCard key={ledger.id} ledger={ledger} />
            ))}
          </>
        ) : (
          <SettingsView ledgers={ledgers} onSaved={fetchLedgers} />
        )}
      </main>

      {/* Overlay background when menu is open */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-[55] bg-black/10 backdrop-blur-[1px]" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  )
}

function LedgerCard({ ledger }) {
  const [spent, setSpent] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async (type, useQuickAmount = false) => {
    let amount = 0
    
    if (useQuickAmount) {
      amount = ledger.increment_amount || 1.00
    } else {
      amount = parseFloat(spent) || 0
      if (amount <= 0) return
    }
    
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
    <section className="relative shrink-0 bg-[#eff4ff] rounded-[2rem] p-5 pb-6 flex flex-col justify-between transition-all duration-300 shadow-sm border border-black/5 overflow-hidden">
      <div className={cn(
        "side-indicator top-4 bottom-4",
        ledger.color === 'tertiary' ? "bg-tertiary" : "bg-primary"
      )} />

      <div className="flex justify-between items-start pl-3">
        <div className="flex flex-col text-left">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            {ledger.name}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-3xl font-extrabold tracking-tighter",
              ledger.color === 'tertiary' ? "text-[#005498]" : "text-[#006e3e]"
            )}>
              ${ledger.balance.toFixed(2)}
            </span>
            <span className="text-[11px] font-medium text-slate-500">balance</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => handleUpdate('add', true)}
            className="w-10 h-10 rounded-full bg-[#006e3e] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-xl font-bold">add</span>
          </button>
          <button 
            onClick={() => handleUpdate('subtract', true)}
            className="w-10 h-10 rounded-full bg-[#ffdad8] text-[#97292e] flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-xl font-bold">remove</span>
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-2 items-center pl-3">
        <div className="relative flex-1">
          <input 
            type="number"
            value={spent}
            onChange={(e) => setSpent(e.target.value)}
            placeholder="Spend"
            className="w-full bg-white border-none rounded-full px-5 py-2.5 text-sm font-semibold focus:ring-0 placeholder:text-slate-300 text-slate-700 shadow-sm transition-all"
          />
        </div>
        <button 
          onClick={() => handleUpdate('subtract', false)}
          disabled={isUpdating || !spent}
          className={cn(
            "h-[40px] px-6 rounded-full font-bold text-[13px] transition-all flex items-center gap-2",
            ledger.name === 'Alexander' 
              ? "bg-[#d2e4ff] text-[#0060ad]" 
              : "bg-[#dce9ff] text-[#0060ad]",
            "disabled:opacity-40 disabled:pointer-events-none"
          )}
        >
          {isUpdating ? '...' : 'Submit'}
        </button>
      </div>
    </section>
  )
}

function SettingsView({ ledgers, onSaved }) {
  const [config, setConfig] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const initialConfig = {}
    ledgers.forEach(l => {
      initialConfig[l.id] = l.increment_amount || 1.00
    })
    setConfig(initialConfig)
  }, [ledgers])

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const ledgerId of Object.keys(config)) {
        await supabase
          .from('ledgers')
          .update({ increment_amount: config[ledgerId] })
          .eq('id', ledgerId)
      }
      onSaved()
    } catch (e) {
      console.error('Failed to save settings:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-1 pr-10">
        <h2 className="text-2xl font-extrabold tracking-tight">Settings</h2>
        <p className="text-[13px] text-slate-500 font-medium leading-tight">Config quick increments per child.</p>
      </div>

      <div className="flex flex-col gap-3">
        {ledgers.map(ledger => (
          <div key={ledger.id} className="bg-white p-4 rounded-3xl border border-black/5 shadow-sm flex flex-col gap-3">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                ledger.color === 'tertiary' ? "bg-tertiary" : "bg-primary"
              )} />
              {ledger.name}'s Quick Add
            </h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
              <input 
                type="number"
                step="0.01"
                value={config[ledger.id] || ''}
                onChange={(e) => setConfig({ ...config, [ledger.id]: parseFloat(e.target.value) })}
                className="w-full bg-surface border-none rounded-2xl pl-10 pr-5 py-3 text-base font-bold focus:ring-2 focus:ring-primary/10 shadow-inner"
              />
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        className="shrink-0 bg-primary text-white py-4 rounded-3xl font-bold text-base shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save All Preferences'}
      </button>
    </div>
  )
}

function MenuButton({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-5 py-4 text-base font-bold transition-all w-full",
        active 
          ? "bg-primary/5 text-primary" 
          : "text-slate-700 hover:bg-black/5"
      )}
    >
      <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0"}}>
        {icon}
      </span>
      {label}
    </button>
  )
}
