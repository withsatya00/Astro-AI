// Describes each kind of content the admin can manage. AdminPage renders every editor from this table, so adding a
// field or a new kind of content means editing data here, not writing a new form.
//
// field types: text | textarea | select | bool | number | list (comma separated) | sources (one "title | url | note" per line)

const DEITIES = ['', 'krishna', 'shiva', 'ram', 'hanuman', 'ganesh', 'durga', 'lakshmi', 'vishnu'];

export const toForm = (fields, rec) => {
  const out = {};
  fields.forEach((f) => {
    const v = rec[f.name];
    if (f.type === 'list') out[f.name] = (v || []).join(', ');
    else if (f.type === 'sources') out[f.name] = (v || []).map((s) => [s.title, s.url || '', s.note || ''].join(' | ').replace(/( \| )+$/, '')).join('\n');
    else if (f.type === 'samagri') out[f.name] = (v || []).map((x) => [x.item, x.note || ''].join(' | ').replace(/( \| )+$/, '')).join('\n');
    else if (f.type === 'steps') out[f.name] = (v || []).map((x) => [x.title, x.text || ''].join(' | ').replace(/( \| )+$/, '')).join('\n');
    else if (f.type === 'bool') out[f.name] = !!v;
    else out[f.name] = v === null || v === undefined ? '' : v;
  });
  return out;
};

export const fromForm = (fields, form) => {
  const out = {};
  fields.forEach((f) => {
    const v = form[f.name];
    if (f.type === 'list') out[f.name] = String(v).split(',').map((x) => x.trim()).filter(Boolean);
    else if (f.type === 'sources') {
      out[f.name] = String(v).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const [title, url, note] = l.split('|').map((x) => x.trim());
        return { title, url: url || null, note: note || null };
      });
    } else if (f.type === 'samagri') out[f.name] = String(v).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [item, ...r] = l.split('|'); return { item: item.trim(), note: r.join('|').trim() }; });
    else if (f.type === 'steps') out[f.name] = String(v).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [title, ...r] = l.split('|'); return { title: title.trim(), text: r.join('|').trim() }; });
    else if (f.type === 'number') out[f.name] = Number(v) || 0;
    else out[f.name] = v;
  });
  return out;
};

export const ENTITIES = {
  content: {
    label: 'Aarti & Chalisa', keyField: 'slug', audio: true,
    list: (api) => api('/admin/content'),
    load: async (api, it) => { const d = await api(`/admin/content/${it.slug}`); return { ...d, deity: d.deity ? d.deity.slug : '' }; },
    save: (api, v) => api('/admin/content', { method: 'PUT', body: v }),
    remove: (api, it) => api(`/admin/content/${it.slug}`, { method: 'DELETE' }),
    title: (it) => it.title_en, sub: (it) => it.kind,
    preview: ['body_hi', 'meaning_hi', 'meaning_en'],
    publicPath: (it) => `/bhakti/aarti-chalisa/${it.slug}`,
    blank: { slug: '', kind: 'aarti', deity: '', title_hi: '', title_en: '', body_hi: '', body_roman: '', meaning_hi: '', meaning_en: '', source: '', license: '', is_verified: false, published: false },
    fields: [
      { name: 'slug', label: 'Slug (a-z, 0-9, -)', type: 'text', lockWhenEditing: true },
      { name: 'kind', label: 'Type', type: 'select', options: ['aarti', 'chalisa', 'stotra'] },
      { name: 'deity', label: 'Deity', type: 'select', options: DEITIES },
      { name: 'title_hi', label: 'Title (Hindi)', type: 'text' }, { name: 'title_en', label: 'Title (English)', type: 'text' },
      { name: 'body_hi', label: 'Original text (Hindi / Sanskrit)', type: 'textarea', rows: 12 },
      { name: 'body_roman', label: 'Transliteration', type: 'textarea', rows: 6 },
      { name: 'meaning_hi', label: 'Meaning (Hindi)', type: 'textarea', rows: 6 }, { name: 'meaning_en', label: 'Meaning (English)', type: 'textarea', rows: 6 },
      { name: 'source', label: 'Source of the text', type: 'text' }, { name: 'license', label: 'Licence', type: 'text' },
      { name: 'is_verified', label: 'Checked against the source', type: 'bool' }, { name: 'published', label: 'Published', type: 'bool' },
    ],
  },
  gita: {
    label: 'Bhagavad Gita', keyField: null,
    list: (api) => api('/gita/admin/verses'),
    load: async (api, it) => it,
    save: (api, v) => api('/gita/admin/verse', { method: 'PUT', body: v }),
    remove: null,
    title: (it) => `${it.chapter}.${it.verse}`, sub: (it) => (it.text_sa || '').split('\n')[0].slice(0, 40),
    preview: ['text_sa', 'meaning_hi', 'meaning_en'],
    publicPath: (it) => `/bhakti/bhagavad-gita/${it.chapter}#v${it.verse}`,
    isKey: (f) => ['chapter', 'verse'].includes(f.name),
    blank: { chapter: 1, verse: 1, text_sa: '', transliteration: '', meaning_hi: '', meaning_en: '', source: '', license: '', is_verified: false, published: false },
    fields: [
      { name: 'chapter', label: 'Chapter (1-18)', type: 'number', lockWhenEditing: true }, { name: 'verse', label: 'Verse', type: 'number', lockWhenEditing: true },
      { name: 'text_sa', label: 'Sanskrit text', type: 'textarea', rows: 5 }, { name: 'transliteration', label: 'Transliteration', type: 'textarea', rows: 4 },
      { name: 'meaning_hi', label: 'Meaning (Hindi)', type: 'textarea', rows: 4 }, { name: 'meaning_en', label: 'Meaning (English)', type: 'textarea', rows: 4 },
      { name: 'source', label: 'Source of the text', type: 'text' }, { name: 'license', label: 'Licence', type: 'text' },
      { name: 'is_verified', label: 'Checked against the source', type: 'bool' }, { name: 'published', label: 'Published', type: 'bool' },
    ],
  },
  temples: {
    label: 'Temples', keyField: 'slug',
    list: (api) => api('/temples/admin/list'),
    load: async (api, it) => it,
    save: (api, v) => api('/temples/admin/temple', { method: 'PUT', body: v }),
    remove: (api, it) => api(`/temples/admin/temple/${it.slug}`, { method: 'DELETE' }),
    title: (it) => it.name_en, sub: (it) => `${it.city}, ${it.state}`,
    preview: ['summary', 'significance'],
    publicPath: (it) => `/bhakti/mandir-darshan/${it.slug}`,
    blank: { slug: '', name_en: '', name_hi: '', city: '', state: '', deity: '', summary: '', significance: '', festivals: [], official_url: '', virtual_darshan_url: '', image_url: '', image_credit: '', timings_note: '', timings_source_url: '', source: '', is_verified: false, published: false },
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', lockWhenEditing: true }, { name: 'name_en', label: 'Name (English)', type: 'text' }, { name: 'name_hi', label: 'Name (Hindi)', type: 'text' },
      { name: 'city', label: 'City', type: 'text' }, { name: 'state', label: 'State', type: 'text' }, { name: 'deity', label: 'Deity', type: 'text' },
      { name: 'summary', label: 'History', type: 'textarea', rows: 7 }, { name: 'significance', label: 'Significance', type: 'textarea', rows: 3 },
      { name: 'festivals', label: 'Festivals (comma separated)', type: 'list' },
      { name: 'official_url', label: 'Official website (https://)', type: 'text' }, { name: 'virtual_darshan_url', label: 'Virtual darshan link (https://)', type: 'text' },
      { name: 'image_url', label: 'Image link (https://)', type: 'text' }, { name: 'image_credit', label: 'Image credit', type: 'text' },
      { name: 'timings_note', label: 'Timings (only if you have a source)', type: 'text' }, { name: 'timings_source_url', label: 'Timings source link (https://)', type: 'text' },
      { name: 'source', label: 'Source of this summary', type: 'text' },
      { name: 'is_verified', label: 'Checked against official sources', type: 'bool' }, { name: 'published', label: 'Published', type: 'bool' },
    ],
  },
  articles: {
    label: 'Shankaracharya & Vedanta', keyField: 'slug',
    list: (api) => api('/vedanta/admin/articles'),
    load: async (api, it) => it,
    save: (api, v) => api('/vedanta/admin/article', { method: 'PUT', body: v }),
    remove: (api, it) => api(`/vedanta/admin/article/${it.slug}`, { method: 'DELETE' }),
    title: (it) => it.title_en, sub: (it) => `${it.section} · ${it.kind}`,
    preview: ['summary', 'body'],
    publicPath: (it) => `/bhakti/${it.section}`,
    blank: { slug: '', section: 'vedanta', kind: 'article', title_en: '', title_hi: '', summary: '', body: '', sources: [], reviewed_on: '', sort_order: 0, is_verified: false, published: false },
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', lockWhenEditing: true }, { name: 'section', label: 'Section', type: 'select', options: ['shankaracharya', 'vedanta'] },
      { name: 'kind', label: 'Type', type: 'select', options: ['article', 'qa'] },
      { name: 'title_en', label: 'Title / question (English)', type: 'text' }, { name: 'title_hi', label: 'Title (Hindi)', type: 'text' },
      { name: 'summary', label: 'One-line summary', type: 'text' }, { name: 'body', label: 'Text (blank line between paragraphs)', type: 'textarea', rows: 12 },
      { name: 'sources', label: 'Sources (one per line: title | https://link | note)', type: 'sources' },
      { name: 'reviewed_on', label: 'Last reviewed (YYYY-MM-DD)', type: 'text' }, { name: 'sort_order', label: 'Order', type: 'number' },
      { name: 'is_verified', label: 'Checked by an editor', type: 'bool' }, { name: 'published', label: 'Published', type: 'bool' },
    ],
  },
  knowledge: {
    label: 'AI knowledge sources', keyField: 'slug',
    list: (api) => api('/guide/admin/sources'),
    load: async (api, it) => it,
    save: (api, v) => api('/guide/admin/source', { method: 'PUT', body: v }),
    remove: (api, it) => api(`/guide/admin/source/${it.slug}`, { method: 'DELETE' }),
    title: (it) => it.title, sub: (it) => `${it.kind}${it.school ? ' · ' + it.school : ''}`,
    preview: ['text'],
    publicPath: () => '/bhakti/guide',
    blank: { slug: '', title: '', kind: 'interpretation', school: '', text: '', source: '', license: '', is_verified: false, published: false },
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', lockWhenEditing: true }, { name: 'title', label: 'Title', type: 'text' },
      { name: 'kind', label: 'What is this?', type: 'select', options: ['scripture', 'translation', 'interpretation'] },
      { name: 'school', label: 'School / tradition (required for an interpretation)', type: 'text' },
      { name: 'text', label: 'Text (blank line between passages)', type: 'textarea', rows: 10 },
      { name: 'source', label: 'Source', type: 'text' }, { name: 'license', label: 'Licence', type: 'text' },
      { name: 'is_verified', label: 'Checked against the source', type: 'bool' }, { name: 'published', label: 'Published (the Guide may use it)', type: 'bool' },
    ],
  },
  puja: {
    label: 'Puja guides', keyField: 'slug',
    list: (api) => api('/puja/admin/list'),
    load: async (api, it) => it,
    save: (api, v) => api('/puja/admin/guide', { method: 'PUT', body: v }),
    remove: (api, it) => api(`/puja/admin/guide/${it.slug}`, { method: 'DELETE' }),
    title: (it) => it.title_en, sub: (it) => it.deity || 'general',
    preview: ['summary', 'notes'],
    publicPath: (it) => `/bhakti/puja-vidhi/${it.slug}`,
    blank: { slug: '', title_en: '', title_hi: '', deity: '', summary: '', samagri: [], steps: [], notes: '', sources: [], reviewed_on: '', sort_order: 0, is_verified: false, published: false },
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', lockWhenEditing: true }, { name: 'title_en', label: 'Title (English)', type: 'text' }, { name: 'title_hi', label: 'Title (Hindi)', type: 'text' },
      { name: 'deity', label: 'Deity slug (optional)', type: 'select', options: DEITIES }, { name: 'summary', label: 'One-line summary', type: 'text' },
      { name: 'samagri', label: 'Samagri (one per line: item | note)', type: 'samagri' },
      { name: 'steps', label: 'Steps (one per line: title | details)', type: 'steps' },
      { name: 'notes', label: 'Notes and cautions', type: 'textarea', rows: 4 },
      { name: 'sources', label: 'Sources (one per line: title | https://link | note)', type: 'sources' },
      { name: 'reviewed_on', label: 'Last reviewed (YYYY-MM-DD)', type: 'text' }, { name: 'sort_order', label: 'Order', type: 'number' },
      { name: 'is_verified', label: 'Checked by an editor', type: 'bool' }, { name: 'published', label: 'Published', type: 'bool' },
    ],
  },
  festivalDates: {
    label: 'Confirmed festival dates', keyField: 'id',
    list: (api) => api('/calendar/admin/dates'),
    load: async (api, it) => it,
    save: (api, v) => api('/calendar/admin/date', { method: 'PUT', body: v }),
    remove: (api, it) => api(`/calendar/admin/date/${it.id}`, { method: 'DELETE' }),
    title: (it) => `${it.name_en} (${it.date})`, sub: (it) => it.location || 'everywhere',
    preview: ['description'],
    publicPath: () => '/bhakti/festivals',
    blank: { slug: '', name_en: '', name_hi: '', date: '', location: '', description: '', source: '', is_verified: false, published: false },
    fields: [
      { name: 'slug', label: 'Festival slug (e.g. diwali, holi, ram-navami)', type: 'text', lockWhenEditing: true },
      { name: 'name_en', label: 'Name (English)', type: 'text' }, { name: 'name_hi', label: 'Name (Hindi)', type: 'text' },
      { name: 'date', label: 'Confirmed date (YYYY-MM-DD)', type: 'text', lockWhenEditing: true },
      { name: 'location', label: 'Place (blank = everywhere)', type: 'select', options: ['', 'delhi', 'mumbai', 'kolkata', 'chennai', 'bengaluru', 'varanasi', 'ujjain', 'ahmedabad', 'jaipur'], lockWhenEditing: true },
      { name: 'description', label: 'Note shown to visitors', type: 'text' },
      { name: 'source', label: 'Panchang / source it was checked against (required to publish)', type: 'text' },
      { name: 'is_verified', label: 'Checked by an editor', type: 'bool' }, { name: 'published', label: 'Published (overrides our computed date)', type: 'bool' },
    ],
  },
  radio: {
    label: 'Bhajan Radio', keyField: 'youtube_id',
    list: (api) => api('/radio/admin/tracks'),
    load: async (api, it) => ({ ...it, url: `https://www.youtube.com/watch?v=${it.youtube_id}` }),
    save: (api, v) => api('/radio/admin/tracks', { method: 'PUT', body: v }),
    remove: (api, it) => api(`/radio/admin/tracks/${it.id}`, { method: 'DELETE' }),
    title: (it) => it.title, sub: (it) => `${it.category} · ${it.channel}`,
    preview: [],
    publicPath: () => '/bhakti/bhajan-radio',
    blank: { url: '', title: '', category: 'krishna', channel: '', rights_note: '', published: true },
    fields: [
      { name: 'url', label: 'YouTube link', type: 'text', lockWhenEditing: true }, { name: 'title', label: 'Title', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['krishna', 'shiva', 'hanuman', 'ram', 'durga', 'morning', 'evening-aarti', 'meditation', 'instrumental'] },
      { name: 'channel', label: 'Channel / artist', type: 'text' }, { name: 'rights_note', label: 'Why we may show it', type: 'text' },
      { name: 'published', label: 'Published', type: 'bool' },
    ],
  },
};
