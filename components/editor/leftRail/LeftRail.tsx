'use client';

import React, { useState } from 'react';
import type { Zone } from '@/types/database';
import {
  Type, Camera, Tag, ChevronRight, ChevronDown, ChevronUp,
  Square, Circle, Triangle, Minus, LayoutGrid, LayoutTemplate,
  Palette, ImageIcon, Eye, EyeOff, Lock, LockOpen, Upload,
  ListFilter, Loader2, Check,
} from 'lucide-react';
import { buildSVG, TEMPLATE_CONFIGS } from '@/lib/templates/svgs';

/* -- Design tokens --------------------------------------------- */
const T = {
  cream: '#FAF6EE', surface: '#FFFFFF', border: '#E5E0D4',
  borderStrong: '#C9C3B1', primary: '#1F4D3A', primarySoft: '#E8EFEB',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#65736B',
  warning: '#C97A2D',
};

type LeftTab = 'elements' | 'templates' | 'brand' | 'background';

/* -- Background presets ---------------------------------------- */
const BG_SOLIDS = [
  '#FFFFFF','#0F1F18','#1F4D3A','#163828','#E8C57E',
  '#FAF6EE','#000000','#1A1A2E','#16213E','#0F3460',
  '#533483','#E94560','#F5A623','#2D7A4F','#3A6B8C',
  '#7B0F3A','#3D1008','#0A1A04','#0a2540','#C87A3A',
];

const BG_GRADIENTS = [
  { label:'Forest',   value:'linear-gradient(135deg,#1F4D3A 0%,#2A6A50 60%,#E8C57E 100%)' },
  { label:'Midnight', value:'linear-gradient(135deg,#0D001A 0%,#1A0030 50%,#3D0068 100%)' },
  { label:'Ocean',    value:'linear-gradient(135deg,#0a2540 0%,#073a70 50%,#0a66c2 100%)' },
  { label:'Sunset',   value:'linear-gradient(135deg,#C1185B 0%,#7b1040 40%,#1F4D3A 100%)' },
  { label:'Gold',     value:'linear-gradient(135deg,#3D1008 0%,#C87A3A 60%,#F5C56A 100%)' },
  { label:'Noir',     value:'linear-gradient(135deg,#0F0F0F 0%,#2A2A2A 100%)' },
  { label:'Earth',    value:'linear-gradient(135deg,#0A1A04 0%,#2D5016 60%,#5C8A2E 100%)' },
  { label:'Bloom',    value:'linear-gradient(135deg,#7B0F3A 0%,#C1185B 50%,#FF9BC0 100%)' },
  { label:'Space',    value:'linear-gradient(135deg,#000005 0%,#0A0A45 60%,#10105A 100%)' },
  { label:'Sahara',   value:'linear-gradient(135deg,#3D1008 0%,#7B3A1C 40%,#F5C56A 100%)' },
];

const BRAND_COLORS = [
  '#FFFFFF','#0F1F18','#1F4D3A','#2A6A50','#E8C57E',
  '#FFD28A','#7BE0C0','#FF6058','#3A6B8C','#C97A2D',
  '#000000','#FAF6EE',
];

/* -- Shortcuts list -------------------------------------------- */
const SHORTCUTS = [
  { keys:['click'],        label:'Select zone' },
  { keys:['drag'],         label:'Reposition' },
  { keys:['Backspace'],            label:'Delete' },
  { keys:['Cmd','D'],       label:'Duplicate' },
  { keys:['Cmd','Z'],       label:'Undo' },
  { keys:['Shift','Cmd','Z'],  label:'Redo' },
  { keys:['[',']'],       label:'Layer order' },
  { keys:['Cmd','P'],       label:'Preview' },
  { keys:['G'],            label:'Toggle grid' },
];

/* -- Element add button — compact toolbox style ---------------- */
function AddBtn({
  icon, label, onClick, disabled,
}: { icon:React.ReactNode; label:string; onClick:()=>void; disabled?:boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:7, padding:'7px 9px',
        background: hover && !disabled ? T.primarySoft : T.surface,
        border:`1px solid ${hover && !disabled ? 'rgba(31,77,58,0.25)' : T.border}`,
        borderRadius:7,
        cursor:disabled?'not-allowed':'pointer',
        opacity:disabled?0.5:1, textAlign:'left',
        transition:'background 0.1s, border-color 0.1s',
      }}
    >
      <span style={{
        width:30, height:30, borderRadius:6, flexShrink:0,
        background: hover && !disabled ? T.primary : T.cream,
        color: hover && !disabled ? '#fff' : T.primary,
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'background 0.1s, color 0.1s',
        boxShadow: hover && !disabled ? '0 2px 6px rgba(31,77,58,0.25)' : 'none',
      }}>{icon}</span>
      <span style={{
        fontFamily:'Inter,sans-serif', fontSize:12.5, fontWeight:600,
        color: hover && !disabled ? T.primary : T.ink,
        lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        flex:1, minWidth:0, transition:'color 0.1s',
      }}>{label}</span>
    </button>
  );
}

/* -- Zone type icon -------------------------------------------- */
function ZoneIcon({ type }:{ type:string }) {
  const s={size:11,strokeWidth:1.8};
  if (type==='photo')  return <Camera {...s}/>;
  if (type==='custom') return <ListFilter {...s}/>;
  if (type==='label')  return <Tag {...s}/>;
  if (type==='shape')  return <Square {...s}/>;
  if (type==='image')  return <ImageIcon {...s}/>;
  return <Type {...s}/>;
}

/* -- Layers panel (embedded in left rail) ---------------------- */
interface LayersPanelProps {
  zones: Zone[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  moveZoneUp: (id:string) => void;
  moveZoneDown: (id:string) => void;
  updateZone: (id:string, patch:Partial<Zone>, withHistory?:boolean) => void;
  previewMode: boolean;
}

function LayersPanel({ zones, selectedIds, setSelectedIds, moveZoneUp, moveZoneDown, updateZone, previewMode }:LayersPanelProps) {
  const reversed = [...zones].reverse();
  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px 5px' }}>
        <span style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9.5, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted }}>
          Layers
        </span>
        {zones.length > 0 && (
          <span style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9, color:T.muted, opacity:0.7 }}>
            {zones.length}
          </span>
        )}
      </div>

      <div style={{ padding:'0 10px 8px', display:'flex', flexDirection:'column', gap:2 }}>
        {zones.length === 0 && (
          <div style={{
            padding:'12px 10px', textAlign:'center',
            background:T.surface, border:`1px dashed ${T.borderStrong}`, borderRadius:6,
          }}>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11.5, fontWeight:600, color:T.muted }}>No layers yet</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:10.5, color:T.muted, marginTop:2, lineHeight:1.4 }}>Add an element above</div>
          </div>
        )}

        {reversed.map(z => {
          const realIdx = zones.findIndex(x => x.id === z.id);
          const sel = selectedIds.includes(z.id) && !previewMode;
          return (
            <div
              key={z.id}
              onClick={e => {
                if (previewMode) return;
                if (e.shiftKey) setSelectedIds(ids => ids.includes(z.id) ? ids.filter(i=>i!==z.id) : [...ids,z.id]);
                else setSelectedIds([z.id]);
              }}
              className="group"
              style={{
                height:30, display:'flex', alignItems:'center', gap:5, padding:'0 5px',
                background:sel?T.primarySoft:T.surface,
                border:`1px solid ${sel?'rgba(31,77,58,0.2)':T.border}`,
                borderRadius:5, cursor:'pointer',
              }}
            >
              {/* Order arrows */}
              {!previewMode && (
                <div className="opacity-0 group-hover:opacity-100" style={{ display:'flex', flexDirection:'column', flexShrink:0 }}>
                  <button
                    onClick={e=>{e.stopPropagation();moveZoneUp(z.id);}}
                    disabled={realIdx>=zones.length-1}
                    style={{ width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:T.muted, padding:0, opacity:realIdx>=zones.length-1?0.2:1 }}
                  ><ChevronUp size={8} strokeWidth={2.5}/></button>
                  <button
                    onClick={e=>{e.stopPropagation();moveZoneDown(z.id);}}
                    disabled={realIdx<=0}
                    style={{ width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:T.muted, padding:0, opacity:realIdx<=0?0.2:1 }}
                  ><ChevronDown size={8} strokeWidth={2.5}/></button>
                </div>
              )}

              {/* Type icon */}
              <div style={{
                width:16, height:16, borderRadius:3, flexShrink:0,
                background:sel?T.primary:T.cream, color:sel?T.surface:T.inkSoft,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <ZoneIcon type={z.type}/>
              </div>

              {/* Label */}
              <div style={{
                flex:1, minWidth:0, fontFamily:'Inter,sans-serif', fontSize:11.5,
                fontWeight:sel?600:500, color:sel?T.primary:T.ink,
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              }}>{z.label}</div>

              {/* Type badge */}
              <div style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9, color:T.muted, letterSpacing:'0.02em', flexShrink:0 }}>
                {z.type}
              </div>

              {/* Lock / hide */}
              {!previewMode && (
                <div className="opacity-0 group-hover:opacity-100" style={{ display:'flex', alignItems:'center', gap:1, flexShrink:0 }}>
                  <button
                    onClick={e=>{e.stopPropagation();updateZone(z.id,{locked:!z.locked});}}
                    title={z.locked?'Unlock':'Lock'}
                    style={{ width:18, height:18, borderRadius:3, background:'transparent', border:'none', cursor:'pointer', color:z.locked?T.warning:T.borderStrong, display:'flex', alignItems:'center', justifyContent:'center' }}
                  >{z.locked?<Lock size={9} strokeWidth={1.8}/>:<LockOpen size={9} strokeWidth={1.8}/>}</button>
                  <button
                    onClick={e=>{e.stopPropagation();updateZone(z.id,{hidden:!z.hidden});}}
                    title={z.hidden?'Show':'Hide'}
                    style={{ width:18, height:18, borderRadius:3, background:'transparent', border:'none', cursor:'pointer', color:z.hidden?T.borderStrong:T.inkSoft, display:'flex', alignItems:'center', justifyContent:'center' }}
                  >{z.hidden?<EyeOff size={9} strokeWidth={1.8}/>:<Eye size={9} strokeWidth={1.8}/>}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -- Shortcuts block ------------------------------------------- */
function ShortcutsBlock() {
  return (
    <div>
      <div style={{ padding:'8px 10px 5px', borderTop:`1px solid ${T.border}` }}>
        <span style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9.5, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted }}>Shortcuts</span>
      </div>
      <div style={{ padding:'0 10px 12px', display:'flex', flexDirection:'column', gap:1 }}>
        {SHORTCUTS.map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'2px 0', fontFamily:'Inter,sans-serif', fontSize:11, color:T.inkSoft }}>
            <span>{s.label}</span>
            <div style={{ display:'flex', gap:2 }}>
              {s.keys.map((k,j) => (
                <kbd key={j} style={{
                  padding:'1px 5px', minWidth:16, textAlign:'center',
                  background:T.surface, color:T.ink, border:`1px solid ${T.border}`,
                  borderRadius:3, fontFamily:'Inter, system-ui, sans-serif', fontSize:9,
                  fontWeight:500, lineHeight:1.4,
                }}>{k}</kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -- Elements panel -------------------------------------------- */
interface ElementsPanelProps extends LayersPanelProps {
  addZone: (type:'text'|'photo'|'custom'|'label') => void;
  addShapeZone: (s:'rect'|'ellipse'|'triangle'|'line') => void;
  uploadingImage: boolean;
  imageUploadRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e:React.ChangeEvent<HTMLInputElement>) => void;
}

function ElementsPanel({
  addZone, addShapeZone, uploadingImage, imageUploadRef, handleImageUpload,
  zones, selectedIds, setSelectedIds, moveZoneUp, moveZoneDown, updateZone, previewMode,
}:ElementsPanelProps) {
  const [shapesOpen, setShapesOpen] = useState(false);
  const nothingSelected = selectedIds.length === 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', overflowY:'auto', overflowX:'hidden', flex:1 }}>
      {/* -- Add Elements -- */}
      {!previewMode && (
        <div style={{ padding:'10px 10px 8px', borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9.5, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted, marginBottom:6 }}>
            Add Element
          </div>

          <input ref={imageUploadRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" style={{ display:'none' }} onChange={handleImageUpload} />

          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <AddBtn icon={<Type size={14} strokeWidth={1.8}/>} label="Text field" onClick={()=>addZone('text')}/>
            <AddBtn icon={<Camera size={14} strokeWidth={1.8}/>} label="Photo zone" onClick={()=>addZone('photo')}/>
            <AddBtn icon={<ListFilter size={14} strokeWidth={1.8}/>} label="Select field" onClick={()=>addZone('custom')}/>
            <AddBtn icon={<Tag size={14} strokeWidth={1.8}/>} label="Static text" onClick={()=>addZone('label')}/>
            <AddBtn
              icon={uploadingImage ? <Loader2 size={14} strokeWidth={2} className="animate-spin"/> : <Upload size={14} strokeWidth={1.8}/>}
              label={uploadingImage ? 'Uploading…' : 'Upload image'}
              onClick={()=>imageUploadRef.current?.click()}
              disabled={uploadingImage}
            />

            {/* Shapes collapsible */}
            <div>
              <button
                onClick={()=>setShapesOpen(o=>!o)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:5, padding:'5px 8px',
                  background:'transparent', border:`1px solid ${T.border}`, borderRadius:5, cursor:'pointer',
                  fontFamily:'Inter, system-ui, sans-serif', fontSize:9.5, letterSpacing:'0.06em', textTransform:'uppercase', color:T.inkSoft,
                }}
              >
                {shapesOpen?<ChevronDown size={9} strokeWidth={2}/>:<ChevronRight size={9} strokeWidth={2}/>}
                <Square size={9} strokeWidth={1.8}/>
                <span style={{ flex:1, textAlign:'left' }}>Shapes</span>
                <span style={{ color:T.muted, fontSize:9 }}>4</span>
              </button>
              {shapesOpen && (
                <div style={{ marginTop:4, display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 }}>
                  {([
                    { s:'rect'     as const, label:'Rectangle', icon:<Square size={11} strokeWidth={1.8}/> },
                    { s:'ellipse'  as const, label:'Circle',    icon:<Circle size={11} strokeWidth={1.8}/> },
                    { s:'triangle' as const, label:'Triangle',  icon:<Triangle size={11} strokeWidth={1.8}/> },
                    { s:'line'     as const, label:'Line',      icon:<Minus size={11} strokeWidth={1.8}/> },
                  ] as { s:'rect'|'ellipse'|'triangle'|'line'; label:string; icon:React.ReactNode }[]).map(it => (
                    <button key={it.s} onClick={()=>addShapeZone(it.s)} style={{
                      display:'flex', alignItems:'center', gap:5, padding:'5px 6px',
                      background:T.cream, border:`1px solid ${T.border}`, borderRadius:5, cursor:'pointer',
                    }}>
                      <span style={{ width:18, height:18, borderRadius:3, background:T.surface, color:T.inkSoft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{it.icon}</span>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:500, color:T.ink }}>{it.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -- Thick divider separating elements from layers -- */}
      <div style={{ height:5, background:T.border, flexShrink:0 }}/>

      {/* -- Layers -- */}
      <LayersPanel
        zones={zones} selectedIds={selectedIds} setSelectedIds={setSelectedIds}
        moveZoneUp={moveZoneUp} moveZoneDown={moveZoneDown} updateZone={updateZone}
        previewMode={previewMode}
      />

      {/* -- Shortcuts (only when nothing selected) -- */}
      {nothingSelected && !previewMode && <ShortcutsBlock/>}
    </div>
  );
}

/* -- Templates panel ------------------------------------------- */
function TemplatesPanel({
  onApplyTemplate, applyingTemplateId,
}:{
  onApplyTemplate:(id:string)=>void;
  applyingTemplateId:string|null;
}) {
  const entries = Object.entries(TEMPLATE_CONFIGS);
  return (
    <div style={{ overflowY:'auto', overflowX:'hidden', flex:1 }}>
      {/* Header */}
      <div style={{ padding:'10px 10px 4px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9.5, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted }}>Templates</div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:10.5, color:T.muted, lineHeight:1.4, marginTop:2 }}>
          Click to swap background. Zones stay.
        </div>
      </div>

      {/* Grid — 2-col, fills full panel width */}
      <div style={{
        padding:'8px 10px 16px',
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:8,
        boxSizing:'border-box', width:'100%',
      }}>
        {entries.map(([id, cfg]) => {
          const svgStr = buildSVG(id, cfg.text);
          const src = `data:image/svg+xml,${encodeURIComponent(svgStr)}`;
          const loading = applyingTemplateId === id;
          return (
            <button
              key={id}
              onClick={()=>{ if (!applyingTemplateId) onApplyTemplate(id); }}
              disabled={!!applyingTemplateId}
              title={cfg.name}
              style={{
                display:'flex', flexDirection:'column', gap:0, padding:0,
                background:T.surface, border:`1.5px solid ${loading?T.primary:T.border}`,
                borderRadius:8, cursor:applyingTemplateId?'wait':'pointer',
                opacity:applyingTemplateId&&!loading?0.4:1, textAlign:'left',
                minWidth:0, overflow:'hidden',
                transition:'border-color 0.15s, opacity 0.15s, transform 0.12s',
                boxShadow:'0 1px 3px rgba(15,31,24,0.06)',
              }}
            >
              {/* Thumbnail — fills the button, taller 4:5 ratio */}
              <div style={{ position:'relative', width:'100%', aspectRatio:'4/5', background:T.cream }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={cfg.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                {loading && (
                  <div style={{ position:'absolute', inset:0, background:'rgba(15,31,24,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Loader2 size={18} strokeWidth={2} style={{ color:'white', animation:'spin 1s linear infinite' }}/>
                  </div>
                )}
              </div>
              {/* Name — sits below the image inside the card */}
              <div style={{
                padding:'6px 8px 7px',
                borderTop:`1px solid ${T.border}`,
                background:T.surface,
              }}>
                <span style={{
                  fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:500,
                  color:T.ink, lineHeight:1.2,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                  display:'block',
                }}>{cfg.name}</span>
              </div>
            </button>
          );
        })}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* -- Brand Kit panel ------------------------------------------- */
function BrandPanel({
  brandUploadRef, handleBrandUpload, brandAssets, addBrandAssetToCanvas, uploadingBrandAsset,
}:{
  brandUploadRef: React.RefObject<HTMLInputElement>;
  handleBrandUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  brandAssets: string[];
  addBrandAssetToCanvas: (url: string) => void;
  uploadingBrandAsset: boolean;
}) {
  const [copied, setCopied] = useState<string|null>(null);

  const copyColor = (c: string) => {
    navigator.clipboard.writeText(c).catch(()=>{});
    setCopied(c);
    setTimeout(()=>setCopied(null), 1400);
  };

  return (
    <div style={{ overflowY:'auto', overflowX:'hidden', flex:1 }}>
      <div style={{ padding:'10px 10px 4px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9.5, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted }}>Brand Kit</div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:10.5, color:T.muted, lineHeight:1.4, marginTop:2 }}>
          Click a color to copy its hex value.
        </div>
      </div>

      {/* Brand colors */}
      <div style={{ padding:'10px 10px 4px' }}>
        <div style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', color:T.muted, marginBottom:7 }}>Colors</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {BRAND_COLORS.map(c => (
            <button
              key={c}
              onClick={()=>copyColor(c)}
              title={copied===c?'Copied!':c}
              style={{
                width:24, height:24, borderRadius:6, position:'relative',
                background:c,
                border:`1.5px solid ${c==='#FFFFFF'||c==='#FAF6EE'?T.borderStrong:'transparent'}`,
                boxShadow:'0 1px 4px rgba(0,0,0,0.15)',
                cursor:'pointer', flexShrink:0, padding:0, outline:'none',
              }}
            >
              {copied===c && (
                <span style={{ position:'absolute', inset:0, borderRadius:5, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Check size={10} strokeWidth={2.5} style={{ color:'white' }}/>
                </span>
              )}
            </button>
          ))}
        </div>
        {copied && (
          <div style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9.5, color:T.primary, marginTop:6 }}>
            {copied} copied
          </div>
        )}
      </div>

      <div style={{ height:1, background:T.border, margin:'8px 10px' }}/>

      {/* Assets */}
      <div style={{ padding:'4px 10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', color:T.muted }}>Assets</div>
          {brandAssets.length > 0 && (
            <span style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9, color:T.muted }}>{brandAssets.length}</span>
          )}
        </div>

        {/* Upload button */}
        <input
          ref={brandUploadRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          style={{ display:'none' }}
          onChange={handleBrandUpload}
        />
        <button
          onClick={()=>brandUploadRef.current?.click()}
          disabled={uploadingBrandAsset}
          style={{
            display:'flex', alignItems:'center', gap:7, padding:'8px 10px',
            background:T.surface, border:`1.5px dashed ${T.borderStrong}`, borderRadius:6,
            cursor: uploadingBrandAsset ? 'wait' : 'pointer',
            opacity: uploadingBrandAsset ? 0.6 : 1,
          }}
        >
          <span style={{ width:24, height:24, borderRadius:5, background:T.primarySoft, color:T.primary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {uploadingBrandAsset
              ? <Loader2 size={12} strokeWidth={2} className="animate-spin"/>
              : <Upload size={12} strokeWidth={2}/>}
          </span>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:11.5, fontWeight:600, color:T.ink }}>
            {uploadingBrandAsset ? 'Uploading…' : 'Upload logo / asset'}
          </span>
        </button>

        {/* Saved assets gallery */}
        {brandAssets.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
            {brandAssets.map((url, i) => (
              <button
                key={i}
                onClick={()=>addBrandAssetToCanvas(url)}
                title="Click to add to canvas"
                style={{
                  aspectRatio:'1', borderRadius:6, overflow:'hidden', padding:0,
                  border:`1.5px solid ${T.border}`, background:T.cream,
                  cursor:'pointer', position:'relative',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }}/>
                <span style={{
                  position:'absolute', inset:0, background:'rgba(31,77,58,0)', borderRadius:5,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background 0.15s',
                }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(31,77,58,0.12)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='rgba(31,77,58,0)')}
                />
              </button>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:10.5, color:T.muted, lineHeight:1.4 }}>
            Upload logos, icons, or any image. Saved assets appear here and can be added to any card.
          </div>
        )}
      </div>
    </div>
  );
}

/* -- Background panel ------------------------------------------ */
function BackgroundPanel({
  onApplyBackground, applyingBg,
}:{
  onApplyBackground:(value:string)=>void;
  applyingBg:boolean;
}) {
  const [active, setActive] = useState<string|null>(null);

  const apply = (value:string) => {
    if (applyingBg) return;
    setActive(value);
    onApplyBackground(value);
  };

  return (
    <div style={{ overflowY:'auto', overflowX:'hidden', flex:1 }}>
      <div style={{ padding:'10px 10px 4px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9.5, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted }}>Background</div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:10.5, color:T.muted, lineHeight:1.4, marginTop:2 }}>
          Replace canvas background with a color or gradient.
        </div>
      </div>

      {/* Solid colors */}
      <div style={{ padding:'10px 10px 4px', boxSizing:'border-box', width:'100%' }}>
        <div style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', color:T.muted, marginBottom:7 }}>Solid colors</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {BG_SOLIDS.map(c => {
            const isActive = active===c && applyingBg;
            return (
              <button
                key={c}
                onClick={()=>apply(c)}
                title={c}
                disabled={applyingBg}
                style={{
                  width:26, height:26, borderRadius:6,
                  background:c,
                  border:`2px solid ${isActive?T.primary:c==='#FFFFFF'||c==='#FAF6EE'?T.borderStrong:'transparent'}`,
                  boxShadow:'0 1px 3px rgba(0,0,0,0.18)',
                  cursor:applyingBg?'wait':'pointer', flexShrink:0, padding:0,
                  position:'relative', overflow:'hidden',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >
                {isActive && <Loader2 size={11} strokeWidth={2} style={{ color:'white', animation:'spin 1s linear infinite', filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}/>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height:1, background:T.border, margin:'10px 10px' }}/>

      {/* Gradients */}
      <div style={{ padding:'0 10px 14px', boxSizing:'border-box', width:'100%' }}>
        <div style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', color:T.muted, marginBottom:7 }}>Gradients</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, width:'100%', boxSizing:'border-box' }}>
          {BG_GRADIENTS.map(g => {
            const isActive = active===g.value && applyingBg;
            return (
              <button
                key={g.value}
                onClick={()=>apply(g.value)}
                disabled={applyingBg}
                style={{
                  position:'relative', height:50, borderRadius:8, minWidth:0,
                  background:g.value,
                  border:`2px solid ${isActive?T.primary:'transparent'}`,
                  cursor:applyingBg?'wait':'pointer',
                  overflow:'hidden', padding:0,
                  boxShadow:'0 1px 4px rgba(0,0,0,0.20)',
                }}
              >
                {isActive && (
                  <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Loader2 size={14} strokeWidth={2} style={{ color:'white', animation:'spin 1s linear infinite' }}/>
                  </div>
                )}
                <span style={{
                  position:'absolute', bottom:5, left:0, right:0, textAlign:'center',
                  fontFamily:'Inter,sans-serif', fontSize:9.5, fontWeight:600, color:'rgba(255,255,255,0.92)',
                  textShadow:'0 1px 3px rgba(0,0,0,0.7)',
                }}>{g.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* -- Tab icon button — Canva-style: icon above label ---------- */
function TabBtn({
  icon, label, active, onClick,
}:{
  icon:React.ReactNode; label:string; active:boolean; onClick:()=>void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        width:'100%', padding:'10px 4px 8px',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:5,
        background:'transparent',
        border:'none', cursor:'pointer',
        borderRight:active?`2px solid ${T.primary}`:'2px solid transparent',
        transition:'color 0.12s',
        flexShrink:0,
      }}
    >
      {/* Icon container — subtle background highlight when active */}
      <span style={{
        width:36, height:36, borderRadius:8,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: active ? T.primarySoft : 'transparent',
        color: active ? T.primary : T.muted,
        transition:'background 0.12s, color 0.12s',
      }}>
        {icon}
      </span>
      {/* Label */}
      <span style={{
        fontFamily:'Inter, sans-serif',
        fontSize:10,
        fontWeight: active ? 600 : 400,
        color: active ? T.primary : T.muted,
        letterSpacing:'0.01em',
        lineHeight:1,
        whiteSpace:'nowrap',
        transition:'color 0.12s, font-weight 0.12s',
      }}>
        {label}
      </span>
    </button>
  );
}

/* -- Main export ----------------------------------------------- */
export interface LeftRailProps {
  previewMode: boolean;
  // Elements
  addZone: (type:'text'|'photo'|'custom'|'label') => void;
  addShapeZone: (s:'rect'|'ellipse'|'triangle'|'line') => void;
  uploadingImage: boolean;
  imageUploadRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e:React.ChangeEvent<HTMLInputElement>) => void;
  // Layers
  zones: Zone[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  moveZoneUp: (id:string) => void;
  moveZoneDown: (id:string) => void;
  updateZone: (id:string, patch:Partial<Zone>, withHistory?:boolean) => void;
  // Templates
  onApplyTemplate: (id:string) => void;
  applyingTemplateId: string|null;
  // Background
  onApplyBackground: (value:string) => void;
  applyingBg: boolean;
  // Brand kit
  brandAssets: string[];
  brandUploadRef: React.RefObject<HTMLInputElement>;
  handleBrandUpload: (e:React.ChangeEvent<HTMLInputElement>) => void;
  uploadingBrandAsset: boolean;
  addBrandAssetToCanvas: (url:string) => void;
}

export default function LeftRail({
  previewMode,
  addZone, addShapeZone, uploadingImage, imageUploadRef, handleImageUpload,
  zones, selectedIds, setSelectedIds, moveZoneUp, moveZoneDown, updateZone,
  onApplyTemplate, applyingTemplateId,
  onApplyBackground, applyingBg,
  brandAssets, brandUploadRef, handleBrandUpload, uploadingBrandAsset, addBrandAssetToCanvas,
}:LeftRailProps) {
  const [tab, setTab] = useState<LeftTab>('elements');

  const TABS: { id:LeftTab; icon:React.ReactNode; label:string }[] = [
    { id:'elements',   icon:<LayoutGrid size={20} strokeWidth={1.6}/>,     label:'Elements' },
    { id:'templates',  icon:<LayoutTemplate size={20} strokeWidth={1.6}/>,  label:'Templates' },
    { id:'brand',      icon:<Palette size={20} strokeWidth={1.6}/>,        label:'Brand' },
    { id:'background', icon:<ImageIcon size={20} strokeWidth={1.6}/>,      label:'Background' },
  ];

  return (
    <aside style={{
      display:'flex', flexShrink:0,
      width:364,          /* 72px strip + 292px panel */
      borderRight:`1px solid ${T.border}`,
      background:T.cream,
    }}>
      {/* -- Icon strip — 72px wide, Canva-style -- */}
      <div style={{
        width:72, flexShrink:0,
        display:'flex', flexDirection:'column', alignItems:'stretch',
        borderRight:`1px solid ${T.border}`,
        background:T.surface,
        overflowY:'auto', overflowX:'hidden',
      }}>
        {TABS.map(t => (
          <TabBtn
            key={t.id}
            icon={t.icon}
            label={t.label}
            active={tab===t.id}
            onClick={()=>setTab(t.id)}
          />
        ))}
      </div>

      {/* -- Panel content — 292px -- */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {tab==='elements' && (
          <ElementsPanel
            addZone={addZone} addShapeZone={addShapeZone}
            uploadingImage={uploadingImage} imageUploadRef={imageUploadRef}
            handleImageUpload={handleImageUpload}
            zones={zones} selectedIds={selectedIds} setSelectedIds={setSelectedIds}
            moveZoneUp={moveZoneUp} moveZoneDown={moveZoneDown} updateZone={updateZone}
            previewMode={previewMode}
          />
        )}

        {tab==='templates' && (
          <TemplatesPanel
            onApplyTemplate={onApplyTemplate}
            applyingTemplateId={applyingTemplateId}
          />
        )}

        {tab==='brand' && (
          <BrandPanel
            brandUploadRef={brandUploadRef}
            handleBrandUpload={handleBrandUpload}
            brandAssets={brandAssets}
            addBrandAssetToCanvas={addBrandAssetToCanvas}
            uploadingBrandAsset={uploadingBrandAsset}
          />
        )}

        {tab==='background' && (
          <BackgroundPanel
            onApplyBackground={onApplyBackground}
            applyingBg={applyingBg}
          />
        )}

      </div>
    </aside>
  );
}
