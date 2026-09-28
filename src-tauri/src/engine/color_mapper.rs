use super::theme::Theme;

/// Converts RGB [0.0, 1.0] to HSL (h: [0.0, 360.0], s: [0.0, 1.0], l: [0.0, 1.0])
pub fn rgb_to_hsl(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    let r = r.clamp(0.0, 1.0);
    let g = g.clamp(0.0, 1.0);
    let b = b.clamp(0.0, 1.0);

    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let delta = max - min;

    let l = (max + min) / 2.0;

    if delta.abs() < 1e-5 {
        return (0.0, 0.0, l);
    }

    let s = if l > 0.5 {
        delta / (2.0 - max - min)
    } else {
        delta / (max + min)
    };

    let mut h = if (max - r).abs() < 1e-5 {
        ((g - b) / delta) % 6.0
    } else if (max - g).abs() < 1e-5 {
        ((b - r) / delta) + 2.0
    } else {
        ((r - g) / delta) + 4.0
    } * 60.0;

    if h < 0.0 {
        h += 360.0;
    }

    (h, s.clamp(0.0, 1.0), l.clamp(0.0, 1.0))
}

/// Converts HSL (h: [0.0, 360.0], s: [0.0, 1.0], l: [0.0, 1.0]) back to RGB [0.0, 1.0]
pub fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (f32, f32, f32) {
    let h = ((h % 360.0) + 360.0) % 360.0;
    let s = s.clamp(0.0, 1.0);
    let l = l.clamp(0.0, 1.0);

    if s.abs() < 1e-5 {
        return (l, l, l);
    }

    let c = (1.0 - (2.0 * l - 1.0).abs()) * s;
    let x = c * (1.0 - (((h / 60.0) % 2.0) - 1.0).abs());
    let m = l - c / 2.0;

    let (r_prime, g_prime, b_prime) = match h {
        h if h < 60.0 => (c, x, 0.0),
        h if h < 120.0 => (x, c, 0.0),
        h if h < 180.0 => (0.0, c, x),
        h if h < 240.0 => (0.0, x, c),
        h if h < 300.0 => (x, 0.0, c),
        _ => (c, 0.0, x),
    };

    (
        (r_prime + m).clamp(0.0, 1.0),
        (g_prime + m).clamp(0.0, 1.0),
        (b_prime + m).clamp(0.0, 1.0),
    )
}

/// Standard perceived luminance calculation (Rec. 601)
pub fn calculate_luminance(r: f32, g: f32, b: f32) -> f32 {
    0.299 * r.clamp(0.0, 1.0) + 0.587 * g.clamp(0.0, 1.0) + 0.114 * b.clamp(0.0, 1.0)
}

/// Maps an RGB color to the target dark theme intelligently
pub fn map_color(r: f32, g: f32, b: f32, theme: &Theme) -> (f32, f32, f32) {
    let r = r.clamp(0.0, 1.0);
    let g = g.clamp(0.0, 1.0);
    let b = b.clamp(0.0, 1.0);
    let lum = calculate_luminance(r, g, b);

    let bg = (
        theme.background[0] as f32 / 255.0,
        theme.background[1] as f32 / 255.0,
        theme.background[2] as f32 / 255.0,
    );
    let fg = (
        theme.text[0] as f32 / 255.0,
        theme.text[1] as f32 / 255.0,
        theme.text[2] as f32 / 255.0,
    );

    if lum > 0.85 {
        // Light paper / background -> target theme background
        bg
    } else if lum < 0.15 {
        // Dark ink / standard black text -> target theme text
        fg
    } else {
        let (h, s, l) = rgb_to_hsl(r, g, b);

        if s < 0.12 {
            // Near-neutral gray: interpolate between foreground text and background
            let inverted_lum = 1.0 - lum;
            (
                bg.0 + inverted_lum * (fg.0 - bg.0),
                bg.1 + inverted_lum * (fg.1 - bg.1),
                bg.2 + inverted_lum * (fg.2 - bg.2),
            )
        } else {
            // Chromatic mid-tone: preserve hue, invert and adjust lightness for dark background
            let target_l = ((1.0 - l) * 0.70 + 0.22).clamp(0.2, 0.88);
            let target_s = (s * 0.90).clamp(0.0, 1.0);
            hsl_to_rgb(h, target_s, target_l)
        }
    }
}

/// Maps a CMYK color through the theme and returns mapped CMYK
pub fn map_cmyk(c: f32, m: f32, y: f32, k: f32, theme: &Theme) -> (f32, f32, f32, f32) {
    let c = c.clamp(0.0, 1.0);
    let m = m.clamp(0.0, 1.0);
    let y = y.clamp(0.0, 1.0);
    let k = k.clamp(0.0, 1.0);

    // CMYK to RGB
    let r = (1.0 - c) * (1.0 - k);
    let g = (1.0 - m) * (1.0 - k);
    let b = (1.0 - y) * (1.0 - k);

    // Map RGB through theme
    let (mr, mg, mb) = map_color(r, g, b, theme);

    // RGB back to CMYK
    let mk = 1.0 - mr.max(mg).max(mb);
    if mk >= 0.999 {
        return (0.0, 0.0, 0.0, 1.0);
    }
    let mc = (1.0 - mr - mk) / (1.0 - mk);
    let mm = (1.0 - mg - mk) / (1.0 - mk);
    let my = (1.0 - mb - mk) / (1.0 - mk);

    (
        mc.clamp(0.0, 1.0),
        mm.clamp(0.0, 1.0),
        my.clamp(0.0, 1.0),
        mk.clamp(0.0, 1.0),
    )
}

/// Maps a single grayscale value to an RGB color for the theme
pub fn map_gray(g: f32, theme: &Theme) -> (f32, f32, f32) {
    map_color(g, g, g, theme)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_theme() -> Theme {
        Theme {
            name: "Charcoal".into(),
            background: [30, 30, 30],
            text: [220, 220, 220],
            accent: [80, 160, 255],
        }
    }

    #[test]
    fn test_white_maps_to_background() {
        let theme = sample_theme();
        let (r, g, b) = map_color(1.0, 1.0, 1.0, &theme);
        assert!((r - 30.0 / 255.0).abs() < 1e-4);
        assert!((g - 30.0 / 255.0).abs() < 1e-4);
        assert!((b - 30.0 / 255.0).abs() < 1e-4);
    }

    #[test]
    fn test_black_maps_to_text() {
        let theme = sample_theme();
        let (r, g, b) = map_color(0.0, 0.0, 0.0, &theme);
        assert!((r - 220.0 / 255.0).abs() < 1e-4);
        assert!((g - 220.0 / 255.0).abs() < 1e-4);
        assert!((b - 220.0 / 255.0).abs() < 1e-4);
    }

    #[test]
    fn test_hsl_roundtrip() {
        let original = (0.25f32, 0.70f32, 0.40f32);
        let (h, s, l) = rgb_to_hsl(original.0, original.1, original.2);
        let (r, g, b) = hsl_to_rgb(h, s, l);
        assert!((r - original.0).abs() < 0.01);
        assert!((g - original.1).abs() < 0.01);
        assert!((b - original.2).abs() < 0.01);
    }

    #[test]
    fn test_mid_tone_hue_preserved() {
        let theme = sample_theme();
        // A saturated blue color
        let (orig_h, _, _) = rgb_to_hsl(0.1, 0.3, 0.8);
        let (mr, mg, mb) = map_color(0.1, 0.3, 0.8, &theme);
        let (mapped_h, _, _) = rgb_to_hsl(mr, mg, mb);
        assert!((orig_h - mapped_h).abs() < 3.0);
    }

    #[test]
    fn test_cmyk_black_inversion() {
        let theme = sample_theme();
        // Pure CMYK black: (0, 0, 0, 1)
        let (c, m, y, k) = map_cmyk(0.0, 0.0, 0.0, 1.0, &theme);
        // Should invert to a light color (low K)
        assert!(k < 0.3);
        assert!(c < 0.5 && m < 0.5 && y < 0.5);
    }
}
