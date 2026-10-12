/**
 * ページの先頭で、最初の描画の前に動かす小さなスクリプト（app/layout.tsx が <body> の先頭に置く）。
 * React の読み込みを待たないので、動きの準備が画面のちらつきにならない。
 * 状態はすべて <html> の属性・クラスに書き、見た目は CSS（app/globals.css）が受け持つ。
 *
 *   .js            … このスクリプトが動いた印。付いたときだけ、CSS が「現れる前」の姿を作る
 *                    （JS が動かないときは、すべて最初から見えている）
 *   .is-loaded     … ページの読み込みが終わった印。紙のざらつき（背景の画像）を、ここから敷く
 *   data-intro     … "skip" のとき、トップの最初の演出（生成りの幕）を出さない。
 *                    同じ訪問の中では一度だけ見せる（sessionStorage）。下層から入ったとき・ページを移るときも出さない
 *   data-cv        … 最初の表示のあいだだけ付く。画面の外にある区画（.section）の描画を、後回しにする（下の説明）
 *   data-past      … 最初の画面（トップはヒーロー）を過ぎた。ヘッダーに、透ける地が付く
 *   data-hide      … 下へ送っている。ヘッダーを上へ隠す（上へ戻すと出る）
 *   [data-reveal]  … 画面に入った要素に .is-in を付ける。すでに画面の上へ過ぎていた要素は .is-past も付けて、動かさずに出す
 *
 * ■ 最初の表示を軽くする（data-cv）
 *   長いページを最初から全部レイアウトすると、遅い端末では、開いた直後に操作を受け付けない時間が長くなる
 *   （実測：CPU を4倍遅くした計測で、トップは 0.9 秒。後回しにすると 0.5 秒）。
 *   そこで、初めて開いたときだけ、画面の外の区画を content-visibility: auto で後回しにし、
 *   読み込みが終わってから、手の空いたときに1区画ずつ、ふつうの描画に戻す（戻し終えたら data-cv を外す）。
 *   付けたままにはしない。付けたままだと、再読み込みや「戻る」のあとに、見ていた位置がずれるため。
 *   次のときは、最初から付けない／その場で全部外す：
 *     再読み込み・「戻る」「進む」で開いたとき、# 付きの URL で開いたとき、
 *     キーを押したとき、ページ内リンク（#）を押したとき。
 *
 * ■ 大きさや位置を、こちらから測らないこと（offsetHeight・getBoundingClientRect など）
 *   読み込みの途中で測ると、その場でページ全体のレイアウトを強制してしまう（後回しにした区画も、すべて描かせてしまう）。
 *   位置の判定は、すべて IntersectionObserver に任せる。
 *     ・現れる動き … 要素ごとに「画面に入ったか」
 *     ・ヘッダー   … ヒーローが「画面の上から 170px より下に、まだ残っているか」（残っていなければ、過ぎた）
 *   スクロールのたびに読むのは、スクロール量（scrollY）だけ。ページ移動で後から入る要素は MutationObserver で拾う。
 */
export const BOOT_SCRIPT = `(function(){
var d=document,h=d.documentElement,w=window;
function skip(){h.setAttribute('data-intro','skip')}
try{if(w.sessionStorage.getItem('rf-intro')||w.location.pathname!=='/')skip();else w.sessionStorage.setItem('rf-intro','1')}catch(e){}
function ld(){h.classList.add('is-loaded')}
if(d.readyState==='complete')ld();else w.addEventListener('load',ld);
w.addEventListener('popstate',skip);
d.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('a[href]'))skip()},true);
try{(function(){
var n=w.performance&&performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];
if(!n||(n.type!=='navigate'&&n.type!=='prerender')||w.location.hash||!(w.CSS&&CSS.supports&&CSS.supports('content-visibility','auto')))return;
h.setAttribute('data-cv','');
var on=true,started=false;
function off(){if(!on)return;on=false;h.removeAttribute('data-cv')}
function idle(f){if(w.requestIdleCallback)w.requestIdleCallback(f,{timeout:1500});else w.setTimeout(f,150)}
function step(){if(!on)return;var s=d.querySelector('.section:not([data-cv-done])');if(!s){off();return}s.setAttribute('data-cv-done','');idle(step)}
function start(){if(started)return;started=true;w.setTimeout(function(){idle(step)},500)}
if(d.readyState==='complete')start();else w.addEventListener('load',start);
w.setTimeout(start,6000);
w.addEventListener('popstate',off);w.addEventListener('hashchange',off);w.addEventListener('keydown',off,true);
d.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('a[href*="#"]'))off()},true);
})()}catch(e){}
if(!('IntersectionObserver'in w)||!('MutationObserver'in w))return;
h.classList.add('js');
var io=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){var e=es[i],t=e.target;if(e.isIntersecting){t.classList.add('is-in');io.unobserve(t)}else if(e.boundingClientRect.bottom<0){t.classList.add('is-in','is-past');io.unobserve(t)}}},{rootMargin:'0px 0px -8% 0px',threshold:0.01});
var hero=null,ly=0,tick=0;
function st(k,v){if(v){if(!h.hasAttribute(k))h.setAttribute(k,'')}else if(h.hasAttribute(k))h.removeAttribute(k)}
var hio=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++)if(es[i].target===hero)st('data-past',!es[i].isIntersecting)},{rootMargin:'-170px 0px 0px 0px'});
function up(){tick=0;var y=w.scrollY||0;if(!(hero&&hero.isConnected))st('data-past',y>24);if(Math.abs(y-ly)>8){st('data-hide',y>ly&&y>120);ly=y}}
function rq(){if(!tick)tick=w.requestAnimationFrame(up)}
function scan(r){if(r.nodeType!==1)return;if(r.hasAttribute('data-reveal'))io.observe(r);var l=r.querySelectorAll('[data-reveal]');for(var i=0;i<l.length;i++)io.observe(l[i]);var x=r.hasAttribute('data-hero')?r:r.querySelector('[data-hero]');if(x&&x!==hero){if(hero)hio.unobserve(hero);hero=x;hio.observe(x)}}
w.addEventListener('scroll',rq,{passive:true});
new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++)scan(a[j])}}).observe(h,{childList:true,subtree:true});
})();`;
