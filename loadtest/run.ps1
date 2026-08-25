param(
  [int]$Requests = 100,
  [int]$Concurrency = 8
)

$repoRoot = (Get-Location).Path
$mavenRoot = Join-Path $env:TEMP 'wapsi-maven\apache-maven-3.9.11'
$javaRoot = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
$maven = Join-Path $mavenRoot 'bin\mvn.cmd'
$java = Join-Path $javaRoot 'bin\java.exe'

if (-not (Test-Path $maven) -or -not (Test-Path $java)) {
  throw 'The documented local Java 21/Maven distribution is missing. See fixtures/golden/README.md.'
}

$env:JAVA_HOME = $javaRoot
$env:Path = "$mavenRoot\bin;$javaRoot\bin;$env:Path"
& $maven -q -f (Join-Path $repoRoot 'backend\pom.xml') -DskipTests package
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$jar = Get-ChildItem (Join-Path $repoRoot 'backend\target') -Filter '*.jar' |
  Where-Object { $_.Name -notmatch 'original' } |
  Select-Object -First 1
if ($null -eq $jar) { throw 'Spring Boot jar was not produced.' }

$stdout = Join-Path $env:TEMP "wapsi-loadtest-$PID.out.log"
$stderr = Join-Path $env:TEMP "wapsi-loadtest-$PID.err.log"
$jarArgument = '"' + $jar.FullName + '"'
$server = Start-Process -FilePath $java -ArgumentList @('-jar', $jarArgument) -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr

try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) {
      $ready = $true
      break
    }
    Start-Sleep -Seconds 1
  }
  if (-not $ready) {
    Get-Content $stderr -ErrorAction SilentlyContinue
    throw 'Spring Boot did not listen on port 8080.'
  }
  & node (Join-Path $repoRoot 'loadtest\run.mjs') --requests $Requests --concurrency $Concurrency
  $exitCode = $LASTEXITCODE
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
  Write-Host "Backend logs: $stdout and $stderr"
}
exit $exitCode
