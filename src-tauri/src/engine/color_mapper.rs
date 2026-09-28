use super::theme::Theme;

/// Maps a color to the theme based on luminance
pub(crate) fn map_color(r: f32, g: f32, b: f32, theme: &Theme) -> (f32, f32, f32) {
    let luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    if luminance > 0.9 {
        // Near-white -> background
        (
            theme.background[0] as f32 / 255.0,
            theme.background[1] as f32 / 255.0,
            theme.background[2] as f32 / 255.0,
        )
    } else if luminance < 0.1 {
        // Near-black -> text
        (
            theme.text[0] as f32 / 255.0,
            theme.text[1] as f32 / 255.0,
            theme.text[2] as f32 / 255.0,
        )
    } else {
        // Mid-tones -> invert lightness
        (1.0 - r, 1.0 - g, 1.0 - b)
    }
}
