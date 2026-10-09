"""
Refined Alpha Mask Generator for Lady Anuki's Head and Accessories
Generates crisp, photorealistic transparent PNGs for 3D mapping.
"""

from PIL import Image, ImageFilter, ImageOps
import numpy as np
import os

assets_dir = 'd:/Fur&Fury/public/assets/character'
master_path = os.path.join(assets_dir, 'anuki_master.jpg')
img_master = Image.open(master_path).convert('RGB')

# Head coordinates:
# Left ear tip: x ~ 215, y ~ 205
# Right ear tip (with bow): x ~ 485, y ~ 205
# Chin: x ~ 340, y ~ 425
head_crop = img_master.crop((205, 195, 495, 430))
w, h = head_crop.size

# We can create an accurate alpha mask
# Notice the background behind Anuki's head in anuki_master is dark brown stone throne
np_head = np.array(head_crop, dtype=np.float32)

# Distance from center
center_x = w / 2.0
center_y = h / 2.0 + 15

# Create elliptical / contoured base mask
mask = np.zeros((h, w), dtype=np.float32)
y_indices, x_indices = np.indices((h, w))

# Normalize coordinates
nx = (x_indices - center_x) / (w * 0.44)
ny = (y_indices - center_y) / (h * 0.44)
dist_sq = nx * nx + ny * ny

# Base head ellipse
mask = np.clip(1.0 - (dist_sq - 0.75) / 0.35, 0.0, 1.0)

# Include ear regions
# Left ear (image left, Anuki's right ear)
ear_l_x = (x_indices - (w * 0.28)) / (w * 0.16)
ear_l_y = (y_indices - (h * 0.25)) / (h * 0.22)
dist_ear_l = ear_l_x * ear_l_x + ear_l_y * ear_l_y
mask = np.maximum(mask, np.clip(1.0 - (dist_ear_l - 0.7) / 0.4, 0.0, 1.0))

# Right ear + pink bow (image right, Anuki's left ear)
ear_r_x = (x_indices - (w * 0.74)) / (w * 0.20)
ear_r_y = (y_indices - (h * 0.26)) / (h * 0.24)
dist_ear_r = ear_r_x * ear_r_x + ear_r_y * ear_r_y
mask = np.maximum(mask, np.clip(1.0 - (dist_ear_r - 0.75) / 0.4, 0.0, 1.0))

# Edge thresholding to preserve fur hair strands
# The cat fur is bright golden/cream (R > 180, G > 140) whereas background stone is darker (R < 130, G < 110)
brightness = np_head[:, :, 0] * 0.5 + np_head[:, :, 1] * 0.4 + np_head[:, :, 2] * 0.1
bg_factor = np.clip((brightness - 95.0) / 45.0, 0.0, 1.0)

# Outer margin
outer_margin = np.clip(1.0 - (dist_sq - 0.95) / 0.4, 0.0, 1.0)
final_alpha = np.where(dist_sq < 0.65, 1.0, mask * bg_factor * outer_margin)
final_alpha = np.clip(final_alpha * 255.0, 0.0, 255.0).astype(np.uint8)

mask_img = Image.fromarray(final_alpha, mode='L')
mask_img = mask_img.filter(ImageFilter.GaussianBlur(radius=1.5))

head_rgba = head_crop.convert('RGBA')
head_rgba.putalpha(mask_img)
head_rgba.save(os.path.join(assets_dir, 'anuki_head_alpha.png'))
print(f"Refined anuki_head_alpha.png created successfully: {head_rgba.size}")

# Also extract full body from crowd pose (anuki_pose_crowd.jpg)
img_crowd = Image.open(os.path.join(assets_dir, 'anuki_pose_crowd.jpg')).convert('RGB')
W_c, H_c = img_crowd.size
print(f"Crowd size: {W_c}x{H_c}")

# Lady Anuki is in the center foreground: x: 190 to 510, y: 320 to 800
crowd_anuki = img_crowd.crop((190, 315, 510, 805))
crowd_anuki.save(os.path.join(assets_dir, 'anuki_body_crowd.png'))
print(f"Crowd Anuki body saved: {crowd_anuki.size}")
