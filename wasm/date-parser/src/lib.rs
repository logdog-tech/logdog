use wasm_bindgen::prelude::*;
use web_sys::console;
use chrono::NaiveDateTime;

#[wasm_bindgen]
pub fn parse_datetime(input: &str, format: &str) -> f64 {
    // 先尝试完整解析
    if let Ok(dt) = NaiveDateTime::parse_from_str(input, format) {
        return dt.and_utc().timestamp_millis() as f64;
    }

    // 如果完整解析失败，使用 1970 年作为基准年份
    let base_year = 1970;
    
    // 构建带年份的完整字符串
    let with_year = format!("{}-{}", base_year, input);
    let format_with_year = format!("%Y-{}", format);
    
    match NaiveDateTime::parse_from_str(&with_year, &format_with_year) {
        Ok(dt) => dt.and_utc().timestamp_millis() as f64,
        Err(e) => {
            console::log_1(&format!("Failed to parse: {}, input: {}, format: {}", e, input, format).into());
            0.0
        }
    }
}