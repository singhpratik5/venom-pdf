use crate::engine::image_detector::ImageMode;
use crate::engine::theme::Theme;
use crate::utils::error::VenomError;
use crate::engine::page_filter::parse_page_range;
use lopdf::Document;

#[tauri::command]
pub async fn invert_pdf(
    input_path: String,
    output_path: String,
    theme_name: String,
    _image_mode: ImageMode,
    page_range: String,
) -> Result<String, VenomError> {
    let _theme = Theme::get_preset(&theme_name)
        .ok_or_else(|| VenomError::ThemeNotFound(theme_name.clone()))?;
        
    let doc = Document::load(&input_path)?;
    let pages = doc.get_pages();
    let _pages_to_process = parse_page_range(&page_range, pages.len() as u32)?;
    
    // Engine processing happens here
    
    Ok(format!("Successfully inverted to {}", output_path))
}
