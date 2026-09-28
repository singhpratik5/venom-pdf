use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum VenomError {
    #[error("Failed to parse PDF: {0}")]
    PdfParse(String),
    
    #[error("Invalid page range: {0}")]
    InvalidPageRange(String),
    
    #[error("IO Error: {0}")]
    IoError(String),
    
    #[error("Image processing error: {0}")]
    ImageProcess(String),
    
    #[error("Theme not found: {0}")]
    ThemeNotFound(String),
}

impl From<std::io::Error> for VenomError {
    fn from(err: std::io::Error) -> Self {
        VenomError::IoError(err.to_string())
    }
}

impl From<lopdf::Error> for VenomError {
    fn from(err: lopdf::Error) -> Self {
        VenomError::PdfParse(err.to_string())
    }
}

impl Serialize for VenomError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
