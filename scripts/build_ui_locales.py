"""Build checked-in UI translations using the project's configured translation model.

Only source-code UI copy is sent; credentials and user data are never included.
Run explicitly when adding copy, never during a page request.
"""
import concurrent.futures
import json
import os
import re
import subprocess
import time
import threading
import unicodedata
from pathlib import Path

os.environ['DEBUG'] = 'true'
from bs4 import BeautifulSoup, Comment
from google import genai
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env')
OUT = ROOT / 'website/frontend/js/ui-locales.js'
CACHE = ROOT / 'scratch/ui-locale-cache.json'

def public_profiles():
    import ast
    profiles = []
    for filename, variable in [('packages/database/seed_astrologers.py', 'DEFAULT_ASTROLOGERS'), ('ai/backend/app/agents/personas.py', 'ASTROLOGER_PERSONAS')]:
        tree = ast.parse((ROOT / filename).read_text(encoding='utf-8'))
        for node in tree.body:
            if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == variable for t in node.targets):
                value = ast.literal_eval(node.value)
                profiles.extend(value.values() if isinstance(value, dict) else value)
    return profiles

def normalize(text):
    return re.sub(r'\s+', ' ', text).strip()

def contains_non_latin_letters(text):
    return any(char not in 'ℹ𝕏' and unicodedata.category(char).startswith('L') and 'LATIN' not in unicodedata.name(char, '') for char in text)

def collect():
    phrases = set()
    def add(text):
        # Preserve computed values as reorderable, language-neutral placeholders.
        number = iter(range(100))
        text = re.sub(r'\$\{[^{}]+\}', lambda _: f'__ARG{next(number)}__', text)
        text = normalize(text)
        if not text or not any(c.isalpha() for c in text):
            return
        if re.search(r';|=>|\b(?:const|return|function)\b|this\.|document\.|querySelector|\.replace\(|^#[\w-]+\s|\b(?:SELECT|INSERT|CREATE TABLE)\b', text):
            return
        if len(text) > 2500 or '${' in text or re.search(r'https?://|^[/#.\w-]+\.(?:js|css|png|jpg|html)$', text):
            return
        phrases.add(text)
    def html(text):
        soup = BeautifulSoup(text, 'html.parser')
        for item in soup.find_all(string=True):
            if not isinstance(item, Comment) and item.parent.name not in ('script', 'style'):
                add(str(item))
        for el in soup.find_all(True):
            for attr in ('placeholder', 'title', 'aria-label'):
                if el.get(attr): add(el[attr])
    for path in (ROOT / 'website/frontend/src').rglob('*.html'):
        html(path.read_text(encoding='utf-8'))
    for path in (ROOT / 'website/frontend').rglob('*.js'):
        if path.name in ('i18n.js', 'ui-locales.js'): continue
        source = path.read_text(encoding='utf-8')
        for match in re.finditer(r'`([^`]+)`', source):
            if '<' in match[1]: html(match[1])
        for match in re.finditer(r"(['\"])((?:\\.|(?!\1).)*?)\1", source):
            value = match[2]
            if (' ' in value or re.search('[\u0900-\u097f]', value)) and not re.search(r'[{}<>]|=>|document\.|querySelector|function\(|\\[sbdw]', value):
                add(value)
    # Deterministic server-generated astrology descriptions are UI copy as well.
    import ast
    for path in (ROOT / 'packages/astrology').rglob('*.py'):
        try:
            tree = ast.parse(path.read_text(encoding='utf-8'))
            for node in ast.walk(tree):
                if isinstance(node, ast.Constant) and isinstance(node.value, str) and len(node.value) < 1500 and (' ' in node.value or re.search('[\u0900-\u097f]', node.value)):
                    if not node.value.startswith(('SELECT', 'CREATE', 'INSERT', 'UPDATE', '\n')):
                        add(node.value)
        except (SyntaxError, UnicodeError):
            pass
    js = "const vm=require('vm'),fs=require('fs');const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('website/frontend/js/i18n.js','utf8'),c);console.log(JSON.stringify(c.window.ASTRO_I18N));"
    dictionaries = json.loads(subprocess.check_output(['node', '-e', js], cwd=ROOT))
    for lang in ('en', 'hi'):
        for value in dictionaries[lang].values():
            if isinstance(value, str): add(value)
    for profile in public_profiles():
        for field in ('name', 'name_hi', 'title', 'title_hi', 'bio', 'bio_hi', 'greeting', 'tone_badge', 'languages', 'specialties'):
            values = profile.get(field, [])
            for value in values if isinstance(values, list) else [values]:
                if isinstance(value, str): add(value)
    return sorted(phrases), dictionaries

def main():
    phrases, dictionaries = collect()
    cache = json.loads(CACHE.read_text(encoding='utf-8')) if CACHE.exists() else {}
    # Reuse the project's authored bilingual profiles rather than translating them again.
    for profile in public_profiles():
        for field in ('name', 'title', 'bio'):
            english, hindi = profile.get(field), profile.get(field + '_hi')
            if english and hindi and not re.search('[\u0900-\u097f]', english):
                pair = {'en': english, 'hi': hindi}
                cache[normalize(english)] = pair
                cache[normalize(hindi)] = pair
    pending = [p for p in phrases if p not in cache]
    print(f'{len(phrases)} UI phrases; {len(pending)} need translation', flush=True)
    client = genai.Client(api_key=os.environ['GEMINI_API_KEY'], http_options={'timeout': 45000, 'retry_options': {'attempts': 1}})
    rate_lock = threading.Lock()
    next_request = [time.monotonic()]
    def translate(batch):
        prompt = '''You translate an astrology website UI. For EACH input string return an object {"en": "...", "hi": "..."} in the same order, as a JSON array. English must be entirely English (no Devanagari or romanized Hindi sentences). Hindi must be entirely natural Hindi in Devanagari, no English duplicate labels or English phrases. Preserve numbers, currency, emoji, technical identifiers, email addresses, HTML tags, coupon codes, and interpolation tokens exactly. Transliterate proper names to Hindi for hi. For bilingual source labels keep ONLY the selected language. Do not add facts, claims, or explanations. Translate fragments as fragments; preserve meaningful punctuation and slash prefixes. Input:\n'''
        for attempt in range(3):
            try:
                with rate_lock:
                    delay = next_request[0] - time.monotonic()
                    if delay > 0: time.sleep(delay)
                    next_request[0] = time.monotonic() + 5
                result = client.models.generate_content(model=os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash-lite'), contents=prompt + json.dumps(batch, ensure_ascii=False), config={'response_mime_type': 'application/json', 'temperature': 0, 'max_output_tokens': 16384, 'response_schema': {'type': 'ARRAY', 'items': {'type': 'OBJECT', 'properties': {'en': {'type': 'STRING'}, 'hi': {'type': 'STRING'}}, 'required': ['en', 'hi']}}})
                rows = json.loads(result.text)
                if len(rows) != len(batch) or any(not isinstance(r, dict) or not isinstance(r.get('en'), str) or not isinstance(r.get('hi'), str) for r in rows):
                    raise ValueError('Translation count or shape mismatch')
                return dict(zip(batch, rows))
            except Exception as error:
                print(f'Retrying batch ({type(error).__name__})', flush=True)
                if attempt == 2:
                    if len(batch) > 1:
                        middle = len(batch) // 2
                        return translate(batch[:middle]) | translate(batch[middle:])
                    raise
                time.sleep(2)
    batches = [pending[i:i+50] for i in range(0, len(pending), 50)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(translate, batch) for batch in batches]
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            cache.update(result)
            CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding='utf-8')
            print(f'Translated {len(cache)} phrases', flush=True)
    # A translation model can mistakenly copy Hindi into its English field.
    # Repair by requesting only the target language and validate before shipping.
    for source in phrases:
        if re.search(r'\b(Bengali|Gujarati|Tamil|Telugu)\b', source) and '(' in source and contains_non_latin_letters(cache[source]['en']):
            cache[source]['en'] = re.sub(r'\s*\([^)]*\)', '', source)
        if source == 'اُردُو': cache[source]['en'] = 'Urdu'
    bad = [p for p in phrases if contains_non_latin_letters(cache[p]['en'])]
    for i in range(0, len(bad), 70):
        batch = bad[i:i+70]
        with rate_lock:
            delay = next_request[0] - time.monotonic()
            if delay > 0: time.sleep(delay)
            next_request[0] = time.monotonic() + 5
        result = client.models.generate_content(
            model=os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash-lite'),
            contents='Translate EVERY string below INTO ENGLISH. The strings are Hindi or mixed Hindi/English. Return ONLY English in the Latin alphabet. Translate Sanskrit verses by meaning. Never copy Hindi script into output. Preserve emoji, numbers, codes and __ARG0__ placeholders. Return a JSON array of translated strings in exactly the same order.\n' + json.dumps(batch, ensure_ascii=False),
            config={'response_mime_type': 'application/json', 'response_schema': {'type': 'ARRAY', 'items': {'type': 'STRING'}}, 'max_output_tokens': 16384, 'temperature': 0},
        )
        rows = json.loads(result.text)
        if len(rows) != len(batch) or any(contains_non_latin_letters(row) for row in rows):
            raise ValueError('English translation still contains Hindi')
        for source, english in zip(batch, rows): cache[source]['en'] = english
        CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'Repaired English {min(i+70, len(bad))}/{len(bad)}', flush=True)
    for source, hindi in {
        'Frequently Asked Questions': 'अक्सर पूछे जाने वाले प्रश्न',
        '. Your phone number is never shared with astrologers or any third party.': '. आपका फोन नंबर कभी भी ज्योतिषियों या किसी तीसरे पक्ष के साथ साझा नहीं किया जाता है।',
        'اُردُو': 'उर्दू',
    }.items():
        if source in cache: cache[source]['hi'] = hindi
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding='utf-8')
    keyed = {'en': {}, 'hi': {}}
    for key in set(dictionaries['en']) | set(dictionaries['hi']):
        original = dictionaries['en'].get(key, dictionaries['hi'].get(key))
        if isinstance(original, str) and normalize(original) in cache:
            for lang in keyed: keyed[lang][key] = cache[normalize(original)][lang]
    data = {'keyed': keyed, 'phrases': {p: cache[p] for p in phrases}}
    OUT.write_text('// Generated by scripts/build_ui_locales.py; source UI copy only.\nwindow.ASTRO_UI_LOCALES = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    print(f'Wrote {OUT.name}', flush=True)

if __name__ == '__main__':
    main()
