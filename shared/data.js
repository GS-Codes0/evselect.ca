/* EVSelect.ca — Central Vehicle & Rebate Intelligence Data Engine */
'use strict';
(function(global) {
  var API = 'https://zmwmtgdzri.execute-api.us-east-1.amazonaws.com/ev-cars';

  // Verified empirical thermal degradation model:
  // 0% degradation at 0°C scaling linearly to 35% max loss at -30°C
  function thermalLoss(t) {
    if (t >= 0) return 0;
    return Math.min(35, Math.abs(t) * (35 / 30));
  }

  function winterRange(base, t) {
    return Math.round(base * (1 - thermalLoss(t) / 100));
  }

  // ── 2026 FEDERAL EVAP CONFIG ──
  // Federal iZEV closed Jan 12, 2025 (funds exhausted).
  // Replaced Feb 16, 2026 by Electric Vehicle Affordability Program (EVAP).
  var FEDERAL_EVAP = {
    program: 'Electric Vehicle Affordability Program (EVAP)',
    effectiveDate: 'February 16, 2026',
    predecessor: 'iZEV (Closed Jan 12, 2025)',
    status: 'active',
    baseCapTransaction: 50000, // Max final transaction value (base + options + destination + fees)
    amounts: {
      2026: { bev: 5000, phev: 2500 },
      2027: { bev: 4000, phev: 2000 },
      2028: { bev: 3000, phev: 1500 },
      2029: { bev: 3000, phev: 1500 },
      2030: { bev: 2000, phev: 1000 }
    },
    rules: [
      'Final transaction value (base price + options + destination + dealer fees) must not exceed $50,000.',
      'Country of origin / assembly rule: Vehicle must be assembled in Canada or a free-trade partner nation.',
      'Buyer limit: Valid for one claim per Canadian individual lifetime across the program duration.',
      'Stepped rebate schedule: $5,000 (2026) → $4,000 (2027) → $3,000 (2028–2029) → $2,000 (2030).'
    ],
    sourceUrl: 'https://tc.canada.ca/en/road-transportation/innovative-technologies/zero-emission-vehicles',
    lastVerified: 'September 2026'
  };

  // ── ALL 13 PROVINCES & TERRITORIES (2026 Verified Data) ──
  var PROVINCES = {
    AB: {
      name: 'Alberta',
      amount: 0,
      status: 'none',
      badge: 'No Rebate',
      notes: 'No active provincial EV rebate program. Federal EVAP applies for eligible vehicles.',
      sourceUrl: 'https://www.alberta.ca',
      lastVerified: 'September 2026'
    },
    BC: {
      name: 'British Columbia',
      amount: 4000,
      status: 'paused',
      badge: 'Paused',
      notes: 'CleanBC Go Electric passenger rebate paused since May 2025. Historical $4,000 currently unavailable.',
      sourceUrl: 'https://goelectricbc.gov.bc.ca',
      lastVerified: 'September 2026'
    },
    MB: {
      name: 'Manitoba',
      amount: 4000,
      status: 'active',
      badge: 'Active $4,000',
      notes: 'Manitoba EV Rebate: $4,000 for new qualifying BEVs/PHEVs under $65,000 MSRP.',
      sourceUrl: 'https://www.gov.mb.ca',
      lastVerified: 'September 2026'
    },
    NB: {
      name: 'New Brunswick',
      amount: 5000,
      status: 'active',
      badge: 'Active $5,000',
      notes: 'Plug-In NB: Up to $5,000 for new BEVs; $2,500 for PHEVs under program criteria.',
      sourceUrl: 'https://www.nbpower.com',
      lastVerified: 'September 2026'
    },
    NL: {
      name: 'Newfoundland & Labrador',
      amount: 2500,
      status: 'active',
      badge: 'Active $2,500',
      notes: 'NL Hydro EV Rebate: Up to $2,500 for new all-electric vehicles ($1,500 for PHEV).',
      sourceUrl: 'https://nlhydro.com',
      lastVerified: 'September 2026'
    },
    NS: {
      name: 'Nova Scotia',
      amount: 3000,
      status: 'active',
      badge: 'Active $3,000',
      notes: 'Electrify Nova Scotia: $3,000 incentive for new BEVs ($2,000 for PHEVs).',
      sourceUrl: 'https://cleanfoundation.ca/electrify-ns/',
      lastVerified: 'September 2026'
    },
    NT: {
      name: 'Northwest Territories',
      amount: 5000,
      status: 'active',
      badge: 'Active $5,000',
      notes: 'Arctic Energy Alliance EV incentive: $5,000 for qualifying electric vehicles.',
      sourceUrl: 'https://aea.nt.ca',
      lastVerified: 'September 2026'
    },
    NU: {
      name: 'Nunavut',
      amount: 0,
      status: 'none',
      badge: 'No Rebate',
      notes: 'No territorial zero-emission vehicle rebate currently offered.',
      sourceUrl: 'https://www.gov.nu.ca',
      lastVerified: 'September 2026'
    },
    ON: {
      name: 'Ontario',
      amount: 0,
      status: 'none',
      badge: 'No Rebate',
      notes: 'No active provincial rebate program. Only Federal EVAP applies.',
      sourceUrl: 'https://www.ontario.ca',
      lastVerified: 'September 2026'
    },
    PE: {
      name: 'Prince Edward Island',
      amount: 5000,
      status: 'active',
      badge: 'Active $5,000',
      notes: 'PEI Universal EV Incentive: $5,000 for new BEVs plus free Level 2 home charger incentive.',
      sourceUrl: 'https://www.princeedwardisland.ca',
      lastVerified: 'September 2026'
    },
    QC: {
      name: 'Quebec',
      amount: 2000,
      status: 'phasing_down',
      badge: 'Phasing Down $2k',
      notes: 'Roulez Vert phasing down: $2,000 for new BEVs in 2026 ($1,000 for PHEVs), phasing out entirely by 2027.',
      sourceUrl: 'https://www.quebec.ca/transports/roulez-vert',
      lastVerified: 'September 2026'
    },
    SK: {
      name: 'Saskatchewan',
      amount: 0,
      status: 'none',
      badge: 'No Rebate',
      notes: 'No provincial incentive ($150 annual road improvement tax on zero-emission registrations).',
      sourceUrl: 'https://www.saskatchewan.ca',
      lastVerified: 'September 2026'
    },
    YT: {
      name: 'Yukon',
      amount: 5000,
      status: 'active',
      badge: 'Active $5,000',
      notes: 'Yukon Clean Energy Rebate: $5,000 for new battery electric vehicles ($3,000 PHEV).',
      sourceUrl: 'https://yukon.ca',
      lastVerified: 'September 2026'
    }
  };

  function calculateEvap(v, yr) {
    var year = yr || 2026;
    var schedule = FEDERAL_EVAP.amounts[year] || FEDERAL_EVAP.amounts[2026];
    if (!v.evap_eligible || v.msrp > FEDERAL_EVAP.baseCapTransaction) {
      return 0;
    }
    return schedule.bev;
  }

  // ── VEHICLE DATABASE (20 Canadian Models) ──
  var VEHICLES = [
    {id:'tesla-model-y',  name:'Tesla Model Y',         make:'Tesla',    body:'suv',       msrp:59990, range:533, battery:75,   dc:250, acc:5.0,  evap_eligible:false, hp:true,  ca:false, img:'TeslaModelYWM.png'},
    {id:'tesla-model-3',  name:'Tesla Model 3',         make:'Tesla',    body:'sedan',     msrp:54990, range:576, battery:82,   dc:250, acc:4.2,  evap_eligible:false, hp:true,  ca:false, img:'TeslaModel3WM.png'},
    {id:'ioniq6',         name:'Hyundai IONIQ 6',       make:'Hyundai',  body:'sedan',     msrp:54999, range:581, battery:77.4, dc:230, acc:5.1,  evap_eligible:true,  hp:true,  ca:false, img:'IONIQ6WM.png'},
    {id:'ioniq5',         name:'Hyundai IONIQ 5',       make:'Hyundai',  body:'suv',       msrp:49999, range:488, battery:77.4, dc:230, acc:5.1,  evap_eligible:true,  hp:true,  ca:false, img:'IONIQ5WM.png'},
    {id:'kia-ev6',        name:'Kia EV6',               make:'Kia',      body:'suv',       msrp:47995, range:504, battery:77.4, dc:233, acc:5.2,  evap_eligible:true,  hp:true,  ca:false, img:'KiaEV6WM.png'},
    {id:'kia-ev9',        name:'Kia EV9',               make:'Kia',      body:'suv',       msrp:79995, range:505, battery:99.8, dc:233, acc:6.0,  evap_eligible:false, hp:true,  ca:false, img:'KiaEV9WM.png'},
    {id:'chevy-bolt',     name:'Chevrolet Bolt EV',     make:'Chevrolet',body:'hatchback', msrp:39995, range:417, battery:65,   dc:55,  acc:6.5,  evap_eligible:true,  hp:false, ca:false, img:'ChevyBoltWM.png'},
    {id:'chevy-equinox',  name:'Chevrolet Equinox EV',  make:'Chevrolet',body:'suv',       msrp:44995, range:439, battery:85,   dc:150, acc:6.9,  evap_eligible:true,  hp:true,  ca:true,  img:'ChevyEquinoxWM.png'},
    {id:'mach-e',         name:'Ford Mustang Mach-E',   make:'Ford',     body:'suv',       msrp:54995, range:487, battery:91,   dc:150, acc:3.8,  evap_eligible:false, hp:false, ca:false, img:'MachEWM.png'},
    {id:'vw-id4',         name:'Volkswagen ID.4',       make:'VW',       body:'suv',       msrp:49995, range:435, battery:82,   dc:135, acc:6.2,  evap_eligible:true,  hp:true,  ca:false, img:'VWID.4WM.png'},
    {id:'nissan-ariya',   name:'Nissan Ariya',          make:'Nissan',   body:'suv',       msrp:53498, range:481, battery:91,   dc:130, acc:5.7,  evap_eligible:false, hp:true,  ca:false, img:'NissanAriyaWM.png'},
    {id:'nissan-leaf',    name:'Nissan LEAF',           make:'Nissan',   body:'hatchback', msrp:36898, range:341, battery:62,   dc:100, acc:6.5,  evap_eligible:true,  hp:false, ca:false, img:'NissanLeafWM.png'},
    {id:'bmw-i4',         name:'BMW i4',                make:'BMW',      body:'sedan',     msrp:72900, range:590, battery:83.9, dc:205, acc:3.9,  evap_eligible:false, hp:true,  ca:false, img:'BMWi4WM.png'},
    {id:'bmw-ix',         name:'BMW iX',                make:'BMW',      body:'suv',       msrp:109000,range:630, battery:111.5,dc:200, acc:4.6,  evap_eligible:false, hp:true,  ca:false, img:'BMWiXWM.png'},
    {id:'polestar-2',     name:'Polestar 2',            make:'Polestar', body:'sedan',     msrp:59900, range:476, battery:82,   dc:205, acc:4.5,  evap_eligible:false, hp:true,  ca:false, img:'Polestar2WM.png'},
    {id:'kona-ev',        name:'Hyundai Kona Electric', make:'Hyundai',  body:'suv',       msrp:44499, range:417, battery:65.4, dc:100, acc:7.6,  evap_eligible:true,  hp:true,  ca:false, img:'HyundaiKonaWM.png'},
    {id:'rivian-r1t',     name:'Rivian R1T',            make:'Rivian',   body:'truck',     msrp:89900, range:505, battery:135,  dc:200, acc:3.0,  evap_eligible:false, hp:true,  ca:false, img:'RivianR1TWM.png'},
    {id:'solterra',       name:'Subaru Solterra',       make:'Subaru',   body:'suv',       msrp:59995, range:406, battery:71.4, dc:150, acc:7.5,  evap_eligible:false, hp:true,  ca:false, img:'SubaruSolterraWM.png'},
    {id:'bz4x',           name:'Toyota bZ4X',           make:'Toyota',   body:'suv',       msrp:59990, range:406, battery:71.4, dc:150, acc:7.7,  evap_eligible:false, hp:true,  ca:false, img:'Toyotabz4xWM.png'},
    {id:'volvo-ex40',     name:'Volvo EX40',            make:'Volvo',    body:'suv',       msrp:64950, range:461, battery:82,   dc:150, acc:4.7,  evap_eligible:false, hp:true,  ca:false, img:'VolvoEX40WM.png'}
  ];

  async function loadVehicles() {
    try {
      var res = await fetch(API, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var d = await res.json();
      if (d && d.body !== undefined) d = typeof d.body === 'string' ? JSON.parse(d.body) : d.body;
      var arr = Array.isArray(d) ? d : (d.items || d.vehicles || Object.values(d));
      return arr.map(function(v) {
        var msrpVal = v.msrp_cad___base_trim || v.msrp || 0;
        var eligible = v.evap_eligible !== undefined ? !!v.evap_eligible : (msrpVal <= 50000 && v.assembled_in_canada !== 'No');
        return {
          id: v.car_id || v.id || v.name,
          name: v.name || v.vehicle_name,
          make: v.brand || v.make || '',
          body: (v.body_type || v.body || 'suv').toLowerCase(),
          msrp: msrpVal,
          range: v.nrcan_range___best_trim__km || v.base_range_km || 0,
          battery: v.battery___usable__kwh || v.battery_capacity_kwh || 0,
          dc: v.max_dc_fast_charge__kw || 0,
          acc: v['0_100_km_h__sec'] || 0,
          evap_eligible: eligible,
          rebate: eligible ? 5000 : 0,
          hp: v.heat_pump === 'Standard' || v.heat_pump === 'Yes' || v.hp === true,
          ca: v.assembled_in_canada === 'Yes' || v.ca === true,
          img: v.image_url || (v.name || '').replace(/\s+/g,'') + 'WM.png'
        };
      });
    } catch(e) {
      console.warn('EVSelect: API unavailable, using local data.', e.message);
      return VEHICLES;
    }
  }

  global.EVS = {
    API: API,
    thermalLoss: thermalLoss,
    winterRange: winterRange,
    loadVehicles: loadVehicles,
    VEHICLES: VEHICLES,
    FEDERAL_EVAP: FEDERAL_EVAP,
    PROVINCES: PROVINCES,
    calculateEvap: calculateEvap
  };
})(window);
