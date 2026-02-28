/**
 * WebCodecs-based export recorder.
 *
 * Advantages over MediaRecorder + captureStream():
 * - Explicit per-frame timestamps → output duration always equals content duration,
 *   regardless of how long each render/seek takes.
 * - Can re-enable waitForVideoSeeked() so plane/background video is properly synced
 *   per frame without stretching the output.
 *
 * Falls back gracefully to null when the browser doesn't support VideoEncoder,
 * when the codec is not hardware-supported, or for plane-only (alpha) exports.
 */

import { Muxer as WebmMuxer, ArrayBufferTarget as WebmTarget } from 'webm-muxer'
import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4Target } from 'mp4-muxer'
import type { ExportFormat } from '@/constants/export'

export function isWebCodecsSupported(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'
}

export class WebCodecsRecorder {
  private readonly encoder: VideoEncoder
  private readonly doFinalize: () => void
  private readonly getBuffer: () => ArrayBuffer
  readonly frameDurationUs: number
  private readonly keyframeEvery: number
  readonly mimeType: string
  readonly fileExt: string

  private constructor(
    encoder: VideoEncoder,
    doFinalize: () => void,
    getBuffer: () => ArrayBuffer,
    frameDurationUs: number,
    keyframeEvery: number,
    mimeType: string,
    fileExt: string,
  ) {
    this.encoder = encoder
    this.doFinalize = doFinalize
    this.getBuffer = getBuffer
    this.frameDurationUs = frameDurationUs
    this.keyframeEvery = keyframeEvery
    this.mimeType = mimeType
    this.fileExt = fileExt
  }

  /**
   * Creates a WebCodecsRecorder for the given canvas dimensions and export settings.
   * Returns null if the browser doesn't support the required codec, allowing the caller
   * to fall back to MediaRecorder.
   */
  static async create(
    width: number,
    height: number,
    framerate: number,
    bitrate: number,
    format: ExportFormat,
  ): Promise<WebCodecsRecorder | null> {
    // VP9 in WebM; H.264 High Profile level 5.1 in MP4 (covers up to 4K@60)
    const encoderCodec = format === 'mp4' ? 'avc1.640033' : 'vp09.00.41.08'
    const frameDurationUs = Math.round(1_000_000 / framerate)
    const keyframeEvery = Math.max(1, Math.round(framerate * 2)) // keyframe every 2 s

    try {
      const { supported } = await VideoEncoder.isConfigSupported({
        codec: encoderCodec,
        width,
        height,
        bitrate,
        framerate,
      })
      if (!supported) return null
    } catch {
      return null
    }

    // Build muxer and capture helpers in closures to avoid union-type issues.
    let doAddChunk: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => void
    let doFinalize: () => void
    let getBuffer: () => ArrayBuffer
    let mimeType: string
    let fileExt: string

    if (format === 'mp4') {
      const target = new Mp4Target()
      const muxer = new Mp4Muxer({ target, video: { codec: 'avc', width, height }, fastStart: 'in-memory' })
      doAddChunk = (chunk, meta) => muxer.addVideoChunk(chunk, meta)
      doFinalize = () => muxer.finalize()
      getBuffer = () => target.buffer
      mimeType = 'video/mp4'
      fileExt = '.mp4'
    } else {
      const target = new WebmTarget()
      const muxer = new WebmMuxer({ target, video: { codec: 'V_VP9', width, height, frameRate: framerate } })
      doAddChunk = (chunk, meta) => muxer.addVideoChunk(chunk, meta)
      doFinalize = () => muxer.finalize()
      getBuffer = () => target.buffer
      mimeType = 'video/webm'
      fileExt = '.webm'
    }

    const encoder = new VideoEncoder({
      output: (chunk, meta) => doAddChunk(chunk, meta),
      error: (e) => console.error('VideoEncoder error:', e),
    })
    encoder.configure({ codec: encoderCodec, width, height, bitrate, framerate })

    return new WebCodecsRecorder(
      encoder,
      doFinalize,
      getBuffer,
      frameDurationUs,
      keyframeEvery,
      mimeType,
      fileExt,
    )
  }

  /**
   * Captures the current canvas state as frame `frameIndex` (0-based within this recorder).
   * Must be called after the canvas has rendered the correct content for that frame.
   */
  captureFrame(canvas: HTMLCanvasElement, frameIndex: number): void {
    const frame = new VideoFrame(canvas, {
      timestamp: frameIndex * this.frameDurationUs,
      duration: this.frameDurationUs,
    })
    this.encoder.encode(frame, { keyFrame: frameIndex % this.keyframeEvery === 0 })
    frame.close()
  }

  /** Flushes the encoder, finalizes the muxer, and returns the complete video Blob. */
  async finish(): Promise<Blob> {
    await this.encoder.flush()
    this.encoder.close()
    this.doFinalize()
    return new Blob([this.getBuffer()], { type: this.mimeType })
  }
}
