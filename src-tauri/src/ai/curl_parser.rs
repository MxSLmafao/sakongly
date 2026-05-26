use anyhow::{anyhow, Result};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct ParsedCurl {
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
}

/// Minimal curl tokenizer supporting:
/// -X METHOD, -H "Header: Value", -d "body", --data "body",
/// --data-raw "body", -s, -N, --no-buffer, --stream, line continuations.
pub fn parse_curl(curl: &str) -> Result<ParsedCurl> {
    let normalized = curl.replace("\\\n", " ").replace("\\\r\n", " ");
    let tokens = tokenize(&normalized)?;

    if tokens.is_empty() || tokens[0].to_lowercase() != "curl" {
        return Err(anyhow!("Template must start with 'curl'"));
    }

    let mut method = "POST".to_string();
    let mut url: Option<String> = None;
    let mut headers = HashMap::new();
    let mut body: Option<String> = None;
    let mut i = 1usize;

    while i < tokens.len() {
        match tokens[i].as_str() {
            "-X" | "--request" => {
                i += 1;
                if i >= tokens.len() {
                    return Err(anyhow!("-X requires a method argument"));
                }
                method = tokens[i].to_uppercase();
            }
            "-H" | "--header" => {
                i += 1;
                if i >= tokens.len() {
                    return Err(anyhow!("-H requires a header argument"));
                }
                let h = &tokens[i];
                if let Some(colon) = h.find(':') {
                    let key = h[..colon].trim().to_string();
                    let val = h[colon + 1..].trim().to_string();
                    headers.insert(key, val);
                }
            }
            "-d" | "--data" | "--data-raw" => {
                i += 1;
                if i >= tokens.len() {
                    return Err(anyhow!("-d requires a body argument"));
                }
                body = Some(tokens[i].clone());
            }
            "-s" | "--silent" | "-N" | "--no-buffer" | "--stream" | "-L" | "--location" => {}
            t if t.starts_with("http://") || t.starts_with("https://") => {
                url = Some(t.to_string());
            }
            t if t.starts_with('-') => {
                // skip unrecognized flag — be lenient
            }
            t => {
                if url.is_none() && (t.starts_with("http") || t.contains("localhost")) {
                    url = Some(t.to_string());
                }
            }
        }
        i += 1;
    }

    let url = url.ok_or_else(|| anyhow!("No URL found in curl template"))?;
    Ok(ParsedCurl {
        method,
        url,
        headers,
        body,
    })
}

fn tokenize(s: &str) -> Result<Vec<String>> {
    let mut tokens = Vec::new();
    let mut chars = s.chars().peekable();

    while let Some(&ch) = chars.peek() {
        match ch {
            ' ' | '\t' | '\n' | '\r' => {
                chars.next();
            }
            '\'' => {
                chars.next();
                let mut tok = String::new();
                loop {
                    match chars.next() {
                        Some('\'') => break,
                        Some(c) => tok.push(c),
                        None => return Err(anyhow!("Unterminated single-quote")),
                    }
                }
                tokens.push(tok);
            }
            '"' => {
                chars.next();
                let mut tok = String::new();
                loop {
                    match chars.next() {
                        Some('"') => break,
                        Some('\\') => {
                            if let Some(c) = chars.next() {
                                match c {
                                    'n' => tok.push('\n'),
                                    't' => tok.push('\t'),
                                    '"' => tok.push('"'),
                                    '\\' => tok.push('\\'),
                                    other => {
                                        tok.push('\\');
                                        tok.push(other);
                                    }
                                }
                            }
                        }
                        Some(c) => tok.push(c),
                        None => return Err(anyhow!("Unterminated double-quote")),
                    }
                }
                tokens.push(tok);
            }
            _ => {
                let mut tok = String::new();
                while let Some(&c) = chars.peek() {
                    if c == ' ' || c == '\t' || c == '\n' || c == '\r' {
                        break;
                    }
                    tok.push(c);
                    chars.next();
                }
                tokens.push(tok);
            }
        }
    }

    Ok(tokens)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_post() {
        let curl = r#"curl -X POST https://api.example.com/v1/chat \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"model":"{{MODEL}}","messages":[{"role":"user","content":"{{TEXT}}"}],"stream":true}'"#;
        let p = parse_curl(curl).unwrap();
        assert_eq!(p.method, "POST");
        assert_eq!(p.url, "https://api.example.com/v1/chat");
        assert!(p.headers.contains_key("Authorization"));
    }
}
