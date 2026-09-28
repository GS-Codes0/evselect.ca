/* EVSelect.ca — Interactive Vehicle Spec & Stats Sheet Engine */
'use strict';
(function() {
  function ensureModal() {
    if (document.getElementById('statsSheetModal')) return;

    var modalHtml = 
      '<div id="statsSheetModal" class="ss-modal" role="dialog" aria-modal="true" aria-labelledby="ssModalTitle" style="display:none">' +
        '<div class="ss-backdrop" id="ssBackdrop"></div>' +
        '<div class="ss-box" role="document">' +
          '<div class="ss-header">' +
            '<div class="ss-brand-row">' +
              '<span class="eyebrow" id="ssMakeCategory" style="margin-bottom:0">Vehicle Specifications</span>' +
              '<button type="button" class="ss-close" id="ssCloseBtn" aria-label="Close specifications sheet">&times;</button>' +
            '</div>' +
            '<div class="ss-title-row">' +
              '<div>' +
                '<h2 class="ss-title" id="ssModalTitle">Vehicle Name</h2>' +
                '<div class="ss-price-wrap">' +
                  '<span class="ss-msrp" id="ssMsrp">Starting at $0 CAD</span>' +
                  '<span class="ss-net" id="ssNetPrice">Est. Net with EVAP: $0 CAD</span>' +
                '</div>' +
              '</div>' +
              '<div class="ss-badges" id="ssBadges"></div>' +
            '</div>' +
          '</div>' +

          '<div class="ss-body">' +
            '<!-- Vehicle Image Showcase -->' +
            '<div class="ss-hero-img-wrap">' +
              '<img id="ssImage" src="evcarslogo.png" alt="Vehicle preview" class="ss-hero-img" loading="eager"/>' +
              '<div class="ss-hero-overlay">' +
                '<span class="ss-hero-caption" id="ssHeroCaption">Canadian Spec &bull; Verified NRCan Data</span>' +
              '</div>' +
            '</div>' +

            '<!-- 4 Technical Spec Quadrants -->' +
            '<div class="ss-specs-grid">' +
              '<!-- 1. Winter & Real-World Range -->' +
              '<div class="ss-spec-card">' +
                '<div class="ss-card-hd">' +
                  '<span class="ss-card-icon">❄️</span>' +
                  '<h4>Range &amp; Winter Resilience</h4>' +
                '</div>' +
                '<div class="ss-stat-list">' +
                  '<div class="ss-stat-item"><span class="ss-k">Official NRCan Range:</span><span class="ss-v highlight" id="ssRange">-- km</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Winter Range (&minus;15&deg;C):</span><span class="ss-v winter-accent" id="ssWinter15">-- km</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Prairie Freeze (&minus;30&deg;C):</span><span class="ss-v" id="ssWinter30">-- km</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Cold Thermal Loss (&minus;15&deg;C):</span><span class="ss-v" id="ssLossPct">--%</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Cabin Heating System:</span><span class="ss-v" id="ssHeatPump">--</span></div>' +
                '</div>' +
              '</div>' +

              '<!-- 2. Battery & Fast Charging -->' +
              '<div class="ss-spec-card">' +
                '<div class="ss-card-hd">' +
                  '<span class="ss-card-icon">⚡</span>' +
                  '<h4>Battery &amp; Charging</h4>' +
                '</div>' +
                '<div class="ss-stat-list">' +
                  '<div class="ss-stat-item"><span class="ss-k">Usable Battery Pack:</span><span class="ss-v" id="ssBattery">-- kWh</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Peak DC Fast Charge:</span><span class="ss-v highlight" id="ssDc">-- kW</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">10%&ndash;80% Fast Charge:</span><span class="ss-v" id="ssFastMin">-- mins</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Level 2 Full Charge:</span><span class="ss-v" id="ssHomeHrs">-- hrs</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Port &amp; Supercharger:</span><span class="ss-v" id="ssPort">--</span></div>' +
                '</div>' +
              '</div>' +

              '<!-- 3. Performance & Power -->' +
              '<div class="ss-spec-card">' +
                '<div class="ss-card-hd">' +
                  '<span class="ss-card-icon">🏎️</span>' +
                  '<h4>Performance &amp; Drivetrain</h4>' +
                '</div>' +
                '<div class="ss-stat-list">' +
                  '<div class="ss-stat-item"><span class="ss-k">0&ndash;100 km/h Acceleration:</span><span class="ss-v highlight" id="ssAcc">-- s</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Peak Horsepower:</span><span class="ss-v" id="ssHp">-- hp</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Peak Torque:</span><span class="ss-v" id="ssTorque">-- lb-ft</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Drivetrain Architecture:</span><span class="ss-v" id="ssDrivetrain">--</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Real-World Efficiency:</span><span class="ss-v" id="ssEff">-- kWh/100km</span></div>' +
                '</div>' +
              '</div>' +

              '<!-- 4. Practicality & Dimensions -->' +
              '<div class="ss-spec-card">' +
                '<div class="ss-card-hd">' +
                  '<span class="ss-card-icon">📦</span>' +
                  '<h4>Utility, Space &amp; Safety</h4>' +
                '</div>' +
                '<div class="ss-stat-list">' +
                  '<div class="ss-stat-item"><span class="ss-k">Seating Capacity:</span><span class="ss-v" id="ssSeats">-- Adults</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Cargo Trunk (Seats Up):</span><span class="ss-v" id="ssCargo">-- L</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Front Trunk (Frunk):</span><span class="ss-v" id="ssFrunk">--</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Max Towing Rating:</span><span class="ss-v" id="ssTow">--</span></div>' +
                  '<div class="ss-stat-item"><span class="ss-k">Safety Testing Rating:</span><span class="ss-v" id="ssSafety">--</span></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<!-- Prominent Action Bar -->' +
          '<div class="ss-footer">' +
            '<div class="ss-ft-left">' +
              '<a id="ssWinterBtn" href="tools.html#winter" class="btn btn-ghost ss-tool-btn">❄️ Test in Winter Tool &rarr;</a>' +
              '<a id="ssRebateBtn" href="tools.html#rebate" class="btn btn-ghost ss-tool-btn">💰 Check Rebates &rarr;</a>' +
            '</div>' +
            '<div class="ss-ft-right">' +
              '<button type="button" id="ssCompareBtn" class="btn btn-primary ss-compare-cta">Compare this Vehicle &rarr;</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = modalHtml;
    document.body.appendChild(wrap.firstElementChild);

    // Bind close events
    document.getElementById('ssCloseBtn').addEventListener('click', closeStatsSheet);
    document.getElementById('ssBackdrop').addEventListener('click', closeStatsSheet);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeStatsSheet();
    });
  }

  function openStatsSheet(vehicleKey) {
    if (!window.EVS || !window.EVS.getVehicle) return;
    ensureModal();

    var v = window.EVS.getVehicle(vehicleKey);
    if (!v) return;

    var modal = document.getElementById('statsSheetModal');
    var wr15 = window.EVS.winterRange(v.range, -15, v.hp);
    var wr30 = window.EVS.winterRange(v.range, -30, v.hp);
    var loss15 = Math.round(window.EVS.thermalLoss(-15, v.hp));
    var evapAmt = window.EVS.calculateEvap(v, 2026);
    var netEst = v.msrp ? Math.max(0, v.msrp - evapAmt) : 0;

    // Header info
    document.getElementById('ssMakeCategory').textContent = (v.make || 'Electric') + ' • ' + (v.body ? v.body.toUpperCase() : 'EV') + ' • Canadian Model';
    document.getElementById('ssModalTitle').textContent = v.name;
    document.getElementById('ssMsrp').textContent = 'Starting MSRP: $' + v.msrp.toLocaleString('en-CA') + ' CAD';
    document.getElementById('ssNetPrice').textContent = evapAmt > 0 
      ? 'Est. Net with EVAP: $' + netEst.toLocaleString('en-CA') + ' CAD (-$' + evapAmt.toLocaleString('en-CA') + ')'
      : 'Federal EVAP: Ineligible (MSRP exceeds $50k transaction cap)';

    // Badges
    var badges = [];
    if (v.evap_eligible) {
      badges.push('<span class="badge badge-g">2026 EVAP $5k Eligible</span>');
    } else {
      badges.push('<span class="badge badge-o">Over $50k EVAP Cap</span>');
    }
    if (v.hp) {
      badges.push('<span class="badge badge-b">Standard Heat Pump</span>');
    } else {
      badges.push('<span class="badge badge-p">Resistive PTC Heater</span>');
    }
    if (v.ca) {
      badges.push('<span class="badge badge-p">Made in Canada</span>');
    }
    document.getElementById('ssBadges').innerHTML = badges.join('');

    // Image
    var img = document.getElementById('ssImage');
    img.src = v.img;
    img.alt = v.name;
    img.onerror = function() {
      this.src = 'evcarslogo.png';
      this.style.objectFit = 'contain';
      this.style.padding = '32px';
      this.style.opacity = '.4';
    };
    document.getElementById('ssHeroCaption').textContent = v.name + ' • Official NRCan ' + v.range + ' km Range';

    // Range & Winter specs
    document.getElementById('ssRange').textContent = v.range + ' km';
    document.getElementById('ssWinter15').textContent = wr15 + ' km';
    document.getElementById('ssWinter30').textContent = wr30 + ' km';
    document.getElementById('ssLossPct').textContent = '-' + loss15 + '% loss at -15°C';
    document.getElementById('ssHeatPump').textContent = v.hp ? 'Standard Heat Pump (High Efficiency)' : 'Resistive PTC Heater';

    // Battery & Fast Charge
    document.getElementById('ssBattery').textContent = (v.battery || '--') + ' kWh usable';
    document.getElementById('ssDc').textContent = (v.dc || '--') + ' kW max';
    document.getElementById('ssFastMin').textContent = (v.fast_charge_min ? v.fast_charge_min + ' mins' : '~25 mins');
    document.getElementById('ssHomeHrs').textContent = (v.home_charge_hrs ? v.home_charge_hrs + ' hrs' : '~8 hrs');
    document.getElementById('ssPort').textContent = (v.port || 'CCS1') + ' • ' + (v.supercharger || 'Adapter Available');

    // Performance
    document.getElementById('ssAcc').textContent = (v.acc ? v.acc + ' sec' : '--');
    document.getElementById('ssHp').textContent = (v.hp_power ? v.hp_power + ' hp' : '--');
    document.getElementById('ssTorque').textContent = (v.torque ? v.torque + ' lb-ft' : '--');
    document.getElementById('ssDrivetrain').textContent = v.drivetrain || 'All-Wheel Drive';
    document.getElementById('ssEff').textContent = (v.efficiency ? v.efficiency + ' kWh/100km' : '17.2 kWh/100km');

    // Practicality
    document.getElementById('ssSeats').textContent = (v.seats || 5) + ' Adults';
    document.getElementById('ssCargo').textContent = (v.cargo_l ? v.cargo_l.toLocaleString('en-CA') + ' L' : '-- L');
    document.getElementById('ssFrunk').textContent = (v.frunk_l ? v.frunk_l + ' L Front Trunk' : 'None');
    document.getElementById('ssTow').textContent = (v.towing_kg ? v.towing_kg.toLocaleString('en-CA') + ' kg' : 'Not Rated');
    document.getElementById('ssSafety').textContent = v.safety || '5-Star NHTSA / IIHS TSP';

    // Action CTAs
    document.getElementById('ssWinterBtn').href = 'tools.html?v=' + encodeURIComponent(v.id) + '#winter';
    document.getElementById('ssRebateBtn').href = 'tools.html?v=' + encodeURIComponent(v.id) + '#rebate';

    var cmpBtn = document.getElementById('ssCompareBtn');
    cmpBtn.onclick = function() {
      closeStatsSheet();
      // If currently on compare.html, populate pickA directly
      if (window.location.pathname.includes('compare.html')) {
        var pickA = document.getElementById('pickA');
        if (pickA) {
          pickA.value = v.id;
          pickA.dispatchEvent(new Event('change'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      window.location.href = 'compare.html?a=' + encodeURIComponent(v.id);
    };

    // Open display
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeStatsSheet() {
    var modal = document.getElementById('statsSheetModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // Enhance Models dropdown items with car thumbnails and ensure clicking navigates to the visual card
  function initDropdownTriggers() {
    var menu = document.getElementById('modelsMenu');
    if (!menu) return;

    var links = menu.querySelectorAll('.nav-dropdown-item');
    links.forEach(function(a) {
      var href = a.getAttribute('href') || '';
      if (href === 'vehicles.html' || href === 'vehicles.html#') return;

      var match = href.match(/[?&]q=([^&]+)/);
      var q = match ? decodeURIComponent(match[1].replace(/\+/g,' ')) : a.textContent.trim();
      var v = (window.EVS && window.EVS.getVehicle) ? window.EVS.getVehicle(q) : null;

      // Add car thumbnail, name, and starting price
      if (v && !a.querySelector('.nav-drop-thumb')) {
        a.classList.add('nav-dropdown-item-rich');
        a.innerHTML = 
          '<img src="' + v.img + '" alt="' + v.name + '" class="nav-drop-thumb" onerror="this.style.display=\'none\'"/>' +
          '<div class="nav-drop-info">' +
            '<span class="nav-drop-name">' + v.name + '</span>' +
            '<span class="nav-drop-meta">From $' + v.msrp.toLocaleString('en-CA') + ' CAD</span>' +
          '</div>';
      }

      a.addEventListener('click', function(e) {
        // If already on vehicles.html, filter search and scroll to the card directly
        if (window.location.pathname.includes('vehicles.html')) {
          e.preventDefault();
          var pSearch = document.getElementById('pageSearch');
          if (pSearch) {
            pSearch.value = q;
            if (typeof render === 'function') render();
            var grid = document.getElementById('grid');
            if (grid) {
              grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
          // Close mobile menu if open
          var navLinks = document.getElementById('navLinks');
          if (navLinks) navLinks.classList.remove('open');
        }
        // If on another page, allow standard link navigation to vehicles.html?q=...
        // so the user sees the car laid out with its picture, and can click to view stats!
      });
    });
  }

  window.openStatsSheet = openStatsSheet;
  window.closeStatsSheet = closeStatsSheet;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdownTriggers);
  } else {
    initDropdownTriggers();
  }
})();
