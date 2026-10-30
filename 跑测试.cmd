@echo off
chcp 65001 >nul
setlocal
set OUT=测试结果-%COMPUTERNAME%.txt
echo multi-note-skill v3.2.0 测试 > "%OUT%"
echo 日期: %DATE% %TIME% >> "%OUT%"
echo. >> "%OUT%"
echo === 环境 === >> "%OUT%"
node -v >> "%OUT%" 2>&1
if errorlevel 1 (
  echo 找不到 Node.js，请安装 Node 20 或更高版本 >> "%OUT%"
  type "%OUT%"
  exit /b 1
)
echo. >> "%OUT%"
echo === 1/3 selfcheck === >> "%OUT%"
node tests\selfcheck.mjs >> "%OUT%" 2>&1
set SC=%ERRORLEVEL%
echo. >> "%OUT%"
echo === 2/3 runtime + animation tests === >> "%OUT%"
node --test tests\runtime.test.mjs tests\animation.test.mjs >> "%OUT%" 2>&1
set TS=%ERRORLEVEL%
echo. >> "%OUT%"
echo === 3/3 audit === >> "%OUT%"
node cli\note.mjs audit . >> "%OUT%" 2>&1
set AU=%ERRORLEVEL%
echo. >> "%OUT%"
echo === 退出码 === >> "%OUT%"
echo selfcheck=%SC% tests=%TS% audit=%AU% >> "%OUT%"
if not "%SC%"=="0" goto fail
if not "%TS%"=="0" goto fail
if not "%AU%"=="0" goto fail
echo PASS: 105 tests / 14 selfchecks / 0 audit issues >> "%OUT%"
echo.
echo PASS
echo 结果已写入 %OUT%
type "%OUT%"
exit /b 0
:fail
echo FAIL: 看 %OUT% 里的完整输出 >> "%OUT%"
echo.
echo FAIL
echo 结果已写入 %OUT%
type "%OUT%"
exit /b 1
