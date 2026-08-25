# Capacity plan — target, not a measured pod count

Status: **NOT READY FOR A POD COUNT**.

The sourced workload model in [capacity-model.md](capacity-model.md) derives a design target of 1,834 burst submissions/sec and 55,020 total RPS from official published filing-volume inputs plus clearly marked assumptions. Those numbers describe the workload to test, not what this local jar can sustain.

| Question | Current answer |
|---|---|
| N pods sustain X submissions/sec | Not measured |
| p99 at that point | Not measured |
| Pods required for the modeled peak | Cannot claim before linearity and failure tests |
| Current evidence | One-process smoke: 20 journeys, 77.27 logical RPS, p99 229.21 ms, 0 correctness failures; bounded 1/2/4/8/16-process and overload runs are reported separately |

The bounded local experiments do not replace production sizing. The first production sizing experiment must use the same container image, database tier, connection pool, queue, and cache configuration that the result is intended to represent. No extrapolation from any local run is permitted.
