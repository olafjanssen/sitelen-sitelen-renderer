/// Layout algorithm for Sitelen Sitelen
///
/// This module implements a recursive layout algorithm that generates multiple
/// arrangement options for Sitelen Sitelen glyphs. The algorithm:
///
/// 1. Places units (glyphs, syllables, or containers) in a 2D grid
/// 2. Allows units to be placed either downward (vertically) or to the right (horizontally)
/// 3. Prevents punctuation from being placed horizontally (to maintain reading flow)
/// 4. Generates all valid layout combinations
/// 5. Normalizes and deduplicates options based on their structure
///
/// The algorithm uses a recursive backtracking approach, exploring all valid
/// placement combinations while respecting size compatibility constraints.

use crate::types::*;
use std::collections::HashMap;

// Constants
const INITIAL_MIN_SURFACE: f64 = 1_000_000.0;
const EPSILON: f64 = 1e-6;
const MAX_SURFACE_RATIO: f64 = 2.0;
const NORMALIZATION_MIN_SIZE: f64 = 1.0;

/// Layout engine for generating arrangement options for Sitelen Sitelen text
pub struct LayoutEngine;

impl LayoutEngine {
    /// Create a new layout engine
    pub fn new() -> Self {
        Self
    }

    /// Layout a compound sentence into all possible arrangement options
    ///
    /// This is the main entry point for layout generation. It processes a sentence
    /// by breaking it into parts (subject, object markers, prepositional phrases, etc.),
    /// generates layout options for each part, and then combines them into final
    /// compound layout options.
    ///
    /// # Arguments
    /// * `sentence` - The structured sentence to layout
    ///
    /// # Returns
    /// A vector of layout options, each representing a different valid arrangement
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
            self.combine_part_options(0, &hash_map, &mut Vec::new(), &mut compound_options);
        }

        compound_options
    }

    /// Recursively combine part options into compound layout options
    ///
    /// This function generates all combinations of layout options from different
    /// sentence parts. For each option of the current part, it recursively processes
    /// the remaining parts, building up complete compound layouts.
    ///
    /// # Arguments
    /// * `index` - Current part index in the hash_map
    /// * `hash_map` - Map of sentence parts to their layout options
    /// * `units` - Accumulated layout units from previous parts
    /// * `compound_options` - Output vector for completed compound options
    fn combine_part_options(
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
                self.combine_part_options(index + 1, hash_map, &mut new_units, compound_options);
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

    /// Generate all layout options for a container of units
    ///
    /// This function explores all possible arrangements of units within a container.
    /// Units can be placed either downward (vertically) or to the right (horizontally),
    /// with constraints to ensure valid layouts.
    ///
    /// # Arguments
    /// * `units` - The units to arrange within the container
    ///
    /// # Returns
    /// A vector of layout options, each representing a different valid arrangement
    fn layout_container(&self, units: &[LayoutUnit]) -> Vec<LayoutOption> {
        if units.is_empty() {
            return Vec::new();
        }

        let mut options = Vec::new();
        let mut hash: HashMap<String, LayoutOption> = HashMap::new();
        let mut min_surface = INITIAL_MIN_SURFACE;

        self.layout_container_recursive(units, None, None, &mut options, &mut hash, &mut min_surface);

        options
    }

    /// Recursively generate layout options by placing units
    ///
    /// This is the core recursive function that explores all valid placement combinations.
    /// It handles three phases:
    /// 1. Initialization: Place the first unit at origin
    /// 2. Placement: Place groups of units either downward or to the right
    /// 3. Continuation: Recursively place remaining units
    ///
    /// # Arguments
    /// * `units` - All units to be placed
    /// * `state` - Current layout state (None for initialization)
    /// * `placement` - Placement strategy (None for initialization)
    /// * `options` - Output vector for completed options
    /// * `hash` - Hash map for deduplication
    /// * `min_surface` - Track minimum surface area for filtering
    fn layout_container_recursive(
        &self,
        units: &[LayoutUnit],
        state: Option<&LayoutState>,
        placement: Option<PlacementStrategy>,
        options: &mut Vec<LayoutOption>,
        hash: &mut HashMap<String, LayoutOption>,
        min_surface: &mut f64,
    ) {
        if state.is_none() {
            // Place the first unit directly
            let first_size = self.get_unit_size(&units[0]);
            let new_state = LayoutState {
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
                options.push(new_option);
                return;
            }

            for j in 1..units.len() {
                // Prevent punctuation elements to be placed to the right, alone
                if !self.is_punctuation(&units[1]) {
                    self.try_place_units(
                        units,
                        &new_state,
                        1,
                        j,
                        false,
                        options,
                        hash,
                        min_surface,
                    );
                }
                self.try_place_units(
                    units,
                    &new_state,
                    1,
                    j,
                    true,
                    options,
                    hash,
                    min_surface,
                );
            }
            return;
        }

        let state = state.unwrap();
        let placement = placement.unwrap();
        
        self.place_unit_group(
            units,
            state,
            placement,
            options,
            hash,
            min_surface,
        );
    }


    /// Place a group of units according to the placement strategy
    fn place_unit_group(
        &self,
        units: &[LayoutUnit],
        state: &LayoutState,
        placement: PlacementStrategy,
        options: &mut Vec<LayoutOption>,
        hash: &mut HashMap<String, LayoutOption>,
        min_surface: &mut f64,
    ) {
        let PlacementStrategy { goes_down, index, length } = placement;

        let mut new_state = LayoutState {
            units: state.units.clone(),
            size: state.size,
            forbidden: state.forbidden.clone(),
        };

        let prev_size = self.get_unit_size(&units[index]);
        let unit_position = self.calculate_placement_position(state, goes_down);

        // Check size compatibility and calculate size sum
        let size_sum = match self.check_size_compatibility_and_sum(units, index, length, goes_down, prev_size) {
            Some(sum) => sum,
            None => return, // Incompatible sizes
        };

        // Place units one by one
        let mut current_pos = unit_position;
        for i in index..index + length {
            let add_size = self.get_unit_size(&units[i]);
            let glyph_size = self.calculate_glyph_size(
                add_size,
                &new_state.size,
                &size_sum,
                goes_down,
            );
            let add = if goes_down { glyph_size.height } else { glyph_size.width };

            // Update container size when placing first unit of group
            if i == index {
                if goes_down {
                    new_state.size.height += add;
                } else {
                    new_state.size.width += add;
                }
            }

            // Check forbidden position (only for downward placement)
            if goes_down && self.is_position_forbidden(&new_state.forbidden, &current_pos) {
                return;
            }

            // Add unit to layout
            new_state.units.push(PlacedUnit {
                unit: units[i].clone(),
                size: glyph_size,
                position: current_pos,
            });

            // Update position for next unit
            if goes_down {
                current_pos.x += glyph_size.width;
            } else {
                current_pos.y += glyph_size.height;
            }

            // Mark next position as forbidden to prevent overlap
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

        // If all units are placed, finalize the option
        if index + length == units.len() {
            self.finalize_option(&new_state, options, hash, min_surface);
            return;
        }

        // Continue placing remaining units
        self.continue_placement(units, &new_state, index + length, options, hash, min_surface);
    }

    /// Finalize a completed layout option
    fn finalize_option(
        &self,
        state: &LayoutState,
        options: &mut Vec<LayoutOption>,
        hash: &mut HashMap<String, LayoutOption>,
        min_surface: &mut f64,
    ) {
        let mut new_option = self.create_option(state, LayoutType::Container, None);
        new_option = self.normalize_option(new_option);

        *min_surface = (*min_surface).min(new_option.surface);
        if new_option.surface / *min_surface < MAX_SURFACE_RATIO {
            let key = self.option_key(&new_option);
            if !hash.contains_key(&key) {
                hash.insert(key, new_option.clone());
                options.push(new_option);
            }
        }
    }

    /// Continue placing remaining units after a group has been placed
    fn continue_placement(
        &self,
        units: &[LayoutUnit],
        state: &LayoutState,
        next_index: usize,
        options: &mut Vec<LayoutOption>,
        hash: &mut HashMap<String, LayoutOption>,
        min_surface: &mut f64,
    ) {
        for j in 1..units.len() - next_index + 1 {
            if !self.is_punctuation(&units[next_index]) {
                self.try_place_units(
                    units,
                    state,
                    next_index,
                    j,
                    false,
                    options,
                    hash,
                    min_surface,
                );
            }
            self.try_place_units(
                units,
                state,
                next_index,
                j,
                true,
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
        let mut min_size = NORMALIZATION_MIN_SIZE;
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
                LayoutUnit::Container { layout_type, separator, .. } => {
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

    /// Calculate the position where the next group of units should be placed
    fn calculate_placement_position(&self, state: &LayoutState, goes_down: bool) -> Position {
        if goes_down {
            Position::new(0.0, state.size.height)
        } else {
            Position::new(state.size.width, 0.0)
        }
    }

    /// Check if units can be placed together and calculate their combined size
    ///
    /// Returns `Some(size_sum)` if compatible, `None` if incompatible.
    fn check_size_compatibility_and_sum(
        &self,
        units: &[LayoutUnit],
        index: usize,
        length: usize,
        goes_down: bool,
        prev_size: Size,
    ) -> Option<Size> {
        let mut size_sum = Size::new(0.0, 0.0);
        for i in index..index + length {
            let add_size = self.get_unit_size(&units[i]);
            if (goes_down && (add_size.height - prev_size.height).abs() > EPSILON)
                || (!goes_down && (add_size.width - prev_size.width).abs() > EPSILON)
            {
                return None; // Incompatible sizes
            }
            size_sum.width += add_size.width;
            size_sum.height += add_size.height;
        }
        Some(size_sum)
    }

    /// Check if a position is in the forbidden list
    fn is_position_forbidden(&self, forbidden: &[Position], pos: &Position) -> bool {
        forbidden.iter().any(|p| {
            (p.x - pos.x).abs() < EPSILON && (p.y - pos.y).abs() < EPSILON
        })
    }

    /// Calculate the size of a glyph when placed in a group
    ///
    /// The size is scaled proportionally based on the available space and
    /// the unit's relative size within the group.
    fn calculate_glyph_size(
        &self,
        unit_size: Size,
        container_size: &Size,
        group_size_sum: &Size,
        goes_down: bool,
    ) -> Size {
        let add = if goes_down {
            unit_size.height * container_size.width / group_size_sum.width
        } else {
            unit_size.width * container_size.height / group_size_sum.height
        };

        if goes_down {
            Size::new(
                unit_size.width * add / unit_size.height,
                add,
            )
        } else {
            Size::new(
                add,
                unit_size.height * add / unit_size.width,
            )
        }
    }

    /// Try to place a group of units with the given strategy
    ///
    /// Helper function to reduce duplication in recursive calls.
    fn try_place_units(
        &self,
        units: &[LayoutUnit],
        state: &LayoutState,
        index: usize,
        length: usize,
        goes_down: bool,
        options: &mut Vec<LayoutOption>,
        hash: &mut HashMap<String, LayoutOption>,
        min_surface: &mut f64,
    ) {
        self.layout_container_recursive(
            units,
            Some(state),
            Some(PlacementStrategy {
                goes_down,
                index,
                length,
            }),
            options,
            hash,
            min_surface,
        );
    }

    /// Check if a unit is punctuation (cannot be placed horizontally)
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

/// Strategy for placing a group of units in the layout
///
/// Describes how to place the next group of units: their starting index,
/// how many to place together, and the direction (downward or to the right).
#[derive(Debug, Clone, Copy)]
struct PlacementStrategy {
    /// If true, place units downward (vertically); if false, place to the right (horizontally)
    goes_down: bool,
    /// Starting index of units to place
    index: usize,
    /// Number of units to place in this group
    length: usize,
}

