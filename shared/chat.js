/* EVSelect.ca — Navigation Assistant */
'use strict';
(function() {
  var HF = 'mistralai/Mistral-7B-Instruct-v0.3';
  var SYS = 'You are EVSelect.ca\'s assistant for Canadian EV buyers. Answer concisely about: EV winter range in Canada, federal iZEV rebate ($5000, under $55k), BC rebate ($4000 CEV), QC rebate ($4000 Roulez Vert), AB/ON (no provincial rebate), Edmonton-Calgary charging (QCEW Red Deer), heat pumps, and EVSelect platform navigation. Keep responses under 3 sentences.';
  var history = [];
  var open = false;

  var PAGES = [
    { href: 'index.html',             icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>', label: 'Home' },
    { href: 'vehicles.html',          icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>', label: 'Browse EVs' },
    { href: 'tools.html#winter',      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07 19.07 4.93"/></svg>', label: 'Winter Range' },
    { href: 'tools.html#rebate',      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>', label: 'Rebate Calculator' },
    { href: 'compare.html',           icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>', label: 'Compare Cars' }
  ];

  function localFallback(q) {
    q = q.toLowerCase();
    if (q.includes('winter') || q.includes('cold') || q.includes('range'))
      return 'In Canadian winters expect 20\u201335% range loss below \u221210\u00b0C. Heat-pump equipped EVs (IONIQ 6, Tesla, BMW i4) perform best. Pre-condition while plugged in to recover 10\u201315%.';
    if (q.includes('rebate') || q.includes('izev') || q.includes('incentive'))
      return 'Federal iZEV: $5,000 for EVs under $55k CAD. BC adds $4,000 (CEV for BC). QC adds $4,000 (Roulez Vert). AB and ON have no provincial EV rebate. Max stack: $9,000.';
    if (q.includes('calgary') || q.includes('edmonton') || q.includes('hwy 2') || q.includes('highway 2'))
      return 'Edmonton to Calgary (~300 km) has great EV coverage. QCEW fast chargers at Red Deer Gasoline Alley are the standard midpoint stop (~150 km each way). Allow 25\u201340 min.';
    if (q.includes('heat pump'))
      return 'Heat pumps use 60\u201370% less battery energy than resistive heaters in cold weather. IONIQ 5/6, Tesla, BMW i4, Polestar 2, VW ID.4, and most modern EVs include them.';
    if (q.includes('compare'))
      return 'Head to the Compare page to place any two EVs side-by-side with spec bars and winter range at your selected temperature.';
    if (q.includes('navigate') || q.includes('where') || q.includes('page') || q.includes('find'))
      return 'Use the quick links above to navigate! Browse all EVs, use the Tools page for winter range and rebate calculations, or Compare two vehicles directly.';
    return 'I can help with Canadian EV winter range, iZEV rebates, charging networks, and navigating evselect.ca. What would you like to know?';
  }

  function buildUI() {
    var nav = PAGES.map(function(p) {
      return '<a href="' + p.href + '" class="asst-nav-link">' + p.icon + '<span>' + p.label + '</span></a>';
    }).join('');

    var el = document.createElement('div');
    el.id = 'evs-asst';
    el.innerHTML =
      '<button id="evs-asst-btn" aria-label="Open EVSelect Assistant" aria-expanded="false">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>' +
      '</button>' +
      '<div id="evs-asst-panel" aria-hidden="true">' +
        '<div class="asst-hd">' +
          '<div class="asst-hd-brand">evselect<span>.ca</span></div>' +
          '<button class="asst-close" aria-label="Close assistant">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="asst-nav-section">' +
          '<div class="asst-section-label">Navigate</div>' +
          nav +
        '</div>' +
        '<div class="asst-sep"></div>' +
        '<div class="asst-section-label" style="padding:0 16px 10px">Ask a question</div>' +
        '<div id="asst-msgs" class="asst-msgs"></div>' +
        '<div class="asst-input-row">' +
          '<input id="asst-input" type="text" placeholder="e.g. Best EV for Calgary winters?" autocomplete="off" />' +
          '<button id="asst-send" aria-label="Send">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';

    var style = document.createElement('style');
    style.textContent = [
      '#evs-asst{position:fixed;bottom:24px;right:24px;z-index:200;display:flex;flex-direction:column;align-items:flex-end;gap:12px}',
      '#evs-asst-btn{',
        'width:52px;height:52px;border-radius:50%;',
        'background:#0b1118;border:1px solid rgba(255,255,255,.13);',
        'color:#f5f5f7;display:flex;align-items:center;justify-content:center;',
        'box-shadow:0 4px 24px rgba(0,0,0,.5);',
        'transition:transform .2s,box-shadow .2s,background .2s;',
        'cursor:pointer;',
      '}',
      '#evs-asst-btn:hover{transform:scale(1.08);background:#131e28;box-shadow:0 6px 32px rgba(0,200,150,.2)}',
      '#evs-asst-panel{',
        'width:300px;background:#0b1118;border:1px solid rgba(255,255,255,.1);',
        'border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.7);',
        'overflow:hidden;',
        'opacity:0;transform:translateY(16px) scale(.96);pointer-events:none;',
        'transition:opacity .3s cubic-bezier(.16,1,.3,1),transform .3s cubic-bezier(.16,1,.3,1);',
      '}',
      '#evs-asst-panel.open{opacity:1;transform:none;pointer-events:all}',
      '.asst-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07)}',
      '.asst-hd-brand{font-size:15px;font-weight:700;letter-spacing:-.04em;color:#f5f5f7}',
      '.asst-hd-brand span{color:#00c896}',
      '.asst-close{color:rgba(245,245,247,.45);width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;transition:background .2s,color .2s;cursor:pointer;border:none;background:none}',
      '.asst-close:hover{background:rgba(255,255,255,.07);color:#f5f5f7}',
      '.asst-nav-section{padding:12px 8px 10px}',
      '.asst-section-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,245,247,.3);padding:0 8px 8px}',
      '.asst-nav-link{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:10px;color:rgba(245,245,247,.7);font-size:13px;font-weight:500;text-decoration:none;transition:background .15s,color .15s}',
      '.asst-nav-link:hover{background:rgba(255,255,255,.06);color:#f5f5f7}',
      '.asst-sep{border:none;border-top:1px solid rgba(255,255,255,.07);margin:0}',
      '.asst-msgs{max-height:160px;overflow-y:auto;padding:8px 12px;display:flex;flex-direction:column;gap:8px}',
      '.asst-msgs:empty{display:none}',
      '.asst-msg{font-size:13px;line-height:1.55;padding:10px 12px;border-radius:10px;max-width:90%}',
      '.asst-msg.user{background:#00c896;color:#020c08;align-self:flex-end;border-radius:10px 10px 2px 10px}',
      '.asst-msg.bot{background:rgba(255,255,255,.06);color:rgba(245,245,247,.85);align-self:flex-start;border-radius:10px 10px 10px 2px}',
      '.asst-msg.thinking{color:rgba(245,245,247,.4);font-style:italic}',
      '.asst-input-row{display:flex;align-items:center;gap:8px;padding:10px 12px 14px}',
      '#asst-input{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#f5f5f7;font-size:13px;padding:9px 12px;outline:none;font-family:inherit;transition:border-color .2s}',
      '#asst-input:focus{border-color:#00c896}',
      '#asst-input::placeholder{color:rgba(245,245,247,.3)}',
      '#asst-send{width:34px;height:34px;border-radius:9px;background:#00c896;color:#020c08;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:opacity .2s;border:none}',
      '#asst-send:hover{opacity:.85}',
    ].join('');
    document.head.appendChild(style);
    document.body.appendChild(el);

    document.getElementById('evs-asst-btn').addEventListener('click', toggle);
    document.getElementById('asst-send').addEventListener('click', sendMsg);
    document.getElementById('asst-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); sendMsg(); }
    });
    el.querySelector('.asst-close').addEventListener('click', closePanel);
  }

  function toggle() {
    if (open) closePanel(); else openPanel();
  }
  function openPanel() {
    open = true;
    document.getElementById('evs-asst-panel').classList.add('open');
    document.getElementById('evs-asst-panel').removeAttribute('aria-hidden');
    document.getElementById('evs-asst-btn').setAttribute('aria-expanded', 'true');
    setTimeout(function() { document.getElementById('asst-input').focus(); }, 320);
  }
  function closePanel() {
    open = false;
    document.getElementById('evs-asst-panel').classList.remove('open');
    document.getElementById('evs-asst-panel').setAttribute('aria-hidden', 'true');
    document.getElementById('evs-asst-btn').setAttribute('aria-expanded', 'false');
  }

  function appendMsg(role, text) {
    var msgs = document.getElementById('asst-msgs');
    var d = document.createElement('div');
    d.className = 'asst-msg ' + role;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  async function sendMsg() {
    var inp = document.getElementById('asst-input');
    var msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';
    appendMsg('user', msg);
    var thinking = appendMsg('bot thinking', 'Thinking\u2026');
    history.push({ role: 'user', content: msg });
    var reply = '';
    try {
      var res = await fetch('https://api-inference.huggingface.co/models/' + HF + '/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: HF,
          messages: [{ role: 'system', content: SYS }].concat(history.slice(-6)),
          max_tokens: 160, temperature: 0.5, stream: false
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var d = await res.json();
      reply = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || '').trim();
      if (!reply) throw new Error('empty');
    } catch(e) {
      reply = localFallback(msg);
    }
    thinking.remove();
    appendMsg('bot', reply);
    history.push({ role: 'assistant', content: reply });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
})();
