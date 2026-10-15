// Curated Indian Government Procurement Demo Data for VC Showcases

export const DEMO_USER = {
  id: 'demo-user-apex-01',
  email: 'investor-demo@tenderx.in',
  full_name: 'Apex Enterprise Solutions (Demo Admin)',
  is_active: true,
  is_superuser: true,
};

export const DEMO_COMPANY_PROFILE = {
  company_name: 'Apex Enterprise Solutions Pvt Ltd',
  pan_number: 'AAACA9876K',
  gst_number: '07AAACA9876K1Z9',
  udyam_msme_number: 'UDYAM-DL-01-0098765',
  is_msme: 'Micro',
  annual_turnover_cr: 6.5,
  net_worth_cr: 3.2,
  years_of_experience: 6,
  sectors: [
    'IT Infrastructure',
    'CCTV Surveillance',
    'Software Solutions',
    'Smart City & IoT',
  ],
  certifications: [
    'ISO 9001:2015',
    'ISO 27001:2022',
    'CMMI Level 3',
    'ISO 20000-1',
  ],
  key_clients: [
    'Northern Railway',
    'Bharat Electronics Limited (BEL)',
    'Delhi Metro Rail Corporation (DMRC)',
  ],
  core_competencies:
    'Turnkey system integration, enterprise software development, cloud migration, CCTV and IP surveillance systems, campus networking, AI video analytics, and multi-year AMC support for government PSUs.',
};

export const DEMO_SCENARIO_1_TENDER = {
  id: 'gem-railway-cctv-01',
  tender_id: 'GEM/2026/B/8912401',
  title: 'Supply, Installation & Maintenance of Enterprise CCTV Surveillance & AI Analytics System',
  authority: 'Northern Railway Headquarter, Baroda House, New Delhi',
  portal: 'GeM',
  category: 'Works',
  estimated_value_inr: 35000000.0, // 3.5 Cr
  emd_amount_inr: 700000.0, // 7 Lakhs
  msme_exemption: true,
  startup_exemption: true,
  submission_deadline: new Date(Date.now() + 86400000 * 18).toISOString(),
  opening_date: new Date(Date.now() + 86400000 * 19).toISOString(),
  location_state: 'Delhi',
  description:
    'Turnkey implementation of high-definition IP cameras, NVRs, optical fiber backbone cabling, server infrastructure with facial recognition and crowd density AI analytics across 18 railway stations under Delhi Division.',
  document_url: 'https://gem.gov.in/tenders/GEM-2026-B-8912401.pdf',
  eligibility_criteria: {
    min_turnover_cr: 4.5,
    min_experience_years: 3,
    required_certifications: ['ISO 9001:2015', 'ISO 27001:2022'],
    past_project_value_pct: 50,
  },
  status: 'Active',
};

export const DEMO_SCENARIO_2_TENDER = {
  id: 'cppp-nhai-fastag-02',
  tender_id: 'CPPP/2026/NHAI/TOLL/889',
  title: 'Electronic Toll Collection (ETC / FASTag) Automatic Number Plate Recognition Upgrade',
  authority: 'National Highways Authority of India (NHAI), New Delhi',
  portal: 'CPPP',
  category: 'Works',
  estimated_value_inr: 85000000.0, // 8.5 Cr
  emd_amount_inr: 1700000.0, // 17 Lakhs
  msme_exemption: false,
  startup_exemption: false,
  submission_deadline: new Date(Date.now() + 86400000 * 25).toISOString(),
  opening_date: new Date(Date.now() + 86400000 * 26).toISOString(),
  location_state: 'Haryana',
  description:
    'Upgrade of 42 toll lanes along Eastern Peripheral Expressway with high-speed ANPR AI cameras, optical sensors, automatic boom barriers, and real-time bank reconciliation gateway.',
  document_url: 'https://eprocure.gov.in/eprocure/app?nhai_toll_889',
  eligibility_criteria: {
    min_turnover_cr: 15.0,
    min_experience_years: 7,
    required_certifications: ['ISO 9001:2015', 'ISO 27001:2022'],
    past_project_value_pct: 60,
  },
  status: 'Active',
};

export const DEMO_ADDITIONAL_TENDERS = [
  {
    id: 'cppp-aiims-hmis-03',
    tender_id: 'CPPP/2026/AIIMS/IT/042',
    title: 'Hospital Information Management System (HMIS) & Cloud Operations AMC',
    authority: 'All India Institute of Medical Sciences (AIIMS), New Delhi',
    portal: 'CPPP',
    category: 'Services',
    estimated_value_inr: 28000000.0, // 2.8 Cr
    emd_amount_inr: 560000.0,
    msme_exemption: true,
    startup_exemption: false,
    submission_deadline: new Date(Date.now() + 86400000 * 12).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 13).toISOString(),
    location_state: 'Delhi',
    description:
      'Comprehensive 3-year operations, maintenance, cybersecurity hardening, and level-3 application support for AIIMS Integrated Healthcare Information System and PACS cloud infrastructure.',
    document_url: 'https://eprocure.gov.in/eprocure/app?aiims_hmis_042',
    eligibility_criteria: {
      min_turnover_cr: 3.0,
      min_experience_years: 4,
      required_certifications: ['CMMI Level 3', 'ISO 27001:2022', 'ISO 20000-1'],
      past_project_value_pct: 40,
    },
    status: 'Active',
  },
  {
    id: 'gem-jaipur-smartcity-04',
    tender_id: 'GEM/2026/B/9140221',
    title: 'Smart City IoT Environmental Sensor Network & Central Command Center Integration',
    authority: 'Jaipur Smart City Limited (JSCL), Rajasthan',
    portal: 'GeM',
    category: 'Works',
    estimated_value_inr: 52000000.0, // 5.2 Cr
    emd_amount_inr: 1040000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 22).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 23).toISOString(),
    location_state: 'Rajasthan',
    description:
      'Deployment of 120 air quality, noise, and weather IoT sensor nodes with LoRaWAN wireless gateways, cloud telemetry processing, and integration with the Jaipur ICCC.',
    document_url: 'https://gem.gov.in/tenders/GEM-2026-B-9140221.pdf',
    eligibility_criteria: {
      min_turnover_cr: 7.0,
      min_experience_years: 5,
      required_certifications: ['ISO 9001:2015', 'CE Certification', 'RoHS'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'gem-bsnl-datacenter-05',
    tender_id: 'GEM/2026/B/8771203',
    title: 'Supply & Installation of Tier-3 Data Center High-Density Rack Servers and SAN Storage',
    authority: 'Bharat Sanchar Nigam Limited (BSNL) Corporate Office',
    portal: 'GeM',
    category: 'Goods',
    estimated_value_inr: 42000000.0, // 4.2 Cr
    emd_amount_inr: 840000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 11).toISOString(),
    location_state: 'Delhi',
    description:
      'Supply, installation, multi-site clustering, and 5-year OEM warranty for 32 dual-socket Xeon rackmount servers, 200TB NVMe all-flash SAN storage, and 40GbE ToR data center switches.',
    document_url: 'https://gem.gov.in/tenders/GEM-2026-B-8771203.pdf',
    eligibility_criteria: {
      min_turnover_cr: 6.0,
      min_experience_years: 3,
      required_certifications: ['ISO 9001:2015', 'OEM Authorization (MAF)'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'gem-iitd-wifi6-06',
    tender_id: 'GEM/2026/B/9301145',
    title: 'Campus-wide Wi-Fi 6 Enterprise Network & Cyber Security Firewall Upgrade',
    authority: 'Indian Institute of Technology (IIT) Delhi',
    portal: 'GeM',
    category: 'Works',
    estimated_value_inr: 68000000.0, // 6.8 Cr
    emd_amount_inr: 1360000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 16).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 17).toISOString(),
    location_state: 'Delhi',
    description:
      'Turnkey installation of 850 Wi-Fi 6 indoor/outdoor access points, redundant next-gen 100Gbps firewalls, PoE+ core distribution switches, and 802.1x RADIUS zero-trust authentication across campus hostels and academic blocks.',
    document_url: 'https://gem.gov.in/tenders/GEM-2026-B-9301145.pdf',
    eligibility_criteria: {
      min_turnover_cr: 8.0,
      min_experience_years: 5,
      required_certifications: ['ISO 9001:2015', 'ISO 27001:2022', 'Cisco / Aruba Gold Partner'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'cppp-isro-fiber-07',
    tender_id: 'CPPP/2026/ISRO/SAC/NET/109',
    title: 'High-Reliability Secure Optical Fiber Backbone & Ground Station Telemetry Networking',
    authority: 'Space Applications Centre (ISRO), Ahmedabad',
    portal: 'CPPP',
    category: 'Works',
    estimated_value_inr: 124000000.0, // 12.4 Cr
    emd_amount_inr: 2480000.0,
    msme_exemption: false,
    startup_exemption: false,
    submission_deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 31).toISOString(),
    location_state: 'Gujarat',
    description:
      'Laying of armored 96-core underground optical fiber ring across SAC campus, redundant telemetry communication links to satellite ground stations, and military-grade encryption switches with 99.999% uptime SLA.',
    document_url: 'https://eprocure.gov.in/eprocure/app?isro_sac_109',
    eligibility_criteria: {
      min_turnover_cr: 18.0,
      min_experience_years: 7,
      required_certifications: ['ISO 9001:2015', 'ISO 27001:2022', 'DoT IP-1 License'],
      past_project_value_pct: 60,
    },
    status: 'Active',
  },
  {
    id: 'gem-pune-iccc-08',
    tender_id: 'GEM/2026/B/9482100',
    title: 'Integrated Command and Control Centre (ICCC) AI Video Analytics & Traffic Violation Detection',
    authority: 'Pune Municipal Corporation (PMC)',
    portal: 'GeM',
    category: 'Works',
    estimated_value_inr: 245000000.0, // 24.5 Cr
    emd_amount_inr: 4900000.0,
    msme_exemption: true,
    startup_exemption: false,
    submission_deadline: new Date(Date.now() + 86400000 * 28).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 29).toISOString(),
    location_state: 'Maharashtra',
    description:
      'Implementation of automated red-light violation detection (RLVD), speed enforcement cameras across 60 major traffic junctions, and centralized AI video analytics dashboard integrated into PMC Smart City ICCC.',
    document_url: 'https://gem.gov.in/tenders/GEM-2026-B-9482100.pdf',
    eligibility_criteria: {
      min_turnover_cr: 25.0,
      min_experience_years: 6,
      required_certifications: ['ISO 9001:2015', 'ISO 27001:2022', 'CMMI Level 3'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'cppp-bel-defense-09',
    tender_id: 'CPPP/2026/BEL/DEF/871',
    title: 'Ruggedized Military-Grade Embedded Mission Computing Units & High-Brightness Displays',
    authority: 'Bharat Electronics Limited (BEL), Bengaluru',
    portal: 'CPPP',
    category: 'Goods',
    estimated_value_inr: 180000000.0, // 18.0 Cr
    emd_amount_inr: 3600000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 35).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 36).toISOString(),
    location_state: 'Karnataka',
    description:
      'Supply of 150 units of MIL-STD-810G and MIL-STD-461F compliant conduction-cooled rugged VPX embedded computing units with sunlight-readable multi-touch tactical displays for naval defence systems.',
    document_url: 'https://eprocure.gov.in/eprocure/app?bel_def_871',
    eligibility_criteria: {
      min_turnover_cr: 20.0,
      min_experience_years: 5,
      required_certifications: ['ISO 9001:2015', 'AS9100D Aerospace Certification'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'gem-uidai-aadhaar-10',
    tender_id: 'GEM/2026/B/9554012',
    title: 'Cloud-Native Aadhaar Authentication Microservices Gateway Infrastructure AMC',
    authority: 'Unique Identification Authority of India (UIDAI)',
    portal: 'GeM',
    category: 'Services',
    estimated_value_inr: 96000000.0, // 9.6 Cr
    emd_amount_inr: 1920000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 15).toISOString(),
    location_state: 'Delhi',
    description:
      '24x7 level-3 operations and engineering support for Kubernetes-based high-throughput Aadhaar e-KYC authentication microservices clusters processing over 80 million requests daily with sub-50ms latency.',
    document_url: 'https://gem.gov.in/tenders/GEM-2026-B-9554012.pdf',
    eligibility_criteria: {
      min_turnover_cr: 10.0,
      min_experience_years: 5,
      required_certifications: ['CMMI Level 5', 'ISO 27001:2022', 'ISO 20000-1', 'CERT-In Empaneled'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'cppp-ntpc-solar-11',
    tender_id: 'CPPP/2026/NTPC/SOLAR/311',
    title: 'SCADA Automation, PLC Telemetry & Remote Monitoring System for 250MW Solar Park',
    authority: 'NTPC Limited, Corporate Centre',
    portal: 'CPPP',
    category: 'Works',
    estimated_value_inr: 158000000.0, // 15.8 Cr
    emd_amount_inr: 3160000.0,
    msme_exemption: true,
    startup_exemption: false,
    submission_deadline: new Date(Date.now() + 86400000 * 24).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 25).toISOString(),
    location_state: 'Madhya Pradesh',
    description:
      'Turnkey engineering, supply, installation, and commissioning of centralized SCADA, weather monitoring stations, string inverter telemetry, and optical ring network for 250MW Mandsaur Solar PV plant.',
    document_url: 'https://eprocure.gov.in/eprocure/app?ntpc_solar_311',
    eligibility_criteria: {
      min_turnover_cr: 16.0,
      min_experience_years: 5,
      required_certifications: ['ISO 9001:2015', 'IEC 61850 SCADA Compliance'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'gem-dmrc-afc-12',
    tender_id: 'GEM/2026/B/9623884',
    title: 'Automated Fare Collection (AFC) QR Code & NCMC Smart Card Validator Turnstiles',
    authority: 'Delhi Metro Rail Corporation (DMRC)',
    portal: 'GeM',
    category: 'Works',
    estimated_value_inr: 142000000.0, // 14.2 Cr
    emd_amount_inr: 2840000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 19).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 20).toISOString(),
    location_state: 'Delhi',
    description:
      'Supply and installation of 220 National Common Mobility Card (NCMC) and dynamic mobile QR-code validator flaps/turnstiles across Phase-4 Delhi Metro stations with central clearing house integration.',
    document_url: 'https://gem.gov.in/tenders/GEM-2026-B-9623884.pdf',
    eligibility_criteria: {
      min_turnover_cr: 15.0,
      min_experience_years: 5,
      required_certifications: ['ISO 9001:2015', 'PCI-DSS', 'EMVCo Level 1 & 2'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'cppp-iocl-ztna-13',
    tender_id: 'CPPP/2026/IOCL/IT/502',
    title: 'Enterprise Zero-Trust Network Access (ZTNA) & Endpoint Detection and Response (EDR) Implementation',
    authority: 'Indian Oil Corporation Limited (IOCL)',
    portal: 'CPPP',
    category: 'Services',
    estimated_value_inr: 79000000.0, // 7.9 Cr
    emd_amount_inr: 1580000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 15).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 16).toISOString(),
    location_state: 'Maharashtra',
    description:
      'Implementation of Zero-Trust Network Architecture across 45,000 corporate endpoints and cloud workloads, including micro-segmentation, AI-driven behavioral EDR, and continuous posture assessment.',
    document_url: 'https://eprocure.gov.in/eprocure/app?iocl_ztna_502',
    eligibility_criteria: {
      min_turnover_cr: 9.0,
      min_experience_years: 4,
      required_certifications: ['ISO 27001:2022', 'SOC 2 Type II', 'CERT-In Empaneled'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'gem-cdac-gpu-14',
    tender_id: 'GEM/2026/B/9710920',
    title: 'High-Performance GPU Computing Cluster (NVIDIA H100/A100) for National AI Mission',
    authority: 'Centre for Development of Advanced Computing (C-DAC), Pune',
    portal: 'GeM',
    category: 'Goods',
    estimated_value_inr: 380000000.0, // 38.0 Cr
    emd_amount_inr: 7600000.0,
    msme_exemption: false,
    startup_exemption: false,
    submission_deadline: new Date(Date.now() + 86400000 * 27).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 28).toISOString(),
    location_state: 'Maharashtra',
    description:
      'Procurement, installation, liquid cooling commissioning, and 3-year support of 64 SXM5 HGX nodes equipped with 512 high-performance tensor-core GPUs, 400Gbps InfiniBand fabric, and 2PB Lustre parallel storage.',
    document_url: 'https://gem.gov.in/tenders/GEM-2026-B-9710920.pdf',
    eligibility_criteria: {
      min_turnover_cr: 40.0,
      min_experience_years: 5,
      required_certifications: ['ISO 9001:2015', 'OEM Tier-1 Elite Partner'],
      past_project_value_pct: 60,
    },
    status: 'Active',
  },
  {
    id: 'cppp-drdo-swarm-15',
    tender_id: 'CPPP/2026/DRDO/CAIR/220',
    title: 'AI Autonomous Drone Fleet Management & Swarm Telemetry Control Software',
    authority: 'Centre for Artificial Intelligence and Robotics (DRDO), Bengaluru',
    portal: 'CPPP',
    category: 'Services',
    estimated_value_inr: 115000000.0, // 11.5 Cr
    emd_amount_inr: 2300000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 21).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 22).toISOString(),
    location_state: 'Karnataka',
    description:
      'Design, development, simulation, and field testing of real-time decentralized swarm coordination algorithms, obstacle avoidance, GPS-denied inertial navigation, and mesh radio telemetry software for UAV fleets.',
    document_url: 'https://eprocure.gov.in/eprocure/app?drdo_cair_220',
    eligibility_criteria: {
      min_turnover_cr: 12.0,
      min_experience_years: 4,
      required_certifications: ['CMMI Level 3', 'ISO 27001:2022', 'DPIIT Recognized Startup / MSME'],
      past_project_value_pct: 40,
    },
    status: 'Active',
  },
  {
    id: 'gem-aai-solar-16',
    tender_id: 'GEM/2026/B/9804155',
    title: 'Solar Rooftop Photovoltaic (PV) Plant (1.5 MWp) Grid-Tied System',
    authority: 'Airports Authority of India (AAI), Chennai Airport',
    portal: 'GeM',
    category: 'Works',
    estimated_value_inr: 81000000.0, // 8.1 Cr
    emd_amount_inr: 1620000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 17).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 18).toISOString(),
    location_state: 'Tamil Nadu',
    description:
      'Design, engineering, supply, installation, testing, commissioning, and 5-year comprehensive operation & maintenance of 1.5 MWp grid-interactive rooftop solar PV plant at Chennai International Airport.',
    document_url: 'https://gem.gov.in/tenders/GEM-2026-B-9804155.pdf',
    eligibility_criteria: {
      min_turnover_cr: 9.0,
      min_experience_years: 4,
      required_certifications: ['ISO 9001:2015', 'MNRE Channel Partner', 'Class-A Electrical Contractor'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'cppp-powergrid-substation-17',
    tender_id: 'CPPP/2026/PGCIL/SUB/670',
    title: 'Smart Grid Substation Digital Protection, Automation & Phasor Measurement Units',
    authority: 'Power Grid Corporation of India Limited (POWERGRID), Gurugram',
    portal: 'CPPP',
    category: 'Works',
    estimated_value_inr: 220000000.0, // 22.0 Cr
    emd_amount_inr: 4400000.0,
    msme_exemption: false,
    startup_exemption: false,
    submission_deadline: new Date(Date.now() + 86400000 * 32).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 33).toISOString(),
    location_state: 'Haryana',
    description:
      'Supply and commissioning of numerical protection relays, Bay Control Units (BCUs), substation automation system per IEC 61850 edition 2, and synchronized Phasor Measurement Units (PMUs) across 400kV substations.',
    document_url: 'https://eprocure.gov.in/eprocure/app?pgcil_sub_670',
    eligibility_criteria: {
      min_turnover_cr: 25.0,
      min_experience_years: 7,
      required_certifications: ['ISO 9001:2015', 'IEC 61850 KEMA Certification'],
      past_project_value_pct: 60,
    },
    status: 'Active',
  },
  {
    id: 'gem-up-grievance-18',
    tender_id: 'GEM/2026/B/9891001',
    title: 'Unified Citizen Grievance Redressal Portal & AI WhatsApp Chatbot System',
    authority: 'Government of Uttar Pradesh, Dept of IT & Electronics',
    portal: 'GeM',
    category: 'Services',
    estimated_value_inr: 34000000.0, // 3.4 Cr
    emd_amount_inr: 680000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 11).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 12).toISOString(),
    location_state: 'Uttar Pradesh',
    description:
      'Development, hosting, and 3-year support of an omni-channel citizen grievance ticketing portal with vernacular Hindi/Urdu voice recognition, WhatsApp chatbot integration, and automated departmental escalation.',
    document_url: 'https://gem.gov.in/tenders/GEM-2026-B-9891001.pdf',
    eligibility_criteria: {
      min_turnover_cr: 4.0,
      min_experience_years: 3,
      required_certifications: ['ISO 9001:2015', 'ISO 27001:2022', 'CMMI Level 3'],
      past_project_value_pct: 40,
    },
    status: 'Active',
  },
  {
    id: 'cppp-hal-avionics-19',
    tender_id: 'CPPP/2026/HAL/AVIO/441',
    title: 'Aircraft Wiring Harness Testing Benches & Automated Avionics Diagnostic Rigs',
    authority: 'Hindustan Aeronautics Limited (HAL), Avionics Division Hyderabad',
    portal: 'CPPP',
    category: 'Goods',
    estimated_value_inr: 167000000.0, // 16.7 Cr
    emd_amount_inr: 3340000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 29).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    location_state: 'Telangana',
    description:
      'Supply, validation, and calibration of high-speed programmable automatic wire harness continuity and high-pot insulation breakdown testers with automated MIL-STD test reporting for fighter jet manufacturing.',
    document_url: 'https://eprocure.gov.in/eprocure/app?hal_avio_441',
    eligibility_criteria: {
      min_turnover_cr: 18.0,
      min_experience_years: 5,
      required_certifications: ['ISO 9001:2015', 'AS9100D', 'NABL Accredited Calibration'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
  {
    id: 'gem-gis-drone-survey-20',
    tender_id: 'GEM/2026/B/9972304',
    title: 'Digital Land Records GIS Mapping & Drone Orthomosaic Survey Processing',
    authority: 'Survey of India / Ministry of Panchayati Raj',
    portal: 'GeM',
    category: 'Services',
    estimated_value_inr: 59000000.0, // 5.9 Cr
    emd_amount_inr: 1180000.0,
    msme_exemption: true,
    startup_exemption: true,
    submission_deadline: new Date(Date.now() + 86400000 * 20).toISOString(),
    opening_date: new Date(Date.now() + 86400000 * 21).toISOString(),
    location_state: 'Uttarakhand',
    description:
      'High-resolution drone survey (sub-5cm GSD), 3D point cloud generation, feature extraction, cadastral boundary demarcation, and SVAMITVA GIS portal ingestion covering 350 rural revenue villages.',
    document_url: 'https://gem.gov.in/tenders/GEM-2026-B-9972304.pdf',
    eligibility_criteria: {
      min_turnover_cr: 6.5,
      min_experience_years: 3,
      required_certifications: ['ISO 9001:2015', 'DGCA Drone Pilot Training Authorization'],
      past_project_value_pct: 50,
    },
    status: 'Active',
  },
];

export const DEMO_ALL_TENDERS = [
  DEMO_SCENARIO_1_TENDER,
  DEMO_SCENARIO_2_TENDER,
  ...DEMO_ADDITIONAL_TENDERS,
];

export const DEMO_EVALUATION_SCENARIO_1 = {
  overall_match_score: 94,
  semantic_score: 96,
  eligibility_score: 92,
  is_hard_eligible: true,
  turnover_check: {
    passed: true,
    required_cr: 4.5,
    company_cr: 6.5,
    relaxed_via_msme: false,
  },
  experience_check: {
    passed: true,
    required_years: 3,
    company_years: 6,
  },
  msme_benefit: {
    eligible_for_emd_exemption: true,
    emd_amount_saved_inr: 700000.0,
  },
  certifications_check: {
    passed: true,
    matched: ['ISO 9001:2015', 'ISO 27001:2022'],
    missing: [],
  },
  ai_rationale:
    'Strong qualification match (94%). Company 3-year average turnover of ₹6.50 Cr and 6 years of experience comfortably surpass mandatory thresholds. Verified past completion certificate with Northern Railway directly proves technical capability. 100% EMD fee waiver applies under Rule 170 of GFR 2017.',
  risk_factors: [
    'Ensure OEM Manufacturer Authorization Form (MAF) for optical fiber switches is attached.',
    'Upload CA-certified balance sheet with UDIN verification to GeM portal.',
  ],
};

export const DEMO_EVALUATION_SCENARIO_2 = {
  overall_match_score: 42,
  semantic_score: 68,
  eligibility_score: 25,
  is_hard_eligible: false,
  turnover_check: {
    passed: false,
    required_cr: 15.0,
    company_cr: 6.5,
    relaxed_via_msme: false,
  },
  experience_check: {
    passed: false,
    required_years: 7,
    company_years: 6,
  },
  msme_benefit: {
    eligible_for_emd_exemption: false,
    emd_amount_saved_inr: 0.0,
  },
  certifications_check: {
    passed: true,
    matched: ['ISO 9001:2015', 'ISO 27001:2022'],
    missing: [],
  },
  ai_rationale:
    'Disqualification alert (42%). Tender mandates minimum turnover of ₹15.00 Cr and 7 years experience in highway tolling. MSME relaxations are explicitly disallowed by NHAI for core expressway works. Single-bidder submission carries critical rejection risk.',
  risk_factors: [
    'CRITICAL: Turnover gap of ₹8.50 Cr causes automatic rejection in technical evaluation.',
    'CRITICAL: Experience deficit of 1 year against mandatory 7-year highway track record.',
    'Strategic Recommendation: Do not bid as prime contractor. Explore sub-contracting or Consortium partner route.',
  ],
};

export const DEMO_DOCUMENTS = [
  {
    id: 'doc-nr-cert-01',
    filename: 'Northern_Railway_CCTV_Completion_Certificate.pdf',
    category: 'Past_Experience',
    file_type: 'pdf',
    file_size_bytes: 256000,
    title: 'Northern Railway IP-CCTV Turnkey Project Completion Certificate',
    summary:
      'Official completion certificate issued by Northern Railway for turnkey IP CCTV installation across 12 railway stations under Delhi Division (Value: ₹2.85 Cr). Validates past commercial track record, scope execution, and satisfactory handover.',
    tags: ['Northern Railway', 'CCTV Surveillance', 'Past Performance', '₹2.85 Cr', 'Works'],
    doc_metadata: {
      issuing_authority: 'Northern Railway Headquarter, Baroda House, New Delhi',
      reference_number: 'NR/S&T/CCTV/2024/DEL/891',
      financial_value: '₹2.85 Cr',
      issue_date: '10 Feb 2026',
      validity_period: 'Perpetual Track Record',
      detected_type: 'Past_Experience',
      verification_status: 'Verified Authenticated',
      tender_qualification_relevance: 'Satisfies Prior Experience & Single Contract Capability Threshold under GFR 2017.',
      file_stats: {
        file_type: 'PDF',
        file_size_kb: 250.0,
        word_count: 840,
        estimated_pages: 3,
      },
      key_entities: ['IP-CCTV', 'NVR Management', 'Railway Stations', 'Delhi Division'],
    },
    created_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'doc-udyam-02',
    filename: 'Udyam_MSME_Registration_Certificate_Apex.pdf',
    category: 'MSME_Udyam',
    file_type: 'pdf',
    file_size_bytes: 142000,
    title: 'Udyam Registration Certificate (Government of India MSME)',
    summary:
      'Official statutory Udyam registration certificate showing enterprise classification as Micro Enterprise under NIC code 62020/62099. Qualifies company for mandatory EMD fee waivers (GFR Rule 170) and up to 50% relaxation in prior turnover.',
    tags: ['Ministry of MSME', 'Micro Enterprise', 'EMD Exemption', 'Udyam', 'GFR 170'],
    doc_metadata: {
      issuing_authority: 'Ministry of Micro, Small and Medium Enterprises (GoI)',
      reference_number: 'UDYAM-DL-01-0098765',
      financial_value: 'Eligible for 100% EMD Waiver',
      issue_date: '15 Jan 2026',
      validity_period: 'Permanent Registration',
      detected_type: 'MSME_Udyam',
      verification_status: 'Verified Authenticated',
      tender_qualification_relevance: 'Unlocks GFR Rule 170 EMD Fee Exemption and 50% Prior Turnover / Experience Relaxation.',
      file_stats: {
        file_type: 'PDF',
        file_size_kb: 138.7,
        word_count: 520,
        estimated_pages: 2,
      },
      key_entities: ['Micro Enterprise', 'NIC 62020', 'NIC 62099', 'Udyam Portal'],
    },
    created_at: '2026-01-15T14:30:00Z',
  },
  {
    id: 'doc-audited-fin-03',
    filename: 'CA_Certified_3Year_Turnover_Audited_Balance_Sheet.pdf',
    category: 'Financial_Audit',
    file_type: 'pdf',
    file_size_bytes: 890000,
    title: '3-Year Audited Balance Sheets with UDIN Verification',
    summary:
      'Chartered Accountant certified profit & loss statement and balance sheets demonstrating average annual turnover of ₹6.5 Cr and positive net worth of ₹3.2 Cr. Substantiates liquidity and solvency criteria for major GeM & CPPP tenders.',
    tags: ['Chartered Accountants', 'Turnover ₹6.5 Cr', 'Balance Sheet', 'UDIN', 'Audited'],
    doc_metadata: {
      issuing_authority: 'M/s S.K. Bansal & Associates (Chartered Accountants)',
      reference_number: 'UDIN-26098765AAAA1092',
      financial_value: '₹6.50 Cr Avg Turnover',
      issue_date: '01 Mar 2026',
      validity_period: 'FY 2023-24, 2024-25, 2025-26',
      detected_type: 'Financial_Audit',
      verification_status: 'Verified Authenticated',
      tender_qualification_relevance: 'Satisfies Financial Liquidity, Solvency & Minimum Average Annual Turnover Gate.',
      file_stats: {
        file_type: 'PDF',
        file_size_kb: 869.1,
        word_count: 2450,
        estimated_pages: 7,
      },
      key_entities: ['Net Worth ₹3.2 Cr', 'Turnover ₹6.5 Cr', 'Balance Sheet', 'UDIN Verified'],
    },
    created_at: '2026-03-01T09:15:00Z',
  },
  {
    id: 'doc-iso-certs-04',
    filename: 'ISO_9001_and_ISO_27001_Accreditation_Certificates.pdf',
    category: 'ISO_Quality',
    file_type: 'pdf',
    file_size_bytes: 310000,
    title: 'ISO 9001:2015 & ISO 27001:2022 Quality and Security Accreditations',
    summary:
      'NABCB accredited certifications for Quality Management System (QMS) and Information Security Management System (ISMS). Certified compliance against mandatory tender specifications for process maturity and data security protocols.',
    tags: ['TUV Rheinland', 'ISO 9001:2015', 'ISO 27001:2022', 'QMS', 'ISMS'],
    doc_metadata: {
      issuing_authority: 'TUV Rheinland / NABCB Accredited Board',
      reference_number: 'ISO/QMS/2026/89412 & ISMS/778',
      financial_value: 'Tier-1 Standards Compliance',
      issue_date: '20 Jan 2026',
      validity_period: 'Valid until 19 Jan 2029 (3 Years)',
      detected_type: 'ISO_Quality',
      verification_status: 'Verified Authenticated',
      tender_qualification_relevance: 'Fulfills Mandatory Statutory ISO 9001:2015 & ISO 27001:2022 Quality & Security Gates.',
      file_stats: {
        file_type: 'PDF',
        file_size_kb: 302.7,
        word_count: 1100,
        estimated_pages: 4,
      },
      key_entities: ['ISO 9001:2015', 'ISO 27001:2022', 'QMS Quality', 'Information Security'],
    },
    created_at: '2026-01-20T11:45:00Z',
  },
];

export const DEMO_PREBAKED_COMPLIANCE_MATRIX = `# TECHNICAL COMPLIANCE & CLAUSE-BY-CLAUSE MATRIX
**Tender ID**: GEM/2026/B/8912401  
**Procuring Authority**: Northern Railway Headquarter, Baroda House, New Delhi  
**Bidder**: Apex Enterprise Solutions Pvt Ltd (GSTIN: 07AAACA9876K1Z9 | MSME: UDYAM-DL-01-0098765)  

---

### Section 1: Statutory Eligibility & Gate Adherence

| Clause No. | Tender Specification Parameter | Bidder Compliance Status | Verifiable Citation / Annexure Reference |
| :--- | :--- | :---: | :--- |
| **Cl 1.1** | Minimum 3-Year Average Turnover of ₹4.50 Crores | **COMPLIED** | Audited Balance Sheets (UDIN: 24098765AAAA89) showing 3-year average of ₹6.50 Crores. *(Annexure A-1)* |
| **Cl 1.2** | Minimum 3 Years Past Experience in Similar Surveillance Works | **COMPLIED** | Northern Railway Completion Certificate (NR/SIG/2023/CCTV/089) for 12 stations worth ₹2.85 Cr. *(Annexure A-2)* |
| **Cl 1.3** | Earnest Money Deposit (EMD) of ₹7,00,000/- | **EXEMPTED** | Valid Udyam Registration (UDYAM-DL-01-0098765) eligible under Rule 170 of GFR 2017. *(Annexure A-3)* |
| **Cl 1.4** | Make in India (Class-I Local Supplier Preference) | **COMPLIED** | Local content self-declaration: >68% domestic value addition confirmed per DPIIT guidelines. *(Annexure A-4)* |

---

### Section 2: Technical Specifications & SLA Commitment

| Clause No. | System Parameter & Requirement | Compliance | Technical Architecture & Implementation Notes |
| :--- | :--- | :---: | :--- |
| **Cl 2.1** | 4MP High-Definition IP Cameras with Minimum 50m IR Night Vision & H.265+ Compression | **COMPLIED** | Deployed with Sony STARVIS low-light sensors, vandal-proof IP67 aluminum housing, and dual-streaming H.265+ engine. |
| **Cl 2.2** | 64-Channel Enterprise Network Video Recorder (NVR) with Hot-Swappable RAID-5 Storage | **COMPLIED** | Redundant power supply, hardware RAID-5 controller, supporting 30 days continuous 24/7 recording at 25 fps. |
| **Cl 2.3** | Optical Fiber Ring Backbone with Self-Healing Sub-50ms Spanning Tree Network | **COMPLIED** | Industrial managed PoE+ Gigabit switches with dual-ring topology ensuring zero packet loss on station trackside. |
| **Cl 2.4** | Edge AI Analytics: Real-Time Crowd Density Monitoring, Abandoned Luggage & Perimeter Intrusion | **COMPLIED** | Pre-trained neural analytics pipeline integrated with Northern Railway divisional control room console. |
| **Cl 2.5** | Multi-Year Comprehensive Warranty and 4-Hour SLA Response for Critical Breakdowns | **COMPLIED** | Local service team in Delhi NCR with 24x7 helpline, dedicated spares inventory, and guaranteed 4-hour MTTR. |

---

### Bidder Affirmation
We hereby declare that all specifications, hardware components, and software solutions quoted herein comply 100% with the Tender Document without any commercial or technical deviations.

**Authorized Signatory:**  
*For Apex Enterprise Solutions Pvt Ltd*  
*(Official Digital Signature)*
`;

export const DEMO_PREBAKED_COVER_LETTER = `APEX ENTERPRISE SOLUTIONS PVT LTD
Corporate Office: 402, Technology Tower, Okhla Industrial Area Phase-III, New Delhi - 110020
CIN: U72200DL2018PTC334455 | GSTIN: 07AAACA9876K1Z9 | PAN: AAACA9876K
Udyam Registration: UDYAM-DL-01-0098765 (Micro Enterprise)

Date: 15th October 2026

To,
The Chief Signal & Telecommunication Engineer (CSTE / Works),
Northern Railway Headquarter, Baroda House,
Copernicus Marg, New Delhi - 110001

Subject: Submission of Technical & Commercial Bid for "Supply, Installation & Maintenance of Enterprise CCTV Surveillance & AI Analytics System" (Tender ID: GEM/2026/B/8912401).

Respected Sir / Madam,

1. We have carefully examined the Tender Document, Scope of Work, Technical Specifications, and General & Special Conditions of Contract for the above-referenced tender published on the Government e-Marketplace (GeM).

2. We hereby submit our unconditional Technical and Commercial Bid in strict accordance with the terms and stipulations of the tender document.

3. Statutory Details & Credentials:
   - Annual Average Turnover (Last 3 Years): INR 6.50 Crores (Against requirement of INR 4.50 Crores).
   - Past Relevant Experience: Successfully delivered turnkey IP CCTV systems across 12 railway stations under Delhi Division (Contract Value: INR 2.85 Crores).
   - EMD Exemption: Claimed under Rule 170 of General Financial Rules (GFR) 2017 in our capacity as a registered Micro Enterprise under MSME Udyam Registration No. UDYAM-DL-01-0098765.
   - Make in India Commitment: We certify that we qualify as a "Class-I Local Supplier" with local value addition exceeding 68%.

4. We confirm that our firm is not debarred, blacklisted, or restrained by any Central/State Ministry, PSU, or GeM authority as on the date of this bid submission.

Thanking you.

Yours faithfully,
For Apex Enterprise Solutions Pvt Ltd

(Authorized Signatory)
Name: Prabal Singh
Designation: Managing Director
Mobile: +91 98110 00000 | Email: bids@apextech.in
`;

export const DEMO_TASKS = [
  {
    id: 'demo-task-1',
    tender_id: 'gem-railway-cctv-01',
    title: 'Obtain OEM Authorization Form (MAF) from Switch & Camera Manufacturer',
    category: 'Technical_Bid',
    due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    priority: 'High',
    completed: true,
  },
  {
    id: 'demo-task-2',
    tender_id: 'gem-railway-cctv-01',
    title: 'Generate CA Turnover Certificate with UDIN verification',
    category: 'Financial_Bid',
    due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    priority: 'High',
    completed: true,
  },
  {
    id: 'demo-task-3',
    tender_id: 'gem-railway-cctv-01',
    title: 'Attend Pre-Bid Clarification Meeting at Baroda House / Online',
    category: 'Pre_Bid',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    priority: 'Urgent',
    completed: false,
  },
  {
    id: 'demo-task-4',
    tender_id: 'gem-railway-cctv-01',
    title: 'Finalize Clause-by-Clause Compliance Matrix in Bid Studio',
    category: 'Technical_Bid',
    due_date: new Date(Date.now() + 86400000 * 10).toISOString(),
    priority: 'High',
    completed: false,
  },
];
