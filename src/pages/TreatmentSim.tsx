import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDiagnostic } from '../contexts/DiagnosticContext.tsx';

const TABS = [
  { id: 'growth', label: 'Fase crecimiento' },
  { id: 'treatment', label: 'Fase de Tratamiento' },
  { id: 'pk', label: 'Fase de Farmacocinética' },
];

const TreatmentSim = () => {
  const { diagnostic, selectedOrgan, simParams } = useDiagnostic();
  const [activeTab, setActiveTab] = useState('treatment');
  const [currentDay, setCurrentDay] = useState(0);
  const [treatmentDuration, setTreatmentDuration] = useState(84); // Default to 12 weeks

  const getEtapa = (diameter: number) => {
    if (diameter < 2) return 'Etapa I';
    if (diameter <= 5) return 'Etapa II';
    return 'Etapa III';
  };

  const age = diagnostic?.age || '45';
  const tumorType = diagnostic?.tumorType || 'Carcinoma';
  const organ = selectedOrgan || 'Pulmón';
  const etapa = diagnostic ? getEtapa(diagnostic.initialDiameter) : 'Etapa II';

  const initialVolume = diagnostic ? (Math.PI * Math.pow(diagnostic.initialDiameter, 3)) / 6 : 14.2;
  const K = diagnostic?.carryingCapacity || 1000;
  const rho_diaria = simParams.rho / 32;

  // Gompertz model for growth phase
  const calculateGrowthVolume = (day: number) => {
    return K * Math.exp(Math.log(initialVolume / K) * Math.exp(-rho_diaria * day));
  };

  // Treatment Vinicio is now the volume at the current selected day in growth phase
  const vInicioTreatment = calculateGrowthVolume(currentDay);

  // Iterative Treatment Simulation
  const getTreatmentData = () => {
    let V = vInicioTreatment;
    let C = 0;
    
    const alpha = 0.15;
    const frequency = simParams.frequency;        // 3, 7 o 15
    const gammaValue = simParams.gammaValue;      // 0.15–0.55
    
    const baseC0 = simParams.dosisC / 2200;
    const C0 = baseC0 * (3 / frequency) * (1 - simParams.omega * 0.5);
    
    const points = [{ day: 0, volume: V }];

    for (let day = 1; day <= treatmentDuration; day++) {
      if (day % frequency === 0) {
        C = C0;  // resetear al pico de dosis
      }
      C = C * Math.exp(-alpha);
      
      const growth = rho_diaria * V * Math.log(Math.max(1.001, K / V));
      const impact = gammaValue * C * V;
      const dN = growth - impact;
      
      V = Math.max(0.5, V + dN);
      points.push({ day, volume: V });
    }
    return points;
  };

  const growthPoints = Array.from({ length: 121 }, (_, i) => {
    const day = i;
    return { day, volume: calculateGrowthVolume(day) };
  });

  const treatmentPoints = getTreatmentData();
  const finalTreatmentVolume = treatmentPoints[treatmentPoints.length - 1].volume;
  const finalDiameter = Math.pow((6 * finalTreatmentVolume) / Math.PI, 1/3);

  const getPKData = () => {
    let currentC = 0;
    const frequency = simParams.frequency;
    const dosage = simParams.dosisC / 100;
    const ke = simParams.renalState; // 0.5=óptima, 0.2=disminuida, 0.08=crítica

    const points = [{ day: 0, currentC: 0 }];
    for (let day = 1; day <= treatmentDuration; day++) {
      if (day % frequency === 0) {
        currentC = dosage; // RESETEAR al pico, no acumular
      }
      currentC = currentC * Math.exp(-ke);
      points.push({ day, currentC });
    }
    return points;
  };

  const pkPoints = getPKData();
  const maxC = Math.max(...pkPoints.map(p => p.currentC), 1);

  const getPKX = (day: number) => (day / treatmentDuration) * 800;
  const getPKY = (c: number) => 180 - (c / maxC) * 160;

  const pkPath = `M ${pkPoints.map(p => `${getPKX(p.day)} ${getPKY(p.currentC)}`).join(' L ')}`;

  // Unified Y-Axis Scale for proportionality
  const maxPossibleVolume = calculateGrowthVolume(120);
  const maxY = maxPossibleVolume * 1.2;
  const minY = 0;

  const getGrowthX = (day: number) => (day / 120) * 800;
  const getGrowthY = (volume: number) => 180 - ((volume - minY) / (maxY - minY)) * 160;

  const getTreatmentX = (day: number) => (day / treatmentDuration) * 800;
  const getTreatmentY = (volume: number) => 180 - ((volume - minY) / (maxY - minY)) * 160;

  // Growth paths
  const growthPathFull = `M ${growthPoints.map(p => `${getGrowthX(p.day)} ${getGrowthY(p.volume)}`).join(' L ')}`;
  const currentGrowthPointsList = growthPoints.filter(p => p.day <= currentDay);
  const growthPathCurrent = currentGrowthPointsList.length > 0 
    ? `M ${currentGrowthPointsList.map(p => `${getGrowthX(p.day)} ${getGrowthY(p.volume)}`).join(' L ')}`
    : "";

  // Treatment path
  const treatmentPath = `M ${treatmentPoints.map(p => `${getTreatmentX(p.day)} ${getTreatmentY(p.volume)}`).join(' L ')}`;
  
  const baselineY = getGrowthY(initialVolume);
  const treatmentBaselineY = getTreatmentY(vInicioTreatment);
  
  const currentGrowthVolume = calculateGrowthVolume(currentDay);
  const currentMarkerX = getGrowthX(currentDay);
  const currentMarkerY = getGrowthY(currentGrowthVolume);

  const durationLabel = treatmentDuration === 28 ? '4 Semanas' : treatmentDuration === 84 ? '12 Semanas' : '24 Semanas';

  const reductionPct = vInicioTreatment > 0 
    ? Math.max(0, ((vInicioTreatment - finalTreatmentVolume) / vInicioTreatment) * 100) 
    : 0;

  const getClinicalAnalysis = () => {
    let tumorDesc = "";
    let organDesc = "";

    switch (tumorType) {
      case 'Sarcoma':
        tumorDesc = "Los sarcomas son tejidos conjuntivos malignos que a menudo presentan una matriz extracelular densa, lo cual puede dificultar la penetración homogénea de agentes citotóxicos.";
        break;
      case 'Linfoma':
        tumorDesc = "El linfoma, al ser un tumor hematológico/linfático, suele mostrar una respuesta inicial muy sensible a la quimioterapia, aunque requiere un monitoreo estricto de la médula ósea.";
        break;
      case 'Melanoma':
        tumorDesc = "El melanoma es conocido por su alta tasa de mutación y potencial de metástasis rápida, lo que exige una presión terapéutica constante para evitar escapes clonales.";
        break;
      case 'Glioblastoma':
        tumorDesc = "El glioblastoma es un tumor cerebral altamente agresivo con bordes infiltrantes, donde la barrera hematoencefálica juega un papel crítico en la eficacia del fármaco.";
        break;
      default:
        tumorDesc = "Este carcinoma presenta una cinética de proliferación celular que requiere un equilibrio preciso entre la dosis administrada y los periodos de recuperación del tejido sano.";
    }

    switch (organ) {
      case 'Pulmón':
        organDesc = "En el tejido pulmonar, la oxigenación y la vascularización favorecen la llegada del fármaco, pero la movilidad respiratoria debe considerarse en el análisis de márgenes.";
        break;
      case 'Hígado':
        organDesc = "El hígado es el centro metabólico primario; un tumor en esta zona compite con las funciones de desintoxicación, elevando la importancia de la toxicidad sistémica.";
        break;
      case 'Cerebro':
        organDesc = "La localización cerebral implica riesgos de edema peritumoral y requiere agentes que puedan cruzar eficazmente la microvasculatura cerebral.";
        break;
      case 'Hueso':
        organDesc = "El microambiente óseo es mineralizado y complejo, lo que a menudo ralentiza la difusión pasiva de grandes moléculas terapéuticas.";
        break;
      default:
        organDesc = "La ubicación del tumor influye directamente en la biodisponibilidad local del fármaco y en el perfil de efectos secundarios esperados.";
    }

    return `${tumorDesc} ${organDesc} Análisis Clínico: Basado en la eficacia del tejido y los biomarcadores, el tratamiento ejerce una presión terapéutica constante sobre el modelo de Gompertz, proyectando una reducción de masa del ${reductionPct.toFixed(1)}% al final del ciclo seleccionado.`;
  };

  const getRenalSafetyMessage = () => {
    if (simParams.renalState === 0.08) {
      return {
        type: 'critical',
        text: 'Aviso de Seguridad: Se detecta una tasa de depuración crítica. La concentración plasmática se mantiene elevada peligrosamente entre ciclos.'
      };
    } else if (simParams.renalState === 0.2) {
      return {
        type: 'warning',
        text: 'Aviso de Seguridad: Se detecta una tasa de depuración reducida. La concentración plasmática se mantiene elevada entre ciclos.'
      };
    }
    return {
      type: 'optimal',
      text: 'Parámetros de Eliminación: El sistema renal procesa el agente dentro de los rangos de seguridad previstos.'
    };
  };

  const safety = getRenalSafetyMessage();
  const estimatedSuccess = Math.round(simParams.gammaValue * 100);

  const getToxicityRisk = (renalState: number) => {
    if (renalState >= 0.5) return { val: 12, label: 'BAJO', color: 'tertiary' };
    if (renalState >= 0.2) return { val: 35, label: 'MODERADO', color: 'primary' };
    return { val: 75, label: 'ALTO', color: 'error' };
  };

  const getResistanceRisk = (etapaStr: string) => {
    if (etapaStr === 'Etapa I') return { val: 5, label: 'MÍNIMA' };
    if (etapaStr === 'Etapa II') return { val: 22, label: 'MODERADA' };
    return { val: 55, label: 'ALTA' };
  };

  const toxicityRisk = getToxicityRisk(simParams.renalState);
  const resistanceRisk = getResistanceRisk(etapa);

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#0e0e10] p-margin overflow-y-auto">
      <div className="max-w-max_width mx-auto">
        <div className="flex justify-between items-end mb-lg">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h1 className="font-display text-4xl text-white mb-2">Simulación de Tratamiento</h1>
            <p className="text-on-surface-variant font-sans tracking-wide">
              Edad: <span className="text-white font-bold">{age} años</span> | 
              <span className="text-white font-bold ml-1">{tumorType}</span> de 
              <span className="text-white font-bold ml-1">{organ}</span> 
              <span className="text-white font-bold ml-1">{etapa}</span>
            </p>
          </motion.div>
          <div className="flex gap-4">
          </div>
        </div>

        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 lg:col-span-8 space-y-gutter">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-8 rounded-xl relative overflow-hidden flex flex-col h-[520px]"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all relative ${
                        activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white/10 rounded-md"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <span className={`w-4 h-0.5 ${(activeTab === 'pk' || activeTab === 'growth') ? 'bg-secondary glow-line-secondary' : 'bg-primary glow-line-primary'}`}></span> 
                    {activeTab === 'pk' ? 'Concentración' : 'Predicho'}
                  </span>
                  {activeTab !== 'pk' && (
                    <span className="flex items-center gap-2">
                      <span className={`w-4 h-0.5 ${activeTab === 'growth' ? 'bg-slate-500/40' : 'bg-tertiary glow-line-tertiary opacity-40'}`}></span> Línea Base
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                  {activeTab === 'treatment' && (
                    <motion.div
                      key="treatment"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      <h3 className="font-display text-xl text-white mb-8">Dinámica de Masa Tumoral ({durationLabel})</h3>
                      <div className="flex-1 relative w-full flex items-end justify-between px-4 mb-12">
                        <svg className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 800 200">
                          {/* Initial Volume Baseline for Treatment */}
                          <line 
                            x1="0" y1={treatmentBaselineY} x2="800" y2={treatmentBaselineY} 
                            stroke="currentColor" 
                            strokeDasharray="4 4" 
                            strokeWidth="1.5" 
                            className="text-white/10"
                          />
                          <text x="795" y={treatmentBaselineY - 5} textAnchor="end" className="fill-white/20 text-[8px] font-bold uppercase tracking-widest">Base Pre-Tratamiento: {vInicioTreatment.toFixed(1)} cm³</text>
                          
                          <motion.path 
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="text-primary glow-line-primary" 
                            d={treatmentPath} 
                            stroke="currentColor" 
                            strokeLinecap="round" 
                            strokeWidth="4" 
                          />
                        </svg>
                        <div className="flex-1 flex justify-between text-[10px] text-slate-500 font-bold pt-8 absolute bottom-0 w-full left-0 px-4 uppercase tracking-widest">
                          <span>Día 0</span>
                          <span>{Math.floor(treatmentDuration / 4)}d</span>
                          <span>{Math.floor(treatmentDuration / 2)}d</span>
                          <span>{Math.floor(3 * treatmentDuration / 4)}d</span>
                          <span>{treatmentDuration}d</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'growth' && (
                    <motion.div
                      key="growth"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      <h3 className="font-display text-xl text-white mb-8">Evolución en Fase de Crecimiento</h3>
                      <div className="flex-1 relative w-full flex items-end justify-between px-4 mb-12">
                        <svg className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 800 200">
                          {/* Maximum Visual Window Boundary (K Reference) */}
                          <line 
                            x1="0" y1="20" x2="800" y2="20" 
                            stroke="currentColor" 
                            strokeWidth="1" 
                            strokeDasharray="4 4" 
                            className="text-white/10"
                          />
                          <text x="795" y="15" textAnchor="end" className="fill-white/20 text-[10px] font-bold uppercase tracking-widest">Capacidad Máxima (K): {K.toFixed(0)} cm³</text>

                          {/* Static Baseline (V0) */}
                          <line 
                            x1="0" y1={baselineY} x2="800" y2={baselineY} 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            strokeDasharray="6 3" 
                            className="text-slate-500/40"
                          />

                          {/* Gompertz Curve Path (Reference) */}
                          <path 
                            d={growthPathFull} 
                            stroke="currentColor" 
                            strokeLinecap="round" 
                            strokeWidth="1" 
                            className="text-secondary/10"
                            fill="none"
                          />

                          {/* Gompertz Curve Path (Active) */}
                          <motion.path 
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.2 }}
                            className="text-secondary glow-line-secondary" 
                            d={growthPathCurrent} 
                            stroke="currentColor" 
                            strokeLinecap="round" 
                            strokeWidth="4" 
                          />

                          {/* Marker */}
                          <motion.circle
                            cx={currentMarkerX}
                            cy={currentMarkerY}
                            r="6"
                            className="fill-white stroke-secondary stroke-2 shadow-[0_0_15px_rgba(var(--secondary-rgb),0.5)]"
                            initial={false}
                            animate={{ cx: currentMarkerX, cy: currentMarkerY }}
                          />
                        </svg>
                        <div className="flex-1 flex justify-between text-[10px] text-slate-500 font-bold pt-8 absolute bottom-0 w-full left-0 px-4 uppercase tracking-widest">
                          <span>Día 0</span><span>Día 30</span><span>Día 60</span><span>Día 90</span><span>Día 120</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'pk' && (
                    <motion.div
                      key="pk"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      <h3 className="font-display text-xl text-white mb-8">Perfil Farmacocinético del Agente</h3>
                      <div className="flex-1 relative w-full flex items-end justify-between px-4 mb-12">
                        <svg className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 800 200">
                          <motion.path 
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="text-secondary glow-line-secondary" 
                            d={pkPath} 
                            stroke="currentColor" 
                            strokeLinecap="round" 
                            strokeWidth="4" 
                          />
                        </svg>
                        <div className="flex-1 flex justify-between text-[10px] text-slate-500 font-bold pt-8 absolute bottom-0 w-full left-0 px-4 uppercase tracking-widest">
                          <span>Día 0</span>
                          {(() => {
                            const cycleCount = Math.floor(treatmentDuration / simParams.frequency);
                            const skip = Math.max(1, Math.ceil(cycleCount / 6));
                            return Array.from({ length: cycleCount })
                              .map((_, i) => i + 1)
                              .filter(n => n % skip === 0)
                              .map(n => <span key={n}>C {n}</span>);
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-8 border-t border-white/5">
                {activeTab === 'growth' ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Línea de Tiempo de Simulación</label>
                      <span className="text-primary font-display font-bold text-2xl">Día {currentDay}</span>
                    </div>
                    <div className="relative h-12 flex items-center group">
                      <input
                        type="range"
                        min={0}
                        max={120}
                        value={currentDay}
                        onChange={(e) => setCurrentDay(parseInt(e.target.value))}
                        className="absolute w-full h-1 bg-surface-variant rounded-full appearance-none outline-none cursor-pointer accent-primary"
                      />
                      <div 
                        className="absolute h-1 bg-primary rounded-full pointer-events-none transition-all duration-75"
                        style={{ width: `${(currentDay / 120) * 100}%` }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Configuración de Ciclo de Tratamiento</label>
                      <span className="text-primary font-display font-bold text-2xl">{durationLabel}</span>
                    </div>
                    <div className="flex justify-between relative px-2">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 -z-0"></div>
                      {[28, 84, 168].map((duration) => (
                        <button
                          key={duration}
                          onClick={() => setTreatmentDuration(duration)}
                          className={`relative z-10 flex flex-col items-center gap-2 group`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                            treatmentDuration === duration 
                              ? 'bg-primary border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] scale-125' 
                              : 'bg-[#1a1a1c] border-white/20 hover:border-white/40'
                          }`}></div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest transition-all ${
                            treatmentDuration === duration ? 'text-white' : 'text-slate-500'
                          }`}>
                            {duration === 28 ? '4 Sem' : duration === 84 ? '12 Sem' : '24 Sem'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-gutter">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="glass-panel p-6 rounded-xl aspect-square relative overflow-hidden"
              >
                <div className="absolute top-6 left-6 z-10">
                  <span className="bg-error/20 text-error px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Estado Inicial</span>
                </div>
                <img 
                  alt="3D Tumor Model Initial" 
                  className="w-full h-full object-cover opacity-80 mix-blend-screen" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaQNWoXABmHaDDoanm3_fIhSIRGgfnWyn6fGEJ3B9Eeq8QlJElalkJgCHFpaeKMBoIjiU_PwWbb_FRSqYBuYNUly219_-Cl4FO16ITeO5i1u8OV7OH2AqXBoWzmemViUdO8BJ5KI4VFnKUBSguWio4bSinMZbdMmOZ8-Qu0hx491jU8H6H3dsvCP9Yy8qIg_Ted6JR2eFAppNh-NZZwKHGNbuLsoNaf3dKGYXr8uoKq6gEtxmqxDlXCC1ilZ9egcJ_dznhhoioSzeV"
                />
                <div className="absolute bottom-6 right-6 text-right">
                  <p className="text-on-surface-variant text-xs uppercase font-bold tracking-widest">Volumen Inicial</p>
                  <p className="text-white font-display font-bold text-2xl">{activeTab === 'growth' || activeTab === 'pk' ? initialVolume.toFixed(2) : vInicioTreatment.toFixed(2)} cm³</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="glass-panel p-6 rounded-xl aspect-square relative overflow-hidden"
              >
                <div className="absolute top-6 left-6 z-10">
                  <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${activeTab === 'growth' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                    {activeTab === 'growth' ? `Punto Selección (Día ${currentDay})` : `Predicho (${durationLabel})`}
                  </span>
                </div>
                <img 
                  alt="3D Tumor Model Predicted" 
                  className="w-full h-full object-cover opacity-80 mix-blend-screen" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeiitSBS8v63eWIYiWeHiWPUCteh_Kk9y6eTLb8xU6ucrA9FY4Yrb80jjbD6cJdo_s5se-WGinzC2bKk0_rI65dgdd5h1KM7x6pkDUbGFqHqkCaO6nGysoNbkRLKeP9yXiHehoZKSpC-G3VCJVa_CME6hZWVoLzG6JokKNOWHiTDXyOiWmTTRmywAoSdwuOc65_69ef7NaE6-QOzoJqzY0myyc9sS3KH6QX3Ekh6iJZsJlAT-DTQ_GRVJ4ULjhPXWPaP34QSgWKsnl"
                />
                <div className="absolute bottom-6 right-6 text-right">
                  <p className="text-on-surface-variant text-xs uppercase font-bold tracking-widest">Volumen Final</p>
                  <p className={`${activeTab === 'growth' || activeTab === 'pk' ? 'text-secondary' : 'text-primary'} font-display font-bold text-2xl`}>
                    {activeTab === 'growth' || activeTab === 'pk' ? calculateGrowthVolume(activeTab === 'pk' ? currentDay : currentDay).toFixed(2) : finalTreatmentVolume.toFixed(2)} cm³
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-gutter mt-gutter">
              {[
                { 
                  label: 'Diámetro Proyectado', 
                  val: `${finalDiameter.toFixed(2)} cm`, 
                  icon: 'straighten', 
                  color: 'secondary',
                  subtitle: 'Cálculo Inverso de Masa'
                },
                { 
                  label: 'Cobertura Activa', 
                  val: durationLabel, 
                  icon: 'event_available', 
                  color: 'tertiary',
                  subtitle: 'Simulación Completa'
                }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + (i * 0.1) }}
                  className="glass-panel p-6 rounded-xl flex items-center gap-5"
                >
                  <div className={`w-14 h-14 rounded-xl bg-${stat.color}/10 flex items-center justify-center border border-${stat.color}/20`}>
                    <span className={`material-symbols-outlined text-3xl text-${stat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={stat.val}
                      className="font-display font-black text-xl text-white leading-none mb-1"
                    >
                      {stat.val}
                    </motion.p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter opacity-60">{stat.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-gutter">
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-8 rounded-xl border border-primary/20 bg-primary/5"
            >
              <div className="flex items-center gap-4 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                <h3 className="font-display text-xl text-white">Monitor de Respuesta Terapéutica</h3>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">AGENTE DE QUIMIOTERAPIA</p>
                  <p className="text-xl font-bold text-white">Tratamiento Seleccionado</p>
                </div>
                
                <div className={`p-4 rounded-xl border flex gap-3 items-start ${
                  safety.type === 'critical' ? 'bg-error/10 border-error/20' : 
                  safety.type === 'warning' ? 'bg-tertiary/10 border-tertiary/20' : 
                  'bg-success/10 border-success/20'
                }`}>
                  <span className={`material-symbols-outlined text-sm mt-0.5 ${
                    safety.type === 'critical' ? 'text-error' : 
                    safety.type === 'warning' ? 'text-tertiary' : 
                    'text-success'
                  }`}>
                    {safety.type === 'optimal' ? 'check_circle' : 'warning'}
                  </span>
                  <p className={`text-[11px] leading-relaxed font-bold tracking-tight ${
                    safety.type === 'critical' ? 'text-error' : 
                    safety.type === 'warning' ? 'text-tertiary' : 
                    'text-success'
                  }`}>
                    {safety.text}
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">TASA DE ÉXITO ESTIMADA</p>
                    <p className="text-3xl font-extrabold text-primary">{estimatedSuccess}%</p>
                  </div>
                  <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${
                    estimatedSuccess > 80 ? 'border-primary/20 border-t-primary' : 'border-tertiary/20 border-t-tertiary'
                  }`}>
                    <span className="text-[10px] font-black">{estimatedSuccess > 80 ? 'ALTA' : 'MEDIA'}</span>
                  </div>
                </div>
                
                <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                  {getClinicalAnalysis()}
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-panel p-8 rounded-xl"
            >
              <h4 className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">Perfil de Riesgo</h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-3 uppercase tracking-tighter">
                    <span className="text-on-surface">Riesgo de Toxicidad</span>
                    <span className={`text-${toxicityRisk.color}`}>{toxicityRisk.label} ({toxicityRisk.val}%)</span>
                  </div>
                  <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                    <motion.div 
                      key={`tox-${toxicityRisk.val}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${toxicityRisk.val}%` }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className={`h-full bg-${toxicityRisk.color}`}
                    ></motion.div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-3 uppercase tracking-tighter">
                    <span className="text-on-surface">Resistencia a Drogas</span>
                    <span className="text-primary">{resistanceRisk.label} ({resistanceRisk.val}%)</span>
                  </div>
                  <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                    <motion.div 
                      key={`res-${resistanceRisk.val}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${resistanceRisk.val}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full bg-primary"
                    ></motion.div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight mt-4">
                  Cálculos basados en depuración renal y progresión volumétrica inicial.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentSim;
