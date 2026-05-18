import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Loader from '../components/ui/Loader';
import API from '../api/axios';
import { HiOutlineBookOpen, HiOutlineEye } from 'react-icons/hi';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category) params.set('category', category);
        const { data } = await API.get(`/kb?${params}`);
        setArticles(data.articles);
      } catch (e) {}
      finally { setLoading(false); }
    };
    fetch();
  }, [search, category]);

  const viewArticle = async (slug) => {
    const { data } = await API.get(`/kb/${slug}`);
    setSelected(data.article);
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>
          <HiOutlineBookOpen style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Knowledge Base
        </h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Find answers to common questions</p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <input className="input" placeholder="Search articles…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 180 }}>
            <option value="">All Categories</option>
            {['getting_started','billing','technical','faq','policies'].map(c =>
              <option key={c} value={c}>{c.replace('_',' ')}</option>)}
          </select>
        </div>

        {selected && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000,
            display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
            onClick={() => setSelected(null)}>
            <div className="card animate-fadeIn" style={{ maxWidth:700, width:'100%',
              maxHeight:'80vh', overflowY:'auto', padding:32 }} onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                <div>
                  <span className="badge" style={{ background:'#e0f2fe', color:'#0369a1' }}>
                    {selected.category?.replace('_',' ')}</span>
                  <h2 style={{ margin:'8px 0 0', fontSize:'1.25rem', fontWeight:700 }}>{selected.title}</h2>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#94a3b8' }}>×</button>
              </div>
              <div style={{ lineHeight:1.8, color:'#334155', whiteSpace:'pre-wrap' }}>{selected.content}</div>
              <div style={{ marginTop:20, color:'#94a3b8', fontSize:'0.8rem' }}>
                <HiOutlineEye size={14} style={{ verticalAlign:'middle' }} /> {selected.views} views
                &nbsp;· By {selected.author?.name}
              </div>
            </div>
          </div>
        )}

        {articles.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>
            <HiOutlineBookOpen size={48} style={{ opacity:0.5, marginBottom:16 }} />
            <p>No articles found</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {articles.map(a => (
              <div key={a._id} className="card" style={{ padding:20, cursor:'pointer' }}
                onClick={() => viewArticle(a.slug)}>
                <span className="badge" style={{ background:'#e0f2fe', color:'#0369a1', marginBottom:10 }}>
                  {a.category?.replace('_',' ')}</span>
                <h3 style={{ margin:'0 0 8px', fontSize:'0.95rem', fontWeight:700 }}>{a.title}</h3>
                <p style={{ margin:0, fontSize:'0.85rem', color:'#64748b', lineHeight:1.5 }}>
                  {a.content?.substring(0,120)}…</p>
                <div style={{ marginTop:12, color:'#94a3b8', fontSize:'0.75rem' }}>
                  <HiOutlineEye size={14} /> {a.views} views</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
