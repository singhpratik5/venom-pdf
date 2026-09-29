use crate::engine::image_detector::ImageMode;
use crate::utils::context_menu::ContextMenuManager;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};

/// Supported commands from CLI parsing
#[derive(Debug, PartialEq, Clone)]
pub enum CliCommand {
    Invert {
        input: String,
        output: Option<String>,
        theme: String,
        image_mode: ImageMode,
        pages: String,
    },
    Batch {
        directory: String,
        output_dir: Option<String>,
        theme: String,
        image_mode: ImageMode,
    },
    ListThemes,
    RegisterContextMenu,
    UnregisterContextMenu,
    Help,
    Version,
    LaunchGui {
        initial_file: Option<String>,
    },
}

/// Parses CLI string arguments into a CliCommand
pub fn parse_args(args: &[String]) -> Result<CliCommand, String> {
    if args.len() <= 1 {
        return Ok(CliCommand::LaunchGui { initial_file: None });
    }

    let tokens = &args[1..];

    // Check single-token shortcuts
    if tokens.len() == 1 {
        match tokens[0].as_str() {
            "-h" | "--help" | "help" => return Ok(CliCommand::Help),
            "-v" | "-V" | "--version" | "version" => return Ok(CliCommand::Version),
            "--list-themes" | "list-themes" => return Ok(CliCommand::ListThemes),
            "--register-menu" | "--register-context-menu" => return Ok(CliCommand::RegisterContextMenu),
            "--unregister-menu" | "--unregister-context-menu" => return Ok(CliCommand::UnregisterContextMenu),
            "--gui" => return Ok(CliCommand::LaunchGui { initial_file: None }),
            arg if !arg.starts_with('-') => {
                if arg.to_lowercase().ends_with(".pdf") {
                    return Ok(CliCommand::LaunchGui {
                        initial_file: Some(arg.to_string()),
                    });
                }
            }
            _ => {}
        }
    }

    let mut invert_input: Option<String> = None;
    let mut batch_dir: Option<String> = None;
    let mut output: Option<String> = None;
    let mut output_dir: Option<String> = None;
    let mut theme: String = "Venom Dark".to_string();
    let mut image_mode: ImageMode = ImageMode::Preserve;
    let mut pages: String = "all".to_string();
    let mut force_gui = false;
    let mut positional_files: Vec<String> = Vec::new();

    let mut i = 0;
    while i < tokens.len() {
        let token = &tokens[i];
        match token.as_str() {
            "-h" | "--help" => return Ok(CliCommand::Help),
            "-v" | "-V" | "--version" => return Ok(CliCommand::Version),
            "--list-themes" => return Ok(CliCommand::ListThemes),
            "--register-menu" | "--register-context-menu" => return Ok(CliCommand::RegisterContextMenu),
            "--unregister-menu" | "--unregister-context-menu" => return Ok(CliCommand::UnregisterContextMenu),
            "--gui" => {
                force_gui = true;
                i += 1;
            }
            "-i" | "--invert" => {
                i += 1;
                if i >= tokens.len() {
                    return Err("Missing argument for --invert <FILE>".to_string());
                }
                invert_input = Some(tokens[i].clone());
                i += 1;
            }
            "-b" | "--batch" => {
                i += 1;
                if i >= tokens.len() {
                    return Err("Missing argument for --batch <DIRECTORY>".to_string());
                }
                batch_dir = Some(tokens[i].clone());
                i += 1;
            }
            "-o" | "--output" => {
                i += 1;
                if i >= tokens.len() {
                    return Err("Missing argument for --output <FILE>".to_string());
                }
                output = Some(tokens[i].clone());
                i += 1;
            }
            "-d" | "--output-dir" => {
                i += 1;
                if i >= tokens.len() {
                    return Err("Missing argument for --output-dir <DIRECTORY>".to_string());
                }
                output_dir = Some(tokens[i].clone());
                i += 1;
            }
            "-t" | "--theme" => {
                i += 1;
                if i >= tokens.len() {
                    return Err("Missing argument for --theme <NAME>".to_string());
                }
                theme = tokens[i].clone();
                i += 1;
            }
            "-m" | "--image-mode" => {
                i += 1;
                if i >= tokens.len() {
                    return Err("Missing argument for --image-mode <preserve|dim|invert>".to_string());
                }
                match tokens[i].to_lowercase().as_str() {
                    "preserve" => image_mode = ImageMode::Preserve,
                    "dim" => image_mode = ImageMode::Dim,
                    "invert" | "full_invert" | "full-invert" => image_mode = ImageMode::FullInvert,
                    other => {
                        return Err(format!(
                            "Invalid image mode '{}'. Expected 'preserve', 'dim', or 'invert'",
                            other
                        ));
                    }
                }
                i += 1;
            }
            "-p" | "--pages" => {
                i += 1;
                if i >= tokens.len() {
                    return Err("Missing argument for --pages <RANGE>".to_string());
                }
                pages = tokens[i].clone();
                i += 1;
            }
            pos if !pos.starts_with('-') => {
                positional_files.push(pos.to_string());
                i += 1;
            }
            unknown => {
                return Err(format!(
                    "Unrecognized option '{}'. Run 'venom-pdf --help' for usage.",
                    unknown
                ));
            }
        }
    }

    if force_gui {
        return Ok(CliCommand::LaunchGui {
            initial_file: positional_files.into_iter().next().or(invert_input),
        });
    }

    if invert_input.is_some() && batch_dir.is_some() {
        return Err("Cannot specify both --invert and --batch at the same time".to_string());
    }

    if let Some(input) = invert_input {
        return Ok(CliCommand::Invert {
            input,
            output,
            theme,
            image_mode,
            pages,
        });
    }

    if let Some(directory) = batch_dir {
        return Ok(CliCommand::Batch {
            directory,
            output_dir,
            theme,
            image_mode,
        });
    }

    // If an unflagged PDF file was passed as positional argument (e.g. venom-pdf doc.pdf -t nord)
    if let Some(first_pos) = positional_files.into_iter().next() {
        if first_pos.to_lowercase().ends_with(".pdf") {
            return Ok(CliCommand::Invert {
                input: first_pos,
                output,
                theme,
                image_mode,
                pages,
            });
        }
    }

    Ok(CliCommand::LaunchGui { initial_file: None })
}

/// Attach to parent console on Windows so stdout/stderr print cleanly in CMD and PowerShell
#[cfg(windows)]
pub fn attach_parent_console() {
    unsafe {
        #[link(name = "kernel32")]
        extern "system" {
            fn AttachConsole(dwProcessId: u32) -> i32;
        }
        const ATTACH_PARENT_PROCESS: u32 = 0xFFFFFFFF;
        let _ = AttachConsole(ATTACH_PARENT_PROCESS);
    }
}

#[cfg(not(windows))]
pub fn attach_parent_console() {}

/// Formatted help screen
pub fn print_help() {
    println!(
        r#"
================================================================================
  VENOM PDF - High-Performance Native Dark Mode Engine
================================================================================

USAGE:
  venom-pdf [OPTIONS]
  venom-pdf --invert <FILE> [OPTIONS]
  venom-pdf --batch <DIR> [OPTIONS]

CORE ACTIONS:
  -i, --invert <PATH>          Invert a single PDF document in headless CLI mode
  -b, --batch <DIR>            Batch invert all PDF documents in a directory
  --list-themes                List all available dark mode color theme presets
  --register-menu              Register "Invert with Venom PDF" in Windows Explorer context menu
  --unregister-menu            Remove context menu entries from Windows registry
  -h, --help                   Display this help documentation
  -v, --version                Display Venom PDF version

INVERSION OPTIONS:
  -o, --output <PATH>          Output PDF destination path (default: <stem>_<theme>.pdf)
  -d, --output-dir <DIR>       Destination directory for batch mode (default: <dir>/venom_inverted)
  -t, --theme <NAME>           Color theme preset name (default: "Venom Dark")
                               Presets: "Venom Dark", "OLED Black", "Dracula", "Nord", "Sepia", "Solarized"
  -m, --image-mode <MODE>      Image treatment mode: preserve | dim | invert (default: preserve)
  -p, --pages <RANGE>          Page range filter: e.g. "all", "1", "1-5", "1,3,5-10" (default: "all")
  --gui                        Launch graphical desktop application

EXAMPLES:
  venom-pdf -i document.pdf
  venom-pdf -i paper.pdf -t "OLED Black" -m dim -o paper_dark.pdf
  venom-pdf -i book.pdf -p 1-10,15-20 -t Dracula
  venom-pdf -b "C:\MyDocs\PDFs" -d "C:\MyDocs\Inverted" -t Nord
  venom-pdf --register-menu
"#
    );
}

/// Print available themes
pub fn print_themes() {
    println!(
        r#"
================================================================================
  VENOM PDF - Available Color Themes
================================================================================

  • Venom Dark  (Default)
    High contrast dark charcoal (#1e1e1e) with neon venom accent (#39ff14).
    Best for everyday programming and document reading.

  • OLED Black
    Pitch black true black (#000000) with pure contrast.
    Optimized for OLED & AMOLED panels to achieve maximum battery savings.

  • Dracula
    Soft blue-purple background (#282a36) with pastel accents (#ff79c6).
    Relaxing, aesthetic dark mode based on the classic Dracula theme.

  • Nord
    Arctic dark slate-blue (#2e3440) with ice-blue accents (#88c0d0).
    Clean, focused, and distraction-free.

  • Sepia
    Warm muted cream/amber (#f4ecd8) with gentle coffee contrast (#5b4636).
    Ideal for nighttime reading without harsh contrast.

  • Solarized
    Precision dark cyan palette (#002b36) with gold accents (#b58900).
    Scientifically tuned color balance for prolonged reading.
"#
    );
}

/// Executes headless CLI commands and returns exit code (0 for success, 1 for error)
pub fn run_cli(cmd: CliCommand) -> i32 {
    attach_parent_console();

    match cmd {
        CliCommand::Help => {
            print_help();
            0
        }
        CliCommand::Version => {
            println!("Venom PDF v0.1.0 (Native PDF Dark Mode Engine)");
            0
        }
        CliCommand::ListThemes => {
            print_themes();
            0
        }
        CliCommand::RegisterContextMenu => {
            println!("[Venom PDF] Registering Windows Explorer context menu...");
            match ContextMenuManager::register() {
                Ok(msg) => {
                    println!("✓ {}", msg);
                    0
                }
                Err(err) => {
                    eprintln!("✗ Failed to register context menu: {}", err);
                    1
                }
            }
        }
        CliCommand::UnregisterContextMenu => {
            println!("[Venom PDF] Removing Windows Explorer context menu...");
            match ContextMenuManager::unregister() {
                Ok(msg) => {
                    println!("✓ {}", msg);
                    0
                }
                Err(err) => {
                    eprintln!("✗ Failed to unregister context menu: {}", err);
                    1
                }
            }
        }
        CliCommand::Invert {
            input,
            output,
            theme,
            image_mode,
            pages,
        } => {
            let in_path = Path::new(&input);
            if !in_path.exists() {
                eprintln!("[Venom PDF] Error: Input file does not exist: {}", input);
                return 1;
            }

            let out_path_buf = match output {
                Some(out) => PathBuf::from(out),
                None => {
                    let parent = in_path.parent().unwrap_or(Path::new(""));
                    let stem = in_path.file_stem().and_then(|s| s.to_str()).unwrap_or("document");
                    let clean_theme = theme.to_lowercase().replace(' ', "_");
                    parent.join(format!("{}_{}.pdf", stem, clean_theme))
                }
            };
            let out_str = out_path_buf.to_string_lossy().to_string();

            println!("[Venom PDF] Inverting document: {}", input);
            println!(
                "[Venom PDF] Palette: '{}' | Images: {:?} | Pages: {}",
                theme, image_mode, pages
            );

            let start = std::time::Instant::now();
            match crate::commands::invert::invert_pdf_sync(&input, &out_str, &theme, &image_mode, &pages) {
                Ok(_) => {
                    println!(
                        "✓ Successfully converted in {:.2?} -> {}",
                        start.elapsed(),
                        out_str
                    );
                    0
                }
                Err(err) => {
                    eprintln!("✗ Inversion failed: {}", err);
                    1
                }
            }
        }
        CliCommand::Batch {
            directory,
            output_dir,
            theme,
            image_mode,
        } => {
            let dir_path = Path::new(&directory);
            if !dir_path.is_dir() {
                eprintln!(
                    "[Venom PDF] Error: Directory does not exist or is not a folder: {}",
                    directory
                );
                return 1;
            }

            let out_dir_buf = match output_dir {
                Some(d) => PathBuf::from(d),
                None => dir_path.join("venom_inverted"),
            };
            if let Err(e) = std::fs::create_dir_all(&out_dir_buf) {
                eprintln!("[Venom PDF] Failed to create output directory: {}", e);
                return 1;
            }

            // Find all PDF files
            let mut pdf_files = Vec::new();
            if let Ok(entries) = std::fs::read_dir(dir_path) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_file() {
                        if let Some(ext) = p.extension() {
                            if ext.eq_ignore_ascii_case("pdf") {
                                pdf_files.push(p);
                            }
                        }
                    }
                }
            }
            pdf_files.sort();

            if pdf_files.is_empty() {
                println!("[Venom PDF] No PDF documents found in directory: {}", directory);
                return 0;
            }

            let total = pdf_files.len();
            println!(
                "[Venom PDF] Batch Inversion: {} PDF(s) found in '{}'",
                total, directory
            );
            println!(
                "[Venom PDF] Palette: '{}' | Images: {:?} | Destination: '{}'",
                theme,
                image_mode,
                out_dir_buf.display()
            );

            use rayon::prelude::*;
            let success_count = AtomicUsize::new(0);
            let fail_count = AtomicUsize::new(0);
            let start = std::time::Instant::now();

            pdf_files.par_iter().enumerate().for_each(|(idx, file_path)| {
                let stem = file_path.file_stem().and_then(|s| s.to_str()).unwrap_or("document");
                let clean_theme = theme.to_lowercase().replace(' ', "_");
                let out_file = out_dir_buf.join(format!("{}_{}.pdf", stem, clean_theme));
                let in_str = file_path.to_string_lossy().to_string();
                let out_str = out_file.to_string_lossy().to_string();
                let file_name = file_path.file_name().unwrap_or_default().to_string_lossy();

                match crate::commands::invert::invert_pdf_sync(&in_str, &out_str, &theme, &image_mode, "all") {
                    Ok(_) => {
                        println!("[{}/{}] ✓ Inverted: {}", idx + 1, total, file_name);
                        success_count.fetch_add(1, Ordering::SeqCst);
                    }
                    Err(err) => {
                        eprintln!("[{}/{}] ✗ Failed {}: {}", idx + 1, total, file_name, err);
                        fail_count.fetch_add(1, Ordering::SeqCst);
                    }
                }
            });

            let s = success_count.load(Ordering::SeqCst);
            let f = fail_count.load(Ordering::SeqCst);
            println!(
                "\n[Venom PDF] Batch complete in {:.2?}: {} succeeded, {} failed.\n[Venom PDF] Output directory: {}",
                start.elapsed(),
                s,
                f,
                out_dir_buf.display()
            );

            if f > 0 { 1 } else { 0 }
        }
        CliCommand::LaunchGui { .. } => 0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_empty_args_launches_gui() {
        let args = vec!["venom-pdf".to_string()];
        let cmd = parse_args(&args).unwrap();
        assert_eq!(cmd, CliCommand::LaunchGui { initial_file: None });
    }

    #[test]
    fn test_parse_help() {
        let args = vec!["venom-pdf".to_string(), "--help".to_string()];
        assert_eq!(parse_args(&args).unwrap(), CliCommand::Help);

        let args2 = vec!["venom-pdf".to_string(), "-h".to_string()];
        assert_eq!(parse_args(&args2).unwrap(), CliCommand::Help);
    }

    #[test]
    fn test_parse_version() {
        let args = vec!["venom-pdf".to_string(), "--version".to_string()];
        assert_eq!(parse_args(&args).unwrap(), CliCommand::Version);
    }

    #[test]
    fn test_parse_list_themes() {
        let args = vec!["venom-pdf".to_string(), "--list-themes".to_string()];
        assert_eq!(parse_args(&args).unwrap(), CliCommand::ListThemes);
    }

    #[test]
    fn test_parse_context_menu_flags() {
        let args1 = vec!["venom-pdf".to_string(), "--register-menu".to_string()];
        assert_eq!(parse_args(&args1).unwrap(), CliCommand::RegisterContextMenu);

        let args2 = vec!["venom-pdf".to_string(), "--unregister-menu".to_string()];
        assert_eq!(parse_args(&args2).unwrap(), CliCommand::UnregisterContextMenu);
    }

    #[test]
    fn test_parse_single_invert_defaults() {
        let args = vec![
            "venom-pdf".to_string(),
            "-i".to_string(),
            "sample.pdf".to_string(),
        ];
        let cmd = parse_args(&args).unwrap();
        assert_eq!(
            cmd,
            CliCommand::Invert {
                input: "sample.pdf".to_string(),
                output: None,
                theme: "Venom Dark".to_string(),
                image_mode: ImageMode::Preserve,
                pages: "all".to_string(),
            }
        );
    }

    #[test]
    fn test_parse_single_invert_full_options() {
        let args = vec![
            "venom-pdf".to_string(),
            "--invert".to_string(),
            "doc.pdf".to_string(),
            "--output".to_string(),
            "doc_out.pdf".to_string(),
            "--theme".to_string(),
            "OLED Black".to_string(),
            "--image-mode".to_string(),
            "dim".to_string(),
            "--pages".to_string(),
            "1-5,8".to_string(),
        ];
        let cmd = parse_args(&args).unwrap();
        assert_eq!(
            cmd,
            CliCommand::Invert {
                input: "doc.pdf".to_string(),
                output: Some("doc_out.pdf".to_string()),
                theme: "OLED Black".to_string(),
                image_mode: ImageMode::Dim,
                pages: "1-5,8".to_string(),
            }
        );
    }

    #[test]
    fn test_parse_batch_custom_options() {
        let args = vec![
            "venom-pdf".to_string(),
            "-b".to_string(),
            "C:\\MyPDFs".to_string(),
            "-d".to_string(),
            "C:\\MyPDFs\\Dark".to_string(),
            "-t".to_string(),
            "Nord".to_string(),
            "-m".to_string(),
            "invert".to_string(),
        ];
        let cmd = parse_args(&args).unwrap();
        assert_eq!(
            cmd,
            CliCommand::Batch {
                directory: "C:\\MyPDFs".to_string(),
                output_dir: Some("C:\\MyPDFs\\Dark".to_string()),
                theme: "Nord".to_string(),
                image_mode: ImageMode::FullInvert,
            }
        );
    }

    #[test]
    fn test_parse_unflagged_pdf() {
        let args = vec![
            "venom-pdf".to_string(),
            "my_document.pdf".to_string(),
            "-t".to_string(),
            "Sepia".to_string(),
        ];
        let cmd = parse_args(&args).unwrap();
        assert_eq!(
            cmd,
            CliCommand::Invert {
                input: "my_document.pdf".to_string(),
                output: None,
                theme: "Sepia".to_string(),
                image_mode: ImageMode::Preserve,
                pages: "all".to_string(),
            }
        );
    }

    #[test]
    fn test_parse_conflicting_invert_and_batch_errors() {
        let args = vec![
            "venom-pdf".to_string(),
            "-i".to_string(),
            "file.pdf".to_string(),
            "-b".to_string(),
            "C:\\folder".to_string(),
        ];
        assert!(parse_args(&args).is_err());
    }

    #[test]
    fn test_parse_invalid_image_mode_errors() {
        let args = vec![
            "venom-pdf".to_string(),
            "-i".to_string(),
            "file.pdf".to_string(),
            "-m".to_string(),
            "super_dim".to_string(),
        ];
        assert!(parse_args(&args).is_err());
    }
}
