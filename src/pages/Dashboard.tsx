import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDiagnostic } from '../contexts/DiagnosticContext.tsx';
import { ORGAN_K_MAP } from '../constants.ts';

const TUMOR_TYPES = [
  'Adenocarcinoma',
  'Carcinoma Epidermoide',
  'Sarcoma',
  'Linfoma',
  'Melanoma',
  'Glioblastoma'
];

const calculateVolumeFromDiameter = (d: number) => {
  return (4 / 3) * Math.PI * Math.pow(d / 2, 3);
};

const getEtapa = (diameter: number) => {
  if (diameter < 2) return 'Etapa I';
  if (diameter <= 5) return 'Etapa II';
  return 'Etapa III';
};

const Dashboard = () => {
  const { diagnostic, setDiagnostic, selectedOrgan, setSelectedOrgan } = useDiagnostic();
  const [selectedZone, setSelectedZone] = useState<string | null>(selectedOrgan);
  const [showStatus, setShowStatus] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    tumorType: TUMOR_TYPES[0],
    age: diagnostic?.age.toString() || '45',
    initialDiameter: diagnostic?.initialDiameter.toString() || '2.4',
    organ: selectedOrgan || 'Hígado'
  });

  useEffect(() => {
    if (selectedOrgan) {
      setSelectedZone(selectedOrgan);
      setFormData(prev => ({ ...prev, organ: selectedOrgan }));
    }
  }, [selectedOrgan]);

  // Model loading optimized via jsDelivr CDN
  const modelUrl = "https://cdn.jsdelivr.net/gh/JuanchisV/model-3d@main/Meshy_AI_Shadow_Armor_0426025753_texture_compressed.glb";

  const hotspots = [
    { name: 'Cerebro', position: '0m 0.95m 0.05m', normal: '0m 0m 1m' },
    { name: 'Tiroides', position: '0m 0.68m 0.08m', normal: '0m 0m 1m' },
    { name: 'Pulmón Derecho', position: '0.12m 0.52m 0.12m', normal: '0m 0m 1m' },
    { name: 'Pulmón Izquierdo', position: '-0.12m 0.52m 0.12m', normal: '0m 0m 1m' },
    { name: 'Seno Derecho', position: '0.15m 0.42m 0.18m', normal: '0m 0m 1m' },
    { name: 'Seno Izquierdo', position: '-0.15m 0.42m 0.18m', normal: '0m 0m 1m' },
    { name: 'Hígado', position: '-0.08m 0.35m 0.15m', normal: '0m 0m 1m' },
    { name: 'Estómago', position: '0.08m 0.35m 0.15m', normal: '0m 0m 1m' },
    { name: 'Riñón Derecho', position: '0.15m 0.30m -0.05m', normal: '0m 0m -1m' },
    { name: 'Riñón Izquierdo', position: '-0.15m 0.30m -0.05m', normal: '0m 0m -1m' },
    { name: 'Páncreas', position: '0m 0.32m 0.12m', normal: '0m 0m 1m' },
    { name: 'Colon', position: '0m 0.25m 0.15m', normal: '0m 0m 1m' },
    { name: 'Vejiga', position: '0m 0.15m 0.15m', normal: '0m 0m 1m' },
    { name: 'Ovarios', position: '0.08m 0.15m 0.12m', normal: '0m 0m 1m' },
    { name: 'Próstata', position: '0m 0.08m 0.15m', normal: '0m 0m 1m' },
    { name: 'Testículos', position: '0m 0.05m 0.18m', normal: '0m 0m 1m' },
    { name: 'Huesos (Brazo)', position: '0.35m 0.55m 0.05m', normal: '0m 0m 1m' },
    { name: 'Huesos (Pierna)', position: '0.18m -0.25m 0.05m', normal: '0m 0m 1m' },
    { name: 'Piel', position: '-0.25m 0.6m 0.08m', normal: '0m 0m 1m' },
  ];

  const handleApplyDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    const diameter = parseFloat(formData.initialDiameter) || 0;
    const age = parseInt(formData.age) || 0;
    const newDiagnostic = {
      tumorType: formData.tumorType,
      age: isNaN(age) ? 0 : age,
      initialDiameter: isNaN(diameter) ? 0 : diameter,
      initialVolume: calculateVolumeFromDiameter(isNaN(diameter) ? 0 : diameter),
      organ: formData.organ,
      carryingCapacity: ORGAN_K_MAP[formData.organ] || 500
    };
    setDiagnostic(newDiagnostic);
    setSelectedOrgan(formData.organ);
    setSelectedZone(formData.organ);
    setIsFormOpen(false);
    setShowStatus('Diagnóstico actualizado correctamente');
    setTimeout(() => setShowStatus(null), 3000);
  };

  const loadProgress = diagnostic ? (diagnostic.initialVolume / diagnostic.carryingCapacity) * 100 : 0;
  const safeLoadProgress = isNaN(loadProgress) ? 0 : loadProgress;

  return (
    <div className="relative h-screen overflow-hidden flex items-center justify-center p-8 bg-[#0e0e10]">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary-container/10 via-surface to-background"></div>
      
      <div className="relative w-full h-full flex items-center justify-center z-10">
        <div className="absolute w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1.1, x: 100 }}
          transition={{ duration: 1.2 }}
          className="relative z-10 w-full max-w-6xl h-full flex items-center justify-center translate-x-20"
        >
            <model-viewer
              src={modelUrl}
              alt="Modelo 3D Humano Anatómico"
              camera-controls
              auto-rotate
              shadow-intensity="0.5"
              shadow-softness="0.5"
              exposure="1.2"
              environment-image="neutral"
              loading="eager"
              reveal="auto"
              touch-action="pan-y"
              power-preference="high-performance"
              interaction-prompt="none"
              interpolation-decay="200"
              ar-modes="webxr scene-viewer quick-look"
              className="w-full h-full"
              style={{ width: '100%', height: '100%', backgroundColor: 'transparent' } as React.CSSProperties}
            >
              <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-transparent pointer-events-none">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                    <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white font-display text-lg tracking-[0.2em] font-medium uppercase">Cargando Atlas 3D</span>
                    <span className="text-primary/60 font-mono text-[10px] tracking-widest uppercase">Optimizando Recursos...</span>
                  </div>
                </div>
              </div>
            {hotspots.map((hs) => (
              <button
                key={hs.name}
                className={`hotspot ${selectedZone === hs.name ? '!opacity-100 ring-4 ring-primary ring-offset-4 ring-offset-transparent' : 'opacity-20'}`}
                slot={`hotspot-${hs.name}`}
                data-position={hs.position}
                data-normal={hs.normal}
                onClick={() => {
                  setSelectedZone(hs.name);
                  setFormData(prev => ({ ...prev, organ: hs.name }));
                }}
                style={{ 
                  border: 'none', 
                  background: selectedZone === hs.name ? '#00f2ff' : '#4a5568',
                  boxShadow: selectedZone === hs.name ? '0 0 20px #00f2ff, 0 0 40px #00f2ff' : 'none'
                }}
              >
                <div className="annotation">{hs.name}</div>
              </button>
            ))}
          </model-viewer>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-10 left-10 z-20"
        >
          <div className="glass-panel p-8 rounded-2xl w-96 shadow-2xl flex flex-col gap-6">
            {!diagnostic ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-white/20 mb-4">clinical_notes</span>
                <p className="text-white/40 font-display text-sm">Esperando Diagnóstico...</p>
                <p className="text-white/20 text-xs mt-2 px-6">Por favor, ingrese los datos del paciente para iniciar el análisis.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-sans text-xs font-bold text-primary uppercase tracking-widest mb-1">Análisis Activo</h4>
                    <p className="font-display font-bold text-white text-lg">Módulo de Crecimiento ({diagnostic.organ})</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm animate-pulse">analytics</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold text-wrap">Tipo Tumor / Edad</p>
                      <p className="font-display font-bold text-white tracking-wide">{diagnostic.tumorType} / {diagnostic.age}a</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Capacidad del Tejido</p>
                      <p className="font-display font-bold text-tertiary">{diagnostic.carryingCapacity} cm³</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <span>Carga Tumoral Relativa</span>
                      <span>{safeLoadProgress.toFixed(2)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${safeLoadProgress}%` }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="h-full bg-gradient-to-r from-primary via-tertiary to-secondary"
                      ></motion.div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-panel py-4 px-4 rounded-xl text-center border-white/5">
                      <span className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Diámetro</span>
                      <span className="text-white font-display font-bold text-xl">{diagnostic.initialDiameter}<span className="text-xs text-slate-500 ml-1">cm</span></span>
                    </div>
                    <div className="glass-panel py-4 px-4 rounded-xl text-center border-white/5">
                      <span className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Etapa</span>
                      <span className="text-white font-display font-bold text-xl">{getEtapa(diagnostic.initialDiameter)}</span>
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-xl border-white/5 bg-white/2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-xs text-secondary">verified</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Predicción Inicial de Gompertz</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white font-display">Tasa de Proliferación Inicial</span>
                      <span className="text-secondary font-black text-xl">
                        {diagnostic && diagnostic.initialVolume > 0 
                          ? (Math.log(diagnostic.carryingCapacity / diagnostic.initialVolume) / 100).toFixed(4)
                          : '0.0000'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {isFormOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFormOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative glass-panel p-8 rounded-[2rem] w-full max-w-md border-white/10 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-tertiary to-secondary"></div>
                
                <h3 className="text-2xl font-display font-bold text-white mb-6">Ingresar Diagnóstico</h3>
                
                <form onSubmit={handleApplyDiagnostic} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo de Tumor</label>
                    <select 
                      value={formData.tumorType}
                      onChange={(e) => setFormData({...formData, tumorType: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      {TUMOR_TYPES.map(type => (
                        <option key={type} value={type} className="bg-[#1a1c1e] text-white">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Edad</label>
                      <input 
                        type="number" 
                        min="0"
                        max="120"
                        value={formData.age}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setFormData({...formData, age: ''});
                            return;
                          }
                          const num = parseInt(val);
                          if (!isNaN(num)) {
                            const clamped = Math.max(0, Math.min(120, num));
                            setFormData({...formData, age: clamped.toString()});
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Diámetro (cm)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={formData.initialDiameter}
                        onChange={(e) => setFormData({...formData, initialDiameter: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Órgano Afectado</label>
                    <select 
                      value={formData.organ}
                      onChange={(e) => setFormData({...formData, organ: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      {hotspots.map(hs => (
                        <option key={hs.name} value={hs.name} className="bg-[#1a1c1e] text-white">
                          {hs.name} (K: {ORGAN_K_MAP[hs.name]} cm³)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Aplicar Diagnóstico
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-4">
          {showStatus && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-6 py-3 rounded-xl glass-panel text-sm font-bold border border-primary text-primary"
            >
              {showStatus}
            </motion.div>
          )}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group p-px rounded-full bg-gradient-to-r from-primary to-tertiary overflow-hidden shadow-2xl"
            onClick={() => setIsFormOpen(true)}
          >
            <div className="relative px-8 py-4 bg-[#0e0e10] text-white group-hover:bg-primary group-hover:text-black transition-all rounded-full font-bold flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>medical_information</span>
              <span>Ingresar Diagnóstico</span>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
