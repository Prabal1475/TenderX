import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  DEMO_USER,
  DEMO_COMPANY_PROFILE,
  DEMO_SCENARIO_1_TENDER,
  DEMO_SCENARIO_2_TENDER,
  DEMO_EVALUATION_SCENARIO_1,
  DEMO_EVALUATION_SCENARIO_2,
  DEMO_ALL_TENDERS,
  DEMO_DOCUMENTS,
  DEMO_TASKS,
  DEMO_PREBAKED_COMPLIANCE_MATRIX,
  DEMO_PREBAKED_COVER_LETTER,
} from './demoData';
import { setAuthToken } from '../api/client';

const DemoContext = createContext(null);

export function DemoProvider({ children, onNavigate }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem('tenderx_demo_mode') === 'true';
  });

  const [currentScenario, setCurrentScenario] = useState('scenario_1'); // 'scenario_1' | 'scenario_2'
  const [activeTourStep, setActiveTourStep] = useState(1);
  const [demoDrafts, setDemoDrafts] = useState(() => [
    {
      id: 'demo-draft-01',
      tender_id: DEMO_SCENARIO_1_TENDER.id,
      title: 'Technical Compliance Matrix - Northern Railway CCTV',
      doc_type: 'Compliance_Matrix',
      status: 'Approved',
      drafted_content: DEMO_PREBAKED_COMPLIANCE_MATRIX,
      edited_content: DEMO_PREBAKED_COMPLIANCE_MATRIX,
      rag_citations: [
        { document_name: 'Northern_Railway_CCTV_Completion_Certificate.pdf', category: 'Past_Experience' },
        { document_name: 'ISO_9001_and_ISO_27001_Accreditation_Certificates.pdf', category: 'Statutory_Compliance' },
        { document_name: 'Udyam_MSME_Registration_Certificate_Apex.pdf', category: 'Company_Profile' },
      ],
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-draft-02',
      tender_id: DEMO_SCENARIO_1_TENDER.id,
      title: 'Official Cover Letter with EMD Exemption Declaration',
      doc_type: 'Cover_Letter',
      status: 'Under_Review',
      drafted_content: DEMO_PREBAKED_COVER_LETTER,
      edited_content: DEMO_PREBAKED_COVER_LETTER,
      rag_citations: [
        { document_name: 'Udyam_MSME_Registration_Certificate_Apex.pdf', category: 'Company_Profile' },
        { document_name: 'CA_Certified_3Year_Turnover_Audited_Balance_Sheet.pdf', category: 'Financial_Statement' },
      ],
      created_at: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('tenderx_demo_mode', 'true');
      if (!localStorage.getItem('tenderx_token')) {
        setAuthToken('demo-investor-token-apex');
      }
    } else {
      localStorage.removeItem('tenderx_demo_mode');
    }
  }, [isDemoMode]);

  const enableDemoMode = (scenario = 'scenario_1') => {
    setIsDemoMode(true);
    setCurrentScenario(scenario);
    setActiveTourStep(1);
    setAuthToken('demo-investor-token-apex');
    toast.success('🚀 Investor Demo Mode Activated', {
      description: 'Loaded Apex Enterprise Solutions (₹6.5 Cr turnover, MSME Micro).',
    });
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    toast.info('Exited Investor Demo Mode');
  };

  const switchScenario = (scenarioKey) => {
    setCurrentScenario(scenarioKey);
    const targetTender = scenarioKey === 'scenario_1' ? DEMO_SCENARIO_1_TENDER : DEMO_SCENARIO_2_TENDER;
    toast.info(
      scenarioKey === 'scenario_1'
        ? 'Switched to Scenario 1: Northern Railway CCTV (94% Fit)'
        : 'Switched to Scenario 2: NHAI FastTag (42% Disqualified Risk)',
      {
        description: `Active Tender: ${targetTender.tender_id}`,
      }
    );
  };

  const resetDemoData = () => {
    setCurrentScenario('scenario_1');
    setActiveTourStep(1);
    toast.success('Demo data restored to initial presentation state!');
  };

  const getActiveTender = () => {
    return currentScenario === 'scenario_1' ? DEMO_SCENARIO_1_TENDER : DEMO_SCENARIO_2_TENDER;
  };

  const getActiveEvaluation = () => {
    return currentScenario === 'scenario_1' ? DEMO_EVALUATION_SCENARIO_1 : DEMO_EVALUATION_SCENARIO_2;
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        enableDemoMode,
        disableDemoMode,
        currentScenario,
        switchScenario,
        activeTourStep,
        setActiveTourStep,
        resetDemoData,
        getActiveTender,
        getActiveEvaluation,
        demoDrafts,
        setDemoDrafts,
        demoUser: DEMO_USER,
        demoProfile: DEMO_COMPANY_PROFILE,
        demoTenders: DEMO_ALL_TENDERS,
        demoDocuments: DEMO_DOCUMENTS,
        demoTasks: DEMO_TASKS,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
