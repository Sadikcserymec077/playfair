// Encrypt flow
async function encryptFlow() {
    const key = document.getElementById('key').value;
    const text = document.getElementById('plaintext').value;
    const pad = document.getElementById('pad').value;

    const res = await fetch('/encrypt', {
        method: 'POST',
        body: new URLSearchParams({ key, text, pad })
    });

    const data = await res.json();

    // Show encryption section
    document.getElementById('encryption-section').style.display = 'block';
    document.getElementById('decryption-section').style.display = 'none';

    // Update encryption result
    document.getElementById('prepared').innerText = data.prepared;
    document.getElementById('cipher').innerText = data.cipher;
    showSteps('enc-steps', data.enc_steps);

    // Auto-fill ciphertext into decrypt box
    document.getElementById('ciphertext').value = data.cipher;

    // Reveal decrypt section
    document.getElementById('decryption-section').style.display = 'block';
}

// Decrypt flow
async function decryptFlow() {
    const key = document.getElementById('key').value;
    const text = document.getElementById('ciphertext').value;
    const pad = document.getElementById('pad').value;

    const res = await fetch('/decrypt', {
        method: 'POST',
        body: new URLSearchParams({ key, text, pad })
    });

    const data = await res.json();

    // Update decrypted text and steps
    document.getElementById('plain').innerText = data.decrypted;
    showSteps('dec-steps', data.dec_steps);
}

// Common table rendering
function showSteps(tableId, steps) {
    const t = document.getElementById(tableId);
    t.innerHTML = '<tr><th>Pair</th><th>Rule</th><th>Result</th></tr>';
    for (let s of steps) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.pair}</td><td>${s.rule}</td><td>${s.result}</td>`;
        styleRowByRule(tr, s.rule);
        t.appendChild(tr);
    }
}

// Color-coded row backgrounds
function styleRowByRule(tr, rule) {
    if (!rule) return;
    if (rule.includes('row')) {
        tr.style.backgroundColor = '#e8f5e9'; // green
    } else if (rule.includes('column')) {
        tr.style.backgroundColor = '#e3f2fd'; // blue
    } else if (rule.includes('rectangle')) {
        tr.style.backgroundColor = '#fff3e0'; // orange
    }
}
