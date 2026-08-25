param(
  [int]$RequestsPerBackend = 32,
  [int]$ConcurrencyPerBackend = 4,
  [int]$BasePort = 8300
)

$repoRoot = (Get-Location).Path
$mavenRoot = Join-Path $env:TEMP 'wapsi-maven\apache-maven-3.9.11'
$javaRoot = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
$maven = Join-Path $mavenRoot 'bin\mvn.cmd'
$java = Join-Path $javaRoot 'bin\java.exe'

if (-not (Test-Path $maven) -or -not (Test-Path $java)) {
  throw 'The documented local Java 21/Maven distribution is missing.'
}

$env:JAVA_HOME = $javaRoot
$env:Path = "$mavenRoot\bin;$javaRoot\bin;$env:Path"
& $maven -q -f (Join-Path $repoRoot 'backend\pom.xml') -DskipTests package
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$jar = Get-ChildItem (Join-Path $repoRoot 'backend\target') -Filter '*.jar' |
  Where-Object { $_.Name -notmatch 'original' } |
  Select-Object -First 1
if ($null -eq $jar) { throw 'Spring Boot jar was not produced.' }

$counts = @(1, 2, 4, 8, 16)
$results = @()

foreach ($count in $counts) {
  $servers = @()
  $ports = @()
  try {
    for ($index = 0; $index -lt $count; $index++) {
      $port = $BasePort + $index
      $ports += $port
      $stdout = Join-Path $env:TEMP "wapsi-linearity-$PID-$port.out.log"
      $stderr = Join-Path $env:TEMP "wapsi-linearity-$PID-$port.err.log"
      $jarArgument = '"' + $jar.FullName + '"'
      $server = Start-Process -FilePath $java -ArgumentList @('-Xms16m', '-Xmx128m', '-XX:ActiveProcessorCount=2', '-jar', $jarArgument, "--server.port=$port") -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
      $servers += $server
    }

    foreach ($port in $ports) {
      $ready = $false
      for ($attempt = 0; $attempt -lt 45; $attempt++) {
        if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
          $ready = $true
          break
        }
        Start-Sleep -Milliseconds 250
      }
      if (-not $ready) { throw "Spring Boot did not listen on port $port." }
    }

    $urls = ($ports | ForEach-Object { "http://127.0.0.1:$_" }) -join ','
    $requests = $RequestsPerBackend * $count
    $concurrency = $ConcurrencyPerBackend * $count
    $output = & node (Join-Path $repoRoot 'loadtest\run.mjs') --base-urls $urls --requests $requests --concurrency $concurrency --seed "linearity-$count"
    if ($LASTEXITCODE -ne 0) { throw "Linearity run failed for $count backend processes." }
    $report = ($output -join [Environment]::NewLine) | ConvertFrom-Json
    $results += [PSCustomObject]@{
      backendCount = $count
      requestsPerBackend = $RequestsPerBackend
      concurrencyPerBackend = $ConcurrencyPerBackend
      ports = $ports
      report = $report
    }
    Write-Output (($results[-1] | ConvertTo-Json -Depth 8))
  } finally {
    foreach ($server in $servers) {
      if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
    }
  }
}

Write-Output (($results | ConvertTo-Json -Depth 8))
