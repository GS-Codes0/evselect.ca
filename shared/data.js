/* EVSelect.ca — Vehicle Data */
'use strict';
(function(global) {
  var API = 'https://zmwmtgdzri.execute-api.us-east-1.amazonaws.com/ev-cars';

  function thermalLoss(t) { return t >= 0 ? 0 : Math.min(35, Math.abs(t) * (35/30)); }
  function winterRange(base, t) { return Math.round(base * (1 - thermalLoss(t) / 100)); }

  var VEHICLES = [
    {id:'tesla-model-y',  name:'Tesla Model Y',         make:'Tesla',    msrp:59990, range:533, battery:75,   dc:250, acc:5.0,  rebate:0,    hp:true,  ca:false, img:'TeslaModelYWM.png'},
    {id:'tesla-model-3',  name:'Tesla Model 3',         make:'Tesla',    msrp:54990, range:576, battery:82,   dc:250, acc:4.2,  rebate:0,    hp:true,  ca:false, img:'TeslaModel3WM.png'},
    {id:'ioniq6',         name:'Hyundai IONIQ 6',       make:'Hyundai',  msrp:54999, range:581, battery:77.4, dc:230, acc:5.1,  rebate:5000, hp:true,  ca:false, img:'IONIQ6WM.png'},
    {id:'ioniq5',         name:'Hyundai IONIQ 5',       make:'Hyundai',  msrp:49999, range:488, battery:77.4, dc:230, acc:5.1,  rebate:5000, hp:true,  ca:false, img:'IONIQ5WM.png'},
    {id:'kia-ev6',        name:'Kia EV6',               make:'Kia',      msrp:47995, range:504, battery:77.4, dc:233, acc:5.2,  rebate:5000, hp:true,  ca:false, img:'KiaEV6WM.png'},
    {id:'kia-ev9',        name:'Kia EV9',               make:'Kia',      msrp:79995, range:505, battery:99.8, dc:233, acc:6.0,  rebate:0,    hp:true,  ca:false, img:'KiaEV9WM.png'},
    {id:'chevy-bolt',     name:'Chevrolet Bolt EV',     make:'Chevrolet',msrp:39995, range:417, battery:65,   dc:55,  acc:6.5,  rebate:5000, hp:false, ca:false, img:'ChevyBoltWM.png'},
    {id:'chevy-equinox',  name:'Chevrolet Equinox EV',  make:'Chevrolet',msrp:44995, range:439, battery:85,   dc:150, acc:6.9,  rebate:5000, hp:true,  ca:true,  img:'ChevyEquinoxWM.png'},
    {id:'mach-e',         name:'Ford Mustang Mach-E',   make:'Ford',     msrp:54995, range:487, battery:91,   dc:150, acc:3.8,  rebate:5000, hp:false, ca:false, img:'MachEWM.png'},
    {id:'vw-id4',         name:'Volkswagen ID.4',       make:'VW',       msrp:49995, range:435, battery:82,   dc:135, acc:6.2,  rebate:5000, hp:true,  ca:false, img:'VWID.4WM.png'},
    {id:'nissan-ariya',   name:'Nissan Ariya',          make:'Nissan',   msrp:53498, range:481, battery:91,   dc:130, acc:5.7,  rebate:5000, hp:true,  ca:false, img:'NissanAriyaWM.png'},
    {id:'nissan-leaf',    name:'Nissan LEAF',           make:'Nissan',   msrp:36898, range:341, battery:62,   dc:100, acc:6.5,  rebate:5000, hp:false, ca:false, img:'NissanLeafWM.png'},
    {id:'bmw-i4',         name:'BMW i4',                make:'BMW',      msrp:72900, range:590, battery:83.9, dc:205, acc:3.9,  rebate:0,    hp:true,  ca:false, img:'BMWi4WM.png'},
    {id:'bmw-ix',         name:'BMW iX',                make:'BMW',      msrp:109000,range:630, battery:111.5,dc:200, acc:4.6,  rebate:0,    hp:true,  ca:false, img:'BMWiXWM.png'},
    {id:'polestar-2',     name:'Polestar 2',            make:'Polestar', msrp:59900, range:476, battery:82,   dc:205, acc:4.5,  rebate:5000, hp:true,  ca:false, img:'Polestar2WM.png'},
    {id:'kona-ev',        name:'Hyundai Kona Electric', make:'Hyundai',  msrp:44499, range:417, battery:65.4, dc:100, acc:7.6,  rebate:5000, hp:true,  ca:false, img:'HyundaiKonaWM.png'},
    {id:'rivian-r1t',     name:'Rivian R1T',            make:'Rivian',   msrp:89900, range:505, battery:135,  dc:200, acc:3.0,  rebate:0,    hp:true,  ca:false, img:'RivianR1TWM.png'},
    {id:'solterra',       name:'Subaru Solterra',       make:'Subaru',   msrp:59995, range:406, battery:71.4, dc:150, acc:7.5,  rebate:5000, hp:true,  ca:false, img:'SubaruSolterraWM.png'},
    {id:'bz4x',           name:'Toyota bZ4X',           make:'Toyota',   msrp:59990, range:406, battery:71.4, dc:150, acc:7.7,  rebate:5000, hp:true,  ca:false, img:'Toyotabz4xWM.png'},
    {id:'volvo-ex40',     name:'Volvo EX40',            make:'Volvo',    msrp:64950, range:461, battery:82,   dc:150, acc:4.7,  rebate:0,    hp:true,  ca:false, img:'VolvoEX40WM.png'}
  ];

  async function loadVehicles() {
    try {
      var res = await fetch(API, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var d = await res.json();
      if (d && d.body !== undefined) d = typeof d.body === 'string' ? JSON.parse(d.body) : d.body;
      var arr = Array.isArray(d) ? d : (d.items || d.vehicles || Object.values(d));
      return arr.map(function(v) {
        return {
          id: v.car_id || v.id || v.name,
          name: v.name || v.vehicle_name,
          make: v.brand || v.make || '',
          msrp: v.msrp_cad___base_trim || v.msrp || 0,
          range: v.nrcan_range___best_trim__km || v.base_range_km || 0,
          battery: v.battery___usable__kwh || v.battery_capacity_kwh || 0,
          dc: v.max_dc_fast_charge__kw || 0,
          acc: v['0_100_km_h__sec'] || 0,
          rebate: v.izev_federal_rebate || 0,
          hp: v.heat_pump === 'Standard' || v.heat_pump === 'Yes',
          ca: v.assembled_in_canada === 'Yes',
          img: v.image_url || (v.name || '').replace(/\s+/g,'') + 'WM.png'
        };
      });
    } catch(e) {
      console.warn('EVSelect: API unavailable, using local data.', e.message);
      return VEHICLES;
    }
  }

  global.EVS = { VEHICLES: VEHICLES, loadVehicles: loadVehicles, thermalLoss: thermalLoss, winterRange: winterRange };
})(window);
