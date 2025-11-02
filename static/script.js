// Playfair Cipher — Client-side implementation
// Attach event handlers after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-encrypt').addEventListener('click', encryptFlow);
    document.getElementById('btn-decrypt').addEventListener('click', decryptFlow);
  
    // Initial render using default inputs
    encryptFlow();
  });
  
  /* ---------- Utilities ---------- */
  function normalizeInput(s) {
    return s.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  }
  
  /* ---------- Matrix Generation ---------- */
  function generateMatrix(key) {
    key = normalizeInput(key || '');
    const used = new Set();
    const mat = [];
    const order = [];
  
    // Add key letters (unique)
    for (let ch of key) {
      if (!used.has(ch)) {
        used.add(ch);
        order.push(ch);
      }
    }
  
    // Add remaining letters A..Z but treat J as I
    for (let code = 65; code <= 90; code++) {
      const ch = String.fromCharCode(code);
      if (ch === 'J') continue; // skip J (use I)
      if (!used.has(ch)) {
        used.add(ch);
        order.push(ch);
      }
    }
  
    // Make 5x5 matrix
    for (let r = 0; r < 5; r++) {
      mat.push(order.slice(r * 5, r * 5 + 5));
    }
  
    // Build lookup map: char -> {r,c}
    const pos = {};
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        pos[mat[r][c]] = { r, c };
      }
    }
  
    return { mat, pos };
  }
  
  /* ---------- Text Preparation (digraphs) ---------- */
  function preparePlaintext(raw, padChar = 'X') {
    raw = normalizeInput(raw || '');
    const pairs = [];
    const prepared = [];
  
    let i = 0;
    while (i < raw.length) {
      const a = raw[i];
      const b = raw[i + 1];
  
      if (!b) {
        // single final -> pad
        pairs.push(a + padChar);
        prepared.push(a + padChar);
        i += 1;
      } else if (a === b) {
        // duplicate -> insert pad between
        pairs.push(a + padChar);
        prepared.push(a + padChar);
        i += 1; // only consume first char, second becomes next pair's first
      } else {
        pairs.push(a + b);
        prepared.push(a + b);
        i += 2;
      }
    }
  
    return { pairs, preparedText: prepared.join(' ') };
  }
  
  /* ---------- Core encryption / decryption for a pair ---------- */
  function encryptPair(pair, matrixObj) {
    const { mat, pos } = matrixObj;
    const a = pair[0];
    const b = pair[1];
    const p = pos[a];
    const q = pos[b];
  
    // same row
    if (p.r === q.r) {
      const ra = p.r;
      const ca = (p.c + 1) % 5;
      const cb = (q.c + 1) % 5;
      return {
        result: mat[ra][ca] + mat[ra][cb],
        rule: 'same row'
      };
    }
  
    // same column
    if (p.c === q.c) {
      const ca = p.c;
      const ra = (p.r + 1) % 5;
      const rb = (q.r + 1) % 5;
      return {
        result: mat[ra][ca] + mat[rb][ca],
        rule: 'same column'
      };
    }
  
    // rectangle rule
    return {
      result: mat[p.r][q.c] + mat[q.r][p.c],
      rule: 'rectangle'
    };
  }
  
  function decryptPair(pair, matrixObj) {
    const { mat, pos } = matrixObj;
    const a = pair[0];
    const b = pair[1];
    const p = pos[a];
    const q = pos[b];
  
    // same row -> shift left
    if (p.r === q.r) {
      const ra = p.r;
      const ca = (p.c - 1 + 5) % 5;
      const cb = (q.c - 1 + 5) % 5;
      return {
        result: mat[ra][ca] + mat[ra][cb],
        rule: 'same row'
      };
    }
  
    // same column -> shift up
    if (p.c === q.c) {
      const ca = p.c;
      const ra = (p.r - 1 + 5) % 5;
      const rb = (q.r - 1 + 5) % 5;
      return {
        result: mat[ra][ca] + mat[rb][ca],
        rule: 'same column'
      };
    }
  
    // rectangle -> swap columns
    return {
      result: mat[p.r][q.c] + mat[q.r][p.c],
      rule: 'rectangle'
    };
  }
  
  /* ---------- UI Rendering ---------- */
  function showMatrix(matrix) {
    const table = document.getElementById('matrix');
    table.innerHTML = '';
    matrix.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(ch => {
        const td = document.createElement('td');
        td.innerText = ch;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
  }
  
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
  
  function styleRowByRule(tr, rule) {
    if (!rule) return;
    if (rule.includes('row')) {
      tr.style.backgroundColor = '#e8f5e9';
    } else if (rule.includes('column')) {
      tr.style.backgroundColor = '#e3f2fd';
    } else if (rule.includes('rectangle')) {
      tr.style.backgroundColor = '#fff3e0';
    }
  }
  
  /* ---------- Flows ---------- */
  function encryptFlow() {
    const key = document.getElementById('key').value || '';
    const raw = document.getElementById('plaintext').value || '';
    const pad = (document.getElementById('pad').value || 'X').toUpperCase();
  
    // Build matrix
    const matrixObj = generateMatrix(key);
    showMatrix(matrixObj.mat);
  
    // Prepare plaintext
    const { pairs, preparedText } = preparePlaintext(raw, pad);
    document.getElementById('prepared').innerText = preparedText;
  
    // Encrypt each pair and collect steps
    const encPairs = [];
    const encSteps = [];
    for (let p of pairs) {
      const out = encryptPair(p, matrixObj);
      encPairs.push(out.result);
      encSteps.push({ pair: p, rule: out.rule, result: out.result });
    }
  
    const ciphertext = encPairs.join('');
    document.getElementById('cipher').innerText = ciphertext;
  
    // Show steps
    showSteps('enc-steps', encSteps);
  
    // Auto-fill decrypt input and auto-decrypt result
    document.getElementById('ciphertext').value = ciphertext;
    // Also clear previous plain
    document.getElementById('plain').innerText = '';
    // Optionally run decrypt to show decryption steps now
    decryptFlow(); // show decryption side-by-side
  }
  
  function decryptFlow() {
    const key = document.getElementById('key').value || '';
    const text = document.getElementById('ciphertext').value || '';
    const pad = (document.getElementById('pad').value || 'X').toUpperCase();
  
    if (!text) {
      document.getElementById('plain').innerText = '';
      document.getElementById('dec-steps').innerHTML = '';
      return;
    }
  
    const matrixObj = generateMatrix(key);
    showMatrix(matrixObj.mat);
  
    // Normalize ciphertext (should be even length)
    const normalized = normalizeInput(text);
    const pairs = [];
    for (let i = 0; i < normalized.length; i += 2) {
      const a = normalized[i];
      const b = normalized[i + 1] || pad;
      pairs.push(a + b);
    }
  
    // Decrypt each pair
    const decSteps = [];
    const outPairs = [];
    for (let p of pairs) {
      const o = decryptPair(p, matrixObj);
      decSteps.push({ pair: p, rule: o.rule, result: o.result });
      outPairs.push(o.result);
    }
  
    // Combine decrypted digraphs and attempt to remove padding characters inserted during encryption.
    // Note: cannot perfectly restore original when padding was identical letter or pad used legitimately.
    let combined = outPairs.join('');
    // Heuristic clean-up: remove pad letter between identical letters produced by splitting duplicates
    // Example: original "BALLOON" => prepared B A LX LO ON -> decrypted may contain X; remove X if it's between two identical letters.
    combined = combined.replace(new RegExp(`(${pad})(?=\\1)`, 'g'), '');
    // Also remove trailing pad if added solely to complete pair
    if (combined.endsWith(pad)) combined = combined.slice(0, -1);
  
    // Show results
    document.getElementById('plain').innerText = combined;
    showSteps('dec-steps', decSteps);
  }
  