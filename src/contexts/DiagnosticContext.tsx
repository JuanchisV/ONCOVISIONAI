import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DiagnosticData {
  tumorType: string;
  age: number;
  initialDiameter: number;
  initialVolume: number;
  organ: string;
  carryingCapacity: number;
}

interface SimulationParams {
  rho: number;
  omega: number;
  gammaValue: number;
  dosisC: number;
  frequency: number;
  renalState: number;
  ecog: number;
  limiteToxicidad: number;
}

interface DiagnosticContextType {
  diagnostic: DiagnosticData | null;
  setDiagnostic: (data: DiagnosticData | null) => void;
  selectedOrgan: string | null;
  setSelectedOrgan: (organ: string | null) => void;
  isSimulationStarted: boolean;
  setIsSimulationStarted: (started: boolean) => void;
  simParams: SimulationParams;
  setSimParams: (params: SimulationParams) => void;
}

const DiagnosticContext = createContext<DiagnosticContextType | undefined>(undefined);

export const DiagnosticProvider = ({ children }: { children: ReactNode }) => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [isSimulationStarted, setIsSimulationStarted] = useState(false);
  const [simParams, setSimParams] = useState<SimulationParams>({
    rho: 0.06,
    omega: 0.0,
    gammaValue: 0.25,
    dosisC: 100,
    frequency: 1,
    renalState: 0.5,
    ecog: 0,
    limiteToxicidad: 100.0
  });

  return (
    <DiagnosticContext.Provider value={{ 
      diagnostic, 
      setDiagnostic, 
      selectedOrgan, 
      setSelectedOrgan,
      isSimulationStarted,
      setIsSimulationStarted,
      simParams,
      setSimParams
    }}>
      {children}
    </DiagnosticContext.Provider>
  );
};

export const useDiagnostic = () => {
  const context = useContext(DiagnosticContext);
  if (context === undefined) {
    throw new Error('useDiagnostic must be used within a DiagnosticProvider');
  }
  return context;
};
