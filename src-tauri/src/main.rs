#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use venom_pdf_lib::cli::{attach_parent_console, parse_args, run_cli, CliCommand};

fn main() {
    let args: Vec<String> = env::args().collect();

    match parse_args(&args) {
        Ok(CliCommand::LaunchGui { .. }) => {
            // Launch GUI desktop application
            venom_pdf_lib::run();
        }
        Ok(cmd) => {
            // Execute headless command-line mode
            let exit_code = run_cli(cmd);
            std::process::exit(exit_code);
        }
        Err(err) => {
            attach_parent_console();
            eprintln!("[Venom PDF] Error: {}", err);
            eprintln!("Run 'venom-pdf --help' for usage documentation.");
            std::process::exit(1);
        }
    }
}
