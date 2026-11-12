#!/bin/sh
# Dựng lại toàn bộ bài giảng tương tác khối 10 vào hồ sơ. Chạy trong Git Bash: sh tools/dung_k10.sh
S="C:/Users/kieml/OneDrive/Fujitsu/Tài liệu 10/04_Chương III - Động lực học"
cd "$(dirname "$0")/.." || exit 1
node tools/build_bai_giang_roi.js "$S/chuyen-dong-nem-ngang.html" "bai-giang/k10-B12.html" B12 || exit 1
node tools/build_bai_giang_roi.js "$S/bai-13-tong-hop-phan-tich-luc.html" "bai-giang/k10-B13.html" B13 || exit 1
node tools/build_bai_giang_roi.js "$S/bai-14-dinh-luat-1-newton.html" "bai-giang/k10-B14.html" B14 || exit 1
node tools/build_bai_giang_roi.js "$S/bai-15-dinh-luat-2-newton.html" "bai-giang/k10-B15.html" B15 || exit 1
