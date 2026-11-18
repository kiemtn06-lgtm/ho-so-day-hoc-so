#!/bin/sh
# Chạy tự động đầu mỗi phiên Claude Code (.claude/settings.json, hook SessionStart):
# kéo các bản sửa Claude đã đẩy từ GitHub (phiếu sửa) về máy, rồi liệt kê bản sửa chưa áp vào nguồn trên máy.
cd "$(dirname "$0")/.." || exit 0
GH="/c/Program Files/GitHub CLI/gh.exe"
echo "== Kéo bản sửa từ GitHub =="
if [ -x "$GH" ]; then
  git -c credential.helper= -c "credential.helper=!'$GH' auth git-credential" pull --ff-only origin main 2>&1 | tail -4
else
  git pull --ff-only origin main 2>&1 | tail -4
fi
[ $? -ne 0 ] && echo "(Không kéo được: có thể máy đang có thay đổi chưa commit trùng tệp, hoặc mất mạng. Báo giáo viên.)"
CHUA=$(grep -E '^\| 20[0-9-]+ \|.*\| chưa \|' SUA_TREN_MANG.md 2>/dev/null)
if [ -n "$CHUA" ]; then
  echo "== BẢN SỬA TRÊN MẠNG CHƯA ÁP VÀO NGUỒN TRÊN MÁY (xem CLAUDE.md, mục 'Làm việc trên máy giáo viên') =="
  echo "$CHUA"
else
  echo "Không có bản sửa nào chờ áp vào nguồn trên máy."
fi
