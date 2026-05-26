use std::collections::HashMap;

pub struct TemplateVars {
    pub api_key: String,
    pub text: String,
    pub system_prompt: String,
    pub model: String,
    pub image: Option<String>, // base64 data-URL or empty string
}

pub fn substitute(template: &str, vars: &TemplateVars) -> String {
    let image_val = vars.image.as_deref().unwrap_or("");
    template
        .replace("{{API_KEY}}", &vars.api_key)
        .replace("{{TEXT}}", &escape_json_string(&vars.text))
        .replace("{{SYSTEM_PROMPT}}", &escape_json_string(&vars.system_prompt))
        .replace("{{MODEL}}", &vars.model)
        .replace("{{IMAGE}}", image_val)
}

/// Escape a string for safe embedding inside a JSON string value.
fn escape_json_string(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c => out.push(c),
        }
    }
    out
}

/// Apply substitutions to each header value and the body.
pub fn substitute_parsed(
    headers: &HashMap<String, String>,
    body: &Option<String>,
    vars: &TemplateVars,
) -> (HashMap<String, String>, Option<String>) {
    let new_headers = headers
        .iter()
        .map(|(k, v)| (k.clone(), substitute(v, vars)))
        .collect();
    let new_body = body.as_deref().map(|b| substitute(b, vars));
    (new_headers, new_body)
}
