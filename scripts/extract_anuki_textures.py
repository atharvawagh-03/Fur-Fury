"""
Asset Extraction Script for Lady Anuki
Extracts high-resolution, photorealistic textures directly from the authoritative reference artwork.
"""

from PIL import Image, ImageFilter
import os

assets_dir = 'd:/Fur&Fury/public/assets/character'
master_path = os.path.join(assets_dir, 'anuki_master.jpg')
crowd_path = os.path.join(assets_dir, 'anuki_pose_crowd.jpg')

img_master = Image.open(master_path).convert('RGBA')
img_crowd = Image.open(crowd_path).convert('RGBA')

W_m, H_m = img_master.size
print(f"Master size: {W_m}x{H_m}")

# 1. Exact Head & Face Crop from anuki_master.jpg
# Kitten head is centered horizontally: x approx 205 to 495, y approx 195 to 430
head_box = (205, 195, 495, 430)
head_img = img_master.crop(head_box)
head_img.save(os.path.join(assets_dir, 'anuki_head_raw.png'))
print(f"Head crop saved: {head_img.size}")

# Create an alpha mask with soft feathered edges for the head
mask = Image.new('L', head_img.size, 0)
from PIL import ImageDraw
draw = ImageDraw.Draw(mask)
# Draw an ellipse matching the head contour with ears
w_h, h_h = head_img.size
# Oval for face
draw.ellipse((20, 30, w_h - 20, h_h - 10), fill=255)
# Left ear (with pink bow)
draw.polygon([(w_h - 120, 100), (w_h - 10, 8), (w_h - 40, 130)], fill=255)
# Right ear
draw.polygon([(120, 100), (10, 8), (40, 130)], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(radius=6))

head_masked = head_img.copy()
head_masked.putalpha(mask)
head_masked.save(os.path.join(assets_dir, 'anuki_head_feathered.png'))

# 2. Extract Exact Cuirass & Belt
cuirass_box = (250, 410, 485, 595)
cuirass_img = img_master.crop(cuirass_box)
cuirass_img.save(os.path.join(assets_dir, 'anuki_cuirass.png'))
print(f"Cuirass crop saved: {cuirass_img.size}")

# 3. Extract Exact Chainmail Skirt
chainmail_box = (260, 580, 475, 760)
chainmail_img = img_master.crop(chainmail_box)
chainmail_img.save(os.path.join(assets_dir, 'anuki_chainmail.png'))
print(f"Chainmail crop saved: {chainmail_img.size}")

# 4. Extract Exact Leg Greaves & Sabatons
greaves_box = (220, 750, 520, 955)
greaves_img = img_master.crop(greaves_box)
greaves_img.save(os.path.join(assets_dir, 'anuki_greaves.png'))
print(f"Greaves crop saved: {greaves_img.size}")

# 5. Extract Exact Moonfang Sword
sword_box = (130, 15, 330, 540)
sword_img = img_master.crop(sword_box)
sword_img.save(os.path.join(assets_dir, 'anuki_sword.png'))
print(f"Sword crop saved: {sword_img.size}")

# 6. Extract Seamless Fur Texture from round cheek area
cheek_box = (220, 270, 310, 360)
fur_img = img_master.crop(cheek_box)
fur_img = fur_img.resize((256, 256), Image.Resampling.LANCZOS)
fur_img.save(os.path.join(assets_dir, 'anuki_fur_photo.png'))
print(f"Fur photo texture saved: {fur_img.size}")

# 7. Extract Exact Pink Bow
bow_box = (400, 220, 470, 290)
bow_img = img_master.crop(bow_box)
bow_img.save(os.path.join(assets_dir, 'anuki_bow.png'))
print(f"Pink bow crop saved: {bow_img.size}")

print("All photo-realistic texture maps extracted successfully!")
