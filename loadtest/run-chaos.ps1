param(
  [int]$Requests = 1000,
  [int]$Concurrency = 64,
  [int]$FirstPort = 8500
)

$repoRoot = (Get-Location).Path
$mavenRoot = Join-Path $env:TEMP 'wapsi-maven\apache-maven-3.9.11'
$javaRoot = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
$maven = Join-Path $mavenRoot 'bin\mvn.cmd'
$java = Join-Path $javaRoot 'bin\java.exe'
if (-not (Test-Path $maven) -or -not (Test-Path $java)) { throw 'The documented local Java 21/Maven distribution is missing.' }
$env:JAVA_HOME = $javaRoot
$env:Path = "$mavenRoot\bin;$javaRoot\bin;$env:Path"
& $maven -q -f (Join-Path $repoRoot 'backend\pom.xml') -DskipTests package
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$jar = Get-ChildItem (Join-Path $repoRoot 'backend\target') -Filter '*.jar' | Where-Object { $_.Name -notmatch 'original' } | Select-Object -First 1
if ($null -eq $jar) { throw 'Spring Boot jar was not produced.' }

$servers = @()
$ports = @($FirstPort, ($FirstPort + 1))
$jarArgument = '"' + $jar.FullName + '"'
try {
  foreach ($port in $ports) {
    $stdout = Join-Path $env:TEMP "wapsi-chaos-$PID-$port.out.log"
    $stderr = Join-Path $env:TEMP "wapsi-chaos-$PID-$port.err.log"
    $servers += Start-Process -FilePath $java -ArgumentList @('-Xms16m', '-Xmx128m', '-XX:ActiveProcessorCount=2', '-jar', $jarArgument, "--server.port=$port") -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  }
  foreach ($port in $ports) {
    $ready = $false
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
      if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { $ready = $true; break }
      Start-Sleep -Milliseconds 250
    }
    if (-not $ready) { throw "Spring Boot did not listen on port $port." }
  }

  $urls = ($ports | ForEach-Object { "http://127.0.0.1:$_" }) -join ','
  $chaosOut = Join-Path $env:TEMP "wapsi-chaos-$PID-run.json"
  $chaosErr = Join-Path $env:TEMP "wapsi-chaos-$PID-run.err.log"
  $chaosScriptArgument = '"' + (Join-Path $repoRoot 'loadtest\chaos.mjs') + '"'
  $chaos = Start-Process -FilePath 'node' -ArgumentList @($chaosScriptArgument, '--base-urls', $urls, '--requests', $Requests, '--concurrency', $Concurrency) -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $chaosOut -RedirectStandardError $chaosErr
  Start-Sleep -Milliseconds 500
  Stop-Process -Id $servers[1].Id -Force
  $servers = @($servers[0])
  $chaos | Wait-Process
  $chaosOutput = Get-Content -Raw $chaosOut
  if ([string]::IsNullOrWhiteSpace($chaosOutput)) {
    $chaosError = Get-Content -Raw $chaosErr -ErrorAction SilentlyContinue
    throw "Chaos child produced no report. $chaosError"
  }
  $firstRun = $chaosOutput | ConvertFrom-Json

  $port = $ports[1]
  $restartOut = Join-Path $env:TEMP "wapsi-chaos-$PID-restart.out.log"
  $restartErr = Join-Path $env:TEMP "wapsi-chaos-$PID-restart.err.log"
  $restarted = Start-Process -FilePath $java -ArgumentList @('-Xms16m', '-Xmx128m', '-XX:ActiveProcessorCount=2', '-jar', $jarArgument, "--server.port=$port") -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $restartOut -RedirectStandardError $restartErr
  $servers += $restarted
  $ready = $false
  for ($attempt = 0; $attempt -lt 45; $attempt++) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { $ready = $true; break }
    Start-Sleep -Milliseconds 250
  }
  if (-not $ready) { throw "Restarted Spring Boot did not listen on port $port." }
  $recoveryOutput = & node (Join-Path $repoRoot 'loadtest\run.mjs') --base-url "http://127.0.0.1:$port" --requests 100 --concurrency 16 --seed 'chaos-recovery'
  if ($LASTEXITCODE -ne 0) { throw 'Recovery run failed after process restart.' }
  $recovery = ($recoveryOutput -join [Environment]::NewLine) | ConvertFrom-Json
  [PSCustomObject]@{
    syntheticOnly = $true
    killedPort = $ports[1]
    firstRun = $firstRun
    recoveryRun = $recovery
    interpretation = 'Expected in-memory receipt loss on the killed process; restart accepts new work, but this is not durable recovery.'
  } | ConvertTo-Json -Depth 8
} finally {
  foreach ($server in $servers) {
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
  }
}
