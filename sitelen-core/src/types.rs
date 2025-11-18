/// Core data structures for the Sitelen Sitelen renderer

/// Part of a sentence (subject, object, prepositional phrase, etc.)
#[derive(Debug, Clone, PartialEq)]
pub enum SentencePart {
    Subject {
        tokens: Vec<String>,
        separator: Option<String>,
        parts: Option<Vec<SentencePart>>,
    },
    ObjectMarker {
        separator: String,
        tokens: Vec<String>,
        parts: Option<Vec<SentencePart>>,
    },
    PrepPhrase {
        separator: String,
        tokens: Vec<String>,
        parts: Option<Vec<SentencePart>>,
    },
    Address {
        separator: String,
        tokens: Vec<String>,
    },
    Interjection {
        tokens: Vec<String>,
    },
    Punctuation {
        tokens: Vec<String>,
    },
}

/// A structured sentence ready for layout
#[derive(Debug, Clone)]
pub struct Sentence {
    pub parts: Vec<SentencePart>,
}

/// Size in 2D space
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}

impl Size {
    pub fn new(width: f64, height: f64) -> Self {
        Self { width, height }
    }

    pub fn ratio(&self) -> f64 {
        if self.height > 0.0 {
            self.width / self.height
        } else {
            0.0
        }
    }

    pub fn surface(&self) -> f64 {
        self.width * self.height
    }
}

/// Position in 2D space
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

impl Position {
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }
}

/// A unit that can be laid out (glyph, syllable, or container)
#[derive(Debug, Clone)]
pub enum LayoutUnit {
    WordGlyph {
        token: String,
        size: Size,
    },
    SyllableGlyph {
        token: String,
        size: Size,
    },
    Container {
        units: Vec<PlacedUnit>,
        size: Size,
    },
    Punctuation {
        tokens: Vec<String>,
        size: Size,
    },
}

/// A unit that has been placed in a layout
#[derive(Debug, Clone)]
pub struct PlacedUnit {
    pub unit: LayoutUnit,
    pub size: Size,
    pub position: Position,
}

/// State during layout calculation
#[derive(Debug, Clone)]
pub struct LayoutState {
    pub units: Vec<PlacedUnit>,
    pub size: Size,
    pub forbidden: Vec<Position>,
}

/// A layout option for a container
#[derive(Debug, Clone)]
pub struct LayoutOption {
    pub layout_type: LayoutType,
    pub separator: Option<String>,
    pub state: LayoutState,
    pub size: Size,
    pub ratio: f64,
    pub normed_ratio: f64,
    pub surface: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum LayoutType {
    Container,
    Punctuation,
}

/// A complete layout for rendering
#[derive(Debug, Clone)]
pub struct Layout {
    pub compounds: Vec<LayoutOption>,
}

