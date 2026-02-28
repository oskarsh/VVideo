# Export Pipeline – Technical Deep Dive

**Purpose:** Document the full video export pipeline for debugging and optimization. Current symptom: **5 second project → 41 second exported video** (8× slower, laggy, unusable).

**User requirement:** Remove real-time render; use **smooth frame-by-frame steps only**. Optimize for correct duration and synced video.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXPORT FLOW                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  App.tsx runExport()                                                        │
│       │                                                                     │
│       ├─► setExporting(true), setPlaying(true)                              │
│       ├─► [100ms delay for canvas remount if plane-only]                    │
│       ├─► canvas.captureStream(0) for frame-by-frame OR captureStream(fps)  │
│       │   for real-time (real-time to be removed per user)                   │
│       │                                                                     │
│       └─► FOR each frame i in 0..totalFrames:                               │
│              │                                                              │
│              ├─► waitForVideoSeeked(videoCount)  // Creates promise          │
│              ├─► flushSync(setCurrentTime(t), setCurrentSceneIndex(...))    │
│              ├─► await waitForRender()         // 2 × requestAnimationFrame  │
│              ├─► await seekedPromise           // BLOCKS until video seeked  │
│              ├─► track.requestFrame()          // Push frame to MediaStream  │
│              └─► setTimeout(wait)              // Throttle to target fps    │
│                                                                             │
│  EditorCanvas.tsx (React Three Fiber)                                        │
│       │                                                                     │
│       ├─► SceneContent reads currentTime, currentSceneIndex from store      │
│       ├─► BackgroundVideo / PlaneVideo useFrame():                           │
│       │       video.currentTime = targetTime  (from sceneLocalTime)          │
│       │       on 'seeked' → notifyVideoSeeked()                              │
│       ├─► CameraRig, effects, post-processing all use currentTime           │
│       └─► Canvas renders to WebGL                                            │
│                                                                             │
│  MediaRecorder                                                                │
│       │                                                                     │
│       ├─► Receives frames from CanvasCaptureMediaStreamTrack                 │
│       ├─► Timestamps frames by DELIVERY TIME (wall-clock when pushed)        │
│       └─► Output duration = time span between first and last frame delivery │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Files

| File | Responsibility |
|------|----------------|
| `src/App.tsx` | Export loop, `runExport()`, MediaRecorder, frame stepping |
| `src/lib/exportVideoSync.ts` | `waitForVideoSeeked()`, `notifyVideoSeeked()` – blocks until videos finish seeking |
| `src/components/EditorCanvas.tsx` | `BackgroundVideo`, `PlaneVideo` – set `video.currentTime`, notify on `seeked` |
| `src/store.ts` | `currentTime`, `currentSceneIndex`, `isFrameByFrameExporting` |
| `src/App.tsx` PlaybackLoop | Advances time when playing; **no-ops** when `isFrameByFrameExporting` |
| `src/constants/export.ts` | `FRAME_BY_FRAME_RESOLUTION_THRESHOLD` (1440), framerates, bitrates |

---

## 3. Frame-by-Frame Export Loop (Current Implementation)

**Trigger:** Resolution ≥ 1440 (2K) OR user checks "Smooth export (frame-by-frame)".

**Per-frame steps** (e.g. 30 fps, 5 s project → 150 frames):

```javascript
for (let i = 0; i < totalFrames; i++) {
  const frameStart = performance.now()
  const t = i / framerate  // content time

  const seekedPromise = waitForVideoSeeked(videoCount)  // 1. Create promise
  flushSync(() => {
    setCurrentSceneIndex(sceneIndexAtTime(project.scenes, t))
    setCurrentTime(t)
  })                                                     // 2. Update store (sync)

  await waitForRender()   // 3. ~33ms (2 rAFs) – lets R3F render
  await seekedPromise     // 4. BLOCKS until all videos fire 'seeked'
  track?.requestFrame?.() // 5. Push current canvas to MediaStream

  const elapsed = performance.now() - frameStart
  const wait = Math.max(0, frameDurationMs - elapsed)   // frameDurationMs = 33ms @ 30fps
  if (wait > 0) await new Promise(r => setTimeout(r, wait))  // 6. Throttle
}
```

**Total wall-clock time per frame:**
- `flushSync`: ~1–5 ms
- `waitForRender`: ~33 ms (2 rAFs @ 60 Hz)
- `seekedPromise`: **50–500+ ms** (video decode – DOMINANT)
- Throttle: 0 ms (elapsed already > 33 ms when video is present)

So each frame takes **~100–500 ms** instead of 33 ms.

---

## 4. Root Cause: 5 s → 41 s

**Math:**
- 5 s @ 30 fps → 150 frames
- If `await seekedPromise` averages ~250 ms per frame: 150 × 250 ms ≈ **37.5 s**
- Plus 2 rAFs (~33 ms) and overhead → ~**41 s** total

**MediaRecorder behavior:**
- Encoder uses **delivery timestamps**, not logical frame indices.
- Delivering 150 frames over 41 s → output duration ≈ **41 s**.
- Playback at 30 fps display → 150 / 41 ≈ **3.6 fps** → very choppy and slow.

So the blocker is:

- `waitForVideoSeeked()` waits for `video.seeked`
- Seeking + decode can take **50–500 ms** per frame
- Timeline advances only after seek completes
- Total export time = frames × (render + seek)
- Output duration matches export wall-clock time → wrong duration

---

## 5. Video Sync Mechanism (`exportVideoSync.ts`)

```javascript
// Export creates promise; videos resolve it when seeked
waitForVideoSeeked(videoCount)  // expectedCount = N
  → Promise that resolves when notifyVideoSeeked() called N times
  → 2 s timeout as fallback

// In BackgroundVideo / PlaneVideo useFrame():
video.currentTime = targetTime
video.addEventListener('seeked', () => notifyVideoSeeked())
```

**Intent:** Only capture after videos are decoded so pane/background video stays in sync with the camera.

**Effect:** Export is paced by slow video decode instead of target framerate.

---

## 6. Video Component Flow

**PlaneVideo / BackgroundVideo** (`EditorCanvas.tsx`):

- Read `sceneLocalTime` from store (derived from `currentTime`).
- In `useFrame()` (runs every R3F frame):
  - Compute `targetTime` from `sceneLocalTime`, trim, playback mode.
  - If `isFrameByFrameExporting`:
    - If `|video.currentTime - targetTime| > 0.001` and `!video.seeking`:
      - Add `seeked` listener, set `video.currentTime = targetTime`.
    - Else if `!video.seeking`:
      - Call `notifyVideoSeeked()` (already at target).
  - Else:
    - Set `video.currentTime = targetTime` (normal playback).

`video.seeking` avoids duplicate listeners when a previous seek is still in progress.

---

## 7. Capture Pipeline

**`canvas.captureStream(0)`**
- Manual mode: no frames until `requestFrame()`.
- Use only when `requestFrame` exists (Chrome, Edge, Safari). Firefox falls back to real-time.

**`track.requestFrame()`**
- Captures current canvas state and adds it to the MediaStream.
- Used once per logical frame.

**MediaRecorder**
- Consumes the stream, timestamps by delivery time.
- `start(100)` → `dataavailable` every 100 ms.
- Output duration comes from those timestamps.

---

## 8. Known Constraints

1. **MediaRecorder timestamps**  
   Output duration follows wall-clock delivery time, not desired content duration.

2. **Video decode is async**  
   `video.currentTime = x` triggers a seek; decode can take 50–500 ms depending on resolution and keyframe structure.

3. **No way to pass frame timestamps**  
   Canvas capture/MediaRecorder do not accept per-frame timestamps.

4. **`requestFrame()` support**  
   Chrome, Edge, Safari: yes. Firefox: no → falls back to real-time capture.

---

## 9. Optimization Directions

### A. Remove `waitForVideoSeeked` (trade-off)
- **Pro:** Export time ≈ `totalFrames × (2 rAFs + throttle)` ≈ real-time (e.g. 5 s).
- **Con:** Video texture may lag by 1–3 frames; acceptable in some use cases.

### B. Use WebCodecs API instead of MediaRecorder
- Capture frames via `canvas.getContext('2d').drawImage()` or OffscreenCanvas.
- Create `VideoFrame` with explicit timestamps.
- Use `VideoEncoder` with `VideoFrame.timestamp` and `VideoFrame.duration`.
- **Pro:** Full control over frame timing; independent of video decode delay.
- **Con:** More code, different browser support.

### C. Parallel pre-decode
- Ahead of export, pre-decode key frames for the video.
- Export loop only waits for the next pre-decoded frame (or a short timeout).
- **Pro:** Reduces blocking on decode.
- **Con:** Higher memory and complexity; may need WebCodecs.

### D. Lower-res or different source video
- Shorter keyframe intervals → faster seeks.
- Lower resolution → faster decode.
- **Pro:** Works with current pipeline.
- **Con:** Requires user to change assets.

### E. Hybrid: short timeout instead of full seek
- `waitForVideoSeeked` with a short timeout (e.g. 50 ms) instead of waiting for `seeked`.
- Capture after timeout even if video is not ready.
- **Pro:** Limits export slowdown.
- **Con:** Some frames may still show stale video.

---

## 10. Recommended Next Steps for Implementing “Smooth Steps Only”

1. **Immediate:**  
   Remove or bypass `waitForVideoSeeked` so export is driven by:
   - 2 rAFs + throttle only.
   - Check that 5 s project exports to ~5 s.

2. **Then:**  
   Introduce WebCodecs-based export:
   - Render frame to `ImageBitmap` / `OffscreenCanvas`.
   - Create `VideoFrame` with timestamp `i / framerate`.
   - Use `VideoEncoder` and `EncodedVideoChunk`.
   - Mux into WebM/MP4 manually or with a library (e.g. mux.js).

3. **Optional:**  
   Keep a lighter `seeked`-based path for fallback:
   - Use a short timeout (e.g. 50 ms).
   - Accept minor video lag instead of huge export slowdown.

---

## 11. Quick Reference: Constants

| Constant | Value | Location |
|----------|-------|----------|
| `FRAME_BY_FRAME_RESOLUTION_THRESHOLD` | 1440 | `src/constants/export.ts` |
| `rafCount` | 2 | `src/App.tsx` runExport |
| `frameDurationMs` | `1000 / framerate` | `src/App.tsx` |
| `SEEK_TIMEOUT_MS` | 2000 | `src/lib/exportVideoSync.ts` |
| `recorder.start` timeslice | 100 ms | `src/App.tsx` |

---

## 12. Real-Time Mode (To Be Removed)

When `useFrameByFrame === false`:
- `captureStream(framerate)` for automatic capture.
- PlaybackLoop advances `currentTime` in real time.
- Export waits `totalDuration * 1000 + 500` ms.
- Canvas is recorded as it animates.

User wants to remove this and rely solely on frame-by-frame smooth steps.
