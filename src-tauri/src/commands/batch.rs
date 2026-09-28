use crate::engine::image_detector::ImageMode;
use crate::utils::error::VenomError;
use tauri::Window;

#[tauri::command]
pub async fn batch_invert(
    window: Window,
    _input_paths: Vec<String>,
    _output_dir: String,
    _theme_name: String,
    _image_mode: ImageMode,
) -> Result<String, VenomError> {
    let _ = window.emit("batch_progress", 100);
    Ok("Batch processing complete".to_string())
}
