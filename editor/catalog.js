export const palette = ['#B3202E','#D9822B','#D6A12A','#3F5A34','#2F6A6A','#2A3A5E','#6C4A6F','#6A3A1E','#E9DCC3','#AB9DD1','#7C7773','#E9A8B8'];
export const parts = {top:'상의',bottom:'하의',hat:'모자',glasses:'안경',bag:'가방',shoes:'신발'};
export const items = {
  glasses:[['none','없음'],['round','라운드 안경'],['sun','선글라스'],['square','사각 안경']],
  hat:[['none','없음'],['beret','베레'],['flatcap','플랫캡'],['fedora','페도라'],['cloche','클로슈'],['bowler','보울러']],
  bag:[['none','없음'],['crossbody','크로스백'],['shoulder','숄더백'],['rattan','라탄백']],
  shoes:[['default','기본'],['loafer','로퍼'],['ballet','발레 플랫'],['sneaker','스니커즈'],['ankle','앵클부츠'],['knee','니하이 부츠'],['maryjane','메리제인']]
};
export const asset = name => new URL('./assets/'+name, import.meta.url).href;
export const characters = Array.from({length:4},(_,i)=>({id:'sample-'+i,label:'캐릭터 '+(i+1),image:asset('imgGameCharacter'+i+'.png')}));
export const defaults = {nickname:'올드보이',character:'sample-2',items:{glasses:'sun',hat:'beret',bag:'none',shoes:'default'},colors:{top:palette[4],bottom:palette[0],hat:palette[8],glasses:null,bag:palette[7],shoes:null}};
