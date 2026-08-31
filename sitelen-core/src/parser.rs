use crate::types::Sentence;
/// Toki Pona text parser
use crate::types::SentencePart;
use std::collections::HashSet;

/// Allowed Toki Pona words
const ALLOWED_WORDS: &[&str] = &[
    "a",
    "akesi",
    "ala",
    "alasa",
    "ali",
    "anpa",
    "ante",
    "anu",
    "awen",
    "e",
    "en",
    "epiku",
    "esun",
    "ijo",
    "ike",
    "ilo",
    "insa",
    "jaki",
    "jan",
    "jasima",
    "jelo",
    "jo",
    "kala",
    "kalama",
    "kama",
    "kasi",
    "ken",
    "kepeken",
    "kili",
    "kin",
    "kipisi",
    "kiwen",
    "kijetesantakalu",
    "ko",
    "kokosila",
    "kon",
    "kule",
    "kulupu",
    "kute",
    "la",
    "lanpan",
    "lape",
    "laso",
    "lawa",
    "leko",
    "len",
    "lete",
    "li",
    "lili",
    "linja",
    "lipu",
    "loje",
    "lon",
    "luka",
    "lukin",
    "lupa",
    "ma",
    "mama",
    "mani",
    "meli",
    "meso",
    "mi",
    "mije",
    "misikeke",
    "moku",
    "moli",
    "monsi",
    "monsuta",
    "mu",
    "mun",
    "musi",
    "mute",
    "n",
    "namako",
    "nanpa",
    "nasa",
    "nasin",
    "nena",
    "ni",
    "nimi",
    "noka",
    "o",
    "oko",
    "olin",
    "ona",
    "open",
    "pakala",
    "pali",
    "palisa",
    "pan",
    "pana",
    "pi",
    "pilin",
    "pimeja",
    "pini",
    "pipi",
    "poka",
    "poki",
    "pona",
    "pu",
    "sama",
    "seli",
    "selo",
    "seme",
    "sewi",
    "sijelo",
    "sike",
    "sin",
    "sina",
    "sinpin",
    "sitelen",
    "soko",
    "sona",
    "soweli",
    "suli",
    "suno",
    "supa",
    "suwi",
    "tan",
    "taso",
    "tawa",
    "telo",
    "tenpo",
    "toki",
    "tomo",
    "tonsi",
    "tu",
    "unpa",
    "uta",
    "utala",
    "walo",
    "wan",
    "waso",
    "wawa",
    "weka",
    "wile",
    "ale",
    ".",
    "?",
    "!",
    ":",
    ",",
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
    "pu", "pi", "pa", "pe", "to", "tu", "ta", "te", "ko", "ku", "ki", "ka", "ke", "so", "su", "si",
    "sa", "se", "wi", "wa", "we", "lo", "lu", "li", "la", "le", "jo", "ju", "ja", "je", "on", "un",
    "in", "an", "en", "mon", "mun", "min", "man", "men", "non", "nun", "nin", "nan", "nen", "pon",
    "pun", "pin", "pan", "pen", "ton", "tun", "tan", "ten", "kon", "kun", "kin", "kan", "ken",
    "son", "sun", "sin", "san", "sen", "win", "wan", "wen", "lon", "lun", "lin", "lan", "len",
    "jon", "jun", "jan", "jen",
];

/// Warning generated during parsing
#[derive(Debug, Clone)]
pub enum ParseWarning {
    /// Token is not a valid Toki Pona word
    IllegalToken(String),
    /// Syllable is not valid in proper name
    IllegalSyllable(String),
    /// Characters were filtered from input
    FilteredChars(String),
}

impl serde::Serialize for ParseWarning {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeMap;
        let mut map = serializer.serialize_map(Some(2))?;
        match self {
            ParseWarning::IllegalToken(token) => {
                map.serialize_entry("type", "illegal_token")?;
                map.serialize_entry("value", token)?;
            }
            ParseWarning::IllegalSyllable(syllable) => {
                map.serialize_entry("type", "illegal_syllable")?;
                map.serialize_entry("value", syllable)?;
            }
            ParseWarning::FilteredChars(chars) => {
                map.serialize_entry("type", "filtered_chars")?;
                map.serialize_entry("value", chars)?;
            }
        }
        map.end()
    }
}

/// Result of parsing with potential warnings
pub struct ParseResult {
    /// Parsed sentences
    pub sentences: Vec<Sentence>,
    /// Warnings generated during parsing
    pub warnings: Vec<ParseWarning>,
}

impl ParseResult {
    /// Create a new parse result
    pub fn new(sentences: Vec<Sentence>, warnings: Vec<ParseWarning>) -> Self {
        Self {
            sentences,
            warnings,
        }
    }

    /// Check if there are any warnings
    pub fn has_warnings(&self) -> bool {
        !self.warnings.is_empty()
    }
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

    /// Filter out problematic characters from text and return cleaned text with warnings
    fn filter_and_warn(&self, text: &str) -> (String, Vec<ParseWarning>) {
        // Characters to filter out (common problematic punctuation)
        let filter_chars: Vec<char> = vec!['"', '\'', '`', '{', '}', '[', ']'];

        let mut cleaned = String::with_capacity(text.len());
        let mut removed_chars = Vec::new();

        for ch in text.chars() {
            if filter_chars.contains(&ch) {
                // Track this character as removed
                if !removed_chars.contains(&ch) {
                    removed_chars.push(ch);
                }
            } else {
                cleaned.push(ch);
            }
        }

        // Create warnings for removed characters
        let warnings = if !removed_chars.is_empty() {
            vec![ParseWarning::FilteredChars(
                removed_chars.into_iter().collect(),
            )]
        } else {
            Vec::new()
        };

        (cleaned, warnings)
    }

    /// Parse text into structured sentences with input filtering and warning collection
    pub fn parse(&self, text: &str) -> ParseResult {
        // Filter out problematic characters
        let (filtered_text, filter_warnings) = self.filter_and_warn(text);

        // Normalize spaces
        let normalized = filtered_text.replace("  ", " ");

        // Parse with the cleaned text
        let preformatted = self.preformat(&normalized);

        let mut sentences = Vec::new();
        let mut all_warnings = filter_warnings;

        for sentence in &preformatted {
            let (parsed_sentence, sentence_warnings) = self.parse_sentence_with_warnings(sentence);
            if let Some(parsed) = parsed_sentence {
                sentences.push(parsed);
            }
            all_warnings.extend(sentence_warnings);
        }

        ParseResult::new(sentences, all_warnings)
    }

    /// Preformat text, splitting on punctuation
    fn preformat(&self, text: &str) -> Vec<ParsableSentence> {
        use regex::Regex;
        let re = Regex::new(r"[^.!?#]+[.!?#]+").unwrap();

        let matches: Vec<&str> = if let Some(_) = re.find(text) {
            let match_ranges: Vec<(usize, usize)> =
                re.find_iter(text).map(|m| (m.start(), m.end())).collect();

            let mut result: Vec<&str> = match_ranges
                .iter()
                .map(|(start, end)| &text[*start..*end])
                .collect();

            // Check if there's remaining text after the last match
            if let Some(&(_, last_end)) = match_ranges.last() {
                if last_end < text.len() {
                    let remaining = text[last_end..].trim();
                    if !remaining.is_empty() {
                        // Add the remaining text as an additional sentence (without punctuation)
                        result.push(remaining);
                    }
                }
            }

            result
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

            // Check if sentence ends with 'la' (as punctuation)
            // Handle cases like "ni pona la" or "ni pona la."
            // Check if the last word is 'la' (to avoid matching words like "kala" or "ala")
            let words: Vec<&str> = trimmed.split_whitespace().collect();
            let ends_with_la = words
                .last()
                .map(|w| {
                    // Remove any trailing punctuation from the word
                    w.trim_end_matches(|c: char| matches!(c, '.' | ':' | '!' | '?' | '#')) == "la"
                })
                .unwrap_or(false);

            let mut trailing_punctuation = Vec::new();

            // Extract punctuation and prepare body
            let body_str = if ends_with_la {
                // Extract all punctuation marks after 'la'
                let mut temp = trimmed.trim_end();
                while let Some(last_char) = temp.chars().last() {
                    if matches!(last_char, '.' | ':' | '!' | '?' | '#') {
                        trailing_punctuation.insert(0, last_char);
                        temp = temp.trim_end_matches(last_char).trim_end();
                    } else {
                        break;
                    }
                }
                // Remove 'la' and any trailing punctuation from body
                temp.trim_end_matches(" la").trim_end_matches("la")
            } else {
                // Check if the sentence ends with punctuation marks (when not ending with 'la')
                let mut temp = trimmed;
                while let Some(last_char) = temp.chars().last() {
                    if matches!(last_char, '.' | ':' | '!' | '?' | '#') {
                        trailing_punctuation.insert(0, last_char);
                        temp = temp.trim_end_matches(last_char).trim_end();
                    } else {
                        break;
                    }
                }
                temp
            };

            // Remove comma before and after  la-clause and before repeating li clause
            let body = body_str
                .replace(", la ", " la ")
                .replace("la, ", "la ")
                .replace(", li ", " li ");

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
                // Only add 'la' as separator if it's in the middle (not at the end)
                if la_parts.len() == 2 && i == 0 && !ends_with_la {
                    parsable.push_punctuation("la");
                }
            }

            // Add 'la' as punctuation if sentence ended with it
            if ends_with_la {
                parsable.push_punctuation("la");
            }

            // Add trailing punctuation marks (after 'la' or at end)
            for punct_char in trailing_punctuation.iter() {
                match punct_char {
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

        result
    }

    /// Parse a single sentence, returning the parsed sentence and any warnings
    fn parse_sentence_with_warnings(
        &self,
        sentence: &ParsableSentence,
    ) -> (Option<Sentence>, Vec<ParseWarning>) {
        let mut structured = Vec::new();
        let mut all_warnings = Vec::new();

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
                            content_with_placeholders =
                                content_with_placeholders.replace(m.as_str(), "'Name'");
                        }
                    }

                    let (value, sentence_warnings) = self
                        .get_simple_structured_sentence_with_warnings(&content_with_placeholders);
                    all_warnings.extend(sentence_warnings);

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

        let (structured, postprocess_warnings) = self.postprocess_with_warnings(structured);
        all_warnings.extend(postprocess_warnings);

        if structured.is_empty() && !all_warnings.is_empty() {
            (None, all_warnings)
        } else {
            (Some(Sentence { parts: structured }), all_warnings)
        }
    }

    /// Get simple structured sentence from parseable text, filtering out illegal tokens and collecting warnings
    fn get_simple_structured_sentence_with_warnings(
        &self,
        parseable: &str,
    ) -> (Vec<SentencePart>, Vec<ParseWarning>) {
        let tokens: Vec<&str> = parseable.split_whitespace().collect();
        let mut sentence = vec![SentencePart::Subject {
            tokens: Vec::new(),
            separator: None,
            parts: None,
        }];
        let mut current_part = 0;
        let mut warnings = Vec::new();

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
                && (index == 0
                    || !OBJECT_MARKERS.contains(&tokens[index - 1].to_lowercase().as_str()))
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
                        SentencePart::Subject {
                            tokens, separator, ..
                        } => !tokens.is_empty() && separator.is_some(),
                        SentencePart::ObjectMarker { tokens, .. } => !tokens.is_empty(),
                        SentencePart::PrepPhrase { tokens, .. } => !tokens.is_empty(),
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
                // Skip illegal token and add warning
                warnings.push(ParseWarning::IllegalToken(token_lower));
                continue;
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

        (sentence, warnings)
    }

    /// Split proper name into syllables, returning syllables and any warnings for illegal ones
    fn split_proper_into_syllables_with_warnings(
        &self,
        proper_name: &str,
    ) -> (Vec<String>, Vec<ParseWarning>) {
        if proper_name.is_empty() {
            return (Vec::new(), Vec::new());
        }

        let name = proper_name.to_lowercase();
        let chars: Vec<char> = name.chars().collect();
        let mut syllables = Vec::new();
        let mut warnings = Vec::new();

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
                            warnings.push(ParseWarning::IllegalSyllable(syllable));
                            i += 3;
                            continue;
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
                            warnings.push(ParseWarning::IllegalSyllable(syllable));
                            i += 2;
                            continue;
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
                        warnings.push(ParseWarning::IllegalSyllable(syllable));
                        i += 2;
                        continue;
                    }
                    syllables.push(syllable);
                    break;
                } else if is_n && !third_is_vowel {
                    // 2-character syllable: UNpa
                    if i + 2 <= chars.len() {
                        let syllable: String = chars[i..i + 2].iter().collect();
                        if !self.allowed_syllables.contains(&syllable) {
                            warnings.push(ParseWarning::IllegalSyllable(syllable));
                            i += 2;
                            continue;
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
                        warnings.push(ParseWarning::IllegalSyllable(syllable));
                        i += 1;
                        continue;
                    }
                    syllables.push(syllable);
                    i += 1;
                }
            }
        }

        (syllables, warnings)
    }

    /// Postprocess structured sentence, collecting warnings for illegal syllables in proper names
    fn postprocess_with_warnings(
        &self,
        mut sentence: Vec<SentencePart>,
    ) -> (Vec<SentencePart>, Vec<ParseWarning>) {
        let mut all_warnings = Vec::new();

        // Split prepositional phrases inside containers
        for i in 0..sentence.len() {
            let mut new_parts = None;
            match &sentence[i] {
                SentencePart::Subject { tokens, parts, .. }
                | SentencePart::ObjectMarker { tokens, parts, .. }
                | SentencePart::PrepPhrase { tokens, parts, .. } => {
                    // Skip parts that already have nested structures
                    if parts.is_some() {
                        continue;
                    }
                    let is_object_marker =
                        matches!(&sentence[i], SentencePart::ObjectMarker { .. });
                    // Find all container markers and their end positions
                    let mut container_ranges = Vec::new();
                    let mut j = 0;
                    while j < tokens.len() {
                        if PREPOSITION_CONTAINERS.contains(&tokens[j].as_str())
                            && j < tokens.len() - 1
                        {
                            let container_start = j;
                            // In li/e container, preposition directly after li stays as isolated glyph(s) inside li
                            if is_object_marker && container_start == 0 {
                                j += 1;
                                continue;
                            }
                            let container_token = tokens[j].clone();

                            // Find where this container ends
                            // It ends at: next separator (en, li, e), next preposition, or end of tokens
                            let mut container_end = tokens.len();
                            for k in (j + 1)..tokens.len() {
                                let token_lower = tokens[k].to_lowercase();
                                // Stop at separators
                                if token_lower == "en"
                                    || token_lower == "anu"
                                    || token_lower == "li"
                                    || token_lower == "e"
                                {
                                    container_end = k;
                                    break;
                                }
                                // Stop at next preposition (but not pi, as pi can nest)
                                if PREPOSITION_CONTAINERS.contains(&token_lower.as_str())
                                    && token_lower != "pi"
                                {
                                    container_end = k;
                                    break;
                                }
                            }

                            container_ranges.push((
                                container_start,
                                container_end,
                                container_token,
                            ));
                            j = container_end;
                        } else {
                            j += 1;
                        }
                    }

                    if !container_ranges.is_empty() {
                        let mut parts = Vec::new();
                        let mut last_end = 0;

                        for (start, end, container_token) in container_ranges {
                            // Add tokens before this container
                            if start > last_end {
                                parts.push(SentencePart::Subject {
                                    tokens: tokens[last_end..start].to_vec(),
                                    separator: None,
                                    parts: None,
                                });
                            }

                            // Add the container with its contents
                            parts.push(SentencePart::Subject {
                                tokens: tokens[start + 1..end].to_vec(),
                                separator: Some(container_token),
                                parts: None,
                            });

                            last_end = end;
                        }

                        // Add remaining tokens after last container
                        if last_end < tokens.len() {
                            parts.push(SentencePart::Subject {
                                tokens: tokens[last_end..].to_vec(),
                                separator: None,
                                parts: None,
                            });
                        }

                        // Recursively process the new parts for nested containers
                        let mut processed_parts = Vec::new();
                        let mut container_warnings = Vec::new();
                        for part in parts {
                            let temp_sentence = vec![part];
                            let (processed, warnings) =
                                self.postprocess_with_warnings(temp_sentence);
                            processed_parts.extend(processed);
                            container_warnings.extend(warnings);
                        }
                        all_warnings.extend(container_warnings);

                        new_parts = Some(processed_parts);
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
                | SentencePart::PrepPhrase { tokens, .. } => tokens
                    .iter()
                    .enumerate()
                    .filter_map(|(idx, token)| {
                        if token
                            .chars()
                            .next()
                            .map(|c| c.is_uppercase())
                            .unwrap_or(false)
                        {
                            Some(idx)
                        } else {
                            None
                        }
                    })
                    .collect(),
                _ => continue,
            };

            if !name_indices.is_empty() {
                let mut new_parts = Vec::new();
                let mut last = 0;

                match &sentence[i] {
                    SentencePart::Subject {
                        tokens, separator, ..
                    } => {
                        for &idx in &name_indices {
                            if idx > last {
                                new_parts.push(SentencePart::Subject {
                                    tokens: tokens[last..idx].to_vec(),
                                    separator: None,
                                    parts: None,
                                });
                            }
                            let name = tokens[idx].clone();
                            let (syllables, name_warnings) =
                                self.split_proper_into_syllables_with_warnings(&name);
                            all_warnings.extend(name_warnings);
                            if !syllables.is_empty() {
                                new_parts.push(SentencePart::Subject {
                                    tokens: syllables,
                                    separator: Some("cartouche".to_string()),
                                    parts: None,
                                });
                            }
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
                    SentencePart::ObjectMarker {
                        tokens, separator, ..
                    } => {
                        for &idx in &name_indices {
                            if idx > last {
                                new_parts.push(SentencePart::ObjectMarker {
                                    separator: separator.clone(),
                                    tokens: tokens[last..idx].to_vec(),
                                    parts: None,
                                });
                            }
                            let name = tokens[idx].clone();
                            let (syllables, name_warnings) =
                                self.split_proper_into_syllables_with_warnings(&name);
                            all_warnings.extend(name_warnings);
                            if !syllables.is_empty() {
                                new_parts.push(SentencePart::ObjectMarker {
                                    separator: "cartouche".to_string(),
                                    tokens: syllables,
                                    parts: None,
                                });
                            }
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
                    SentencePart::PrepPhrase {
                        tokens, separator, ..
                    } => {
                        for &idx in &name_indices {
                            if idx > last {
                                new_parts.push(SentencePart::PrepPhrase {
                                    separator: separator.clone(),
                                    tokens: tokens[last..idx].to_vec(),
                                    parts: None,
                                });
                            }
                            let name = tokens[idx].clone();
                            let (syllables, name_warnings) =
                                self.split_proper_into_syllables_with_warnings(&name);
                            all_warnings.extend(name_warnings);
                            if !syllables.is_empty() {
                                new_parts.push(SentencePart::PrepPhrase {
                                    separator: "cartouche".to_string(),
                                    tokens: syllables,
                                    parts: None,
                                });
                            }
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

        (sentence, all_warnings)
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
        self.parts
            .push(ParsablePart::Punctuation(punct.to_string()));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple() {
        let parser = Parser::new();
        let result = parser.parse("mi pona.");
        assert_eq!(result.sentences.len(), 1);
    }

    #[test]
    fn test_pi_container_boundaries() {
        let parser = Parser::new();
        let result = parser.parse("jan pi pona mute en jan pi sona lili.");
        assert_eq!(result.sentences.len(), 1);

        // Check that the sentence has the expected structure
        let sentence = &result.sentences[0];
        // The sentence should have parts that correctly contain "pona mute" and "sona lili" in pi-containers
        // We can't easily test the exact structure without exposing internals, but we can verify it parses
        assert!(!sentence.parts.is_empty());
    }
}
