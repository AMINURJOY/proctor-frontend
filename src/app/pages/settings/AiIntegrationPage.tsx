import { useEffect, useState } from 'react';
import { aiApi } from '../../services/api';

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite — fastest, cheapest (recommended)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash — balanced quality and cost' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro — highest quality, slowest' },
];

export default function AiIntegrationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash-lite');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [savedMsg, setSavedMsg] = useState('');

  const load = async () => {
    try {
      const res = await aiApi.getSettings();
      const d = res.data.data || res.data;
      setModel(d.model || 'gemini-2.5-flash-lite');
      setHasStoredKey(!!d.hasApiKey);
      setMaskedKey(d.maskedApiKey || '');
    } catch { /* leave defaults */ } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // A model change invalidates the previous test result — it was for a different model.
  useEffect(() => { setTestResult(null); }, [model, apiKey]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await aiApi.test({ apiKey: apiKey.trim() || undefined, model });
      const d = res.data.data || res.data;
      setTestResult({ valid: !!d.valid, message: d.message || '' });
    } catch (err: any) {
      setTestResult({ valid: false, message: err?.response?.data?.message || 'Test request failed.' });
    } finally { setTesting(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      await aiApi.updateSettings({ provider: 'gemini', model, apiKey: apiKey.trim() || undefined });
      setApiKey('');
      setSavedMsg('AI settings saved.');
      await load();
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err: any) {
      setSavedMsg(err?.response?.data?.message || 'Failed to save AI settings.');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 max-w-2xl">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const canTest = !testing && (!!apiKey.trim() || hasStoredKey);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 max-w-2xl">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#0b2652' }}>AI Integration</h3>
      <p className="text-sm text-gray-500 mb-6">
        Connect a Google Gemini API key so the Proctor Office can draft investigation reports automatically.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
        <input value="Google Gemini" disabled
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={hasStoredKey ? `Stored: ${maskedKey} — paste a new key to replace it` : 'Paste your Gemini API key'}
            autoComplete="off"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button type="button" onClick={() => setShowKey(s => !s)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {hasStoredKey
            ? 'A key is already stored. Leave this blank to keep it.'
            : 'Get a key from Google AI Studio. It is stored server-side and never sent back to the browser.'}
        </p>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
        <select value={model} onChange={e => setModel(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {GEMINI_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      {testResult && (
        <div className={`mb-4 rounded-lg border p-3 text-sm ${
          testResult.valid
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className="font-medium">{testResult.valid ? 'Valid' : 'Invalid'}</span>
          {testResult.message ? ` — ${testResult.message}` : ''}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={handleTest} disabled={!canTest}
          className="px-4 py-2 text-sm rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: '#0b2652' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
      </div>
    </div>
  );
}
