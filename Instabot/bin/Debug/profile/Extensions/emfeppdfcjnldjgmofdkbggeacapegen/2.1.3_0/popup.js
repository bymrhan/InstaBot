'use strict';var J=chrome.i18n.getMessage;function K(a,b){var c=document.createRange();c.selectNodeContents(a);c.deleteContents();b=b.split("\n");c=document.createTextNode(b[0]);a.appendChild(c);for(let d=1,e=b.length;d<e;d++)a.appendChild(document.createElement("br")),c=document.createTextNode(b[d]),a.appendChild(c)};function L(a,b){a.g=a.m.g*b/2;ea(a.m,a.g)}function fa(a,b){b=a.g+(b-a.h)/.9;return 0>b?0:b>a.m.g?a.m.g:b}
var ia=class{constructor(a){this.m=a;this.g=0;this.A=!1}handleEvent(a){if(0===a.button)switch(a.type){case "mousedown":if(a.target!==this.m.o){this.A=!1;const c=this.m.g;var b=this.g/c;a=a.offsetX/c;b=2/3<b?.25>=a?0:a<=2/3?1:2:b<1/3?.75<=a?2:a>=1/3?1:0:a<=1/3?0:a>=2/3?2:1;10<=Math.abs(this.m.g*b/2-this.g)&&(L(this,b),ha(this,b));break}this.A=!0;this.h=a.pageX;break;case "mousemove":if(!this.A)break;ea(this.m,fa(this,a.pageX));break;case "mouseup":case "mouseleave":this.A&&(b=Math.round(2*fa(this,
a.pageX)/this.m.g),L(this,b),ha(this,b),this.A=!1)}}};function ea(a,b){let c=String(b);a.F.setAttribute("width",c);a.P.setAttribute("width",c);a.o.style.left=String(b-6)+"px";a.F.style.fill=`hsl(${40+60*b/a.g}, 88.6%, 51.8%)`}function ja(a,b){a.H.addEventListener("mousedown",b);a=document.documentElement;a.addEventListener("mousemove",b);a.addEventListener("mouseup",b);a.addEventListener("mouseleave",b)}
var ka=class{constructor(a){this.h=a;this.g=parseFloat(this.h.getElementsByClassName("progress-background_rect")[0].getAttribute("width"));this.F=this.h.getElementsByClassName("progress-left-background_rect")[0];this.P=this.h.getElementsByClassName("progress-left-transparent-border_rect")[0];this.H=this.h.getElementsByClassName("progress")[0];this.o=this.h.getElementsByClassName("indicator_dot")[0];this.i=this.h.getElementsByClassName("label")[0]}disable(){this.h.classList.add("disabled")}};function ha(a,b){let c=1===b!==(a.B!==a.u);0===b&&a.B||2===b&&!a.B?(a.u=!a.B,I(a.O,a.D,a.u)):c&&(a.u=!a.u,a.M(a.u));la(a)}function ma(a){a.A=!1;L(a,0);var b=J("cannot_run");K(a.m.i,b);a.m.disable();a.m.H.removeEventListener("mousedown",a);b=document.documentElement;b.removeEventListener("mousemove",a);b.removeEventListener("mouseup",a);b.removeEventListener("mouseleave",a)}function na(a){var b=a.B;b=b===a.u?b?2:0:1;a.A=!1;L(a,b);la(a)}
function la(a){var b=J(a.B?a.u?"enabled":"temp_disabled":a.u?"temp_enabled":"disabled");K(a.m.i,b)}
class oa extends ia{constructor(a,b,c){super(a);this.O=b;this.G=c;this.N=d=>{chrome.runtime.lastError?(ma(this),chrome.tabs.executeScript(this.G.id,{code:""},()=>{if(!chrome.runtime.lastError){var e=J("pending_refresh");K(this.m.i,e)}})):(this.u=d,g(this.B)||na(this))};c&&c.url.startsWith("http")?(this.D=(new URL(c.url)).hostname,ja(a,this),y(b,this.D,this),this.L(this.N),z(b,this.D,this)):ma(this)}C(a){this.B=a;g(this.u)||this.L(this.N)}}
var qa=class extends oa{M(a){chrome.tabs.sendMessage(this.G.id,a?0:1)}L(a){chrome.tabs.sendMessage(this.G.id,4,pa,a)}},ra=class extends oa{M(a){chrome.tabs.sendMessage(this.G.id,a?2:3)}L(a){chrome.tabs.sendMessage(this.G.id,5,pa,a)}};const pa={frameId:0};function sa(a){chrome.runtime.openOptionsPage();a.stopImmediatePropagation()}const ta=document.getElementsByClassName("gear")[0],ua=document.getElementsByClassName("shadows_10_bf_Class")[0],M=document.getElementsByClassName("gear_wrapper")[0];function va(a){0===a.button&&M.classList.add("active")}function wa(){M.classList.remove("active")}function xa(a){a.preventDefault()}ta.addEventListener("mousedown",va);ta.addEventListener("click",sa);ua.addEventListener("mousedown",va);
ua.addEventListener("click",sa);M.addEventListener("mouseleave",wa);M.addEventListener("mouseup",wa);M.addEventListener("dragstart",xa);M.addEventListener("selectstart",xa);const ya=new A("sync","JS2."),za=new A("sync","CSS."),[Ba,Ca]=document.getElementsByClassName("tile"),Da=new ka(Ba),Ea=new ka(Ca);chrome.tabs.query({active:!0,lastFocusedWindow:!0},([a])=>{new qa(Da,ya,a);new ra(Ea,za,a)});document.querySelectorAll("[data-locale]").forEach(function(a){let b=J(a.dataset.locale);K(a,b)});
// Copyright 2021, Sean Lee <i73hi64d0wr5df8pckig@gmail.com>. All rights reserved.