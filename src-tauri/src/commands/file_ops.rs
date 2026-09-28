use crate::utils::error::VenomError;

#[tauri::command]
pub async fn open_file_dialog() -> Result<Option<String>, VenomError> {
    Ok(None)
}
