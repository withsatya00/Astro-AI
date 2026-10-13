"""
Semantic chunking engine for astrology reference documents.
Preserves headings, section boundaries, and page provenance.
"""
from typing import List, Dict, Any, Optional
import re

def clean_text(text: str) -> str:
    """Cleans raw extracted text, normalizing whitespace and line endings."""
    if not text:
        return ""
    # Normalize unicode spaces and quotes
    text = re.sub(r"[\r\n]+", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    # Remove null characters and control codes
    text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    return text.strip()

def chunk_document_text(
    pages: List[Dict[str, Any]],
    chunk_size: int = 600,
    chunk_overlap: int = 100
) -> List[Dict[str, Any]]:
    """
    Chunks a list of page objects: [{'page_number': int, 'text': str, 'section': Optional[str]}].
    Produces chunks with page provenance, chunk_index, and section titles.
    """
    chunks = []
    chunk_counter = 0

    for page_data in pages:
        page_num = page_data.get("page_number", 1)
        raw_text = clean_text(page_data.get("text", ""))
        section = page_data.get("section", "General")

        if not raw_text:
            continue

        # Split text into paragraphs
        paragraphs = [p.strip() for p in raw_text.split("\n") if p.strip()]

        current_chunk_text = ""
        current_section = section

        for para in paragraphs:
            # Check if paragraph looks like a heading
            if len(para) < 60 and (para.isupper() or para.startswith("#") or para.endswith(":")):
                current_section = para.strip("# :")

            if len(current_chunk_text) + len(para) <= chunk_size:
                current_chunk_text += (" " if current_chunk_text else "") + para
            else:
                if current_chunk_text:
                    chunks.append({
                        "chunk_index": chunk_counter,
                        "content": current_chunk_text,
                        "page_number": page_num,
                        "section_title": current_section
                    })
                    chunk_counter += 1

                    # Retain overlap from end of current chunk
                    overlap_start = max(0, len(current_chunk_text) - chunk_overlap)
                    current_chunk_text = current_chunk_text[overlap_start:] + " " + para
                else:
                    # Paragraph is longer than chunk_size, split by chunk_size
                    for i in range(0, len(para), chunk_size - chunk_overlap):
                        slice_text = para[i:i + chunk_size]
                        if slice_text.strip():
                            chunks.append({
                                "chunk_index": chunk_counter,
                                "content": slice_text.strip(),
                                "page_number": page_num,
                                "section_title": current_section
                            })
                            chunk_counter += 1
                    current_chunk_text = ""

        if current_chunk_text.strip():
            chunks.append({
                "chunk_index": chunk_counter,
                "content": current_chunk_text.strip(),
                "page_number": page_num,
                "section_title": current_section
            })
            chunk_counter += 1

    return chunks
