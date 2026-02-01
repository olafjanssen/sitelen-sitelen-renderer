/// CLI application for Sitelen Sitelen renderer

use clap::{Parser, ValueEnum};
use sitelen_core::{OutputFormat, Pipeline, RenderConfig, Sentence};
use std::fs;
use std::path::PathBuf;
use std::io::{self, Write, Read, IsTerminal};

#[derive(Parser)]
#[command(name = "sitelen")]
#[command(about = "Render Toki Pona text as Sitelen Sitelen", long_about = None)]
struct Cli {
    /// Input text or file path
    #[arg(short, long)]
    input: Option<String>,

    /// Output file path
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// Output format
    #[arg(short, long, value_enum, default_value = "svg")]
    format: Format,

    /// Optimal aspect ratio (height/width)
    #[arg(long, default_value_t = 0.8)]
    ratio: f64,

    /// Stroke width
    #[arg(long, default_value_t = 2.0)]
    stroke_width: f64,

    /// Enable shadow effects
    #[arg(long)]
    shadow: bool,

    /// Don't embed glyph definitions in SVG (output will only contain references). By default, glyphs are embedded.
    #[arg(long = "no-embed-glyphs", action = clap::ArgAction::SetTrue)]
    no_embed_glyphs: bool,

    /// Render all sentences to a single output file (or stdout). By default, multiple sentences produce multiple output files.
    #[arg(long)]
    single: bool,

    /// Box margin (same value for all sides). Prevents overflow by adding space around the outer SVG.
    #[arg(long, allow_negative_numbers = true)]
    margin: Option<f64>,

    /// Box margin: top (overrides --margin for this side)
    #[arg(long, allow_negative_numbers = true)]
    margin_top: Option<f64>,

    /// Box margin: right (overrides --margin for this side)
    #[arg(long, allow_negative_numbers = true)]
    margin_right: Option<f64>,

    /// Box margin: bottom (overrides --margin for this side)
    #[arg(long, allow_negative_numbers = true)]
    margin_bottom: Option<f64>,

    /// Box margin: left (overrides --margin for this side)
    #[arg(long, allow_negative_numbers = true)]
    margin_left: Option<f64>,

    /// Input text directly (alternative to --input)
    text: Option<String>,
}

#[derive(Clone, ValueEnum)]
enum Format {
    Svg,
    Png,
    Html,
}

impl From<Format> for OutputFormat {
    fn from(f: Format) -> Self {
        match f {
            Format::Svg => OutputFormat::Svg,
            Format::Png => OutputFormat::Png,
            Format::Html => OutputFormat::Html,
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    // Prefer stdin if data is piped
    let mut stdin_text = String::new();
    if !io::stdin().is_terminal() {
        io::stdin().read_to_string(&mut stdin_text)?;
    }

    // Get input text from stdin, or fall back to flags for backward compatibility
    let text = if !stdin_text.trim().is_empty() {
        stdin_text
    } else if let Some(input) = &cli.input {
        if PathBuf::from(input).exists() {
            fs::read_to_string(input)?
        } else {
            input.clone()
        }
    } else if let Some(text) = &cli.text {
        text.clone()
    } else {
        eprintln!("Error: No input provided. Pipe text via stdin, or use --input <file> or --text.");
        std::process::exit(1);
    };

    // Create configuration
    let mut config = RenderConfig::default();
    config.optimal_ratio = cli.ratio;
    config.stroke_width = cli.stroke_width;
    config.shadow = cli.shadow;
    config.exportable = !cli.no_embed_glyphs;

    // Box margin: --margin sets all sides; individual --margin-* override
    if let Some(m) = cli.margin {
        config.margin_top = m;
        config.margin_right = m;
        config.margin_bottom = m;
        config.margin_left = m;
    }
    if let Some(m) = cli.margin_top {
        config.margin_top = m;
    }
    if let Some(m) = cli.margin_right {
        config.margin_right = m;
    }
    if let Some(m) = cli.margin_bottom {
        config.margin_bottom = m;
    }
    if let Some(m) = cli.margin_left {
        config.margin_left = m;
    }

    // Create pipeline
    let pipeline = Pipeline::with_config(config)?;

    // Parse into sentences
    let sentences: Vec<Sentence> = pipeline.parse(&text)?;

    let format: OutputFormat = cli.format.clone().into();

    // Determine output naming
    let ext = match cli.format {
        Format::Svg => "svg",
        Format::Png => "png",
        Format::Html => "html",
    };

    // Single output: one sentence, or --single with any number of sentences
    let use_single_output = sentences.len() <= 1 || cli.single;
    if use_single_output {
        let bytes = if cli.single && !sentences.is_empty() {
            // Combined: render full text so all sentences go into one layout
            pipeline.render_text(&text, format)?
        } else if let Some(sentence) = sentences.first() {
            pipeline.render_sentence(sentence, format)?
        } else {
            pipeline.render_text("", format)?
        };

        if cli.output.is_none() {
            let mut stdout = io::stdout();
            stdout.write_all(&bytes)?;
            stdout.flush()?;
        } else {
            let output_path = cli.output.unwrap_or_else(|| PathBuf::from(format!("output.{}", ext)));
            fs::write(&output_path, bytes)?;
            eprintln!("Rendered to: {}", output_path.display());
        }
        return Ok(());
    }

    // Multiple sentences, no --single: write multiple files with index suffix
    let (base_dir, base_stem) = match &cli.output {
        Some(path) => {
            if path.is_dir() {
                (path.clone(), String::from("output"))
            } else {
                let dir = path.parent().map(|p| p.to_path_buf()).unwrap_or_else(|| PathBuf::from("."));
                let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("output").to_string();
                (dir, stem)
            }
        }
        None => (PathBuf::from("."), String::from("output")),
    };

    if cli.output.is_none() {
        // Stream all rendered outputs to stdout (no extra messages on stdout)
        let mut stdout = io::stdout();
        for sentence in &sentences {
            let bytes = pipeline.render_sentence(sentence, format.clone())?;
            stdout.write_all(&bytes)?;
        }
        stdout.flush()?;
    } else {
        for (idx, sentence) in sentences.iter().enumerate() {
            let bytes = pipeline.render_sentence(sentence, format.clone())?;
            let filename = format!("{}_{}.{}", base_stem, idx + 1, ext);
            let mut out_path = base_dir.clone();
            out_path.push(filename);
            fs::write(&out_path, &bytes)?;
            eprintln!("Rendered sentence {} to: {}", idx + 1, out_path.display());
        }
    }

    Ok(())
}

