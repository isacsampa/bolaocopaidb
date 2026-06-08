import sys
from PIL import Image

try:
    img = Image.open("logo fifa.png")
    print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
    
    # Check if there is transparency
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        print("Image has transparency channel.")
    else:
        print("Image is fully opaque.")
        
    # Get a sample of pixels from the corners and center
    # Let's print the colors of some key positions:
    # Corner (0,0) - likely background
    print("Corner (0,0) pixel:", img.getpixel((0,0)))
    # Near top center (125, 50) - likely part of the top "2" shape
    print("Top shape (125, 50) pixel:", img.getpixel((125, 50)))
    # Center (125, 193) - likely trophy or space in between
    print("Center (125, 193) pixel:", img.getpixel((125, 193)))
    # Bottom (125, 360) - likely part of the bottom "6" shape or FIFA text
    print("Bottom shape (125, 360) pixel:", img.getpixel((125, 360)))
    
except Exception as e:
    print("Error reading image:", e)
