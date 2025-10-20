from flask import Flask, render_template, request, jsonify
from playfair_logic import generate_key_matrix, prepare_text_with_steps, encrypt_pairs, decrypt_pairs

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

# Encrypt endpoint - input is treated as plaintext
@app.route('/encrypt', methods=['POST'])
def encrypt_text():
    key = request.form.get('key', '')
    text = request.form.get('text', '')         # plaintext
    pad = request.form.get('pad', 'X')

    matrix = generate_key_matrix(key, pad_letter=pad)
    prepared, prep_steps = prepare_text_with_steps(text, pad_letter=pad)
    cipher, enc_steps = encrypt_pairs(prepared, matrix)
    # Also decrypt the produced cipher so user can immediately verify round-trip
    decrypted, dec_steps = decrypt_pairs(cipher, matrix)

    return jsonify({
        'matrix': matrix,
        'mode': 'encrypt',
        'input': text,
        'prepared': prepared,
        'cipher': cipher,
        'decrypted': decrypted,
        'enc_steps': enc_steps,
        'dec_steps': dec_steps
    })

# Decrypt endpoint - input is treated as ciphertext
@app.route('/decrypt', methods=['POST'])
def decrypt_text():
    key = request.form.get('key', '')
    text = request.form.get('text', '')         # ciphertext
    pad = request.form.get('pad', 'X')

    matrix = generate_key_matrix(key, pad_letter=pad)
    # decrypt input (assume input is only letters and even length)
    decrypted, dec_steps = decrypt_pairs(text, matrix)
    # re-encrypt the decrypted text (after preparing it) to show the corresponding cipher and encryption steps
    prepared, prep_steps = prepare_text_with_steps(decrypted, pad_letter=pad)
    re_cipher, enc_steps = encrypt_pairs(prepared, matrix)

    return jsonify({
        'matrix': matrix,
        'mode': 'decrypt',
        'input': text,
        'prepared': prepared,
        'cipher': re_cipher,
        'decrypted': decrypted,
        'enc_steps': enc_steps,
        'dec_steps': dec_steps
    })

if __name__ == '__main__':
    app.run(debug=True)
