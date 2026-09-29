pub mod cli;
pub mod commands;
pub mod engine;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::invert::invert_pdf,
            commands::batch::batch_invert,
            commands::batch::scan_folder_for_pdfs,
            commands::preview::get_pdf_info,
            commands::file_ops::open_file_dialog,
            commands::file_ops::open_folder_dialog,
            commands::os_integration::check_context_menu_status,
            commands::os_integration::enable_context_menu,
            commands::os_integration::disable_context_menu,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
