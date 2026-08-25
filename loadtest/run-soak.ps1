param(
  [int]$DurationSeconds = 60,
  [int]$BatchRequests = 100,
  [int]$Concurrency = 16,
  [int]$Port = 8600
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

$stdout = Join-Path $env:TEMP "wapsi-soak-$PID.out.log"
$stderr = Join-Path $env:TEMP "wapsi-soak-$PID.err.log"
$jarArgument = '"' + $jar.FullName + '"'
$server = Start-Process -FilePath $java -ArgumentList @('-Xms16m', '-Xmx256m', '-XX:ActiveProcessorCount=4', '-jar', $jarArgument, "--server.port=$Port") -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr

try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 45; $attempt++) {
    if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { $ready = $true; break }
    Start-Sleep -Milliseconds 250
  }
  if (-not $ready) { throw "Spring Boot did not listen on port $Port." }

  $startedAt = Get-Date
  $deadline = $startedAt.AddSeconds($DurationSeconds)
  $reports = @()
  $batch = 0
  while ((Get-Date) -lt $deadline) {
    $output = & node (Join-Path $repoRoot 'loadtest\run.mjs') --base-url "http://127.0.0.1:$Port" --requests $BatchRequests --concurrency $Concurrency --seed "soak-$PID-$batch"
    if ($LASTEXITCODE -ne 0) { throw "Soak batch $batch failed." }
    $reports += (($output -join [Environment]::NewLine) | ConvertFrom-Json)
    $batch++
  }

  $successful = ($reports | Measure-Object -Property successfulJourneys -Sum).Sum
  $failed = ($reports | Measure-Object -Property failedJourneys -Sum).Sum
  $correctness = ($reports | Measure-Object -Property correctnessFailures -Sum).Sum
  [PSCustomObject]@{
    syntheticOnly = $true
    requestedDurationSeconds = $DurationSeconds
    elapsedSeconds = [math]::Round(((Get-Date) - $startedAt).TotalSeconds, 2)
    batches = $reports.Count
    totalJourneys = $successful + $failed
    successfulJourneys = $successful
    failedJourneys = $failed
    correctnessFailures = $correctness
    batchReports = $reports
  } | ConvertTo-Json -Depth 8
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
  Write-Host "Backend logs: $stdout and $stderr"
}
