import numpy as np
from PIL import Image

def create_feathered_hero():
    img = Image.open('website/frontend/assets/img/hero_astro_forest_crisp.webp').convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    h, w, _ = arr.shape
    
    # We want everything to the left of the armillary sphere (x < 180) to be completely transparent
    # And fade smoothly from x=180 to x=420
    x = np.arange(w, dtype=np.float32)
    fade_start = 180.0
    fade_end = 420.0
    t = np.clip((x - fade_start) / (fade_end - fade_start), 0.0, 1.0)
    smooth_t = t * t * (3.0 - 2.0 * t)  # cubic smoothstep
    
    alpha_mask = np.tile(smooth_t, (h, 1)) * 255.0
    arr[:, :, 3] = alpha_mask
    
    result = Image.fromarray(arr.astype(np.uint8), mode='RGBA')
    result.save('website/frontend/assets/img/hero_astrologer_clean.webp', quality=95)
    print("SUCCESS: hero_astrologer_clean.webp created with perfect armillary fade!")

if __name__ == '__main__':
    create_feathered_hero()
