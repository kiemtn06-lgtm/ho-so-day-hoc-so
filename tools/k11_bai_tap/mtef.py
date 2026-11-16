# -*- coding: utf-8 -*-
"""MTEF 5 (MathType) -> LaTeX, đủ cho công thức phổ thông."""
import struct, re, olefile
GREEK = {'ω': r'\omega ', 'φ': r'\varphi ', 'ϕ': r'\varphi ', 'π': r'\pi ', 'λ': r'\lambda ', 'Δ': r'\Delta ', 'α': r'\alpha ', 'β': r'\beta ',
         'θ': r'\theta ', 'ℓ': r'\ell ', '−': '-', '×': r'\times ', '⋅': r'\cdot ', '≈': r'\approx ', '≤': r'\le ', '≥': r'\ge ', 'μ': r'\mu ',
         'ρ': r'\rho ', 'ε': r'\varepsilon ', 'Ω': r'\Omega ', '±': r'\pm ', '∞': r'\infty ', 'γ': r'\gamma ', 'τ': r'\tau ', 'η': r'\eta '}

class P:
    def __init__(self, b): self.b = b; self.i = 0
    def u8(self): v = self.b[self.i]; self.i += 1; return v
    def u16(self): v = struct.unpack('<H', self.b[self.i:self.i+2])[0]; self.i += 2; return v
    def cstr(self):
        j = self.b.index(0, self.i); s = self.b[self.i:j]; self.i = j + 1; return s
    def nudge(self, opt):
        if opt & 0x08:
            a = self.u8(); c = self.u8()
            if a == 128 and c == 128: self.i += 4
    def nibbles(self):
        n = self.u8(); nib = []
        def get():
            if not nib:
                v = self.u8(); nib.extend([v >> 4, v & 15])
            return nib.pop(0)
        for _ in range(n):
            get()
            while get() != 0xF: pass
    def objs(self):
        out = []
        while self.i < len(self.b):
            t = self.u8()
            if t == 0: break
            r = self.rec(t)
            if r is not None: out.append(r)
        return out
    def rec(self, t):
        if t == 1:
            opt = self.u8(); self.nudge(opt)
            if opt & 0x04: self.u16()
            if opt & 0x02: self.ruler()
            if opt & 0x01: return ('line', [])
            return ('line', self.objs())
        if t == 2:
            opt = self.u8(); self.nudge(opt); tf = self.u8()
            code = 0
            if not opt & 0x20: code = self.u16()
            if opt & 0x04: self.u8()
            if opt & 0x10: self.u16()
            emb = []
            if opt & 0x01:
                while True:
                    tt = self.u8()
                    if tt == 0: break
                    if tt == 6:
                        o = self.u8(); self.nudge(o); emb.append(self.u8())
            return ('char', chr(code), tf - 128, emb)
        if t == 3:
            opt = self.u8(); self.nudge(opt); sel = self.u8(); var = self.u8()
            if var & 0x80: var = (var & 0x7F) | (self.u8() << 8)
            self.u8()
            return ('tmpl', sel, var, self.objs())
        if t == 4:
            opt = self.u8(); self.nudge(opt); self.u8(); self.u8()
            if opt & 0x02: self.ruler()
            return ('pile', self.objs())
        if t == 5:
            opt = self.u8(); self.nudge(opt); self.i += 3; r = self.u8(); c = self.u8()
            self.i += (2 * (r + 1) + 7) // 8 + (2 * (c + 1) + 7) // 8
            return ('matrix', r, c, self.objs())
        if t == 6:
            o = self.u8(); self.nudge(o); self.u8(); return None
        if t == 7: self.ruler(); return None
        if t == 8: self.i += 2; return None
        if t == 9:
            v = self.u8()
            if v == 101: self.i += 2
            elif v == 100: self.i += 3
            else: self.i += 1
            return None
        if 10 <= t <= 14: return None
        if t == 15: self.i += 1; return None
        if t == 16:
            o = self.u8(); self.i += 8 if o & 1 else 6
            if o & 4: self.cstr()
            return None
        if t == 17: self.u8(); self.cstr(); return None
        if t == 18:
            self.u8(); self.nibbles(); self.nibbles()
            n = self.u8()
            for _ in range(n):
                if self.u8(): self.u8()
            return None
        if t == 19: self.cstr(); return None
        if t >= 100:
            n = self.u16(); self.i += n; return None
        raise ValueError('tag %d @%d' % (t, self.i))
    def ruler(self):
        n = self.u8(); self.i += 3 * n

def tex(objs):
    s = ''
    for o in objs:
        k = o[0]
        if k == 'char':
            c = o[1]; x = GREEK.get(c, c)
            if c == ',' : x = '{,}'
            if o[2] == 1 and c.isalpha(): x = '§' + c      # typeface text
            for e in o[3]:
                x = {11: r'\vec{%s}', 17: r'\overline{%s}', 9: r'\hat{%s}', 2: r'\dot{%s}'}.get(e, '%s') % x
            s += x
        elif k == 'line': s += tex(o[1])
        elif k == 'pile': s += (chr(92) * 2 + ' ').join(tex([x]) for x in o[1])
        elif k == 'matrix': s += ' '.join(tex([x]) for x in o[3])
        elif k == 'tmpl':
            sel, var, sub = o[1], o[2], o[3]
            L = [tex(x[1]) for x in sub if x[0] == 'line']
            if sel == 11: s += r'\dfrac{%s}{%s}' % (L[0], L[1])
            elif sel == 10: s += (r'\sqrt[%s]{%s}' % (L[1], L[0])) if len(L) > 1 and L[1] else r'\sqrt{%s}' % L[0]
            elif sel == 27: s += '_{%s}' % L[0]
            elif sel == 28: s += '^{%s}' % (L[1] if len(L) > 1 and not L[0] else L[0] or L[-1])
            elif sel == 29: s += '_{%s}^{%s}' % (L[0], L[1])
            elif sel in (0, 1, 2, 3, 4, 5):
                a, b = {0: (r'\langle ', r'\rangle '), 1: ('(', ')'), 2: (r'\{', r'\}'), 3: ('[', ']'), 4: ('|', '|'), 5: (r'\|', r'\|')}[sel]
                s += r'\left%s%s\right%s' % (a, L[0], b)
            elif sel == 13: s += r'\overline{%s}' % L[0]
            elif sel == 12: s += r'\underline{%s}' % L[0]
            else: s += '⟨T%d.%d:%s⟩' % (sel, var, '|'.join(L))
    return s

def clean(s):
    s = re.sub(r'(?<![a-z§' + chr(92)*2 + r'])(cos|sin|tan|cot|max|min|log|ln)(?![a-zA-Z])', lambda m: chr(92) + m.group(1) + ' ', s)
    s = re.sub(r'((?:§.)+)', lambda m: chr(92) + 'text{%s}' % m.group(1).replace('§', ''), s)
    s = s.replace(chr(92) + 'max }', chr(92) + 'max}')
    return re.sub(r' +', ' ', s).strip()


def convert(path):
    f = olefile.OleFileIO(path); d = f.openstream('Equation Native').read(); f.close()
    b = d[struct.unpack('<H', d[:2])[0]:]
    p = P(b); p.i = 5; p.cstr(); p.u8()
    return clean(tex(p.objs()))

