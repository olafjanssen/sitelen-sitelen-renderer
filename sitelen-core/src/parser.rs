/// Toki Pona text parser

use crate::types::SentencePart;
use crate::types::Sentence;
use std::collections::HashSet;

/// Allowed Toki Pona words
const ALLOWED_WORDS: &[&str] = &[
    "a", "akesi", "ala", "alasa", "ali", "anpa", "ante", "anu", "awen", "e", "en", "esun",
    "ijo", "ike", "ilo", "insa", "jaki", "jan", "jelo", "jo", "kala", "kalama", "kama", "kasi",
    "ken", "kepeken", "kili", "kin", "kiwen", "kijetesantakalu", "ko", "kon", "kule", "kulupu", "kute", "la", "lape",
    "laso", "lawa", "len", "lete", "li", "lili", "linja", "lipu", "loje", "lon", "luka", "lukin",
    "lupa", "ma", "mama", "mani", "meli", "mi", "mije", "moku", "moli", "monsi", "mu", "mun",
    "musi", "mute", "namako", "nanpa", "nasa", "nasin", "nena", "ni", "nimi", "noka", "o", "oko",
    "olin", "ona", "open", "pakala", "pali", "palisa", "pan", "pana", "pi", "pilin", "pimeja",
    "pini", "pipi", "poka", "poki", "pona", "pu", "sama", "seli", "selo", "seme", "sewi",
    "sijelo", "sike", "sin", "sina", "sinpin", "sitelen", "sona", "soweli", "suli", "suno",
    "supa", "suwi", "tan", "taso", "tawa", "telo", "tenpo", "toki", "tomo", "tu", "unpa", "uta",
    "utala", "walo", "wan", "waso", "wawa", "weka", "wile", "ale", ".", "?", "!", ":", ",",
];

/// Prepositions that create prepositional phrases
const PREPOSITIONS: &[&str] = &["tawa", "tan", "lon", "kepeken", "sama", "poka"];

/// Object markers
const OBJECT_MARKERS: &[&str] = &["li", "e"];

/// Preposition containers (including pi)
const PREPOSITION_CONTAINERS: &[&str] = &["lon", "tan", "kepeken", "tawa", "sama", "poka", "pi"];

/// Allowed Toki Pona syllables
const ALLOWED_SYLLABLES: &[&str] = &[
    "o", "u", "i", "a", "e", "mo", "mu", "mi", "ma", "me", "no", "nu", "ni", "na", "ne", "po",
    "pu", "pi", "pa", "pe", "to", "tu", "ta", "te", "ko", "ku", "ki", "ka", "ke", "so", "su",
    "si", "sa", "se", "wi", "wa", "we", "lo", "lu", "li", "la", "le", "jo", "ju", "ja", "je",
    "on", "un", "in", "an", "en", "mon", "mun", "min", "man", "men", "non", "nun", "nin", "nan",
    "nen", "pon", "pun", "pin", "pan", "pen", "ton", "tun", "tan", "ten", "kon", "kun", "kin",
    "kan", "ken", "son", "sun", "sin", "san", "sen", "win", "wan", "wen", "lon", "lun", "lin",
    "lan", "len", "jon", "jun", "jan", "jen",
];

#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    #[error("Illegal token: {0}")]
    IllegalToken(String),
    #[error("Illegal syllable: {0}")]
    IllegalSyllable(String),
}

/// Parser for Toki Pona text
pub struct Parser {
    allowed_words: HashSet<String>,
    allowed_syllables: HashSet<String>,
}

impl Parser {
    pub fn new() -> Self {
        let mut allowed_words = HashSet::new();
        for word in ALLOWED_WORDS {
            allowed_words.insert(word.to_string());
        }
        allowed_words.insert("'Name'".to_string());

        let mut allowed_syllables = HashSet::new();
        for syllable in ALLOWED_SYLLABLES {
            allowed_syllables.insert(syllable.to_string());
        }

        Self {
            allowed_words,
            allowed_syllables,
        }
    }

    /// Parse text into structured sentences
    pub fn parse(&self, text: &str) -> Result<Vec<Sentence>, ParseError> {
        let normalized = text.replace("  ", " ");
        let preformatted = self.preformat(&normalized)?;
        
        preformatted
            .iter()
            .map(|sentence| self.parse_sentence(sentence))
            .collect()
    }

    /// Preformat text, splitting on punctuation
    fn preformat(&self, text: &str) -> Result<Vec<ParsableSentence>, ParseError> {
        use regex::Regex;
        let re = Regex::new(r"[^.!?#]+[.!?#]+").unwrap();
        
        let matches: Vec<&str> = if let Some(_) = re.find(text) {
            re.find_iter(text).map(|m| m.as_str()).collect()
        } else {
            // Allow sentence fractions without punctuation
            vec![text]
        };

        let mut result = Vec::new();
        for sentence in matches {
            let trimmed = sentence.trim();
            if trimmed.is_empty() {
                continue;
            }

            let mut parsable = ParsableSentence::new();
            let body = if trimmed.len() > 1 {
                &trimmed[..trimmed.len() - 1]
            } else {
                trimmed
            };

            // Remove comma before la-clause and before repeating li clause
            let body = body.replace(", la ", " la ").replace(", li ", " li ");

            // Split on context separators
            let la_parts: Vec<&str> = body.split(" la ").collect();
            for (i, la_part) in la_parts.iter().enumerate() {
                let colon_parts: Vec<&str> = la_part.split(':').collect();
                for (j, colon_part) in colon_parts.iter().enumerate() {
                    let comma_parts: Vec<&str> = colon_part.split(',').collect();
                    for (k, comma_part) in comma_parts.iter().enumerate() {
                        let trimmed_part = comma_part.trim();
                        if !trimmed_part.is_empty() {
                            parsable.push_content(trimmed_part);
                        }
                        if k < comma_parts.len() - 1 {
                            parsable.push_punctuation("comma");
                        }
                    }
                    if j < colon_parts.len() - 1 {
                        parsable.push_punctuation("colon");
                    }
                }
                if la_parts.len() == 2 && i == 0 {
                    parsable.push_punctuation("la");
                }
            }

            // Add terminator
            if let Some(terminator) = trimmed.chars().last() {
                match terminator {
                    '.' => parsable.push_punctuation("period"),
                    ':' => parsable.push_punctuation("colon"),
                    '!' => parsable.push_punctuation("exclamation"),
                    '?' => parsable.push_punctuation("question"),
                    '#' => parsable.push_punctuation("banner"),
                    _ => {}
                }
            }

            result.push(parsable);
        }

        Ok(result)
    }

    /// Parse a single sentence
    fn parse_sentence(&self, sentence: &ParsableSentence) -> Result<Sentence, ParseError> {
        let mut structured = Vec::new();

        for part in &sentence.parts {
            match part {
                ParsablePart::Content(content) => {
                    // Find proper names (capitalized words)
                    let mut proper_names = Vec::new();
                    let mut content_with_placeholders = content.clone();
                    
                    use regex::Regex;
                    let re = Regex::new(r"([A-Z][\w-]*)").unwrap();
                    for cap in re.captures_iter(content) {
                        if let Some(m) = cap.get(0) {
                            proper_names.push(m.as_str().to_string());
                            content_with_placeholders = content_with_placeholders.replace(m.as_str(), "'Name'");
                        }
                    }

                    let value = self.get_simple_structured_sentence(&content_with_placeholders)?;
                    
                    // Replace placeholders with actual names
                    // Reverse the vector so we can pop in the correct order
                    proper_names.reverse();
                    let mut value = value;
                    for part in &mut value {
                        match part {
                            SentencePart::Subject { tokens, .. }
                            | SentencePart::ObjectMarker { tokens, .. }
                            | SentencePart::PrepPhrase { tokens, .. } => {
                                for token in tokens {
                                    if *token == "'Name'" {
                                        if let Some(name) = proper_names.pop() {
                                            *token = name;
                                        }
                                    }
                                }
                            }
                            _ => {}
                        }
                    }

                    structured.extend(value);
                }
                ParsablePart::Punctuation(punct) => {
                    structured.push(SentencePart::Punctuation {
                        tokens: vec![punct.clone()],
                    });
                }
            }
        }

        let structured = self.postprocess(structured)?;
        Ok(Sentence { parts: structured })
    }

    /// Get simple structured sentence from parseable text
    fn get_simple_structured_sentence(
        &self,
        parseable: &str,
    ) -> Result<Vec<SentencePart>, ParseError> {
        let tokens: Vec<&str> = parseable.split_whitespace().collect();
        let mut sentence = vec![SentencePart::Subject {
            tokens: Vec::new(),
            separator: None,
            parts: None,
        }];
        let mut current_part = 0;

        for (index, token) in tokens.iter().enumerate() {
            let token_lower = token.to_lowercase();

            if OBJECT_MARKERS.contains(&token_lower.as_str()) && index < tokens.len() - 1 {
                sentence.push(SentencePart::ObjectMarker {
                    separator: token_lower.clone(),
                    tokens: Vec::new(),
                    parts: None,
                });
                current_part = sentence.len() - 1;
                continue;
            } else if PREPOSITIONS.contains(&token_lower.as_str())
                && (index == 0 || !OBJECT_MARKERS.contains(&tokens[index - 1].to_lowercase().as_str()))
                && index < tokens.len() - 1
                && !OBJECT_MARKERS.contains(&tokens[index + 1].to_lowercase().as_str())
            {
                sentence.push(SentencePart::PrepPhrase {
                    separator: token_lower.clone(),
                    tokens: Vec::new(),
                    parts: None,
                });
                current_part = sentence.len() - 1;
                continue;
            } else if token_lower == "o" {
                if let SentencePart::Subject { tokens, .. } = &sentence[current_part] {
                    if !tokens.is_empty() {
                        // Convert to address
                        sentence[current_part] = SentencePart::Address {
                            separator: "o".to_string(),
                            tokens: tokens.clone(),
                        };
                        sentence.push(SentencePart::Subject {
                            tokens: Vec::new(),
                            separator: None,
                            parts: None,
                        });
                        current_part = sentence.len() - 1;
                        continue;
                    }
                }
            } else if token_lower == "a" {
                if current_part < sentence.len() {
                    let has_separator = match &sentence[current_part] {
                        SentencePart::Subject { tokens, separator, .. } => {
                            !tokens.is_empty() && separator.is_some()
                        }
                        SentencePart::ObjectMarker { tokens, .. } => {
                            !tokens.is_empty()
                        }
                        SentencePart::PrepPhrase { tokens, .. } => {
                            !tokens.is_empty()
                        }
                        _ => false,
                    };
                    if has_separator {
                        sentence.push(SentencePart::Interjection {
                            tokens: vec![token_lower.clone()],
                        });
                        current_part = sentence.len() - 1;
                        continue;
                    }
                }
            }

            // Validate token (preserve 'Name' placeholder case)
            let is_name_placeholder = *token == "'Name'";
            if !self.allowed_words.contains(&token_lower) && token_lower != "'name'" {
                return Err(ParseError::IllegalToken(token_lower));
            }

            // Add token to current part (preserve case for 'Name' placeholder)
            match &mut sentence[current_part] {
                SentencePart::Subject { tokens, .. }
                | SentencePart::ObjectMarker { tokens, .. }
                | SentencePart::PrepPhrase { tokens, .. }
                | SentencePart::Address { tokens, .. } => {
                    if is_name_placeholder {
                        tokens.push(token.to_string()); // Preserve 'Name' capitalization
                    } else {
                        tokens.push(token_lower.clone());
                    }
                }
                _ => {}
            }
        }

        // Filter out empty parts
        sentence.retain(|part| match part {
            SentencePart::Subject { tokens, .. }
            | SentencePart::ObjectMarker { tokens, .. }
            | SentencePart::PrepPhrase { tokens, .. }
            | SentencePart::Address { tokens, .. } => !tokens.is_empty(),
            SentencePart::Interjection { tokens, .. }
            | SentencePart::Punctuation { tokens, .. } => !tokens.is_empty(),
        });

        Ok(sentence)
    }

    /// Split proper name into syllables
    fn split_proper_into_syllables(&self, proper_name: &str) -> Result<Vec<String>, ParseError> {
        if proper_name.is_empty() {
            return Ok(Vec::new());
        }

        let name = proper_name.to_lowercase();
        let chars: Vec<char> = name.chars().collect();
        let mut syllables = Vec::new();

        let mut i = 0;
        while i < chars.len() {
            let first = chars.get(i).copied().unwrap_or(' ');
            let second = chars.get(i + 1).copied().unwrap_or(' ');
            let third = chars.get(i + 2).copied().unwrap_or(' ');
            let fourth = chars.get(i + 3).copied().unwrap_or(' ');

            let is_vowel = matches!(first, 'a' | 'e' | 'i' | 'o' | 'u');
            let is_n = second == 'n';
            let third_is_n = third == 'n';
            let third_is_vowel = matches!(third, 'a' | 'e' | 'i' | 'o' | 'u');
            let fourth_is_vowel = matches!(fourth, 'a' | 'e' | 'i' | 'o' | 'u');

            if !is_vowel {
                // Consonant start
                if third_is_n && !fourth_is_vowel {
                    // 3-character syllable: MONsi
                    if i + 3 <= chars.len() {
                        let syllable: String = chars[i..i + 3].iter().collect();
                        if !self.allowed_syllables.contains(&syllable) {
                            return Err(ParseError::IllegalSyllable(syllable));
                        }
                        syllables.push(syllable);
                        i += 3;
                    } else {
                        break;
                    }
                } else {
                    // 2-character syllable: POnoman, POki
                    if i + 2 <= chars.len() {
                        let syllable: String = chars[i..i + 2].iter().collect();
                        if !self.allowed_syllables.contains(&syllable) {
                            return Err(ParseError::IllegalSyllable(syllable));
                        }
                        syllables.push(syllable);
                        i += 2;
                    } else {
                        break;
                    }
                }
            } else {
                // Vowel start
                if chars.len() - i == 2 {
                    // 2-character word
                    let syllable: String = chars[i..].iter().collect();
                    if !self.allowed_syllables.contains(&syllable) {
                        return Err(ParseError::IllegalSyllable(syllable));
                    }
                    syllables.push(syllable);
                    break;
                } else if is_n && !third_is_vowel {
                    // 2-character syllable: UNpa
                    if i + 2 <= chars.len() {
                        let syllable: String = chars[i..i + 2].iter().collect();
                        if !self.allowed_syllables.contains(&syllable) {
                            return Err(ParseError::IllegalSyllable(syllable));
                        }
                        syllables.push(syllable);
                        i += 2;
                    } else {
                        break;
                    }
                } else {
                    // 1-character syllable
                    let syllable = first.to_string();
                    if !self.allowed_syllables.contains(&syllable) {
                        return Err(ParseError::IllegalSyllable(syllable));
                    }
                    syllables.push(syllable);
                    i += 1;
                }
            }
        }

        Ok(syllables)
    }

    /// Postprocess structured sentence
    fn postprocess(
        &self,
        mut sentence: Vec<SentencePart>,
    ) -> Result<Vec<SentencePart>, ParseError> {
        // Split prepositional phrases inside containers
        for i in 0..sentence.len() {
            let mut new_parts = None;
            match &sentence[i] {
                SentencePart::Subject { tokens, .. }
                | SentencePart::ObjectMarker { tokens, .. }
                | SentencePart::PrepPhrase { tokens, .. } => {
                    let mut split_index = None;
                    for (j, token) in tokens.iter().enumerate() {
                        if PREPOSITION_CONTAINERS.contains(&token.as_str()) && j < tokens.len() - 1 {
                            split_index = Some(j);
                        }
                    }

                    if let Some(split_idx) = split_index {
                        let mut parts = Vec::new();
                        if split_idx > 0 {
                            parts.push(SentencePart::Subject {
                                tokens: tokens[..split_idx].to_vec(),
                                separator: None,
                                parts: None,
                            });
                        }
                        parts.push(SentencePart::Subject {
                            tokens: tokens[split_idx + 1..].to_vec(),
                            separator: Some(tokens[split_idx].clone()),
                            parts: None,
                        });
                        new_parts = Some(parts);
                    }
                }
                _ => {}
            }

            if let Some(parts) = new_parts {
                match &sentence[i] {
                    SentencePart::Subject { separator, .. } => {
                        sentence[i] = SentencePart::Subject {
                            tokens: Vec::new(),
                            separator: separator.clone(),
                            parts: Some(parts),
                        };
                    }
                    SentencePart::ObjectMarker { separator, .. } => {
                        sentence[i] = SentencePart::ObjectMarker {
                            separator: separator.clone(),
                            tokens: Vec::new(),
                            parts: Some(parts),
                        };
                    }
                    SentencePart::PrepPhrase { separator, .. } => {
                        sentence[i] = SentencePart::PrepPhrase {
                            separator: separator.clone(),
                            tokens: Vec::new(),
                            parts: Some(parts),
                        };
                    }
                    _ => {}
                }
            }
        }

        // Split proper names inside containers
        for i in 0..sentence.len() {
            let name_indices: Vec<usize> = match &sentence[i] {
                SentencePart::Subject { tokens, .. }
                | SentencePart::ObjectMarker { tokens, .. }
                | SentencePart::PrepPhrase { tokens, .. } => {
                    tokens.iter().enumerate()
                        .filter_map(|(idx, token)| {
                            if token.chars().next().map(|c| c.is_uppercase()).unwrap_or(false) {
                                Some(idx)
                            } else {
                                None
                            }
                        })
                        .collect()
                }
                _ => continue,
            };

            if !name_indices.is_empty() {
                let mut new_parts = Vec::new();
                let mut last = 0;
                
                match &sentence[i] {
                    SentencePart::Subject { tokens, separator, .. } => {
                        for &idx in &name_indices {
                            if idx > last {
                                new_parts.push(SentencePart::Subject {
                                    tokens: tokens[last..idx].to_vec(),
                                    separator: None,
                                    parts: None,
                                });
                            }
                            let name = tokens[idx].clone();
                            let syllables = self.split_proper_into_syllables(&name)?;
                            new_parts.push(SentencePart::Subject {
                                tokens: syllables,
                                separator: Some("cartouche".to_string()),
                                parts: None,
                            });
                            last = idx + 1;
                        }
                        if let Some(&last_idx) = name_indices.last() {
                            if last_idx < tokens.len() - 1 {
                                new_parts.push(SentencePart::Subject {
                                    tokens: tokens[last_idx + 1..].to_vec(),
                                    separator: None,
                                    parts: None,
                                });
                            }
                        }
                        sentence[i] = SentencePart::Subject {
                            tokens: Vec::new(),
                            separator: separator.clone(),
                            parts: Some(new_parts),
                        };
                    }
                    SentencePart::ObjectMarker { tokens, separator, .. } => {
                        for &idx in &name_indices {
                            if idx > last {
                                new_parts.push(SentencePart::ObjectMarker {
                                    separator: separator.clone(),
                                    tokens: tokens[last..idx].to_vec(),
                                    parts: None,
                                });
                            }
                            let name = tokens[idx].clone();
                            let syllables = self.split_proper_into_syllables(&name)?;
                            new_parts.push(SentencePart::ObjectMarker {
                                separator: "cartouche".to_string(),
                                tokens: syllables,
                                parts: None,
                            });
                            last = idx + 1;
                        }
                        if let Some(&last_idx) = name_indices.last() {
                            if last_idx < tokens.len() - 1 {
                                new_parts.push(SentencePart::ObjectMarker {
                                    separator: separator.clone(),
                                    tokens: tokens[last_idx + 1..].to_vec(),
                                    parts: None,
                                });
                            }
                        }
                        sentence[i] = SentencePart::ObjectMarker {
                            separator: separator.clone(),
                            tokens: Vec::new(),
                            parts: Some(new_parts),
                        };
                    }
                    SentencePart::PrepPhrase { tokens, separator, .. } => {
                        for &idx in &name_indices {
                            if idx > last {
                                new_parts.push(SentencePart::PrepPhrase {
                                    separator: separator.clone(),
                                    tokens: tokens[last..idx].to_vec(),
                                    parts: None,
                                });
                            }
                            let name = tokens[idx].clone();
                            let syllables = self.split_proper_into_syllables(&name)?;
                            new_parts.push(SentencePart::PrepPhrase {
                                separator: "cartouche".to_string(),
                                tokens: syllables,
                                parts: None,
                            });
                            last = idx + 1;
                        }
                        if let Some(&last_idx) = name_indices.last() {
                            if last_idx < tokens.len() - 1 {
                                new_parts.push(SentencePart::PrepPhrase {
                                    separator: separator.clone(),
                                    tokens: tokens[last_idx + 1..].to_vec(),
                                    parts: None,
                                });
                            }
                        }
                        sentence[i] = SentencePart::PrepPhrase {
                            separator: separator.clone(),
                            tokens: Vec::new(),
                            parts: Some(new_parts),
                        };
                    }
                    _ => {}
                }
            }
        }

        Ok(sentence)
    }
}

impl Default for Parser {
    fn default() -> Self {
        Self::new()
    }
}

/// Internal structure for parsing
#[derive(Debug)]
enum ParsablePart {
    Content(String),
    Punctuation(String),
}

#[derive(Debug)]
struct ParsableSentence {
    parts: Vec<ParsablePart>,
}

impl ParsableSentence {
    fn new() -> Self {
        Self { parts: Vec::new() }
    }

    fn push_content(&mut self, content: &str) {
        self.parts.push(ParsablePart::Content(content.to_string()));
    }

    fn push_punctuation(&mut self, punct: &str) {
        self.parts.push(ParsablePart::Punctuation(punct.to_string()));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple() {
        let parser = Parser::new();
        let result = parser.parse("mi pona.").unwrap();
        assert_eq!(result.len(), 1);
    }
}
