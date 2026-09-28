use crate::engine::content_stream::{create_background_rect_operations, process_operations};
use crate::engine::image_detector::{is_image_xobject, process_image_bytes, ImageMode};
use crate::engine::page_filter::parse_page_range;
use crate::engine::theme::Theme;
use crate::utils::error::VenomError;
use lopdf::content::Content;
use lopdf::{Document, Object, ObjectId, Stream};
use std::collections::HashSet;

fn get_page_dimensions(doc: &Document, page_id: ObjectId) -> (f64, f64, f64, f64) {
    let default_box = (0.0, 0.0, 595.28, 841.89);

    if let Ok(page) = doc.get_dictionary(page_id) {
        let box_obj = page.get(b"MediaBox").or_else(|_| page.get(b"CropBox"));
        if let Ok(Object::Array(arr)) = box_obj {
            if arr.len() == 4 {
                let to_f64 = |obj: &Object| match obj {
                    Object::Real(v) => Some(*v),
                    Object::Integer(v) => Some(*v as f64),
                    _ => None,
                };
                if let (Some(x1), Some(y1), Some(x2), Some(y2)) =
                    (to_f64(&arr[0]), to_f64(&arr[1]), to_f64(&arr[2]), to_f64(&arr[3]))
                {
                    return (x1.min(x2), y1.min(y2), (x2 - x1).abs(), (y2 - y1).abs());
                }
            }
        }
    }

    default_box
}

fn process_page_images(
    doc: &mut Document,
    page_id: ObjectId,
    image_mode: &ImageMode,
) -> Result<(), VenomError> {
    if *image_mode == ImageMode::Preserve {
        return Ok(());
    }

    let mut image_xobject_ids = Vec::new();
    if let Ok(page) = doc.get_dictionary(page_id) {
        if let Ok(resources) = page.get(b"Resources").and_then(|r| match r {
            Object::Reference(id) => doc.get_dictionary(*id),
            Object::Dictionary(d) => Ok(d),
            _ => Err(lopdf::Error::Type),
        }) {
            if let Ok(xobjects) = resources.get(b"XObject").and_then(|x| match x {
                Object::Reference(id) => doc.get_dictionary(*id),
                Object::Dictionary(d) => Ok(d),
                _ => Err(lopdf::Error::Type),
            }) {
                for (_, val) in xobjects.iter() {
                    if let Ok(xobj_id) = val.as_reference() {
                        if let Ok(stream) = doc.get_object(xobj_id).and_then(Object::as_stream) {
                            if is_image_xobject(&stream.dict) {
                                image_xobject_ids.push(xobj_id);
                            }
                        }
                    }
                }
            }
        }
    }

    for xobj_id in image_xobject_ids {
        if let Ok(stream) = doc.get_object_mut(xobj_id).and_then(Object::as_stream_mut) {
            let decompressed = match stream.decompressed_content() {
                Ok(data) => data,
                Err(_) => stream.content.clone(),
            };
            if let Ok(processed_bytes) = process_image_bytes(&decompressed, image_mode) {
                stream.set_plain_content(processed_bytes);
            }
        }
    }

    Ok(())
}

/// Synchronous PDF inversion function, suitable for background threads & Rayon
pub fn invert_pdf_sync(
    input_path: &str,
    output_path: &str,
    theme_name: &str,
    image_mode: &ImageMode,
    page_range: &str,
) -> Result<(), VenomError> {
    let theme = Theme::get_preset(theme_name)
        .ok_or_else(|| VenomError::ThemeNotFound(theme_name.to_string()))?;

    let mut doc = Document::load(input_path)
        .map_err(|e| VenomError::PdfParse(format!("Failed to open PDF {}: {}", input_path, e)))?;

    if doc.is_encrypted() {
        return Err(VenomError::PdfParse(
            "Encrypted/password-protected PDFs are not currently supported".into(),
        ));
    }

    let pages = doc.get_pages();
    let total_pages = pages.len() as u32;
    let target_page_numbers = parse_page_range(page_range, total_pages)?;
    let target_page_set: HashSet<u32> = target_page_numbers.into_iter().collect();

    for (page_num, page_id) in pages {
        if !target_page_set.contains(&page_num) {
            continue;
        }

        let (x, y, w, h) = get_page_dimensions(&doc, page_id);
        let bg_ops = create_background_rect_operations(x, y, w, h, &theme);

        let content_stream_ids = doc.get_page_contents(page_id);

        if content_stream_ids.is_empty() {
            let new_content = Content { operations: bg_ops };
            let encoded = new_content
                .encode()
                .map_err(|e| VenomError::PdfParse(format!("Content encode error: {}", e)))?;
            let stream = Stream::new(lopdf::Dictionary::new(), encoded);
            let stream_id = doc.add_object(Object::Stream(stream));

            if let Ok(page) = doc.get_dictionary_mut(page_id) {
                page.set(b"Contents".to_vec(), Object::Reference(stream_id));
            }
        } else {
            let mut is_first_stream = true;
            for stream_id in content_stream_ids {
                if let Ok(stream) = doc.get_object_mut(stream_id).and_then(Object::as_stream_mut) {
                    let decompressed = match stream.decompressed_content() {
                        Ok(data) => data,
                        Err(_) => stream.content.clone(),
                    };

                    if let Ok(content) = Content::decode(&decompressed) {
                        let mut mapped_ops = process_operations(content.operations, &theme);

                        if is_first_stream {
                            let mut full_ops = bg_ops.clone();
                            full_ops.append(&mut mapped_ops);
                            mapped_ops = full_ops;
                            is_first_stream = false;
                        }

                        let new_content = Content { operations: mapped_ops };
                        if let Ok(encoded) = new_content.encode() {
                            stream.set_plain_content(encoded);
                        }
                    }
                }
            }
        }

        let _ = process_page_images(&mut doc, page_id, image_mode);
    }

    doc.save(output_path)
        .map_err(|e| VenomError::IoError(format!("Failed to save inverted PDF to {}: {}", output_path, e)))?;

    Ok(())
}

#[tauri::command]
pub async fn invert_pdf(
    input_path: String,
    output_path: String,
    theme_name: String,
    image_mode: ImageMode,
    page_range: String,
) -> Result<String, VenomError> {
    let out = output_path.clone();
    tokio::task::spawn_blocking(move || {
        invert_pdf_sync(&input_path, &out, &theme_name, &image_mode, &page_range)
    })
    .await
    .map_err(|e| VenomError::IoError(format!("Task execution failed: {}", e)))??;

    Ok(format!("Successfully inverted to {}", output_path))
}

#[cfg(test)]
mod tests {
    use super::*;
    use lopdf::content::Operation;
    use lopdf::{dictionary, Document, Object, Stream};
    use std::fs;

    fn create_test_pdf(path: &str) {
        let mut doc = Document::with_version("1.5");
        let pages_id = doc.new_object_id();

        let operations = vec![
            Operation::new("rg", vec![Object::Real(0.0), Object::Real(0.0), Object::Real(0.0)]),
            Operation::new("BT", vec![]),
            Operation::new("ET", vec![]),
        ];
        let content = Content { operations };
        let encoded = content.encode().unwrap();
        let stream = Stream::new(dictionary! {}, encoded);
        let stream_id = doc.add_object(Object::Stream(stream));

        let page_dict = dictionary! {
            "Type" => "Page",
            "Parent" => pages_id,
            "Contents" => Object::Reference(stream_id),
            "MediaBox" => vec![0.into(), 0.into(), 600.into(), 800.into()],
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

        doc.save(path).unwrap();
    }

    #[tokio::test]
    async fn test_invert_pdf_flow() {
        let test_dir = std::env::temp_dir();
        let input_path = test_dir.join("venom_test_input.pdf").to_str().unwrap().to_string();
        let output_path = test_dir.join("venom_test_output.pdf").to_str().unwrap().to_string();

        create_test_pdf(&input_path);

        let result = invert_pdf(
            input_path.clone(),
            output_path.clone(),
            "Charcoal".to_string(),
            ImageMode::Preserve,
            "all".to_string(),
        )
        .await;

        assert!(result.is_ok());

        let inverted_doc = Document::load(&output_path);
        assert!(inverted_doc.is_ok());
        let loaded = inverted_doc.unwrap();
        let pages = loaded.get_pages();
        assert_eq!(pages.len(), 1);

        let contents = loaded.get_page_content(*pages.values().next().unwrap()).unwrap();
        let content = Content::decode(&contents).unwrap();
        assert!(content.operations.iter().any(|op| op.operator == "re"));

        let _ = fs::remove_file(input_path);
        let _ = fs::remove_file(output_path);
    }
}
