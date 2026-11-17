import numpy as np
from PIL import Image

def shift_colors():
    img = Image.open('website/frontend/assets/img/hero_astro_crisp.webp').convert('RGB')
    arr = np.array(img, dtype=np.float32)
    
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    delta = max_c - min_c
    
    h = np.zeros_like(max_c)
    mask = delta > 0
    
    idx = mask & (max_c == r)
    h[idx] = (60 * ((g[idx] - b[idx]) / delta[idx]) + 360) % 360
    idx = mask & (max_c == g)
    h[idx] = (60 * ((b[idx] - r[idx]) / delta[idx]) + 120) % 360
    idx = mask & (max_c == b)
    h[idx] = (60 * ((r[idx] - g[idx]) / delta[idx]) + 240) % 360
    
    s = np.zeros_like(max_c)
    s[max_c > 0] = delta[max_c > 0] / max_c[max_c > 0]
    v = max_c / 255.0
    
    # Target purple/plum fabric (shawl and runner)
    # Magenta/plum is roughly hue 270 to 355
    purple_mask = (h >= 270) & (h <= 355) & (s > 0.12)
    
    # We want to change the hue of these pixels to forest green (140 - 150 deg)
    # Target green: hue ~ 145, saturation ~ 0.55, keep value roughly similar or slightly darker
    h_new = h.copy()
    h_new[purple_mask] = 145.0
    
    s_new = s.copy()
    s_new[purple_mask] = np.clip(s[purple_mask] * 1.1, 0.25, 0.65)
    
    v_new = v.copy()
    v_new[purple_mask] = np.clip(v[purple_mask] * 0.95, 0.12, 0.55)
    
    # Convert HSV back to RGB
    c = v_new * s_new
    x = c * (1 - np.abs((h_new / 60.0) % 2 - 1))
    m = v_new - c
    
    r_new = np.zeros_like(h_new)
    g_new = np.zeros_like(h_new)
    b_new = np.zeros_like(h_new)
    
    # Sector 0: 0 <= h < 60
    s0 = (h_new >= 0) & (h_new < 60)
    r_new[s0], g_new[s0], b_new[s0] = c[s0], x[s0], 0
    # Sector 1: 60 <= h < 120
    s1 = (h_new >= 60) & (h_new < 120)
    r_new[s1], g_new[s1], b_new[s1] = x[s1], c[s1], 0
    # Sector 2: 120 <= h < 180
    s2 = (h_new >= 120) & (h_new < 180)
    r_new[s2], g_new[s2], b_new[s2] = 0, c[s2], x[s2]
    # Sector 3: 180 <= h < 240
    s3 = (h_new >= 180) & (h_new < 240)
    r_new[s3], g_new[s3], b_new[s3] = 0, x[s3], c[s3]
    # Sector 4: 240 <= h < 300
    s4 = (h_new >= 240) & (h_new < 300)
    r_new[s4], g_new[s4], b_new[s4] = x[s4], 0, c[s4]
    # Sector 5: 300 <= h < 360
    s5 = (h_new >= 300) & (h_new < 360)
    r_new[s5], g_new[s5], b_new[s5] = c[s5], 0, x[s5]
    
    rgb_out = np.stack([
        np.clip((r_new + m) * 255.0, 0, 255),
        np.clip((g_new + m) * 255.0, 0, 255),
        np.clip((b_new + m) * 255.0, 0, 255)
    ], axis=-1).astype(np.uint8)
    
    result = Image.fromarray(rgb_out)
    result.save('website/frontend/assets/img/hero_astro_forest_crisp.webp', quality=95)
    print("SUCCESS: hero_astro_forest_crisp.webp saved successfully!")

if __name__ == '__main__':
    shift_colors()
