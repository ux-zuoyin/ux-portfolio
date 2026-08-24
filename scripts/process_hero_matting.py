#!/usr/bin/env python3
"""Create temporally stable transparent Hero assets with model-based matting."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort


def log(message: str) -> None:
    print(message, flush=True)


def video_info(path: Path) -> tuple[int, int, float, int]:
    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        raise RuntimeError(f"Cannot open video: {path}")
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = float(capture.get(cv2.CAP_PROP_FPS))
    count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    capture.release()
    return width, height, fps, count


def extract_frames(ffmpeg: Path, input_path: Path, frames_dir: Path, expected: int) -> list[Path]:
    frames_dir.mkdir(parents=True, exist_ok=True)
    frames = sorted(frames_dir.glob("frame_*.png"))
    if len(frames) == expected:
        log(f"Source frames already available: {len(frames)}")
        return frames
    subprocess.run(
        [str(ffmpeg), "-hide_banner", "-loglevel", "error", "-y", "-i", str(input_path),
         "-map", "0:v:0", "-vsync", "0", str(frames_dir / "frame_%04d.png")],
        check=True,
    )
    frames = sorted(frames_dir.glob("frame_*.png"))
    if len(frames) != expected:
        raise RuntimeError(f"Expected {expected} frames, extracted {len(frames)}")
    log(f"Extracted {len(frames)} source PNG frames")
    return frames


def guided_filter(guide: np.ndarray, target: np.ndarray, radius: int = 5, eps: float = 0.0025) -> np.ndarray:
    kernel = (radius * 2 + 1, radius * 2 + 1)
    mean_i = cv2.boxFilter(guide, cv2.CV_32F, kernel, borderType=cv2.BORDER_REFLECT)
    mean_p = cv2.boxFilter(target, cv2.CV_32F, kernel, borderType=cv2.BORDER_REFLECT)
    corr_i = cv2.boxFilter(guide * guide, cv2.CV_32F, kernel, borderType=cv2.BORDER_REFLECT)
    corr_ip = cv2.boxFilter(guide * target, cv2.CV_32F, kernel, borderType=cv2.BORDER_REFLECT)
    variance_i = corr_i - mean_i * mean_i
    covariance_ip = corr_ip - mean_i * mean_p
    a = covariance_ip / (variance_i + eps)
    b = mean_p - a * mean_i
    mean_a = cv2.boxFilter(a, cv2.CV_32F, kernel, borderType=cv2.BORDER_REFLECT)
    mean_b = cv2.boxFilter(b, cv2.CV_32F, kernel, borderType=cv2.BORDER_REFLECT)
    return np.clip(mean_a * guide + mean_b, 0.0, 1.0)


class ForegroundMatte:
    def __init__(self, model_path: Path, model_type: str) -> None:
        options = ort.SessionOptions()
        options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        options.intra_op_num_threads = max(2, min(8, (cv2.getNumberOfCPUs() or 4)))
        options.inter_op_num_threads = 1
        self.session = ort.InferenceSession(
            str(model_path), sess_options=options, providers=["CPUExecutionProvider"]
        )
        self.input_name = self.session.get_inputs()[0].name
        self.model_type = model_type
        self.input_size = 1024 if model_type == "birefnet" else 320
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)[:, None, None]
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32)[:, None, None]
        log(
            f"Loaded {model_type} ONNX input={self.input_name} output={self.session.get_outputs()[0].name} "
            f"providers={self.session.get_providers()}"
        )

    def predict_single(self, bgr: np.ndarray) -> np.ndarray:
        height, width = bgr.shape[:2]
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(rgb, (self.input_size, self.input_size), interpolation=cv2.INTER_AREA)
        tensor = resized.astype(np.float32).transpose(2, 0, 1) / 255.0
        tensor = ((tensor - self.mean) / self.std)[None]
        output = self.session.run(None, {self.input_name: tensor})[0]
        prediction = np.squeeze(output).astype(np.float32)
        alpha = (
            1.0 / (1.0 + np.exp(-np.clip(prediction, -30.0, 30.0)))
            if self.model_type == "birefnet"
            else np.clip(prediction, 0.0, 1.0)
        )
        low, high = float(alpha.min()), float(alpha.max())
        if high - low > 1e-6:
            alpha = (alpha - low) / (high - low)
        alpha = cv2.resize(alpha, (width, height), interpolation=cv2.INTER_CUBIC)

        return np.clip(alpha, 0.0, 1.0).astype(np.float32)

    def predict(self, bgr: np.ndarray) -> np.ndarray:
        alpha = self.predict_single(bgr)

        # U2Net's whole-frame saliency can underweight a detached secondary object.
        # A second model pass on the right-side object region retains the desk lamp;
        # this remains a semantic-model matte, not a white-pixel/color-key fallback.
        if self.model_type == "u2net":
            height, width = bgr.shape[:2]
            tile_left = int(width * 0.64)
            tile_top = int(height * 0.10)
            tile = bgr[tile_top:height, tile_left:width]
            tile_alpha = self.predict_single(tile)
            # Raise medium-confidence semantic detail so thin lamp struts stay opaque.
            tile_alpha = np.power(np.clip(tile_alpha, 0.0, 1.0), 0.72)
            tile_alpha[:8, :] *= np.linspace(0.0, 1.0, 8, dtype=np.float32)[:, None]
            tile_alpha[:, :24] *= np.linspace(0.0, 1.0, 24, dtype=np.float32)[None, :]
            alpha[tile_top:height, tile_left:width] = np.maximum(
                alpha[tile_top:height, tile_left:width], tile_alpha
            )

        # Use the model probability as the matte and edge-align it to source detail.
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
        guided = guided_filter(gray, np.clip(alpha, 0.0, 1.0))
        alpha = np.clip(alpha * 0.62 + guided * 0.38, 0.0, 1.0)

        # Remove only tiny isolated model predictions; preserve separate lamp/plant components.
        binary = (alpha > 0.025).astype(np.uint8)
        count, labels, stats, _ = cv2.connectedComponentsWithStats(binary, 8)
        keep = np.zeros_like(binary)
        for label in range(1, count):
            if stats[label, cv2.CC_STAT_AREA] >= 48:
                keep[labels == label] = 1
        keep = cv2.dilate(keep, np.ones((5, 5), np.uint8), iterations=1)
        alpha *= keep
        alpha[alpha < 0.003] = 0.0
        alpha[alpha > 0.997] = 1.0
        return alpha.astype(np.float32)


def write_mask(path: Path, alpha: np.ndarray) -> None:
    cv2.imwrite(str(path), np.round(np.clip(alpha, 0.0, 1.0) * 65535.0).astype(np.uint16))


def read_mask(path: Path) -> np.ndarray:
    mask = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if mask is None:
        raise RuntimeError(f"Cannot read mask: {path}")
    return mask.astype(np.float32) / 65535.0


def infer_masks(model: ForegroundMatte, frame_paths: list[Path], raw_dir: Path, only: set[int] | None = None) -> None:
    raw_dir.mkdir(parents=True, exist_ok=True)
    targets = only or set(range(1, len(frame_paths) + 1))
    for index, frame_path in enumerate(frame_paths, 1):
        if index not in targets:
            continue
        mask_path = raw_dir / f"frame_{index:04d}.png"
        if mask_path.exists():
            continue
        frame = cv2.imread(str(frame_path), cv2.IMREAD_COLOR)
        write_mask(mask_path, model.predict(frame))
        log(f"{model.model_type} mask {index}/{len(frame_paths)}")


def edge_align(alpha: np.ndarray, bgr: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    guided = guided_filter(gray, np.clip(alpha, 0.0, 1.0), radius=4, eps=0.0022)
    result = np.clip(alpha * 0.7 + guided * 0.3, 0.0, 1.0)
    result[result < 0.003] = 0.0
    result[result > 0.997] = 1.0
    return result


def flow_warp(reference: np.ndarray, current_bgr: np.ndarray, previous_bgr: np.ndarray) -> np.ndarray:
    scale = 0.5
    current_gray = cv2.cvtColor(current_bgr, cv2.COLOR_BGR2GRAY)
    previous_gray = cv2.cvtColor(previous_bgr, cv2.COLOR_BGR2GRAY)
    small_size = (int(current_gray.shape[1] * scale), int(current_gray.shape[0] * scale))
    current_small = cv2.resize(current_gray, small_size, interpolation=cv2.INTER_AREA)
    previous_small = cv2.resize(previous_gray, small_size, interpolation=cv2.INTER_AREA)
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_FAST)
    backward_flow = dis.calc(current_small, previous_small, None)
    flow = cv2.resize(backward_flow, (current_gray.shape[1], current_gray.shape[0]), interpolation=cv2.INTER_LINEAR)
    flow /= scale
    grid_x, grid_y = np.meshgrid(
        np.arange(current_gray.shape[1], dtype=np.float32),
        np.arange(current_gray.shape[0], dtype=np.float32),
    )
    return cv2.remap(
        reference,
        grid_x + flow[:, :, 0],
        grid_y + flow[:, :, 1],
        interpolation=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=0,
    )


def propagate_anchor_masks(frame_paths: list[Path], raw_dir: Path, anchors: list[int]) -> None:
    """Create an independent alpha for every frame by bidirectional flow between model anchors."""
    for start, end in zip(anchors, anchors[1:]):
        forward: dict[int, np.ndarray] = {start: read_mask(raw_dir / f"frame_{start:04d}.png")}
        previous_frame = cv2.imread(str(frame_paths[start - 1]), cv2.IMREAD_COLOR)
        previous_alpha = forward[start]
        for index in range(start + 1, end + 1):
            current_frame = cv2.imread(str(frame_paths[index - 1]), cv2.IMREAD_COLOR)
            previous_alpha = edge_align(flow_warp(previous_alpha, current_frame, previous_frame), current_frame)
            forward[index] = previous_alpha
            previous_frame = current_frame

        backward: dict[int, np.ndarray] = {end: read_mask(raw_dir / f"frame_{end:04d}.png")}
        next_frame = cv2.imread(str(frame_paths[end - 1]), cv2.IMREAD_COLOR)
        next_alpha = backward[end]
        for index in range(end - 1, start - 1, -1):
            current_frame = cv2.imread(str(frame_paths[index - 1]), cv2.IMREAD_COLOR)
            next_alpha = edge_align(flow_warp(next_alpha, current_frame, next_frame), current_frame)
            backward[index] = next_alpha
            next_frame = current_frame

        distance = max(end - start, 1)
        for index in range(start + 1, end):
            t = (index - start) / distance
            current_frame = cv2.imread(str(frame_paths[index - 1]), cv2.IMREAD_COLOR)
            fused = forward[index] * (1.0 - t) + backward[index] * t
            # Prefer agreement, but retain soft detail found by either temporal direction.
            agreement = np.minimum(forward[index], backward[index])
            fused = np.clip(fused * 0.86 + agreement * 0.14, 0.0, 1.0)
            write_mask(raw_dir / f"frame_{index:04d}.png", edge_align(fused, current_frame))
        log(f"Bidirectional propagation {start}-{end}")


def temporal_smooth(frame_paths: list[Path], raw_dir: Path, forward_dir: Path, final_dir: Path) -> None:
    forward_dir.mkdir(parents=True, exist_ok=True)
    final_dir.mkdir(parents=True, exist_ok=True)

    previous_frame = cv2.imread(str(frame_paths[0]), cv2.IMREAD_COLOR)
    previous_smooth = read_mask(raw_dir / "frame_0001.png")
    write_mask(forward_dir / "frame_0001.png", previous_smooth)
    for index in range(2, len(frame_paths) + 1):
        current_frame = cv2.imread(str(frame_paths[index - 1]), cv2.IMREAD_COLOR)
        current = read_mask(raw_dir / f"frame_{index:04d}.png")
        warped = flow_warp(previous_smooth, current_frame, previous_frame)
        uncertainty = np.clip(1.0 - np.abs(current * 2.0 - 1.0), 0.12, 1.0)
        weight = 0.26 * uncertainty
        smooth = current * (1.0 - weight) + warped * weight
        missing = (warped > 0.7) & (current < 0.35)
        smooth[missing] = np.maximum(smooth[missing], warped[missing] * 0.58)
        smooth = np.clip(smooth, 0.0, 1.0)
        write_mask(forward_dir / f"frame_{index:04d}.png", smooth)
        previous_frame, previous_smooth = current_frame, smooth
        if index % 12 == 0 or index == len(frame_paths):
            log(f"Forward temporal pass {index}/{len(frame_paths)}")

    next_frame = cv2.imread(str(frame_paths[-1]), cv2.IMREAD_COLOR)
    next_smooth = read_mask(raw_dir / f"frame_{len(frame_paths):04d}.png")
    for index in range(len(frame_paths), 0, -1):
        current_frame = cv2.imread(str(frame_paths[index - 1]), cv2.IMREAD_COLOR)
        raw = read_mask(raw_dir / f"frame_{index:04d}.png")
        forward = read_mask(forward_dir / f"frame_{index:04d}.png")
        if index < len(frame_paths):
            warped = flow_warp(next_smooth, current_frame, next_frame)
            uncertainty = np.clip(1.0 - np.abs(raw * 2.0 - 1.0), 0.12, 1.0)
            weight = 0.26 * uncertainty
            backward = raw * (1.0 - weight) + warped * weight
            missing = (warped > 0.7) & (raw < 0.35)
            backward[missing] = np.maximum(backward[missing], warped[missing] * 0.58)
        else:
            backward = raw
        median = np.median(np.stack((raw, forward, backward), axis=0), axis=0)
        final = np.clip(raw * 0.56 + median * 0.44, 0.0, 1.0)
        final = cv2.GaussianBlur(final, (0, 0), 0.38)
        final[final < 0.003] = 0.0
        final[final > 0.997] = 1.0
        write_mask(final_dir / f"frame_{index:04d}.png", final)
        next_frame, next_smooth = current_frame, backward
        if index % 12 == 0 or index == 1:
            log(f"Backward temporal pass {len(frame_paths) - index + 1}/{len(frame_paths)}")


def union_crop(final_mask_dir: Path, count: int, width: int, height: int, padding: int) -> tuple[int, int, int, int]:
    left, top, right, bottom = width, height, 0, 0
    for index in range(1, count + 1):
        alpha = read_mask(final_mask_dir / f"frame_{index:04d}.png")
        ys, xs = np.where(alpha > 0.018)
        if xs.size:
            left, top = min(left, int(xs.min())), min(top, int(ys.min()))
            right, bottom = max(right, int(xs.max()) + 1), max(bottom, int(ys.max()) + 1)
    if right <= left or bottom <= top:
        raise RuntimeError("No foreground found in final masks")
    left, top = max(0, left - padding), max(0, top - padding)
    right, bottom = min(width, right + padding), min(height, bottom + padding)
    if (right - left) % 2:
        right = min(width, right + 1) if right < width else right - 1
    if (bottom - top) % 2:
        bottom = min(height, bottom + 1) if bottom < height else bottom - 1
    return left, top, right, bottom


def white_matte_decontaminate(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    rgb_f = rgb.astype(np.float32) / 255.0
    a = alpha[:, :, None]
    recovered = (rgb_f - (1.0 - a)) / np.maximum(a, 0.055)
    recovered = np.clip(recovered, 0.0, 1.0)
    edge_strength = np.clip((0.98 - a) / 0.72, 0.0, 1.0)
    cleaned = rgb_f * (1.0 - edge_strength) + recovered * edge_strength

    # Extend the nearest high-confidence foreground color into the soft matte.
    # This removes a white outline without recoloring opaque white hair or metal.
    core = alpha >= 0.90
    distance_source = np.ones(alpha.shape, dtype=np.uint8)
    distance_source[core] = 0
    core_distance, labels = cv2.distanceTransformWithLabels(
        distance_source, cv2.DIST_L2, 3, labelType=cv2.DIST_LABEL_PIXEL
    )
    palette = np.zeros((int(labels.max()) + 1, 3), dtype=np.float32)
    palette[labels[core]] = rgb_f[core]
    nearest_core = palette[labels]
    support_distance = cv2.distanceTransform((alpha > 0.003).astype(np.uint8), cv2.DIST_L2, 3)
    contour_band = ((support_distance > 0.0) & (support_distance <= 4.0) & (core_distance <= 12.0))[:, :, None]
    extension = np.clip((0.88 - a) / 0.78, 0.0, 1.0) * 0.92 * contour_band
    cleaned = cleaned * (1.0 - extension) + nearest_core * extension
    cleaned[alpha < 0.003] = 0.0
    return np.round(np.clip(cleaned, 0.0, 1.0) * 255.0).astype(np.uint8)


def render_transparent_frames(
    frame_paths: list[Path], final_mask_dir: Path, output_frames: Path, crop: tuple[int, int, int, int]
) -> None:
    output_frames.mkdir(parents=True, exist_ok=True)
    left, top, right, bottom = crop
    for index, frame_path in enumerate(frame_paths, 1):
        bgr = cv2.imread(str(frame_path), cv2.IMREAD_COLOR)
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        alpha = read_mask(final_mask_dir / f"frame_{index:04d}.png")
        # Slight matte choke removes the residual white-background veil while
        # retaining model-derived soft detail around hair, glasses, and metal.
        alpha = np.power(np.clip((alpha - 0.022) / 0.978, 0.0, 1.0), 1.22)
        cleaned = white_matte_decontaminate(rgb, alpha)
        rgba = np.dstack((cleaned, np.round(alpha * 255.0).astype(np.uint8)))
        rgba = rgba[top:bottom, left:right]
        cv2.imwrite(str(output_frames / f"frame_{index:04d}.png"), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
        if index % 16 == 0 or index == len(frame_paths):
            log(f"Transparent PNG {index}/{len(frame_paths)}")


def encode_webm(ffmpeg: Path, frames_dir: Path, fps: float, output_path: Path) -> None:
    subprocess.run(
        [str(ffmpeg), "-hide_banner", "-loglevel", "error", "-y", "-framerate", f"{fps:g}",
         "-i", str(frames_dir / "frame_%04d.png"), "-an", "-c:v", "libvpx-vp9",
         "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", "-b:v", "0", "-crf", "27",
         "-deadline", "good", "-cpu-used", "2", "-row-mt", "1", "-tile-columns", "2",
         "-metadata:s:v:0", "alpha_mode=1", str(output_path)],
        check=True,
    )


def write_test_html(output_dir: Path, width: int, height: int, method_label: str) -> None:
    html = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hero Transparent Video QA</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#151515;color:#fff;font:14px/1.5 system-ui,sans-serif}}
header{{padding:22px 24px;border-bottom:1px solid #333}}h1{{margin:0 0 5px;font-size:20px}}p{{margin:0;color:#aaa}}
main{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#333}}
.panel{{min-height:calc(100vh - 94px);display:grid;grid-template-rows:auto 1fr;padding:16px}}.panel h2{{margin:0;font-size:13px}}
.stage{{display:grid;place-items:center;overflow:hidden}}video{{display:block;width:100%;height:auto;max-height:calc(100vh - 150px);object-fit:contain}}
.black{{background:#000}}.purple{{background:#5500c3}}.white{{background:#fff;color:#111}}
@media(max-width:900px){{main{{grid-template-columns:1fr}}.panel{{min-height:70vh}}}}
</style></head><body><header><h1>透明 Hero 视频三色背景检查</h1><p>{method_label} · {width}×{height} · VP9 Alpha</p></header>
<main>{''.join(f'<section class="panel {cls}"><h2>{label}</h2><div class="stage"><video autoplay muted loop playsinline preload="auto" poster="hero-character-poster.png" src="hero-character.webm"></video></div></section>' for cls,label in [('black','黑色背景'),('purple','紫色背景'),('white','白色背景')])}</main>
</body></html>"""
    (output_dir / "test.html").write_text(html, encoding="utf-8")


def render_samples(frame_paths: list[Path], raw_dir: Path, sample_dir: Path, indices: list[int]) -> None:
    sample_dir.mkdir(parents=True, exist_ok=True)
    backgrounds = [(0, 0, 0), (195, 0, 85), (255, 255, 255)]  # BGR: black, #5500c3, white
    for index in indices:
        bgr = cv2.imread(str(frame_paths[index - 1]), cv2.IMREAD_COLOR)
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        alpha = read_mask(raw_dir / f"frame_{index:04d}.png")
        cleaned = white_matte_decontaminate(rgb, alpha)
        rgba = np.dstack((cleaned, np.round(alpha * 255.0).astype(np.uint8)))
        cv2.imwrite(str(sample_dir / f"frame_{index:04d}.png"), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
        a = alpha[:, :, None]
        for suffix, background in zip(("black", "purple", "white"), backgrounds):
            bg_rgb = np.array(background[::-1], dtype=np.float32)[None, None, :] / 255.0
            composite = cleaned.astype(np.float32) / 255.0 * a + bg_rgb * (1.0 - a)
            composite_bgr = cv2.cvtColor(np.round(composite * 255.0).astype(np.uint8), cv2.COLOR_RGB2BGR)
            cv2.imwrite(str(sample_dir / f"frame_{index:04d}-{suffix}.jpg"), composite_bgr, [cv2.IMWRITE_JPEG_QUALITY, 94])
    log(f"Rendered {len(indices)} model-mask samples")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--work-dir", required=True, type=Path)
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--model-type", choices=("birefnet", "u2net"), default="u2net")
    parser.add_argument("--ffmpeg", required=True, type=Path)
    parser.add_argument("--padding", type=int, default=20)
    parser.add_argument("--anchor-step", type=int, default=12)
    parser.add_argument("--sample-indices", default="")
    args = parser.parse_args()

    width, height, fps, frame_count = video_info(args.input)
    log(f"Input: {width}x{height}, {fps:g} fps, {frame_count} frames")
    source_frames = extract_frames(args.ffmpeg, args.input, args.work_dir / "source_frames", frame_count)
    raw_masks = args.work_dir / "raw_masks"
    model = ForegroundMatte(args.model, args.model_type)

    if args.sample_indices:
        indices = [int(value) for value in args.sample_indices.split(",")]
        infer_masks(model, source_frames, raw_masks, set(indices))
        render_samples(source_frames, raw_masks, args.work_dir / "samples", indices)
        return

    anchors = list(range(1, frame_count + 1, args.anchor_step))
    if anchors[-1] != frame_count:
        anchors.append(frame_count)
    log(f"{args.model_type} anchor frames: {anchors}")
    infer_masks(model, source_frames, raw_masks, set(anchors))
    if args.anchor_step > 1:
        propagate_anchor_masks(source_frames, raw_masks, anchors)
    final_masks = args.work_dir / "final_masks"
    temporal_smooth(source_frames, raw_masks, args.work_dir / "forward_masks", final_masks)
    crop = union_crop(final_masks, frame_count, width, height, args.padding)
    output_width, output_height = crop[2] - crop[0], crop[3] - crop[1]
    log(f"Union crop: {crop}, output={output_width}x{output_height}")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    output_frames = args.output_dir / "frames"
    render_transparent_frames(source_frames, final_masks, output_frames, crop)
    poster = args.output_dir / "hero-character-poster.png"
    shutil.copy2(output_frames / "frame_0001.png", poster)
    webm = args.output_dir / "hero-character.webm"
    encode_webm(args.ffmpeg, output_frames, fps, webm)
    method_label = "U²-Net multi-pass semantic matting" if args.model_type == "u2net" else "BiRefNet-General-Lite"
    write_test_html(args.output_dir, output_width, output_height, method_label)

    report = {
        "input": str(args.input),
        "method": (
            f"{method_label} + guided edge refinement + bidirectional optical-flow "
            "temporal smoothing + white-matte decontamination"
        ),
        "model_type": args.model_type,
        "anchor_step": args.anchor_step,
        "frame_count": frame_count,
        "fps": fps,
        "source_size": [width, height],
        "union_crop": list(crop),
        "output_size": [output_width, output_height],
        "webm_bytes": webm.stat().st_size,
    }
    (args.output_dir / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    log(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr, flush=True)
        raise
