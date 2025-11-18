/// Layout algorithm for Sitelen Sitelen

use crate::types::*;
use std::collections::HashMap;

/// Layout engine
pub struct LayoutEngine;

impl LayoutEngine {
    pub fn new() -> Self {
        Self
    }

    /// Layout a compound sentence
    pub fn layout_compound(&self, sentence: &Sentence) -> Vec<LayoutOption> {
        let mut hash_map = Vec::new();

        for part in &sentence.parts {
            let (np_options, part_type, separator) = match part {
                SentencePart::Subject { parts, tokens, separator, .. } => {
                    let options = if let Some(parts) = parts {
                        // Recursively layout parts
                        let sub_sentence = Sentence { parts: parts.clone() };
                        self.layout_compound(&sub_sentence)
                    } else if separator.as_deref() == Some("cartouche") {
                        self.convert_cartouche(tokens)
                    } else {
                        self.convert_noun_phrase(tokens)
                    };
                    (options, "container", separator.clone())
                }
                SentencePart::ObjectMarker { parts, tokens, separator, .. } => {
                    let options = if let Some(parts) = parts {
                        let sub_sentence = Sentence { parts: parts.clone() };
                        self.layout_compound(&sub_sentence)
                    } else if separator == "cartouche" {
                        self.convert_cartouche(tokens)
                    } else {
                        self.convert_noun_phrase(tokens)
                    };
                    (options, "container", Some(separator.clone()))
                }
                SentencePart::PrepPhrase { parts, tokens, separator, .. } => {
                    let options = if let Some(parts) = parts {
                        let sub_sentence = Sentence { parts: parts.clone() };
                        self.layout_compound(&sub_sentence)
                    } else if separator == "cartouche" {
                        self.convert_cartouche(tokens)
                    } else {
                        self.convert_noun_phrase(tokens)
                    };
                    (options, "container", Some(separator.clone()))
                }
                SentencePart::Punctuation { tokens } => {
                    (self.convert_noun_phrase(tokens), "punctuation", None)
                }
                SentencePart::Address { tokens, separator, .. } => {
                    (self.convert_noun_phrase(tokens), "container", Some(separator.clone()))
                }
                SentencePart::Interjection { tokens } => {
                    (self.convert_noun_phrase(tokens), "container", None)
                }
            };

            hash_map.push(HashMapEntry {
                part_type: part_type.to_string(),
                separator,
                options: np_options,
            });
        }

        let mut compound_options = Vec::new();
        if !hash_map.is_empty() {
            self.go(0, &hash_map, &mut Vec::new(), &mut compound_options);
        }

        compound_options
    }

    fn go(
        &self,
        index: usize,
        hash_map: &[HashMapEntry],
        units: &mut Vec<LayoutUnit>,
        compound_options: &mut Vec<LayoutOption>,
    ) {
        for option in &hash_map[index].options {
            let mut new_units = units.clone();
            
            let layout_type = if hash_map[index].part_type == "punctuation" {
                LayoutType::Punctuation
            } else {
                LayoutType::Container
            };

            let separator = hash_map[index].separator.clone();
            
            // Create a layout unit for the container
            let container_unit = LayoutUnit::Container {
                units: option.state.units.clone(),
                size: option.size,
                separator: separator.clone(),
                layout_type: layout_type.clone(),
            };
            
            new_units.push(container_unit);

            if index + 1 < hash_map.len() {
                self.go(index + 1, hash_map, &mut new_units, compound_options);
            } else {
                let container_options = self.layout_container(&new_units);
                for mut opt in container_options {
                    opt.separator = separator.clone();
                    opt.layout_type = layout_type;
                    compound_options.push(opt);
                }
            }
        }
    }

    /// Layout a container with units
    fn layout_container(&self, units: &[LayoutUnit]) -> Vec<LayoutOption> {
        if units.is_empty() {
            return Vec::new();
        }

        let mut options = Vec::new();
        let mut hash: HashMap<String, LayoutOption> = HashMap::new();
        let mut min_surface = 1e6;

        self.layout_container_recursive(units, None, None, &mut options, &mut hash, &mut min_surface);

        options
    }

    fn layout_container_recursive(
        &self,
        units: &[LayoutUnit],
        state: Option<&LayoutState>,
        iterator: Option<IteratorState>,
        options: &mut Vec<LayoutOption>,
        hash: &mut HashMap<String, LayoutOption>,
        min_surface: &mut f64,
    ) {
        if state.is_none() {
            // Place the first unit directly
            let first_size = self.get_unit_size(&units[0]);
            let mut new_state = LayoutState {
                units: vec![PlacedUnit {
                    unit: units[0].clone(),
                    size: first_size,
                    position: Position::new(0.0, 0.0),
                }],
                size: first_size,
                forbidden: vec![Position::new(first_size.width, first_size.height)],
            };

            if units.len() == 1 {
                let new_option = self.create_option(&new_state, LayoutType::Container, None);
                let key = self.option_key(&new_option);
                options.push(new_option);
                return;
            }

            for j in 1..units.len() {
                // Prevent punctuation elements to be placed to the right, alone
                if !self.is_punctuation(&units[1]) {
                    self.layout_container_recursive(
                        units,
                        Some(&new_state),
                        Some(IteratorState {
                            goes_down: false,
                            index: 1,
                            length: j,
                        }),
                        options,
                        hash,
                        min_surface,
                    );
                }
                self.layout_container_recursive(
                    units,
                    Some(&new_state),
                    Some(IteratorState {
                        goes_down: true,
                        index: 1,
                        length: j,
                    }),
                    options,
                    hash,
                    min_surface,
                );
            }
            return;
        }

        let state = state.unwrap();
        let iterator = iterator.unwrap();

        let goes_down = iterator.goes_down;
        let index = iterator.index;
        let length = iterator.length;

        let mut new_state = LayoutState {
            units: state.units.clone(),
            size: state.size,
            forbidden: state.forbidden.clone(),
        };

        let prev_size = self.get_unit_size(&units[index]);
        let unit_position = if goes_down {
            Position::new(0.0, state.size.height)
        } else {
            Position::new(state.size.width, 0.0)
        };

        // Determine size sum and check compatibility
        let mut size_sum = Size::new(0.0, 0.0);
        for i in index..index + length {
            let add_size = self.get_unit_size(&units[i]);
            if (goes_down && (add_size.height - prev_size.height).abs() > 1e-6)
                || (!goes_down && (add_size.width - prev_size.width).abs() > 1e-6)
            {
                return;
            }
            size_sum.width += add_size.width;
            size_sum.height += add_size.height;
        }

        // Add units one by one
        let mut current_pos = unit_position;
        for i in index..index + length {
            let add_size = self.get_unit_size(&units[i]);
            let add_axis = if goes_down { 1 } else { 0 };
            let fixed_axis = if goes_down { 0 } else { 1 };

            let add = if goes_down {
                add_size.height * new_state.size.width / size_sum.width
            } else {
                add_size.width * new_state.size.height / size_sum.height
            };

            let glyph_size = if goes_down {
                Size::new(
                    add_size.width * add / add_size.height,
                    add,
                )
            } else {
                Size::new(
                    add,
                    add_size.height * add / add_size.width,
                )
            };

            if i == index {
                if goes_down {
                    new_state.size.height += add;
                } else {
                    new_state.size.width += add;
                }
            }

            if goes_down {
                let pos_key = format!("{:.2},{:.2}", current_pos.x, current_pos.y);
                if new_state.forbidden.iter().any(|p| {
                    (p.x - current_pos.x).abs() < 1e-6 && (p.y - current_pos.y).abs() < 1e-6
                }) {
                    return;
                }
            }

            new_state.units.push(PlacedUnit {
                unit: units[i].clone(),
                size: glyph_size,
                position: current_pos,
            });

            // Update position
            if goes_down {
                current_pos.x += glyph_size.width;
            } else {
                current_pos.y += glyph_size.height;
            }

            // Forbid next position
            let forbidden_pos = if goes_down {
                Position::new(
                    current_pos.x + glyph_size.width,
                    current_pos.y,
                )
            } else {
                Position::new(
                    current_pos.x,
                    current_pos.y + glyph_size.height,
                )
            };
            new_state.forbidden.push(forbidden_pos);
        }

        // If all units are used up, add final result
        if index + length == units.len() {
            let mut new_option = self.create_option(&new_state, LayoutType::Container, None);
            new_option = self.normalize_option(new_option);

            *min_surface = (*min_surface).min(new_option.surface);
            if new_option.surface / *min_surface < 2.0 {
                let key = self.option_key(&new_option);
                if !hash.contains_key(&key) {
                    hash.insert(key, new_option.clone());
                    options.push(new_option);
                }
            }
            return;
        }

        // Continue with remaining units
        for j in 1..units.len() - (index + length) + 1 {
            if !self.is_punctuation(&units[index + length]) {
                self.layout_container_recursive(
                    units,
                    Some(&new_state),
                    Some(IteratorState {
                        goes_down: false,
                        index: index + length,
                        length: j,
                    }),
                    options,
                    hash,
                    min_surface,
                );
            }
            self.layout_container_recursive(
                units,
                Some(&new_state),
                Some(IteratorState {
                    goes_down: true,
                    index: index + length,
                    length: j,
                }),
                options,
                hash,
                min_surface,
            );
        }
    }

    fn create_option(
        &self,
        state: &LayoutState,
        layout_type: LayoutType,
        separator: Option<String>,
    ) -> LayoutOption {
        let ratio = state.size.ratio();
        let normed_ratio = if ratio < 1.0 { ratio } else { 1.0 / ratio };
        LayoutOption {
            layout_type,
            separator,
            state: state.clone(),
            size: state.size,
            ratio,
            normed_ratio,
            surface: state.size.surface(),
        }
    }

    fn normalize_option(&self, mut option: LayoutOption) -> LayoutOption {
        let mut min_size = 1.0;
        for glyph in &option.state.units {
            if glyph.size.width < min_size {
                min_size = glyph.size.width.max(glyph.size.height);
            }
        }

        option.size.width /= min_size;
        option.size.height /= min_size;
        option.surface /= min_size * min_size;

        for glyph in &mut option.state.units {
            glyph.size.width /= min_size;
            glyph.size.height /= min_size;
            glyph.position.x /= min_size;
            glyph.position.y /= min_size;
        }

        option
    }

    fn option_key(&self, option: &LayoutOption) -> String {
        // Create a comprehensive key that includes the layout structure
        // This matches JavaScript's JSON.stringify behavior which includes the entire structure
        // We need to capture: type, size, ratio, and all units with their positions and types
        let mut key_parts = Vec::new();
        
        // Add layout type and dimensions (matching JavaScript structure)
        key_parts.push(format!("type:{:?}", option.layout_type));
        key_parts.push(format!("size:{:.4}:{:.4}", option.size.width, option.size.height));
        key_parts.push(format!("ratio:{:.4}", option.ratio));
        key_parts.push(format!("surface:{:.4}", option.surface));
        
        // Add all units in order (JSON.stringify preserves array order)
        // Include unit type, token, position, and size to fully capture the layout
        for placed in &option.state.units {
            let unit_str = match &placed.unit {
                LayoutUnit::WordGlyph { token, .. } => {
                    format!("wg:{}:pos({:.4},{:.4}):size({:.4},{:.4})", 
                        token, placed.position.x, placed.position.y, placed.size.width, placed.size.height)
                },
                LayoutUnit::SyllableGlyph { token, .. } => {
                    format!("syl:{}:pos({:.4},{:.4}):size({:.4},{:.4})", 
                        token, placed.position.x, placed.position.y, placed.size.width, placed.size.height)
                },
                LayoutUnit::Container { layout_type, separator, size, .. } => {
                    format!("cont:{:?}:sep:{:?}:pos({:.4},{:.4}):size({:.4},{:.4})", 
                        layout_type, separator.as_ref().map(|s| s.as_str()).unwrap_or("none"),
                        placed.position.x, placed.position.y, placed.size.width, placed.size.height)
                },
                LayoutUnit::Punctuation { tokens, .. } => {
                    format!("punct:{:?}:pos({:.4},{:.4}):size({:.4},{:.4})", 
                        tokens, placed.position.x, placed.position.y, placed.size.width, placed.size.height)
                },
            };
            key_parts.push(unit_str);
        }
        
        key_parts.join("|")
    }

    fn get_unit_size(&self, unit: &LayoutUnit) -> Size {
        match unit {
            LayoutUnit::WordGlyph { size, .. }
            | LayoutUnit::SyllableGlyph { size, .. }
            | LayoutUnit::Container { size, .. }
            | LayoutUnit::Punctuation { size, .. } => *size,
        }
    }

    fn is_punctuation(&self, unit: &LayoutUnit) -> bool {
        match unit {
            LayoutUnit::Punctuation { .. } => true,
            LayoutUnit::Container { layout_type, .. } => *layout_type == LayoutType::Punctuation,
            _ => false,
        }
    }

    /// Convert noun phrase tokens to layout units
    fn convert_noun_phrase(&self, tokens: &[String]) -> Vec<LayoutOption> {
        const SMALL_MODIFIERS: &[&str] = &["kon", "lili", "mute", "sin"];
        const NARROW_MODIFIERS: &[&str] = &["wan", "tu", "anu", "en", "kin"];
        const PUNCTUATION: &[&str] = &["period", "exclamation", "question"];
        const SINGLE_PUNCTUATION: &[&str] = &["comma", "colon"];
        const LARGE_PUNCTUATION: &[&str] = &["la", "banner"];

        fn get_size_of(token: &str) -> Size {
            if SINGLE_PUNCTUATION.contains(&token) {
                Size::new(4.0, 0.5)
            } else if PUNCTUATION.contains(&token) {
                Size::new(4.0, 0.75)
            } else if LARGE_PUNCTUATION.contains(&token) {
                Size::new(4.0, 1.0)
            } else if SMALL_MODIFIERS.contains(&token) {
                Size::new(1.0, 0.5)
            } else if NARROW_MODIFIERS.contains(&token) {
                Size::new(0.5, 1.0)
            } else {
                Size::new(1.0, 1.0)
            }
        }

        let units: Vec<LayoutUnit> = tokens
            .iter()
            .map(|token| LayoutUnit::WordGlyph {
                token: token.clone(),
                size: get_size_of(token),
            })
            .collect();

        self.layout_container(&units)
    }

    /// Convert cartouche tokens to layout units
    fn convert_cartouche(&self, tokens: &[String]) -> Vec<LayoutOption> {
        const NARROW_SYLS: &[&str] = &[
            "li", "ni", "si", "lin", "nin", "sin", "le", "ne", "se", "len", "nen", "sen", "lo",
            "no", "so", "lon", "non", "son", "la", "na", "sa", "lan", "nan", "san", "lu", "nu",
            "su", "lun", "nun", "sun",
        ];

        fn get_size_of(token: &str) -> Size {
            if NARROW_SYLS.contains(&token) {
                Size::new(0.5, 1.0)
            } else {
                Size::new(1.0, 1.0)
            }
        }

        let units: Vec<LayoutUnit> = tokens
            .iter()
            .map(|token| LayoutUnit::SyllableGlyph {
                token: token.clone(),
                size: get_size_of(token),
            })
            .collect();

        self.layout_container(&units)
    }
}

impl Default for LayoutEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug)]
struct HashMapEntry {
    part_type: String,
    separator: Option<String>,
    options: Vec<LayoutOption>,
}

#[derive(Debug, Clone, Copy)]
struct IteratorState {
    goes_down: bool,
    index: usize,
    length: usize,
}

