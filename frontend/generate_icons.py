#!/usr/bin/env python3
"""Generate placeholder icons for PWA"""

import os
from PIL import Image, ImageDraw

# Create icons directory
os.makedirs('icons', exist_ok=True)

def create_icon(size):
    """Create a simple gradient icon"""
    # Create image with gradient
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (approximation)
    for y in range(size):
        # Gradient from purple to blue
        r = int(102 + (102 - 102) * y / size)  # 102
        g = int(126 - (126 - 100) * y / size)  # 126 -> 100
        b = int(234 - (234 - 179) * y / size)  # 234 -> 179
        
        draw.rectangle([(0, y), (size, y+1)], fill=(r, g, b))
    
    # Draw package icon (🚚)
    draw.rectangle([(size//4, size//3), (3*size//4, 2*size//3)], 
                   outline='white', width=3)
    draw.rectangle([(size//4, size//2), (size//2, 2*size//3)], 
                   outline='white', width=2)
    draw.rectangle([(size//2, size//2), (3*size//4, 2*size//3)], 
                   outline='white', width=2)
    
    # Draw wheels
    draw.ellipse([(size//3, 2*size//3), (size//3+size//8, 2*size//3+size//8)], 
                 outline='white', width=2)
    draw.ellipse([(3*size//4-size//8, 2*size//3), (3*size//4, 2*size//3+size//8)], 
                 outline='white', width=2)
    
    return img

# Generate icons
print("🎨 Generating PWA icons...")

# 192x192
img_192 = create_icon(192)
img_192.save('icons/icon-192.png')
print("✅ Created: icons/icon-192.png (192x192)")

# 512x512
img_512 = create_icon(512)
img_512.save('icons/icon-512.png')
print("✅ Created: icons/icon-512.png (512x512)")

print("\n✨ Icons generated successfully!")
print("Refresh browser and icons should load without 404 errors")
