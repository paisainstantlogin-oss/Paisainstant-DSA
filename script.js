const track=document.querySelector('.slides'),imgs=[...document.querySelectorAll('.slides img')],dots=document.querySelector('.dots');let i=0;
imgs.forEach((_,n)=>{const d=document.createElement('i');if(!n)d.className='active';d.onclick=()=>go(n);dots.appendChild(d)});
function go(n){i=(n+imgs.length)%imgs.length;track.style.transform=`translateX(-${i*100}%)`;[...dots.children].forEach((d,k)=>d.className=k===i?'active':'')}
document.querySelector('.next').onclick=()=>go(i+1);document.querySelector('.prev').onclick=()=>go(i-1);setInterval(()=>go(i+1),4500);
