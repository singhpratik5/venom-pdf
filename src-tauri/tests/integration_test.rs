use lopdf::content::{Content, Operation};
use lopdf::{dictionary, Document, Object, Stream};
use venom_pdf_lib::commands::invert::invert_pdf_sync;
use venom_pdf_lib::engine::image_detector::ImageMode;
use venom_pdf_lib::engine::theme::Theme;

fn generate_multi_page_pdf(path: &str, pages_count: usize) {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let mut page_ids = Vec::new();

    for i in 1..=pages_count {
        let text = format!("Page {}", i);
        let ops = vec![
            Operation::new("rg", vec![Object::Real(0.0), Object::Real(0.0), Object::Real(0.0)]),
            Operation::new("BT", vec![]),
            Operation::new("Tj", vec![Object::string_literal(text)]),
            Operation::new("ET", vec![]),
        ];
        let content = Content { operations: ops };
        let stream = Stream::new(dictionary! {}, content.encode().unwrap());
        let stream_id = doc.add_object(Object::Stream(stream));

        let page_dict = dictionary! {
            "Type" => "Page",
            "Parent" => pages_id,
            "Contents" => Object::Reference(stream_id),
            "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
        };
        let page_id = doc.add_object(page_dict);
        page_ids.push(Object::Reference(page_id));
    }

    let pages_dict = dictionary! {
        "Type" => "Pages",
        "Kids" => page_ids,
        "Count" => pages_count as i64,
    };
    doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    let catalog_id = doc.add_object(dictionary! {
        "Type" => "Catalog",
        "Pages" => pages_id,
    });
    doc.trailer.set("Root", Object::Reference(catalog_id));

    doc.save(path).unwrap();
}

#[test]
fn test_full_pipeline_multi_page_inversion() {
    let temp_dir = std::env::temp_dir();
    let in_file = temp_dir.join("venom_test_multi.pdf");
    let in_path = in_file.to_str().unwrap();
    let out_file = temp_dir.join("venom_test_multi_dark.pdf");
    let out_path = out_file.to_str().unwrap();

    generate_multi_page_pdf(in_path, 3);

    // Test with OLED Black preset
    let res = invert_pdf_sync(in_path, out_path, "OLED Black", &ImageMode::Preserve, "1-2");
    assert!(res.is_ok());

    // Verify output PDF
    let loaded = Document::load(out_path).expect("Failed to load inverted PDF");
    let pages = loaded.get_pages();
    assert_eq!(pages.len(), 3);

    // Page 1 and 2 should have dark background inserted
    let p1_content_bytes = loaded.get_page_content(pages[&1]).unwrap();
    let p1_content = Content::decode(&p1_content_bytes).unwrap();
    assert!(p1_content.operations.iter().any(|op| op.operator == "re"));

    // Cleanup
    let _ = std::fs::remove_file(in_path);
    let _ = std::fs::remove_file(out_path);
}

#[test]
fn test_all_theme_presets_render_successfully() {
    let temp_dir = std::env::temp_dir();
    let in_file = temp_dir.join("venom_theme_check.pdf");
    let in_path = in_file.to_str().unwrap();
    generate_multi_page_pdf(in_path, 1);

    let themes = ["Venom Dark", "OLED Black", "Dracula", "Nord", "Sepia", "Solarized"];
    for theme in themes {
        let out_file = temp_dir.join(format!("venom_theme_{}.pdf", theme.replace(' ', "_")));
        let out_path = out_file.to_str().unwrap();

        let res = invert_pdf_sync(in_path, out_path, theme, &ImageMode::Preserve, "all");
        assert!(res.is_ok(), "Failed to invert with theme: {}", theme);

        let loaded = Document::load(out_path);
        assert!(loaded.is_ok(), "Failed to reload PDF generated with theme: {}", theme);

        let _ = std::fs::remove_file(out_path);
    }

    let _ = std::fs::remove_file(in_path);
}
