use crate::utils::context_menu::ContextMenuManager;
use crate::utils::error::VenomError;

/// Checks if Venom PDF context menu is registered in Windows Explorer
#[tauri::command]
pub async fn check_context_menu_status() -> Result<bool, VenomError> {
    tokio::task::spawn_blocking(ContextMenuManager::is_registered)
        .await
        .map_err(|e| VenomError::ShellIntegration(format!("Failed to check status: {}", e)))
}

/// Enables and registers Venom PDF context menu in Windows Explorer
#[tauri::command]
pub async fn enable_context_menu() -> Result<String, VenomError> {
    tokio::task::spawn_blocking(ContextMenuManager::register)
        .await
        .map_err(|e| VenomError::ShellIntegration(format!("Task execution error: {}", e)))?
        .map_err(VenomError::ShellIntegration)
}

/// Disables and removes Venom PDF context menu from Windows Explorer
#[tauri::command]
pub async fn disable_context_menu() -> Result<String, VenomError> {
    tokio::task::spawn_blocking(ContextMenuManager::unregister)
        .await
        .map_err(|e| VenomError::ShellIntegration(format!("Task execution error: {}", e)))?
        .map_err(VenomError::ShellIntegration)
}
