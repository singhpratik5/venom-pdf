use lopdf::content::Operation;
use lopdf::Object;
use crate::engine::color_mapper::{map_color, map_cmyk, map_gray};
use crate::engine::theme::Theme;

fn object_to_f32(obj: &Object) -> Option<f32> {
    match obj {
        Object::Real(val) => Some(*val as f32),
        Object::Integer(val) => Some(*val as f32),
        _ => None,
    }
}

/// Generates PDF operations to paint a dark background rectangle over the full page dimensions
pub fn create_background_rect_operations(
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    theme: &Theme,
) -> Vec<Operation> {
    let r = theme.background[0] as f64 / 255.0;
    let g = theme.background[1] as f64 / 255.0;
    let b = theme.background[2] as f64 / 255.0;

    vec![
        Operation::new("q", vec![]),
        Operation::new("rg", vec![Object::Real(r), Object::Real(g), Object::Real(b)]),
        Operation::new(
            "re",
            vec![
                Object::Real(x),
                Object::Real(y),
                Object::Real(width),
                Object::Real(height),
            ],
        ),
        Operation::new("f", vec![]),
        Operation::new("Q", vec![]),
    ]
}

/// Processes a list of PDF operations and maps colors according to the theme
pub fn process_operations(operations: Vec<Operation>, theme: &Theme) -> Vec<Operation> {
    let mut new_ops = Vec::with_capacity(operations.len());

    for mut op in operations {
        match op.operator.as_str() {
            // RGB non-stroking (fill) color: r g b rg
            "rg" if op.operands.len() >= 3 => {
                if let (Some(r), Some(g), Some(b)) = (
                    object_to_f32(&op.operands[0]),
                    object_to_f32(&op.operands[1]),
                    object_to_f32(&op.operands[2]),
                ) {
                    let (mr, mg, mb) = map_color(r, g, b, theme);
                    op.operands = vec![
                        Object::Real(mr as f64),
                        Object::Real(mg as f64),
                        Object::Real(mb as f64),
                    ];
                }
                new_ops.push(op);
            }

            // RGB stroking color: r g b RG
            "RG" if op.operands.len() >= 3 => {
                if let (Some(r), Some(g), Some(b)) = (
                    object_to_f32(&op.operands[0]),
                    object_to_f32(&op.operands[1]),
                    object_to_f32(&op.operands[2]),
                ) {
                    let (mr, mg, mb) = map_color(r, g, b, theme);
                    op.operands = vec![
                        Object::Real(mr as f64),
                        Object::Real(mg as f64),
                        Object::Real(mb as f64),
                    ];
                }
                new_ops.push(op);
            }

            // Grayscale non-stroking: gray g -> convert to RGB rg with mapped color
            "g" if !op.operands.is_empty() => {
                if let Some(gray) = object_to_f32(&op.operands[0]) {
                    let (mr, mg, mb) = map_gray(gray, theme);
                    op.operator = "rg".to_string();
                    op.operands = vec![
                        Object::Real(mr as f64),
                        Object::Real(mg as f64),
                        Object::Real(mb as f64),
                    ];
                }
                new_ops.push(op);
            }

            // Grayscale stroking: gray G -> convert to RGB RG with mapped color
            "G" if !op.operands.is_empty() => {
                if let Some(gray) = object_to_f32(&op.operands[0]) {
                    let (mr, mg, mb) = map_gray(gray, theme);
                    op.operator = "RG".to_string();
                    op.operands = vec![
                        Object::Real(mr as f64),
                        Object::Real(mg as f64),
                        Object::Real(mb as f64),
                    ];
                }
                new_ops.push(op);
            }

            // CMYK non-stroking: c m y k k
            "k" if op.operands.len() >= 4 => {
                if let (Some(c), Some(m), Some(y), Some(k)) = (
                    object_to_f32(&op.operands[0]),
                    object_to_f32(&op.operands[1]),
                    object_to_f32(&op.operands[2]),
                    object_to_f32(&op.operands[3]),
                ) {
                    let (mc, mm, my, mk) = map_cmyk(c, m, y, k, theme);
                    op.operands = vec![
                        Object::Real(mc as f64),
                        Object::Real(mm as f64),
                        Object::Real(my as f64),
                        Object::Real(mk as f64),
                    ];
                }
                new_ops.push(op);
            }

            // CMYK stroking: c m y k K
            "K" if op.operands.len() >= 4 => {
                if let (Some(c), Some(m), Some(y), Some(k)) = (
                    object_to_f32(&op.operands[0]),
                    object_to_f32(&op.operands[1]),
                    object_to_f32(&op.operands[2]),
                    object_to_f32(&op.operands[3]),
                ) {
                    let (mc, mm, my, mk) = map_cmyk(c, m, y, k, theme);
                    op.operands = vec![
                        Object::Real(mc as f64),
                        Object::Real(mm as f64),
                        Object::Real(my as f64),
                        Object::Real(mk as f64),
                    ];
                }
                new_ops.push(op);
            }

            // Color in current colorspace (sc, scn, SC, SCN)
            "sc" | "scn" if op.operands.len() >= 3 => {
                if let (Some(r), Some(g), Some(b)) = (
                    object_to_f32(&op.operands[0]),
                    object_to_f32(&op.operands[1]),
                    object_to_f32(&op.operands[2]),
                ) {
                    let (mr, mg, mb) = map_color(r, g, b, theme);
                    op.operands[0] = Object::Real(mr as f64);
                    op.operands[1] = Object::Real(mg as f64);
                    op.operands[2] = Object::Real(mb as f64);
                }
                new_ops.push(op);
            }

            "SC" | "SCN" if op.operands.len() >= 3 => {
                if let (Some(r), Some(g), Some(b)) = (
                    object_to_f32(&op.operands[0]),
                    object_to_f32(&op.operands[1]),
                    object_to_f32(&op.operands[2]),
                ) {
                    let (mr, mg, mb) = map_color(r, g, b, theme);
                    op.operands[0] = Object::Real(mr as f64);
                    op.operands[1] = Object::Real(mg as f64);
                    op.operands[2] = Object::Real(mb as f64);
                }
                new_ops.push(op);
            }

            // Other operators pass through
            _ => new_ops.push(op),
        }
    }

    new_ops
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_theme() -> Theme {
        Theme {
            name: "Charcoal".into(),
            background: [30, 30, 30],
            text: [220, 220, 220],
            accent: [80, 160, 255],
        }
    }

    #[test]
    fn test_process_rgb_fill_inversion() {
        let theme = test_theme();
        // Black text: 0 0 0 rg
        let ops = vec![Operation::new(
            "rg",
            vec![Object::Real(0.0), Object::Real(0.0), Object::Real(0.0)],
        )];
        let processed = process_operations(ops, &theme);
        assert_eq!(processed.len(), 1);
        assert_eq!(processed[0].operator, "rg");
        if let Object::Real(r) = processed[0].operands[0] {
            assert!((r - 220.0 / 255.0).abs() < 1e-4);
        } else {
            panic!("Expected Real operand");
        }
    }

    #[test]
    fn test_process_grayscale_fill_conversion() {
        let theme = test_theme();
        // Black grayscale: 0 g -> should convert to rg with text color
        let ops = vec![Operation::new("g", vec![Object::Real(0.0)])];
        let processed = process_operations(ops, &theme);
        assert_eq!(processed.len(), 1);
        assert_eq!(processed[0].operator, "rg");
        if let Object::Real(r) = processed[0].operands[0] {
            assert!((r - 220.0 / 255.0).abs() < 1e-4);
        } else {
            panic!("Expected Real operand");
        }
    }

    #[test]
    fn test_background_rect_generation() {
        let theme = test_theme();
        let bg_ops = create_background_rect_operations(0.0, 0.0, 595.0, 842.0, &theme);
        assert_eq!(bg_ops.len(), 5);
        assert_eq!(bg_ops[0].operator, "q");
        assert_eq!(bg_ops[1].operator, "rg");
        assert_eq!(bg_ops[2].operator, "re");
        assert_eq!(bg_ops[3].operator, "f");
        assert_eq!(bg_ops[4].operator, "Q");
    }
}
