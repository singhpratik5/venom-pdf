use crate::utils::error::VenomError;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn open_file_dialog(app: AppHandle) -> Result<Option<String>, VenomError> {
    let file_path = app
        .dialog()
        .file()
        .add_filter("PDF Files", &["pdf"])
        .blocking_pick_file();

    Ok(file_path.map(|p| p.to_string()))
}

#[tauri::command]
pub async fn open_folder_dialog(app: AppHandle) -> Result<Option<String>, VenomError> {
    let folder_path = app
        .dialog()
        .file()
        .blocking_pick_folder();

    Ok(folder_path.map(|p| p.to_string()))
}
