import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';
import { ENTITIES, fromForm, toForm } from './adminConfig.js';

function Field({ f, value, onChange, locked }) {
  const common = { id: `f-${f.name}`, disabled: locked && f.lockWhenEditing };
  if (f.type === 'bool') return <label className="bh-admin-check"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} {...common} /> {f.label}</label>;
  return (
    <label className="bh-admin-field" htmlFor={common.id}><span>{f.label}</span>
      {f.type === 'textarea' || f.type === 'sources' || f.type === 'samagri' || f.type === 'steps' ? <textarea rows={f.rows || 4} value={value} onChange={(e) => onChange(e.target.value)} {...common} />
        : f.type === 'select' ? <select value={value} onChange={(e) => onChange(e.target.value)} {...common}>{f.options.map((o) => <option key={o} value={o}>{o || '—'}</option>)}</select>
        : <input type={f.type === 'number' ? 'number' : 'text'} value={value} onChange={(e) => onChange(e.target.value)} {...common} />}
    </label>
  );
}

function AudioUpload({ slug }) {
  const [f, setF] = useState({ title: '', source: '', license: '' });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    if (!file) { setMsg('Choose an audio file first.'); return; }
    const fd = new FormData();
    fd.append('content_slug', slug); fd.append('title', f.title); fd.append('source', f.source); fd.append('license', f.license); fd.append('file', file);
    try { await api('/admin/audio', { method: 'POST', body: fd }); setMsg('Audio uploaded.'); setFile(null); setF({ title: '', source: '', license: '' }); e.target.reset(); }
    catch (err) { setMsg(err.message || 'Upload failed'); }
  };
  return (
    <form className="bh-panel" onSubmit={submit} style={{ marginTop: 12 }}>
      <h3>Add audio to this text</h3>
      <p className="bh-small" style={{ marginTop: 0 }}>Only upload a recording you have the right to publish. MP3, OGG, M4A or WAV, up to 25 MB.</p>
      <div className="bh-form">
        <label>Title<input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label>Source (who recorded it)<input required value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></label>
        <label>Licence / permission<input required value={f.license} onChange={(e) => setF({ ...f, license: e.target.value })} /></label>
        <label>File<input type="file" accept=".mp3,.ogg,.m4a,.wav,audio/*" onChange={(e) => setFile(e.target.files[0] || null)} /></label>
      </div>
      <div className="bh-row"><button className="bh-btn bh-btn-maroon" type="submit">Upload</button></div>
      {msg && <div className="bh-msg" role="status">{msg}</div>}
    </form>
  );
}

// Attach an official YouTube video to a text. The server checks with YouTube that embedding is allowed.
function EmbedPanel({ slug }) {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ url: '', title: '', channel: '', rights_note: '' });
  const [msg, setMsg] = useState(null);
  const reload = useCallback(() => api(`/admin/content/${slug}`).then((d) => setList(d.embeds || [])).catch(() => setList([])), [slug]);
  useEffect(() => { reload(); }, [reload]);
  const add = async (e) => {
    e.preventDefault(); setMsg(null);
    try { await api('/admin/embed', { method: 'PUT', body: { ...f, content_slug: slug, published: true } }); setMsg({ ok: true, text: 'Video added.' }); setF({ url: '', title: '', channel: '', rights_note: f.rights_note }); reload(); }
    catch (err) { setMsg({ ok: false, text: err.message || 'Could not add the video' }); }
  };
  const remove = async (id) => { try { await api(`/admin/embed/${id}`, { method: 'DELETE' }); reload(); } catch (err) { setMsg({ ok: false, text: err.message }); } };
  return (
    <form className="bh-panel" onSubmit={add} style={{ marginTop: 12 }}>
      <h3>YouTube video for this text</h3>
      <p className="bh-small" style={{ marginTop: 0 }}>Only add an official video whose owner allows embedding. It plays in YouTube’s own player on the text’s page.</p>
      {list.length > 0 && (
        <ul className="bh-list" style={{ marginBottom: 10 }}>
          {list.map((v) => <li key={v.id}><span>{v.title} <span className="bh-small">· {v.channel}</span></span><button type="button" className="bh-btn bh-btn-ghost" style={{ minHeight: 32 }} onClick={() => remove(v.id)}>Remove</button></li>)}
        </ul>
      )}
      <div className="bh-form">
        <label>YouTube link<input required value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" /></label>
        <label>Title<input required maxLength={200} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label>Channel / artist<input required maxLength={200} value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })} /></label>
        <label>Why we may show it<input required minLength={3} maxLength={300} value={f.rights_note} onChange={(e) => setF({ ...f, rights_note: e.target.value })} placeholder="e.g. Official channel; embedding enabled" /></label>
      </div>
      <div className="bh-row"><button className="bh-btn bh-btn-maroon" type="submit">Add video</button></div>
      {msg && <div className={`bh-msg ${msg.ok ? 'ok' : ''}`} role={msg.ok ? 'status' : 'alert'}>{msg.text}</div>}
    </form>
  );
}

function Editor({ cfg, entity, record, isNew, onSaved, onDeleted, onCancel }) {
  const [form, setForm] = useState(() => toForm(cfg.fields, record));
  const [msg, setMsg] = useState(null);
  const [preview, setPreview] = useState(false);
  // Refill when the saved record comes back; keep the message so the person sees the result of their save.
  useEffect(() => { setForm(toForm(cfg.fields, record)); }, [cfg, record]);

  const save = async (e) => {
    e.preventDefault(); setMsg(null);
    try { const saved = await cfg.save(api, fromForm(cfg.fields, form)); setMsg({ ok: true, text: form.published ? 'Saved and published.' : 'Saved as draft.' }); onSaved(saved); }
    catch (err) { setMsg({ ok: false, text: err.message || 'Could not save' }); }
  };
  const del = async () => {
    if (!window.confirm('Delete this permanently? This cannot be undone. (To hide it, untick Published instead.)')) return;
    try { await cfg.remove(api, record); onDeleted(); } catch (err) { setMsg({ ok: false, text: err.message || 'Could not delete' }); }
  };

  return (
    <>
    <form className="bh-panel" onSubmit={save} aria-label="Editor">
      <div className="bh-sec-title" style={{ margin: '0 0 8px' }}><h3>{isNew ? `New ${cfg.label}` : `Edit: ${cfg.title(record)}`}</h3>
        <button type="button" className="bh-btn bh-btn-ghost" onClick={() => setPreview(!preview)} aria-pressed={preview}>{preview ? 'Edit' : 'Preview'}</button></div>
      {preview ? (
        <div>
          {cfg.preview.map((k) => form[k] ? <div key={k} className="bh-reader" style={{ fontSize: 17 }}>{form[k]}</div> : null)}
          {!isNew && !form.published && <p className="bh-small">This is a draft: visitors cannot see it. Tick Published and save to make it live.</p>}
        </div>
      ) : (
        <div className="bh-admin-grid">
          {cfg.fields.map((f) => <Field key={f.name} f={f} value={form[f.name]} locked={!isNew} onChange={(v) => setForm({ ...form, [f.name]: v })} />)}
        </div>
      )}
      {msg && <div className={`bh-msg ${msg.ok ? 'ok' : ''}`} role={msg.ok ? 'status' : 'alert'}>{msg.text}</div>}
      <div className="bh-row" style={{ justifyContent: 'flex-start' }}>
        <button className="bh-btn bh-btn-maroon" type="submit">Save</button>
        {!isNew && cfg.publicPath && form.published && <a className="bh-btn bh-btn-ghost" href={cfg.publicPath(record)} target="_blank" rel="noopener noreferrer">View live ↗</a>}
        {!isNew && cfg.remove && <button type="button" className="bh-btn bh-btn-ghost" onClick={del}>Delete</button>}
        <button type="button" className="bh-btn bh-btn-ghost" onClick={onCancel}>Close</button>
      </div>
    </form>
    {!isNew && cfg.audio && <AudioUpload slug={record.slug} />}
    {!isNew && cfg.audio && <EmbedPanel slug={record.slug} />}
    </>
  );
}

function AuditLog() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api('/admin/audit?limit=100').then(setRows).catch(() => setRows([])); }, []);
  if (!rows) return <p className="bh-small">Loading…</p>;
  if (!rows.length) return <div className="bh-panel bh-signin"><p className="bh-small">No admin changes recorded yet.</p></div>;
  return (
    <div className="bh-panel" style={{ overflowX: 'auto' }}>
      <table className="bh-table"><thead><tr><th>When</th><th>Action</th><th>What</th><th>Item</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}><td>{new Date(r.at).toLocaleString()}</td><td>{r.action}</td><td>{r.entity}</td><td>{r.entity_id}</td></tr>)}</tbody></table>
    </div>
  );
}

function Manager({ id }) {
  const cfg = ENTITIES[id];
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [sel, setSel] = useState(null); // { record, isNew, key }
  const seq = React.useRef(0);
  const [err, setErr] = useState('');

  const refresh = useCallback(() => cfg.list(api).then((d) => { setItems(d); setErr(''); }).catch((e) => setErr(e.message || 'Could not load')), [cfg]);
  useEffect(() => { setItems(null); setSel(null); refresh(); }, [refresh]);

  const shown = useMemo(() => (items || []).filter((it) => {
    const text = `${cfg.title(it)} ${cfg.sub ? cfg.sub(it) : ''}`.toLowerCase();
    return (!q.trim() || text.includes(q.trim().toLowerCase())) && (status === 'all' || (status === 'published') === !!it.published);
  }), [items, q, status, cfg]);

  const open = async (it) => { try { setSel({ record: await cfg.load(api, it), isNew: false, key: `e${++seq.current}` }); } catch (e) { setErr(e.message || 'Could not open'); } };

  return (
    <div className="bh-admin-cols">
      <div>
        <div className="bh-panel">
          <div className="bh-form" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label>Search<input type="search" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option><option value="published">Published</option><option value="draft">Drafts</option></select></label>
          </div>
          <div className="bh-row" style={{ justifyContent: 'flex-start' }}><button type="button" className="bh-btn bh-btn-maroon" onClick={() => setSel({ record: cfg.blank, isNew: true, key: `n${++seq.current}` })}>＋ New</button></div>
        </div>
        {err && <div className="bh-msg" role="alert">{err}</div>}
        {!items && !err && <p className="bh-small">Loading…</p>}
        <ul className="bh-list bh-admin-list">
          {shown.map((it) => (
            <li key={cfg.title(it) + (it.slug || it.youtube_id || '')}>
              <button type="button" className="bh-admin-item" onClick={() => open(it)}>
                <span style={{ minWidth: 0 }}><b>{cfg.title(it)}</b><span className="bh-small" style={{ display: 'block' }}>{cfg.sub ? cfg.sub(it) : ''}</span></span>
                <span className={`bh-badge ${it.published ? 'on' : ''}`}>{it.published ? 'Live' : 'Draft'}</span>
              </button>
            </li>
          ))}
          {items && shown.length === 0 && <li className="bh-small">Nothing matches.</li>}
        </ul>
      </div>
      <div>
        {sel ? <Editor key={sel.key} cfg={cfg} entity={id} record={sel.record} isNew={sel.isNew}
          onSaved={(saved) => { refresh(); setSel({ record: { ...(sel.isNew ? cfg.blank : sel.record), ...saved, ...(saved && typeof saved.deity === 'object' ? { deity: saved.deity ? saved.deity.slug : '' } : {}) }, isNew: false, key: sel.key }); }}
          onDeleted={() => { setSel(null); refresh(); }} onCancel={() => setSel(null)} />
          : <div className="bh-panel bh-signin"><p className="bh-small">Choose an item to edit, or add a new one.</p></div>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const signedIn = useSignedIn();
  const [state, setState] = useState('checking'); // checking | admin | denied
  const [tab, setTab] = useState('content');

  useEffect(() => {
    if (!signedIn) { setState('denied'); return; }
    setState('checking');
    api('/admin/audit?limit=1').then(() => setState('admin')).catch((e) => setState(e instanceof ApiError && (e.status === 403 || e.status === 401) ? 'denied' : 'denied'));
  }, [signedIn]);

  if (state === 'checking') return <div className="bh-panel">Checking access…</div>;
  if (state === 'denied') {
    return <div className="bh-panel bh-signin"><h2>Admin access required</h2><p className="bh-small">{signedIn ? 'Your account is not an administrator.' : 'Please sign in with an administrator account.'}</p>{!signedIn && <button type="button" className="bh-btn bh-btn-maroon" onClick={openLogin}>Sign in</button>}</div>;
  }
  const tabs = [...Object.entries(ENTITIES).map(([k, v]) => [k, v.label]), ['audit', 'Change history']];
  return (
    <div>
      <div className="bh-sec-title"><h2>Bhakti admin</h2></div>
      <p className="bh-small" style={{ marginTop: 0 }}>Drafts are invisible to visitors. Publishing needs the source and licence (or sources and review date) for that kind of content.</p>
      <div className="bh-tabs" role="tablist" aria-label="Content type">
        {tabs.map(([k, l]) => <button key={k} role="tab" type="button" className="bh-tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <div style={{ marginTop: 16 }}>{tab === 'audit' ? <AuditLog /> : <Manager key={tab} id={tab} />}</div>
    </div>
  );
}
