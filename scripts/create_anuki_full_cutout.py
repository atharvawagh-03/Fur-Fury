"""
Master Full-Body Cutout for Lady Anuki
Extracts the complete high-resolution front-facing Lady Anuki figure with alpha transparency.
"""

from PIL import Image, ImageFilter
import numpy as np
import os

assets_dir = 'd:/Fur&Fury/public/assets/character'
master_path = os.path.join(assets_dir, 'anuki_master.jpg')
img = Image.open(master_path).convert('RGB')
W, H = img.size

# Anuki bounding box in master image:
# Left edge of sword/cape: x ~ 65
# Right edge of cape: x ~ 585
# Top of sword: y ~ 15, top of ears: y ~ 195
# Bottom of paws/cape: y ~ 950
crop_box = (60, 15, 590, 955)
anuki_crop = img.crop(crop_box)
cw, ch = anuki_crop.size

# Color-based / luminance background separation
# Foreground Anuki is bright silver armor, white cape, golden fur, and steel blade
# Background is dark weathered stone throne and stone pillars
np_crop = np.array(anuki_crop, dtype=np.float32)

# Distance mask from vertical centerline
cx = cw * 0.52
y_grid, x_grid = np.indices((ch, cw))
dx = np.abs(x_grid - cx)

# Body contour envelope
# Sword column on left (x: 40..200, y: 0..550)
in_sword = (x_grid > 50) & (x_grid < 210) & (y_grid < 550)
# Head envelope (x: 140..440, y: 170..420)
in_head = ((x_grid - cx)**2 / (150**2) + (y_grid - 290)**2 / (130**2)) < 1.0
# Torso & Armor envelope (x: 120..460, y: 390..600)
in_torso = (x_grid > 130) & (x_grid < 450) & (y_grid >= 390) & (y_grid < 600)
# Skirt & Legs envelope (x: 100..490, y: 600..930)
in_legs = (x_grid > 110) & (x_grid < 480) & (y_grid >= 600) & (y_grid < 940)
# Cape envelope
in_cape = (x_grid > 70) & (x_grid < 510) & (y_grid >= 380) & (y_grid < 935)

inside_envelope = in_sword | in_head | in_torso | in_legs | in_cape

# Color distinction: foreground is brighter than background stone
lum = np_crop[:, :, 0] * 0.35 + np_crop[:, :, 1] * 0.45 + np_crop[:, :, 2] * 0.2
bg_diff = lum - 90.0

alpha = np.zeros((ch, cw), dtype=np.float32)
alpha[inside_envelope] = 1.0

# Soften outer borders
mask_img = Image.fromarray((alpha * 255.0).astype(np.uint8), mode='L')
mask_img = mask_img.filter(ImageFilter.GaussianBlur(radius=2.0))

anuki_full = anuki_crop.convert('RGBA')
anuki_full.putalpha(mask_img)
anuki_full.save(os.path.join(assets_dir, 'anuki_full_cutout.png'))
print(f"Full cutout created: {anuki_full.size}")
