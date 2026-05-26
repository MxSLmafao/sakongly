use serde_json::Value;

/// Evaluate a simple path expression against a JSON value.
/// Supports dot notation and bracket index: "choices[0].delta.content"
pub fn extract(value: &Value, path: &str) -> Option<String> {
    let mut current = value;
    for segment in path_segments(path) {
        match segment {
            Segment::Key(k) => {
                current = current.get(&k)?;
            }
            Segment::Index(i) => {
                current = current.get(i)?;
            }
        }
    }
    match current {
        Value::String(s) => Some(s.clone()),
        Value::Null => None,
        other => Some(other.to_string()),
    }
}

#[derive(Debug)]
enum Segment {
    Key(String),
    Index(usize),
}

fn path_segments(path: &str) -> Vec<Segment> {
    let mut segments = Vec::new();
    // Split on '.' first, then handle bracket notation within each part.
    for part in path.split('.') {
        // Handle bracket notation: "choices[0]" → ["choices", 0]
        let mut remaining = part;
        while !remaining.is_empty() {
            if let Some(bracket_start) = remaining.find('[') {
                let key = &remaining[..bracket_start];
                if !key.is_empty() {
                    segments.push(Segment::Key(key.to_string()));
                }
                let rest = &remaining[bracket_start + 1..];
                if let Some(bracket_end) = rest.find(']') {
                    let idx_str = &rest[..bracket_end];
                    if let Ok(idx) = idx_str.parse::<usize>() {
                        segments.push(Segment::Index(idx));
                    }
                    remaining = &rest[bracket_end + 1..];
                    if remaining.starts_with('.') {
                        remaining = &remaining[1..];
                    }
                } else {
                    break;
                }
            } else {
                if !remaining.is_empty() {
                    segments.push(Segment::Key(remaining.to_string()));
                }
                break;
            }
        }
    }
    segments
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_extract_nested() {
        let v = json!({"choices": [{"message": {"content": "hello"}}]});
        assert_eq!(
            extract(&v, "choices[0].message.content"),
            Some("hello".to_string())
        );
    }

    #[test]
    fn test_extract_delta() {
        let v = json!({"choices": [{"delta": {"content": "world"}}]});
        assert_eq!(
            extract(&v, "choices[0].delta.content"),
            Some("world".to_string())
        );
    }
}
