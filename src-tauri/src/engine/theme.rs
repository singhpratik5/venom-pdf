use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub name: String,
    pub background: [u8; 3],
    pub text: [u8; 3],
    pub accent: [u8; 3],
}

impl Theme {
    pub fn get_preset(name: &str) -> Option<Self> {
        match name.to_lowercase().as_str() {
            "charcoal" => Some(Theme {
                name: "Charcoal".into(),
                background: [30, 30, 30],
                text: [220, 220, 220],
                accent: [80, 160, 255],
            }),
            "oled black" | "oled" => Some(Theme {
                name: "OLED Black".into(),
                background: [0, 0, 0],
                text: [200, 200, 200],
                accent: [100, 100, 255],
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
            "nord" => Some(Theme {
                name: "Nord".into(),
                background: [46, 52, 64],
                text: [216, 222, 233],
                accent: [136, 192, 208],
            }),
            _ => None,
        }
    }
}
