/* EVSelect.ca — Central Vehicle & Rebate Intelligence Data Engine */
'use strict';
(function(global) {
  var API = 'https://zmwmtgdzri.execute-api.us-east-1.amazonaws.com/ev-cars';

  // ── Hardware-Aware Thermal Degradation Model (2026) ──
  // Differentiates Heat Pump (HP) vs Resistive PTC heaters across three temperature zones.
  // Key calibration points:
  //   0°C  : HP → 7.0% loss  | Resistive → 12.0% loss
  //  -15°C : HP → 21.0% loss | Resistive → 24.0% loss
  //  -30°C : converges near 35–38% max
  //  < -30°C: capped at 38%
  function thermalLoss(t, hasHp) {
    if (t >= 20) return 0;
    var h = hasHp ? 1 : 0;
    var loss;
    if (t >= 0) {
      // Mild zone: 0°C to 20°C — gentle linear increase from 0%
      loss = (20 - t) * (0.60 - 0.25 * h);
    } else if (t >= -30) {
      // Cold zone: 0°C to -30°C — piecewise with heat-pump advantage
      loss = Math.min(38, (12 - 5 * h) + Math.abs(t) * (0.800 + 0.133 * h));
    } else {
      // Prairie extreme: below -30°C — hard cap
      loss = 38;
    }
    return Math.round(loss * 10) / 10;
  }

  function winterRange(base, t, hasHp) {
    var loss = thermalLoss(t, hasHp);
    return Math.round(base * (1 - loss / 100));
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

  // ── VEHICLE DATABASE (20 Canadian Models with Full Technical Specs) ──
  var VEHICLES = [
    {
      id:'tesla-model-y', name:'Tesla Model Y', make:'Tesla', body:'suv', msrp:59990, range:533, battery:75, dc:250, acc:5.0,
      evap_eligible:false, hp:true, ca:false, img:'TeslaModelYWM.png',
      hp_power:384, torque:376, fast_charge_min:27, home_charge_hrs:7.5, port:'NACS', supercharger:'Native',
      seats:5, cargo_l:854, frunk_l:117, towing_kg:1600, drivetrain:'Dual-Motor AWD', safety:'IIHS Top Safety Pick+',
      top_speed:217, efficiency:16.8, heated_seats:'Standard (Front & Rear)', heated_wheel:'Standard'
    },
    {
      id:'tesla-model-3', name:'Tesla Model 3', make:'Tesla', body:'sedan', msrp:54990, range:576, battery:82, dc:250, acc:4.2,
      evap_eligible:false, hp:true, ca:false, img:'TeslaModel3WM.png',
      hp_power:358, torque:394, fast_charge_min:25, home_charge_hrs:8.0, port:'NACS', supercharger:'Native',
      seats:5, cargo_l:594, frunk_l:88, towing_kg:1000, drivetrain:'Dual-Motor AWD / RWD', safety:'IIHS Top Safety Pick+',
      top_speed:225, efficiency:14.9, heated_seats:'Standard (Front & Rear)', heated_wheel:'Standard'
    },
    {
      id:'ioniq6', name:'Hyundai IONIQ 6', make:'Hyundai', body:'sedan', msrp:54999, range:581, battery:77.4, dc:230, acc:5.1,
      evap_eligible:false, hp:true, ca:false, img:'IONIQ6WM.png',
      hp_power:320, torque:446, fast_charge_min:18, home_charge_hrs:7.2, port:'CCS1 (800V)', supercharger:'Adapter Available',
      seats:5, cargo_l:401, frunk_l:45, towing_kg:1500, drivetrain:'HTRAC AWD / RWD', safety:'IIHS Top Safety Pick+',
      top_speed:185, efficiency:14.3, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'ioniq5', name:'Hyundai IONIQ 5', make:'Hyundai', body:'suv', msrp:49999, range:488, battery:77.4, dc:230, acc:5.1,
      evap_eligible:true, hp:true, ca:false, img:'IONIQ5WM.png',
      hp_power:320, torque:446, fast_charge_min:18, home_charge_hrs:7.5, port:'CCS1 (800V)', supercharger:'Adapter Available',
      seats:5, cargo_l:527, frunk_l:24, towing_kg:1600, drivetrain:'HTRAC AWD / RWD', safety:'IIHS Top Safety Pick+',
      top_speed:185, efficiency:17.5, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'kia-ev6', name:'Kia EV6', make:'Kia', body:'suv', msrp:47995, range:504, battery:77.4, dc:233, acc:5.2,
      evap_eligible:true, hp:true, ca:false, img:'KiaEV6WM.png',
      hp_power:320, torque:446, fast_charge_min:18, home_charge_hrs:7.2, port:'CCS1 (800V)', supercharger:'Adapter Available',
      seats:5, cargo_l:690, frunk_l:20, towing_kg:1600, drivetrain:'e-AWD / RWD', safety:'IIHS Top Safety Pick+',
      top_speed:185, efficiency:17.1, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'kia-ev9', name:'Kia EV9', make:'Kia', body:'suv', msrp:79995, range:505, battery:99.8, dc:233, acc:6.0,
      evap_eligible:false, hp:true, ca:false, img:'KiaEV9WM.png',
      hp_power:379, torque:516, fast_charge_min:24, home_charge_hrs:9.0, port:'CCS1 / NACS', supercharger:'Adapter / Native',
      seats:7, cargo_l:571, frunk_l:52, towing_kg:2268, drivetrain:'Dual-Motor e-AWD', safety:'IIHS Top Safety Pick',
      top_speed:200, efficiency:22.8, heated_seats:'Standard (1st & 2nd Row)', heated_wheel:'Standard'
    },
    {
      id:'chevy-bolt', name:'Chevrolet Bolt EV', make:'Chevrolet', body:'hatchback', msrp:39995, range:417, battery:65, dc:55, acc:6.5,
      evap_eligible:true, hp:false, ca:false, img:'ChevyBoltWM.png',
      hp_power:200, torque:266, fast_charge_min:55, home_charge_hrs:6.5, port:'CCS1', supercharger:'Adapter Available',
      seats:5, cargo_l:470, frunk_l:0, towing_kg:0, drivetrain:'Front-Wheel Drive', safety:'5-Star NHTSA Overall',
      top_speed:150, efficiency:16.1, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'chevy-equinox', name:'Chevrolet Equinox EV', make:'Chevrolet', body:'suv', msrp:44995, range:439, battery:85, dc:150, acc:6.9,
      evap_eligible:true, hp:true, ca:true, img:'ChevyEquinoxWM.png',
      hp_power:288, torque:333, fast_charge_min:30, home_charge_hrs:8.5, port:'CCS1 / NACS', supercharger:'Adapter Available',
      seats:5, cargo_l:742, frunk_l:0, towing_kg:680, drivetrain:'eAWD / FWD', safety:'5-Star NHTSA',
      top_speed:180, efficiency:19.2, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'mach-e', name:'Ford Mustang Mach-E', make:'Ford', body:'suv', msrp:54995, range:487, battery:91, dc:150, acc:3.8,
      evap_eligible:false, hp:false, ca:false, img:'MachEWM.png',
      hp_power:346, torque:428, fast_charge_min:36, home_charge_hrs:9.0, port:'CCS1', supercharger:'NACS Adapter Included',
      seats:5, cargo_l:821, frunk_l:139, towing_kg:1000, drivetrain:'eAWD / RWD', safety:'IIHS Top Safety Pick',
      top_speed:200, efficiency:20.5, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'vw-id4', name:'Volkswagen ID.4', make:'VW', body:'suv', msrp:49995, range:435, battery:82, dc:135, acc:6.2,
      evap_eligible:true, hp:true, ca:false, img:'VWID.4WM.png',
      hp_power:335, torque:402, fast_charge_min:28, home_charge_hrs:8.0, port:'CCS1', supercharger:'Adapter Available',
      seats:5, cargo_l:858, frunk_l:0, towing_kg:1225, drivetrain:'Dual-Motor AWD / RWD', safety:'IIHS Top Safety Pick+',
      top_speed:180, efficiency:18.8, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'nissan-ariya', name:'Nissan Ariya', make:'Nissan', body:'suv', msrp:53498, range:481, battery:91, dc:130, acc:5.7,
      evap_eligible:false, hp:true, ca:false, img:'NissanAriyaWM.png',
      hp_power:389, torque:442, fast_charge_min:35, home_charge_hrs:10.5, port:'CCS1', supercharger:'Adapter Available',
      seats:5, cargo_l:467, frunk_l:0, towing_kg:680, drivetrain:'e-4ORCE All-Wheel Drive', safety:'IIHS Top Safety Pick+',
      top_speed:200, efficiency:19.9, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'nissan-leaf', name:'Nissan LEAF', make:'Nissan', body:'hatchback', msrp:36898, range:341, battery:62, dc:100, acc:6.5,
      evap_eligible:true, hp:false, ca:false, img:'NissanLeafWM.png',
      hp_power:214, torque:250, fast_charge_min:45, home_charge_hrs:9.0, port:'CHAdeMO / J1772', supercharger:'Not Supported',
      seats:5, cargo_l:668, frunk_l:0, towing_kg:0, drivetrain:'Front-Wheel Drive', safety:'5-Star NHTSA',
      top_speed:157, efficiency:17.3, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'bmw-i4', name:'BMW i4', make:'BMW', body:'sedan', msrp:72900, range:590, battery:83.9, dc:205, acc:3.9,
      evap_eligible:false, hp:true, ca:false, img:'BMWi4WM.png',
      hp_power:396, torque:438, fast_charge_min:31, home_charge_hrs:8.0, port:'CCS1', supercharger:'Adapter Available',
      seats:5, cargo_l:470, frunk_l:0, towing_kg:1600, drivetrain:'xDrive AWD / RWD', safety:'5-Star Euro NCAP',
      top_speed:225, efficiency:16.4, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'bmw-ix', name:'BMW iX', make:'BMW', body:'suv', msrp:109000, range:630, battery:111.5, dc:200, acc:4.6,
      evap_eligible:false, hp:true, ca:false, img:'BMWiXWM.png',
      hp_power:516, torque:564, fast_charge_min:35, home_charge_hrs:11.0, port:'CCS1', supercharger:'Adapter Available',
      seats:5, cargo_l:500, frunk_l:0, towing_kg:2500, drivetrain:'xDrive Intelligent AWD', safety:'5-Star Euro NCAP',
      top_speed:200, efficiency:21.0, heated_seats:'Standard Radiant Heat', heated_wheel:'Standard'
    },
    {
      id:'polestar-2', name:'Polestar 2', make:'Polestar', body:'sedan', msrp:59900, range:476, battery:82, dc:205, acc:4.5,
      evap_eligible:false, hp:true, ca:false, img:'Polestar2WM.png',
      hp_power:421, torque:546, fast_charge_min:28, home_charge_hrs:8.0, port:'CCS1', supercharger:'Adapter Available',
      seats:5, cargo_l:405, frunk_l:35, towing_kg:1500, drivetrain:'Dual-Motor AWD / RWD', safety:'IIHS Top Safety Pick+',
      top_speed:205, efficiency:17.2, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'kona-ev', name:'Hyundai Kona Electric', make:'Hyundai', body:'suv', msrp:44499, range:417, battery:65.4, dc:100, acc:7.6,
      evap_eligible:true, hp:true, ca:false, img:'HyundaiKonaWM.png',
      hp_power:201, torque:188, fast_charge_min:43, home_charge_hrs:6.5, port:'CCS1', supercharger:'Adapter Available',
      seats:5, cargo_l:723, frunk_l:27, towing_kg:750, drivetrain:'Front-Wheel Drive', safety:'5-Star NHTSA',
      top_speed:172, efficiency:16.3, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'rivian-r1t', name:'Rivian R1T', make:'Rivian', body:'truck', msrp:89900, range:505, battery:135, dc:200, acc:3.0,
      evap_eligible:false, hp:true, ca:false, img:'RivianR1TWM.png',
      hp_power:665, torque:829, fast_charge_min:35, home_charge_hrs:13.0, port:'CCS1', supercharger:'NACS Adapter Included',
      seats:5, cargo_l:820, frunk_l:314, towing_kg:4990, drivetrain:'Quad / Dual Motor AWD', safety:'IIHS Top Safety Pick+',
      top_speed:185, efficiency:26.5, heated_seats:'Standard Heated & Ventilated', heated_wheel:'Standard'
    },
    {
      id:'solterra', name:'Subaru Solterra', make:'Subaru', body:'suv', msrp:59995, range:406, battery:71.4, dc:150, acc:7.5,
      evap_eligible:false, hp:true, ca:false, img:'SubaruSolterraWM.png',
      hp_power:215, torque:249, fast_charge_min:35, home_charge_hrs:9.5, port:'CCS1', supercharger:'Adapter Available',
      seats:5, cargo_l:820, frunk_l:0, towing_kg:680, drivetrain:'Symmetrical All-Wheel Drive', safety:'IIHS Top Safety Pick+',
      top_speed:160, efficiency:18.5, heated_seats:'Standard', heated_wheel:'Standard'
    },
    {
      id:'bz4x', name:'Toyota bZ4X', make:'Toyota', body:'suv', msrp:59990, range:406, battery:71.4, dc:150, acc:7.7,
      evap_eligible:false, hp:true, ca:false, img:'Toyotabz4xWM.png',
      hp_power:214, torque:248, fast_charge_min:35, home_charge_hrs:9.5, port:'CCS1', supercharger:'Adapter Available',
      seats:5, cargo_l:784, frunk_l:0, towing_kg:680, drivetrain:'AWD / FWD', safety:'IIHS Top Safety Pick',
      top_speed:160, efficiency:18.5, heated_seats:'Standard Radiant Heat', heated_wheel:'Standard'
    },
    {
      id:'volvo-ex40', name:'Volvo EX40', make:'Volvo', body:'suv', msrp:64950, range:461, battery:82, dc:150, acc:4.7,
      evap_eligible:false, hp:true, ca:false, img:'VolvoEX40WM.png',
      hp_power:402, torque:494, fast_charge_min:28, home_charge_hrs:8.0, port:'CCS1', supercharger:'Adapter Available',
      seats:5, cargo_l:452, frunk_l:31, towing_kg:900, drivetrain:'Twin Motor eAWD', safety:'IIHS Top Safety Pick+',
      top_speed:180, efficiency:19.4, heated_seats:'Standard', heated_wheel:'Standard'
    }
  ];

  // Helper map for fast lookup by ID or normalized name
  var VEHICLE_MAP = {};
  VEHICLES.forEach(function(v) {
    VEHICLE_MAP[v.id.toLowerCase()] = v;
    VEHICLE_MAP[v.name.toLowerCase()] = v;
    VEHICLE_MAP[v.name.toLowerCase().replace(/[^a-z0-9]/g,'')] = v;
  });

  function getVehicle(key) {
    if (!key) return null;
    var norm = String(key).trim().toLowerCase();
    if (VEHICLE_MAP[norm]) return VEHICLE_MAP[norm];
    var stripped = norm.replace(/[^a-z0-9]/g,'');
    if (VEHICLE_MAP[stripped]) return VEHICLE_MAP[stripped];
    for (var i = 0; i < VEHICLES.length; i++) {
      if (VEHICLES[i].id.toLowerCase().includes(norm) || VEHICLES[i].name.toLowerCase().includes(norm)) {
        return VEHICLES[i];
      }
    }
    return VEHICLES[0];
  }

  async function loadVehicles() {
    try {
      var res = await fetch(API, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var d = await res.json();
      if (d && d.body !== undefined) d = typeof d.body === 'string' ? JSON.parse(d.body) : d.body;
      var arr = Array.isArray(d) ? d : (d.items || d.vehicles || Object.values(d));
      return arr.map(function(v) {
        var baseObj = getVehicle(v.car_id || v.id || v.name) || {};
        var msrpVal = +(v.msrp_cad___base_trim || v.msrp || baseObj.msrp || 0);
        var eligible = v.evap_eligible !== undefined ? !!v.evap_eligible : (msrpVal <= 50000 && v.assembled_in_canada !== 'No');
        return {
          id: v.car_id || v.id || baseObj.id || v.name,
          name: v.name || v.vehicle_name || baseObj.name,
          make: v.brand || v.make || baseObj.make || '',
          body: (v.body_type || v.body || baseObj.body || 'suv').toLowerCase(),
          msrp: msrpVal,
          range: +(v.nrcan_range___best_trim__km || v.base_range_km || baseObj.range || 0),
          battery: +(v.battery___usable__kwh || v.battery_capacity_kwh || baseObj.battery || 0),
          dc: +(v.max_dc_fast_charge__kw || baseObj.dc || 0),
          acc: +(v['0_100_km_h__sec'] || baseObj.acc || 0),
          evap_eligible: eligible,
          rebate: eligible ? 5000 : 0,
          hp: v.heat_pump === 'Standard' || v.heat_pump === 'Yes' || v.hp === true || baseObj.hp === true,
          ca: v.assembled_in_canada === 'Yes' || v.ca === true || baseObj.ca === true,
          img: v.image_url || baseObj.img || (v.name || '').replace(/\s+/g,'') + 'WM.png',
          // Rich technical specifications
          hp_power: +(v.horsepower__hp || baseObj.hp_power || 0),
          torque: +(v.torque__lb_ft || baseObj.torque || 0),
          fast_charge_min: +(v['10_80__charge_time__min'] || baseObj.fast_charge_min || 30),
          home_charge_hrs: +(v.full_charge___home_level_2__hrs || baseObj.home_charge_hrs || 8),
          port: v.charge_port_type || baseObj.port || 'CCS1',
          supercharger: v.tesla_supercharger_access || baseObj.supercharger || 'Adapter Available',
          seats: +(v.seating_capacity || baseObj.seats || 5),
          cargo_l: +(v.cargo_volume___seats_up__l || baseObj.cargo_l || 500),
          frunk_l: +(v.frunk_volume__l || baseObj.frunk_l || 0),
          towing_kg: +(v.tow_rating__kg || baseObj.towing_kg || 0),
          drivetrain: v.drivetrain_options || baseObj.drivetrain || 'All-Wheel Drive',
          safety: v.iihs_top_safety_pick || baseObj.safety || 'Top Safety Rating',
          top_speed: +(v.top_speed__km_h || baseObj.top_speed || 180),
          efficiency: +(v.efficiency__wh_km ? (v.efficiency__wh_km/10).toFixed(1) : baseObj.efficiency || 17.5),
          heated_seats: v.heated_seats || baseObj.heated_seats || 'Standard',
          heated_wheel: v.heated_steering_wheel || baseObj.heated_wheel || 'Standard'
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
    calculateEvap: calculateEvap,
    getVehicle: getVehicle
  };
})(window);
