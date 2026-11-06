@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "MC_ARCH_SETUP_ROOT=%~dp0"
set "MC_ARCH_NODE_CACHE=%LOCALAPPDATA%\MinecraftArchitectureWorkbench\node"
if /I "%~1"=="--portable-node" goto bootstrap
where node >nul 2>nul
if errorlevel 1 goto bootstrap
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=16)?0:1)"
if errorlevel 1 goto bootstrap
node "%~dp0bin\mc-architecture.mjs" setup --interactive
goto done
:bootstrap
echo Node.js 22.16+ is required. A verified official LTS portable runtime can be installed for this user only.
choice /C YN /N /M "Download Node.js to your local app-data folder? [Y/N] "
if errorlevel 2 goto done
powershell -NoProfile -Command "$ErrorActionPreference='Stop'; if($env:PROCESSOR_ARCHITECTURE -eq 'ARM64'){$arch='arm64'}elseif($env:PROCESSOR_ARCHITECTURE -eq 'AMD64'){$arch='x64'}else{throw 'Only Windows x64/ARM64 is supported'}; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $v=Invoke-RestMethod 'https://nodejs.org/dist/index.json'; $release=$v | Where-Object { $_.lts -and ([version]$_.version.TrimStart('v') -ge [version]'22.16.0') } | Select-Object -First 1; if(!$release){throw 'No supported LTS found'}; $name='node-'+$release.version+'-win-'+$arch; $base='https://nodejs.org/dist/'+$release.version+'/'; $cache=$env:MC_ARCH_NODE_CACHE; New-Item -ItemType Directory -Force -Path $cache | Out-Null; $zip=Join-Path $cache ($name+'.zip'); $sum=Invoke-WebRequest -UseBasicParsing ($base+'SHASUMS256.txt'); $line=($sum.Content -split [char]10 | Where-Object { $_.Trim().EndsWith(' '+$name+'.zip') }); if(@($line).Count -ne 1){throw 'Checksum entry missing or ambiguous'}; $expected=($line.Trim() -split '\s+')[0]; if(!(Test-Path -LiteralPath $zip) -or (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLower() -ne $expected.ToLower()){Invoke-WebRequest -UseBasicParsing ($base+$name+'.zip') -OutFile $zip;} if((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLower() -ne $expected.ToLower()){throw 'Node download checksum mismatch'}; $dest=Join-Path $cache $name; if(!(Test-Path -LiteralPath $dest)){Expand-Archive -LiteralPath $zip -DestinationPath $cache;} else {Add-Type -AssemblyName System.IO.Compression.FileSystem; $archive=[IO.Compression.ZipFile]::OpenRead($zip); try {foreach($entry in $archive.Entries){if(!$entry.Name){continue}; $target=Join-Path $cache $entry.FullName; if(!(Test-Path -LiteralPath $target)){Expand-Archive -LiteralPath $zip -DestinationPath $cache -Force; break}; $stream=$entry.Open(); try {$hash=[Security.Cryptography.SHA256]::Create(); $bytes=$hash.ComputeHash($stream); $entryHash=([BitConverter]::ToString($bytes)).Replace('-','');} finally {$stream.Dispose(); $hash.Dispose()}; if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $entryHash){Expand-Archive -LiteralPath $zip -DestinationPath $cache -Force; break}}} finally {$archive.Dispose()}}; $exe=Join-Path $dest 'node.exe'; if(!(Test-Path -LiteralPath $exe)){throw 'Runtime extraction failed'}; & $exe (Join-Path $env:MC_ARCH_SETUP_ROOT 'bin\mc-architecture.mjs') setup --interactive; exit $LASTEXITCODE"
:done
set "MC_ARCH_EXIT=%ERRORLEVEL%"
echo.
echo You can close this window. Keep the extracted project folder for workbench commands.
pause
endlocal & exit /b %MC_ARCH_EXIT%
