# TypeScript → Java conformance vectors

`vectors.json` is generated from `lib/engine/tax.ts` by the focused Vitest exporter. It is a language-neutral contract in integer INR paise; no expected tax output is hand-entered.

From the repository root:

```powershell
npx vitest run fixtures/golden/export.test.ts
$mavenRoot = Join-Path $env:TEMP 'wapsi-maven\apache-maven-3.9.11'
$javaRoot = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
$env:JAVA_HOME = $javaRoot
$env:Path = "$mavenRoot\bin;$javaRoot\bin;$env:Path"
& "$mavenRoot\bin\mvn.cmd" -q -f backend/pom.xml test
```

The Java test loads the explicit `2026-27-new` or `2026-27-old` rule resource for each vector and checks every money output and slab slice. A passing comparison establishes behavioral conformance to the current prototype; it does not verify the law. The rule resources therefore retain `TODO(verify)` citations until primary-source review is completed.
