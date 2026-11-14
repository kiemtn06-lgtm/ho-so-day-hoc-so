# Chia các đơn vị câu (từ tach_cau.py) thành các buổi: mỗi buổi tối đa 18 TN, 4 Đ/S, 6 TLN (cụm chùm = 2 câu, luôn nằm cùng buổi).
# Dùng hết 523 câu: số buổi của mỗi bài = max(ceil(TN/18), ceil(ĐS/4), ceil(TLN/6)); câu được rải đều theo mức độ.
import math
from tach_cau import tach, mucdo
CAP = {'I': 18, 'II': 4, 'III': 6}
ORD = {'NB': 0, 'TH': 1, 'VD': 2, 'VDC': 3}
TEN_BAI = {8: 'Mô hình động học phân tử chất khí', 9: 'Định luật Boyle', 10: 'Định luật Charles',
           11: 'Phương trình trạng thái của khí lí tưởng (gồm quá trình đẳng tích)',
           12: 'Áp suất khí theo mô hình động học phân tử. Quan hệ giữa động năng phân tử và nhiệt độ'}
def ncau(u): return len(u['cau'])
def chia(units):
    buoi = []   # [{'bai':8,'I':[...],'II':[...],'III':[...]}]
    for b in sorted({u['bai'] for u in units}):
        by = {p: [u for u in units if u['bai'] == b and u['part'] == p] for p in CAP}
        n = max(math.ceil(sum(ncau(u) for u in by[p]) / CAP[p]) for p in CAP)
        bs = [{'bai': b, 'I': [], 'II': [], 'III': []} for _ in range(n)]
        for p in CAP:
            # xếp theo mức độ rồi mã, chia lần lượt cho buổi đang ít câu nhất (hòa thì buổi đứng trước) => mỗi buổi có đủ các mức độ
            lst = sorted(by[p], key=lambda u: (ORD[mucdo(u['codes'][0])], -ncau(u), u['idx']))
            for u in lst:
                load = lambda j: sum(ncau(x) for x in bs[j][p])
                ok = [j for j in range(n) if load(j) + ncau(u) <= CAP[p]] or list(range(n))
                k = min(ok, key=lambda j: (load(j), j))
                bs[k][p].append(u)
            for a in range(n):   # dồn lại nếu có buổi vượt: chuyển câu đơn sang buổi còn chỗ
                while sum(ncau(x) for x in bs[a][p]) > CAP[p]:
                    free = [j for j in range(n) if sum(ncau(x) for x in bs[j][p]) + 1 <= CAP[p]]
                    single = [u for u in bs[a][p] if ncau(u) == 1]
                    if not free or not single: break
                    u = single[-1]; bs[a][p].remove(u); bs[min(free, key=lambda j: sum(ncau(x) for x in bs[j][p]))][p].append(u)
            for x in bs: x[p].sort(key=lambda u: (ORD[mucdo(u['codes'][0])], u['idx']))
        buoi += bs
    for i, x in enumerate(buoi, 1): x['so'] = i
    return buoi
if __name__ == '__main__':
    import sys
    d, units = tach(sys.argv[1]); bs = chia(units)
    print('số buổi:', len(bs), '| tổng câu:', sum(ncau(u) for x in bs for p in CAP for u in x[p]))
    over = 0
    for x in bs:
        c = {p: sum(ncau(u) for u in x[p]) for p in CAP}
        flag = any(c[p] > CAP[p] for p in CAP); over += flag
        lv = {p: ''.join(sorted(set(mucdo(u['codes'][0]) for u in x[p]))) for p in CAP}
        print(f"Buổi {x['so']:>2} B{x['bai']:<2} TN {c['I']:>2} ĐS {c['II']} TLN {c['III']}{'  <-- VƯỢT' if flag else ''}   mức độ TN {lv['I']} / ĐS {lv['II']} / TLN {lv['III']}")
    print('buổi vượt mức tối đa:', over)
