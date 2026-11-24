# -*- coding: utf-8 -*-
"""Gõ lại tay công thức bị mất khi xuất tệp Word 11A5 (dòng báo lỗi 'Mathml can't be rendered'), và vài chỗ lỗi dựng của tệp.
Mỗi mục: số câu -> {'than': [...] (thay cả thân câu), 'lc': {chữ cái: nội dung}, 'ghi_chu': '...'}.  Đáp án (dấu * trong tệp Word) giữ nguyên.
Công thức viết LaTeX trong $...$ (phòng và Word đều dựng thành Equation)."""
F = lambda a, b: r'$\dfrac{%s}{%s}$' % (a, b)
X0 = r'x = Acos(ωt + $\varphi_{0}$)'
SUA = {
 4: {'lc': {'A': r'$T=\dfrac{2\pi}{f}$.', 'B': r'$T=\dfrac{1}{f}$.', 'C': r'$T=2\pi f$.', 'D': '$T=f$.'}},
 10: {'lc': {'A': r'$\Delta\varphi=\dfrac{\pi\Delta t}{T}$.', 'B': r'$\Delta\varphi=\dfrac{2\pi T}{\Delta t}$.', 'C': r'$\Delta\varphi=\dfrac{\Delta t}{2\pi T}$.', 'D': r'$\Delta\varphi=\dfrac{2\pi\Delta t}{T}$.'}},
 11: 10,
 19: {'lc': {'A': r'$a=\omega^{2}A\cos \left(\omega t+\varphi_{0}+\pi \right)$.', 'B': r'$a=\omega A\cos \left(\omega t+\varphi_{0}+\pi \right)$.',
             'C': r'$a=\omega^{2}A\cos \left(\omega t+\varphi_{0}+\dfrac{\pi}{2}\right)$.', 'D': r'$a=\omega A\cos \left(\omega t+\varphi_{0}\right)$.'}},
 33: {'lc': {'B': r'trễ pha $\dfrac{\pi}{2}$ so với gia tốc', 'D': r'trễ pha $\dfrac{\pi}{2}$ so với li độ.'}},
 35: {'lc': {'C': r'sớm pha $\dfrac{\pi}{2}$ so với vận tốc'},
      'ghi_chu': 'Tệp gốc ghi "sớm [công thức] với vận tốc" (thiếu chữ "pha", "so"); đã viết đủ.'},
 38: {'than_sub': ('⟦CT⟧', r'$x=A\cos \left(\omega t+\varphi_{0}\right)$')},
 39: {'than_sub': ('⟦CT⟧', r'$x=A\cos \left(\omega t+\varphi_{0}\right)$'),
      'lc': {'A': r'$\omega$.', 'B': r'$\varphi_{0}$.', 'C': r'$\omega t+\varphi_{0}$.', 'D': '$A$.'}},
 79: {'lc': {'B': r'$\lambda=\dfrac{v}{f}$.', 'D': r'$\lambda=\dfrac{f}{v}$.'}},
 82: {'lc': {'A': r'$v=s\,\Delta t$.', 'B': r'$v=\dfrac{\Delta t}{s}$.', 'C': r'$v=\dfrac{2s}{\Delta t}$.', 'D': r'$v=\dfrac{s}{\Delta t}$.'}},
 96: 79,
 124: {'lc': {'A': r'$\dfrac{\lambda}{4}$.', 'B': r'$\dfrac{\lambda}{2}$.', 'C': r'$2\lambda$.'}},
 125: {'lc': {'A': r'$\dfrac{\lambda}{2}$.', 'B': r'$\dfrac{\lambda}{4}$.', 'D': r'$2\lambda$.'}},
 128: {'lc_sub': ('⟦CT⟧', r'$\dfrac{1}{2}$')},
 132: {'lc': {'A': r'$x=\dfrac{k\lambda a}{D}$.', 'B': r'$x=\dfrac{kaD}{\lambda}$.', 'C': r'$x=\dfrac{k\lambda D}{a}$.', 'D': r'$x=\left(k+\dfrac{1}{2}\right)\dfrac{\lambda D}{a}$.'}},
 133: {'lc': {'A': r'$x=\dfrac{k\lambda D}{a}$.', 'B': r'$x=\dfrac{k\lambda a}{D}$.', 'C': r'$x=\left(k+1\right)\dfrac{\lambda D}{a}$.', 'D': r'$x=\left(k+\dfrac{1}{2}\right)\dfrac{\lambda D}{a}$.'}},
 140: {'lc_sub': ('⟦CT⟧', r'$\dfrac{\pi}{2}$')},
 141: 140,
 142: 128,
 152: {'lc': {'C': r'$\dfrac{\lambda}{2}$.', 'D': r'$\dfrac{\lambda}{4}$.'}},
 153: {'lc': {'A': r'$\dfrac{5\lambda}{2}$.', 'D': r'$\dfrac{3\lambda}{2}$.'}},
 154: {'lc': {'A': r'$\lambda$.', 'D': r'$\dfrac{3\lambda}{2}$.'}},
 155: {'lc': {'A': r'$\dfrac{3\lambda}{2}$.', 'D': r'$\dfrac{5\lambda}{2}$.'}},
 161: {'than_sub': ('⟦CT⟧', r'$\ell$'),
       'lc': {'A': r'$\ell=m\dfrac{\lambda}{2}$ (với m = 1,3,5,...)', 'B': r'$\ell=m\dfrac{\lambda}{4}$ (với m = 1,2,3,...)',
              'C': r'$\ell=m\dfrac{\lambda}{4}$ (với m = 1,3,5,...)', 'D': r'$\ell=m\dfrac{\lambda}{2}$ (với m = 1,2,3,...)'}},
 162: {'than_sub': ('⟦CT⟧', r'$\ell$'),
       'lc': {'A': r'$\ell=m\dfrac{\lambda}{2}$ (với m = 1,2,3,...)', 'B': r'$\ell=m\dfrac{\lambda}{4}$ (với m = 1,2,3,...)',
              'C': r'$\ell=(2m+1)\dfrac{\lambda}{4}$ (với m = 1,2,3,...)', 'D': r'$\ell=(2m+1)\dfrac{\lambda}{2}$ (với m = 1,2,3,...)'}},
 164: {'lc': {'A': r'$d=\left(k+\dfrac{1}{2}\right)\dfrac{\lambda}{2}$. ( k = 0,1,2…)', 'B': r'$d=k\dfrac{\lambda}{2}$. ( k = 0,1,2…)',
              'C': r'$d=\left(k+1\right)\dfrac{\lambda}{4}$. ( k = 0,1,2…)', 'D': r'$d=\left(k+\dfrac{1}{2}\right)\lambda$. ( k = 0,1,2…)'}},
 189: {'lc': {'C': r'$\dfrac{P}{2\pi R^{2}}$.', 'D': r'$\dfrac{4\pi R^{2}}{P}$.'}},
 195: {'lc': {'A': r'$l_{2}$ - $l_{1}$ = $\dfrac{\lambda}{2}$.', 'B': r'$l_{2}$ - $l_{1}$ = $\dfrac{\lambda}{4}$.',
              'C': r'$l_{2}$ - $l_{1}$ = $\dfrac{3\lambda}{4}$.', 'D': r'$l_{2}$ - $l_{1}$ = $2\lambda$.'}},
 196: 195,
 64: {'lc_sub': ('phần tử phần tử', 'phần tử'), 'ghi_chu': 'Tệp gốc lặp chữ "phần tử phần tử"; đã bỏ chữ thừa.'},
 198: {'than_sub': ('----HẾT---', '')},
 # lỗi dựng của tệp
 90: {'lc': {'A': 'lỏng, khí.', 'B': 'rắn, lỏng, khí.', 'C': 'rắn, lỏng và chân không.', 'D': 'rắn, khí và chân không.'},
      'ghi_chu': 'Tệp gốc ghi hai phương án đều là "C." (phương án cuối đáng lẽ là D); đã đánh lại D.'},
}
# câu KHÔNG đưa vào phòng vì mất cả dữ kiện của đề (không suy ra được từ nội dung còn lại), cần bản Word gốc
BO = {83: 'mất phương trình nguồn u_O, vị trí x của M và cả 4 phương án', 144: 'mất phương trình sóng tại A và cả 4 phương án (biên độ tổng hợp)'}
