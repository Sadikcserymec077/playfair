import string

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

def generate_key_matrix(keyword, pad_letter='X'):
    keyword = (keyword or '').upper().replace('J', 'I')
    used = []
    for ch in keyword:
        if ch in ALPHABET and ch not in used and ch != 'J':
            used.append(ch)
    for ch in ALPHABET:
        if ch not in used and ch != 'J':
            used.append(ch)
    return [used[i:i+5] for i in range(0, 25, 5)]

def find_position(matrix, letter):
    for i in range(5):
        for j in range(5):
            if matrix[i][j] == letter:
                return i, j
    return None

def prepare_text_with_steps(text, pad_letter='X'):
    if text is None:
        text = ''
    text = ''.join([c for c in text.upper() if c.isalpha()])
    text = text.replace('J', 'I')

    result = ''
    steps = []
    i = 0
    while i < len(text):
        a = text[i]
        b = text[i+1] if i+1 < len(text) else None
        if b is None:
            result += a + pad_letter
            steps.append({'pair': a + pad_letter, 'reason': 'last char padded'})
            i += 1
        elif a == b:
            result += a + pad_letter
            steps.append({'pair': a + pad_letter, 'reason': 'repeated letter'})
            i += 1
        else:
            result += a + b
            steps.append({'pair': a + b, 'reason': 'normal pair'})
            i += 2

    if len(result) % 2 != 0:
        result += pad_letter
        steps.append({'pair': result[-2:], 'reason': 'final padding'})
    return result, steps

def encrypt_pairs(prepared_text, matrix):
    cipher = ''
    steps = []
    for i in range(0, len(prepared_text), 2):
        a, b = prepared_text[i], prepared_text[i+1]
        r1, c1 = find_position(matrix, a)
        r2, c2 = find_position(matrix, b)

        if r1 == r2:
            ca = matrix[r1][(c1 + 1) % 5]
            cb = matrix[r2][(c2 + 1) % 5]
            rule = 'same row → shift right'
        elif c1 == c2:
            ca = matrix[(r1 + 1) % 5][c1]
            cb = matrix[(r2 + 1) % 5][c2]
            rule = 'same column → shift down'
        else:
            ca = matrix[r1][c2]
            cb = matrix[r2][c1]
            rule = 'rectangle → swap columns'

        cipher += ca + cb
        steps.append({'pair': a + b, 'rule': rule, 'result': ca + cb})
    return cipher, steps

def decrypt_pairs(cipher_text, matrix):
    plain = ''
    steps = []
    for i in range(0, len(cipher_text), 2):
        a, b = cipher_text[i], cipher_text[i+1]
        r1, c1 = find_position(matrix, a)
        r2, c2 = find_position(matrix, b)

        if r1 == r2:
            pa = matrix[r1][(c1 - 1) % 5]
            pb = matrix[r2][(c2 - 1) % 5]
            rule = 'same row → shift left'
        elif c1 == c2:
            pa = matrix[(r1 - 1) % 5][c1]
            pb = matrix[(r2 - 1) % 5][c2]
            rule = 'same column → shift up'
        else:
            pa = matrix[r1][c2]
            pb = matrix[r2][c1]
            rule = 'rectangle → swap columns'

        plain += pa + pb
        steps.append({'pair': a + b, 'rule': rule, 'result': pa + pb})
    return plain, steps
