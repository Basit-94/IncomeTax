# Video — resume here

Last touched 22 Aug 2026, mid-session, laptop closed. Read this first.

## Environment gotchas (both cost time to find)

1. **hyperframes needs Node >= 22.** The default shell is Node v20.20.2, which makes
   every `hyperframes` command fail with "requires Node.js >= 22". nvm4w has 24.14.1
   installed and `nvm use 24.14.1` has already been run, so the
   `C:\nvm4w\nodejs` symlink points at v24.14.1. If a command still can't find
   `node`, prepend the real directory:

   ```bash
   export PATH="/c/Users/abdul/AppData/Local/nvm/v24.14.1:$PATH"
   ```

2. **ffmpeg is installed but NOT on PATH.** `npm run render` needs system ffmpeg.
   It lives at:

   ```
   C:\Users\abdul\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin
   ```

   Export that onto PATH in the same shell as the render. Verified working:
   ffmpeg 9.0, and it probes `audio/master.wav` at exactly 118.166s.

## State

- `audio/master.wav` — done, 118.166s, matches `../timing.json` to the millisecond.
  Under the 2:00 submission cap with 1.8s to spare. Do not regenerate.
- `index.html` — all 6 scenes authored (~825 lines), full GSAP choreography written
  against every voice line and sfx cue in `../timing.json`.
- `npm run check` was failing on one error, now fixed (`#s4dotheld` used
  `position:absolute;inset:0`, which the linter reads as a full-frame overlay
  starting visible; changed to explicit width/height).

## Next actions, in order

1. **Finish a cleanup already in progress.** All initial states were moved to
   immediate `gsap.set(...)` calls (the block above `const tl = ...`), because
   `tl.set(...)` at position 0 inside a *paused* timeline does not render — frame 0
   would show every element in its final state. The S1/S2/S3 `tl.set` chains were
   already deleted. **The S4, S5 and S6 `tl.set(..., 0)` chains are still there and
   are now redundant.** They are harmless (they re-apply the same values the
   immediate `gsap.set` already applied) but the linter will warn. Delete those
   three chains.
2. `npm run check` — expect 0 errors. Two warnings will remain and are being
   accepted deliberately: `composition_file_too_large` and
   `timeline_track_too_dense`, both advising a split into `compositions/`.
   Not worth the risk with the 28 Aug deadline; one file is still reviewable.
3. `npm run render` (add ffmpeg to PATH first). Consider `-q draft` for the first
   pass to check timing cheaply before a standard-quality render.
4. Verify the output rather than assuming: `ffprobe` the duration (expect ~118.2s,
   must be under 120), then pull stills at the moments where a cue and a visual
   have to agree — 1.1 (stamp), 12.282 (dialog lands), 22.726 (the tear),
   39.357 (confirm pressed), 50.207 / 52.007 (Hindi, then Tamil),
   58.35-61.05 (the 71-day odometer), 67.82-69.62 (seven steps, one per tick),
   79.873 (hold released), 110.861 (final stamp).
5. Send the MP4 to the user.

## One deliberate timing change

`timing.json` puts the s4/s5 boundary at 79.723, but the `release` cue is at
79.873. The refund advancing is the payoff of Act 3, not an entry sound for Act 2,
so s4 was extended to end at 80.30 and s5 now starts there (dur 14.592). Scene
boundaries in `index.html` therefore do **not** all match `timing.json`; the
comment on the `#s4` element records why. Everything else matches.

## Still outstanding on the wider submission (not video)

Route shells (`/file`, `/notices`, `/refund`, `/architecture`, `/honesty`), the
landing page carrying the mock credentials the brief requires, and the first
Vercel deploy so the public link exists early rather than on deadline day.
