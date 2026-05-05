import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    { 
      id: '01', 
      title: 'Definir Parámetros', 
      color: 'primary', 
      desc: 'Ingresa datos de biopsia, tasa de crecimiento celular y marcadores metabólicos para una precisión sin precedentes.', 
      icon: 'location_on',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306dca664?auto=format&fit=crop&q=80&w=1000'
    },
    { 
      id: '02', 
      title: 'Configurar Simulación', 
      color: 'tertiary', 
      desc: 'Ajusta los protocolos clínicos dinámicamente y selecciona modelos de IA avanzados para proyecciones personalizadas.', 
      icon: 'settings_input_component',
      image: 'https://images.unsplash.com/photo-1551288049-bbbda5366392?auto=format&fit=crop&q=80&w=1000'
    },
    { 
      id: '03', 
      title: 'Ejecutar Simulación', 
      color: 'secondary', 
      desc: 'Visualiza trayectorias de progresión a largo plazo y optimiza las estrategias de tratamiento en tiempo real.', 
      icon: 'play_arrow',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306dca664?auto=format&fit=crop&q=80&w=1000'
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-8 overflow-hidden bg-[#0e0e10]">
      <div className="fixed inset-0 mesh-bg z-0 opacity-50"></div>
      
      <AnimatePresence mode="wait">
        {!showOnboarding ? (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl w-full polished-glass rounded-[2rem] border border-white/10 p-12 md:p-24 relative overflow-hidden shadow-2xl flex flex-col items-center text-center z-10"
          >
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
              <img 
                alt="3D abstract glowing helix structure" 
                className="w-full h-full object-cover mix-blend-screen scale-110" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLDldpvjr_a-5UQ_aBT8Kt1ejglgia8V35NNsfKtEF3h9PRUM1NHx_sGH93QI1ABXJDF_cipWooP0NKV2MZyQ9nVWi5lgzbQR_MId64i-ckjR0AKEw-avAeTmUzLDY9i6Zf13i6ePgEp4bmxiwwDBSQzPHVdoHtIl-1GEmxV994fmoQfMlhrKM4Q7BxLyT1dbKFo3T6Ey8lS4MPx2oX-GomiphY4liNcQClNCdiKfqGpvEOzJdVVO-2ibwNl6EYUb15eMWGqfXwzpA"
              />
            </div>

            <div className="relative z-20 space-y-8 max-w-2xl">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center space-x-3 mb-8"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-tertiary flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
                </div>
                <span className="font-display text-xl text-white tracking-tighter uppercase font-bold">OncoVision AI</span>
              </motion.div>

              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="font-display text-4xl md:text-7xl text-white leading-tight font-bold tracking-tight"
              >
                Oncología de Precisión <br/>
                <span className="bg-gradient-to-r from-primary via-tertiary to-secondary bg-clip-text text-transparent">Redefinida</span>
              </motion.h1>

              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-sans text-lg text-on-surface-variant leading-relaxed px-4 opacity-70"
              >
                Experimenta la inteligencia clínica a través de la visualización multidimensional interactiva en tiempo real.
              </motion.p>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="pt-8"
              >
                <button 
                  onClick={() => setShowOnboarding(true)}
                  className="group relative px-20 py-5 font-display font-bold text-white bg-white/5 hover:bg-white/10 rounded-full transition-all duration-300 border border-white/20 polished-glass active:scale-95 shadow-[0_0_40px_rgba(173,198,255,0.2)]"
                >
                  <span className="relative z-10 flex items-center gap-3 text-lg">Comenzar
                    <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
                  </span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e0e10]/90 backdrop-blur-2xl p-4 sm:p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-4xl w-full h-[500px] polished-glass rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
            >
              <button 
                onClick={() => navigate('/dashboard')}
                className="absolute top-6 left-6 z-50 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1 group"
              >
                Saltar
                <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">chevron_right</span>
              </button>

              <div className="w-full md:w-2/5 relative h-40 md:h-full overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={onboardingSteps[currentStep].image}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    transition={{ duration: 1 }}
                    src={onboardingSteps[currentStep].image}
                    className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    alt=""
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0e0e10]"></div>
              </div>

              <div className="flex-1 p-6 md:p-12 flex flex-col justify-center relative">
                <div className="absolute top-6 right-8 flex gap-2">
                  {onboardingSteps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`}
                    ></div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-${onboardingSteps[currentStep].color}/10 border border-${onboardingSteps[currentStep].color}/20 flex items-center justify-center`}>
                        <span className={`material-symbols-outlined text-2xl text-${onboardingSteps[currentStep].color}`}>{onboardingSteps[currentStep].icon}</span>
                      </div>
                      <span className="text-4xl font-display font-black text-white/5">{onboardingSteps[currentStep].id}</span>
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
                        {onboardingSteps[currentStep].title}
                      </h2>
                      <p className="text-base text-on-surface-variant/80 leading-relaxed max-w-md">
                        {onboardingSteps[currentStep].desc}
                      </p>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={handleNext}
                        className="group flex items-center justify-between w-full sm:w-auto sm:min-w-[200px] px-6 py-4 bg-white text-[#0e0e10] rounded-xl font-display font-bold text-base hover:bg-primary transition-all active:scale-95 shadow-xl"
                      >
                        <span>{currentStep === onboardingSteps.length - 1 ? 'Empezar Análisis' : 'Siguiente Paso'}</span>
                        <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Welcome;
