@echo off
setlocal
if not exist out mkdir out
node cli\note.mjs render examples\quickstart.json out\quickstart.html examples\quickstart.state.json || goto :err
node cli\note.mjs audit out || goto :err
node cli\note.mjs lint examples\quickstart.json out\quickstart.html || goto :err
echo.
echo OK: out\quickstart.html
exit /b 0
:err
echo.
echo FAILED: check Node version and error above
exit /b 1
