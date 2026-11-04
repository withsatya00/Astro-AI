"""The starter aarti/stotra seeds must follow the library's rules: public-domain source and licence stated, unverified until an editor checks, with Roman text and meanings."""
from website.backend.app import bhakti_seed_aarti, bhakti_seed_library

WEEKDAY_DEITIES = {"shiva", "ganesh", "durga", "krishna", "hanuman", "ram"}
REQUIRED = ("slug", "kind", "deity", "title_hi", "title_en", "body_hi", "body_roman", "meaning_hi", "meaning_en", "source", "license")


def test_each_seed_has_every_required_field():
    for seed in bhakti_seed_aarti.ALL:
        for key in REQUIRED:
            assert str(seed.get(key, "")).strip(), f"{seed.get('slug')}: missing {key}"
        assert seed["kind"] in ("aarti", "chalisa", "stotra")


def test_slugs_are_unique_and_do_not_clash_with_existing_seeds():
    slugs = [s["slug"] for s in bhakti_seed_aarti.ALL]
    assert len(slugs) == len(set(slugs))
    assert bhakti_seed_library.JAGDISH_AARTI["slug"] not in slugs


def test_every_weekday_deity_has_a_text():
    covered = {s["deity"] for s in bhakti_seed_aarti.ALL}
    assert WEEKDAY_DEITIES <= covered


def test_meanings_are_labelled_as_our_own_wording():
    for seed in bhakti_seed_aarti.ALL:
        assert "our own" in seed["meaning_en"].lower()
        assert "our own work" in seed["license"] or "public domain" in seed["license"].lower()


def test_hindi_text_is_devanagari():
    for seed in bhakti_seed_aarti.ALL:
        assert any("ऀ" <= ch <= "ॿ" for ch in seed["body_hi"])
