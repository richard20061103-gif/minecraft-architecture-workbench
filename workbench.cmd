@echo off
setlocal
cd /d "%~dp0"
set "MC_ARCH_SETUP_ROOT=%~dp0"
set "MC_ARCH_NODE_EXE="
if exist "%~dp0.workbench\installation.json" for /f "usebackq delims=" %%N in (`powershell -NoProfile -Command "(ConvertFrom-Json -InputObject ([IO.File]::ReadAllText((Join-Path $env:MC_ARCH_SETUP_ROOT '.workbench\installation.json')))).node"`) do set "MC_ARCH_NODE_EXE=%%N"
if not defined MC_ARCH_NODE_EXE for /f "delims=" %%N in ('where node 2^>nul') do if not defined MC_ARCH_NODE_EXE set "MC_ARCH_NODE_EXE=%%N"
if not exist "%MC_ARCH_NODE_EXE%" (
  echo Node runtime not found. Run install.cmd first.
  exit /b 1
)
if "%~1"=="" (
  "%MC_ARCH_NODE_EXE%" "%~dp0bin\mc-architecture.mjs" serve --project "%~dp0.workbench\demo" --open
) else (
  "%MC_ARCH_NODE_EXE%" "%~dp0bin\mc-architecture.mjs" %*
)
set "MC_ARCH_EXIT=%ERRORLEVEL%"
endlocal & exit /b %MC_ARCH_EXIT%
