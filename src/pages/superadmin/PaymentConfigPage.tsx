import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff, Save, ShieldCheck } from 'lucide-react';

const businesses = [
  { id: 'water_retail', label: 'Water Retail', color: 'text-blue-700 bg-blue-50', emoji: '💧' },
  { id: 'rb', label: 'Restaurant & Butchery', color: 'text-orange-700 bg-orange-50', emoji: '🔥' },
  { id: 'water_delivery', label: 'Water Delivery', color: 'text-green-700 bg-green-50', emoji: '🚛' },
];

interface Config {
  shortcode: string;
  passkey: string;
  consumer_key: string;
  consumer_secret: string;
  environment: 'sandbox' | 'production';
  mpesa_enabled: boolean;
  cash_enabled: boolean;
}

export default function PaymentConfigPage() {
  const [activeTab, setActiveTab] = useState('water_retail');
  const [showFields, setShowFields] = useState<Record<string, boolean>>({});
  const [configs, setConfigs] = useState<Record<string, Config>>({
    water_retail: { shortcode: '', passkey: '', consumer_key: '', consumer_secret: '', environment: 'sandbox', mpesa_enabled: true, cash_enabled: true },
    rb: { shortcode: '', passkey: '', consumer_key: '', consumer_secret: '', environment: 'sandbox', mpesa_enabled: true, cash_enabled: true },
    water_delivery: { shortcode: '', passkey: '', consumer_key: '', consumer_secret: '', environment: 'sandbox', mpesa_enabled: true, cash_enabled: true },
  });

  const current = configs[activeTab];
  const toggle = (field: string) => setShowFields((p) => ({ ...p, [field]: !p[field] }));

  const update = (field: keyof Config, value: any) => {
    setConfigs((p) => ({ ...p, [activeTab]: { ...p[activeTab], [field]: value } }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 hero-admin rounded-xl flex items-center justify-center">
          <CreditCard size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Payment Configuration</h1>
          <p className="text-gray-500 text-sm">M-Pesa Daraja API settings per business · Super Admin only</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800 text-sm">Sensitive Configuration</p>
          <p className="text-amber-700 text-xs">All credentials are stored encrypted and never exposed to cashier or driver roles. Payment keys are read server-side only via Edge Functions.</p>
        </div>
      </div>

      {/* Business tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {businesses.map((b) => (
          <button
            key={b.id}
            onClick={() => setActiveTab(b.id)}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all -mb-px ${
              activeTab === b.id ? 'border-current text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{b.emoji}</span>{b.label}
          </button>
        ))}
      </div>

      <div className="card p-6 space-y-5">
        {/* Environment toggle */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Environment</label>
          <div className="flex gap-2">
            {(['sandbox', 'production'] as const).map((env) => (
              <button
                key={env}
                onClick={() => update('environment', env)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  current.environment === env
                    ? env === 'production' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {env === 'production' ? '🟢 Production' : '🧪 Sandbox'}
              </button>
            ))}
          </div>
          {current.environment === 'production' && (
            <p className="text-xs text-red-600 font-semibold mt-1.5">⚠️ Production mode — real M-Pesa transactions will be processed</p>
          )}
        </div>

        {/* Credential fields */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { key: 'shortcode', label: 'Shortcode (Till/Paybill)' },
            { key: 'passkey', label: 'Passkey', sensitive: true },
            { key: 'consumer_key', label: 'Consumer Key', sensitive: true },
            { key: 'consumer_secret', label: 'Consumer Secret', sensitive: true },
          ].map(({ key, label, sensitive }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={sensitive && !showFields[`${activeTab}-${key}`] ? 'password' : 'text'}
                  value={(current as any)[key]}
                  onChange={(e) => update(key as keyof Config, e.target.value)}
                  placeholder={sensitive ? '••••••••••••' : `Enter ${label.toLowerCase()}`}
                  className="input-field pr-10"
                />
                {sensitive && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => toggle(`${activeTab}-${key}`)}
                  >
                    {showFields[`${activeTab}-${key}`] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Payment method toggles */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Enabled Payment Methods</label>
          <div className="flex gap-4">
            {[
              { key: 'mpesa_enabled', label: '📱 M-Pesa STK Push' },
              { key: 'cash_enabled', label: '💵 Cash' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(current as any)[key]}
                  onChange={(e) => update(key as keyof Config, e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex gap-3">
          <button className="btn bg-gray-900 text-white hover:bg-gray-700 gap-2">
            <Save size={15} /> Save Configuration
          </button>
          <button className="btn-ghost">Test Connection</button>
        </div>
      </div>

      {/* Audit log */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">Configuration Change History</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { action: 'Updated Consumer Key', business: 'Water Retail', by: 'Super Admin', when: '2 days ago' },
            { action: 'Switched to Production', business: 'R&B', by: 'Super Admin', when: '1 week ago' },
            { action: 'Enabled M-Pesa STK', business: 'Water Delivery', by: 'Super Admin', when: '2 weeks ago' },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <ShieldCheck size={14} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                <p className="text-xs text-gray-500">{log.business} · {log.by} · {log.when}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
