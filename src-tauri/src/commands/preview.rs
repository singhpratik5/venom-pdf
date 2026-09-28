use crate::utils::error::VenomError;
use lopdf::{Document, Object};
use serde::Serialize;
use std::path::Path;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfInfo {
    pub path: String,
    pub name: String,
    pub page_count: u32,
    pub has_images: bool,
    pub file_size: u64,
}

#[tauri::command]
pub async fn get_pdf_info(path: String) -> Result<PdfInfo, VenomError> {
    let doc = Document::load(&path)
        .map_err(|e| VenomError::PdfParse(format!("Failed to load PDF: {}", e)))?;
    let pages = doc.get_pages();
    let meta = std::fs::metadata(&path)?;

    let mut has_images = false;
    for (_, page_id) in &pages {
        if let Ok(page) = doc.get_dictionary(*page_id) {
            let res = page.get(b"Resources").and_then(|r| match r {
                Object::Reference(id) => doc.get_dictionary(*id),
                Object::Dictionary(d) => Ok(d),
                _ => Err(lopdf::Error::Type),
            });
            if let Ok(resources) = res {
                if let Ok(Object::Dictionary(xobjects)) = resources.get(b"XObject") {
                    if !xobjects.is_empty() {
                        has_images = true;
                        break;
                    }
                }
            }
        }
    }

    let file_name = Path::new(&path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("document.pdf")
        .to_string();

    Ok(PdfInfo {
        path,
        name: file_name,
        page_count: pages.len() as u32,
        has_images,
        file_size: meta.len(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use lopdf::content::Content;
    use lopdf::{dictionary, Document, Object, Stream};
    use std::fs;

    #[tokio::test]
    async fn test_get_pdf_info() {
        let test_dir = std::env::temp_dir();
        let path = test_dir.join("info_test.pdf").to_str().unwrap().to_string();

        let mut doc = Document::with_version("1.5");
        let pages_id = doc.new_object_id();
        let content = Content { operations: vec![] };
        let stream = Stream::new(dictionary! {}, content.encode().unwrap());
        let stream_id = doc.add_object(Object::Stream(stream));

        let page_dict = dictionary! {
            "Type" => "Page",
            "Parent" => pages_id,
            "Contents" => Object::Reference(stream_id),
            "MediaBox" => vec![0.into(), 0.into(), 500.into(), 700.into()],
        };
        let page_id = doc.add_object(page_dict);

        let pages_dict = dictionary! {
            "Type" => "Pages",
            "Kids" => vec![page_id.into()],
            "Count" => 1,
        };
        doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

        let catalog_id = doc.add_object(dictionary! {
            "Type" => "Catalog",
            "Pages" => pages_id,
        });
        doc.trailer.set("Root", Object::Reference(catalog_id));
        doc.save(&path).unwrap();

        let info = get_pdf_info(path.clone()).await.unwrap();
        assert_eq!(info.page_count, 1);
        assert_eq!(info.name, "info_test.pdf");
        assert!(info.file_size > 0);

        let _ = fs::remove_file(path);
    }
}
