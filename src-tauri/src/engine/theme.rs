use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Theme {
    pub name: String,
    pub background: [u8; 3],
    pub text: [u8; 3],
    pub accent: [u8; 3],
}

impl Theme {
    pub fn new(name: impl Into<String>, bg: [u8; 3], text: [u8; 3], accent: [u8; 3]) -> Self {
        Self {
            name: name.into(),
            background: bg,
            text,
            accent,
        }
    }

    pub fn parse_hex(hex: &str) -> Option<[u8; 3]> {
        let clean = hex.trim().trim_start_matches('#');
        if clean.len() == 6 {
            let r = u8::from_str_radix(&clean[0..2], 16).ok()?;
            let g = u8::from_str_radix(&clean[2..4], 16).ok()?;
            let b = u8::from_str_radix(&clean[4..6], 16).ok()?;
            Some([r, g, b])
        } else if clean.len() == 3 {
            let r = u8::from_str_radix(&clean[0..1].repeat(2), 16).ok()?;
            let g = u8::from_str_radix(&clean[1..2].repeat(2), 16).ok()?;
            let b = u8::from_str_radix(&clean[2..3].repeat(2), 16).ok()?;
            Some([r, g, b])
        } else {
            None
        }
    }

    pub fn from_hex(name: &str, bg: &str, text: &str, accent: &str) -> Option<Self> {
        Some(Theme {
            name: name.to_string(),
            background: Self::parse_hex(bg)?,
            text: Self::parse_hex(text)?,
            accent: Self::parse_hex(accent)?,
        })
    }

    pub fn get_preset(name: &str) -> Option<Self> {
        match name.trim().to_lowercase().as_str() {
            "venom dark" | "dark-default" | "charcoal" => Some(Theme {
                name: "Venom Dark".into(),
                background: [30, 30, 30],
                text: [212, 212, 212],
                accent: [57, 255, 20],
            }),
            "oled black" | "oled" => Some(Theme {
                name: "OLED Black".into(),
                background: [0, 0, 0],
                text: [240, 240, 240],
                accent: [57, 255, 20],
            }),
            "dracula" => Some(Theme {
                name: "Dracula".into(),
                background: [40, 42, 54],
                text: [248, 248, 242],
                accent: [255, 121, 198],
            }),
            "nord" => Some(Theme {
                name: "Nord".into(),
                background: [46, 52, 64],
                text: [236, 239, 244],
                accent: [136, 192, 208],
            }),
            "sepia" => Some(Theme {
                name: "Sepia".into(),
                background: [244, 236, 216],
                text: [91, 70, 54],
                accent: [200, 100, 50],
            }),
            "solarized" => Some(Theme {
                name: "Solarized".into(),
                background: [0, 43, 54],
                text: [131, 148, 150],
                accent: [181, 137, 0],
            }),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_hex() {
        assert_eq!(Theme::parse_hex("#1e1e1e"), Some([30, 30, 30]));
        assert_eq!(Theme::parse_hex("ffffff"), Some([255, 255, 255]));
        assert_eq!(Theme::parse_hex("#fff"), Some([255, 255, 255]));
        assert_eq!(Theme::parse_hex("#000"), Some([0, 0, 0]));
        assert_eq!(Theme::parse_hex("invalid"), None);
    }

    #[test]
    fn test_presets_exist() {
        assert!(Theme::get_preset("Venom Dark").is_some());
        assert!(Theme::get_preset("Charcoal").is_some());
        assert!(Theme::get_preset("dracula").is_some());
        assert!(Theme::get_preset("nord").is_some());
        assert!(Theme::get_preset("oled").is_some());
        assert!(Theme::get_preset("nonexistent").is_none());
    }
}
