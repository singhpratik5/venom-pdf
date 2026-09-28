use crate::utils::error::VenomError;

/// Parses a page range string like "1-5, 8, 11-12" or "all"
pub fn parse_page_range(range_str: &str, total_pages: u32) -> Result<Vec<u32>, VenomError> {
    if range_str.trim().eq_ignore_ascii_case("all") {
        return Ok((1..=total_pages).collect());
    }

    let mut pages = Vec::new();
    for part in range_str.split(',') {
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
                return Err(VenomError::InvalidPageRange(part.to_string()));
            }
            pages.extend(start..=end);
        } else {
            let page: u32 = part
                .parse()
                .map_err(|_| VenomError::InvalidPageRange(part.to_string()))?;
            if page == 0 || page > total_pages {
                return Err(VenomError::InvalidPageRange(part.to_string()));
            }
            pages.push(page);
        }
    }

    pages.sort_unstable();
    pages.dedup();
    Ok(pages)
}
