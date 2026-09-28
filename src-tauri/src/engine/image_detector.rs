use crate::utils::error::VenomError;
use lopdf::{Dictionary, Object};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ImageMode {
    Preserve,
    Dim,
    FullInvert,
}

impl Default for ImageMode {
    fn default() -> Self {
        ImageMode::Preserve
    }
}

/// Checks if a dictionary describes a PDF raster Image XObject
pub fn is_image_xobject(dict: &Dictionary) -> bool {
    if let Ok(subtype) = dict.get(b"Subtype") {
        match subtype {
            Object::Name(name) => name == b"Image",
            _ => false,
        }
    } else {
        false
    }
}

/// Processes image data bytes based on the selected ImageMode
pub fn process_image_bytes(bytes: &[u8], mode: &ImageMode) -> Result<Vec<u8>, VenomError> {
    match mode {
        ImageMode::Preserve => Ok(bytes.to_vec()),

        ImageMode::Dim => {
            // Attempt to decode via image crate if encoded (e.g. JPEG/PNG)
            if let Ok(img) = image::load_from_memory(bytes) {
                let mut rgb = img.to_rgb8();
                for pixel in rgb.pixels_mut() {
                    pixel.0[0] = ((pixel.0[0] as f32) * 0.75).round() as u8;
                    pixel.0[1] = ((pixel.0[1] as f32) * 0.75).round() as u8;
                    pixel.0[2] = ((pixel.0[2] as f32) * 0.75).round() as u8;
                }
                let mut out_bytes = Vec::new();
                let mut cursor = std::io::Cursor::new(&mut out_bytes);
                if rgb.write_to(&mut cursor, image::ImageFormat::Jpeg).is_ok() {
                    return Ok(out_bytes);
                }
            }
            // Fallback for raw byte streams
            let dimmed = bytes
                .iter()
                .map(|&b| ((b as f32) * 0.75).min(255.0) as u8)
                .collect();
            Ok(dimmed)
        }

        ImageMode::FullInvert => {
            if let Ok(img) = image::load_from_memory(bytes) {
                let mut rgb = img.to_rgb8();
                for pixel in rgb.pixels_mut() {
                    pixel.0[0] = 255 - pixel.0[0];
                    pixel.0[1] = 255 - pixel.0[1];
                    pixel.0[2] = 255 - pixel.0[2];
                }
                let mut out_bytes = Vec::new();
                let mut cursor = std::io::Cursor::new(&mut out_bytes);
                if rgb.write_to(&mut cursor, image::ImageFormat::Jpeg).is_ok() {
                    return Ok(out_bytes);
                }
            }
            // Fallback for raw byte streams
            let inverted = bytes.iter().map(|&b| 255 - b).collect();
            Ok(inverted)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_image_mode_preserve() {
        let raw = vec![10, 50, 100, 200];
        let res = process_image_bytes(&raw, &ImageMode::Preserve).unwrap();
        assert_eq!(res, raw);
    }

    #[test]
    fn test_image_mode_dim() {
        let raw = vec![100, 200];
        let res = process_image_bytes(&raw, &ImageMode::Dim).unwrap();
        assert_eq!(res[0], 75);
        assert_eq!(res[1], 150);
    }

    #[test]
    fn test_image_mode_full_invert() {
        let raw = vec![0, 50, 255];
        let res = process_image_bytes(&raw, &ImageMode::FullInvert).unwrap();
        assert_eq!(res[0], 255);
        assert_eq!(res[1], 205);
        assert_eq!(res[2], 0);
    }

    #[test]
    fn test_is_image_xobject() {
        let mut dict = Dictionary::new();
        dict.set(b"Subtype".to_vec(), Object::Name(b"Image".to_vec()));
        assert!(is_image_xobject(&dict));

        let mut form_dict = Dictionary::new();
        form_dict.set(b"Subtype".to_vec(), Object::Name(b"Form".to_vec()));
        assert!(!is_image_xobject(&form_dict));
    }
}
