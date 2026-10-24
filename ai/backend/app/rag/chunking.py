"""
Astrology-Aware Semantic Chunking Engine for AstroAI Knowledge Base.

Preserves:
- Classical Sanskrit shlokas/verses alongside their translations and commentary
- Markdown headings and structural hierarchy
- Markdown tables and lists without row tearing
- Source and page provenance
- Enforces strict character-based limits with token estimation
"""
from typing import List, Dict, Any, Optional, Tuple
import re
import unicodedata
import hashlib

def clean_text(text: str) -> str:
    """
    Cleans raw extracted text, normalizing Unicode, whitespace, and line endings
    while strictly preserving Sanskrit diacritics, Devanagari script, and dandas.
    """
    if not text:
        return ""
    # Unicode NFC normalization for consistent character composition
    text = unicodedata.normalize("NFC", text)
    # Replace non-breaking spaces and exotic whitespace with standard space
    text = re.sub(r"[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]", " ", text)
    # Remove control characters except tab and newline
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Normalize Windows and Mac carriage returns
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse 3+ newlines to 2 newlines (preserve paragraph boundaries)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Collapse multiple horizontal spaces
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def estimate_token_count(text: str) -> int:
    """
    Estimates token count. For English/Latin text ~4 chars/token;
    for Devanagari / Indic scripts ~1.5 - 2 chars/token.
    """
    if not text:
        return 0
    devanagari_chars = len(re.findall(r"[\u0900-\u097f]", text))
    other_chars = len(text) - devanagari_chars
    tokens = int((devanagari_chars / 1.8) + (other_chars / 4.0))
    return max(1, tokens)


def detect_language(text: str) -> str:
    """Heuristic language detection: 'sa' (Sanskrit), 'hi' (Hindi), 'en' (English)."""
    if not text:
        return "en"
    has_devanagari = bool(re.search(r"[\u0900-\u097f]", text))
    if has_devanagari:
        # Check for Sanskrit verse markers like danda or traditional shloka endings
        if "॥" in text or "। " in text or re.search(r"\b(उवाच|नमः|स्वाहा|श्लोक|मन्त्र)\b", text):
            return "sa"
        return "hi"
    return "en"


def is_shloka_or_verse(paragraph: str) -> bool:
    """
    Detects if a paragraph represents a classical Sanskrit shloka or metered verse.
    Identifies Devanagari verses ending in '।' or '॥', or Romanized transliterated shlokas.
    """
    p = paragraph.strip()
    if "॥" in p:
        return True
    if re.search(r"[\u0900-\u097f]+.*?[।॥]", p):
        return True
    if re.search(r"^(shloka|verse|mantra|stotram)[\s\d:.-]", p, re.IGNORECASE):
        return True
    # Romanized IAST verse lines (often 2 or 4 lines with danda or rhymes)
    lines = [l.strip() for l in p.split("\n") if l.strip()]
    if 2 <= len(lines) <= 6:
        if all(re.search(r"[āīūṛṝḷḹñṅṇṭḍśṣṃḥ|/]", line) for line in lines):
            return True
    return False


def is_table_block(paragraph: str) -> bool:
    """Detects if a paragraph is a Markdown table."""
    lines = [l.strip() for l in paragraph.strip().split("\n") if l.strip()]
    if len(lines) >= 2:
        return all(line.startswith("|") and line.endswith("|") for line in lines[:2])
    return False


def generate_stable_chunk_id(doc_identifier: str, chunk_index: int, content_sample: str) -> str:
    """Generates a stable, reproducible chunk ID from doc ID, index, and content hash."""
    seed = f"{doc_identifier}:{chunk_index}:{content_sample[:60]}"
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:16]
    return f"chk_{digest}"


def split_text_strictly(
    text: str,
    max_chars: int,
    overlap_chars: int
) -> List[str]:
    """
    Recursively and deterministically splits an oversized block so that
    no slice exceeds max_chars.
    Prefers splitting on:
    1. Verse boundaries ('॥', '।\n')
    2. Sentence boundaries ('. ', '? ', '! ', '। ')
    3. Comma / semicolon / clause boundaries
    4. Space / word boundaries
    5. Hard slicing as last resort
    """
    text = text.strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    slices: List[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + max_chars, text_len)
        if end == text_len:
            slice_text = text[start:end].strip()
            if slice_text:
                slices.append(slice_text)
            break

        segment = text[start:end]
        split_pos = -1

        # Priority 1: Shloka double danda
        danda_pos = segment.rfind("॥")
        if danda_pos > int(max_chars * 0.4):
            split_pos = danda_pos + 1

        # Priority 2: Sentence punctuation
        if split_pos == -1:
            for punct in [".\n", "!\n", "?\n", "।\n", ". ", "! ", "? ", "। "]:
                pos = segment.rfind(punct)
                if pos > int(max_chars * 0.4):
                    split_pos = pos + len(punct)
                    break

        # Priority 3: Semicolon or newline
        if split_pos == -1:
            for punct in [";\n", "; ", "\n"]:
                pos = segment.rfind(punct)
                if pos > int(max_chars * 0.4):
                    split_pos = pos + len(punct)
                    break

        # Priority 4: Word boundary space
        if split_pos == -1:
            space_pos = segment.rfind(" ")
            if space_pos > int(max_chars * 0.3):
                split_pos = space_pos + 1

        # Fallback: Hard cut at max_chars
        if split_pos == -1:
            split_pos = max_chars

        slice_text = text[start:start + split_pos].strip()
        if slice_text:
            slices.append(slice_text)

        # Advance start with overlap, but ensure forward progress
        advance = max(1, split_pos - overlap_chars)
        start += advance

    return slices


def chunk_document_text(
    pages: List[Dict[str, Any]],
    chunk_size: int = 650,
    chunk_overlap: int = 120,
    doc_id: Optional[str] = None,
    document_topic: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Chunks a list of page/section objects:
    [{'page_number': int, 'text': str, 'section': Optional[str]}].

    Unit: Enforced in characters (with token estimation recorded in chunk metadata).
    Preserves:
    - Sanskrit shlokas together with translation/commentary
    - Markdown headings and hierarchical breadcrumbs
    - Tables without breaking rows across chunks
    - Stable chunk IDs

    Returns:
    List of chunk dictionaries with backward-compatible and enriched keys.
    """
    chunks: List[Dict[str, Any]] = []
    chunk_counter = 0
    doc_identifier = doc_id or "doc"

    current_hierarchy: List[str] = []
    current_section = "General"

    for page_data in pages:
        page_num = page_data.get("page_number", 1)
        raw_text = clean_text(page_data.get("text", ""))
        default_section = page_data.get("section", "General")

        if not raw_text:
            continue

        # Split raw text into structural blocks (preserving double newlines as paragraphs)
        raw_blocks = [b.strip() for b in re.split(r"\n\s*\n", raw_text) if b.strip()]

        # Process blocks while grouping shlokas with following translations
        blocks: List[str] = []
        i = 0
        while i < len(raw_blocks):
            blk = raw_blocks[i]
            # Check if this block is a Sanskrit shloka and next block is translation/commentary
            if is_shloka_or_verse(blk) and (i + 1 < len(raw_blocks)):
                next_blk = raw_blocks[i + 1]
                # If next block starts with translation markers or is an explanation
                is_trans = re.search(r"^(translation|meaning|explanation|भावार्थ|अर्थ|anvaya)[:\s-]", next_blk, re.IGNORECASE)
                combined = f"{blk}\n\n{next_blk}"
                if (is_trans or len(next_blk) < int(chunk_size * 0.7)) and len(combined) <= chunk_size:
                    blocks.append(combined)
                    i += 2
                    continue
            blocks.append(blk)
            i += 1

        current_chunk_text = ""
        current_chunk_has_shloka = False

        for block in blocks:
            # Check for Markdown heading or chapter line
            heading_match = re.match(r"^(#{1,6})\s+(.+)$", block)
            is_cap_heading = len(block) < 70 and (block.isupper() or block.startswith("Chapter ") or block.startswith("Section "))

            if heading_match:
                level = len(heading_match.group(1))
                h_text = heading_match.group(2).strip()
                current_section = h_text
                # Update hierarchy stack
                if level <= len(current_hierarchy):
                    current_hierarchy = current_hierarchy[:level - 1]
                current_hierarchy.append(h_text)
                # Keep the heading in the text stream
            elif is_cap_heading:
                current_section = block.strip("# :")
                current_hierarchy = [current_section]

            # Is this block a table?
            is_table = is_table_block(block)
            block_has_shloka = is_shloka_or_verse(block)

            # Can we append block to current chunk?
            proposed_len = len(current_chunk_text) + (2 if current_chunk_text else 0) + len(block)

            if proposed_len <= chunk_size:
                current_chunk_text += ("\n\n" if current_chunk_text else "") + block
                if block_has_shloka:
                    current_chunk_has_shloka = True
            else:
                # Flush existing chunk if present
                if current_chunk_text.strip():
                    c_content = current_chunk_text.strip()
                    chunks.append({
                        "chunk_id": generate_stable_chunk_id(doc_identifier, chunk_counter, c_content),
                        "chunk_index": chunk_counter,
                        "content": c_content,
                        "page_number": page_num,
                        "section_title": current_section or default_section,
                        "hierarchy": list(current_hierarchy),
                        "topic": document_topic or "vedic_astrology",
                        "language": detect_language(c_content),
                        "has_shloka": current_chunk_has_shloka,
                        "char_count": len(c_content),
                        "estimated_tokens": estimate_token_count(c_content)
                    })
                    chunk_counter += 1

                    # Retain overlap from end of current chunk (if not a table or shloka)
                    if not is_table and not current_chunk_has_shloka and chunk_overlap > 0:
                        overlap_start = max(0, len(c_content) - chunk_overlap)
                        overlap_tail = c_content[overlap_start:].strip()
                        # Align to word boundary
                        first_space = overlap_tail.find(" ")
                        if first_space != -1 and first_space < len(overlap_tail) // 2:
                            overlap_tail = overlap_tail[first_space:].strip()
                        current_chunk_text = overlap_tail
                    else:
                        current_chunk_text = ""
                    current_chunk_has_shloka = False

                # Handle block itself: if block fits in new chunk, start with it
                if len(block) <= chunk_size:
                    current_chunk_text += ("\n\n" if current_chunk_text else "") + block
                    if block_has_shloka:
                        current_chunk_has_shloka = True
                else:
                    # Oversized block: split strictly using sentence/danda boundaries
                    oversized_slices = split_text_strictly(block, chunk_size, chunk_overlap)
                    for idx, slice_item in enumerate(oversized_slices):
                        # The last slice can seed the next chunk if small
                        if idx == len(oversized_slices) - 1 and len(slice_item) < int(chunk_size * 0.4):
                            current_chunk_text = slice_item
                            current_chunk_has_shloka = is_shloka_or_verse(slice_item)
                        else:
                            chunks.append({
                                "chunk_id": generate_stable_chunk_id(doc_identifier, chunk_counter, slice_item),
                                "chunk_index": chunk_counter,
                                "content": slice_item,
                                "page_number": page_num,
                                "section_title": current_section or default_section,
                                "hierarchy": list(current_hierarchy),
                                "topic": document_topic or "vedic_astrology",
                                "language": detect_language(slice_item),
                                "has_shloka": is_shloka_or_verse(slice_item),
                                "char_count": len(slice_item),
                                "estimated_tokens": estimate_token_count(slice_item)
                            })
                            chunk_counter += 1
                            current_chunk_text = ""
                            current_chunk_has_shloka = False

        # Flush final chunk for this page if remaining
        if current_chunk_text.strip():
            c_content = current_chunk_text.strip()
            chunks.append({
                "chunk_id": generate_stable_chunk_id(doc_identifier, chunk_counter, c_content),
                "chunk_index": chunk_counter,
                "content": c_content,
                "page_number": page_num,
                "section_title": current_section or default_section,
                "hierarchy": list(current_hierarchy),
                "topic": document_topic or "vedic_astrology",
                "language": detect_language(c_content),
                "has_shloka": current_chunk_has_shloka,
                "char_count": len(c_content),
                "estimated_tokens": estimate_token_count(c_content)
            })
            chunk_counter += 1

    return chunks
