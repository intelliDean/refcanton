#!/usr/bin/env python3
import os
import subprocess
import shutil

FRAMES_DIR = "/tmp/refcanton_demo_frames"
OUTPUT_DIR = "/mnt/data/Projects/ref_canton/demo"
os.makedirs(OUTPUT_DIR, exist_ok=True)

stages = [
    {
        "file": f"{FRAMES_DIR}/01_borrower_initial.png",
        "title": "Stage 1: Borrower Overview | Active Loan A ($100k @ 8.5pct) & 150 Collateral Units Locked",
        "duration": 5
    },
    {
        "file": f"{FRAMES_DIR}/02_auth_modal.png",
        "title": "Stage 2: Verified Party Credentials | Cryptographic HMAC Auth Required (Demo Bypass Disabled)",
        "duration": 5
    },
    {
        "file": f"{FRAMES_DIR}/03_borrower_authenticated.png",
        "title": "Stage 3: Authenticated Borrower Session | Verified Access Enforced (Anonymous Blocked)",
        "duration": 4
    },
    {
        "file": f"{FRAMES_DIR}/04_lendera_quote_issued.png",
        "title": "Stage 4: Outgoing Lender A (LegacyBank) | Binding Payoff Quote ($101k) on Participant 2",
        "duration": 6
    },
    {
        "file": f"{FRAMES_DIR}/05_lenderb_offer_committed.png",
        "title": "Stage 5: Incoming Lender B (NeoCapital) | Replacement Offer ($100k @ 7.5pct) on Participant 3",
        "duration": 6
    },
    {
        "file": f"{FRAMES_DIR}/06_borrower_ready_to_close.png",
        "title": "Stage 6: Refinancing Pipeline | Side-by-Side Term Comparison (8.5pct -> 7.5pct | 100 bps Savings)",
        "duration": 5
    },
    {
        "file": f"{FRAMES_DIR}/07_atomic_closing_committed.png",
        "title": "Stage 7: Canton Atomic Closing | Genuine ClosingRequest.Execute with Verified Update ID",
        "duration": 7
    },
    {
        "file": f"{FRAMES_DIR}/08_privacy_inspector.png",
        "title": "Stage 8: Sub-Transaction Privacy Inspector | Mathematical Redaction of Competitor Terms",
        "duration": 6
    },
    {
        "file": f"{FRAMES_DIR}/09_audit_log.png",
        "title": "Stage 9: Canton Ledger Audit Trail | Immutable Cryptographic Transaction History",
        "duration": 5
    }
]

clip_paths = []
for idx, stage in enumerate(stages):
    clip_out = f"/tmp/new_stage_clip_{idx}.mp4"
    text = stage["title"].replace(":", "\\:").replace("'", "\\'")
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", stage["file"],
        "-t", str(stage["duration"]),
        "-vf", (
            f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,"
            f"drawbox=y=ih-85:color=black@0.85:width=iw:height=85:t=fill,"
            f"drawtext=text='{text}':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=h-55"
        ),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        clip_out
    ]
    print(f"Generating clip {idx + 1}/{len(stages)}: {stage['title'][:40]}...")
    subprocess.run(cmd, check=True)
    clip_paths.append(clip_out)

# Concatenate all clips
concat_txt = "/tmp/new_concat_demo.txt"
with open(concat_txt, "w") as f:
    for c in clip_paths:
        f.write(f"file '{c}'\n")

master_output = f"{OUTPUT_DIR}/refcanton_master_walkthrough.mp4"
print(f"Stitching full presentation video to {master_output}...")
concat_cmd = [
    "ffmpeg", "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concat_txt,
    "-c", "copy",
    "-movflags", "+faststart",
    master_output
]
subprocess.run(concat_cmd, check=True)

# Also copy to refcanton_comprehensive_demo.mp4
shutil.copyfile(master_output, f"{OUTPUT_DIR}/refcanton_comprehensive_demo.mp4")
print("Demo video generation complete! Master walkthrough successfully rendered.")
