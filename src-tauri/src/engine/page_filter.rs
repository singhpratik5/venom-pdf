use crate::utils::error::VenomError;

/// Parses a page range string like "1-5, 8, 11-12", "all", or "" (default: all)
pub fn parse_page_range(range_str: &str, total_pages: u32) -> Result<Vec<u32>, VenomError> {
    let trimmed = range_str.trim();
    if trimmed.is_empty() || trimmed.eq_ignore_ascii_case("all") {
        return Ok((1..=total_pages).collect());
    }

    let mut pages = Vec::new();
    for part in trimmed.split(',') {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }

        if let Some(idx) = part.find('-') {
            let start: u32 = part[..idx]
                .trim()
                .parse()
                .map_err(|_| VenomError::InvalidPageRange(part.to_string()))?;
            let end: u32 = part[idx + 1..]
                .trim()
                .parse()
                .map_err(|_| VenomError::InvalidPageRange(part.to_string()))?;

            if start > end || start == 0 || end > total_pages {
                return Err(VenomError::InvalidPageRange(format!(
                    "{} (valid range 1-{})",
                    part, total_pages
                )));
            }
            pages.extend(start..=end);
        } else {
            let page: u32 = part
                .parse()
                .map_err(|_| VenomError::InvalidPageRange(part.to_string()))?;
            if page == 0 || page > total_pages {
                return Err(VenomError::InvalidPageRange(format!(
                    "{} (valid range 1-{})",
                    part, total_pages
                )));
            }
            pages.push(page);
        }
    }

    if pages.is_empty() {
        return Ok((1..=total_pages).collect());
    }

    pages.sort_unstable();
    pages.dedup();
    Ok(pages)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_all() {
        let pages = parse_page_range("all", 5).unwrap();
        assert_eq!(pages, vec![1, 2, 3, 4, 5]);

        let empty = parse_page_range("", 3).unwrap();
        assert_eq!(empty, vec![1, 2, 3]);
    }

    #[test]
    fn test_parse_ranges_and_singles() {
        let pages = parse_page_range("1-3, 5, 7-8", 10).unwrap();
        assert_eq!(pages, vec![1, 2, 3, 5, 7, 8]);
    }

    #[test]
    fn test_deduplication_and_sorting() {
        let pages = parse_page_range("5, 1-3, 2-4", 10).unwrap();
        assert_eq!(pages, vec![1, 2, 3, 4, 5]);
    }

    #[test]
    fn test_out_of_bounds() {
        assert!(parse_page_range("1-15", 10).is_err());
        assert!(parse_page_range("0", 10).is_err());
    }

    #[test]
    fn test_inverted_range() {
        assert!(parse_page_range("5-2", 10).is_err());
    }
}
