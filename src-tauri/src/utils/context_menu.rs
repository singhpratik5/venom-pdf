use std::path::PathBuf;
#[cfg(windows)]
use std::process::Command;

/// Manager for Windows File Explorer context menu integration
pub struct ContextMenuManager;

impl ContextMenuManager {
    /// Gets the current running executable's path
    pub fn get_exe_path() -> Result<PathBuf, String> {
        std::env::current_exe().map_err(|e| format!("Failed to determine executable path: {}", e))
    }

    /// Registers "Invert with Venom PDF" in Windows Explorer context menu for PDF files and directories.
    /// Uses HKCU (HKEY_CURRENT_USER) so no Administrator privileges are required.
    #[cfg(windows)]
    pub fn register() -> Result<String, String> {
        let exe_path = Self::get_exe_path()?;
        let exe_str = exe_path.to_string_lossy().to_string();

        // 1. Register Single PDF Right-Click Invert:
        // HKCU\Software\Classes\SystemFileAssociations\.pdf\shell\VenomPDF
        let menu_title = "Invert with Venom PDF (Dark Mode)";
        let icon_val = format!("\"{}\",0", exe_str);
        let command_val = format!("\"{}\" --invert \"%1\"", exe_str);

        let pdf_key = r"HKCU\Software\Classes\SystemFileAssociations\.pdf\shell\VenomPDF";
        let pdf_cmd_key = format!(r"{}\command", pdf_key);

        Self::run_reg(&["add", pdf_key, "/ve", "/d", menu_title, "/f"])?;
        Self::run_reg(&["add", pdf_key, "/v", "Icon", "/d", &icon_val, "/f"])?;
        Self::run_reg(&["add", &pdf_cmd_key, "/ve", "/d", &command_val, "/f"])?;

        // 2. Register Folder Right-Click Batch Invert:
        // HKCU\Software\Classes\Directory\shell\VenomPDFBatch
        let batch_title = "Batch Invert PDFs with Venom PDF";
        let batch_command_val = format!("\"{}\" --batch \"%1\"", exe_str);

        let dir_key = r"HKCU\Software\Classes\Directory\shell\VenomPDFBatch";
        let dir_cmd_key = format!(r"{}\command", dir_key);

        Self::run_reg(&["add", dir_key, "/ve", "/d", batch_title, "/f"])?;
        Self::run_reg(&["add", dir_key, "/v", "Icon", "/d", &icon_val, "/f"])?;
        Self::run_reg(&["add", &dir_cmd_key, "/ve", "/d", &batch_command_val, "/f"])?;

        Ok("Windows Explorer context menu successfully registered! Right-click any PDF or directory in File Explorer.".to_string())
    }

    /// Unregisters and removes all Venom PDF context menu entries from HKCU.
    #[cfg(windows)]
    pub fn unregister() -> Result<String, String> {
        let pdf_key = r"HKCU\Software\Classes\SystemFileAssociations\.pdf\shell\VenomPDF";
        let dir_key = r"HKCU\Software\Classes\Directory\shell\VenomPDFBatch";

        let _ = Self::run_reg(&["delete", pdf_key, "/f"]);
        let _ = Self::run_reg(&["delete", dir_key, "/f"]);

        Ok("Windows Explorer context menu entries successfully removed.".to_string())
    }

    /// Checks if the context menu entry is currently registered in HKCU.
    #[cfg(windows)]
    pub fn is_registered() -> bool {
        let pdf_key = r"HKCU\Software\Classes\SystemFileAssociations\.pdf\shell\VenomPDF";
        match Command::new("reg").args(["query", pdf_key]).output() {
            Ok(output) => output.status.success(),
            Err(_) => false,
        }
    }

    #[cfg(not(windows))]
    pub fn register() -> Result<String, String> {
        Ok("Context menu integration is currently supported on Windows.".to_string())
    }

    #[cfg(not(windows))]
    pub fn unregister() -> Result<String, String> {
        Ok("Context menu integration is currently supported on Windows.".to_string())
    }

    #[cfg(not(windows))]
    pub fn is_registered() -> bool {
        false
    }

    #[cfg(windows)]
    fn run_reg(args: &[&str]) -> Result<(), String> {
        let output = Command::new("reg")
            .args(args)
            .output()
            .map_err(|e| format!("Failed to execute reg.exe: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Registry command failed: {}", stderr));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exe_path_resolution() {
        let path = ContextMenuManager::get_exe_path();
        assert!(path.is_ok());
    }
}
