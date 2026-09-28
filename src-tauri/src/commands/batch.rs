use crate::commands::invert::invert_pdf_sync;
use crate::engine::image_detector::ImageMode;
use crate::utils::error::VenomError;
use rayon::prelude::*;
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{Emitter, Window};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchProgressPayload {
    pub file_path: String,
    pub progress: u32,
    pub status: String,
}

#[tauri::command]
pub async fn batch_invert(
    window: Window,
    input_paths: Vec<String>,
    output_dir: String,
    theme_name: String,
    image_mode: ImageMode,
) -> Result<String, VenomError> {
    tokio::task::spawn_blocking(move || {
        let total = input_paths.len();
        let out_dir = PathBuf::from(&output_dir);
        let _ = std::fs::create_dir_all(&out_dir);

        input_paths.par_iter().enumerate().for_each(|(idx, path_str)| {
            let path = Path::new(path_str);
            let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("document");
            let out_file_name = format!("{}_dark.pdf", file_stem);
            let out_path = out_dir.join(out_file_name);
            let out_path_str = out_path.to_string_lossy().to_string();

            let status = match invert_pdf_sync(path_str, &out_path_str, &theme_name, &image_mode, "all") {
                Ok(_) => "done",
                Err(_) => "error",
            };

            let progress_percent = (((idx + 1) as f32 / total.max(1) as f32) * 100.0) as u32;

            let _ = window.emit(
                "batch-progress",
                BatchProgressPayload {
                    file_path: path_str.clone(),
                    progress: progress_percent,
                    status: status.to_string(),
                },
            );
        });
    })
    .await
    .map_err(|e| VenomError::IoError(format!("Batch execution error: {}", e)))?;

    Ok("Batch processing complete".to_string())
}
