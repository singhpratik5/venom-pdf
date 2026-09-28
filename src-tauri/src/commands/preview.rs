use crate::utils::error::VenomError;
use lopdf::Document;
use serde::Serialize;

#[derive(Serialize)]
pub struct PdfInfo {
    page_count: u32,
    has_images: bool,
    file_size: u64,
}

#[tauri::command]
pub async fn get_pdf_info(path: String) -> Result<PdfInfo, VenomError> {
    let doc = Document::load(&path)?;
    let pages = doc.get_pages();
    let meta = std::fs::metadata(&path)?;
    
    Ok(PdfInfo {
        page_count: pages.len() as u32,
        has_images: true, // Placeholder
        file_size: meta.len(),
    })
}
