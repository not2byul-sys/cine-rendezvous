import {palette, parts, items, asset, characters as samples, defaults} from './catalog.js';

// renderPreview only mutates the supplied preview host. save resolves after persistence.
export async function openAvatarEditor({initial={}, baseline={}, characters=samples, renderPreview, disposePreview, save}={}) {
  if (!characters.length || typeof save !== 'function') throw new Error('characters와 save 함수를 확인해 주세요.');
  const merge = (base, value) => ({...base,...value,items:{...base.items,...value.items},colors:{...base.colors,...value.colors}});
  const base = merge(defaults, baseline);
  if (!characters.some(c=>c.id===base.character)) base.character=characters[0].id;
  let draft=merge(base,initial), active='character', busy=false;
  const previous=document.activeElement;
  const host=document.createElement('div');
  const root=host.attachShadow({mode:'open'});
  const css=document.createElement('link');
  css.rel='stylesheet'; css.href=new URL('./editor.css',import.meta.url);
  const ready=new Promise((resolve,reject)=>{css.onload=resolve;css.onerror=()=>reject(new Error('editor.css 로드 실패'));});
  root.append(css);
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-labelledby','editor-title');
  dialog.innerHTML=`<header><div><h2 id="editor-title">복고풍 캐릭터 꾸미기</h2><p>오늘 극장에서 만날 나의 모습</p></div><button class="close" aria-label="닫기"><img alt=""></button></header>
  <main><section class="preview"><label>닉네임 수정하기<input maxlength="14" aria-describedby="hint"><small id="hint">최대 14자까지 입력할 수 있어요</small></label><div class="avatar"></div></section>
  <section class="controls"><nav aria-label="꾸미기 메뉴"></nav><div class="options"></div></section><footer><button class="reset">초기화</button><button class="save">저장</button></footer></main><output role="alert"></output>`;
  root.append(dialog); document.body.append(host);
  try {await ready;} catch(e){host.remove();throw e;}
  const q=s=>dialog.querySelector(s);
  q('.close img').src=asset('imgFrame.svg');
  const input=q('input'), panel=q('.options'), previewHost=q('.avatar');
  const make=(tag,cls,txt)=>{const n=document.createElement(tag);n.className=cls;if(txt)n.textContent=txt;return n;};
  const button=(label,run)=>{const n=make('button','',label);n.onclick=run;return n;};
  const tabs={character:'캐릭터', accessory:'악세서리', color:'칼라'};
  function preview(){
    if(renderPreview){renderPreview(previewHost,structuredClone(draft));return;}
    const c=characters.find(x=>x.id===draft.character);
    previewHost.replaceChildren();
    if(c){const img=new Image();img.src=c.image;img.alt=c.label;previewHost.append(img);}
  }
  function update(){
    q('.save').disabled=busy || !draft.nickname.trim() || draft.nickname.length>14;
    for(const n of panel.querySelectorAll('[data-value]')){
      const value=n.dataset.group==='character'?draft.character:draft[n.dataset.kind][n.dataset.group];
      n.setAttribute('aria-pressed',String(n.dataset.value===value));
    }
    preview();
  }
  function option(grid,group,value,label,kind,imageUrl){
    const n=button('',()=>{if(kind)draft[kind][group]=value;else draft.character=value;update();});
    Object.assign(n.dataset,{group,value,kind:kind||''});
    n.setAttribute('aria-label',label);
    if(kind==='colors'){n.className='swatch';n.style.setProperty('--chip',value);n.title=value;}
    else {
      if(imageUrl){const img=new Image();img.alt='';img.src=imageUrl;n.append(img);}
      else n.append(make('span','none','∅'));
      if(kind)n.append(make('span','',label));
    }
    grid.append(n);
  }
  function draw(){
    for(const n of q('nav').children)n.setAttribute('aria-pressed',String(n.dataset.tab===active));
    panel.replaceChildren();panel.scrollTop=0;
    if(active==='character'){
      const grid=make('div','grid chars');panel.append(grid);
      for(const c of characters)option(grid,'character',c.id,c.label,null,c.image);
    } else {
      const color=active==='color', kind=color?'colors':'items', shortcuts=make('div','shortcuts');
      panel.append(shortcuts);
      for(const key of Object.keys(color?parts:items)){
        const label=parts[key]+(color?'색':''), section=make('section','group');
        const heading=make('h3','',label);
        const reset=button('↻',()=>{draft[kind][key]=base[kind][key];update();});
        reset.setAttribute('aria-label',label+' 초기화');heading.append(reset);
        const grid=make('div',color?'palette':'grid');
        section.append(heading,grid);panel.append(section);
        shortcuts.append(button(label,()=>panel.scrollTo({top:section.offsetTop})));
        if(color){for(const hex of palette)option(grid,key,hex,label+' '+hex,kind);}
        else for(const [id,name] of items[key])option(grid,key,id,name,kind,['none','default'].includes(id)?null:asset(id+'.png'));
      }
    }
    update();
  }
  for(const [key,label] of Object.entries(tabs)){
    const tab=button(label,()=>{active=key;draw();});tab.dataset.tab=key;q('nav').append(tab);
  }
  input.value=draft.nickname;input.oninput=()=>{draft.nickname=input.value;update();};
  q('.reset').onclick=()=>{draft=structuredClone(base);input.value=draft.nickname;update();};
  q('.close').onclick=()=>dialog.close();
  dialog.oncancel=e=>{if(busy)e.preventDefault();};
  dialog.onclose=()=>{try{disposePreview?.(previewHost);}finally{host.remove();previous?.focus();}};
  q('.save').onclick=async()=>{
    if(busy||q('.save').disabled)return;
    busy=true;q('main').inert=true;q('.close').disabled=true;q('output').textContent='';
    const value=structuredClone(draft);value.nickname=value.nickname.trim();
    try{await save(value);dialog.close();}
    catch{q('output').textContent='저장하지 못했어요. 다시 시도해 주세요.';}
    finally{busy=false;q('main').inert=false;q('.close').disabled=false;q('.save').disabled=!input.value.trim();}
  };
  dialog.showModal();draw();
  return {close:()=>{if(!busy)dialog.close();}};
}
