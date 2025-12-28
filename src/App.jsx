import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, 
  MapPin, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  TestTube, 
  Thermometer, 
  Droplets,
  History,
  Plus,
  UserCheck,
  Sparkles,
  MessageSquare,
  X,
  Send,
  Loader2
} from 'lucide-react';

// --- CONFIGURACIÓN API GEMINI ---
// 🔴 IMPORTANTE: Pon tu API Key aquí abajo entre las comillas.
const apiKey = "AIzaSyCIkenxhOhL9z3552oQQamaobbRmWVB5v8"; 

// Función auxiliar para llamar a la API de Gemini
async function callGeminiAPI(prompt, systemInstruction = "") {
  if (!apiKey) {
    return "Error: Falta la API Key. Configúrala en el código fuente (App.jsx).";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      }
    );
    
    if (!response.ok) throw new Error('Error en la API');
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";
  } catch (error) {
    console.error("Error AI:", error);
    return "Error de conexión con el servicio de IA. Verifica tu internet.";
  }
}

// --- CONFIGURACIÓN Y CONSTANTES ---

const MATRICES = [
  { id: 'ARD', label: 'Agua Residual Doméstica (ARD)', defaultPreservant: 'Refrigeración < 6°C' },
  { id: 'ARnD', label: 'Agua Residual No Doméstica (ARnD)', defaultPreservant: 'Refrigeración < 6°C' },
  { id: 'SUPERFICIAL', label: 'Agua Superficial (Río/Quebrada)', defaultPreservant: 'Refrigeración < 6°C' },
  { id: 'SUBTERRANEA', label: 'Agua Subterránea (Pozo/Aljibe)', defaultPreservant: 'Refrigeración < 6°C' },
  { id: 'POTABLE', label: 'Agua Potable / Tratada', defaultPreservant: 'Refrigeración < 6°C + Tiosulfato' },
  { id: 'SUELO', label: 'Suelo / Sedimento / Lodo', defaultPreservant: 'Refrigeración < 6°C' },
];

const PRESERVANTES = [
  'Ninguno',
  'Refrigeración < 6°C',
  'Refrigeración < 6°C + Tiosulfato',
  'H2SO4 (Ácido Sulfúrico) pH < 2',
  'HNO3 (Ácido Nítrico) pH < 2',
  'NaOH (Hidróxido de Sodio) pH > 12',
  'Na2S2O3 (Tiosulfato)',
];

// --- COMPONENTE PRINCIPAL ---

export default function LabFieldApp() {
  const [view, setView] = useState('dashboard');
  const [samples, setSamples] = useState([]);
  const [showAIChat, setShowAIChat] = useState(false); // Estado para el modal de Chat IA
  
  useEffect(() => {
    const savedSamples = localStorage.getItem('labfield_samples');
    if (savedSamples) {
      setSamples(JSON.parse(savedSamples));
    }
  }, []);

  const saveSampleToDB = (newSample) => {
    const updatedSamples = [newSample, ...samples];
    setSamples(updatedSamples);
    localStorage.setItem('labfield_samples', JSON.stringify(updatedSamples));
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      {/* HEADER SUPERIOR */}
      <header className="bg-teal-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            <h1 className="text-lg font-bold tracking-wide hidden sm:block">LabField Sync <span className="text-xs font-normal opacity-80 bg-teal-800 px-2 py-0.5 rounded ml-1">v2.0 AI</span></h1>
            <h1 className="text-lg font-bold tracking-wide sm:hidden">LabField AI</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setShowAIChat(true)}
              className="text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1 transition shadow-sm border border-teal-500"
            >
              <Sparkles className="h-3 w-3 text-yellow-300" />
              Consultor IA
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className="text-xs font-medium hover:bg-teal-600 px-3 py-1 rounded transition"
            >
              {view === 'dashboard' ? 'Inicio' : 'Volver'}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-3xl mx-auto p-4 pb-20">
        {view === 'dashboard' ? (
          <Dashboard samples={samples} onNew={() => setView('new-sample')} />
        ) : (
          <SampleForm onSave={saveSampleToDB} onCancel={() => setView('dashboard')} />
        )}
      </main>

      {/* MODAL DEL CONSULTOR IA */}
      {showAIChat && <AIConsultantModal onClose={() => setShowAIChat(false)} />}
    </div>
  );
}

// --- SUB-COMPONENTE: MODAL CONSULTOR IA (Gemini Chat) ---
function AIConsultantModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConsult = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');
    
    const systemPrompt = "Eres un experto consultor técnico en calidad de aguas y norma ISO 17025. Responde de forma breve, precisa y técnica a dudas de campo sobre preservación, tiempos de retención, recipientes y procedimientos de muestreo.";
    
    const result = await callGeminiAPI(query, systemPrompt);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-xl text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <h3 className="font-bold">Consultor Técnico IA</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto bg-slate-50 min-h-[200px]">
          {response ? (
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-sm text-indigo-900 leading-relaxed">
              <span className="font-bold text-indigo-700 block mb-1">Respuesta:</span>
              {response}
            </div>
          ) : (
            <div className="text-center text-slate-400 mt-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Pregúntame sobre preservantes, tiempos de retención o procedimientos ISO 17025.</p>
            </div>
          )}
        </div>

        <form onSubmit={handleConsult} className="p-3 border-t border-slate-200 bg-white rounded-b-xl flex gap-2">
          <input 
            type="text" 
            placeholder="Ej: ¿Qué frasco uso para fenoles?" 
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE: DASHBOARD ---
function Dashboard({ samples, onNew }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ClipboardList className="h-32 w-32 text-teal-900" />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2 relative z-10">Panel de Control</h2>
        <p className="text-slate-500 mb-4 text-sm relative z-10">Gestiona tus tomas de muestra con trazabilidad digital.</p>
        <button 
          onClick={onNew}
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 relative z-10 mx-auto"
        >
          <Plus className="h-5 w-5" />
          Nueva Toma de Muestra
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <History className="h-4 w-4" /> Historial Reciente
        </h3>
        
        {samples.length === 0 ? (
          <div className="text-center py-10 bg-slate-100 rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-400">No hay muestras registradas aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {samples.map((sample) => (
              <div key={sample.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-teal-500 flex justify-between items-center hover:shadow-md transition">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{sample.id}</span>
                    <span className="text-xs text-slate-400">{new Date(sample.timestamp).toLocaleString()}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800">{sample.matrixLabel}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <UserCheck className="h-3 w-3" /> {sample.technician}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-600">pH: {sample.ph}</div>
                  <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                     {sample.coords ? 'GPS OK' : 'No GPS'} <MapPin className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE: FORMULARIO DE MUESTREO ---
function SampleForm({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    client: '',
    matrix: '',
    matrixLabel: '',
    ph: '',
    temp: '',
    conductivity: '',
    preservant: '',
    observations: '', // Nuevo campo para IA
    technician: 'Ing. Carlos (Tú)',
    coords: null,
    calibrated: false
  });

  const [errors, setErrors] = useState({});
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [enhancingNotes, setEnhancingNotes] = useState(false); // Estado de carga para la IA de observaciones
  const [sampleId] = useState(`M-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`);

  useEffect(() => {
    const selectedMatrix = MATRICES.find(m => m.id === formData.matrix);
    if (selectedMatrix) {
      setFormData(prev => ({
        ...prev, 
        preservant: selectedMatrix.defaultPreservant,
        matrixLabel: selectedMatrix.label
      }));
    }
  }, [formData.matrix]);

  // FUNCIÓN: Mejorar Redacción con Gemini API
  const handleEnhanceNotes = async () => {
    if (!formData.observations || formData.observations.length < 3) {
      alert("Escribe algo en las observaciones primero.");
      return;
    }
    
    setEnhancingNotes(true);
    const prompt = `Actúa como un técnico de laboratorio experto. Reescribe la siguiente observación de campo usando lenguaje técnico, formal y preciso adecuado para un informe oficial ambiental (evita la primera persona): "${formData.observations}"`;
    
    const enhancedText = await callGeminiAPI(prompt);
    
    setFormData(prev => ({ ...prev, observations: enhancedText }));
    setEnhancingNotes(false);
  };

  const handleGetLocation = () => {
    setLoadingGPS(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        setLoadingGPS(false);
      }, (error) => {
        alert("Error obteniendo GPS. Asegúrate de dar permisos.");
        setLoadingGPS(false);
      });
    } else {
      alert("GPS no disponible en este dispositivo.");
      setLoadingGPS(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.client) newErrors.client = "El cliente es obligatorio.";
    if (!formData.matrix) newErrors.matrix = "Debes seleccionar una matriz.";
    
    const phVal = parseFloat(formData.ph);
    if (isNaN(phVal) || phVal < 0 || phVal > 14) {
      newErrors.ph = "El pH debe estar entre 0.0 y 14.0";
    }

    const tempVal = parseFloat(formData.temp);
    if (isNaN(tempVal) || tempVal > 100 || tempVal < -10) {
      newErrors.temp = "Temperatura fuera de rango físico.";
    }

    if (!formData.calibrated) {
      newErrors.calibrated = "No puedes muestrear sin verificar el equipo.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo(0,0);
      return;
    }

    onSave({
      id: sampleId,
      timestamp: new Date().toISOString(),
      ...formData
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Bitácora de Campo</h2>
          <p className="text-xs text-slate-500 font-mono">ID: {sampleId}</p>
        </div>
        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Online
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* SECCIÓN 1: DATOS GENERALES */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Cliente / Proyecto</span>
            <input 
              type="text" 
              className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50 p-2 border ${errors.client ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="Ej. Ecopetrol - Vertimiento 001"
              value={formData.client}
              onChange={e => setFormData({...formData, client: e.target.value})}
            />
            {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client}</p>}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Matriz (Tipo de Muestra)</span>
              <select 
                className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring p-2 border bg-white ${errors.matrix ? 'border-red-500' : ''}`}
                value={formData.matrix}
                onChange={e => setFormData({...formData, matrix: e.target.value})}
              >
                <option value="">-- Seleccionar --</option>
                {MATRICES.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              {errors.matrix && <p className="text-red-500 text-xs mt-1">{errors.matrix}</p>}
            </label>

            <div className="block">
              <span className="text-sm font-semibold text-slate-700">Ubicación GPS</span>
              <button 
                type="button"
                onClick={handleGetLocation}
                disabled={formData.coords}
                className={`mt-1 w-full flex items-center justify-center gap-2 py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition ${formData.coords ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'}`}
              >
                {loadingGPS ? (
                  <span>Buscando satélites...</span>
                ) : formData.coords ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {formData.coords.lat.toFixed(4)}, {formData.coords.lng.toFixed(4)}
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 text-red-500" />
                    Capturar Coordenadas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* SECCIÓN 2: DATOS IN-SITU */}
        <div>
          <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TestTube className="h-4 w-4" /> Mediciones In-Situ
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-600">pH (Unidades)</span>
              <input 
                type="number" 
                step="0.01"
                className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring p-2 border ${errors.ph ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="7.00"
                value={formData.ph}
                onChange={e => setFormData({...formData, ph: e.target.value})}
              />
              {errors.ph && <p className="text-red-500 text-xs mt-1">{errors.ph}</p>}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-600">Temperatura (°C)</span>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Thermometer className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="number" 
                  step="0.1"
                  className={`block w-full pl-10 rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring p-2 border ${errors.temp ? 'border-red-500 bg-red-50' : ''}`}
                  placeholder="25.0"
                  value={formData.temp}
                  onChange={e => setFormData({...formData, temp: e.target.value})}
                />
              </div>
              {errors.temp && <p className="text-red-500 text-xs mt-1">{errors.temp}</p>}
            </label>

             <label className="block col-span-2">
              <span className="text-sm font-medium text-slate-600">Conductividad (µS/cm)</span>
              <input 
                type="number" 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring p-2 border"
                placeholder="Ej. 450"
                value={formData.conductivity}
                onChange={e => setFormData({...formData, conductivity: e.target.value})}
              />
            </label>
          </div>
        </div>

        {/* SECCIÓN 3: OBSERVACIONES CON IA (NUEVO) */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-bold text-indigo-900">
              Observaciones de Campo
            </label>
            <button
              type="button"
              onClick={handleEnhanceNotes}
              disabled={enhancingNotes}
              className="text-[10px] bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md flex items-center gap-1 transition shadow-sm"
            >
              {enhancingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-yellow-500" />}
              Mejorar Redacción (IA)
            </button>
          </div>
          
          <textarea 
            className="w-full rounded-md border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 p-2 text-sm h-24"
            placeholder="Ej: Llovía mucho y el agua se ve turbia. Huele a huevo podrido."
            value={formData.observations}
            onChange={e => setFormData({...formData, observations: e.target.value})}
          />
          <p className="text-xs text-indigo-400 mt-1">
            Escribe notas rápidas y presiona el botón ✨ para convertirlas en texto técnico.
          </p>
        </div>

        {/* SECCIÓN 4: ASEGURAMIENTO DE CALIDAD */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
           <h3 className="text-sm font-bold text-slate-600 mb-3">Aseguramiento de Calidad (QA/QC)</h3>
           
           <div className="flex items-start gap-3 mb-4">
             <div className="flex items-center h-5">
               <input
                 id="calibrated"
                 type="checkbox"
                 className="focus:ring-teal-500 h-5 w-5 text-teal-600 border-slate-300 rounded"
                 checked={formData.calibrated}
                 onChange={e => setFormData({...formData, calibrated: e.target.checked})}
               />
             </div>
             <div className="text-sm">
               <label htmlFor="calibrated" className={`font-medium ${errors.calibrated ? 'text-red-600' : 'text-slate-700'}`}>
                 Verificación de Equipo Realizada
               </label>
               {errors.calibrated && <p className="text-red-500 text-xs font-bold mt-1">⚠ Requerido para ISO 17025</p>}
             </div>
           </div>

           <label className="block">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" /> Preservante
              </span>
              <select 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring p-2 border bg-white"
                value={formData.preservant}
                onChange={e => setFormData({...formData, preservant: e.target.value})}
              >
                <option value="">-- Seleccionar --</option>
                {PRESERVANTES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-4 pt-4">
          <button 
            type="button"
            onClick={onCancel}
            className="w-1/3 bg-white text-slate-700 border border-slate-300 font-semibold py-3 rounded-lg hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="w-2/3 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            <Save className="h-5 w-5" />
            Guardar Muestra
          </button>
        </div>

      </form>
    </div>
  );
}