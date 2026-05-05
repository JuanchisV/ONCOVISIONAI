import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useDiagnostic } from '../contexts/DiagnosticContext.tsx';
import { ORGAN_IMAGE_MAP, ORGAN_K_MAP } from '../constants.ts';

const TumorConfig = () => {
  const navigate = useNavigate();
  const { diagnostic, selectedOrgan, setIsSimulationStarted, setSimParams } = useDiagnostic();
  const [esIzquierda, setEsIzquierda] = useState(false);
  const [rho, setRho] = useState(0.06);
  const [omega, setOmega] = useState(0.0);
  const [biomarcadores, setBiomarcadores] = useState(false);
  const [renalState, setRenalState] = useState(0.5);
  const [ecog, setEcog] = useState(0);
  const [limiteToxicidad, setLimiteToxicidad] = useState(100.0);
  const [dosisC, setDosisC] = useState(100);
  const [frequency, setFrequency] = useState(3);
  const [loading, setLoading] = useState(true);

  // ECOG to Toxicity Limit mapping
  const handleEcogChange = (val: number) => {
    setEcog(val);
    if (val <= 1) setLimiteToxicidad(100.0);
    else if (val === 2) setLimiteToxicidad(70.0);
    else setLimiteToxicidad(40.0);
  };

  // Gamma mapping logic with Biomarker bonus
  const getEficaciaFinal = () => {
    let baseGamma = 0.25;
    if (selectedOrgan) {
      const organ = selectedOrgan.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (['testiculo', 'tiroide', 'piel'].some(o => organ.includes(o))) baseGamma = 0.45;
      else if (['pulmon', 'seno', 'vejiga', 'ovario', 'hueso'].some(o => organ.includes(o))) baseGamma = 0.35;
      else if (['higado', 'rinon', 'estomago', 'colon', 'prostata'].some(o => organ.includes(o))) baseGamma = 0.25;
      else if (['cerebro', 'pancreas'].some(o => organ.includes(o))) baseGamma = 0.15;
    }
    
    // Add 0.10 if biomarkers are positive
    return biomarcadores ? Number((baseGamma + 0.10).toFixed(2)) : baseGamma;
  };

  const gammaValue = getEficaciaFinal();

  // Auto-set lateralidad based on organ name
  React.useEffect(() => {
    if (selectedOrgan) {
      setLoading(true);
      const lower = selectedOrgan.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lower.includes('izquierd')) {
        setEsIzquierda(true);
      } else if (lower.includes('derech')) {
        setEsIzquierda(false);
      }
    }
  }, [selectedOrgan]);

  // Prefetch images for smoother transitions
  React.useEffect(() => {
    const images: HTMLImageElement[] = [];
    Object.values(ORGAN_IMAGE_MAP).forEach(url => {
      const img = new Image();
      img.src = url;
      images.push(img);
    });
    return () => {
      images.forEach(img => {
        img.onload = null;
        img.onerror = null;
        img.src = '';
      });
    };
  }, []);

  const getOrganImage = () => {
    if (!selectedOrgan) return null;
    
    // Normalize and clean organ name for matching
    const organClean = selectedOrgan.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/ñ/g, "n");

    if (organClean.includes('brazo')) return ORGAN_IMAGE_MAP['huesos_brazo'];
    if (organClean.includes('pierna')) return ORGAN_IMAGE_MAP['huesos_pierna'];
    if (organClean.includes('rinon')) return ORGAN_IMAGE_MAP['rinones'];
    if (organClean.includes('pulmon')) return ORGAN_IMAGE_MAP['pulmones'];
    if (organClean.includes('estomago')) return ORGAN_IMAGE_MAP['estomago'];
    if (organClean.includes('higado')) return ORGAN_IMAGE_MAP['higado'];
    if (organClean.includes('seno')) return ORGAN_IMAGE_MAP['senos'];

    const key = Object.keys(ORGAN_IMAGE_MAP).find(k => organClean.includes(k));
    return key ? ORGAN_IMAGE_MAP[key] : null;
  };

  const hasHotspot = () => {
    if (!selectedOrgan) return false;
    const clean = selectedOrgan.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, "n");
    return clean.includes('pulmon') || clean.includes('seno') || clean.includes('rinon');
  };

  const currentImage = getOrganImage();

  const getEtapa = (diameter: number) => {
    if (diameter < 2) return 'Etapa I';
    if (diameter <= 5) return 'Etapa II';
    return 'Etapa III';
  };

  const currentEtapa = diagnostic ? getEtapa(diagnostic.initialDiameter) : 'Etapa II';

  return (
    <div className="relative h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide bg-[#0e0e10]">
      <header className="px-8 py-6 flex justify-between items-end relative z-10 sticky top-0 bg-[#0e0e10]/80 backdrop-blur-md">
        <div>
          <motion.h1 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-display text-4xl text-white"
          >
            Configuración del Tumor
          </motion.h1>
          <p className="text-on-surface-variant font-sans text-base mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">location_on</span> 
            Localización: {selectedOrgan || 'Pendiente de diagnóstico'}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setSimParams({
                rho,
                omega,
                gammaValue,
                dosisC,
                frequency,
                renalState,
                ecog,
                limiteToxicidad
              });
              setIsSimulationStarted(true);
              navigate('/simulation');
            }}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-tertiary-container text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            Iniciar Simulación
          </button>
        </div>
      </header>

      <div className="flex-1 relative mx-8 mb-8 flex items-center justify-evenly gap-[40px] h-[74vh]">
        {/* Left Card: Perfil Biológico */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="glass-panel backdrop-blur-xl border border-white/10 bg-black/40 rounded-3xl p-6 w-80 shadow-2xl z-20 overflow-y-auto scrollbar-hide max-h-full"
        >
          <div className="pb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-xl">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
              </div>
              <h3 className="font-display font-semibold text-white">Perfil Biológico</h3>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-sans font-bold text-slate-400 block mb-3 uppercase tracking-widest flex items-center gap-1">
                Historial de Tratamiento
              </label>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setOmega(0.0)}
                  className={`w-full py-2.5 text-[10px] font-bold transition-all rounded-xl block text-left px-4 ${omega === 0.0 ? 'text-white bg-primary/40 ring-1 ring-primary/50' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}
                >
                  Paciente Nuevo
                </button>
                <button 
                  onClick={() => setOmega(0.2)}
                  className={`w-full py-2.5 text-[10px] font-bold transition-all rounded-xl block text-left px-4 ${omega === 0.2 ? 'text-white bg-primary/40 ring-1 ring-primary/50' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}
                >
                  Segunda Línea
                </button>
                <button 
                  onClick={() => setOmega(0.5)}
                  className={`w-full py-2.5 text-[10px] font-bold transition-all rounded-xl block text-left px-4 ${omega === 0.5 ? 'text-white bg-primary/40 ring-1 ring-primary/50' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}
                >
                  Multitratado
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-sans font-bold text-slate-400 block mb-3 uppercase tracking-widest flex items-center gap-1">
                Grado de Malignidad
              </label>
              <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                <button 
                  onClick={() => setRho(0.03)}
                  className={`flex-1 py-2 text-[10px] font-bold transition-all rounded-lg ${rho === 0.03 ? 'text-white bg-primary/40 shadow-inner ring-1 ring-primary/50' : 'text-slate-400 hover:text-white'}`}
                >
                  Bajo
                </button>
                <button 
                  onClick={() => setRho(0.06)}
                  className={`flex-1 py-2 text-[10px] font-bold transition-all rounded-lg ${rho === 0.06 ? 'text-white bg-primary/40 shadow-inner ring-1 ring-primary/50' : 'text-slate-400 hover:text-white'}`}
                >
                  Moderado
                </button>
                <button 
                  onClick={() => setRho(0.09)}
                  className={`flex-1 py-2 text-[10px] font-bold transition-all rounded-lg ${rho === 0.09 ? 'text-white bg-primary/40 shadow-inner ring-1 ring-primary/50' : 'text-slate-400 hover:text-white'}`}
                >
                  Agresivo
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-sans font-bold text-slate-400 block mb-3 uppercase tracking-widest">
                Biomarcadores
              </label>
              <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                <button 
                  onClick={() => setBiomarcadores(false)}
                  className={`flex-1 py-2 text-[10px] font-bold transition-all rounded-lg ${!biomarcadores ? 'text-white bg-emerald-500/30 ring-1 ring-emerald-500/50' : 'text-slate-400 hover:text-white'}`}
                >
                  Negativo
                </button>
                <button 
                  onClick={() => setBiomarcadores(true)}
                  className={`flex-1 py-2 text-[10px] font-bold transition-all rounded-lg ${biomarcadores ? 'text-white bg-error/30 ring-1 ring-error/50' : 'text-slate-400 hover:text-white'}`}
                >
                  Positivo
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center: Organ Image */}
        <div className="relative w-[450px] h-[500px] flex items-center justify-center border border-white/5 bg-black/20 rounded-3xl overflow-hidden group">
          <motion.div 
            initial={{ opacity: 0, scale: 2.18 }}
            animate={{ opacity: 1, scale: 2.34 }}
            transition={{ duration: 0.8 }}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
          >
            {!selectedOrgan ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-primary animate-[spin_6s_linear_infinite]">clinical_notes</span>
                    <div className="absolute inset-0 border-2 border-primary/20 rounded-full border-t-primary animate-spin"></div>
                  </div>
                </div>
                <div>
                  <h2 className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest">Selección Requerida</h2>
                </div>
              </div>
            ) : (
              <>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-[#0e0e10]/40">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  </div>
                )}
                {currentImage && (
                  <div className="relative w-full h-full flex items-center justify-center overflow-auto scrollbar-hide">
                    <img 
                      className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} object-none`} 
                      src={currentImage}
                      alt={selectedOrgan || 'Organ'}
                      onLoad={() => setLoading(false)}
                      decoding="sync"
                      fetchPriority="high"
                      style={{ 
                        imageRendering: '-webkit-optimize-contrast',
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                      }}
                    />
                  </div>
                )}
                
                <AnimatePresence>
                  {!loading && hasHotspot() && (
                    <motion.div 
                      key="hotspot"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className={`absolute top-[48%] w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500`}
                      style={{ left: esIzquierda ? '44.5%' : '55%' }}
                    >
                      <motion.div 
                        animate={{ 
                          scale: biomarcadores ? [1.2, 1.8, 1.2] : [0.8, 1.2, 0.8], 
                          opacity: biomarcadores ? [0.8, 0.4, 0.8] : [0.5, 0.2, 0.5] 
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="absolute inset-0 bg-error rounded-full blur-md"
                      ></motion.div>
                      <div className={`absolute inset-[6px] border-2 ${biomarcadores ? 'border-error' : 'border-error/50'} rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,59,48,0.4)]`}>
                        <div className={`w-2 h-2 bg-error rounded-full ${biomarcadores ? 'shadow-[0_0_15px_#ff3b30] scale-125' : 'shadow-[0_0_8px_#ff3b30]'}`}></div>
                      </div>
                      <div className="absolute -inset-1 border border-error/20 rounded-full animate-[spin_12s_linear_infinite]"></div>
                      <div className="absolute -inset-3 border border-error/10 rounded-full animate-[spin_18s_linear_infinite_reverse]"></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {hasHotspot() && !loading && (
                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex p-0.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 z-30">
                    <button 
                      onClick={() => setEsIzquierda(true)}
                      className={`px-3 py-1 text-[9px] font-bold transition-all rounded ${esIzquierda ? 'bg-primary/40 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      IZQUIERDA
                    </button>
                    <button 
                      onClick={() => setEsIzquierda(false)}
                      className={`px-3 py-1 text-[9px] font-bold transition-all rounded ${!esIzquierda ? 'bg-primary/40 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      DERECHA
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>

        {/* Right Card: Protocolo Médico */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="glass-panel backdrop-blur-xl border border-white/10 bg-black/40 rounded-3xl p-6 w-80 shadow-2xl z-20 overflow-y-auto scrollbar-hide max-h-full"
        >
          <div className="pb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-tertiary/20 rounded-xl">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              </div>
              <h3 className="font-display font-semibold text-white">Protocolo Médico</h3>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-sans font-bold text-slate-400 block mb-3 uppercase tracking-widest">
                Estado Funcional (ECOG)
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map((v) => (
                  <button
                    key={v}
                    onClick={() => handleEcogChange(v)}
                    className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg border ${ecog === v ? 'text-white bg-tertiary/40 border-tertiary/50 shadow-inner' : 'text-slate-500 border-white/5 hover:border-white/20'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {ecog >= 3 && (
                <p className="mt-2 text-[9px] text-error font-bold uppercase animate-pulse">Tolerancia Crítica</p>
              )}
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-sans font-bold text-slate-400 block mb-3 uppercase tracking-widest flex items-center gap-1">
                Estado Renal
              </label>
              <select 
                value={renalState}
                onChange={(e) => setRenalState(parseFloat(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-tertiary/50 transition-all appearance-none cursor-pointer"
              >
                <option value={0.5} className="bg-[#1a1a1c]">Óptima</option>
                <option value={0.2} className="bg-[#1a1a1c]">Disminuida</option>
                <option value={0.08} className="bg-[#1a1a1c]">Crítica</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-sans font-bold text-slate-400 block mb-3 uppercase tracking-widest flex items-center gap-1">
                Dosis Administrada
              </label>
              <div className="relative">
                <input 
                  type="number"
                  min="0"
                  value={isNaN(dosisC) ? '' : dosisC}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setDosisC(NaN);
                      return;
                    }
                    const num = parseFloat(val);
                    if (!isNaN(num)) {
                      setDosisC(Math.max(0, num));
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-tertiary/50 transition-all font-mono"
                  placeholder="100"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">mg</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-sans font-bold text-slate-400 block mb-3 uppercase tracking-widest">
                Frecuencia de Ciclo
              </label>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setFrequency(3)}
                  className={`w-full py-2.5 text-[10px] font-bold transition-all rounded-xl block text-left px-4 ${frequency === 3 ? 'text-white bg-tertiary/40 ring-1 ring-tertiary/50' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}
                >
                  Cada 3 días
                </button>
                <button 
                  onClick={() => setFrequency(7)}
                  className={`w-full py-2.5 text-[10px] font-bold transition-all rounded-xl block text-left px-4 ${frequency === 7 ? 'text-white bg-tertiary/40 ring-1 ring-tertiary/50' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}
                >
                  Cada 7 días
                </button>
                <button 
                  onClick={() => setFrequency(15)}
                  className={`w-full py-2.5 text-[10px] font-bold transition-all rounded-xl block text-left px-4 ${frequency === 15 ? 'text-white bg-tertiary/40 ring-1 ring-tertiary/50' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}
                >
                  Cada 15 días
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-1 uppercase tracking-widest font-bold">Eficacia del Tejido</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-tertiary">{gammaValue}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Coeficiente</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Informe de Proyección Clínica */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="mx-8 mb-12 glass-panel backdrop-blur-xl border border-white/10 bg-black/40 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/20 rounded-xl">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          </div>
          <h3 className="font-display text-2xl font-semibold text-white">Informe de Proyección Clínica</h3>
        </div>

        <div className="space-y-6 text-slate-300 font-sans leading-relaxed text-base max-w-5xl">
          <p>
            Paciente de <span className="text-white font-bold">{diagnostic?.age || '45'}</span> años con diagnóstico 
            en <span className="text-white font-bold">{currentEtapa}</span> de <span className="text-white font-bold">{diagnostic?.tumorType || 'Carcinoma'}</span> localizado 
            en <span className="text-white font-bold">{selectedOrgan || 'órgano no especificado'}</span>, con un diámetro inicial 
            de <span className="text-white font-bold">{diagnostic?.initialDiameter || '4.2'} cm</span> y 
            capacidad de carga tisular de <span className="text-white font-bold">{selectedOrgan ? (ORGAN_K_MAP[selectedOrgan] || 'N/A') : 'N/A'}</span>.
          </p>
          
          <p>
            El perfil biológico revela un grado de malignidad <span className="text-primary font-bold">
              {rho === 0.03 ? 'Bajo' : rho === 0.06 ? 'Moderado' : 'Agresivo'}
            </span> con biomarcadores <span className={`font-bold ${biomarcadores ? 'text-error' : 'text-emerald-400'}`}>
              {biomarcadores ? 'Positivo' : 'Negativo'}
            </span> e historial de <span className="text-white font-bold">
              {omega === 0.0 ? 'Paciente Nuevo' : omega === 0.2 ? 'Segunda Línea' : 'Multitratado'}
            </span>, lo que sugiere una resistencia celular de <span className="text-white font-bold">{omega}</span>.
          </p>

          <p>
            Bajo un estado funcional ECOG <span className="text-tertiary font-bold">{ecog}</span> y 
            función renal <span className="text-white font-bold">
              {renalState === 0.5 ? 'Óptima' : renalState === 0.2 ? 'Disminuida' : 'Crítica'}
            </span>, se prescribe protocolo de quimioterapia con dosis 
            de <span className="text-tertiary font-bold">{dosisC} mg</span> cada <span className="text-white font-bold">{frequency}</span> días, 
            estimando una eficacia terapéutica del <span className="text-tertiary font-bold">{(gammaValue * 100).toFixed(0)}%</span>.
          </p>


        </div>
      </motion.div>
    </div>
  );
};
export default TumorConfig;
