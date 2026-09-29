use crate::commands::invert::invert_pdf_sync;
use crate::engine::image_detector::ImageMode;
use crate::utils::error::VenomError;
use rayon::prelude::*;
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{Emitter, Window};

#[derive(Clone, Serialize, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BatchProgressPayload {
    pub id: String,
    pub file_path: String,
    pub file_name: String,
    pub current: usize,
    pub total: usize,
    pub progress: u32,
    pub status: String,
    pub error_message: Option<String>,
}

#[tauri::command]
pub async fn scan_folder_for_pdfs(folder_path: String) -> Result<Vec<String>, VenomError> {
    tokio::task::spawn_blocking(move || {
        let mut pdf_files = Vec::new();
        let path = Path::new(&folder_path);
        if path.is_dir() {
            if let Ok(entries) = std::fs::read_dir(path) {
                for entry in entries.flatten() {
                    let entry_path = entry.path();
                    if entry_path.is_file() {
                        if let Some(ext) = entry_path.extension() {
                            if ext.eq_ignore_ascii_case("pdf") {
                                pdf_files.push(entry_path.to_string_lossy().to_string());
                            }
                        }
                    }
                }
            }
        }
        pdf_files.sort();
        Ok(pdf_files)
    })
    .await
    .map_err(|e| VenomError::IoError(format!("Folder scan error: {}", e)))?
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
            let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("document.pdf").to_string();
            let out_file_name = format!("{}_{}.pdf", file_stem, theme_name.to_lowercase().replace(' ', "_"));
            let out_path = out_dir.join(out_file_name);
            let out_path_str = out_path.to_string_lossy().to_string();
            let job_id = format!("job_{}_{}", idx, file_stem);

            // Notify start of file processing
            let _ = window.emit(
                "batch-progress",
                BatchProgressPayload {
                    id: job_id.clone(),
                    file_path: path_str.clone(),
                    file_name: file_name.clone(),
                    current: idx + 1,
                    total,
                    progress: 25,
                    status: "processing".to_string(),
                    error_message: None,
                },
            );

            let (status, err_msg) = match invert_pdf_sync(path_str, &out_path_str, &theme_name, &image_mode, "all") {
                Ok(_) => ("done", None),
                Err(e) => ("error", Some(e.to_string())),
            };

            let _ = window.emit(
                "batch-progress",
                BatchProgressPayload {
                    id: job_id,
                    file_path: path_str.clone(),
                    file_name,
                    current: idx + 1,
                    total,
                    progress: 100,
                    status: status.to_string(),
                    error_message: err_msg,
                },
            );
        });
    })
    .await
    .map_err(|e| VenomError::IoError(format!("Batch execution error: {}", e)))?;

    Ok("Batch processing complete".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_scan_folder_for_pdfs() {
        let temp_dir = std::env::temp_dir().join("venom_batch_scan_test");
        let _ = std::fs::create_dir_all(&temp_dir);

        let pdf1 = temp_dir.join("file1.pdf");
        let pdf2 = temp_dir.join("file2.PDF");
        let txt = temp_dir.join("file3.txt");

        std::fs::write(&pdf1, b"%PDF-1.4 dummy").unwrap();
        std::fs::write(&pdf2, b"%PDF-1.4 dummy2").unwrap();
        std::fs::write(&txt, b"text file").unwrap();

        let scanned = scan_folder_for_pdfs(temp_dir.to_str().unwrap().to_string())
            .await
            .unwrap();

        assert_eq!(scanned.len(), 2);
        assert!(scanned.iter().any(|p| p.ends_with("file1.pdf")));
        assert!(scanned.iter().any(|p| p.ends_with("file2.PDF")));

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
