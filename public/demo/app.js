const ICONS={"chevron-right":'<path d="m9 18 6-6-6-6" />',package:'<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /> <path d="M12 22V12" /> <polyline points="3.29 7 12 12 20.71 7" /> <path d="m7.5 4.27 9 5.15" />',ban:'<circle cx="12" cy="12" r="10" /> <path d="M4.929 4.929 19.07 19.071" />',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />',user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /> <circle cx="12" cy="7" r="4" />',megaphone:'<path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /> <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" /> <path d="M8 6v8" />',waves:'<path d="M2 12q2.5 2 5 0t5 0 5 0 5 0" /> <path d="M2 19q2.5 2 5 0t5 0 5 0 5 0" /> <path d="M2 5q2.5 2 5 0t5 0 5 0 5 0" />',siren:'<path d="M7 18v-6a5 5 0 1 1 10 0v6" /> <path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" /> <path d="M21 12h1" /> <path d="M18.5 4.5 18 5" /> <path d="M2 12h1" /> <path d="M12 2v1" /> <path d="m4.929 4.929.707.707" /> <path d="M12 12v6" />',banknote:'<rect width="20" height="12" x="2" y="6" rx="2" /> <circle cx="12" cy="12" r="2" /> <path d="M6 12h.01M18 12h.01" />',"file-text":'<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="M10 9H8" /> <path d="M16 13H8" /> <path d="M16 17H8" />',"door-open":'<path d="M10 21H2" /> <path d="M10 3H7a2 2 0 00-2 2v16" /> <path d="M14 12h.01" /> <path d="M19 21V5a2 2 0 00-1.675-1.974l-6.163-1.013A1 1 0 0010 3v18a1 1 0 001.124.992z" /> <path d="M22 21h-3" />',car:'<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /> <circle cx="7" cy="17" r="2" /> <path d="M9 17h6" /> <circle cx="17" cy="17" r="2" />',shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />',"triangle-alert":'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" />',home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',key:'<path d="m2 21 9.6-9.6" /> <path d="m7.5 15.5 2.3 2.3a1 1 0 0 1 0 1.4l-2.1 2.1a1 1 0 0 1-1.4 0L4 19" /> <circle cx="15.5" cy="7.5" r="5.5" />',"building-2":'<path d="M10 12h4" /> <path d="M10 8h4" /> <path d="M14 21v-3a2 2 0 0 0-4 0v3" /> <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" /> <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />',"clipboard-list":'<rect width="8" height="4" x="8" y="2" rx="1" ry="1" /> <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /> <path d="M12 11h4" /> <path d="M12 16h4" /> <path d="M8 11h.01" /> <path d="M8 16h.01" />',"layout-dashboard":'<rect width="7" height="9" x="3" y="3" rx="1" /> <rect width="7" height="5" x="14" y="3" rx="1" /> <rect width="7" height="9" x="14" y="12" rx="1" /> <rect width="7" height="5" x="3" y="16" rx="1" />',flame:'<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />',"party-popper":'<path d="M5.8 11.3 2 22l10.7-3.79" /> <path d="M4 3h.01" /> <path d="M22 8h.01" /> <path d="M15 2h.01" /> <path d="M22 20h.01" /> <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" /> <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" /> <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" /> <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />',dumbbell:'<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" /> <path d="m2.5 21.5 1.4-1.4" /> <path d="m20.1 3.9 1.4-1.4" /> <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" /> <path d="m9.6 14.4 4.8-4.8" />',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <path d="M16 3.128a4 4 0 0 1 0 7.744" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <circle cx="9" cy="7" r="4" />',calendar:'<path d="M8 2v3" /> <path d="M16 2v3" /> <rect x="3" y="3" width="18" height="18" rx="2" /> <path d="M3 9h18" />',"circle-check":'<circle cx="12" cy="12" r="10" /> <path d="m16 9-5.5 5.5L8 12" />',bell:'<path d="M10.268 21a2 2 0 0 0 3.464 0" /> <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />',footprints:'<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" /> <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" /> <path d="M16 17h4" /> <path d="M4 13h4" />',search:'<path d="m21 21-4.34-4.34" /> <circle cx="11" cy="11" r="8" />',lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" />',"message-circle":'<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />',receipt:'<path d="M12 17V7" /> <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" /> <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />',landmark:'<path d="M10 18v-7" /> <path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" /> <path d="M14 18v-7" /> <path d="M18 18v-7" /> <path d="M3 22h18" /> <path d="M6 18v-7" />',"folder-open":'<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />',phone:'<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />',"pencil-line":'<path d="M13 21h8" /> <path d="m15 5 4 4" /> <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />',inbox:'<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /> <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />',send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /> <path d="m21.854 2.147-10.94 10.939" />',"book-open":'<path d="M12 5v16" /> <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />',"log-out":'<path d="m16 17 5-5-5-5" /> <path d="M21 12H9" /> <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />',sun:'<circle cx="12" cy="12" r="4" /> <path d="M12 2v2" /> <path d="M12 20v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="m17.66 17.66 1.41 1.41" /> <path d="M2 12h2" /> <path d="M20 12h2" /> <path d="m6.34 17.66-1.41 1.41" /> <path d="m19.07 4.93-1.41 1.41" />',moon:'<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />',x:'<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',"users-round":'<path d="M18 21a8 8 0 0 0-16 0" /> <circle cx="10" cy="8" r="5" /> <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />',"shield-check":'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /> <path d="m9 12 2 2 4-4" />',clock:'<circle cx="12" cy="12" r="10" /> <path d="M12 6v6l4 2" />',"qr-code":'<rect width="5" height="5" x="3" y="3" rx="1" /> <rect width="5" height="5" x="16" y="3" rx="1" /> <rect width="5" height="5" x="3" y="16" rx="1" /> <path d="M21 16h-3a2 2 0 0 0-2 2v3" /> <path d="M21 21v.01" /> <path d="M12 7v3a2 2 0 0 1-2 2H7" /> <path d="M3 12h.01" /> <path d="M12 3h.01" /> <path d="M12 16v.01" /> <path d="M16 12h1" /> <path d="M21 12v.01" /> <path d="M12 21v-1" />',building:'<path d="M12 10h.01" /> <path d="M12 14h.01" /> <path d="M12 6h.01" /> <path d="M16 10h.01" /> <path d="M16 14h.01" /> <path d="M16 6h.01" /> <path d="M8 10h.01" /> <path d="M8 14h.01" /> <path d="M8 6h.01" /> <path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /> <rect x="4" y="2" width="16" height="20" rx="2" />'},EMOJI_ICON_MAP={"📦":"package","🚫":"ban","🔧":"wrench","👤":"user","👥":"users-round","📢":"megaphone","🏊":"waves","🚨":"siren","💵":"banknote","📄":"file-text","🚪":"door-open","🚗":"car","🛡️":"shield","🛡":"shield","⚠️":"triangle-alert","⚠":"triangle-alert","🏠":"home","🔑":"key","🏢":"building-2","📋":"clipboard-list","📊":"layout-dashboard","🍖":"flame","🎉":"party-popper","🏋️":"dumbbell","🏋":"dumbbell","👪":"users","🗓️":"calendar","🗓":"calendar","📅":"calendar","✅":"circle-check","🔔":"bell","🏙️":"building-2","🏙":"building-2","🚶":"footprints","🔍":"search","🔒":"lock","💬":"message-circle","🧾":"receipt","🏦":"landmark","🗂️":"folder-open","🗂":"folder-open","📞":"phone","📝":"pencil-line","📥":"inbox","📤":"send","📒":"book-open"};function esc(e){return e==null?"":String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function escJs(e){return e==null?"":esc(String(e).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\r?\n/g,"\\n").replace(/</g,"\\x3C"))}function hoyISO(){const e=new Date;return e.getFullYear()+"-"+String(e.getMonth()+1).padStart(2,"0")+"-"+String(e.getDate()).padStart(2,"0")}function fechaDeRegistro(e,t){let o=null;return e&&e.ts?o=new Date(e.ts):e&&/^\d{4}-\d{2}-\d{2}$/.test(e[t]||"")&&(o=new Date(e[t]+"T12:00:00")),o}function esDeHoy(e,t){const o=fechaDeRegistro(e,t||"fecha");return o?o.toDateString()===new Date().toDateString():e&&e[t||"fecha"]==="Hoy"}function fechaRegistro(e,t){const o=fechaDeRegistro(e,t);if(!o)return e&&e[t]||"";const a=new Date;a.setHours(0,0,0,0);const i=new Date(o);i.setHours(0,0,0,0);const r=Math.round((a-i)/864e5);if(r===0)return"Hoy";if(r===1)return"Ayer";const s={day:"numeric",month:"short"};return i.getFullYear()!==a.getFullYear()&&(s.year="numeric"),i.toLocaleDateString("es-CL",s)}function icon(e){const t=EMOJI_ICON_MAP[e]||e,o=ICONS[t];return o?`<span class="ic" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${o}</svg></span>`:esc(e)}var qrcode=(function(){var e=function(f,h){var p=f,g=$[h],d=null,y=0,P=null,M=[],E={},O=function(l,v){d=(function(u){for(var m=new Array(u),b=0;b<u;b+=1){m[b]=new Array(u);for(var A=0;A<u;A+=1)m[b][A]=null}return m})(y=4*p+17),U(0,0),U(y-7,0),U(0,y-7),Z(),G(),J(l,v),p>=7&&Y(l),P==null&&(P=le(p,g,M)),se(P,v)},U=function(l,v){for(var u=-1;u<=7;u+=1)if(!(l+u<=-1||y<=l+u))for(var m=-1;m<=7;m+=1)v+m<=-1||y<=v+m||(d[l+u][v+m]=0<=u&&u<=6&&(m==0||m==6)||0<=m&&m<=6&&(u==0||u==6)||2<=u&&u<=4&&2<=m&&m<=4)},G=function(){for(var l=8;l<y-8;l+=1)d[l][6]==null&&(d[l][6]=l%2==0);for(var v=8;v<y-8;v+=1)d[6][v]==null&&(d[6][v]=v%2==0)},Z=function(){for(var l=K.getPatternPosition(p),v=0;v<l.length;v+=1)for(var u=0;u<l.length;u+=1){var m=l[v],b=l[u];if(d[m][b]==null)for(var A=-2;A<=2;A+=1)for(var D=-2;D<=2;D+=1)d[m+A][b+D]=A==-2||A==2||D==-2||D==2||A==0&&D==0}},Y=function(l){for(var v=K.getBCHTypeNumber(p),u=0;u<18;u+=1){var m=!l&&(v>>u&1)==1;d[Math.floor(u/3)][u%3+y-8-3]=m}for(u=0;u<18;u+=1)m=!l&&(v>>u&1)==1,d[u%3+y-8-3][Math.floor(u/3)]=m},J=function(l,v){for(var u=g<<3|v,m=K.getBCHTypeInfo(u),b=0;b<15;b+=1){var A=!l&&(m>>b&1)==1;b<6?d[b][8]=A:b<8?d[b+1][8]=A:d[y-15+b][8]=A}for(b=0;b<15;b+=1)A=!l&&(m>>b&1)==1,b<8?d[8][y-b-1]=A:b<9?d[8][15-b-1+1]=A:d[8][15-b-1]=A;d[y-8][8]=!l},se=function(l,v){for(var u=-1,m=y-1,b=7,A=0,D=K.getMaskFunction(v),I=y-1;I>0;I-=2)for(I==6&&(I-=1);;){for(var T=0;T<2;T+=1)if(d[m][I-T]==null){var k=!1;A<l.length&&(k=(l[A]>>>b&1)==1),D(m,I-T)&&(k=!k),d[m][I-T]=k,(b-=1)==-1&&(A+=1,b=7)}if((m+=u)<0||y<=m){m-=u,u=-u;break}}},le=function(l,v,u){for(var m=pe.getRSBlocks(l,v),b=me(),A=0;A<u.length;A+=1){var D=u[A];b.put(D.getMode(),4),b.put(D.getLength(),K.getLengthInBits(D.getMode(),l)),D.write(b)}var I=0;for(A=0;A<m.length;A+=1)I+=m[A].dataCount;if(b.getLengthInBits()>8*I)throw"code length overflow. ("+b.getLengthInBits()+">"+8*I+")";for(b.getLengthInBits()+4<=8*I&&b.put(0,4);b.getLengthInBits()%8!=0;)b.putBit(!1);for(;!(b.getLengthInBits()>=8*I||(b.put(236,8),b.getLengthInBits()>=8*I));)b.put(17,8);return(function(T,k){for(var L=0,W=0,Q=0,F=new Array(k.length),q=new Array(k.length),B=0;B<k.length;B+=1){var ne=k[B].dataCount,ce=k[B].totalCount-ne;W=Math.max(W,ne),Q=Math.max(Q,ce),F[B]=new Array(ne);for(var S=0;S<F[B].length;S+=1)F[B][S]=255&T.getBuffer()[S+L];L+=ne;var ae=K.getErrorCorrectPolynomial(ce),te=V(F[B],ae.getLength()-1).mod(ae);for(q[B]=new Array(ae.getLength()-1),S=0;S<q[B].length;S+=1){var ie=S+te.getLength()-q[B].length;q[B][S]=ie>=0?te.getAt(ie):0}}var ge=0;for(S=0;S<k.length;S+=1)ge+=k[S].totalCount;var ue=new Array(ge),oe=0;for(S=0;S<W;S+=1)for(B=0;B<k.length;B+=1)S<F[B].length&&(ue[oe]=F[B][S],oe+=1);for(S=0;S<Q;S+=1)for(B=0;B<k.length;B+=1)S<q[B].length&&(ue[oe]=q[B][S],oe+=1);return ue})(b,m)};E.addData=function(l,v){var u=null;switch(v=v||"Byte"){case"Numeric":u=fe(l);break;case"Alphanumeric":u=be(l);break;case"Byte":u=he(l);break;case"Kanji":u=ye(l);break;default:throw"mode:"+v}M.push(u),P=null},E.isDark=function(l,v){if(l<0||y<=l||v<0||y<=v)throw l+","+v;return d[l][v]},E.getModuleCount=function(){return y},E.make=function(){if(p<1){for(var l=1;l<40;l++){for(var v=pe.getRSBlocks(l,g),u=me(),m=0;m<M.length;m++){var b=M[m];u.put(b.getMode(),4),u.put(b.getLength(),K.getLengthInBits(b.getMode(),l)),b.write(u)}var A=0;for(m=0;m<v.length;m++)A+=v[m].dataCount;if(u.getLengthInBits()<=8*A)break}p=l}O(!1,(function(){for(var D=0,I=0,T=0;T<8;T+=1){O(!0,T);var k=K.getLostPoint(E);(T==0||D>k)&&(D=k,I=T)}return I})())},E.createTableTag=function(l,v){l=l||2;var u="";u+='<table style="',u+=" border-width: 0px; border-style: none;",u+=" border-collapse: collapse;",u+=" padding: 0px; margin: "+(v=v===void 0?4*l:v)+"px;",u+='">',u+="<tbody>";for(var m=0;m<E.getModuleCount();m+=1){u+="<tr>";for(var b=0;b<E.getModuleCount();b+=1)u+='<td style="',u+=" border-width: 0px; border-style: none;",u+=" border-collapse: collapse;",u+=" padding: 0px; margin: 0px;",u+=" width: "+l+"px;",u+=" height: "+l+"px;",u+=" background-color: ",u+=E.isDark(m,b)?"#000000":"#ffffff",u+=";",u+='"/>';u+="</tr>"}return u+="</tbody>",u+="</table>"},E.createSvgTag=function(l,v,u,m){var b={};typeof arguments[0]=="object"&&(l=(b=arguments[0]).cellSize,v=b.margin,u=b.alt,m=b.title),l=l||2,v=v===void 0?4*l:v,(u=typeof u=="string"?{text:u}:u||{}).text=u.text||null,u.id=u.text?u.id||"qrcode-description":null,(m=typeof m=="string"?{text:m}:m||{}).text=m.text||null,m.id=m.text?m.id||"qrcode-title":null;var A,D,I,T,k=E.getModuleCount()*l+2*v,L="";for(T="l"+l+",0 0,"+l+" -"+l+",0 0,-"+l+"z ",L+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',L+=b.scalable?"":' width="'+k+'px" height="'+k+'px"',L+=' viewBox="0 0 '+k+" "+k+'" ',L+=' preserveAspectRatio="xMinYMin meet"',L+=m.text||u.text?' role="img" aria-labelledby="'+z([m.id,u.id].join(" ").trim())+'"':"",L+=">",L+=m.text?'<title id="'+z(m.id)+'">'+z(m.text)+"</title>":"",L+=u.text?'<description id="'+z(u.id)+'">'+z(u.text)+"</description>":"",L+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',L+='<path d="',D=0;D<E.getModuleCount();D+=1)for(I=D*l+v,A=0;A<E.getModuleCount();A+=1)E.isDark(D,A)&&(L+="M"+(A*l+v)+","+I+T);return L+='" stroke="transparent" fill="black"/>',L+="</svg>"},E.createDataURL=function(l,v){l=l||2,v=v===void 0?4*l:v;var u=E.getModuleCount()*l+2*v,m=v,b=u-v;return ee(u,u,function(A,D){if(m<=A&&A<b&&m<=D&&D<b){var I=Math.floor((A-m)/l),T=Math.floor((D-m)/l);return E.isDark(T,I)?0:1}return 1})},E.createImgTag=function(l,v,u){l=l||2,v=v===void 0?4*l:v;var m=E.getModuleCount()*l+2*v,b="";return b+="<img",b+=' src="',b+=E.createDataURL(l,v),b+='"',b+=' width="',b+=m,b+='"',b+=' height="',b+=m,b+='"',u&&(b+=' alt="',b+=z(u),b+='"'),b+="/>"};var z=function(l){for(var v="",u=0;u<l.length;u+=1){var m=l.charAt(u);switch(m){case"<":v+="&lt;";break;case">":v+="&gt;";break;case"&":v+="&amp;";break;case'"':v+="&quot;";break;default:v+=m}}return v};return E.createASCII=function(l,v){if((l=l||1)<2)return(function(F){F=F===void 0?2:F;var q,B,ne,ce,S,ae=1*E.getModuleCount()+2*F,te=F,ie=ae-F,ge={"██":"█","█ ":"▀"," █":"▄","  ":" "},ue={"██":"▀","█ ":"▀"," █":" ","  ":" "},oe="";for(q=0;q<ae;q+=2){for(ne=Math.floor((q-te)/1),ce=Math.floor((q+1-te)/1),B=0;B<ae;B+=1)S="█",te<=B&&B<ie&&te<=q&&q<ie&&E.isDark(ne,Math.floor((B-te)/1))&&(S=" "),te<=B&&B<ie&&te<=q+1&&q+1<ie&&E.isDark(ce,Math.floor((B-te)/1))?S+=" ":S+="█",oe+=F<1&&q+1>=ie?ue[S]:ge[S];oe+=`
`}return ae%2&&F>0?oe.substring(0,oe.length-ae-1)+Array(ae+1).join("▀"):oe.substring(0,oe.length-1)})(v);l-=1,v=v===void 0?2*l:v;var u,m,b,A,D=E.getModuleCount()*l+2*v,I=v,T=D-v,k=Array(l+1).join("██"),L=Array(l+1).join("  "),W="",Q="";for(u=0;u<D;u+=1){for(b=Math.floor((u-I)/l),Q="",m=0;m<D;m+=1)A=1,I<=m&&m<T&&I<=u&&u<T&&E.isDark(b,Math.floor((m-I)/l))&&(A=0),Q+=A?k:L;for(b=0;b<l;b+=1)W+=Q+`
`}return W.substring(0,W.length-1)},E.renderTo2dContext=function(l,v){v=v||2;for(var u=E.getModuleCount(),m=0;m<u;m++)for(var b=0;b<u;b++)l.fillStyle=E.isDark(m,b)?"black":"white",l.fillRect(b*v,m*v,v,v)},E};e.stringToBytes=(e.stringToBytesFuncs={default:function(f){for(var h=[],p=0;p<f.length;p+=1){var g=f.charCodeAt(p);h.push(255&g)}return h}}).default,e.createStringToBytes=function(f,h){var p=(function(){for(var d=R(f),y=function(){var G=d.read();if(G==-1)throw"eof";return G},P=0,M={};;){var E=d.read();if(E==-1)break;var O=y(),U=y()<<8|y();M[String.fromCharCode(E<<8|O)]=U,P+=1}if(P!=h)throw P+" != "+h;return M})(),g=63;return function(d){for(var y=[],P=0;P<d.length;P+=1){var M=d.charCodeAt(P);if(M<128)y.push(M);else{var E=p[d.charAt(P)];typeof E=="number"?(255&E)==E?y.push(E):(y.push(E>>>8),y.push(255&E)):y.push(g)}}return y}};var t,o,a,i,r,s=1,n=2,c=4,w=8,$={L:1,M:0,Q:3,H:2},N=0,H=1,_=2,C=3,j=4,X=5,re=6,de=7,K=(t=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],o=1335,a=7973,r=function(f){for(var h=0;f!=0;)h+=1,f>>>=1;return h},(i={}).getBCHTypeInfo=function(f){for(var h=f<<10;r(h)-r(o)>=0;)h^=o<<r(h)-r(o);return 21522^(f<<10|h)},i.getBCHTypeNumber=function(f){for(var h=f<<12;r(h)-r(a)>=0;)h^=a<<r(h)-r(a);return f<<12|h},i.getPatternPosition=function(f){return t[f-1]},i.getMaskFunction=function(f){switch(f){case N:return function(h,p){return(h+p)%2==0};case H:return function(h,p){return h%2==0};case _:return function(h,p){return p%3==0};case C:return function(h,p){return(h+p)%3==0};case j:return function(h,p){return(Math.floor(h/2)+Math.floor(p/3))%2==0};case X:return function(h,p){return h*p%2+h*p%3==0};case re:return function(h,p){return(h*p%2+h*p%3)%2==0};case de:return function(h,p){return(h*p%3+(h+p)%2)%2==0};default:throw"bad maskPattern:"+f}},i.getErrorCorrectPolynomial=function(f){for(var h=V([1],0),p=0;p<f;p+=1)h=h.multiply(V([1,x.gexp(p)],0));return h},i.getLengthInBits=function(f,h){if(1<=h&&h<10)switch(f){case s:return 10;case n:return 9;case c:case w:return 8;default:throw"mode:"+f}else if(h<27)switch(f){case s:return 12;case n:return 11;case c:return 16;case w:return 10;default:throw"mode:"+f}else{if(!(h<41))throw"type:"+h;switch(f){case s:return 14;case n:return 13;case c:return 16;case w:return 12;default:throw"mode:"+f}}},i.getLostPoint=function(f){for(var h=f.getModuleCount(),p=0,g=0;g<h;g+=1)for(var d=0;d<h;d+=1){for(var y=0,P=f.isDark(g,d),M=-1;M<=1;M+=1)if(!(g+M<0||h<=g+M))for(var E=-1;E<=1;E+=1)d+E<0||h<=d+E||M==0&&E==0||P==f.isDark(g+M,d+E)&&(y+=1);y>5&&(p+=3+y-5)}for(g=0;g<h-1;g+=1)for(d=0;d<h-1;d+=1){var O=0;f.isDark(g,d)&&(O+=1),f.isDark(g+1,d)&&(O+=1),f.isDark(g,d+1)&&(O+=1),f.isDark(g+1,d+1)&&(O+=1),O!=0&&O!=4||(p+=3)}for(g=0;g<h;g+=1)for(d=0;d<h-6;d+=1)f.isDark(g,d)&&!f.isDark(g,d+1)&&f.isDark(g,d+2)&&f.isDark(g,d+3)&&f.isDark(g,d+4)&&!f.isDark(g,d+5)&&f.isDark(g,d+6)&&(p+=40);for(d=0;d<h;d+=1)for(g=0;g<h-6;g+=1)f.isDark(g,d)&&!f.isDark(g+1,d)&&f.isDark(g+2,d)&&f.isDark(g+3,d)&&f.isDark(g+4,d)&&!f.isDark(g+5,d)&&f.isDark(g+6,d)&&(p+=40);var U=0;for(d=0;d<h;d+=1)for(g=0;g<h;g+=1)f.isDark(g,d)&&(U+=1);return p+=Math.abs(100*U/h/h-50)/5*10},i),x=(function(){for(var f=new Array(256),h=new Array(256),p=0;p<8;p+=1)f[p]=1<<p;for(p=8;p<256;p+=1)f[p]=f[p-4]^f[p-5]^f[p-6]^f[p-8];for(p=0;p<255;p+=1)h[f[p]]=p;var g={glog:function(d){if(d<1)throw"glog("+d+")";return h[d]},gexp:function(d){for(;d<0;)d+=255;for(;d>=256;)d-=255;return f[d]}};return g})();function V(f,h){if(f.length===void 0)throw f.length+"/"+h;var p=(function(){for(var d=0;d<f.length&&f[d]==0;)d+=1;for(var y=new Array(f.length-d+h),P=0;P<f.length-d;P+=1)y[P]=f[P+d];return y})(),g={getAt:function(d){return p[d]},getLength:function(){return p.length},multiply:function(d){for(var y=new Array(g.getLength()+d.getLength()-1),P=0;P<g.getLength();P+=1)for(var M=0;M<d.getLength();M+=1)y[P+M]^=x.gexp(x.glog(g.getAt(P))+x.glog(d.getAt(M)));return V(y,0)},mod:function(d){if(g.getLength()-d.getLength()<0)return g;for(var y=x.glog(g.getAt(0))-x.glog(d.getAt(0)),P=new Array(g.getLength()),M=0;M<g.getLength();M+=1)P[M]=g.getAt(M);for(M=0;M<d.getLength();M+=1)P[M]^=x.gexp(x.glog(d.getAt(M))+y);return V(P,0).mod(d)}};return g}var pe=(function(){var f=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],h=function(g,d){var y={};return y.totalCount=g,y.dataCount=d,y},p={};return p.getRSBlocks=function(g,d){var y=(function(Y,J){switch(J){case $.L:return f[4*(Y-1)+0];case $.M:return f[4*(Y-1)+1];case $.Q:return f[4*(Y-1)+2];case $.H:return f[4*(Y-1)+3];default:return}})(g,d);if(y===void 0)throw"bad rs block @ typeNumber:"+g+"/errorCorrectionLevel:"+d;for(var P=y.length/3,M=[],E=0;E<P;E+=1)for(var O=y[3*E+0],U=y[3*E+1],G=y[3*E+2],Z=0;Z<O;Z+=1)M.push(h(U,G));return M},p})(),me=function(){var f=[],h=0,p={getBuffer:function(){return f},getAt:function(g){var d=Math.floor(g/8);return(f[d]>>>7-g%8&1)==1},put:function(g,d){for(var y=0;y<d;y+=1)p.putBit((g>>>d-y-1&1)==1)},getLengthInBits:function(){return h},putBit:function(g){var d=Math.floor(h/8);f.length<=d&&f.push(0),g&&(f[d]|=128>>>h%8),h+=1}};return p},fe=function(f){var h=s,p=f,g={getMode:function(){return h},getLength:function(P){return p.length},write:function(P){for(var M=p,E=0;E+2<M.length;)P.put(d(M.substring(E,E+3)),10),E+=3;E<M.length&&(M.length-E==1?P.put(d(M.substring(E,E+1)),4):M.length-E==2&&P.put(d(M.substring(E,E+2)),7))}},d=function(P){for(var M=0,E=0;E<P.length;E+=1)M=10*M+y(P.charAt(E));return M},y=function(P){if("0"<=P&&P<="9")return P.charCodeAt(0)-48;throw"illegal char :"+P};return g},be=function(f){var h=n,p=f,g={getMode:function(){return h},getLength:function(y){return p.length},write:function(y){for(var P=p,M=0;M+1<P.length;)y.put(45*d(P.charAt(M))+d(P.charAt(M+1)),11),M+=2;M<P.length&&y.put(d(P.charAt(M)),6)}},d=function(y){if("0"<=y&&y<="9")return y.charCodeAt(0)-48;if("A"<=y&&y<="Z")return y.charCodeAt(0)-65+10;switch(y){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+y}};return g},he=function(f){var h=c,p=e.stringToBytes(f),g={getMode:function(){return h},getLength:function(d){return p.length},write:function(d){for(var y=0;y<p.length;y+=1)d.put(p[y],8)}};return g},ye=function(f){var h=w,p=e.stringToBytesFuncs.SJIS;if(!p)throw"sjis not supported.";(function(){var y=p("友");if(y.length!=2||(y[0]<<8|y[1])!=38726)throw"sjis not supported."})();var g=p(f),d={getMode:function(){return h},getLength:function(y){return~~(g.length/2)},write:function(y){for(var P=g,M=0;M+1<P.length;){var E=(255&P[M])<<8|255&P[M+1];if(33088<=E&&E<=40956)E-=33088;else{if(!(57408<=E&&E<=60351))throw"illegal char at "+(M+1)+"/"+E;E-=49472}E=192*(E>>>8&255)+(255&E),y.put(E,13),M+=2}if(M<P.length)throw"illegal char at "+(M+1)}};return d},ve=function(){var f=[],h={writeByte:function(p){f.push(255&p)},writeShort:function(p){h.writeByte(p),h.writeByte(p>>>8)},writeBytes:function(p,g,d){g=g||0,d=d||p.length;for(var y=0;y<d;y+=1)h.writeByte(p[y+g])},writeString:function(p){for(var g=0;g<p.length;g+=1)h.writeByte(p.charCodeAt(g))},toByteArray:function(){return f},toString:function(){var p="";p+="[";for(var g=0;g<f.length;g+=1)g>0&&(p+=","),p+=f[g];return p+="]"}};return h},R=function(f){var h=f,p=0,g=0,d=0,y={read:function(){for(;d<8;){if(p>=h.length){if(d==0)return-1;throw"unexpected end of file./"+d}var M=h.charAt(p);if(p+=1,M=="=")return d=0,-1;M.match(/^\s$/)||(g=g<<6|P(M.charCodeAt(0)),d+=6)}var E=g>>>d-8&255;return d-=8,E}},P=function(M){if(65<=M&&M<=90)return M-65;if(97<=M&&M<=122)return M-97+26;if(48<=M&&M<=57)return M-48+52;if(M==43)return 62;if(M==47)return 63;throw"c:"+M};return y},ee=function(f,h,p){for(var g=(function(U,G){var Z=U,Y=G,J=new Array(U*G),se={setPixel:function(l,v,u){J[v*Z+l]=u},write:function(l){l.writeString("GIF87a"),l.writeShort(Z),l.writeShort(Y),l.writeByte(128),l.writeByte(0),l.writeByte(0),l.writeByte(0),l.writeByte(0),l.writeByte(0),l.writeByte(255),l.writeByte(255),l.writeByte(255),l.writeString(","),l.writeShort(0),l.writeShort(0),l.writeShort(Z),l.writeShort(Y),l.writeByte(0);var v=le(2);l.writeByte(2);for(var u=0;v.length-u>255;)l.writeByte(255),l.writeBytes(v,u,255),u+=255;l.writeByte(v.length-u),l.writeBytes(v,u,v.length-u),l.writeByte(0),l.writeString(";")}},le=function(l){for(var v=1<<l,u=1+(1<<l),m=l+1,b=z(),A=0;A<v;A+=1)b.add(String.fromCharCode(A));b.add(String.fromCharCode(v)),b.add(String.fromCharCode(u));var D,I,T,k=ve(),L=(D=k,I=0,T=0,{write:function(q,B){if(q>>>B)throw"length over";for(;I+B>=8;)D.writeByte(255&(q<<I|T)),B-=8-I,q>>>=8-I,T=0,I=0;T|=q<<I,I+=B},flush:function(){I>0&&D.writeByte(T)}});L.write(v,m);var W=0,Q=String.fromCharCode(J[W]);for(W+=1;W<J.length;){var F=String.fromCharCode(J[W]);W+=1,b.contains(Q+F)?Q+=F:(L.write(b.indexOf(Q),m),b.size()<4095&&(b.size()==1<<m&&(m+=1),b.add(Q+F)),Q=F)}return L.write(b.indexOf(Q),m),L.write(u,m),L.flush(),k.toByteArray()},z=function(){var l={},v=0,u={add:function(m){if(u.contains(m))throw"dup key:"+m;l[m]=v,v+=1},size:function(){return v},indexOf:function(m){return l[m]},contains:function(m){return l[m]!==void 0}};return u};return se})(f,h),d=0;d<h;d+=1)for(var y=0;y<f;y+=1)g.setPixel(y,d,p(y,d));var P=ve();g.write(P);for(var M=(function(){var U=0,G=0,Z=0,Y="",J={},se=function(z){Y+=String.fromCharCode(le(63&z))},le=function(z){if(!(z<0)){if(z<26)return 65+z;if(z<52)return z-26+97;if(z<62)return z-52+48;if(z==62)return 43;if(z==63)return 47}throw"n:"+z};return J.writeByte=function(z){for(U=U<<8|255&z,G+=8,Z+=1;G>=6;)se(U>>>G-6),G-=6},J.flush=function(){if(G>0&&(se(U<<6-G),U=0,G=0),Z%3!=0)for(var z=3-Z%3,l=0;l<z;l+=1)Y+="="},J.toString=function(){return Y},J})(),E=P.toByteArray(),O=0;O<E.length;O+=1)M.writeByte(E[O]);return M.flush(),"data:image/gif;base64,"+M};return e})();qrcode.stringToBytesFuncs["UTF-8"]=function(e){return(function(t){for(var o=[],a=0;a<t.length;a++){var i=t.charCodeAt(a);i<128?o.push(i):i<2048?o.push(192|i>>6,128|63&i):i<55296||i>=57344?o.push(224|i>>12,128|i>>6&63,128|63&i):(a++,i=65536+((1023&i)<<10|1023&t.charCodeAt(a)),o.push(240|i>>18,128|i>>12&63,128|i>>6&63,128|63&i))}return o})(e)},(function(e){typeof define=="function"&&define.amd?define([],e):typeof exports=="object"&&(module.exports=e())})(function(){return qrcode});function generarQrSvg(e,t){const o=qrcode(0,"M");return o.addData(e),o.make(),o.createSvgTag(t||5,0)}let jsQRCargando=null;function cargarJsQR(){return window.jsQR?Promise.resolve():jsQRCargando||(jsQRCargando=new Promise((e,t)=>{const o=document.createElement("script");o.src="jsQR.min.js",o.onload=()=>e(),o.onerror=()=>t(new Error("No se pudo cargar el lector de QR.")),document.head.appendChild(o)}),jsQRCargando)}const firebaseConfig={};firebase.initializeApp(firebaseConfig);const auth=firebase.auth(),db=firebase.firestore(),functions=firebase.functions(),COMUNIDADES_COLLECTION="mi_comunidad_comunidades",DIAS_HISTORIAL=90;function rutToEmail(e){return limpiarRut(e).toLowerCase()+"@mi-comunidad.app"}let residentesUnsub=null,conserjesUnsub=null,comunidadUnsub=null,comunidadesUnsub=null,visitasUnsub=null,vehiculosUnsub=null,encomiendasUnsub=null,reservasUnsub=null,bloquesReservaUnsub=null,bloquesOcupadosUnsub=null,visitasProgramadasUnsub=null,gastosComunesUnsub=null,tiposMultaUnsub=null,multasUnsub=null,avisosUnsub=null,incidenciasUnsub=null,documentosUnsub=null,movimientosContablesUnsub=null,remuneracionesUnsub=null,proveedoresDirectorioUnsub=null,mantencionesUnsub=null,vehiculosRegistradosUnsub=null,accesosUnsub=null,notificacionesUnsub=null,notificacionesDeptoUnsub=null,comunidadesDirectorio=[],community={id:"",name:"",address:"",apartments:0,residents:0,telefonoAdministracion:"",estado:"Activa",plan:"",fechaContratacion:"",notasSoporte:"",numResidentes:0,numConserjes:0,adminNombre:"",ultimoAcceso:null},currentPage="inicio",currentRole=null,currentUid=null;const rolesConfig={residente:{label:"Propietario",avatar:"CM",paginaInicial:"inicio",paginas:["inicio","avisos","solicitudes","encomiendas","reservas","gastoscomunes","documentos","perfil"],menu:[{label:"Principal",items:[{page:"inicio",icon:"🏠",label:"Inicio"},{page:"avisos",icon:"📢",label:"Avisos"},{page:"solicitudes",icon:"🔧",label:"Solicitudes"},{page:"encomiendas",icon:"📦",label:"Encomiendas"},{page:"reservas",icon:"🏊",label:"Reservas"}]},{label:"Comunidad",items:[{page:"gastoscomunes",icon:"💵",label:"Gastos comunes"},{page:"documentos",icon:"📄",label:"Documentos"},{page:"perfil",icon:"👤",label:"Mi perfil"}]}],mobile:[{page:"inicio",icon:"🏠",label:"Inicio"},{page:"avisos",icon:"📢",label:"Avisos"},{page:"encomiendas",icon:"📦",label:"Encomiendas"},{page:"gastoscomunes",icon:"💵",label:"Gastos"},{page:"perfil",icon:"👤",label:"Perfil"}]},conserje:{label:"Conserjería",avatar:"CJ",paginaInicial:"conserjeria",paginas:["conserjeria","avisos","encomiendas","reservas","documentos","perfil"],menu:[{label:"Principal",items:[{page:"conserjeria",icon:"🛡️",label:"Conserjería"},{page:"avisos",icon:"📢",label:"Avisos"},{page:"encomiendas",icon:"📦",label:"Encomiendas"},{page:"reservas",icon:"🏊",label:"Reservas"}]},{label:"Comunidad",items:[{page:"documentos",icon:"📄",label:"Documentos"},{page:"perfil",icon:"👤",label:"Mi perfil"}]}],mobile:[{page:"conserjeria",icon:"🛡️",label:"Conserjería"},{page:"avisos",icon:"📢",label:"Avisos"},{page:"encomiendas",icon:"📦",label:"Encomiendas"},{page:"perfil",icon:"👤",label:"Perfil"}]},admin:{label:"Administración",avatar:"AD",paginaInicial:"admin",paginas:["admin","conserjeria","avisos","solicitudes","encomiendas","reservas","documentos","perfil"],menu:[{label:"Principal",items:[{page:"admin",icon:"📊",label:"Administración"},{page:"conserjeria",icon:"🛡️",label:"Conserjería"}]},{label:"Comunidad",items:[{page:"avisos",icon:"📢",label:"Avisos"},{page:"solicitudes",icon:"🔧",label:"Solicitudes"},{page:"encomiendas",icon:"📦",label:"Encomiendas"},{page:"reservas",icon:"🏊",label:"Reservas"},{page:"documentos",icon:"📄",label:"Documentos"}]},{label:"Cuenta",items:[{page:"perfil",icon:"👤",label:"Mi perfil"}]}],mobile:[{page:"admin",icon:"📊",label:"Admin"},{page:"conserjeria",icon:"🛡️",label:"Conserjería"},{page:"avisos",icon:"📢",label:"Avisos"},{page:"encomiendas",icon:"📦",label:"Encomiendas"},{page:"perfil",icon:"👤",label:"Perfil"}]},superadmin:{label:"Super administrador",avatar:"SA",paginaInicial:"comunidades",paginas:["comunidades"],menu:[{label:"Plataforma",items:[{page:"comunidades",icon:"🏙️",label:"Comunidades"}]}],mobile:[{page:"comunidades",icon:"🏙️",label:"Comunidades"}]}},LOCAL_STORAGE_COMUNIDAD_ID="los-robles";function storageKey(e){return"mc_demo_"+LOCAL_STORAGE_COMUNIDAD_ID+"_"+e}function aplicarTema(e){document.documentElement.setAttribute("data-theme",e);const t=document.getElementById("temaToggleBtn");t&&(t.title=e==="dark"?"Cambiar a modo claro":"Cambiar a modo oscuro",t.querySelector(".ic").innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[e==="dark"?"sun":"moon"]}</svg>`)}function toggleTemaOscuro(){const t=(document.documentElement.getAttribute("data-theme")==="dark"?"dark":"light")==="dark"?"light":"dark";aplicarTema(t);try{localStorage.setItem(storageKey("tema"),t)}catch(o){console.error("No se pudo guardar la preferencia de tema:",o)}}function sugerirTemaNocturno(){let e=null;try{e=localStorage.getItem(storageKey("tema"))}catch{}if(e){aplicarTema(e);return}const t=new Date().getHours(),o=t>=20||t<7;aplicarTema(o?"dark":"light")}(function(){try{const t=localStorage.getItem(storageKey("tema"));t&&document.documentElement.setAttribute("data-theme",t)}catch{}})();function loadData(e,t){const o=storageKey(e),a=localStorage.getItem(o);return a?JSON.parse(a):(localStorage.setItem(o,JSON.stringify(t)),t)}function saveData(e,t){localStorage.setItem(storageKey(e),JSON.stringify(t))}function limpiarRut(e){return(e||"").replace(/[^0-9kK]/g,"").toUpperCase()}function formatearRut(e){const t=limpiarRut(e);if(t.length<2)return t;const o=t.slice(0,-1),a=t.slice(-1);return o.replace(/\B(?=(\d{3})+(?!\d))/g,".")+"-"+a}function validarRut(e){const t=limpiarRut(e);if(t.length<2)return!1;const o=t.slice(0,-1),a=t.slice(-1);if(!/^\d+$/.test(o))return!1;let i=0,r=2;for(let c=o.length-1;c>=0;c--)i+=parseInt(o[c],10)*r,r=r===7?2:r+1;const s=11-i%11;let n;return s===11?n="0":s===10?n="K":n=String(s),n===a}function validarRutEnVivo(e){const t=e.value.trim(),o=document.getElementById(e.id+"Error");if(!t){e.classList.remove("input-error"),o&&o.classList.add("hidden");return}t.length>=4&&(e.value=formatearRut(t));const a=validarRut(e.value);e.classList.toggle("input-error",!a),o&&o.classList.toggle("hidden",a)}let incidencias=[],vehiculos=[],accesos=[],visitas=[],visitasProgramadas=[],vehiculosRegistrados=[],residentesDirectorio=[],fichaVerificada={},conserjesDirectorio=[];const categoriaAvisoConfig={Importante:{icon:"⚠️",badge:"badge-yellow"},Mantención:{icon:"🔧",badge:"badge-blue"},General:{icon:"📢",badge:"badge-green"}};let avisos=[],encomiendas=[],novedades=loadData("novedades",[{icon:"📦",title:"Encomienda recibida",meta:"Depto 804 · 10:42",badgeClass:"badge-green",badgeText:"Registrada"},{icon:"🚪",title:"Visita registrada",meta:"Depto 302 · 10:15",badgeClass:"",badgeText:""}]),reservas=[];const LUGARES_RESERVABLES=[{lugar:"Quincho",icon:"🍖"},{lugar:"Centro de eventos",icon:"🎉"},{lugar:"Piscina",icon:"🏊"},{lugar:"Gimnasio",icon:"🏋️"}];let bloquesReserva=[],bloquesOcupados=[],profile=loadData("profile",{nombre:"Carolina Muñoz Soto",depto:"804",correo:"carolina.munoz@ejemplo.cl",telefono:"+56 9 8765 4321"}),documentos=[],notificaciones=[],notifParaTodosCache=[],notifDeptoCache=[];const mesesEs=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];function periodoActual(){const e=new Date;return e.getFullYear()+"-"+String(e.getMonth()+1).padStart(2,"0")}function periodoAnterior(e){const[t,o]=e.split("-").map(Number),a=new Date(t,o-2,1);return a.getFullYear()+"-"+String(a.getMonth()+1).padStart(2,"0")}function periodoLabel(e){const[t,o]=e.split("-");return mesesEs[parseInt(o,10)-1]+" "+t}function formatFecha(e){if(!e)return"-";const[t,o,a]=e.split("-");return`${a}-${o}-${t}`}function formatFechaLarga(e){return e?new Date(e+"T00:00:00").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"}):"-"}const MESES_CORTOS=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];function formatFechaCorta(e){if(!e)return{day:"-",month:""};const[t,o,a]=e.split("-");return{day:String(parseInt(a,10)),month:MESES_CORTOS[parseInt(o,10)-1]||""}}function formatUltimoAcceso(e){return e?new Date(e).toLocaleString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Sin actividad registrada"}function formatCLP(e){return"$"+e.toLocaleString("es-CL")}function linkWhatsApp(e,t){return`https://wa.me/${e.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(t)}`}let gastosComunes=[],tiposMulta=[],multas=[];function actualizarEstadosMorosidad(){if(!community.id)return;const e=hoyISO();gastosComunes.forEach(t=>{t.estado==="Pendiente"&&t.vencimiento<e&&(t.estado="Atrasado")})}function tieneGastosComunesAtrasados(e){const t=hoyISO();return gastosComunes.some(o=>o.depto===e&&(o.estado==="Atrasado"||o.estado==="Por confirmar"&&o.vencimiento<t))}async function generarCobroMensual(e,t){const o=periodoActual();let a=0;const i=refComunidadActual().collection("gastosComunes");for(const r of residentesDirectorio)gastosComunes.some(n=>n.depto===r.depto&&n.periodo===o)||(await i.add({depto:r.depto,periodo:o,monto:e,vencimiento:t,estado:"Pendiente",fechaPago:null,metodoPago:null,ts:Date.now()}),a++);return a>0&&crearNotificacion({icon:"💵",titulo:"Nuevo gasto común generado",meta:`${periodoLabel(o)} · Vence ${formatFecha(t)}`,paraTodos:!0}),a}async function marcarGastoPagado(e){const t=gastosComunes.find(o=>o.id===e);if(t){t.fechaPago=t.pagoInformado&&t.pagoInformado.fecha||hoyISO(),t.metodoPago=textoMetodoPago(t,"Registrado por administración"),t.estado="Pagado",renderAdmin();try{await refComunidadActual().collection("gastosComunes").doc(e).update({estado:"Pagado",fechaPago:t.fechaPago,metodoPago:t.metodoPago,confirmadoEn:Date.now()})}catch(o){console.error(o),showToast("No se pudo guardar el pago. Revisa tu conexión.");return}await registrarMovimientoContable({tipo:"Ingreso",categoria:"Gasto común",descripcion:`Gasto común depto ${t.depto} · ${periodoLabel(t.periodo)}`,monto:t.monto,fecha:t.fechaPago,origen:"Automático",depto:t.depto}),crearNotificacion({icon:"circle-check",titulo:"Pago de gasto común confirmado",meta:`${periodoLabel(t.periodo)} · ${formatCLP(t.monto)}`,depto:t.depto,paraTodos:!1}),showToast("Pago registrado para el depto "+t.depto)}}const METODOS_PAGO=["Transferencia","Depósito","Efectivo en conserjería","Otro"];function abrirInformarPago(e,t){const a=(e==="multa"?multas:gastosComunes).find(i=>i.id===t);a&&openModal("informarPago",{tipo:e,id:t,depto:a.depto,monto:a.monto,etiqueta:e==="multa"?"Multa: "+a.tipoMultaNombre:"Gasto común "+periodoLabel(a.periodo)})}function pagarGastoComun(e){abrirInformarPago("gasto",e)}function pagarMulta(e){abrirInformarPago("multa",e)}async function guardarPagoInformado(){const e=modalContext,t=document.getElementById("mPagoMetodo").value,o=document.getElementById("mPagoFecha").value,a=document.getElementById("mPagoReferencia").value.trim();if(!o){showToast("Indica la fecha en que pagaste");return}if(o>hoyISO()){showToast("La fecha de pago no puede ser futura");return}if(t!=="Efectivo en conserjería"&&!a){showToast("Indica el N° de operación o comprobante");return}const i=e.tipo==="multa"?"multas":"gastosComunes";closeModal();try{await refComunidadActual().collection(i).doc(e.id).update({estado:"Por confirmar",pagoInformado:{metodo:t,fecha:o,referencia:a,informadoEn:Date.now()}})}catch(r){console.error(r),showToast("No se pudo informar el pago. Revisa tu conexión.");return}crearNotificacion({icon:"💵",titulo:"Pago informado, por confirmar",meta:`Depto ${e.depto} · ${e.etiqueta} · ${formatCLP(e.monto)}`,depto:e.depto,paraTodos:!1}),showToast("Listo. Administración revisará tu pago y te avisará.")}function textoMetodoPago(e,t){const o=e&&e.pagoInformado;return o?o.metodo+(o.referencia?" · Op. "+o.referencia:""):t}async function rechazarPagoInformado(e,t){const a=(e==="multa"?multas:gastosComunes).find(s=>s.id===t);if(!a)return;const i=window.prompt("¿Por qué se rechaza este pago? (el residente verá este motivo)","No encontramos el pago en la cartola");if(i===null)return;const r=e==="multa"?"Pendiente":a.vencimiento<hoyISO()?"Atrasado":"Pendiente";try{await refComunidadActual().collection(e==="multa"?"multas":"gastosComunes").doc(t).update({estado:r,pagoInformado:null,pagoRechazado:{motivo:i.trim(),fecha:hoyISO(),ts:Date.now()}})}catch(s){console.error(s),showToast("No se pudo rechazar el pago. Revisa tu conexión.");return}crearNotificacion({icon:"triangle-alert",titulo:"Tu pago informado fue rechazado",meta:`${e==="multa"?"Multa":"Gasto común "+periodoLabel(a.periodo)} · ${i.trim()}`,depto:a.depto,paraTodos:!1}),showToast("Pago rechazado. Se avisó al departamento "+a.depto)}function renderPagosPorConfirmar(){const e=[...gastosComunes.filter(t=>t.estado==="Por confirmar").map(t=>({tipo:"gasto",x:t,etiqueta:"Gasto común "+periodoLabel(t.periodo)})),...multas.filter(t=>t.estado==="Por confirmar").map(t=>({tipo:"multa",x:t,etiqueta:"Multa: "+t.tipoMultaNombre}))].sort((t,o)=>((t.x.pagoInformado||{}).informadoEn||0)-((o.x.pagoInformado||{}).informadoEn||0));return e.length?`
        <div class="card" style="margin-bottom:20px;border:1px solid var(--accent)">
            <div class="card-header">
                <h3>${icon("💵")} Pagos informados por confirmar (${esc(e.length)})</h3>
            </div>
            <div class="card-body">
                ${e.map(t=>{const o=t.x.pagoInformado||{};return`
                        <div class="list-item" style="flex-wrap:wrap">
                            <div class="list-content" style="min-width:200px">
                                <div class="list-title">Depto ${esc(t.x.depto)} · ${esc(t.etiqueta)} · ${esc(formatCLP(t.x.monto))}</div>
                                <div class="list-meta">${esc(o.metodo||"—")} · pagado el ${esc(formatFecha(o.fecha))}${esc(o.referencia?" · Op. "+o.referencia:"")}</div>
                            </div>
                            <div style="display:flex;gap:6px;flex-wrap:wrap">
                                <button class="primary-btn" style="width:auto;padding:8px 14px" ${mcEvento("click", t.tipo==="multa"?"marcarMultaPagada":"marcarGastoPagado", t.x.id)}>
                                    Confirmar
                                </button>
                                <button class="outline-btn" ${mcEvento("click", "rechazarPagoInformado", t.tipo, t.x.id)}>
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    `}).join("")}
            </div>
        </div>
    `:""}let movimientosContables=[];async function registrarMovimientoContable(e){const t={fecha:e.fecha||hoyISO(),tipo:e.tipo,categoria:e.categoria,descripcion:e.descripcion,monto:e.monto,origen:e.origen||"Manual",ts:Date.now()};e.depto&&(t.depto=e.depto);try{await refComunidadActual().collection("movimientosContables").add(t)}catch(o){console.error(o),showToast("No se pudo registrar el movimiento contable. Revisa tu conexión.")}}let remuneraciones=[];async function generarNominaMensual(){const e=periodoActual(),t=conserjesDirectorio.filter(a=>!remuneraciones.some(i=>i.nombre===a.nombre&&i.periodo===e));let o=0;for(const a of t)try{await refComunidadActual().collection("remuneraciones").add({nombre:a.nombre,cargo:"Conserje",periodo:e,monto:a.sueldo,estado:"Pendiente",fechaPago:null,ts:Date.now()}),o++}catch(i){console.error(i),showToast("No se pudo generar la nómina completa. Revisa tu conexión.");break}return o}async function pagarRemuneracion(e){const t=remuneraciones.find(a=>a.id===e);if(!t)return;const o=hoyISO();try{await refComunidadActual().collection("remuneraciones").doc(e).update({estado:"Pagado",fechaPago:o})}catch(a){console.error(a),showToast("No se pudo registrar el pago. Revisa tu conexión.");return}await registrarMovimientoContable({tipo:"Egreso",categoria:"Remuneraciones",descripcion:`Sueldo ${t.nombre} (${t.cargo}) · ${periodoLabel(t.periodo)}`,monto:t.monto,fecha:o,origen:"Automático"}),showToast("Sueldo pagado a "+t.nombre),renderAdmin()}let proveedoresDirectorio=[],mantenciones=[];function actualizarEstadosMantencion(){if(!community.id)return;const e=hoyISO();mantenciones.forEach(t=>{t.estado==="Programada"&&t.fecha<e&&(t.estado="Atrasada")})}async function marcarMantencionRealizada(e){const t=mantenciones.find(a=>a.id===e);if(!t)return;const o=hoyISO();try{await refComunidadActual().collection("mantenciones").doc(e).update({estado:"Realizada",fechaRealizada:o})}catch(a){console.error(a),showToast("No se pudo actualizar la mantención. Revisa tu conexión.");return}await registrarMovimientoContable({tipo:"Egreso",categoria:"Proveedores",descripcion:`${t.tipo} · ${t.proveedor}`,monto:t.monto,fecha:o,origen:"Automático"}),showToast("Mantención marcada como realizada"),renderAdmin()}function mostrarErrorLogin(e){const t=document.getElementById("loginError");t.textContent=e,t.classList.remove("hidden")}function ocultarErrorLogin(){const e=document.getElementById("loginError");e.textContent="",e.classList.add("hidden")}async function login(){const e=document.getElementById("loginRut").value.trim(),t=document.getElementById("loginPassword").value,o=document.getElementById("loginBtn");if(ocultarErrorLogin(),!e||!validarRut(e)){mostrarErrorLogin("Ingresa un RUT válido.");return}if(!t){mostrarErrorLogin("Ingresa tu contraseña.");return}o.disabled=!0,o.textContent="Ingresando...";try{const a=await auth.signInWithEmailAndPassword(rutToEmail(e),t),r=(await a.user.getIdTokenResult(!0)).claims;if(!(r.app==="mi_comunidad"&&r.role&&(r.role==="superadmin"||r.comunidadId))){await auth.signOut(),mostrarErrorLogin("Esta cuenta no pertenece a Mi Comunidad.");return}currentUid=a.user.uid,currentRole=r.role,currentRole==="superadmin"?await iniciarSesionSuperAdmin():await iniciarSesionComunidad(r.comunidadId),document.getElementById("loginScreen").classList.add("hidden"),document.getElementById("app").classList.remove("hidden"),aplicarRolUI(),navigate(rolesConfig[currentRole].paginaInicial),actualizarContadorNotificaciones()}catch(a){console.error(a);let i="No se pudo iniciar sesión. Verifica tu RUT y contraseña.";a&&(a.code==="auth/user-not-found"||a.code==="auth/wrong-password"||a.code==="auth/invalid-credential")?i="RUT o contraseña incorrectos.":a&&a.code==="auth/too-many-requests"?i="Demasiados intentos. Intenta de nuevo en unos minutos.":a&&a.code==="mi-comunidad/comunidad-suspendida"?i=a.message:a&&a.code==="permission-denied"?i="Tu clave es correcta, pero Firebase bloqueó la lectura de los datos del edificio (reglas de seguridad de Firestore).":a&&String(a.code||"").startsWith("auth/api-key")?i="La configuración de Firebase (firebaseConfig) de esta página no es válida.":a&&a.code==="auth/network-request-failed"&&(i="No hay conexión con Firebase. Revisa tu internet.");const r=a&&(a.code||a.name)?a.code||a.name:"";r&&!["auth/user-not-found","auth/wrong-password","auth/invalid-credential"].includes(r)&&(i+=" (Código: "+r+(typeof pasoLogin<"u"&&pasoLogin?", paso: "+pasoLogin:"")+")"),mostrarErrorLogin(i)}finally{o.disabled=!1,o.textContent="Ingresar"}}const DEMO_USUARIOS={admin:{uid:"demo-admin",nombre:"Administración Los Robles",depto:"",telefono:"+56 2 2345 6789"},conserje:{uid:"demo-conserje-1",nombre:"Luis Gómez Tapia",depto:"",telefono:"+56 9 6111 2233"},residente:{uid:"demo-res-804",nombre:"Carolina Muñoz Soto",depto:"804",telefono:"+56 9 8765 4321"}};window.__demoCurrentUid=()=>currentUid;async function demoEntrar(e){const t=DEMO_USUARIOS[e];if(t){currentUid=t.uid,currentRole=e,profile.nombre=t.nombre,profile.depto=t.depto||profile.depto||"804",profile.telefono=t.telefono,profile.correo=e==="residente"?"carolina.munoz@ejemplo.cl":e==="admin"?"admin@losrobles.cl":"conserjeria@losrobles.cl";try{await iniciarSesionComunidad(DEMO_COMUNIDAD_ID)}catch(o){console.error(o),mostrarErrorLogin("No se pudo abrir la demo: "+(o&&o.message?o.message:o));return}document.getElementById("loginScreen").classList.add("hidden"),document.getElementById("app").classList.remove("hidden"),aplicarRolUI(),navigate(rolesConfig[currentRole].paginaInicial),actualizarContadorNotificaciones(),window.scrollTo(0,0)}}async function logout(e){detenerListenersComunidad(),detenerListenerComunidades();try{await auth.signOut()}catch(t){console.error(t)}currentRole=null,currentUid=null,residentesDirectorio.length=0,conserjesDirectorio.length=0,comunidadesDirectorio.length=0,document.getElementById("app").classList.add("hidden"),document.getElementById("loginScreen").classList.remove("hidden"),ocultarErrorLogin(),e||history.replaceState({mcSelector:!0},"",location.pathname)}let pasoLogin="";async function iniciarSesionComunidad(e){detenerListenersComunidad(),pasoLogin="comunidad";const t=db.collection(COMUNIDADES_COLLECTION).doc(e),o=await t.get();if(aplicarDatosComunidad(o),comunidadUnsub=t.onSnapshot(aplicarDatosComunidad,n=>console.error(n)),community.estado==="Suspendida"){await auth.signOut();const n=new Error("Esta comunidad tiene el servicio suspendido. Contacta a soporte para reactivarlo.");throw n.code="mi-comunidad/comunidad-suspendida",n}if(t.update({ultimoAcceso:Date.now()}).catch(n=>console.error(n)),currentRole==="residente"){pasoLogin="mi ficha de residente";const n=t.collection("residentes").doc(currentUid),c=await n.get();aplicarSnapshotResidentes(c),residentesUnsub=n.onSnapshot(aplicarSnapshotResidentes,w=>console.error(w))}else{pasoLogin="residentes";const n=t.collection("residentes"),c=await n.get();aplicarSnapshotResidentes(c),residentesUnsub=n.onSnapshot(aplicarSnapshotResidentes,N=>console.error(N)),pasoLogin="conserjes";const w=t.collection("conserjes"),$=await w.get();aplicarSnapshotConserjes($),conserjesUnsub=w.onSnapshot(aplicarSnapshotConserjes,N=>console.error(N))}currentRole==="admin"&&residentesDirectorio.some(n=>n.respuestaSecreta)&&functions.httpsCallable("migrarRespuestasSecretasMiComunidad")({comunidadId:e}).then(n=>console.log("Respuestas secretas migradas:",n&&n.data?n.data.migradas:0)).catch(n=>console.error("No se pudieron migrar las respuestas secretas:",n));const a=[{nombre:"visitas",array:visitas,setUnsub:n=>visitasUnsub=n,filtraPorDepto:!0},{nombre:"visitasProgramadas",array:visitasProgramadas,setUnsub:n=>visitasProgramadasUnsub=n,filtraPorDepto:!0},{nombre:"vehiculos",array:vehiculos,setUnsub:n=>vehiculosUnsub=n,filtraPorDepto:!0},{nombre:"encomiendas",array:encomiendas,setUnsub:n=>encomiendasUnsub=n,filtraPorDepto:!0},{nombre:"reservas",array:reservas,setUnsub:n=>reservasUnsub=n,filtraPorDepto:!0},{nombre:"bloquesReserva",array:bloquesReserva,setUnsub:n=>bloquesReservaUnsub=n},{nombre:"bloquesOcupados",array:bloquesOcupados,setUnsub:n=>bloquesOcupadosUnsub=n},{nombre:"gastosComunes",array:gastosComunes,setUnsub:n=>gastosComunesUnsub=n,filtraPorDepto:!0},{nombre:"tiposMulta",array:tiposMulta,setUnsub:n=>tiposMultaUnsub=n},{nombre:"multas",array:multas,setUnsub:n=>multasUnsub=n,filtraPorDepto:!0},{nombre:"avisos",array:avisos,setUnsub:n=>avisosUnsub=n},{nombre:"incidencias",array:incidencias,setUnsub:n=>incidenciasUnsub=n},{nombre:"documentos",array:documentos,setUnsub:n=>documentosUnsub=n},{nombre:"movimientosContables",array:movimientosContables,setUnsub:n=>movimientosContablesUnsub=n},{nombre:"remuneraciones",array:remuneraciones,setUnsub:n=>remuneracionesUnsub=n},{nombre:"proveedoresDirectorio",array:proveedoresDirectorio,setUnsub:n=>proveedoresDirectorioUnsub=n},{nombre:"mantenciones",array:mantenciones,setUnsub:n=>mantencionesUnsub=n},{nombre:"vehiculosRegistrados",array:vehiculosRegistrados,setUnsub:n=>vehiculosRegistradosUnsub=n},{nombre:"accesos",array:accesos,setUnsub:n=>accesosUnsub=n}],i=["visitas","vehiculos","accesos"],r=Date.now()-DIAS_HISTORIAL*864e5;for(const n of a){if(n.nombre==="gastosComunes"&&currentRole==="conserje")continue;let c=t.collection(n.nombre);n.filtraPorDepto&&currentRole==="residente"?c=c.where("depto","==",profile.depto):i.includes(n.nombre)&&(c=c.where("ts",">=",r));try{const w=await c.get();aplicarSnapshotModulo(n.array,w),n.setUnsub(c.onSnapshot($=>aplicarSnapshotModulo(n.array,$),$=>console.error($)))}catch(w){console.error(`No se pudo cargar "${n.nombre}":`,w)}}const s=t.collection("notificaciones");try{if(currentRole==="residente"){const n=s.where("paraTodos","==",!0),c=s.where("depto","==",profile.depto),[w,$]=await Promise.all([n.get(),c.get()]);aplicarSnapshotNotifParaTodos(w),aplicarSnapshotNotifDepto($),notificacionesUnsub=n.onSnapshot(aplicarSnapshotNotifParaTodos,N=>console.error(N)),notificacionesDeptoUnsub=c.onSnapshot(aplicarSnapshotNotifDepto,N=>console.error(N))}else{const n=s.where("ts",">=",r),c=await n.get();aplicarSnapshotNotificaciones(c),notificacionesUnsub=n.onSnapshot(aplicarSnapshotNotificaciones,w=>console.error(w))}}catch(n){console.error("No se pudieron cargar las notificaciones:",n)}}function detenerListenersComunidad(){comunidadUnsub&&(comunidadUnsub(),comunidadUnsub=null),residentesUnsub&&(residentesUnsub(),residentesUnsub=null),conserjesUnsub&&(conserjesUnsub(),conserjesUnsub=null),visitasUnsub&&(visitasUnsub(),visitasUnsub=null),visitasProgramadasUnsub&&(visitasProgramadasUnsub(),visitasProgramadasUnsub=null),vehiculosUnsub&&(vehiculosUnsub(),vehiculosUnsub=null),encomiendasUnsub&&(encomiendasUnsub(),encomiendasUnsub=null),reservasUnsub&&(reservasUnsub(),reservasUnsub=null),bloquesReservaUnsub&&(bloquesReservaUnsub(),bloquesReservaUnsub=null),bloquesOcupadosUnsub&&(bloquesOcupadosUnsub(),bloquesOcupadosUnsub=null),gastosComunesUnsub&&(gastosComunesUnsub(),gastosComunesUnsub=null),tiposMultaUnsub&&(tiposMultaUnsub(),tiposMultaUnsub=null),multasUnsub&&(multasUnsub(),multasUnsub=null),avisosUnsub&&(avisosUnsub(),avisosUnsub=null),incidenciasUnsub&&(incidenciasUnsub(),incidenciasUnsub=null),documentosUnsub&&(documentosUnsub(),documentosUnsub=null),movimientosContablesUnsub&&(movimientosContablesUnsub(),movimientosContablesUnsub=null),remuneracionesUnsub&&(remuneracionesUnsub(),remuneracionesUnsub=null),proveedoresDirectorioUnsub&&(proveedoresDirectorioUnsub(),proveedoresDirectorioUnsub=null),mantencionesUnsub&&(mantencionesUnsub(),mantencionesUnsub=null),vehiculosRegistradosUnsub&&(vehiculosRegistradosUnsub(),vehiculosRegistradosUnsub=null),accesosUnsub&&(accesosUnsub(),accesosUnsub=null),notificacionesUnsub&&(notificacionesUnsub(),notificacionesUnsub=null),notificacionesDeptoUnsub&&(notificacionesDeptoUnsub(),notificacionesDeptoUnsub=null),visitas.length=0,visitasProgramadas.length=0,vehiculos.length=0,encomiendas.length=0,reservas.length=0,bloquesReserva.length=0,bloquesOcupados.length=0,gastosComunes.length=0,tiposMulta.length=0,multas.length=0,avisos.length=0,incidencias.length=0,documentos.length=0,movimientosContables.length=0,remuneraciones.length=0,proveedoresDirectorio.length=0,mantenciones.length=0,vehiculosRegistrados.length=0,accesos.length=0,notificaciones.length=0,notifParaTodosCache.length=0,notifDeptoCache.length=0}function aplicarSnapshotModulo(e,t){e.length=0,t.forEach(o=>{e.push(Object.assign({id:o.id},o.data()))}),e.sort((o,a)=>(a.ts||0)-(o.ts||0)),actualizarEstadosMorosidad(),actualizarEstadosMantencion(),rerenderSiAppVisible()}function refComunidadActual(){return db.collection(COMUNIDADES_COLLECTION).doc(community.id)}async function iniciarSesionSuperAdmin(){detenerListenerComunidades();const e=db.collection(COMUNIDADES_COLLECTION),t=await e.get();aplicarSnapshotComunidades(t),comunidadesUnsub=e.onSnapshot(aplicarSnapshotComunidades,a=>console.error(a));const o=document.querySelector(".top-title");o&&(o.textContent="Mi Comunidad · Plataforma")}function detenerListenerComunidades(){comunidadesUnsub&&(comunidadesUnsub(),comunidadesUnsub=null)}function aplicarSnapshotComunidades(e){comunidadesDirectorio.length=0,e.forEach(t=>{comunidadesDirectorio.push(Object.assign({id:t.id},t.data()))}),rerenderSiAppVisible()}function aplicarDatosComunidad(e){if(!e.exists)return;const t=e.data();community.id=e.id,community.name=t.name||"",community.address=t.address||"",community.apartments=t.apartments||0,community.residents=t.residents||0,community.telefonoAdministracion=t.telefonoAdministracion||"",community.estado=t.estado||"Activa",community.plan=t.plan||"",community.fechaContratacion=t.fechaContratacion||"",community.notasSoporte=t.notasSoporte||"",community.numResidentes=t.numResidentes||0,community.numConserjes=t.numConserjes||0,community.adminNombre=t.adminNombre||"",community.ultimoAcceso=t.ultimoAcceso||null;const o=document.querySelector(".top-title");o&&(o.textContent=community.name)}let rerenderProgramado=null;function rerenderSiAppVisible(){rerenderProgramado||(rerenderProgramado=setTimeout(()=>{rerenderProgramado=null;const e=document.getElementById("app");e&&!e.classList.contains("hidden")&&currentRole&&navigate(currentPage)},60))}function aplicarSnapshotResidentes(e){residentesDirectorio.length=0,typeof e.forEach=="function"?e.forEach(t=>{residentesDirectorio.push(Object.assign({uid:t.id},t.data()))}):e.exists&&residentesDirectorio.push(Object.assign({uid:e.id},e.data())),sincronizarProfileConResidente(),rerenderSiAppVisible()}function sincronizarProfileConResidente(){if(currentRole!=="residente"||!currentUid)return;const e=residentesDirectorio.find(t=>t.uid===currentUid);e&&(profile.depto=e.depto,profile.nombre=e.nombre,profile.telefono=e.telefono)}function aplicarSnapshotConserjes(e){conserjesDirectorio.length=0,e.forEach(t=>{conserjesDirectorio.push(Object.assign({uid:t.id},t.data()))}),rerenderSiAppVisible()}function residenteDocRef(e){return db.collection(COMUNIDADES_COLLECTION).doc(community.id).collection("residentes").doc(e.uid)}async function restablecerClave(e,t){const o=window.prompt(`Nueva contraseña para ${t} (mínimo 6 caracteres):`);if(o){if(o.length<6){showToast("La contraseña debe tener al menos 6 caracteres");return}try{await functions.httpsCallable("restablecerClaveMiComunidad")({comunidadId:community.id,uid:e,nuevaClave:o}),showToast(`Contraseña de ${t} actualizada correctamente`)}catch(a){console.error(a),showToast("No se pudo restablecer la contraseña: "+(a&&a.message?a.message:"error desconocido"))}}}async function guardarDatosPropiedad(e){const t=residentesDirectorio.find(r=>r.uid===e);if(!t)return;const o=document.getElementById("mFichaDueno").value.trim(),a=document.getElementById("mFichaArrendatario").value.trim(),i=document.getElementById("mFichaAirbnb").checked;t.nombreDueno=o,t.nombreArrendatario=a,t.esAirbnb=i,openModal("detalleResidente",t);try{await residenteDocRef(t).update({nombreDueno:o,nombreArrendatario:a,esAirbnb:i}),showToast("Datos de la propiedad guardados")}catch(r){console.error(r),showToast("No se pudo guardar. Revisa tu conexión.")}}function aplicarRolUI(){const e=rolesConfig[currentRole];document.getElementById("topSubtitle").textContent="Vista: "+e.label,document.getElementById("topAvatar").textContent=e.avatar;const t=document.getElementById("temaToggleBtn");t&&t.classList.toggle("hidden",currentRole!=="conserje"),currentRole==="conserje"&&sugerirTemaNocturno(),renderSidebar(),renderMobileNav()}function renderSidebar(){const e=rolesConfig[currentRole];let t="";e.menu.forEach(o=>{t+=`<div class="menu-label">${esc(o.label)}</div>`,o.items.forEach(a=>{t+=`
                <button class="menu-item${esc(a.page===currentPage?" active":"")}"
                        data-page="${esc(a.page)}"
                        ${mcEvento("click", "navigate", a.page)}>
                    ${icon(a.icon)}
                    <span>${esc(a.label)}</span>
                </button>`})}),t+=`
        <div style="margin-top:30px">
            <button class="menu-item" ${mcEvento("click", "logout")}>
                ${icon("log-out")}
                <span>Cambiar de vista</span>
            </button>
        </div>`,document.getElementById("sidebarMenu").innerHTML=t}function renderMobileNav(){const e=rolesConfig[currentRole];let t="";e.mobile.forEach(o=>{t+=`
            <button data-page="${esc(o.page)}"
                    class="${esc(o.page===currentPage?"active":"")}"
                    ${mcEvento("click", "navigate", o.page)}>
                <span>${icon(o.icon)}</span>
                ${esc(o.label)}
            </button>`}),document.getElementById("mobileNavMenu").innerHTML=t}function navigate(e,t){const o=rolesConfig[currentRole];o.paginas.includes(e)||(e=o.paginaInicial),currentPage=e;const a=history.state&&history.state.mcPage===e&&history.state.mcRole===currentRole;!t&&!a&&history.pushState({mcPage:e,mcRole:currentRole},"","#"+e),renderSidebar(),renderMobileNav();const i={inicio:renderHome,avisos:renderAvisos,solicitudes:renderSolicitudes,encomiendas:renderEncomiendas,reservas:renderReservas,documentos:renderDocumentos,perfil:renderPerfil,gastoscomunes:renderGastosComunes,admin:renderAdmin,conserjeria:renderConserjeria,comunidades:renderComunidades};i[e]&&i[e](),window.scrollTo({top:0,behavior:"smooth"})}function renderActividadReciente(){const e=[];avisos[0]&&e.push({icon:categoriaAvisoConfig[avisos[0].categoria].icon,title:avisos[0].title,meta:`${fechaRegistro(avisos[0],"date")} · ${avisos[0].meta}`,badge:categoriaAvisoConfig[avisos[0].categoria].badge,badgeText:avisos[0].categoria});const t=encomiendas.find(i=>i.depto===profile.depto&&i.estado!=="Entregado");t&&e.push({icon:"📦",title:"Tienes una encomienda",meta:`${fechaRegistro(t,"date")} · Conserjería`,badge:"badge-green",badgeText:"Disponible"});const o=incidencias.filter(i=>i.depto===profile.depto).slice(-1)[0];o&&e.push({icon:"🔧",title:o.categoria,meta:`${o.fecha} · Solicitud #${o.id}`,badge:estadoBadge[o.estado],badgeText:o.estado});const a=visitas.find(i=>i.depto===profile.depto);return a&&e.push({icon:"🚶",title:"Visita: "+a.nombre,meta:`${fechaRegistro(a,"fecha")} ${a.hora||""} · Registrado por conserjería`,badge:a.restringido?"badge-red":"badge-green",badgeText:a.restringido?"Restringido":"Ingresó"}),e.length?e.map(i=>`
        <div class="list-item">
            <div class="list-icon">
                ${icon(i.icon)}
            </div>
            <div class="list-content">
                <div class="list-title">
                    ${esc(i.title)}
                </div>
                <div class="list-meta">
                    ${esc(i.meta)}
                </div>
            </div>
            <span class="badge ${esc(i.badge)}">
                ${esc(i.badgeText)}
            </span>
        </div>
    `).join(""):`
            <div class="empty">
                <div class="empty-icon">${icon("📋")}</div>
                <p>
                    Sin actividad reciente todavía.
                </p>
            </div>
        `}function diasHasta(e){if(!e)return null;const t=new Date(hoyISO()+"T00:00:00"),o=new Date(e+"T00:00:00");return Math.round((o-t)/864e5)}function renderHome(){actualizarEstadosMorosidad();const e=profile.depto,t=hoyISO(),o=gastosComunes.find(C=>C.depto===e&&C.periodo===periodoActual()),a=gastosComunes.filter(C=>C.depto===e&&C.periodo!==periodoActual()&&C.estado!=="Pagado"&&(C.estado==="Atrasado"||C.vencimiento<t)),i=encomiendas.filter(C=>C.depto===e&&C.estado!=="Entregado").sort((C,j)=>(j.ts||0)-(C.ts||0)),r=reservas.filter(C=>C.depto===e&&C.fecha>=t),s=visitasProgramadas.filter(C=>C.depto===e&&C.estado==="Pendiente"),n=incidencias.filter(C=>C.depto===e&&C.estado!=="Resuelto");let c;if(!o)c=`
            <div class="rc-monto">Sin cobro</div>
            <div class="hm-vence">Administración aún no genera el gasto común de este mes.</div>
        `;else{const C=diasHasta(o.vencimiento);let j="";o.estado==="Pagado"?j="Pagado el "+formatFecha(o.fechaPago):o.estado==="Por confirmar"?j="Informaste tu pago. Administración lo está revisando.":C<0?j="Venció el "+formatFechaLarga(o.vencimiento):C===0?j="Vence hoy":j="Vence el "+formatFechaLarga(o.vencimiento)+(C<=10?" (en "+C+(C===1?" día)":" días)"):"");const X=o.estado==="Pendiente"||o.estado==="Atrasado";c=`
            <div class="rc-monto">${esc(formatCLP(o.monto))}</div>
            <div class="hm-vence ${esc(o.estado==="Atrasado"||C!==null&&C<0&&o.estado!=="Pagado"?"is-late":"")}">${esc(j)}</div>
            ${o.pagoRechazado&&X?`
                <div class="hm-alerta">Tu último pago informado fue rechazado: ${esc(o.pagoRechazado.motivo)}</div>
            `:""}
            ${o.estado==="Pagado"&&!a.length?`<div class="hm-ok">${icon("circle-check")} Estás al día. Gracias.</div>`:""}
            <div class="hm-cta">
                ${X?`<button class="primary-btn" ${mcEvento("click", "abrirInformarPago", 'gasto', o.id)}>Informar pago</button>`:""}
                <button class="db-link" ${mcEvento("click", "navigate", 'gastoscomunes')}>Ver historial</button>
            </div>
        `}a.length&&(c+=`
            <div class="hm-alerta">
                Tienes ${esc(a.length===1?"un mes anterior":a.length+" meses anteriores")} sin pagar
                por ${esc(formatCLP(sumaMontos(a)))}. Mientras tanto no puedes reservar espacios comunes.
            </div>
        `);const w=i.length?i.slice(0,3).map(C=>`
        <div class="hm-enc-item">
            <span class="hm-enc-ic">${icon("package")}</span>
            <div class="pk-info">
                <strong>${esc(C.title)}</strong>
                <small>Llegó ${esc(haceCuanto(C.ts))}${esc(C.destinatario?", para "+C.destinatario:"")}</small>
            </div>
            <button class="outline-btn" ${mcEvento("click", "abrirCodigoEncomienda", C.id)}>${icon("qr-code")} Mostrar QR</button>
        </div>
    `).join(""):'<div class="fx-vacio">No tienes encomiendas esperando en conserjería.</div>',$=avisos.length?avisos.slice(0,3).map(C=>{const j=categoriaAvisoConfig[C.categoria]||categoriaAvisoConfig.General;return`
            <div class="av-item">
                <div class="av-meta"><span class="badge ${esc(j.badge)}">${esc(C.categoria)}</span> ${esc(fechaRegistro(C,"date"))}</div>
                <strong>${esc(C.title)}</strong>
                <p>${esc(C.description)}</p>
            </div>
        `}).join(""):'<div class="fx-vacio">No hay avisos de la administración.</div>',H=[...r.map(C=>({fecha:C.fecha,titulo:C.lugar,detalle:"Reserva, "+C.hora,orden:C.fecha+C.hora})),...s.map(C=>({fecha:C.fecha,titulo:C.nombre,detalle:"Visita avisada"+(C.hora?", "+C.hora:""),orden:C.fecha+(C.hora||"")}))].sort((C,j)=>C.orden.localeCompare(j.orden)).slice(0,4).map(C=>{const j=new Date(C.fecha+"T00:00:00");return`
            <div class="lv-item">
                <div class="lv-fecha"><b>${esc(j.getDate())}</b><span>${esc(j.toLocaleDateString("es-CL",{month:"short"}).replace(".",""))}</span></div>
                <div><strong>${esc(C.titulo)}</strong><small>${esc(C.detalle)}</small></div>
            </div>
        `}).join(""),_=n.map(C=>`
        <div class="lv-item">
            <div class="lv-fecha"><b>${icon("wrench")}</b></div>
            <div><strong>${esc(C.categoria)}</strong><small>Solicitud ${esc(C.estado==="En proceso"?"en proceso":"recibida")}, #${esc(folioCorto(C.id))}</small></div>
        </div>
    `).join("");document.getElementById("content").innerHTML=`
        <div class="pg-top">
            <div>
                <h1 class="pg-h1">Hola, ${esc(profile.nombre.split(" ")[0])}</h1>
                <p class="pg-sub">Departamento ${esc(e)}, ${esc(community.name)}</p>
            </div>
        </div>
        <div class="hm-grid">
            <section class="db-panel hm-gasto">
                <header class="db-head">
                    <h3>Gasto común de ${esc(periodoLabel(periodoActual()))}</h3>
                    ${o?`<span class="badge ${esc({Pagado:"badge-green",Pendiente:"badge-yellow",Atrasado:"badge-red","Por confirmar":"badge-blue"}[o.estado]||"badge-yellow")}">${esc(o.estado)}</span>`:""}
                </header>
                ${c}
            </section>
            <section class="db-panel">
                <header class="db-head">
                    <h3>Tus encomiendas <span class="db-count">${esc(i.length)}</span></h3>
                    <button class="db-link" ${mcEvento("click", "navigate", 'encomiendas')}>Ver todas</button>
                </header>
                ${w}
            </section>
        </div>
        <div class="hm-acciones">
            <button class="hm-acc" ${mcEvento("click", "mcInvitar")}>
                <span class="cj-ic">${icon("users")}</span><strong>Avisar una visita</strong>
            </button>
            <button class="hm-acc" ${mcEvento("click", "navigate", 'reservas')}>
                <span class="cj-ic">${icon("calendar")}</span><strong>Reservar un espacio</strong>
            </button>
            <button class="hm-acc" ${mcEvento("click", "openRequestModal")}>
                <span class="cj-ic">${icon("wrench")}</span><strong>Reportar un problema</strong>
            </button>
            <button class="hm-acc" ${mcEvento("click", "navigate", 'documentos')}>
                <span class="cj-ic">${icon("file-text")}</span><strong>Reglamento y documentos</strong>
            </button>
        </div>
        <div class="hm-grid">
            <section class="db-panel">
                <header class="db-head">
                    <h3>Avisos de la administración</h3>
                    <button class="db-link" ${mcEvento("click", "navigate", 'avisos')}>Ver todos</button>
                </header>
                ${$}
            </section>
            <section class="db-panel">
                <header class="db-head">
                    <h3>Lo que viene</h3>
                </header>
                ${H||_?H+_:'<div class="fx-vacio">No tienes reservas, visitas avisadas ni solicitudes en curso.</div>'}
            </section>
        </div>
    `}let avisoFiltro="Todos";function setAvisoFiltro(e){avisoFiltro=e,renderAvisos()}function renderAvisos(){let t=(avisoFiltro==="Todos"?avisos:avisos.filter(i=>i.categoria===avisoFiltro)).map(i=>`
        <div class="list-item">
            <div class="list-icon">
                ${esc(categoriaAvisoConfig[i.categoria].icon)}
            </div>
            <div class="list-content">
                <div class="list-title">
                    ${esc(i.title)}
                </div>
                <div class="list-meta">
                    ${esc(fechaRegistro(i,"date"))} · ${esc(i.meta)}
                </div>
                <p style="margin-top:8px;font-size:13px;color:var(--muted);line-height:1.5">
                    ${esc(i.description)}
                </p>
            </div>
            <span class="badge ${esc(categoriaAvisoConfig[i.categoria].badge)}">
                ${esc(i.categoria)}
            </span>
        </div>
    `).join("");t||(t=`
            <div class="empty">
                <div class="empty-icon">${icon("📢")}</div>
                <p>
                    Todavía no hay avisos en esta categoría.
                </p>
            </div>
        `);const a=["Todos","Importante","Mantención","General"].map(i=>`
        <button class="admin-tab ${esc(avisoFiltro===i?"active":"")}"
                ${mcEvento("click", "setAvisoFiltro", i)}>
            ${esc(i)}
        </button>
    `).join("");document.getElementById("content").innerHTML=`
        <div class="page-header">
            <div>
                <h1>Avisos</h1>
                <p>
                    Información y comunicaciones de la administración.
                </p>
            </div>
            ${currentRole==="admin"?`
                <button class="outline-btn"
                        ${mcEvento("click", "openAvisoModal")}>
                    + Nuevo aviso
                </button>
            `:""}
        </div>
        <div class="admin-tabs">
            ${a}
        </div>
        <div class="card">
            <div class="card-body">
                ${t}
            </div>
        </div>
    `}const estadoBadge={Pendiente:"badge-yellow","En proceso":"badge-blue",Resuelto:"badge-green"};function renderSolicitudes(){let t=incidencias.filter(o=>o.depto===profile.depto).map(o=>`
        <div class="list-item">
            <div class="list-icon">${icon("🔧")}</div>
            <div class="list-content">
                <div class="list-title">
                    ${esc(o.categoria)}
                </div>
                <div class="list-meta">
                    Solicitud #${esc(folioCorto(o.id))}
                    · ${esc(o.fecha)} ${esc(o.hora)}
                </div>
                <div style="
                    margin-top:7px;
                    font-size:12px;
                    color:#6d7977;
                ">
                    ${esc(o.descripcion)}
                </div>
            </div>
            <span class="badge ${esc(estadoBadge[o.estado])}">
                ${esc(o.estado)}
            </span>
        </div>
    `).join("");t||(t=`
            <div class="empty">
                <div class="empty-icon">${icon("🔧")}</div>
                <p>
                    Aún no has hecho ninguna solicitud. Cuando reportes algo, va a aparecer aquí.
                </p>
            </div>
        `),document.getElementById("content").innerHTML=`
        <div class="page-header">
            <div>
                <h1>Mis solicitudes</h1>
                <p>
                    Reporta problemas y revisa su estado.
                </p>
            </div>
            <button class="outline-btn"
                    ${mcEvento("click", "openRequestModal")}>
                + Nueva solicitud
            </button>
        </div>
        <div class="card">
            <div class="card-header">
                <h3>
                    Solicitudes
                </h3>
            </div>
            <div class="card-body">
                ${t}
            </div>
        </div>
    `}function renderEncomiendas(){let t=(currentRole==="residente"?encomiendas.filter(o=>o.depto===profile.depto):encomiendas).map(o=>{const a=o.estado==="En proceso de entrega",i=o.estado==="Entregado";let r="";return i?r=`
                <div class="parcel-footer" style="justify-content:space-between">
                    <span style="font-size:12px;color:var(--muted)">
                        Retirado por ${esc(o.retiradoPor?o.retiradoPor.nombre+" ("+o.retiradoPor.relacion+")":"-")}
                    </span>
                </div>
            `:currentRole==="residente"?r=`
                <div class="parcel-footer">
                    <button class="outline-btn" ${mcEvento("click", "abrirCodigoEncomienda", o.id)}>
                        ${icon("qr-code")} Mostrar código
                    </button>
                </div>
            `:a?r=`
                <div class="parcel-footer">
                    <span style="font-size:12px;color:var(--muted)">Retiro en proceso…</span>
                </div>
            `:r=`
                <div class="parcel-footer">
                    <button class="outline-btn" ${mcEvento("click", "confirmarRetiroDesdeItem", o.id)}>
                        Confirmar retiro
                    </button>
                </div>
            `,`
        <div class="parcel-card">
            <div class="parcel-top">
                <div class="list-icon">${icon("package")}</div>
                <div class="list-content">
                    <div class="list-title">
                        ${esc(o.title)}
                    </div>
                    <div class="list-meta">
                        ${esc(o.destinatario?o.destinatario+" · ":"")}Depto ${esc(o.depto)} · ${esc(fechaRegistro(o,"date"))} · ${esc(o.time)}${esc(o.codigo?" · "+o.codigo:"")}
                    </div>
                </div>
            </div>
            <div class="parcel-tracker">
                <div class="parcel-dot is-done">${icon("circle-check")}</div>
                <div class="parcel-line ${esc(a||i?"is-done":"")}"></div>
                <div class="parcel-dot ${esc(a||i?"is-done":"")}">${a||i?icon("circle-check"):""}</div>
                <div class="parcel-line ${esc(i?"is-done":"")}"></div>
                <div class="parcel-dot ${esc(i?"is-done":"")}">${i?icon("circle-check"):""}</div>
            </div>
            <div class="parcel-labels">
                <span class="is-done">Recibido</span>
                <span class="${esc(a||i?"is-done":"")}">En proceso</span>
                <span class="${esc(i?"is-done":"")}">Entregado</span>
            </div>
            ${r}
        </div>
    `}).join("");t||(t=`
            <div class="empty">
                <div class="empty-icon">${icon("📦")}</div>
                <p>
                    ${esc(currentRole==="residente"?"Todavía no te ha llegado ninguna encomienda. Te avisamos apenas conserjería reciba algo para ti.":"Todavía no se ha registrado ninguna encomienda.")}
                </p>
            </div>
        `),document.getElementById("content").innerHTML=`
        <div class="page-header">
            <div>
                <h1>Encomiendas</h1>
                <p>
                    Revisa las entregas recibidas por conserjería.
                </p>
            </div>
            ${currentRole!=="residente"?`
                    <button class="outline-btn" style="width:auto" ${mcEvento("click", "abrirBuscarEncomienda")}>
                        ${icon("search")} Buscar encomienda
                    </button>
                `:""}
        </div>
        <div class="card">
            <div class="card-body">
                ${t}
            </div>
        </div>
    `}function abrirCodigoEncomienda(e){const t=encomiendas.find(o=>o.id===e);t&&openModal("mostrarCodigoEncomienda",t)}function confirmarRetiroDesdeItem(e){const t=encomiendas.find(o=>o.id===e);!t||t.estado!=="Recibido"||(openModal("confirmarRetiro"),iniciarProcesoEntrega(t))}function renderReservas(){const e=currentRole==="residente",t=currentRole==="admin",o=currentRole==="conserje";document.getElementById("content").innerHTML=`
        <div class="page-header">
            <div>
                <h1>Reservas</h1>
                <p>
                    ${esc(e?"Reserva los espacios comunes del edificio.":"Espacios comunes reservados por los residentes.")}
                </p>
            </div>
        </div>
        ${e?`
                <div class="section-grid">
                    <div class="action-card">
                        <div class="action-card-icon">${icon("🍖")}</div>
                        <h3>
                            Quincho
                        </h3>
                        <p>
                            Reserva el quincho para reuniones
                            familiares o sociales.
                        </p>
                        <button class="outline-btn"
                                ${mcEvento("click", "openReservaModal", 'Quincho', '🍖')}>
                            Reservar
                        </button>
                    </div>
                    <div class="action-card">
                        <div class="action-card-icon">${icon("🎉")}</div>
                        <h3>
                            Centro de eventos
                        </h3>
                        <p>
                            Espacio para celebraciones
                            y actividades.
                        </p>
                        <button class="outline-btn"
                                ${mcEvento("click", "openReservaModal", 'Centro de eventos', '🎉')}>
                            Reservar
                        </button>
                    </div>
                    <div class="action-card">
                        <div class="action-card-icon">${icon("🏊")}</div>
                        <h3>
                            Piscina
                        </h3>
                        <p>
                            Reserva un horario para
                            uso de la piscina.
                        </p>
                        <button class="outline-btn"
                                ${mcEvento("click", "openReservaModal", 'Piscina', '🏊')}>
                            Reservar
                        </button>
                    </div>
                    <div class="action-card">
                        <div class="action-card-icon">${icon("🏋️")}</div>
                        <h3>
                            Gimnasio
                        </h3>
                        <p>
                            Consulta disponibilidad
                            y horarios.
                        </p>
                        <button class="outline-btn"
                                ${mcEvento("click", "openReservaModal", 'Gimnasio', '🏋️')}>
                            Reservar
                        </button>
                    </div>
                </div>
            `:""}
        ${t?renderBloquesAdminSection():""}
        ${t||o?renderDisponibilidadSection():""}
        <div style="margin-top:25px">
            <div class="card">
                <div class="card-header">
                    <h3>
                        ${esc(e?"Mis próximas reservas":"Reservas del edificio")}
                    </h3>
                </div>
                <div class="card-body">
                    ${renderReservasList()}
                </div>
            </div>
        </div>
    `,(t||o)&&actualizarDisponibilidadPanel()}function renderBloquesAdminSection(){return`
        <div class="card" style="margin-bottom:20px">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
                <h3>Bloques horarios por espacio</h3>
                <button class="outline-btn" style="width:auto" ${mcEvento("click", "abrirModalBloque")}>
                    + Nuevo bloque
                </button>
            </div>
            <div class="card-body">
                ${LUGARES_RESERVABLES.map(e=>renderBloquesDeLugarAdmin(e.lugar,e.icon)).join("")}
            </div>
        </div>
    `}function renderBloquesDeLugarAdmin(e,t){const o=bloquesReserva.filter(a=>a.lugar===e);return`
        <div style="margin-bottom:18px">
            <h4 style="font-size:14px;margin-bottom:8px">${icon(t)} ${esc(e)}</h4>
            ${o.length?o.map(a=>`
                    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
                        <div style="flex:1">
                            <strong>${esc(a.nombre)}</strong>
                            <span style="font-size:12px;color:var(--muted)"> · ${esc(a.horaInicio)} - ${esc(a.horaFin)}</span>
                        </div>
                        <span class="badge ${esc(a.activo===!1?"badge-red":"badge-green")}">
                            ${esc(a.activo===!1?"Inactivo":"Activo")}
                        </span>
                        <button class="outline-btn" style="padding:4px 8px;font-size:12px"
                                ${mcEvento("click", "toggleActivoBloque", a.id)}>
                            ${esc(a.activo===!1?"Activar":"Desactivar")}
                        </button>
                        <button class="outline-btn" style="padding:4px 8px;font-size:12px;color:var(--danger);border-color:var(--danger)"
                                ${mcEvento("click", "eliminarBloque", a.id)}>
                            Eliminar
                        </button>
                    </div>
                `).join(""):'<p style="font-size:13px;color:var(--muted)">Sin bloques configurados todavía.</p>'}
        </div>
    `}function abrirModalBloque(){openModal("bloqueReserva")}async function toggleActivoBloque(e){const t=bloquesReserva.find(o=>o.id===e);if(t)try{await refComunidadActual().collection("bloquesReserva").doc(e).update({activo:t.activo===!1})}catch(o){console.error(o),showToast("No se pudo actualizar el bloque. Revisa tu conexión.")}}async function eliminarBloque(e){if(window.confirm("¿Eliminar este bloque horario? Las reservas ya hechas sobre él no se eliminan ni se ven afectadas."))try{await refComunidadActual().collection("bloquesReserva").doc(e).delete(),showToast("Bloque eliminado")}catch(t){console.error(t),showToast("No se pudo eliminar el bloque. Revisa tu conexión.")}}function renderDisponibilidadSection(){return`
        <div class="card" style="margin-bottom:20px">
            <div class="card-header">
                <h3>Disponibilidad</h3>
            </div>
            <div class="card-body">
                <p style="font-size:13px;color:var(--muted);margin-bottom:12px">
                    Para responder al tiro cuando alguien pregunta si hay un espacio disponible - lo mismo que ve un residente al reservar.
                </p>
                <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
                    <select id="mDisponibilidadLugar" class="form-control" style="max-width:220px" ${mcEvento("change", "actualizarDisponibilidadPanel")}>
                        <!-- Un <option> solo puede mostrar texto plano, no el SVG de icon() -
                             acá el emoji se deja tal cual a propósito. -->
                        ${LUGARES_RESERVABLES.map(e=>`<option value="${esc(e.lugar)}">${esc(e.icon)} ${esc(e.lugar)}</option>`).join("")}
                    </select>
                    <input id="mDisponibilidadFecha" type="date" class="form-control" style="max-width:180px" ${mcEvento("change", "actualizarDisponibilidadPanel")}>
                </div>
                <div id="mDisponibilidadResultado">
                    <p style="font-size:13px;color:var(--muted)">Elige un espacio y una fecha para ver la disponibilidad.</p>
                </div>
            </div>
        </div>
    `}function actualizarDisponibilidadPanel(){const e=document.getElementById("mDisponibilidadLugar"),t=document.getElementById("mDisponibilidadFecha"),o=document.getElementById("mDisponibilidadResultado");!e||!t||!o||(o.innerHTML=renderBloquesInfo(e.value,t.value))}function renderReservasList(){const e=currentRole==="residente"?reservas.filter(t=>t.depto===profile.depto):reservas;return e.length?e.map(t=>`
        <div class="reservation">
            <div class="reservation-left">
                <div class="reservation-icon">
                    ${icon(t.icon)}
                </div>
                <div>
                    <strong>
                        ${esc(t.lugar)}
                    </strong>
                    <div style="
                        color:#74817f;
                        font-size:12px;
                        margin-top:4px;
                    ">
                        ${esc(currentRole==="residente"?"":"Depto "+t.depto+" · ")}${esc(formatFechaLarga(t.fecha))} · ${esc(t.hora)}
                        ${esc((t.invitados||[]).length?" · "+t.invitados.length+" invitado"+(t.invitados.length===1?"":"s"):"")}
                    </div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <span class="badge badge-green">
                    ${esc(t.estado)}
                </span>
                <button class="outline-btn" ${mcEvento("click", "abrirInvitadosReserva", t.id)}>
                    ${icon("users")} Invitados
                </button>
            </div>
        </div>
    `).join(""):`
            <div class="empty">
                <div class="empty-icon">${icon("🏊")}</div>
                <p>
                    ${esc(currentRole==="residente"?"No tienes reservas próximas. Elige un espacio arriba para agendar uno.":"Todavía no hay reservas de espacios comunes.")}
                </p>
            </div>
        `}function renderDocumentos(){const e=documentos.map(t=>`
        <div class="action-card">
            <div class="action-card-icon">
                ${icon(t.icon)}
            </div>
            <h3>
                ${esc(t.titulo)}
            </h3>
            <p>
                ${esc(t.descripcion)}
            </p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="outline-btn"
                        ${mcEvento("click", "descargarDocumento", t.id)}>
                    Descargar
                </button>
                ${currentRole==="admin"?`
                    <button class="outline-btn"
                            ${mcEvento("click", "quitarDocumento", t.id)}>
                        Quitar
                    </button>
                `:""}
            </div>
        </div>
    `).join("");document.getElementById("content").innerHTML=`
        <div class="page-header">
            <div>
                <h1>Documentos</h1>
                <p>
                    Información y documentos de la comunidad.
                </p>
            </div>
            ${currentRole==="admin"?`
                <button class="primary-btn" ${mcEvento("click", "openModal", 'documento')}>
                    + Nuevo documento
                </button>
            `:""}
        </div>
        <div class="section-grid">
            ${e||`<div class="empty"><div class="empty-icon">${icon("file-text")}</div><p>Aún no hay documentos publicados.</p></div>`}
        </div>
    `}function descargarDocumento(e){const t=documentos.find(r=>r.id===e);if(!t)return;const o=new Blob([t.contenido],{type:"text/plain;charset=utf-8"}),a=URL.createObjectURL(o),i=document.createElement("a");i.href=a,i.download=t.titulo.replace(/\s+/g,"_")+".txt",document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(a),showToast("Descargando "+t.titulo)}async function quitarDocumento(e){try{await refComunidadActual().collection("documentos").doc(e).delete()}catch(t){console.error(t),showToast("No se pudo quitar el documento. Revisa tu conexión.");return}showToast("Documento eliminado"),renderDocumentos()}function renderPerfil(){const e=residentesDirectorio.find(t=>t.depto===profile.depto);document.getElementById("content").innerHTML=`
        <div class="page-header">
            <div>
                <h1>Mi perfil</h1>
                <p>
                    Información de tu cuenta y departamento.
                </p>
            </div>
        </div>
        <div class="card">
            <div class="card-body"
                 style="padding:25px">
                <div style="
                    display:flex;
                    align-items:center;
                    gap:17px;
                    margin-bottom:30px;
                ">
                    <div style="
                        width:65px;
                        height:65px;
                        border-radius:50%;
                        background:#e8f3f1;
                        color:#1f5f5b;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:22px;
                        font-weight:800;
                    ">
                        ${rolesConfig[currentRole].avatar}
                    </div>
                    <div>
                        <h2 id="perfilNombreHeader" style="font-size:20px">
                            ${esc(profile.nombre)}
                        </h2>
                        <p style="
                            color:#74817f;
                            font-size:13px;
                            margin-top:4px;
                        ">
                            ${currentRole==="residente"?"Propietario · Departamento "+profile.depto:rolesConfig[currentRole].label}
                        </p>
                    </div>
                </div>
                <div class="profile-fields">
                    <div>
                        <div class="form-group">
                            <label>
                                Nombre
                            </label>
                            <input id="perfilNombre"
                                   class="form-control"
                                   value="${esc(profile.nombre)}">
                        </div>
                    </div>
                    <div>
                        <div class="form-group">
                            <label>
                                Departamento
                            </label>
                            <input class="form-control"
                                   value="${esc(profile.depto)}"
                                   disabled>
                        </div>
                    </div>
                    <div>
                        <div class="form-group">
                            <label>
                                Correo
                            </label>
                            <input id="perfilCorreo"
                                   class="form-control"
                                   value="${esc(profile.correo)}">
                        </div>
                    </div>
                    <div>
                        <div class="form-group">
                            <label>
                                Teléfono
                            </label>
                            <input id="perfilTelefono"
                                   class="form-control"
                                   value="${esc(profile.telefono)}">
                        </div>
                    </div>
                </div>
                <button class="primary-btn"
                        style="width:auto"
                        ${mcEvento("click", "saveProfile")}>
                    Guardar cambios
                </button>
            </div>
        </div>
        ${e?`
                <div class="card" style="margin-top:20px">
                    <div class="card-body" style="padding:25px">
                        <h3 style="font-size:15px;margin-bottom:6px">${icon("users")} Familiares y otros habitantes</h3>
                        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">
                            Mantén actualizada la lista de quiénes viven contigo, con su RUT, para un control exacto en conserjería.
                        </p>
                        ${(e.familiares||[]).length?e.familiares.map((t,o)=>`
                                    <div class="list-item">
                                        <div class="list-icon">${icon("👤")}</div>
                                        <div class="list-content">
                                            <div class="list-title">${esc(t.nombre)}</div>
                                            <div class="list-meta">${esc(t.rut||"Sin RUT")} · ${esc(t.parentesco)}</div>
                                        </div>
                                        <button class="outline-btn" ${mcEvento("click", "quitarFamiliar", e.depto, o)}>
                                            Quitar
                                        </button>
                                    </div>
                                `).join(""):'<div style="font-size:13px;color:var(--muted);margin-bottom:8px">Aún no has agregado familiares.</div>'}
                        <button class="outline-btn" style="margin-top:8px" ${mcEvento("click", "abrirModalFamiliar", e.depto)}>
                            + Agregar familiar
                        </button>
                    </div>
                </div>
                <div class="card" style="margin-top:20px">
                    <div class="card-body" style="padding:25px">
                        <h3 style="font-size:15px;margin-bottom:6px">${icon("ban")} Personas sin acceso autorizado</h3>
                        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">
                            Agrega aquí a cualquier persona que no debería poder ingresar a tu departamento.
                            Conserjería recibirá una alerta inmediata si intenta registrar su ingreso con su nombre o RUT.
                        </p>
                        ${(e.restringidos||[]).length?e.restringidos.map((t,o)=>`
                                    <div class="restricted-card">
                                        <div class="restricted-icon">${icon("ban")}</div>
                                        <div class="list-content">
                                            <div class="list-title">${esc(t.nombre)}</div>
                                            <div class="list-meta">${esc(t.rut||"Sin RUT")}${esc(t.motivo?" · "+t.motivo:"")}</div>
                                        </div>
                                        <button class="outline-btn" ${mcEvento("click", "quitarRestringido", e.depto, o)}>
                                            Quitar
                                        </button>
                                    </div>
                                `).join(""):'<div style="font-size:13px;color:var(--muted);margin-bottom:8px">No tienes a nadie restringido por ahora.</div>'}
                        <button class="outline-btn" style="margin-top:8px" ${mcEvento("click", "abrirModalRestringido", e.depto)}>
                            + Agregar persona sin acceso
                        </button>
                    </div>
                </div>
                <div class="card" style="margin-top:20px">
                    <div class="card-body" style="padding:25px">
                        <h3 style="font-size:15px;margin-bottom:6px">${icon("lock")} Seguridad de mi ficha</h3>
                        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">
                            Conserjería te pedirá esta respuesta antes de entregar información sobre
                            quién entró o salió de tu departamento, para que nadie más pueda consultarla en tu nombre.
                        </p>
                        <div class="form-group">
                            <label>Pregunta secreta actual</label>
                            <div style="font-size:14px">
                                ${e.preguntaSecreta?`“${esc(e.preguntaSecreta)}”`:'<span style="color:var(--muted)">No configurada todavía</span>'}
                            </div>
                        </div>
                        <button class="outline-btn" ${mcEvento("click", "abrirModalPreguntaSecreta", e.depto)}>
                            ${esc(e.preguntaSecreta?"Cambiar pregunta secreta":"Configurar pregunta secreta")}
                        </button>
                    </div>
                </div>
                <div class="card" style="margin-top:20px">
                    <div class="card-body" style="padding:25px">
                        <h3 style="font-size:15px;margin-bottom:6px">${icon("door-open")} Quién entró o salió de tu departamento</h3>
                        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">
                            Registro de visitas, vehículos y encomiendas de tu departamento, tal como lo ve conserjería.
                        </p>
                        ${historialAccesosDepto(e.depto).length?historialAccesosDepto(e.depto).map(t=>`
                                    <div class="list-item">
                                        <div class="list-icon">${icon(t.icono)}</div>
                                        <div class="list-content">
                                            <div class="list-title">${esc(t.titulo)}</div>
                                            <div class="list-meta">${esc(t.detalle)} · ${esc(t.fecha)} ${esc(t.hora||"")}</div>
                                        </div>
                                        ${t.restringido?`<span class="badge badge-red">${icon("ban")} Restringido</span>`:""}
                                    </div>
                                `).join(""):'<div style="font-size:13px;color:var(--muted)">Todavía no hay movimientos registrados para tu departamento.</div>'}
                    </div>
                </div>
                <div class="card" style="margin-top:20px">
                    <div class="card-body" style="padding:25px">
                        <h3 style="font-size:15px;margin-bottom:6px">${icon("calendar")} Visitas que voy a recibir</h3>
                        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">
                            Avisa con anticipación a alguien que va a visitarte, para que conserjería sepa que lo esperas y pueda marcar su ingreso apenas llegue.
                        </p>
                        ${visitasProgramadasPendientes(e.depto).length?visitasProgramadasPendientes(e.depto).map(t=>`
                                    <div class="invite-card">
                                        <div class="invite-date">
                                            <div class="invite-day">${esc(formatFechaCorta(t.fecha).day)}</div>
                                            <div class="invite-month">${esc(formatFechaCorta(t.fecha).month)}</div>
                                        </div>
                                        <div class="invite-body">
                                            <div>
                                                <div class="invite-name">${esc(t.nombre)}</div>
                                                <div class="invite-meta">${esc(t.hora?t.hora+" hrs":"Hora no especificada")}${esc(t.motivo?" · "+t.motivo:"")}</div>
                                            </div>
                                            <button class="outline-btn" ${mcEvento("click", "quitarVisitaProgramada", t.id)}>
                                                Quitar
                                            </button>
                                        </div>
                                    </div>
                                `).join(""):'<div style="font-size:13px;color:var(--muted);margin-bottom:8px">No tienes visitas avisadas. Si alguien va a visitarte, avísale a conserjería desde aquí.</div>'}
                        <button class="outline-btn" style="margin-top:8px" ${mcEvento("click", "abrirModalVisitaProgramada", e.depto)}>
                            + Avisar una visita
                        </button>
                    </div>
                </div>
                <div class="card" style="margin-top:20px">
                    <div class="card-body" style="padding:25px">
                        <h3 style="font-size:15px;margin-bottom:6px">${icon("home")} Datos de la propiedad</h3>
                        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">
                            Nombre del propietario y del arrendatario (si aplica), y si el departamento se usa como Airbnb - visible para conserjería y administración.
                        </p>
                        <div class="form-group">
                            <label>Propietario</label>
                            <div style="font-size:14px">${e.nombreDueno?esc(e.nombreDueno):'<span style="color:var(--muted)">No registrado</span>'}</div>
                        </div>
                        <div class="form-group">
                            <label>Arrendatario</label>
                            <div style="font-size:14px">${e.nombreArrendatario?esc(e.nombreArrendatario):'<span style="color:var(--muted)">No aplica / no registrado</span>'}</div>
                        </div>
                        <div class="form-group">
                            <label>¿Se usa como Airbnb?</label>
                            <div>
                                <span class="badge ${esc(e.esAirbnb?"badge-yellow":"")}">${esc(e.esAirbnb?"Sí":"No")}</span>
                            </div>
                        </div>
                        <p style="font-size:12px;color:var(--muted)">
                            Estos datos los edita administración desde la ficha del departamento.
                        </p>
                    </div>
                </div>
            `:""}
    `}function saveProfile(){profile.nombre=document.getElementById("perfilNombre").value.trim()||profile.nombre,profile.correo=document.getElementById("perfilCorreo").value.trim()||profile.correo,profile.telefono=document.getElementById("perfilTelefono").value.trim()||profile.telefono,saveData("profile",profile),showToast("Datos guardados correctamente"),renderPerfil()}function renderGastosComunes(){actualizarEstadosMorosidad();const e={Pagado:"badge-green",Pendiente:"badge-yellow",Atrasado:"badge-red","Por confirmar":"badge-blue"},t=gastosComunes.filter(c=>c.depto===profile.depto).sort((c,w)=>w.periodo.localeCompare(c.periodo)),o=t.find(c=>c.periodo===periodoActual()),a=t.filter(c=>!o||c.id!==o.id),i=multas.filter(c=>c.depto===profile.depto).sort((c,w)=>(w.ts||0)-(c.ts||0)),r=i.length?`
        <h3 style="font-size:16px;margin-bottom:12px">Multas</h3>
        <div class="card" style="margin-bottom:25px">
            <div class="card-body">
                ${i.map(c=>`
                    <div class="list-item">
                        <div class="list-icon">${icon("siren")}</div>
                        <div class="list-content">
                            <div class="list-title">${esc(c.tipoMultaNombre)}</div>
                            <div class="list-meta">${esc(formatFecha(c.fecha))}${esc(c.detalle?" · "+c.detalle:"")} · ${esc(formatCLP(c.monto))}</div>
                        </div>
                        ${c.estado==="Pagada"?`
                            <span class="badge badge-green">Pagada</span>
                        `:c.estado==="Por confirmar"?`
                            <span class="badge badge-blue">Por confirmar</span>
                        `:`
                            <button class="outline-btn" ${mcEvento("click", "abrirInformarPago", 'multa', c.id)}>
                                Informar pago
                            </button>
                        `}
                    </div>
                `).join("")}
            </div>
        </div>
    `:"",s=o?`
        <section class="welcome">
            <h2>Gasto común · ${esc(periodoLabel(o.periodo))}</h2>
            <p>Vence el ${esc(formatFecha(o.vencimiento))}</p>
        </section>
        <div class="stat-card" style="max-width:380px;margin-bottom:25px">
            <div class="stat-top">
                <div class="stat-icon">${icon("💵")}</div>
                <span class="badge ${esc(e[o.estado])}">${esc(o.estado)}</span>
            </div>
            <div class="stat-number">${esc(formatCLP(o.monto))}</div>
            <div class="stat-label">Depto ${esc(o.depto)}</div>
            ${o.estado==="Por confirmar"?`
                <p style="margin-top:12px;font-size:12px;color:var(--muted);line-height:1.5">
                    Informaste tu pago (${esc((o.pagoInformado||{}).metodo||"")}, ${esc(formatFecha((o.pagoInformado||{}).fecha))}).
                    Administración lo está revisando.
                </p>
            `:o.estado!=="Pagado"?`
                ${o.pagoRechazado?`
                    <p style="margin-top:12px;font-size:12px;color:var(--danger);line-height:1.5">
                        Tu último pago informado fue rechazado: ${esc(o.pagoRechazado.motivo)}
                    </p>
                `:""}
                <button class="primary-btn" style="margin-top:14px;width:100%" ${mcEvento("click", "abrirInformarPago", 'gasto', o.id)}>
                    Informar pago
                </button>
                <p style="margin-top:8px;font-size:11px;color:var(--muted);line-height:1.4">
                    Paga por transferencia o en conserjería y luego informa aquí tu pago.
                </p>
            `:`
                <p style="margin-top:10px;font-size:12px;color:var(--muted)">
                    Pagado el ${esc(formatFecha(o.fechaPago))} · ${esc(o.metodoPago)}
                </p>
            `}
            <a class="outline-btn"
               style="margin-top:8px;width:100%;text-align:center;text-decoration:none;display:block;box-sizing:border-box"
               target="_blank"
               href="${esc(linkWhatsApp(community.telefonoAdministracion,"Hola, tengo una consulta sobre el gasto común de mi depto "+o.depto+" ("+periodoLabel(o.periodo)+")."))}">
                ${icon("message-circle")} Consultar por WhatsApp
            </a>
        </div>
    `:`
        <div class="empty">
            <div class="empty-icon">${icon("💵")}</div>
            <p>Aún no se ha generado el gasto común de este mes.</p>
        </div>
    `,n=a.map(c=>`
        <tr>
            <td>${esc(periodoLabel(c.periodo))}</td>
            <td>${esc(formatCLP(c.monto))}</td>
            <td>
                <span class="badge ${esc(e[c.estado])}">
                    ${esc(c.estado)}
                </span>
            </td>
            <td>
                ${c.estado==="Pagado"?formatFecha(c.fechaPago):c.estado==="Por confirmar"?"En revisión":`<button class="outline-btn" ${mcEvento("click", "abrirInformarPago", 'gasto', c.id)}>Informar pago</button>`}
            </td>
        </tr>
    `).join("");document.getElementById("content").innerHTML=`
        <div class="page-header">
            <div>
                <h1>Gastos comunes</h1>
                <p>Revisa el gasto común y las multas de tu departamento, e informa tus pagos.</p>
            </div>
        </div>
        ${s}
        ${r}
        <h3 style="font-size:16px;margin-bottom:12px">Historial</h3>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Periodo</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Fecha de pago</th>
                    </tr>
                </thead>
                <tbody>
                    ${n||'<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:25px">Sin historial todavía.</td></tr>'}
                </tbody>
            </table>
        </div>
    `}function renderComunidades(){const e=comunidadesDirectorio.filter(r=>r.estado!=="Suspendida").length,t=comunidadesDirectorio.filter(r=>r.estado==="Suspendida").length,o=comunidadesDirectorio.reduce((r,s)=>r+(s.apartments||0),0),a=comunidadesDirectorio.reduce((r,s)=>r+(s.numResidentes||0)+(s.numConserjes||0),0),i=comunidadesDirectorio.map(r=>{const s=r.estado==="Suspendida";return`
        <tr>
            <td><strong>${esc(r.name||r.id)}</strong></td>
            <td>
                <span class="badge ${esc(s?"badge-red":"badge-green")}">
                    ${s?'<span class="status-dot status-dot-red"></span>Suspendida':'<span class="status-dot status-dot-green"></span>Activa'}
                </span>
            </td>
            <td>${esc(r.plan||"—")}</td>
            <td>${esc(r.apartments||0)}</td>
            <td>${esc((r.numResidentes||0)+(r.numConserjes||0))}
                <span style="color:var(--muted);font-size:12px">(${esc(r.numResidentes||0)} res. · ${esc(r.numConserjes||0)} cons.)</span>
            </td>
            <td>${esc(r.adminNombre||"—")}</td>
            <td>${esc(formatFecha(r.fechaContratacion))}</td>
            <td style="font-size:12px">${esc(formatUltimoAcceso(r.ultimoAcceso))}</td>
            <td>
                <button class="outline-btn" style="padding:6px 10px;font-size:12px"
                        ${mcEvento("click", "abrirDetalleComunidad", r.id)}>
                    Ver detalle
                </button>
            </td>
        </tr>
    `}).join("");document.getElementById("content").innerHTML=`
        <div class="page-header">
            <div>
                <h1>Nodar Logic → Mi Comunidad</h1>
                <p>Panel de la plataforma - todos los edificios que usan Mi Comunidad, en un solo lugar.</p>
            </div>
            <button class="primary-btn" style="width:auto" ${mcEvento("click", "openModal", 'nuevaComunidad')}>
                + Nueva comunidad
            </button>
        </div>
        <div class="stats" style="margin-bottom:20px">
            <div class="stat-card">
                <div class="stat-number">${esc(comunidadesDirectorio.length)}</div>
                <div class="stat-label">Comunidades en la plataforma</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color:var(--success)">${esc(e)}</div>
                <div class="stat-label">Activas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color:var(--danger)">${esc(t)}</div>
                <div class="stat-label">Suspendidas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${esc(o)}</div>
                <div class="stat-label">Departamentos totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${esc(a)}</div>
                <div class="stat-label">Usuarios totales</div>
            </div>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Plan</th>
                        <th>Deptos</th>
                        <th>Usuarios</th>
                        <th>Administrador</th>
                        <th>Contratación</th>
                        <th>Actividad</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${i||'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:25px">Todavía no hay comunidades creadas.</td></tr>'}
                </tbody>
            </table>
        </div>
    `}function abrirDetalleComunidad(e){const t=comunidadesDirectorio.find(o=>o.id===e);t&&openModal("detalleComunidad",t)}async function toggleEstadoComunidad(e){const t=comunidadesDirectorio.find(i=>i.id===e);if(!t)return;const o=t.estado==="Suspendida"?"Activa":"Suspendida",a=o==="Suspendida"?`¿Suspender el servicio de "${t.name}"? Nadie de esa comunidad (administración, conserjería ni residentes) podrá ingresar hasta que la reactives.`:`¿Reactivar el servicio de "${t.name}"?`;if(window.confirm(a))try{await db.collection(COMUNIDADES_COLLECTION).doc(e).update({estado:o}),t.estado=o,showToast(o==="Suspendida"?"Comunidad suspendida":"Comunidad reactivada"),openModal("detalleComunidad",t)}catch(i){console.error(i),showToast("No se pudo cambiar el estado. Revisa tu conexión.")}}async function guardarPlanComunidad(e){const t=comunidadesDirectorio.find(a=>a.id===e),o=document.getElementById("mComunidadDetallePlan").value;if(t)try{await db.collection(COMUNIDADES_COLLECTION).doc(e).update({plan:o}),t.plan=o,showToast("Plan actualizado")}catch(a){console.error(a),showToast("No se pudo actualizar el plan. Revisa tu conexión.")}}async function guardarNotasSoporteComunidad(e){const t=comunidadesDirectorio.find(a=>a.id===e),o=document.getElementById("mComunidadDetalleNotas").value.trim();if(t)try{await db.collection(COMUNIDADES_COLLECTION).doc(e).update({notasSoporte:o}),t.notasSoporte=o,showToast("Notas de soporte guardadas")}catch(a){console.error(a),showToast("No se pudo guardar la nota. Revisa tu conexión.")}}let adminTab="dashboard";function setAdminTab(e){adminTab=e,renderAdmin()}const TABS_EXPORTABLES=["departamentos","finanzas","multas","contabilidad","remuneraciones"];function celdaCSV(e){if(e==null)return"";if(typeof e=="number")return String(e);let t=String(e);return/^[=+\-@\t\r]/.test(t)&&(t="'"+t),/[";\n\r]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t}function descargarCSV(e,t,o){const a=[t,...o].map(n=>n.map(celdaCSV).join(";")).join(`\r
`),i=new Blob(["\uFEFF"+a],{type:"text/csv;charset=utf-8"}),r=URL.createObjectURL(i),s=document.createElement("a");s.href=r,s.download=e,document.body.appendChild(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e3)}function nombreResidente(e){const t=residentesDirectorio.find(o=>o.depto===e);return t?t.nombre:""}function exportarTabAdmin(){const t=(community.name||"comunidad").replace(/[^\w\-]+/g,"_")+"_"+hoyISO()+".csv";adminTab==="departamentos"?descargarCSV("residentes_"+t,["Depto","Nombre","RUT","Teléfono","Estado","Propietario","Arrendatario","Airbnb","Familiares"],residentesDirectorio.slice().sort((o,a)=>String(o.depto).localeCompare(String(a.depto),"es",{numeric:!0})).map(o=>[o.depto,o.nombre,o.rut,o.telefono,o.estado,o.nombreDueno||"",o.nombreArrendatario||"",o.esAirbnb?"Sí":"No",(o.familiares||[]).length])):adminTab==="finanzas"?descargarCSV("gastos_comunes_"+t,["Período","Depto","Residente","Monto","Vencimiento","Estado","Fecha de pago","Método de pago"],gastosComunes.slice().sort((o,a)=>a.periodo.localeCompare(o.periodo)||String(o.depto).localeCompare(String(a.depto),"es",{numeric:!0})).map(o=>[periodoLabel(o.periodo),o.depto,nombreResidente(o.depto),o.monto,o.vencimiento,o.estado,o.fechaPago||"",o.metodoPago||textoMetodoPago(o,"")])):adminTab==="multas"?descargarCSV("multas_"+t,["Fecha","Depto","Residente","Tipo","Detalle","Monto","Estado","Fecha de pago"],multas.map(o=>[o.fecha,o.depto,nombreResidente(o.depto),o.tipoMultaNombre,o.detalle||"",o.monto,o.estado,o.fechaPago||""])):adminTab==="contabilidad"?descargarCSV("libro_contable_"+t,["Fecha","Tipo","Categoría","Descripción","Monto","Origen","Depto"],movimientosContables.slice().sort((o,a)=>String(o.fecha).localeCompare(String(a.fecha))).map(o=>[o.fecha,o.tipo,o.categoria,o.descripcion,o.tipo==="Egreso"?-o.monto:o.monto,o.origen,o.depto||""])):adminTab==="remuneraciones"&&descargarCSV("remuneraciones_"+t,["Período","Nombre","Cargo","Monto","Estado","Fecha de pago"],remuneraciones.map(o=>[periodoLabel(o.periodo),o.nombre,o.cargo,o.monto,o.estado,o.fechaPago||""])),showToast("Archivo descargado")}function renderAdmin(){const e=[{id:"dashboard",icon:"layout-dashboard",label:"Resumen"},{id:"departamentos",icon:"building-2",label:"Departamentos y residentes"},{id:"conserjes",icon:"shield",label:"Conserjes"},{id:"finanzas",icon:"banknote",label:"Gastos comunes"},{id:"multas",icon:"siren",label:"Multas"},{id:"contabilidad",icon:"book-open",label:"Contabilidad"},{id:"remuneraciones",icon:"receipt",label:"Remuneraciones"},{id:"proveedores",icon:"wrench",label:"Proveedores"},{id:"controlacceso",icon:"car",label:"Control de acceso"}],t={departamentos:"Residentes",controlacceso:"Accesos"},a=[{label:"",ids:["dashboard"]},{label:"Comunidad",ids:["departamentos","conserjes"]},{label:"Finanzas",ids:["finanzas","multas","contabilidad","remuneraciones"]},{label:"Operación",ids:["proveedores","controlacceso"]}].map(r=>`
        <div class="tab-group">
            <span class="tab-group-label">${esc(r.label)}</span>
            <div class="tab-group-items">
                ${r.ids.map(s=>e.find(n=>n.id===s)).map(s=>`
                    <button class="admin-tab ${esc(adminTab===s.id?"active":"")}"
                            ${mcEvento("click", "setAdminTab", s.id)}>
                        ${esc(t[s.id]||s.label)}
                    </button>
                `).join("")}
            </div>
        </div>
    `).join("");let i="";adminTab==="departamentos"?i=renderAdminDepartamentos():adminTab==="conserjes"?i=renderAdminConserjes():adminTab==="finanzas"?i=renderAdminFinanzas():adminTab==="multas"?i=renderAdminMultas():adminTab==="contabilidad"?i=renderAdminContabilidad():adminTab==="remuneraciones"?i=renderAdminRemuneraciones():adminTab==="proveedores"?i=renderAdminProveedores():adminTab==="controlacceso"?i=renderAdminControlAcceso():i=renderAdminDashboard(),document.getElementById("content").innerHTML=`
        <div class="page-header">
            <div>
                <h1>
                    Administración
                </h1>
                <p>
                    Panel general de gestión del edificio.
                </p>
            </div>
        </div>
        <div class="admin-tabs">
            ${a}
        </div>
        ${TABS_EXPORTABLES.includes(adminTab)?`
            <div style="display:flex;justify-content:flex-end;margin:-6px 0 14px">
                <button class="outline-btn" style="width:auto" ${mcEvento("click", "exportarTabAdmin")}>
                    ${icon("📥")} Exportar a Excel
                </button>
            </div>
        `:""}
        ${i}
    `}const ESTADOS_DEPTO={pagado:{label:"Al día"},revision:{label:"Pago por confirmar"},pendiente:{label:"Pendiente del mes"},moroso:{label:"Con deuda"},sincobro:{label:"Sin cobro generado"}};function estadoFinancieroDepto(e){const t=periodoActual(),o=hoyISO(),a=gastosComunes.filter(r=>r.depto===e);if(a.some(r=>r.estado==="Atrasado"||r.estado!=="Pagado"&&r.vencimiento<o))return"moroso";const i=a.find(r=>r.periodo===t);return i?i.estado==="Pagado"?"pagado":i.estado==="Por confirmar"?"revision":"pendiente":"sincobro"}function pisoDeDepto(e){const t=parseInt(String(e).replace(/\D/g,""),10);return isNaN(t)?null:t>=100?Math.floor(t/100):0}function periodoRelativo(e){const[t,o]=periodoActual().split("-").map(Number),a=new Date(t,o-1+e,1);return a.getFullYear()+"-"+String(a.getMonth()+1).padStart(2,"0")}function sumaMontos(e){return e.reduce((t,o)=>t+(Number(o.monto)||0),0)}function abrirFichaDepto(e){const t=residentesDirectorio.findIndex(o=>o.depto===e);if(t<0){showToast("El depto "+e+" no tiene residente registrado");return}verDetalleResidente(t)}function irAtencion(e){({pagos:()=>setAdminTab("finanzas"),deuda:()=>setAdminTab("finanzas"),encomiendas:()=>navigate("encomiendas"),solicitudes:()=>navigate("solicitudes"),mantenciones:()=>setAdminTab("proveedores"),multas:()=>setAdminTab("multas"),sueldos:()=>setAdminTab("remuneraciones"),pendientes:()=>setAdminTab("departamentos")}[e]||(()=>{}))()}function mapaEdificioHtml(){const e=[...new Set([...residentesDirectorio.map(r=>r.depto),...gastosComunes.map(r=>r.depto)].filter(Boolean))],t={};e.forEach(r=>{const s=pisoDeDepto(r),n=s===null?"otros":String(s);(t[n]=t[n]||[]).push(r)});const o=Object.keys(t).sort((r,s)=>r==="otros"?1:s==="otros"?-1:Number(s)-Number(r)),a={pagado:0,revision:0,pendiente:0,moroso:0,sincobro:0},i=o.map(r=>{const s=t[r].sort((n,c)=>String(n).localeCompare(String(c),"es",{numeric:!0})).map(n=>{const c=estadoFinancieroDepto(n);a[c]++;const w=residentesDirectorio.find($=>$.depto===n);return`
                    <button class="bm-unit is-${esc(c)}" ${mcEvento("click", "abrirFichaDepto", n)}
                            title="Depto ${esc(n)}${esc(w?", "+w.nombre:"")}: ${esc(ESTADOS_DEPTO[c].label)}">${esc(n)}</button>
                `}).join("");return`
            <div class="bm-floor">
                <span class="bm-label">${esc(r==="otros"?"Otros":r==="0"?"PB":"Piso "+r)}</span>
                <div class="bm-units">${s}</div>
            </div>
        `}).join("");return e.length?`
        <div class="bm-wrap">
            <div class="bm">${i}</div>
            <div class="bm-ground"><span>Acceso</span></div>
        </div>
        <div class="bm-legend">
            <span><i class="is-pagado"></i> Al día <b>${esc(a.pagado)}</b></span>
            <span><i class="is-revision"></i> Por confirmar <b>${esc(a.revision)}</b></span>
            <span><i class="is-pendiente"></i> Pendiente del mes <b>${esc(a.pendiente)}</b></span>
            <span><i class="is-moroso"></i> Con deuda <b>${esc(a.moroso)}</b></span>
        </div>
    `:'<div class="fx-vacio">Aún no hay departamentos registrados. Agrégalos en la pestaña Residentes.</div>'}function graficoRecaudacionHtml(){const e=[-5,-4,-3,-2,-1,0].map($=>{const N=periodoRelativo($),H=gastosComunes.filter(j=>j.periodo===N),[_,C]=N.split("-").map(Number);return{emitido:sumaMontos(H),recaudado:sumaMontos(H.filter(j=>j.estado==="Pagado")),label:new Date(_,C-1,1).toLocaleDateString("es-CL",{month:"short"}).replace(".",""),actual:$===0}});if(!e.some($=>$.emitido))return'<div class="fx-vacio">Cuando generes cobros de gastos comunes, aquí verás la recaudación mes a mes.</div>';const t=Math.max(...e.map($=>$.emitido)),o=460,a=118,i=18,r=22,s=22,n=(o-s*7)/6,c=a-i-r,w=e.map(($,N)=>{const H=s+N*(n+s),_=c*$.emitido/t,C=c*$.recaudado/t,j=$.emitido?Math.round(100*$.recaudado/$.emitido):0;return`
            <rect x="${esc(H.toFixed(1))}" y="${esc((a-r-_).toFixed(1))}" width="${esc(n.toFixed(1))}" height="${esc(_.toFixed(1))}" rx="4" class="gr-emitido"></rect>
            <rect x="${esc(H.toFixed(1))}" y="${esc((a-r-C).toFixed(1))}" width="${esc(n.toFixed(1))}" height="${esc(C.toFixed(1))}" rx="4" class="gr-recaudado ${esc($.actual?"is-actual":"")}"></rect>
            <text x="${esc((H+n/2).toFixed(1))}" y="${esc((a-r-_-6).toFixed(1))}" class="gr-pct">${esc($.emitido?j+"%":"")}</text>
            <text x="${esc((H+n/2).toFixed(1))}" y="${esc(a-7)}" class="gr-mes">${esc($.label)}</text>
        `}).join("");return`
        <svg viewBox="0 0 ${esc(o)} ${esc(a)}" class="gr-svg" role="img" aria-label="Recaudación de los últimos 6 meses">${w}</svg>
        <div class="gr-nota">Porcentaje de lo cobrado que se recaudó cada mes.</div>
    `}function renderAdminDashboard(){actualizarEstadosMorosidad(),actualizarEstadosMantencion();const e=periodoActual(),t=hoyISO(),o=gastosComunes.filter(R=>R.periodo===e),a=sumaMontos(o),i={pagado:sumaMontos(o.filter(R=>R.estado==="Pagado")),revision:sumaMontos(o.filter(R=>R.estado==="Por confirmar")),pendiente:sumaMontos(o.filter(R=>R.estado==="Pendiente")),moroso:sumaMontos(o.filter(R=>R.estado==="Atrasado"))},r={pagado:o.filter(R=>R.estado==="Pagado").length,revision:o.filter(R=>R.estado==="Por confirmar").length,pendiente:o.filter(R=>R.estado==="Pendiente").length,moroso:o.filter(R=>R.estado==="Atrasado").length},s=a?Math.round(100*i.pagado/a):0,n=a?["pagado","revision","pendiente","moroso"].filter(R=>i[R]>0).map(R=>`<div class="rc-seg is-${esc(R)}" style="flex:${esc(i[R])}" title="${esc(ESTADOS_DEPTO[R].label)}: ${esc(formatCLP(i[R]))}"></div>`).join(""):"",w=[...new Set(gastosComunes.map(R=>R.depto))].filter(R=>estadoFinancieroDepto(R)==="moroso"),$=sumaMontos(gastosComunes.filter(R=>R.estado==="Atrasado"||R.estado!=="Pagado"&&R.vencimiento<t)),N=gastosComunes.filter(R=>R.estado==="Por confirmar").length+multas.filter(R=>R.estado==="Por confirmar").length,H=encomiendas.filter(R=>R.estado==="Recibido"&&R.ts&&Date.now()-R.ts>48*3600*1e3).length,_=incidencias.filter(R=>R.estado==="Pendiente").length,C=mantenciones.filter(R=>R.estado==="Atrasada").length,j=multas.filter(R=>R.estado==="Pendiente").length,X=remuneraciones.filter(R=>R.periodo===e&&R.estado!=="Pagado").length,re=residentesDirectorio.filter(R=>R.estado==="Pendiente").length,de=[{id:"deuda",n:w.length,nivel:"alerta",texto:(w.length===1?"departamento con deuda vencida":"departamentos con deuda vencida")+", "+formatCLP($)+" en total"},{id:"pagos",n:N,nivel:"accion",texto:N===1?"pago informado por revisar":"pagos informados por revisar"},{id:"mantenciones",n:C,nivel:"alerta",texto:C===1?"mantención atrasada":"mantenciones atrasadas"},{id:"encomiendas",n:H,nivel:"accion",texto:H===1?"encomienda sin retirar hace más de 48 horas":"encomiendas sin retirar hace más de 48 horas"},{id:"solicitudes",n:_,nivel:"accion",texto:_===1?"solicitud de residente sin atender":"solicitudes de residentes sin atender"},{id:"multas",n:j,nivel:"info",texto:j===1?"multa pendiente de pago":"multas pendientes de pago"},{id:"sueldos",n:X,nivel:"info",texto:X===1?"sueldo del mes por pagar":"sueldos del mes por pagar"},{id:"pendientes",n:re,nivel:"info",texto:re===1?"cuenta de residente sin activar":"cuentas de residentes sin activar"}].filter(R=>R.n>0),K=de.length?`
        <div class="at-list">
            ${de.map(R=>`
                <button class="at-row is-${esc(R.nivel)}" ${mcEvento("click", "irAtencion", R.id)}>
                    <span class="at-n">${esc(R.n)}</span>
                    <span class="at-text">${esc(R.texto)}</span>
                    <span class="at-go">${icon("chevron-right")}</span>
                </button>
            `).join("")}
        </div>
    `:`
        <div class="at-empty">${icon("circle-check")} Todo al día. No hay nada pendiente por ahora.</div>
    `,x=movimientosContables.reduce((R,ee)=>R+(ee.tipo==="Ingreso"?ee.monto:-ee.monto),0),V=movimientosContables.filter(R=>String(R.fecha||"").startsWith(e)),pe=sumaMontos(V.filter(R=>R.tipo==="Ingreso")),me=sumaMontos(V.filter(R=>R.tipo==="Egreso")),fe=encomiendas.filter(R=>R.estado==="Recibido").length,be=visitas.filter(R=>esDeHoy(R,"fecha")).length,he=reservas.filter(R=>R.fecha>=t).length,ye=conserjesDirectorio.filter(R=>R.estado==="En turno").length,ve=Object.values(vehiculos.reduce((R,ee)=>((!R[ee.patente]||(ee.ts||0)>(R[ee.patente].ts||0))&&(R[ee.patente]=ee),R),{})).filter(R=>R.tipo==="Ingreso").length;return`
        <div class="db-grid">
            <section class="db-panel db-atencion">
                <header class="db-head">
                    <h3>Requiere tu atención</h3>
                </header>
                ${K}
            </section>
            <section class="db-panel db-recaudacion">
                <header class="db-head">
                    <h3>Recaudación de ${esc(periodoLabel(e))}</h3>
                    <button class="db-link" ${mcEvento("click", "setAdminTab", 'finanzas')}>Ver gastos comunes</button>
                </header>
                <div class="rc-cifra">
                    <span class="rc-monto">${esc(formatCLP(i.pagado))}</span>
                    <span class="rc-de">recaudado de ${esc(formatCLP(a))} (${esc(s)}%)</span>
                </div>
                <div class="rc-barra">${n}</div>
                <ul class="rc-leyenda">
                    <li><span><i class="sw" style="background:var(--success)"></i>Pagado</span><strong>${esc(formatCLP(i.pagado))}</strong>${esc(r.pagado)} deptos</li>
                    <li><span><i class="sw" style="background:#4f7fb5"></i>Por confirmar</span><strong>${esc(formatCLP(i.revision))}</strong>${esc(r.revision)} deptos</li>
                    <li><span><i class="sw" style="background:var(--border)"></i>Pendiente</span><strong>${esc(formatCLP(i.pendiente))}</strong>${esc(r.pendiente)} deptos</li>
                    <li><span><i class="sw" style="background:var(--danger)"></i>Atrasado</span><strong>${esc(formatCLP(i.moroso))}</strong>${esc(r.moroso)} deptos</li>
                </ul>
                <div class="rc-tendencia">
                    <h4>Últimos 6 meses</h4>
                    ${graficoRecaudacionHtml()}
                </div>
            </section>
            <section class="db-panel db-mapa">
                <header class="db-head">
                    <h3>Mapa del edificio</h3>
                    <span class="db-hint" style="font-size:12.5px;color:var(--muted)">Toca un departamento para ver su ficha</span>
                </header>
                ${mapaEdificioHtml()}
            </section>
            <div class="db-side">
                <section class="db-panel">
                    <header class="db-head">
                        <h3>Caja del edificio</h3>
                        <button class="db-link" ${mcEvento("click", "setAdminTab", 'contabilidad')}>Ver contabilidad</button>
                    </header>
                    <div class="cj-monto ${esc(x<0?"is-neg":"")}">${esc(formatCLP(x))}</div>
                    <div class="cj-filas">
                        <div>Ingresos del mes<strong>${esc(formatCLP(pe))}</strong></div>
                        <div>Egresos del mes<strong>${esc(formatCLP(me))}</strong></div>
                    </div>
                </section>
                <section class="db-panel">
                    <header class="db-head">
                        <h3>Hoy en el edificio</h3>
                        <button class="db-link" ${mcEvento("click", "navigate", 'conserjeria')}>Ver conserjería</button>
                    </header>
                    <div class="op-list">
                        <div class="op-item">Encomiendas por retirar <strong>${esc(fe)}</strong></div>
                        <div class="op-item">Visitas registradas hoy <strong>${esc(be)}</strong></div>
                        <div class="op-item">Reservas próximas <strong>${esc(he)}</strong></div>
                        <div class="op-item">Conserjes en turno <strong>${esc(ye)} de ${esc(conserjesDirectorio.length)}</strong></div>
                        <div class="op-item">Vehículos dentro <strong>${esc(ve)}</strong></div>
                    </div>
                </section>
            </div>
        </div>
    `}function renderAdminDepartamentos(){const e=residentesDirectorio.map((t,o)=>{const a=incidencias.filter(i=>i.depto===t.depto&&i.estado!=="Resuelto").length;return`
            <tr>
                <td><strong>${esc(t.depto)}</strong></td>
                <td>${esc(t.nombre)}</td>
                <td>${esc(t.telefono)}</td>
                <td>
                    <span class="badge ${esc(t.estado==="Activo"?"badge-green":"badge-yellow")}">
                        ${esc(t.estado)}
                    </span>
                </td>
                <td>${esc(a)}</td>
                <td>
                    <button class="outline-btn" ${mcEvento("click", "verDetalleResidente", o)}>
                        Ver
                    </button>
                </td>
            </tr>
        `}).join("");return`
        <div class="page-header">
            <div>
                <h3 style="font-size:16px">Departamentos y residentes</h3>
                <p style="font-size:13px">
                    ${esc(residentesDirectorio.length)} de ${esc(community.apartments)} departamentos con residente registrado.
                </p>
            </div>
            <button class="outline-btn" ${mcEvento("click", "openResidenteModal")}>
                + Agregar residente
            </button>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Departamento</th>
                        <th>Residente</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                        <th>Solicitudes</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${e||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:25px">Sin residentes registrados.</td></tr>'}
                </tbody>
            </table>
        </div>
    `}function renderAdminConserjes(){return`
        <div class="page-header">
            <div>
                <h3 style="font-size:16px">Conserjes</h3>
                <p style="font-size:13px">
                    Personal de conserjería del edificio.
                </p>
            </div>
            <button class="outline-btn" ${mcEvento("click", "openConserjeModal")}>
                + Agregar conserje
            </button>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Turno</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                        <th>Acceso</th>
                    </tr>
                </thead>
                <tbody>
                    ${conserjesDirectorio.map(t=>`
        <tr>
            <td><strong>${esc(t.nombre)}</strong></td>
            <td>${esc(t.turno)}</td>
            <td>${esc(t.telefono)}</td>
            <td>
                <span class="badge ${esc(t.estado==="En turno"?"badge-green":"")}">
                    ${esc(t.estado)}
                </span>
            </td>
            <td>
                ${t.uid?`<button class="outline-btn" ${mcEvento("click", "restablecerClave", t.uid, t.nombre)}>${icon("key")} Restablecer clave</button>`:""}
            </td>
        </tr>
    `).join("")||'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:25px">Sin conserjes registrados.</td></tr>'}
                </tbody>
            </table>
        </div>
    `}function renderAdminFinanzas(){actualizarEstadosMorosidad();const e=periodoActual(),t=gastosComunes.filter(n=>n.periodo===e),o=t.filter(n=>n.estado==="Pagado").reduce((n,c)=>n+c.monto,0),a=t.filter(n=>n.estado!=="Pagado").reduce((n,c)=>n+c.monto,0),i=[...new Set(gastosComunes.map(n=>n.depto))].filter(n=>estadoFinancieroDepto(n)==="moroso").length,r={Pagado:"badge-green",Pendiente:"badge-yellow",Atrasado:"badge-red","Por confirmar":"badge-blue"},s=t.map(n=>{const c=residentesDirectorio.find(w=>w.depto===n.depto);return`
            <tr>
                <td><strong>${esc(n.depto)}</strong></td>
                <td>${esc(c?c.nombre:"-")}</td>
                <td>${esc(formatCLP(n.monto))}</td>
                <td>${esc(formatFecha(n.vencimiento))}</td>
                <td>
                    <span class="badge ${esc(r[n.estado])}">
                        ${esc(n.estado)}
                    </span>
                </td>
                <td>
                    ${n.estado!=="Pagado"?`
                        <div style="display:flex;gap:6px;flex-wrap:wrap">
                            <button class="outline-btn" ${mcEvento("click", "marcarGastoPagado", n.id)}>
                                ${esc(n.estado==="Por confirmar"?"Confirmar":"Marcar pagado")}
                            </button>
                            ${c&&n.estado!=="Por confirmar"?`
                                <a class="act-icon"
                                   title="Recordar por WhatsApp"
                                   aria-label="Recordar por WhatsApp"
                                   target="_blank"
                                   href="${esc(linkWhatsApp(c.telefono,"Hola "+c.nombre+", te recordamos que el gasto común de "+periodoLabel(n.periodo)+" (depto "+n.depto+") está "+n.estado.toLowerCase()+". Monto: "+formatCLP(n.monto)+"."))}">
                                    ${icon("message-circle")}
                                </a>
                            `:""}
                        </div>
                    `:`
                        <span style="font-size:12px;color:var(--muted)">
                            ${esc(formatFecha(n.fechaPago))}
                        </span>
                    `}
                </td>
            </tr>
        `}).join("");return`
        ${renderPagosPorConfirmar()}
        <div class="page-header">
            <div>
                <h3 style="font-size:16px">Gastos comunes · ${esc(periodoLabel(e))}</h3>
                <p style="font-size:13px">
                    Cobro y estado de pago por departamento.
                </p>
            </div>
            <button class="outline-btn" ${mcEvento("click", "openGenerarCobroModal")}>
                + Generar cobro del mes
            </button>
        </div>
        <section class="stats">
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("✅")}</div></div>
                <div class="stat-number">${esc(formatCLP(o))}</div>
                <div class="stat-label">Recaudado este mes</div>
            </div>
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("clock")}</div></div>
                <div class="stat-number">${esc(formatCLP(a))}</div>
                <div class="stat-label">Pendiente por cobrar</div>
            </div>
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("🚨")}</div></div>
                <div class="stat-number" style="${esc(i?"color:var(--danger)":"")}">${esc(i)}</div>
                <div class="stat-label">Departamentos morosos</div>
            </div>
        </section>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Depto</th>
                        <th>Residente</th>
                        <th>Monto</th>
                        <th>Vence</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${s||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:25px">Aún no se ha generado el cobro de este mes.</td></tr>'}
                </tbody>
            </table>
        </div>
    `}function openGenerarCobroModal(){openModal("cobroMensual")}function renderAdminMultas(){const e=multas.slice().sort((n,c)=>(c.ts||0)-(n.ts||0)),t=e.filter(n=>n.estado!=="Pagada"),o=e.filter(n=>n.estado==="Pagada").reduce((n,c)=>n+c.monto,0),a=t.reduce((n,c)=>n+c.monto,0),i=tiposMulta.map(n=>`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="flex:1">
                <strong>${esc(n.nombre)}</strong>
                <span style="font-size:12px;color:var(--muted)"> · ${esc(formatCLP(n.monto))}</span>
            </div>
            <span class="badge ${esc(n.activo===!1?"badge-red":"badge-green")}">
                ${esc(n.activo===!1?"Inactivo":"Activo")}
            </span>
            <button class="outline-btn" style="padding:4px 8px;font-size:12px"
                    ${mcEvento("click", "toggleActivoTipoMulta", n.id)}>
                ${esc(n.activo===!1?"Activar":"Desactivar")}
            </button>
            <button class="outline-btn" style="padding:4px 8px;font-size:12px;color:var(--danger);border-color:var(--danger)"
                    ${mcEvento("click", "eliminarTipoMulta", n.id)}>
                Eliminar
            </button>
        </div>
    `).join(""),r={Pagada:"badge-green",Pendiente:"badge-yellow","Por confirmar":"badge-blue"},s=e.map(n=>{const c=residentesDirectorio.find(w=>w.depto===n.depto);return`
            <tr>
                <td><strong>${esc(n.depto)}</strong></td>
                <td>${esc(c?c.nombre:"-")}</td>
                <td>${esc(n.tipoMultaNombre)}</td>
                <td>${esc(formatCLP(n.monto))}</td>
                <td>${esc(formatFecha(n.fecha))}</td>
                <td>
                    <span class="badge ${esc(r[n.estado])}">
                        ${esc(n.estado)}
                    </span>
                </td>
                <td>
                    ${n.estado!=="Pagada"?`
                        <button class="outline-btn" ${mcEvento("click", "marcarMultaPagada", n.id)}>
                            Marcar pagada
                        </button>
                    `:`
                        <span style="font-size:12px;color:var(--muted)">${esc(formatFecha(n.fechaPago))}</span>
                    `}
                </td>
            </tr>
        `}).join("");return`
        <div class="page-header">
            <div>
                <h3 style="font-size:16px">Multas internas</h3>
                <p style="font-size:13px">
                    Cobros por infracciones al reglamento interno (ruidos molestos, mal uso de espacios comunes, etc.).
                </p>
            </div>
            <button class="outline-btn" ${mcEvento("click", "abrirModalAplicarMulta")}>
                + Aplicar multa
            </button>
        </div>
        <section class="stats">
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("circle-check")}</div></div>
                <div class="stat-number">${esc(formatCLP(o))}</div>
                <div class="stat-label">Recaudado en multas</div>
            </div>
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("clock")}</div></div>
                <div class="stat-number">${esc(formatCLP(a))}</div>
                <div class="stat-label">Pendiente por cobrar</div>
            </div>
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("siren")}</div></div>
                <div class="stat-number">${esc(t.length)}</div>
                <div class="stat-label">Multas activas</div>
            </div>
        </section>
        <div class="card" style="margin-bottom:20px">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
                <h3>Tipos de multa configurados</h3>
                <button class="outline-btn" style="width:auto" ${mcEvento("click", "abrirModalTipoMulta")}>
                    + Nuevo tipo
                </button>
            </div>
            <div class="card-body">
                ${i||'<p style="font-size:13px;color:var(--muted)">Todavía no has configurado ningún tipo de multa.</p>'}
            </div>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Depto</th>
                        <th>Residente</th>
                        <th>Tipo</th>
                        <th>Monto</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${s||'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:25px">Todavía no se ha aplicado ninguna multa.</td></tr>'}
                </tbody>
            </table>
        </div>
    `}function abrirModalTipoMulta(){openModal("tipoMulta")}async function toggleActivoTipoMulta(e){const t=tiposMulta.find(o=>o.id===e);if(t)try{await refComunidadActual().collection("tiposMulta").doc(e).update({activo:t.activo===!1})}catch(o){console.error(o),showToast("No se pudo actualizar el tipo de multa. Revisa tu conexión.")}}async function eliminarTipoMulta(e){if(window.confirm("¿Eliminar este tipo de multa? Las multas ya aplicadas con este tipo no se ven afectadas."))try{await refComunidadActual().collection("tiposMulta").doc(e).delete(),showToast("Tipo de multa eliminado")}catch(t){console.error(t),showToast("No se pudo eliminar el tipo de multa. Revisa tu conexión.")}}function abrirModalAplicarMulta(){openModal("aplicarMulta")}function actualizarMontoSugeridoMulta(){const e=document.getElementById("mAplicarMultaTipo"),t=document.getElementById("mAplicarMultaMonto");if(!e||!t)return;const o=e.options[e.selectedIndex];o&&(t.value=o.dataset.monto)}async function marcarMultaPagada(e){const t=multas.find(o=>o.id===e);if(t){t.estado="Pagada",t.fechaPago=t.pagoInformado&&t.pagoInformado.fecha||hoyISO(),t.metodoPago=textoMetodoPago(t,"Registrado por administración"),renderAdmin();try{await refComunidadActual().collection("multas").doc(e).update({estado:"Pagada",fechaPago:t.fechaPago,metodoPago:t.metodoPago,confirmadoEn:Date.now()})}catch(o){console.error(o),showToast("No se pudo guardar el pago. Revisa tu conexión.");return}await registrarMovimientoContable({tipo:"Ingreso",categoria:"Multa",descripcion:`Multa "${t.tipoMultaNombre}" · Depto ${t.depto}`,monto:t.monto,fecha:t.fechaPago,origen:"Automático",depto:t.depto}),crearNotificacion({icon:"circle-check",titulo:"Pago de multa confirmado",meta:`${t.tipoMultaNombre} · ${formatCLP(t.monto)}`,depto:t.depto,paraTodos:!1}),showToast("Pago de multa registrado para el depto "+t.depto)}}function renderAdminContabilidad(){const e=periodoActual(),t=movimientosContables.filter(s=>s.fecha&&s.fecha.slice(0,7)===e),o=t.filter(s=>s.tipo==="Ingreso").reduce((s,n)=>s+n.monto,0),a=t.filter(s=>s.tipo==="Egreso").reduce((s,n)=>s+n.monto,0),i=movimientosContables.reduce((s,n)=>s+(n.tipo==="Ingreso"?n.monto:-n.monto),0),r=[...movimientosContables].sort((s,n)=>n.fecha.localeCompare(s.fecha)||(n.ts||0)-(s.ts||0)).map(s=>`
            <tr>
                <td>${esc(formatFecha(s.fecha))}</td>
                <td>
                    <span class="badge ${esc(s.tipo==="Ingreso"?"badge-green":"badge-red")}">
                        ${esc(s.tipo)}
                    </span>
                </td>
                <td>${esc(s.categoria)}</td>
                <td>${esc(s.descripcion)}</td>
                <td style="text-align:right;white-space:nowrap">
                    ${esc(s.tipo==="Ingreso"?"+":"-")}${esc(formatCLP(s.monto))}
                </td>
            </tr>
        `).join("");return`
        <div class="page-header">
            <div>
                <h3 style="font-size:16px">Contabilidad · ${esc(periodoLabel(e))}</h3>
                <p style="font-size:13px">
                    Libro de ingresos y egresos del edificio.
                </p>
            </div>
            <button class="outline-btn" ${mcEvento("click", "openMovimientoContableModal")}>
                + Registrar movimiento
            </button>
        </div>
        <section class="stats">
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("📥")}</div></div>
                <div class="stat-number">${esc(formatCLP(o))}</div>
                <div class="stat-label">Ingresos de este mes</div>
            </div>
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("📤")}</div></div>
                <div class="stat-number">${esc(formatCLP(a))}</div>
                <div class="stat-label">Egresos de este mes</div>
            </div>
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("🏦")}</div></div>
                <div class="stat-number">${esc(formatCLP(i))}</div>
                <div class="stat-label">Balance acumulado</div>
            </div>
        </section>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Categoría</th>
                        <th>Descripción</th>
                        <th style="text-align:right">Monto</th>
                    </tr>
                </thead>
                <tbody>
                    ${r||'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:25px">Sin movimientos registrados.</td></tr>'}
                </tbody>
            </table>
        </div>
    `}function openMovimientoContableModal(){openModal("movimientoContable")}function renderAdminRemuneraciones(){const e=periodoActual(),t=remuneraciones.filter(s=>s.periodo===e),o=t.filter(s=>s.estado==="Pagado").reduce((s,n)=>s+n.monto,0),a=t.filter(s=>s.estado!=="Pagado").reduce((s,n)=>s+n.monto,0),i={Pagado:"badge-green",Pendiente:"badge-yellow"},r=t.map(s=>`
        <tr>
            <td><strong>${esc(s.nombre)}</strong></td>
            <td>${esc(s.cargo)}</td>
            <td>${esc(formatCLP(s.monto))}</td>
            <td>
                <span class="badge ${esc(i[s.estado])}">
                    ${esc(s.estado)}
                </span>
            </td>
            <td>
                ${s.estado!=="Pagado"?`
                    <button class="outline-btn" ${mcEvento("click", "pagarRemuneracion", s.id)}>
                        Marcar pagado
                    </button>
                `:`
                    <span style="font-size:12px;color:var(--muted)">
                        ${esc(formatFecha(s.fechaPago))}
                    </span>
                `}
            </td>
        </tr>
    `).join("");return`
        <div class="page-header">
            <div>
                <h3 style="font-size:16px">Remuneraciones · ${esc(periodoLabel(e))}</h3>
                <p style="font-size:13px">
                    Sueldos del personal del edificio.
                </p>
            </div>
            <button class="outline-btn" ${mcEvento("click", "generarNominaDelMes")}>
                + Generar nómina del mes
            </button>
        </div>
        <section class="stats">
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("✅")}</div></div>
                <div class="stat-number">${esc(formatCLP(o))}</div>
                <div class="stat-label">Pagado este mes</div>
            </div>
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("clock")}</div></div>
                <div class="stat-number">${esc(formatCLP(a))}</div>
                <div class="stat-label">Pendiente por pagar</div>
            </div>
        </section>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Cargo</th>
                        <th>Sueldo</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${r||'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:25px">Aún no se ha generado la nómina de este mes.</td></tr>'}
                </tbody>
            </table>
        </div>
    `}async function generarNominaDelMes(){const e=await generarNominaMensual();renderAdmin(),showToast(e>0?`Nómina generada para ${e} trabajador(es)`:"La nómina de este mes ya estaba generada")}function renderAdminProveedores(){actualizarEstadosMantencion();const e=proveedoresDirectorio.map(a=>`
        <tr>
            <td><strong>${esc(a.nombre)}</strong></td>
            <td>${esc(a.rubro)}</td>
            <td>${esc(a.telefono)}</td>
            <td>
                <span class="badge ${esc(a.estado==="Activo"?"badge-green":"")}">
                    ${esc(a.estado)}
                </span>
            </td>
        </tr>
    `).join(""),t={Programada:"badge-blue",Realizada:"badge-green",Atrasada:"badge-red"},o=[...mantenciones].sort((a,i)=>a.fecha.localeCompare(i.fecha)).map(a=>`
            <tr>
                <td>${esc(formatFecha(a.fecha))}</td>
                <td>${esc(a.proveedor)}</td>
                <td>${esc(a.tipo)}</td>
                <td>${esc(formatCLP(a.monto))}</td>
                <td>
                    <span class="badge ${esc(t[a.estado])}">
                        ${esc(a.estado)}
                    </span>
                </td>
                <td>
                    ${a.estado!=="Realizada"?`
                        <button class="outline-btn" ${mcEvento("click", "marcarMantencionRealizada", a.id)}>
                            Marcar realizada
                        </button>
                    `:`
                        <span style="font-size:12px;color:var(--muted)">
                            ${esc(formatFecha(a.fechaRealizada))}
                        </span>
                    `}
                </td>
            </tr>
        `).join("");return`
        <div class="page-header">
            <div>
                <h3 style="font-size:16px">Proveedores</h3>
                <p style="font-size:13px">
                    Empresas y contratistas que prestan servicio al edificio.
                </p>
            </div>
            <button class="outline-btn" ${mcEvento("click", "openProveedorModal")}>
                + Agregar proveedor
            </button>
        </div>
        <div class="table-wrap" style="margin-bottom:30px">
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Rubro</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${e||'<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:25px">Sin proveedores registrados.</td></tr>'}
                </tbody>
            </table>
        </div>
        <div class="page-header">
            <div>
                <h3 style="font-size:16px">Mantenciones</h3>
                <p style="font-size:13px">
                    Programación y estado de las mantenciones contratadas.
                </p>
            </div>
            <button class="outline-btn" ${mcEvento("click", "openMantencionModal")}>
                + Programar mantención
            </button>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Proveedor</th>
                        <th>Tipo</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${o||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:25px">Sin mantenciones programadas.</td></tr>'}
                </tbody>
            </table>
        </div>
    `}function openProveedorModal(){openModal("proveedor")}function openMantencionModal(){openModal("mantencion")}function renderAdminControlAcceso(){const e={};vehiculos.forEach($=>{e[$.patente]||(e[$.patente]=$)});const t=Object.values(e),o=t.filter($=>$.tipo==="Ingreso").length,a={};accesos.forEach($=>{a[$.nombre]||(a[$.nombre]=$)});const i=Object.values(a),r=i.filter($=>$.tipo==="Entrada").length,s=t.map($=>`
        <tr>
            <td><strong>${esc($.patente)}</strong></td>
            <td>Depto ${esc($.depto)}</td>
            <td>${esc(fechaRegistro($,"fecha"))} · ${esc($.hora)}</td>
            <td>
                <span class="badge ${esc($.tipo==="Ingreso"?"badge-green":"")}">
                    ${esc($.tipo==="Ingreso"?"Dentro":"Fuera")}
                </span>
            </td>
        </tr>
    `).join(""),n=i.map($=>`
        <tr>
            <td><strong>${esc($.nombre)}</strong></td>
            <td>${esc($.motivo)}</td>
            <td>${esc(fechaRegistro($,"fecha"))} · ${esc($.hora)}</td>
            <td>
                <span class="badge ${esc($.tipo==="Entrada"?"badge-green":"")}">
                    ${esc($.tipo==="Entrada"?"Dentro":"Fuera")}
                </span>
            </td>
        </tr>
    `).join(""),c=vehiculosRegistrados.filter($=>$.categoria==="Sospechoso").length,w=vehiculosRegistrados.map($=>`
        <tr>
            <td><strong>${esc($.patente)}</strong></td>
            <td>${esc($.depto?"Depto "+$.depto:"—")}</td>
            <td><span class="badge ${esc($.categoria==="Sospechoso"?"badge-red":"badge-green")}">${esc($.categoria)}</span></td>
            <td style="font-size:12px;color:var(--muted)">${esc($.notas||"—")}</td>
            <td><button class="outline-btn" ${mcEvento("click", "quitarVehiculoRegistrado", $.id)}>Quitar</button></td>
        </tr>
    `).join("");return`
        <div class="page-header">
            <div>
                <h3 style="font-size:16px">Control de acceso</h3>
                <p style="font-size:13px">
                    Panel central de seguridad: vehículos, visitas y lista de patentes recurrentes o sospechosas.
                </p>
            </div>
        </div>
        <section class="stats">
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("🚗")}</div></div>
                <div class="stat-number">${esc(o)}</div>
                <div class="stat-label">Vehículos dentro del edificio</div>
            </div>
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("🔑")}</div></div>
                <div class="stat-number">${esc(r)}</div>
                <div class="stat-label">Visitas y proveedores dentro</div>
            </div>
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("🚨")}</div></div>
                <div class="stat-number">${esc(c)}</div>
                <div class="stat-label">Vehículos marcados como sospechosos</div>
            </div>
            <div class="stat-card">
                <div class="stat-top"><div class="stat-icon">${icon("📋")}</div></div>
                <div class="stat-number">${esc(vehiculos.length+accesos.length)}</div>
                <div class="stat-label">Movimientos registrados hoy</div>
            </div>
        </section>
        <div class="page-header" style="margin-top:10px">
            <div>
                <h3 style="font-size:16px;margin-bottom:0">Vehículos registrados (recurrentes y sospechosos)</h3>
            </div>
            <button class="primary-btn" ${mcEvento("click", "abrirModalVehiculoRegistrado")}>+ Agregar vehículo</button>
        </div>
        <div class="table-wrap" style="margin-bottom:30px">
            <table>
                <thead>
                    <tr>
                        <th>Patente</th>
                        <th>Departamento</th>
                        <th>Categoría</th>
                        <th>Notas</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${w||'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:25px">Sin vehículos en la lista aún.</td></tr>'}
                </tbody>
            </table>
        </div>
        <h3 style="font-size:16px;margin-bottom:12px">Vehículos</h3>
        <div class="table-wrap" style="margin-bottom:30px">
            <table>
                <thead>
                    <tr>
                        <th>Patente</th>
                        <th>Departamento</th>
                        <th>Último movimiento</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${s||'<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:25px">Sin vehículos registrados.</td></tr>'}
                </tbody>
            </table>
        </div>
        <h3 style="font-size:16px;margin-bottom:12px">Visitas y proveedores</h3>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Motivo</th>
                        <th>Último movimiento</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${n||'<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:25px">Sin visitas registradas.</td></tr>'}
                </tbody>
            </table>
        </div>
        <p style="font-size:12px;color:var(--muted);margin-top:16px">
            El control de acceso con cámaras y lectura automática de patentes (OCR) se evaluará
            en una futura integración con hardware; por ahora este panel cubre el registro,
            validación de RUT y las alertas de patentes sospechosas de forma manual y confiable.
        </p>
    `}async function quitarVehiculoRegistrado(e){try{await refComunidadActual().collection("vehiculosRegistrados").doc(e).delete()}catch(t){console.error(t),showToast("No se pudo quitar el vehículo. Revisa tu conexión.");return}showToast("Vehículo eliminado de la lista"),renderAdmin()}let fichaTabActual={depto:null,tab:"resumen"};function fichaTab(e){fichaTabActual.tab=e;const t=document.querySelector("#modalBody .fx");t&&(t.dataset.tab=e),document.querySelectorAll("#modalBody .fx-tab").forEach(o=>o.classList.toggle("active",o.dataset.t===e))}function fichaDeptoHtml(e){fichaTabActual.depto!==e.depto&&(fichaTabActual={depto:e.depto,tab:"resumen"});const t=currentRole==="admin",o=t||!!fichaVerificada[e.depto];!t&&fichaTabActual.tab==="pagos"&&(fichaTabActual.tab="resumen");const a=estadoFinancieroDepto(e.depto),i=e.nombre.split(" ").filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase(),r={Pendiente:"badge-yellow","En proceso":"badge-blue",Resuelto:"badge-green"},s={Pagado:"badge-green",Pagada:"badge-green",Pendiente:"badge-yellow",Atrasado:"badge-red","Por confirmar":"badge-blue"},n=e.familiares||[],c=e.restringidos||[],w=incidencias.filter(x=>x.depto===e.depto).sort((x,V)=>(V.ts||0)-(x.ts||0)),$=gastosComunes.filter(x=>x.depto===e.depto).sort((x,V)=>String(V.periodo).localeCompare(String(x.periodo))),N=multas.filter(x=>x.depto===e.depto).sort((x,V)=>(V.ts||0)-(x.ts||0)),H=reservas.filter(x=>x.depto===e.depto).sort((x,V)=>(V.ts||0)-(x.ts||0)),_=historialAccesosDepto(e.depto),C=$.find(x=>x.periodo===periodoActual()),j=sumaMontos($.filter(x=>x.estado==="Atrasado"||x.estado!=="Pagado"&&x.vencimiento<hoyISO())),X=[["resumen","Resumen"],["habitantes","Habitantes"]];t&&X.push(["pagos","Pagos"]),X.push(["accesos","Accesos"]);const re=X.map(x=>`
        <button class="fx-tab ${esc(fichaTabActual.tab===x[0]?"active":"")}" data-t="${esc(x[0])}" ${mcEvento("click", "fichaTab", x[0])} role="tab">
            ${esc(x[1])}${x[0]==="habitantes"&&o?` <span class="fx-count">${esc(n.length)}</span>`:""}
        </button>
    `).join(""),K="Hola "+e.nombre.split(" ")[0]+", te escribimos de la administración de "+(community.name||"tu edificio")+".";return`
        <div class="fx" data-tab="${esc(fichaTabActual.tab)}">
            <div class="fx-head">
                <div class="fx-avatar">${esc(i)}</div>
                <div style="min-width:0">
                    <div class="fx-nombre">${esc(e.nombre)}</div>
                    <div class="fx-sub">Departamento ${esc(e.depto)}${esc(e.nombreArrendatario?", arrendado":"")}</div>
                    <div class="fx-chips">
                        ${t?`<span class="fx-chip is-${esc(a)}">${esc(ESTADOS_DEPTO[a].label)}</span>`:""}
                        <span class="badge ${esc(e.estado==="Activo"?"badge-green":"badge-yellow")}">${esc(e.estado==="Activo"?"Cuenta activa":"Cuenta sin activar")}</span>
                        ${e.esAirbnb?'<span class="badge badge-yellow">Airbnb</span>':""}
                    </div>
                </div>
            </div>
            <div class="fx-actions">
                ${e.telefono?`
                    <a class="fx-act" href="tel:${esc(e.telefono)}">${icon("phone")} Llamar</a>
                    <a class="fx-act" href="${esc(linkWhatsApp(e.telefono,K))}" target="_blank" rel="noopener">${icon("message-circle")} WhatsApp</a>
                `:""}
                ${t&&e.uid?`
                    <button class="fx-act" ${mcEvento("click", "restablecerClave", e.uid, e.nombre)}>${icon("key")} Restablecer clave</button>
                `:""}
            </div>
            <div class="fx-tabs" role="tablist">${re}</div>
            <!-- RESUMEN -->
            <div class="fx-pane" data-pane="resumen">
                <dl class="fx-datos">
                    <div><dt>RUT</dt><dd>${esc(e.rut?formatearRut(e.rut):"No registrado")}</dd></div>
                    <div><dt>Teléfono</dt><dd>${esc(e.telefono||"No registrado")}</dd></div>
                    <div><dt>Propietario</dt><dd>${esc(e.nombreDueno||"No registrado")}</dd></div>
                    <div><dt>Arrendatario</dt><dd>${esc(e.nombreArrendatario||"No aplica")}</dd></div>
                </dl>
                ${t?`
                    <div class="fx-box">
                        <div>
                            <small>Gasto común de ${esc(periodoLabel(periodoActual()))}</small>
                            <strong>${esc(C?formatCLP(C.monto):"Sin cobro")}</strong>
                        </div>
                        ${C?`<span class="badge ${esc(s[C.estado]||"badge-yellow")}">${esc(C.estado)}</span>`:""}
                    </div>
                    ${j>0?`
                        <div class="fx-box" style="border-color:var(--danger)">
                            <div>
                                <small>Deuda vencida</small>
                                <strong style="color:var(--danger)">${esc(formatCLP(j))}</strong>
                            </div>
                            <button class="db-link" ${mcEvento("click", "fichaTab", 'pagos')}>Ver detalle</button>
                        </div>
                    `:""}
                `:""}
                <h4 class="fx-h">Solicitudes <span class="fx-count">${esc(w.length)}</span></h4>
                ${w.length?w.map(x=>`
                    <div class="list-item">
                        <div class="list-icon">${icon("🔧")}</div>
                        <div class="list-content">
                            <div class="list-title">${esc(x.categoria)}</div>
                            <div class="list-meta">#${esc(folioCorto(x.id))}, ${esc(x.fecha)}</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px">
                            <span class="badge ${esc(r[x.estado]||"badge-yellow")}">${esc(x.estado)}</span>
                            ${x.estado!=="Resuelto"?`
                                <button class="outline-btn" ${mcEvento("click", "avanzarEstadoIncidencia", x.id)}>Avanzar</button>
                            `:""}
                        </div>
                    </div>
                `).join(""):'<div class="fx-vacio">Este departamento no ha enviado solicitudes.</div>'}
                ${t?`
                    <details class="fx-details">
                        <summary>${icon("pencil-line")} Editar datos de la propiedad</summary>
                        <div class="form-group">
                            <label>Propietario</label>
                            <input id="mFichaDueno" class="form-control" value="${esc(e.nombreDueno||"")}" placeholder="Nombre del dueño">
                        </div>
                        <div class="form-group">
                            <label>Arrendatario (si aplica)</label>
                            <input id="mFichaArrendatario" class="form-control" value="${esc(e.nombreArrendatario||"")}" placeholder="Nombre del arrendatario">
                        </div>
                        <div class="form-group" style="display:flex;align-items:center;gap:8px">
                            <input id="mFichaAirbnb" type="checkbox" ${esc(e.esAirbnb?"checked":"")}>
                            <label for="mFichaAirbnb" style="font-size:13px;margin:0">Este departamento se usa como Airbnb</label>
                        </div>
                        <div class="form-group">
                            <button class="outline-btn" ${mcEvento("click", "guardarDatosPropiedad", e.uid)}>Guardar cambios</button>
                        </div>
                    </details>
                `:""}
            </div>
            <!-- HABITANTES -->
            <div class="fx-pane" data-pane="habitantes">
                ${o?`
                    <h4 class="fx-h">Familiares y otros habitantes <span class="fx-count">${esc(n.length)}</span></h4>
                    ${n.length?n.map((x,V)=>`
                        <div class="list-item">
                            <div class="list-icon">${icon("👤")}</div>
                            <div class="list-content">
                                <div class="list-title">${esc(x.nombre)}</div>
                                <div class="list-meta">${esc(x.parentesco)}${esc(x.rut?", RUT "+x.rut:"")}</div>
                            </div>
                            <button class="outline-btn" ${mcEvento("click", "quitarFamiliar", e.depto, V)}>Quitar</button>
                        </div>
                    `).join(""):'<div class="fx-vacio">No hay familiares registrados.</div>'}
                    <button class="outline-btn" style="margin-top:8px" ${mcEvento("click", "abrirModalFamiliar", e.depto)}>+ Agregar familiar</button>
                    <h4 class="fx-h">${icon("ban")} Personas sin acceso <span class="fx-count">${esc(c.length)}</span></h4>
                    <p class="fx-nota">Si alguna intenta registrar su ingreso, conserjería recibe una alerta inmediata.</p>
                    ${c.length?c.map((x,V)=>`
                        <div class="restricted-card">
                            <div class="restricted-icon">${icon("ban")}</div>
                            <div class="list-content">
                                <div class="list-title">${esc(x.nombre)}</div>
                                <div class="list-meta">${esc(x.rut||"Sin RUT")}${esc(x.motivo?", "+x.motivo:"")}</div>
                            </div>
                            <button class="outline-btn" ${mcEvento("click", "quitarRestringido", e.depto, V)}>Quitar</button>
                        </div>
                    `).join(""):'<div class="fx-vacio">Nadie tiene el acceso restringido a este departamento.</div>'}
                    <button class="outline-btn" style="margin-top:8px" ${mcEvento("click", "abrirModalRestringido", e.depto)}>+ Agregar persona sin acceso</button>
                `:""}
            </div>
            <!-- PAGOS (solo administración) -->
            ${t?`
                <div class="fx-pane" data-pane="pagos">
                    <h4 class="fx-h">Gastos comunes</h4>
                    ${$.length?$.map(x=>`
                        <div class="fx-pago">
                            <div>
                                ${esc(periodoLabel(x.periodo))}
                                <small>${esc(x.estado==="Pagado"?"Pagado el "+formatFecha(x.fechaPago):"Vence el "+formatFecha(x.vencimiento))}</small>
                            </div>
                            <div style="display:flex;align-items:center;gap:10px">
                                <span class="tnum">${esc(formatCLP(x.monto))}</span>
                                <span class="badge ${esc(s[x.estado]||"badge-yellow")}">${esc(x.estado)}</span>
                            </div>
                        </div>
                    `).join(""):'<div class="fx-vacio">Aún no se generan cobros para este departamento.</div>'}
                    <h4 class="fx-h">Multas</h4>
                    ${N.length?N.map(x=>`
                        <div class="fx-pago">
                            <div>
                                ${esc(x.tipoMultaNombre)}
                                <small>${esc(formatFecha(x.fecha))}</small>
                            </div>
                            <div style="display:flex;align-items:center;gap:10px">
                                <span class="tnum">${esc(formatCLP(x.monto))}</span>
                                <span class="badge ${esc(s[x.estado]||"badge-yellow")}">${esc(x.estado)}</span>
                            </div>
                        </div>
                    `).join(""):'<div class="fx-vacio">Sin multas.</div>'}
                </div>
            `:""}
            <!-- ACCESOS -->
            <div class="fx-pane" data-pane="accesos">
                ${o?`
                    <h4 class="fx-h">Entradas y salidas</h4>
                    ${_.length?_.map(x=>`
                        <div class="list-item">
                            <div class="list-icon">${icon(x.icono)}</div>
                            <div class="list-content">
                                <div class="list-title">${esc(x.titulo)}</div>
                                <div class="list-meta">${esc(x.detalle)}, ${esc(x.fecha)} ${esc(x.hora||"")}</div>
                            </div>
                            ${x.restringido?`<span class="badge badge-red">${icon("ban")} Restringido</span>`:""}
                        </div>
                    `).join(""):'<div class="fx-vacio">Sin movimientos registrados.</div>'}
                    <h4 class="fx-h">${icon("calendar")} Reservas</h4>
                    ${H.length?H.map(x=>`
                        <div class="list-item">
                            <div class="list-icon">${icon(x.icon)}</div>
                            <div class="list-content">
                                <div class="list-title">${esc(x.lugar)}</div>
                                <div class="list-meta">
                                    ${esc(formatFechaLarga(x.fecha))}, ${esc(x.hora)}
                                    ${esc((x.invitados||[]).length?", "+x.invitados.length+" invitado"+(x.invitados.length===1?"":"s"):"")}
                                </div>
                            </div>
                            <button class="outline-btn" ${mcEvento("click", "abrirInvitadosReserva", x.id)}>${icon("users")} Invitados</button>
                        </div>
                    `).join(""):'<div class="fx-vacio">Sin reservas.</div>'}
                `:""}
            </div>
            ${o?"":`
                <div class="fx-lock">
                    <div class="fx-lock-box">
                        <strong style="font-size:13.5px;display:flex;align-items:center;gap:6px">${icon("lock")} Información protegida</strong>
                        <p class="fx-nota" style="margin:6px 0 12px">
                            Para proteger la privacidad de los residentes, verifica la identidad de quien consulta
                            antes de mostrar sus familiares y quién entra o sale del departamento.
                        </p>
                        ${e.preguntaSecreta?`
                            <div class="form-group">
                                <label>Pregunta de seguridad: “${esc(e.preguntaSecreta)}”</label>
                                <input id="mFichaRespuesta" class="form-control" placeholder="Respuesta de quien consulta" autocomplete="off">
                            </div>
                            <button class="primary-btn" style="width:auto" ${mcEvento("click", "verificarIdentidadFicha", e.depto)}>Verificar identidad</button>
                        `:`
                            <p class="fx-nota">Este departamento no tiene una pregunta de seguridad configurada. Verifica la identidad por otro medio.</p>
                            <button class="outline-btn" ${mcEvento("click", "mostrarFichaSinVerificar", e.depto)}>Mostrar de todas formas (bajo tu responsabilidad)</button>
                        `}
                    </div>
                </div>
            `}
        </div>
    `}function verDetalleResidente(e){openModal("detalleResidente",residentesDirectorio[e])}let busquedaConserje="";function normalizarTexto(e){return String(e||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}function haceCuanto(e){if(!e)return"";const t=Math.round((Date.now()-e)/6e4);if(t<1)return"recién";if(t<60)return"hace "+t+" min";const o=Math.round(t/60);if(o<24)return"hace "+o+" h";const a=Math.round(o/24);return"hace "+a+(a===1?" día":" días")}function resumenDeptoConserje(e){const t=encomiendas.filter(i=>i.depto===e&&i.estado==="Recibido").length,o=visitasProgramadas.filter(i=>i.depto===e&&i.estado==="Pendiente").length,a=[];return t&&a.push(t+(t===1?" encomienda por retirar":" encomiendas por retirar")),o&&a.push(o+(o===1?" visita avisada":" visitas avisadas")),a.join(", ")}function resultadosBusquedaConserjeHtml(e){const t=normalizarTexto(e.trim());if(!t)return"";const o=t.replace(/[^a-z0-9]/g,""),a=[];return residentesDirectorio.slice().sort((i,r)=>String(i.depto).localeCompare(String(r.depto),"es",{numeric:!0})).forEach(i=>{const r=String(i.depto).startsWith(t),s=normalizarTexto(i.nombre).includes(t),n=(i.familiares||[]).find(w=>normalizarTexto(w.nombre).includes(t));if(!r&&!s&&!n)return;const c=[n&&!s&&!r?"Familiar: "+n.nombre:"",resumenDeptoConserje(i.depto)].filter(Boolean).join(". ");a.push(`
                <div class="cs-row">
                    <button class="cs-main" ${mcEvento("click", "abrirFichaDepto", i.depto)}>
                        <span class="cs-tag">${esc(i.depto)}</span>
                        <span class="cs-info">
                            <strong>${esc(i.nombre)}</strong>
                            <small>${esc(c||"Sin pendientes en conserjería")}</small>
                        </span>
                    </button>
                    <button class="outline-btn" ${mcEvento("click", "encomiendaParaDepto", i.depto)}>+ Encomienda</button>
                </div>
            `)}),o.length>=3&&vehiculosRegistrados.filter(i=>normalizarTexto(i.patente).replace(/[^a-z0-9]/g,"").includes(o)).forEach(i=>{a.push(`
                    <div class="cs-row">
                        <button class="cs-main" ${mcEvento("click", "abrirVehiculoBuscado", i.id)}>
                            <span class="cs-tag ${esc(i.categoria==="Sospechoso"?"is-alerta":"")}">${icon("car")}</span>
                            <span class="cs-info">
                                <strong>${esc(i.patente)}${esc(i.categoria==="Sospechoso"?", vehículo sospechoso":"")}</strong>
                                <small>${esc(i.depto&&i.depto!=="-"?"Depto "+i.depto:"Sin depto asociado")}${esc(i.notas?". "+i.notas:"")}</small>
                            </span>
                        </button>
                    </div>
                `)}),o.length>=4&&encomiendas.filter(i=>i.estado==="Recibido"&&normalizarTexto(i.codigo).replace(/[^a-z0-9]/g,"").includes(o)).forEach(i=>{a.push(`
                    <div class="cs-row">
                        <button class="cs-main" ${mcEvento("click", "confirmarRetiroDesdeItem", i.id)}>
                            <span class="cs-tag">${icon("package")}</span>
                            <span class="cs-info">
                                <strong>${esc(i.codigo)}, ${esc(i.title)}</strong>
                                <small>Depto ${esc(i.depto)}, ${esc(haceCuanto(i.ts))}. Toca para entregar</small>
                            </span>
                        </button>
                    </div>
                `)}),`
        <div class="cs-res">
            ${a.length?a.slice(0,8).join(""):'<div class="cs-vacio">No encontramos ese departamento, nombre, patente ni código.</div>'}
        </div>
    `}function abrirVehiculoBuscado(e){const t=vehiculosRegistrados.find(o=>o.id===e);t&&t.depto&&t.depto!=="-"&&residentesDirectorio.some(o=>o.depto===t.depto)?abrirFichaDepto(t.depto):openVehiculoModal()}function diaRelativo(e){const t=diasHasta(e);return t===0?"Hoy":t===1?"Mañana":t===-1?"Ayer":new Date(e+"T00:00:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"})}function onBuscarConserje(e){busquedaConserje=e;const t=document.getElementById("csResultados");t&&(t.innerHTML=resultadosBusquedaConserjeHtml(e))}function encomiendaParaDepto(e){openEncomiendaModal();const t=document.getElementById("mEncomiendaDepto");t&&(t.value=e);const o=document.getElementById("mEncomiendaTitulo");o&&o.focus()}document.addEventListener("keydown",e=>{if(e.key!=="/"||currentPage!=="conserjeria")return;const t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable))return;const o=document.getElementById("csBuscar");o&&(e.preventDefault(),o.focus())});function renderConserjeria(){const e=document.activeElement&&document.activeElement.id==="csBuscar",t=encomiendas.filter(n=>n.estado==="Recibido").sort((n,c)=>(n.ts||0)-(c.ts||0)),o=visitasProgramadas.filter(n=>n.estado==="Pendiente").sort((n,c)=>(n.fecha+(n.hora||"")).localeCompare(c.fecha+(c.hora||""))),a=novedades.filter(n=>n.icon==="🚨"||n.icon==="🚫").slice(0,5),i=new Date().toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"}),r=t.length?t.slice(0,7).map(n=>{const c=n.ts&&Date.now()-n.ts>1728e5;return`
            <div class="pk-row">
                <span class="pk-depto">${esc(n.depto)}</span>
                <div class="pk-info">
                    <strong>${esc(n.title)}</strong>
                    <small class="${esc(c?"is-old":"")}">${esc(n.destinatario?"Para "+n.destinatario+", ":"")}llegó ${esc(haceCuanto(n.ts))}</small>
                </div>
                <button class="outline-btn" ${mcEvento("click", "confirmarRetiroDesdeItem", n.id)}>Entregar</button>
            </div>
        `}).join(""):'<div class="fx-vacio">No hay encomiendas esperando retiro.</div>',s=o.length?o.map(n=>`
        <div class="pk-row">
            <span class="pk-depto">${esc(n.depto)}</span>
            <div class="pk-info">
                <strong>${esc(n.nombre)}</strong>
                <small>${esc(diaRelativo(n.fecha))}${esc(n.hora?", "+n.hora:"")}${esc(n.motivo?". "+n.motivo:"")}</small>
            </div>
            <button class="outline-btn" ${mcEvento("click", "marcarIngresoVisitaProgramada", n.id)}>Marcar ingreso</button>
        </div>
    `).join(""):'<div class="fx-vacio">Ningún residente ha avisado visitas.</div>';if(document.getElementById("content").innerHTML=`
        <div class="pg-top">
            <div>
                <h1 class="pg-h1">Conserjería</h1>
                <p class="pg-sub">${esc(i)}, turno de ${esc(profile.nombre.split(" ")[0])}</p>
            </div>
            <span class="badge badge-green">Turno activo</span>
        </div>
        <div class="cs-box">
            <span class="cs-ic">${icon("search")}</span>
            <input id="csBuscar" class="cs-input" autocomplete="off" spellcheck="false"
                   placeholder="Busca un depto, nombre, patente o código de encomienda"
                   value="${esc(busquedaConserje)}"
                   ${mcEvento("input", "mcCampo_onBuscarConserje")}>
            <span class="cs-kbd">/</span>
        </div>
        <div id="csResultados">${resultadosBusquedaConserjeHtml(busquedaConserje)}</div>
        <div class="cj-actions">
            <button class="cj-act is-primary" ${mcEvento("click", "openEncomiendaModal")}>
                <span class="cj-ic">${icon("package")}</span>
                <span><strong>Registrar encomienda</strong><small>Llegó un paquete</small></span>
            </button>
            <button class="cj-act" ${mcEvento("click", "abrirEscanerRetiro")}>
                <span class="cj-ic">${icon("qr-code")}</span>
                <span><strong>Entregar encomienda</strong><small>Escanea el QR del residente</small></span>
            </button>
            <button class="cj-act" ${mcEvento("click", "openVisitaModal")}>
                <span class="cj-ic">${icon("user")}</span>
                <span><strong>Registrar visita</strong><small>Alguien quiere subir</small></span>
            </button>
        </div>
        <section class="cj-tools" aria-labelledby="cjToolsTitle"><h2 id="cjToolsTitle">Más herramientas</h2><div class="cj-tools-grid">
<button type="button" class="cj-tool" ${mcEvento("click", "openVehiculoModal")}><span class="cj-tool-icon">${icon('car')}</span><span class="cj-tool-copy"><strong>Vehículos</strong><small>Registrar ingreso</small></span></button>
<button type="button" class="cj-tool" ${mcEvento("click", "openAccesoModal")}><span class="cj-tool-icon">${icon('key')}</span><span class="cj-tool-copy"><strong>Proveedores y técnicos</strong><small>Control de acceso</small></span></button>
<button type="button" class="cj-tool" ${mcEvento("click", "openIncidenciaStaffModal")}><span class="cj-tool-icon">${icon('triangle-alert')}</span><span class="cj-tool-copy"><strong>Incidencias</strong><small>Registrar novedad</small></span></button>
<button type="button" class="cj-tool" ${mcEvento("click", "abrirModalVehiculoRegistrado")}><span class="cj-tool-icon">${icon('siren')}</span><span class="cj-tool-copy"><strong>Vehículo sospechoso</strong><small>Crear una alerta</small></span></button>
<button type="button" class="cj-tool" ${mcEvento("click", "abrirBuscarEncomienda")}><span class="cj-tool-icon">${icon('search')}</span><span class="cj-tool-copy"><strong>Buscar encomienda</strong><small>Consultar paquetes</small></span></button>
<button type="button" class="cj-tool" ${mcEvento("click", "openContactoModal")}><span class="cj-tool-icon">${icon('phone')}</span><span class="cj-tool-copy"><strong>Contactar residente</strong><small>Ver contactos</small></span></button>
<button type="button" class="cj-tool" ${mcEvento("click", "abrirBuscarFicha")}><span class="cj-tool-icon">${icon('folder-open')}</span><span class="cj-tool-copy"><strong>Fichas del edificio</strong><small>Consultar información</small></span></button>
</div></section>
        ${a.length?`
            <section class="db-panel cj-alertas">
                <header class="db-head"><h3>${icon("siren")} Alertas recientes</h3></header>
                ${a.map(n=>`
                    <div class="list-item">
                        <div class="list-icon">${icon(n.icon)}</div>
                        <div class="list-content">
                            <div class="list-title">${esc(n.title)}</div>
                            <div class="list-meta">${esc(n.meta)}</div>
                        </div>
                        <span class="badge badge-red">${esc(n.badgeText||"Alerta")}</span>
                    </div>
                `).join("")}
            </section>
        `:""}
        <div class="cj-grid">
            <section class="db-panel">
                <header class="db-head">
                    <h3>Por entregar <span class="db-count">${esc(t.length)}</span></h3>
                    <button class="db-link" ${mcEvento("click", "navigate", 'encomiendas')}>Ver todas</button>
                </header>
                ${r}
            </section>
            <div class="cj-col">
                <section class="db-panel">
                    <header class="db-head">
                        <h3>Visitas avisadas <span class="db-count">${esc(o.length)}</span></h3>
                    </header>
                    ${s}
                </section>
                <section class="db-panel" id="bitacora">
                    <header class="db-head">
                        <h3>Bitácora del turno</h3>
                        <button class="db-link" ${mcEvento("click", "openNovedadModal")}>+ Nueva novedad</button>
                    </header>
                    ${renderNovedadesList()}
                </section>
            </div>
        </div>
    `,e){const n=document.getElementById("csBuscar");n&&(n.focus(),n.setSelectionRange(n.value.length,n.value.length))}}function irABitacora(){const e=document.getElementById("bitacora");e&&e.scrollIntoView({behavior:"smooth",block:"start"})}function renderNovedadesList(){return novedades.length?novedades.slice(0,25).map(e=>`
        <div class="list-item">
            <div class="list-icon">
                ${icon(e.icon)}
            </div>
            <div class="list-content">
                <div class="list-title">
                    ${esc(e.title)}
                </div>
                <div class="list-meta">
                    ${esc(e.meta)}
                </div>
            </div>
            ${e.badgeText?`
                <span class="badge ${esc(e.badgeClass)}">
                    ${esc(e.badgeText)}
                </span>
            `:""}
        </div>
    `).join(""):`
            <div class="empty">
                <div class="empty-icon">${icon("📝")}</div>
                <p>
                    Todavía no hay novedades en este turno.
                </p>
            </div>
        `}let modalMode=null,modalContext=null;const modalTitles={solicitud:"Nueva solicitud",incidenciaStaff:"Registrar incidencia",aviso:"Nuevo aviso",encomienda:"Registrar encomienda",visita:"Registrar visita",vehiculo:"Registrar vehículo",acceso:"Control de acceso",contacto:"Contactar residente",novedad:"Nueva novedad",reserva:"Confirmar reserva",residente:"Agregar residente",conserje:"Agregar conserje",detalleResidente:"Ficha del departamento",notificaciones:"Notificaciones",cobroMensual:"Generar cobro del mes",tipoMulta:"Nuevo tipo de multa",aplicarMulta:"Aplicar multa",confirmarRetiro:"Confirmar retiro de encomienda",mostrarCodigoEncomienda:"Mi código de retiro",proveedor:"Agregar proveedor",mantencion:"Programar mantención",familiar:"Agregar familiar",vehiculoRegistrado:"Agregar vehículo a la lista",buscarFicha:"Fichas de departamentos",buscarEncomienda:"Buscar encomienda",preguntaSecreta:"Pregunta secreta",informarPago:"Informar pago",restringido:"Persona sin acceso autorizado",nuevaComunidad:"Nueva comunidad",detalleComunidad:"Detalle de la comunidad",bloqueReserva:"Nuevo bloque horario",invitadosReserva:"Invitados de la reserva",invitadoReserva:"Agregar invitado",visitaProgramada:"Avisar una visita",editarPropiedad:"Datos de la propiedad",documento:"Nuevo documento"},modalSaveLabels={solicitud:"Enviar solicitud",incidenciaStaff:"Registrar",aviso:"Publicar aviso",encomienda:"Registrar",visita:"Registrar",vehiculo:"Registrar",acceso:"Registrar",novedad:"Registrar novedad",reserva:"Reservar",residente:"Guardar",conserje:"Guardar",cobroMensual:"Generar",tipoMulta:"Guardar tipo",aplicarMulta:"Aplicar multa",movimientoContable:"Registrar",proveedor:"Guardar",mantencion:"Programar",familiar:"Agregar",vehiculoRegistrado:"Guardar",preguntaSecreta:"Guardar",informarPago:"Informar pago",restringido:"Agregar",nuevaComunidad:"Crear comunidad",bloqueReserva:"Guardar bloque",invitadoReserva:"Agregar",visitaProgramada:"Guardar",editarPropiedad:"Guardar",documento:"Publicar"},modalViewOnly=["contacto","detalleResidente","notificaciones","buscarFicha","buscarEncomienda","invitadosReserva","detalleComunidad","confirmarRetiro","mostrarCodigoEncomienda"];function notifTone(e){const t=EMOJI_ICON_MAP[e]||e;return["triangle-alert","siren","ban"].includes(t)?"is-warning":["circle-check"].includes(t)?"is-success":""}const modalFormBuilders={solicitud:()=>`
        <div class="form-group">
            <label>Tipo de solicitud</label>
            <select id="mSolicitudTipo" class="form-control">
                <option>Problema de mantención</option>
                <option>Ruidos molestos</option>
                <option>Problema en área común</option>
                <option>Problema de seguridad</option>
                <option>Otro</option>
            </select>
        </div>
        <div class="form-group">
            <label>Descripción</label>
            <textarea id="mSolicitudDescripcion"
                      class="form-control"
                      placeholder="Describe el problema..."></textarea>
        </div>
        <div class="form-group">
            <label>Foto (opcional)</label>
            <input class="form-control" type="file" accept="image/*" disabled>
            <div style="font-size:11px;color:var(--muted);margin-top:5px">
                Disponible cuando conectemos almacenamiento en la nube.
            </div>
        </div>
    `,incidenciaStaff:()=>`
        <div class="form-group">
            <label>Categoría</label>
            <select id="mIncidenciaTipo" class="form-control">
                <option>Problema de mantención</option>
                <option>Ruidos molestos</option>
                <option>Problema en área común</option>
                <option>Problema de seguridad</option>
                <option>Otro</option>
            </select>
        </div>
        <div class="form-group">
            <label>Departamento</label>
            <input id="mIncidenciaDepto"
                   class="form-control"
                   placeholder="Ej: 804">
        </div>
        <div class="form-group">
            <label>Descripción</label>
            <textarea id="mIncidenciaDescripcion"
                      class="form-control"
                      placeholder="Describe la incidencia..."></textarea>
        </div>
        <div class="form-group">
            <label>Foto (opcional)</label>
            <input class="form-control" type="file" accept="image/*" disabled>
            <div style="font-size:11px;color:var(--muted);margin-top:5px">
                Disponible cuando conectemos almacenamiento en la nube.
            </div>
        </div>
    `,aviso:()=>`
        <div class="form-group">
            <label>Título</label>
            <input id="mAvisoTitulo"
                   class="form-control"
                   placeholder="Ej: Corte de agua programado">
        </div>
        <div class="form-group">
            <label>Categoría</label>
            <select id="mAvisoTipo" class="form-control">
                <option>Importante</option>
                <option>Mantención</option>
                <option>General</option>
            </select>
        </div>
        <div class="form-group">
            <label>Descripción</label>
            <textarea id="mAvisoDescripcion"
                      class="form-control"
                      placeholder="Detalle del aviso..."></textarea>
        </div>
    `,documento:()=>`
        <div class="form-group">
            <label>Ícono (un emoji)</label>
            <input id="mDocumentoIcon"
                   class="form-control"
                   placeholder="📄"
                   value="📄">
        </div>
        <div class="form-group">
            <label>Título</label>
            <input id="mDocumentoTitulo"
                   class="form-control"
                   placeholder="Ej: Reglamento de copropiedad">
        </div>
        <div class="form-group">
            <label>Descripción corta</label>
            <input id="mDocumentoDescripcion"
                   class="form-control"
                   placeholder="Ej: Documento oficial de la comunidad">
        </div>
        <div class="form-group">
            <label>Contenido</label>
            <textarea id="mDocumentoContenido"
                      class="form-control"
                      style="min-height:140px"
                      placeholder="Texto completo del documento..."></textarea>
        </div>
    `,encomienda:()=>`
        <div class="form-group">
            <label>Empresa / origen</label>
            <input id="mEncomiendaTitulo"
                   class="form-control"
                   placeholder="Ej: Mercado Libre">
        </div>
        <div class="form-group">
            <label>Departamento destino</label>
            <input id="mEncomiendaDepto"
                   class="form-control"
                   placeholder="Ej: 804">
        </div>
        <div class="form-group">
            <label>Destinatario (opcional)</label>
            <input id="mEncomiendaDestinatario"
                   class="form-control"
                   placeholder="Nombre del residente">
        </div>
        <div class="form-group">
            <label>Número de seguimiento (opcional)</label>
            <input id="mEncomiendaTracking"
                   class="form-control"
                   placeholder="Ej: CL123456789">
        </div>
    `,visita:()=>`
        <div class="form-group">
            <label>Nombre del visitante</label>
            <input id="mVisitaNombre"
                   class="form-control"
                   placeholder="Nombre completo"
                   ${mcEvento("input", "chequearRestriccionVisita")}>
        </div>
        <div class="form-group">
            <label>RUT del visitante</label>
            <input id="mVisitaRut"
                   class="form-control"
                   placeholder="Ej: 12.345.678-5"
                   ${mcEvento("input", "mcValidarRutVisita")}>
            <small id="mVisitaRutError" class="field-error hidden">RUT inválido. Verifica el número y el dígito verificador.</small>
        </div>
        <div class="form-group">
            <label>Departamento destino</label>
            <input id="mVisitaDepto"
                   class="form-control"
                   placeholder="Ej: 302"
                   ${mcEvento("input", "chequearRestriccionVisita")}>
        </div>
        <div class="form-group">
            <label>Motivo (opcional)</label>
            <input id="mVisitaMotivo"
                   class="form-control"
                   placeholder="Ej: Visita familiar">
        </div>
        <div id="mVisitaAlerta"></div>
    `,visitaProgramada:e=>`
        <div class="form-group">
            <label>Departamento</label>
            <input class="form-control" value="${esc(e.depto)}" disabled>
        </div>
        <div class="form-group">
            <label>Nombre de quien te va a visitar</label>
            <input id="mVisitaProgNombre"
                   class="form-control"
                   placeholder="Nombre completo">
        </div>
        <div class="form-group">
            <label>RUT (opcional)</label>
            <input id="mVisitaProgRut"
                   class="form-control"
                   placeholder="Ej: 12.345.678-5"
                   ${mcEvento("input", "mcValidarRutCampo")}>
            <small id="mVisitaProgRutError" class="field-error hidden">RUT inválido. Verifica el número y el dígito verificador.</small>
        </div>
        <div class="form-group">
            <label>Fecha</label>
            <input id="mVisitaProgFecha" type="date" class="form-control">
        </div>
        <div class="form-group">
            <label>Hora (opcional)</label>
            <input id="mVisitaProgHora" type="time" class="form-control">
        </div>
        <div class="form-group">
            <label>Motivo (opcional)</label>
            <input id="mVisitaProgMotivo"
                   class="form-control"
                   placeholder="Ej: Visita familiar">
        </div>
    `,vehiculo:()=>`
        <div class="form-group">
            <label>Patente</label>
            <input id="mVehiculoPatente"
                   class="form-control"
                   placeholder="Ej: AB-CD-12"
                   style="text-transform:uppercase">
        </div>
        <div class="form-group">
            <label>Departamento</label>
            <input id="mVehiculoDepto"
                   class="form-control"
                   placeholder="Ej: 804">
        </div>
        <div class="form-group">
            <label>Movimiento</label>
            <select id="mVehiculoTipo" class="form-control">
                <option>Ingreso</option>
                <option>Salida</option>
            </select>
        </div>
    `,vehiculoRegistrado:()=>`
        <div class="form-group">
            <label>Patente</label>
            <input id="mVehRegPatente"
                   class="form-control"
                   placeholder="Ej: AB-CD-12"
                   style="text-transform:uppercase">
        </div>
        <div class="form-group">
            <label>Departamento (opcional)</label>
            <input id="mVehRegDepto"
                   class="form-control"
                   placeholder="Ej: 804">
        </div>
        <div class="form-group">
            <label>Categoría</label>
            <select id="mVehRegCategoria" class="form-control">
                <option>Recurrente</option>
                <option>Sospechoso</option>
            </select>
        </div>
        <div class="form-group">
            <label>Notas (opcional)</label>
            <textarea id="mVehRegNotas"
                      class="form-control"
                      placeholder="Ej: vehículo del arrendatario, avistado merodeando, etc."></textarea>
        </div>
    `,acceso:()=>`
        <div class="form-group">
            <label>Nombre</label>
            <input id="mAccesoNombre"
                   class="form-control"
                   placeholder="Nombre de la persona"
                   ${mcEvento("input", "chequearRestriccionAcceso")}>
        </div>
        <div class="form-group">
            <label>RUT</label>
            <input id="mAccesoRut"
                   class="form-control"
                   placeholder="Ej: 12.345.678-5"
                   ${mcEvento("input", "mcValidarRutAcceso")}>
            <small id="mAccesoRutError" class="field-error hidden">RUT inválido. Verifica el número y el dígito verificador.</small>
        </div>
        <div class="form-group">
            <label>Motivo</label>
            <input id="mAccesoMotivo"
                   class="form-control"
                   placeholder="Ej: Proveedor, contratista, delivery...">
        </div>
        <div class="form-group">
            <label>Movimiento</label>
            <select id="mAccesoTipo" class="form-control">
                <option>Entrada</option>
                <option>Salida</option>
            </select>
        </div>
        <div id="mAccesoAlerta"></div>
    `,contacto:()=>`
        <div class="form-group">
            <label>Buscar por departamento o nombre</label>
            <input id="mContactoBusqueda"
                   class="form-control"
                   placeholder="Ej: 804 o Marcelo"
                   ${mcEvento("input", "renderDirectorioContacto")}>
        </div>
        <div id="directorioContactoLista"></div>
    `,buscarFicha:()=>`
        <div class="form-group">
            <label>Buscar departamento o residente</label>
            <input id="mBuscarFichaTexto"
                   class="form-control"
                   placeholder="Ej: 804 o Marcelo"
                   ${mcEvento("input", "renderBuscarFicha")}>
        </div>
        <p style="font-size:12px;color:var(--muted);margin-top:-6px;margin-bottom:14px">
            Antes de compartir familiares o historial de accesos, verifica la identidad de quien consulta.
        </p>
        <div id="buscarFichaLista"></div>
    `,buscarEncomienda:()=>`
        <div class="form-group">
            <label>Buscar por nombre, destinatario o departamento</label>
            <input id="mBuscarEncomiendaTexto"
                   class="form-control"
                   placeholder="Ej: 804 o Mercado Libre"
                   ${mcEvento("input", "renderBuscarEncomienda")}>
        </div>
        <div id="buscarEncomiendaLista"></div>
    `,residente:()=>`
        <div class="form-group">
            <label>Departamento</label>
            <input id="mResidenteDepto"
                   class="form-control"
                   placeholder="Ej: 501">
        </div>
        <div class="form-group">
            <label>Nombre del residente</label>
            <input id="mResidenteNombre"
                   class="form-control"
                   placeholder="Nombre completo">
        </div>
        <div class="form-group">
            <label>RUT</label>
            <input id="mResidenteRut"
                   class="form-control"
                   placeholder="Ej: 12.345.678-5"
                   ${mcEvento("input", "mcValidarRutCampo")}>
            <small id="mResidenteRutError" class="field-error hidden">RUT inválido. Verifica el número y el dígito verificador.</small>
        </div>
        <div class="form-group">
            <label>Contraseña de acceso</label>
            <input id="mResidenteClave"
                   class="form-control"
                   type="text"
                   placeholder="Mínimo 6 caracteres">
            <small style="display:block;color:var(--muted);font-size:12px;margin-top:5px">
                El residente ingresará con su RUT y esta contraseña. Podrá pedirte que se la cambies después si la olvida.
            </small>
        </div>
        <div class="form-group">
            <label>Teléfono</label>
            <input id="mResidenteTelefono"
                   class="form-control"
                   placeholder="+56 9 ...">
        </div>
        <div class="form-group">
            <label>Estado</label>
            <select id="mResidenteEstado" class="form-control">
                <option>Activo</option>
                <option>Pendiente</option>
            </select>
        </div>
        <div class="form-group">
            <label>Pregunta secreta (opcional)</label>
            <input id="mResidentePregunta"
                   class="form-control"
                   placeholder="Ej: ¿Nombre de tu primera mascota?">
            <small style="display:block;color:var(--muted);font-size:12px;margin-top:5px">
                Se usará para verificar la identidad de este residente cuando consulte su registro en conserjería.
            </small>
        </div>
        <div class="form-group">
            <label>Respuesta secreta (opcional)</label>
            <input id="mResidenteRespuesta"
                   class="form-control"
                   placeholder="Solo el residente debería conocerla">
        </div>
    `,informarPago:e=>`
        <div class="form-group">
            <label>Qué estás pagando</label>
            <input class="form-control" value="${esc(e.etiqueta)} · ${esc(formatCLP(e.monto))}" disabled>
        </div>
        <div class="form-group">
            <label>Cómo pagaste</label>
            <select id="mPagoMetodo" class="form-control">
                ${METODOS_PAGO.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join("")}
            </select>
        </div>
        <div class="form-group">
            <label>Fecha del pago</label>
            <input id="mPagoFecha" class="form-control" type="date" value="${esc(hoyISO())}" max="${esc(hoyISO())}">
        </div>
        <div class="form-group">
            <label>N° de operación / comprobante</label>
            <input id="mPagoReferencia" class="form-control" placeholder="Ej: 0012345678" autocomplete="off" maxlength="60">
        </div>
        <p style="font-size:12px;color:var(--muted);line-height:1.5">
            Administración revisará el pago contra la cartola del edificio. Mientras tanto
            quedará como <strong>Por confirmar</strong>.
        </p>
    `,preguntaSecreta:e=>`
        <div class="form-group">
            <label>Departamento</label>
            <input class="form-control" value="${esc(e.depto)}" disabled>
        </div>
        <div class="form-group">
            <label>Pregunta secreta</label>
            <input id="mSeguridadPregunta"
                   class="form-control"
                   placeholder="Ej: ¿Nombre de tu primera mascota?"
                   value="${esc(e.preguntaSecreta||"")}">
        </div>
        <div class="form-group">
            <label>Respuesta secreta</label>
            <input id="mSeguridadRespuesta"
                   class="form-control"
                   placeholder="Escribe la respuesta (solo tú deberías conocerla)"
                   autocomplete="off">
        </div>
        <p style="font-size:12px;color:var(--muted)">
            Conserjería te pedirá esta respuesta antes de entregar información sobre quién entró o salió de tu departamento.
        </p>
    `,familiar:e=>`
        <div class="form-group">
            <label>Departamento</label>
            <input class="form-control" value="${esc(e.depto)}" disabled>
        </div>
        <div class="form-group">
            <label>Nombre del familiar</label>
            <input id="mFamiliarNombre"
                   class="form-control"
                   placeholder="Nombre completo">
        </div>
        <div class="form-group">
            <label>RUT</label>
            <input id="mFamiliarRut"
                   class="form-control"
                   placeholder="Ej: 12.345.678-5"
                   ${mcEvento("input", "mcValidarRutCampo")}>
            <small id="mFamiliarRutError" class="field-error hidden">RUT inválido. Verifica el número y el dígito verificador.</small>
        </div>
        <div class="form-group">
            <label>Parentesco</label>
            <select id="mFamiliarParentesco" class="form-control">
                <option>Cónyuge/Pareja</option>
                <option>Hijo/a</option>
                <option>Padre/Madre</option>
                <option>Hermano/a</option>
                <option>Arrendatario/a</option>
                <option>Otro</option>
            </select>
        </div>
    `,restringido:e=>`
        <div class="form-group">
            <label>Departamento</label>
            <input class="form-control" value="${esc(e.depto)}" disabled>
        </div>
        <div class="form-group">
            <label>Nombre de la persona</label>
            <input id="mRestringidoNombre"
                   class="form-control"
                   placeholder="Nombre completo">
        </div>
        <div class="form-group">
            <label>RUT (opcional, recomendado)</label>
            <input id="mRestringidoRut"
                   class="form-control"
                   placeholder="Ej: 12.345.678-5"
                   ${mcEvento("input", "mcValidarRutCampo")}>
            <small id="mRestringidoRutError" class="field-error hidden">RUT inválido. Verifica el número y el dígito verificador.</small>
        </div>
        <div class="form-group">
            <label>Motivo (opcional)</label>
            <textarea id="mRestringidoMotivo"
                      class="form-control"
                      placeholder="Ej: orden de alejamiento, conflicto familiar, etc."></textarea>
        </div>
        <p style="font-size:12px;color:var(--muted)">
            Conserjería recibirá una alerta inmediata si esta persona intenta registrar su ingreso a este departamento.
        </p>
    `,conserje:()=>`
        <div class="form-group">
            <label>Nombre</label>
            <input id="mConserjeNombre"
                   class="form-control"
                   placeholder="Nombre completo">
        </div>
        <div class="form-group">
            <label>RUT</label>
            <input id="mConserjeRut"
                   class="form-control"
                   placeholder="Ej: 12.345.678-5"
                   ${mcEvento("input", "mcValidarRutCampo")}>
            <small id="mConserjeRutError" class="field-error hidden">RUT inválido. Verifica el número y el dígito verificador.</small>
        </div>
        <div class="form-group">
            <label>Contraseña de acceso</label>
            <input id="mConserjeClave"
                   class="form-control"
                   type="text"
                   placeholder="Mínimo 6 caracteres">
            <small style="display:block;color:var(--muted);font-size:12px;margin-top:5px">
                El conserje ingresará con su RUT y esta contraseña.
            </small>
        </div>
        <div class="form-group">
            <label>Turno</label>
            <input id="mConserjeTurno"
                   class="form-control"
                   placeholder="Ej: Día (08:00 - 20:00)">
        </div>
        <div class="form-group">
            <label>Teléfono</label>
            <input id="mConserjeTelefono"
                   class="form-control"
                   placeholder="+56 9 ...">
        </div>
        <div class="form-group">
            <label>Estado</label>
            <select id="mConserjeEstado" class="form-control">
                <option>En turno</option>
                <option>Fuera de turno</option>
            </select>
        </div>
        <div class="form-group">
            <label>Sueldo mensual (CLP)</label>
            <input id="mConserjeSueldo"
                   class="form-control"
                   type="number"
                   value="480000">
        </div>
    `,detalleResidente:e=>fichaDeptoHtml(e),novedad:()=>`
        <div class="form-group">
            <label>Novedad</label>
            <textarea id="mNovedadTexto"
                      class="form-control"
                      placeholder="Describe lo ocurrido durante el turno..."></textarea>
        </div>
    `,reserva:e=>`
        <div class="form-group">
            <label>Espacio</label>
            <input class="form-control" value="${esc(e.place)}" disabled>
        </div>
        <div class="form-group">
            <label>Fecha</label>
            <input id="mReservaFecha" type="date" class="form-control"
                   ${mcEvento("change", "actualizarBloquesReservaModal", e.place)}>
        </div>
        <div class="form-group">
            <label>Bloque horario</label>
            <div id="mReservaBloquesList">
                <p style="font-size:13px;color:var(--muted)">Elige una fecha para ver los bloques disponibles.</p>
            </div>
        </div>
        ${tieneGastosComunesAtrasados(profile.depto)?`
                <p style="font-size:12px;color:var(--danger)">
                    ${icon("triangle-alert")} Tu departamento tiene gastos comunes atrasados. Ponte al día en "Gastos comunes" antes de reservar.
                </p>
            `:`
                <p style="font-size:12px;color:var(--muted)">
                    Después de reservar podrás agregar la lista de invitados desde "Mis próximas reservas".
                </p>
            `}
    `,invitadoReserva:()=>`
        <div class="form-group">
            <label>Nombre del invitado</label>
            <input id="mInvitadoNombre"
                   class="form-control"
                   placeholder="Nombre completo">
        </div>
        <div class="form-group">
            <label>RUT (opcional)</label>
            <input id="mInvitadoRut"
                   class="form-control"
                   placeholder="Ej: 12.345.678-5"
                   ${mcEvento("input", "mcValidarRutCampo")}>
            <small id="mInvitadoRutError" class="field-error hidden">RUT inválido. Verifica el número y el dígito verificador.</small>
        </div>
        <p style="font-size:12px;color:var(--muted)">
            Conserjería podrá revisar esta lista cuando tus invitados lleguen al edificio.
        </p>
    `,invitadosReserva:e=>`
        <div class="form-group">
            <label>Reserva</label>
            <div style="font-size:14px">${esc(e.lugar)} · ${esc(e.fecha)} · ${esc(e.hora)}${esc(e.depto?" · Depto "+e.depto:"")}</div>
        </div>
        <div class="form-group">
            <label>Invitados (${esc((e.invitados||[]).length)})</label>
            ${(e.invitados||[]).length?e.invitados.map((t,o)=>`
                        <div class="list-item">
                            <div class="list-icon">${icon("👤")}</div>
                            <div class="list-content">
                                <div class="list-title">${esc(t.nombre)}</div>
                                <div class="list-meta">${esc(t.rut||"Sin RUT")}</div>
                            </div>
                            <button class="outline-btn" ${mcEvento("click", "quitarInvitadoReserva", e.id, o)}>
                                Quitar
                            </button>
                        </div>
                    `).join(""):'<div style="font-size:13px;color:var(--muted);margin-bottom:8px">Todavía no agregas invitados.</div>'}
            <button class="outline-btn" style="margin-top:8px" ${mcEvento("click", "abrirModalInvitado", e.id)}>
                + Agregar invitado
            </button>
        </div>
    `,notificaciones:()=>{const e=notificacionesRelevantes();return e.length?e.map(t=>{const o=!(t.leidaPor||[]).includes(currentUid);return`
            <div class="notif-item ${esc(o?"is-unread":"")}">
                <div class="notif-icon ${esc(notifTone(t.icon))}">${icon(t.icon)}</div>
                <div class="list-content">
                    <div class="notif-title">${esc(t.titulo)}</div>
                    <div class="notif-meta">${esc(t.meta)} · ${esc(t.fecha)} ${esc(t.hora)}</div>
                </div>
                ${o?'<span class="notif-dot"></span>':""}
            </div>
        `}).join(""):`
                <div class="empty">
                    <div class="empty-icon">${icon("🔔")}</div>
                    <p>Estás al día - no tienes notificaciones nuevas.</p>
                </div>
            `},cobroMensual:()=>`
        <div class="form-group">
            <label>Monto por depto (CLP)</label>
            <input id="mCobroMonto"
                   class="form-control"
                   type="number"
                   value="45000">
        </div>
        <div class="form-group">
            <label>Fecha de vencimiento</label>
            <input id="mCobroVencimiento"
                   class="form-control"
                   type="date"
                   value="${esc(periodoActual())}-25">
        </div>
        <p style="font-size:12px;color:var(--muted)">
            Se generará el cobro de ${esc(periodoLabel(periodoActual()))} para los departamentos
            que aún no lo tengan.
        </p>
    `,tipoMulta:()=>`
        <div class="form-group">
            <label>Nombre de la multa</label>
            <input id="mTipoMultaNombre"
                   class="form-control"
                   placeholder="Ej: Ruidos molestos">
        </div>
        <div class="form-group">
            <label>Monto sugerido (CLP)</label>
            <input id="mTipoMultaMonto"
                   class="form-control"
                   type="number"
                   placeholder="Ej: 30000">
        </div>
        <p style="font-size:12px;color:var(--muted)">
            El monto queda como sugerencia: al aplicar la multa a un departamento se puede ajustar.
        </p>
    `,aplicarMulta:()=>`
        <div class="form-group">
            <label>Departamento</label>
            <select id="mAplicarMultaDepto" class="form-control">
                ${residentesDirectorio.map(e=>`<option value="${esc(e.depto)}">Depto ${esc(e.depto)} - ${esc(e.nombre)}</option>`).join("")}
            </select>
        </div>
        <div class="form-group">
            <label>Tipo de multa</label>
            <select id="mAplicarMultaTipo" class="form-control" ${mcEvento("change", "actualizarMontoSugeridoMulta")}>
                ${tiposMulta.filter(e=>e.activo!==!1).map(e=>`<option value="${esc(e.id)}" data-monto="${esc(e.monto)}">${esc(e.nombre)}</option>`).join("")}
            </select>
        </div>
        ${tiposMulta.filter(e=>e.activo!==!1).length?"":`
                <p style="font-size:12px;color:var(--danger)">
                    Todavía no hay ningún tipo de multa activo - crea uno primero en "Tipos de multa configurados".
                </p>
            `}
        <div class="form-group">
            <label>Monto (CLP)</label>
            <input id="mAplicarMultaMonto"
                   class="form-control"
                   type="number"
                   value="${esc(tiposMulta.find(e=>e.activo!==!1)?tiposMulta.find(e=>e.activo!==!1).monto:"")}">
        </div>
        <div class="form-group">
            <label>Fecha</label>
            <input id="mAplicarMultaFecha"
                   class="form-control"
                   type="date"
                   value="${esc(hoyISO())}">
        </div>
        <div class="form-group">
            <label>Detalle (opcional)</label>
            <textarea id="mAplicarMultaDetalle"
                      class="form-control"
                      placeholder="Ej: Ruido después de las 23:00 el 15/09"></textarea>
        </div>
        <p style="font-size:12px;color:var(--muted)">
            Se le avisará de inmediato a conserjería y al residente del departamento.
        </p>
    `,confirmarRetiro:()=>{if(!confirmarRetiroPaquete)return`
                <div class="form-group">
                    <label>Escanea el QR del residente</label>
                    <div style="position:relative;border-radius:10px;overflow:hidden;background:#000;max-width:280px;margin:0 auto 10px;aspect-ratio:1">
                        <video id="qrScanVideo" style="width:100%;height:100%;object-fit:cover" playsinline muted></video>
                    </div>
                    <p id="qrScanEstado" style="text-align:center;font-size:12px;color:var(--muted)">
                        Iniciando cámara…
                    </p>
                </div>
                <div style="text-align:center;color:var(--muted);font-size:12px;margin:14px 0">
                    — o ingresa el código a mano —
                </div>
                <div class="form-group">
                    <label>Código de la encomienda</label>
                    <div style="display:flex;gap:8px">
                        <input id="mRetiroCodigoManual"
                               class="form-control"
                               placeholder="PAQ-2026-000458"
                               style="text-transform:uppercase">
                        <button class="outline-btn" style="width:auto" ${mcEvento("click", "buscarEncomiendaPorCodigo")}>
                            Buscar
                        </button>
                    </div>
                </div>
            `;const e=confirmarRetiroPaquete,t=residentesDirectorio.find(a=>a.depto===e.depto),o=(t&&t.familiares||[]).map((a,i)=>`<option value="familiar:${esc(i)}">${esc(a.nombre)} (familiar)</option>`).join("");return`
            <div class="callout" style="margin-bottom:16px">
                <b>${esc(e.codigo)}</b><br>
                ${esc(e.title)} · Depto ${esc(e.depto)}${esc(e.destinatario?" · "+e.destinatario:"")}
            </div>
            <div class="form-group">
                <label>¿Quién retira?</label>
                <select id="mRetiroQuien" class="form-control" ${mcEvento("change", "actualizarCampoRetiroOtro")}>
                    <option value="titular">El propio residente${esc(t?" ("+t.nombre+")":"")}</option>
                    ${o}
                    <option value="otro">Otra persona</option>
                </select>
            </div>
            <div class="form-group hidden" id="mRetiroOtroGroup">
                <label>Nombre de quien retira</label>
                <input id="mRetiroOtroNombre"
                       class="form-control"
                       placeholder="Nombre completo">
            </div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:14px">
                Una vez confirmada, esta entrega queda cerrada y no se puede modificar.
            </p>
            <button class="primary-btn" ${mcEvento("click", "confirmarEntregaEncomienda")}>
                Confirmar entrega
            </button>
        `},mostrarCodigoEncomienda:e=>`
        <p style="text-align:center;font-size:13px;color:var(--muted);margin-bottom:14px">
            Muéstrale este código a conserjería al retirar tu encomienda.
        </p>
        <div style="display:flex;justify-content:center;margin-bottom:16px">
            ${generarQrSvg(e.qrToken,6)}
        </div>
        <div style="text-align:center;font-size:20px;font-weight:800;letter-spacing:0.5px;color:var(--primary-dark);margin-bottom:6px">
            ${esc(e.codigo)}
        </div>
        <p style="text-align:center;font-size:12px;color:var(--muted)">
            ${esc(e.title)}${esc(e.destinatario?" · "+e.destinatario:"")}
        </p>
    `,movimientoContable:()=>`
        <div class="form-group">
            <label>Tipo</label>
            <select id="mMovimientoTipo" class="form-control">
                <option value="Egreso">Egreso (gasto)</option>
                <option value="Ingreso">Ingreso</option>
            </select>
        </div>
        <div class="form-group">
            <label>Categoría</label>
            <select id="mMovimientoCategoria" class="form-control">
                <option value="Mantención">Mantención</option>
                <option value="Remuneraciones">Remuneraciones</option>
                <option value="Proveedores">Proveedores</option>
                <option value="Servicios básicos">Servicios básicos</option>
                <option value="Gasto común">Gasto común</option>
                <option value="Arriendo de espacios">Arriendo de espacios</option>
                <option value="Otro">Otro</option>
            </select>
        </div>
        <div class="form-group">
            <label>Descripción</label>
            <input id="mMovimientoDescripcion"
                   class="form-control"
                   type="text"
                   placeholder="Ej: Pago mantención ascensor">
        </div>
        <div class="form-group">
            <label>Monto (CLP)</label>
            <input id="mMovimientoMonto"
                   class="form-control"
                   type="number"
                   placeholder="0">
        </div>
        <div class="form-group">
            <label>Fecha</label>
            <input id="mMovimientoFecha"
                   class="form-control"
                   type="date"
                   value="${esc(hoyISO())}">
        </div>
    `,proveedor:()=>`
        <div class="form-group">
            <label>Nombre</label>
            <input id="mProveedorNombre"
                   class="form-control"
                   placeholder="Nombre de la empresa">
        </div>
        <div class="form-group">
            <label>Rubro</label>
            <select id="mProveedorRubro" class="form-control">
                <option>Ascensores</option>
                <option>Aseo</option>
                <option>Jardinería</option>
                <option>Eléctrico</option>
                <option>Gasfitería</option>
                <option>Seguridad</option>
                <option>Otro</option>
            </select>
        </div>
        <div class="form-group">
            <label>Teléfono</label>
            <input id="mProveedorTelefono"
                   class="form-control"
                   placeholder="+56 9 ...">
        </div>
        <div class="form-group">
            <label>Estado</label>
            <select id="mProveedorEstado" class="form-control">
                <option>Activo</option>
                <option>Inactivo</option>
            </select>
        </div>
    `,mantencion:()=>`
        <div class="form-group">
            <label>Proveedor</label>
            <select id="mMantencionProveedor" class="form-control">
                ${proveedoresDirectorio.map(e=>`<option value="${esc(e.nombre)}">${esc(e.nombre)} (${esc(e.rubro)})</option>`).join("")}
            </select>
        </div>
        <div class="form-group">
            <label>Tipo de mantención</label>
            <input id="mMantencionTipo"
                   class="form-control"
                   placeholder="Ej: Mantención preventiva">
        </div>
        <div class="form-group">
            <label>Descripción</label>
            <input id="mMantencionDescripcion"
                   class="form-control"
                   placeholder="Detalle del trabajo">
        </div>
        <div class="form-group">
            <label>Monto (CLP)</label>
            <input id="mMantencionMonto"
                   class="form-control"
                   type="number"
                   placeholder="0">
        </div>
        <div class="form-group">
            <label>Fecha programada</label>
            <input id="mMantencionFecha"
                   class="form-control"
                   type="date"
                   value="${esc(hoyISO())}">
        </div>
    `,nuevaComunidad:()=>`
        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">
            Esto crea el edificio en Firestore y, de una vez, la cuenta de su primer administrador.
        </p>
        <div class="form-group">
            <label>Nombre del edificio</label>
            <input id="mComunidadNombre"
                   class="form-control"
                   placeholder="Ej: Edificio Las Palmas">
        </div>
        <div class="form-group">
            <label>Identificador único (sin espacios ni tildes)</label>
            <input id="mComunidadId"
                   class="form-control"
                   placeholder="Ej: las-palmas"
                   ${mcEvento("input", "mcNormalizarIdComunidad")}>
            <small style="display:block;color:var(--muted);font-size:12px;margin-top:5px">
                Se usa internamente para identificar este edificio en la base de datos. No se puede cambiar después.
            </small>
        </div>
        <div class="form-group">
            <label>Dirección</label>
            <input id="mComunidadDireccion"
                   class="form-control"
                   placeholder="Ej: Av. Siempre Viva 742">
        </div>
        <div class="form-group">
            <label>Número de departamentos</label>
            <input id="mComunidadDeptos"
                   class="form-control"
                   type="number"
                   placeholder="Ej: 80">
        </div>
        <div class="form-group">
            <label>Teléfono de administración</label>
            <input id="mComunidadTelefono"
                   class="form-control"
                   placeholder="+56 9 ...">
        </div>
        <div class="form-group">
            <label>Plan contratado</label>
            <select id="mComunidadPlan" class="form-control">
                <option value="Básico">Básico</option>
                <option value="Profesional">Profesional</option>
                <option value="Enterprise">Enterprise</option>
            </select>
        </div>
        <h3 style="font-size:14px;margin:20px 0 10px">Primer administrador de este edificio</h3>
        <div class="form-group">
            <label>Nombre</label>
            <input id="mComunidadAdminNombre"
                   class="form-control"
                   placeholder="Nombre completo">
        </div>
        <div class="form-group">
            <label>RUT</label>
            <input id="mComunidadAdminRut"
                   class="form-control"
                   placeholder="Ej: 12.345.678-5"
                   ${mcEvento("input", "mcValidarRutCampo")}>
            <small id="mComunidadAdminRutError" class="field-error hidden">RUT inválido. Verifica el número y el dígito verificador.</small>
        </div>
        <div class="form-group">
            <label>Contraseña de acceso</label>
            <input id="mComunidadAdminClave"
                   class="form-control"
                   type="text"
                   placeholder="Mínimo 6 caracteres">
        </div>
    `,bloqueReserva:()=>`
        <div class="form-group">
            <label>Espacio</label>
            <select id="mBloqueLugar" class="form-control">
                <!-- Un <option> solo puede mostrar texto plano, no el SVG de icon() -
                     acá el emoji se deja tal cual a propósito. -->
                ${LUGARES_RESERVABLES.map(e=>`<option value="${esc(e.lugar)}">${esc(e.icon)} ${esc(e.lugar)}</option>`).join("")}
            </select>
        </div>
        <div class="form-group">
            <label>Nombre del bloque</label>
            <input id="mBloqueNombre" class="form-control" placeholder="Ej: Mañana">
        </div>
        <div class="form-group">
            <label>Hora de inicio</label>
            <input id="mBloqueHoraInicio" type="time" class="form-control">
        </div>
        <div class="form-group">
            <label>Hora de término</label>
            <input id="mBloqueHoraFin" type="time" class="form-control">
        </div>
    `,detalleComunidad:e=>{const t=e.estado==="Suspendida",o=e.apartments?Math.round((e.numResidentes||0)/e.apartments*100):0;return`
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
                <span class="badge ${esc(t?"badge-red":"badge-green")}" style="font-size:13px">
                    ${t?'<span class="status-dot status-dot-red"></span>Servicio suspendido':'<span class="status-dot status-dot-green"></span>Servicio activo'}
                </span>
                <button class="outline-btn" style="padding:6px 12px;font-size:13px${esc(t?"":";color:var(--danger);border-color:var(--danger)")}"
                        ${mcEvento("click", "toggleEstadoComunidad", e.id)}>
                    ${esc(t?"Reactivar servicio":"Suspender servicio")}
                </button>
            </div>
            <div class="stats" style="margin-bottom:16px">
                <div class="stat-card">
                    <div class="stat-number">${esc(e.apartments||0)}</div>
                    <div class="stat-label">Departamentos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${esc(e.numResidentes||0)}</div>
                    <div class="stat-label">Residentes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${esc(e.numConserjes||0)}</div>
                    <div class="stat-label">Conserjes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${esc(o)}%</div>
                    <div class="stat-label">Ocupación</div>
                </div>
            </div>
            <div class="form-group">
                <label>Dirección</label>
                <p style="font-size:14px;margin:0">${esc(e.address||"—")}</p>
            </div>
            <div class="form-group">
                <label>Administrador principal</label>
                <p style="font-size:14px;margin:0">${esc(e.adminNombre||"—")}</p>
            </div>
            <div class="form-group">
                <label>Teléfono de administración</label>
                <p style="font-size:14px;margin:0">${esc(e.telefonoAdministracion||"—")}</p>
            </div>
            <div class="form-group">
                <label>Fecha de contratación</label>
                <p style="font-size:14px;margin:0">${esc(formatFecha(e.fechaContratacion))}</p>
            </div>
            <div class="form-group">
                <label>Última actividad</label>
                <p style="font-size:14px;margin:0">${esc(formatUltimoAcceso(e.ultimoAcceso))}</p>
            </div>
            <div class="form-group">
                <label>Plan contratado</label>
                <div style="display:flex;gap:8px">
                    <select id="mComunidadDetallePlan" class="form-control">
                        <option value="Básico" ${esc(e.plan==="Básico"?"selected":"")}>Básico</option>
                        <option value="Profesional" ${esc(e.plan==="Profesional"?"selected":"")}>Profesional</option>
                        <option value="Enterprise" ${esc(e.plan==="Enterprise"?"selected":"")}>Enterprise</option>
                    </select>
                    <button class="outline-btn" style="width:auto" ${mcEvento("click", "guardarPlanComunidad", e.id)}>
                        Guardar
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label>Notas de soporte (uso interno de Nodar Logic)</label>
                <textarea id="mComunidadDetalleNotas"
                          class="form-control"
                          rows="3"
                          placeholder="Ej: pidió más plazo de pago, contacto alternativo, incidentes recurrentes...">${esc(e.notasSoporte||"")}</textarea>
                <button class="outline-btn" style="width:auto;margin-top:8px" ${mcEvento("click", "guardarNotasSoporteComunidad", e.id)}>
                    Guardar nota
                </button>
            </div>
            <p style="font-size:12px;color:var(--muted);margin-top:16px">
                Identificador interno: <code>${esc(e.id)}</code>
            </p>
        `}};function openModal(e,t){modalMode=e,modalContext=t||null;const o=modalViewOnly.includes(e);document.getElementById("modalTitle").textContent=modalTitles[e],document.getElementById("modalSaveBtn").textContent=modalSaveLabels[e]||"",document.getElementById("modalSaveBtn").classList.toggle("hidden",o),document.getElementById("modalCancelBtn").textContent=o?"Cerrar":"Cancelar",document.getElementById("modalBody").innerHTML=modalFormBuilders[e](t),document.getElementById("modalBackdrop").classList.toggle("is-drawer",e==="detalleResidente"),e==="detalleResidente"&&t&&(document.getElementById("modalTitle").textContent="Ficha del departamento "+t.depto),document.getElementById("modalBackdrop").classList.remove("hidden"),e==="contacto"&&renderDirectorioContacto(),e==="buscarFicha"&&renderBuscarFicha()}function openRequestModal(){openModal("solicitud")}function openIncidenciaStaffModal(){openModal("incidenciaStaff")}function openAvisoModal(){openModal("aviso")}function openEncomiendaModal(){openModal("encomienda")}function openVisitaModal(){openModal("visita")}async function registrarVisitaReal({nombre:e,rut:t,depto:o,motivo:a}){const i=buscarRestriccionEnDepto(o,e,t);try{await refComunidadActual().collection("visitas").add({nombre:e,rut:t||"",depto:o,motivo:a||"",fecha:hoyISO(),hora:nowTime(),restringido:!!i,ts:Date.now()})}catch(r){return console.error(r),showToast("No se pudo registrar la visita. Revisa tu conexión."),!1}return i?(addNovedad("🚫",`ALERTA: ${e} no tiene acceso autorizado`,`Depto ${o} · ${i.motivo||"Sin motivo especificado"} · ${nowTime()}`,"badge-red","Restringido"),crearNotificacion({icon:"🚫",titulo:`Acceso restringido: ${e} intentó ingresar al depto ${o}`,meta:i.motivo||"El residente no autorizó su ingreso",depto:o}),showToast(`${icon("ban")} Esta persona no tiene acceso autorizado a este departamento. Se generó una alerta.`),navigate("conserjeria"),!0):(addNovedad("🚪",`Visita: ${e}`,`Depto ${o} · ${nowTime()}${a?" · "+a:""}`,"",""),showToast("Visita registrada correctamente"),navigate("conserjeria"),!0)}function visitasProgramadasPendientes(e){return visitasProgramadas.filter(t=>t.depto===e&&t.estado==="Pendiente").sort((t,o)=>(t.fecha+(t.hora||"")).localeCompare(o.fecha+(o.hora||"")))}function abrirModalVisitaProgramada(e){openModal("visitaProgramada",{depto:e})}async function quitarVisitaProgramada(e){const t=visitasProgramadas.find(o=>o.id===e);if(t){visitasProgramadas.splice(visitasProgramadas.indexOf(t),1),renderPerfil();try{await refComunidadActual().collection("visitasProgramadas").doc(e).delete()}catch(o){console.error(o),showToast("No se pudo quitar la visita programada. Revisa tu conexión.")}}}async function marcarIngresoVisitaProgramada(e){const t=visitasProgramadas.find(a=>a.id===e);if(!(!t||!await registrarVisitaReal({nombre:t.nombre,rut:t.rut,depto:t.depto,motivo:t.motivo||"Visita programada"})))try{await refComunidadActual().collection("visitasProgramadas").doc(e).update({estado:"Ingresó"})}catch(a){console.error(a)}}function openVehiculoModal(){openModal("vehiculo")}function openAccesoModal(){openModal("acceso")}function openContactoModal(){openModal("contacto")}function openResidenteModal(){openModal("residente")}function openConserjeModal(){openModal("conserje")}function openNovedadModal(){openModal("novedad")}let reservaBloqueSeleccionado=null;function calcularDisponibilidadBloques(e,t){return bloquesReserva.filter(o=>o.lugar===e&&o.activo!==!1).map(o=>{const a=t+"_"+o.id,i=!bloquesOcupados.some(s=>s.id===a),r=reservas.find(s=>s.lugar===e&&s.fecha===t&&s.bloqueId===o.id);return{bloque:o,libre:i,depto:r?r.depto:null}})}function renderBloquesSeleccionables(e,t){if(!t)return'<p style="font-size:13px;color:var(--muted)">Elige una fecha para ver los bloques disponibles.</p>';const o=calcularDisponibilidadBloques(e,t);return o.length?o.map(a=>`
        <label style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;${esc(a.libre?"cursor:pointer":"opacity:0.55")}">
            <input type="radio"
                   name="mReservaBloque"
                   value="${esc(a.bloque.id)}"
                   ${esc(a.libre?"":"disabled")}
                   ${mcEvento("click", "mcSeleccionarBloque", a.bloque.id)}>
            <div style="flex:1">
                <strong>${esc(a.bloque.nombre)}</strong>
                <div style="font-size:12px;color:var(--muted)">${esc(a.bloque.horaInicio)} - ${esc(a.bloque.horaFin)}</div>
            </div>
            <span class="badge ${esc(a.libre?"badge-green":"badge-red")}">
                ${esc(a.libre?"Disponible":"Reservado")}
            </span>
        </label>
    `).join(""):'<p style="font-size:13px;color:var(--danger)">Administración todavía no configuró bloques horarios para este espacio.</p>'}function renderBloquesInfo(e,t){if(!e||!t)return'<p style="font-size:13px;color:var(--muted)">Elige un espacio y una fecha para ver la disponibilidad.</p>';const o=calcularDisponibilidadBloques(e,t);return o.length?o.map(a=>`
        <div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <div style="flex:1">
                <strong>${esc(a.bloque.nombre)}</strong>
                <div style="font-size:12px;color:var(--muted)">${esc(a.bloque.horaInicio)} - ${esc(a.bloque.horaFin)}</div>
            </div>
            <span class="badge ${esc(a.libre?"badge-green":"badge-red")}">
                ${esc(a.libre?"Disponible":"Reservado"+(a.depto?" · Depto "+a.depto:""))}
            </span>
        </div>
    `).join(""):'<p style="font-size:13px;color:var(--muted)">Administración todavía no configuró bloques horarios para este espacio.</p>'}function actualizarBloquesReservaModal(e){reservaBloqueSeleccionado=null;const t=document.getElementById("mReservaFecha").value,o=document.getElementById("mReservaBloquesList");o&&(o.innerHTML=renderBloquesSeleccionables(e,t))}function openReservaModal(e,t){reservaBloqueSeleccionado=null,openModal("reserva",{place:e,icon:t})}function abrirInvitadosReserva(e){const t=reservas.find(o=>o.id===e);t&&openModal("invitadosReserva",t)}function abrirModalInvitado(e){openModal("invitadoReserva",{reservaId:e})}async function quitarInvitadoReserva(e,t){const o=reservas.find(a=>a.id===e);if(!(!o||!o.invitados)){o.invitados.splice(t,1),openModal("invitadosReserva",o);try{await refComunidadActual().collection("reservas").doc(e).update({invitados:o.invitados})}catch(a){console.error(a),showToast("No se pudo guardar el cambio. Revisa tu conexión.")}}}function abrirModalFamiliar(e){openModal("familiar",{depto:e})}async function quitarFamiliar(e,t){const o=residentesDirectorio.find(a=>a.depto===e);if(!(!o||!o.familiares)){o.familiares.splice(t,1),showToast("Familiar eliminado de la ficha."),currentPage==="perfil"?renderPerfil():openModal("detalleResidente",o);try{await residenteDocRef(o).update({familiares:o.familiares})}catch(a){console.error(a),showToast("No se pudo guardar el cambio. Revisa tu conexión.")}}}function abrirModalRestringido(e){openModal("restringido",{depto:e})}async function quitarRestringido(e,t){const o=residentesDirectorio.find(a=>a.depto===e);if(!(!o||!o.restringidos)){o.restringidos.splice(t,1),showToast("Persona eliminada de la lista sin acceso autorizado."),currentPage==="perfil"?renderPerfil():openModal("detalleResidente",o);try{await residenteDocRef(o).update({restringidos:o.restringidos})}catch(a){console.error(a),showToast("No se pudo guardar el cambio. Revisa tu conexión.")}}}function abrirModalVehiculoRegistrado(){openModal("vehiculoRegistrado")}function historialAccesosDepto(e){const t=[];return visitas.filter(o=>o.depto===e).forEach(o=>t.push({icono:"🚶",titulo:"Visita: "+o.nombre,detalle:(o.rut?o.rut+" · ":"")+(o.motivo||"Sin motivo especificado"),fecha:fechaRegistro(o,"fecha"),hora:o.hora,restringido:!!o.restringido})),vehiculos.filter(o=>o.depto===e).forEach(o=>t.push({icono:"🚗",titulo:"Vehículo "+o.patente+" · "+o.tipo,detalle:"Registro de acceso vehicular",fecha:fechaRegistro(o,"fecha"),hora:o.hora})),encomiendas.filter(o=>o.depto===e).forEach(o=>t.push({icono:"📦",titulo:"Encomienda: "+o.title,detalle:o.destinatario?"Para "+o.destinatario:"Sin destinatario especificado",fecha:fechaRegistro(o,"date"),hora:o.time||""})),t.slice().reverse()}function buscarRestriccionEnDepto(e,t,o){const a=residentesDirectorio.find(s=>s.depto===e);if(!a||!a.restringidos||!a.restringidos.length)return null;const i=limpiarRut(o||""),r=(t||"").trim().toLowerCase();return a.restringidos.find(s=>{const n=limpiarRut(s.rut||""),c=(s.nombre||"").trim().toLowerCase();return n&&i&&n===i||c&&r&&c===r})||null}function buscarRestriccionGlobal(e,t){for(const o of residentesDirectorio){const a=buscarRestriccionEnDepto(o.depto,e,t);if(a)return{depto:o.depto,persona:a}}return null}function alertaRestriccionHtml(e,t){return`
        <div style="border:1px solid var(--danger);background:var(--danger-bg);border-radius:10px;padding:12px 14px;margin-top:6px">
            <strong style="font-size:13px;color:var(--danger)">${icon("ban")} Persona sin acceso autorizado${esc(t?" (Depto "+t+")":"")}</strong>
            <p style="font-size:12px;color:var(--danger-text);margin-top:4px">${esc(e)}</p>
        </div>
    `}function chequearRestriccionVisita(){const e=document.getElementById("mVisitaAlerta");if(!e)return;const t=document.getElementById("mVisitaNombre").value,o=document.getElementById("mVisitaRut").value,a=document.getElementById("mVisitaDepto").value.trim();if(!a){e.innerHTML="";return}const i=buscarRestriccionEnDepto(a,t,o);if(!i){e.innerHTML="";return}e.innerHTML=alertaRestriccionHtml(i.motivo||"El residente de este departamento no autorizó el ingreso de esta persona.",a)}function chequearRestriccionAcceso(){const e=document.getElementById("mAccesoAlerta");if(!e)return;const t=document.getElementById("mAccesoNombre").value,o=document.getElementById("mAccesoRut").value,a=buscarRestriccionGlobal(t,o);if(!a){e.innerHTML="";return}e.innerHTML=alertaRestriccionHtml(a.persona.motivo||"Un residente no autorizó el ingreso de esta persona.",a.depto)}function renderDirectorioContacto(){const e=document.getElementById("directorioContactoLista");if(!e)return;const t=(document.getElementById("mContactoBusqueda").value||"").trim().toLowerCase(),o=residentesDirectorio.filter(a=>a.depto.toLowerCase().includes(t)||a.nombre.toLowerCase().includes(t));if(!o.length){e.innerHTML=`
            <div class="empty">
                <div class="empty-icon">${icon("👤")}</div>
                <p>No se encontraron residentes.</p>
            </div>
        `;return}e.innerHTML=o.map(a=>`
        <div class="list-item">
            <div class="list-icon">${icon("👤")}</div>
            <div class="list-content">
                <div class="list-title">${esc(a.nombre)}</div>
                <div class="list-meta">Depto ${esc(a.depto)} · ${esc(a.telefono)}</div>
            </div>
            <a href="tel:${esc(a.telefono.replace(/\s+/g,""))}" class="outline-btn" style="text-decoration:none">
                ${icon("phone")} Llamar
            </a>
        </div>
    `).join("")}function abrirBuscarFicha(){openModal("buscarFicha")}function renderBuscarFicha(){const e=document.getElementById("buscarFichaLista");if(!e)return;const t=(document.getElementById("mBuscarFichaTexto").value||"").trim().toLowerCase(),o=residentesDirectorio.filter(a=>a.depto.toLowerCase().includes(t)||a.nombre.toLowerCase().includes(t));if(!o.length){e.innerHTML=`
            <div class="empty">
                <div class="empty-icon">${icon("🗂️")}</div>
                <p>No se encontraron departamentos.</p>
            </div>
        `;return}e.innerHTML=o.map(a=>`
        <div class="list-item">
            <div class="list-icon">${icon("🏠")}</div>
            <div class="list-content">
                <div class="list-title">Depto ${esc(a.depto)} · ${esc(a.nombre)} ${a.esAirbnb?'<span class="badge badge-yellow">Airbnb</span>':""}</div>
                <div class="list-meta">${esc(a.telefono)}</div>
            </div>
            <button class="outline-btn" ${mcEvento("click", "verFichaDesdeBusqueda", a.depto)}>
                Ver ficha
            </button>
        </div>
    `).join("")}function verFichaDesdeBusqueda(e){const t=residentesDirectorio.find(o=>o.depto===e);t&&openModal("detalleResidente",t)}function abrirBuscarEncomienda(){openModal("buscarEncomienda"),renderBuscarEncomienda()}function renderBuscarEncomienda(){const e=document.getElementById("buscarEncomiendaLista");if(!e)return;const t=(document.getElementById("mBuscarEncomiendaTexto").value||"").trim().toLowerCase(),o=encomiendas.filter(a=>a.depto.toLowerCase().includes(t)||a.title.toLowerCase().includes(t)||(a.destinatario||"").toLowerCase().includes(t));if(!o.length){e.innerHTML=`
            <div class="empty">
                <div class="empty-icon">${icon("📦")}</div>
                <p>No se encontraron encomiendas.</p>
            </div>
        `;return}e.innerHTML=o.map(a=>`
        <div class="list-item">
            <div class="list-icon">${icon("📦")}</div>
            <div class="list-content">
                <div class="list-title">${esc(a.title)}</div>
                <div class="list-meta">${esc(a.destinatario?a.destinatario+" · ":"")}Depto ${esc(a.depto)} · ${esc(fechaRegistro(a,"date"))} · ${esc(a.time)}</div>
            </div>
            <span class="badge ${esc(a.estado==="Retirado"?"":"badge-green")}">${esc(a.estado)}</span>
        </div>
    `).join("")}async function verificarIdentidadFicha(e){const t=document.getElementById("mFichaRespuesta"),o=(t?t.value:"").trim(),a=residentesDirectorio.find(i=>i.depto===e);if(a){if(!o){showToast("Escribe la respuesta de quien consulta.");return}try{const r=await functions.httpsCallable("verificarPreguntaSecretaMiComunidad")({comunidadId:community.id,uid:a.uid,respuesta:o});if(!r||!r.data||!r.data.ok){const s=r&&r.data?r.data.intentosRestantes:null;showToast("Respuesta incorrecta."+(s!=null?` Te quedan ${s} intento(s).`:""));return}}catch(i){console.error(i),showToast(i&&i.message?i.message:"No se pudo verificar la respuesta. Revisa tu conexión.");return}fichaVerificada[e]=!0,showToast("Identidad verificada correctamente."),openModal("detalleResidente",a)}}function mostrarFichaSinVerificar(e){fichaVerificada[e]=!0;const t=residentesDirectorio.find(o=>o.depto===e);t&&openModal("detalleResidente",t)}function abrirModalPreguntaSecreta(e){const t=residentesDirectorio.find(o=>o.depto===e);t&&openModal("preguntaSecreta",t)}function closeModal(){detenerEscaneoQR(),modalMode==="confirmarRetiro"&&confirmarRetiroPaquete&&confirmarRetiroPaquete.estado==="En proceso de entrega"&&refComunidadActual().collection("encomiendas").doc(confirmarRetiroPaquete.id).update({estado:"Recibido"}).catch(e=>console.error("No se pudo revertir la encomienda:",e)),confirmarRetiroPaquete=null,document.getElementById("modalBackdrop").classList.add("hidden"),modalMode=null,modalContext=null}let qrScanStream=null,qrScanRafId=null;function detenerEscaneoQR(){qrScanRafId&&(cancelAnimationFrame(qrScanRafId),qrScanRafId=null),qrScanStream&&(qrScanStream.getTracks().forEach(e=>e.stop()),qrScanStream=null)}let confirmarRetiroPaquete=null;function abrirEscanerRetiro(){confirmarRetiroPaquete=null,openModal("confirmarRetiro"),setTimeout(iniciarCamaraRetiro,50)}async function iniciarCamaraRetiro(){const e=document.getElementById("qrScanVideo"),t=document.getElementById("qrScanEstado");if(!e)return;try{await cargarJsQR()}catch(r){console.error(r),t&&(t.textContent="No se pudo cargar el lector de QR. Usa el código manual.");return}try{qrScanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})}catch(r){console.error(r),t&&(t.textContent="No se pudo acceder a la cámara. Usa el código manual.");return}e.srcObject=qrScanStream,await e.play(),t&&(t.textContent="Apunta al QR del residente");const o=document.createElement("canvas"),a=o.getContext("2d");function i(){if(document.getElementById("qrScanVideo")){if(e.readyState===e.HAVE_ENOUGH_DATA){o.width=e.videoWidth,o.height=e.videoHeight,a.drawImage(e,0,0,o.width,o.height);const r=a.getImageData(0,0,o.width,o.height),s=jsQR(r.data,r.width,r.height);if(s&&s.data){buscarEncomiendaPorToken(s.data);return}}qrScanRafId=requestAnimationFrame(i)}}qrScanRafId=requestAnimationFrame(i)}function buscarEncomiendaPorToken(e){const t=encomiendas.find(o=>o.qrToken===e&&o.estado==="Recibido");if(!t){showToast("Ese QR no corresponde a una encomienda pendiente de retiro");return}iniciarProcesoEntrega(t)}function buscarEncomiendaPorCodigo(){const t=document.getElementById("mRetiroCodigoManual").value.trim().toUpperCase();if(!t)return;const o=encomiendas.find(a=>a.codigo===t&&a.estado==="Recibido");if(!o){showToast("No se encontró una encomienda pendiente de retiro con ese código");return}iniciarProcesoEntrega(o)}async function iniciarProcesoEntrega(e){detenerEscaneoQR();try{await refComunidadActual().collection("encomiendas").doc(e.id).update({estado:"En proceso de entrega"})}catch(o){console.error(o),showToast("No se pudo iniciar la entrega. Revisa tu conexión.");return}confirmarRetiroPaquete=Object.assign({},e,{estado:"En proceso de entrega"});const t=document.getElementById("modalBody");t&&(t.innerHTML=modalFormBuilders.confirmarRetiro())}function actualizarCampoRetiroOtro(){const e=document.getElementById("mRetiroQuien"),t=document.getElementById("mRetiroOtroGroup");e&&t&&t.classList.toggle("hidden",e.value!=="otro")}async function confirmarEntregaEncomienda(){const e=confirmarRetiroPaquete;if(!e)return;const t=document.getElementById("mRetiroQuien").value,o=residentesDirectorio.find(n=>n.depto===e.depto);let a="",i="";if(t==="titular")a=o?o.nombre:e.destinatario||"Titular",i="Titular";else if(t==="otro"){if(a=document.getElementById("mRetiroOtroNombre").value.trim(),i="Otro",!a){showToast("Escribe el nombre de quien retira");return}}else if(t.indexOf("familiar:")===0){const n=parseInt(t.split(":")[1],10),c=o&&o.familiares?o.familiares[n]:null;a=c?c.nombre:"Familiar",i="Familiar"}const r=(conserjesDirectorio.find(n=>n.uid===currentUid)||{}).nombre||profile.nombre||"",s=Date.now();confirmarRetiroPaquete.estado="Entregado",closeModal();try{await refComunidadActual().collection("encomiendas").doc(e.id).update({estado:"Entregado",retiradoPor:{nombre:a,relacion:i},confirmadoPor:r,entregadoEn:s})}catch(n){console.error(n),showToast("No se pudo confirmar la entrega. Revisa tu conexión.");return}crearNotificacion({icon:"circle-check",titulo:"Encomienda retirada",meta:`${e.codigo} · Retirada por ${a} (${i})`,depto:e.depto}),addNovedad("circle-check","Encomienda entregada",`${e.codigo} · Depto ${e.depto} · ${a}`,"badge-green","Entregada"),showToast("Entrega confirmada"),renderConserjeria()}function nowTime(){return new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}function addNovedad(e,t,o,a,i){novedades.unshift({icon:e,title:t,meta:o,badgeClass:a||"",badgeText:i||""}),saveData("novedades",novedades)}function combinarNotificaciones(){const e=new Map;notifParaTodosCache.forEach(t=>e.set(t.id,t)),notifDeptoCache.forEach(t=>e.set(t.id,t)),notificaciones.length=0,notificaciones.push(...Array.from(e.values())),notificaciones.sort((t,o)=>(o.ts||0)-(t.ts||0)),actualizarContadorNotificaciones(),rerenderSiAppVisible()}function aplicarSnapshotNotificaciones(e){notificaciones.length=0,e.forEach(t=>{notificaciones.push(Object.assign({id:t.id},t.data()))}),notificaciones.sort((t,o)=>(o.ts||0)-(t.ts||0)),actualizarContadorNotificaciones(),rerenderSiAppVisible()}function aplicarSnapshotNotifParaTodos(e){notifParaTodosCache=[],e.forEach(t=>notifParaTodosCache.push(Object.assign({id:t.id},t.data()))),combinarNotificaciones()}function aplicarSnapshotNotifDepto(e){notifDeptoCache=[],e.forEach(t=>notifDeptoCache.push(Object.assign({id:t.id},t.data()))),combinarNotificaciones()}function notificacionesRelevantes(){return notificaciones}function actualizarContadorNotificaciones(){const e=document.getElementById("notifBadge");if(!e)return;const t=notificacionesRelevantes().filter(o=>!(o.leidaPor||[]).includes(currentUid)).length;t>0?(e.textContent=t>9?"9+":t,e.classList.remove("hidden")):e.classList.add("hidden")}async function crearNotificacion(e){const t={icon:e.icon,titulo:e.titulo,meta:e.meta||"",depto:e.depto||null,paraTodos:!!e.paraTodos,leidaPor:[],fecha:new Date().toLocaleDateString("es-CL"),hora:nowTime(),ts:Date.now()};try{await refComunidadActual().collection("notificaciones").add(t)}catch(o){console.error("No se pudo crear la notificación:",o)}}async function abrirNotificaciones(){openModal("notificaciones");const e=notificacionesRelevantes().filter(t=>!(t.leidaPor||[]).includes(currentUid));e.forEach(t=>{t.leidaPor||(t.leidaPor=[]),t.leidaPor.push(currentUid)}),actualizarContadorNotificaciones();for(const t of e)try{await refComunidadActual().collection("notificaciones").doc(t.id).update({leidaPor:firebase.firestore.FieldValue.arrayUnion(currentUid)})}catch(o){console.error("No se pudo marcar como leída la notificación:",o)}}function folioCorto(e){return(e||"").slice(-6).toUpperCase()}async function crearIncidencia(e){const t={categoria:e.categoria,descripcion:e.descripcion,depto:e.depto,origen:e.origen,estado:"Pendiente",fecha:new Date().toLocaleDateString("es-CL"),hora:nowTime(),ts:Date.now()};try{await refComunidadActual().collection("incidencias").add(t)}catch(o){return console.error(o),showToast("No se pudo enviar la solicitud. Revisa tu conexión."),null}return addNovedad("🔧",`Incidencia: ${t.categoria}`,`Depto ${t.depto} · ${t.hora} · ${t.origen}`,"badge-yellow","Pendiente"),t}async function avanzarEstadoIncidencia(e){const t=incidencias.find(r=>r.id===e);if(!t)return;const o=["Pendiente","En proceso","Resuelto"],a=o.indexOf(t.estado);if(a===o.length-1){showToast("Esta solicitud ya está resuelta");return}const i=o[a+1];try{await refComunidadActual().collection("incidencias").doc(e).update({estado:i})}catch(r){console.error(r),showToast("No se pudo actualizar la solicitud. Revisa tu conexión.");return}t.estado=i,crearNotificacion({icon:"🔧",titulo:`Tu solicitud #${folioCorto(t.id)} cambió a "${t.estado}"`,meta:t.categoria,depto:t.depto}),showToast(`Solicitud #${folioCorto(t.id)} ahora está "${t.estado}"`),modalMode==="detalleResidente"&&modalContext&&modalContext.depto===t.depto&&openModal("detalleResidente",modalContext),currentPage==="admin"&&renderAdmin()}function generarTokenAleatorio(){const e=new Uint8Array(16);return crypto.getRandomValues(e),Array.from(e,t=>t.toString(16).padStart(2,"0")).join("")}async function generarCodigoEncomienda(){const e=new Date().getFullYear(),t=refComunidadActual().collection("contadores").doc("encomiendas_"+e),o=await db.runTransaction(async a=>{const i=await a.get(t),s=(i.exists&&i.data().valor||0)+1;return a.set(t,{valor:s}),s});return`PAQ-${e}-${String(o).padStart(6,"0")}`}async function saveModal(){if(modalMode==="solicitud"){const e=document.getElementById("mSolicitudTipo").value,t=document.getElementById("mSolicitudDescripcion").value.trim();if(!t){showToast("Escribe una descripción del problema");return}await crearIncidencia({categoria:e,descripcion:t,depto:profile.depto,origen:"Residente"}),closeModal(),showToast("Solicitud enviada correctamente"),navigate("solicitudes")}else if(modalMode==="incidenciaStaff"){const e=document.getElementById("mIncidenciaTipo").value,t=document.getElementById("mIncidenciaDepto").value.trim(),o=document.getElementById("mIncidenciaDescripcion").value.trim();if(!t||!o){showToast("Completa el departamento y la descripción");return}await crearIncidencia({categoria:e,descripcion:o,depto:t,origen:"Conserjería"}),closeModal(),showToast("Incidencia registrada correctamente"),navigate("conserjeria")}else if(modalMode==="vehiculo"){const e=document.getElementById("mVehiculoPatente").value.trim().toUpperCase(),t=document.getElementById("mVehiculoDepto").value.trim(),o=document.getElementById("mVehiculoTipo").value;if(!e||!t){showToast("Completa la patente y el departamento");return}try{await refComunidadActual().collection("vehiculos").add({patente:e,depto:t,tipo:o,fecha:hoyISO(),hora:nowTime(),ts:Date.now()})}catch(i){console.error(i),showToast("No se pudo registrar el vehículo. Revisa tu conexión.");return}const a=vehiculosRegistrados.find(i=>i.patente===e);if(o==="Ingreso"&&a&&a.categoria==="Sospechoso"){addNovedad("🚨",`ALERTA: vehículo sospechoso ${e}`,`Depto ${t} · Ingreso · ${nowTime()}${a.notas?" · "+a.notas:""}`,"badge-red","Alerta"),crearNotificacion({icon:"🚨",titulo:`Vehículo sospechoso ingresó: ${e}`,meta:a.notas||`Registrado en depto ${t}`,paraTodos:!0}),closeModal(),showToast(`${icon("triangle-alert")} Vehículo marcado como SOSPECHOSO. Se generó una alerta.`),navigate("conserjeria");return}if(o==="Ingreso"&&a&&a.categoria==="Recurrente"){addNovedad("🚗",`Vehículo ${e} (recurrente)`,`Depto ${t} · ${o} · ${nowTime()}`,"badge-green","Reconocido"),closeModal(),showToast("Vehículo recurrente reconocido. Ingreso registrado."),navigate("conserjeria");return}addNovedad("🚗",`Vehículo ${e}`,`Depto ${t} · ${o} · ${nowTime()}`,"",""),closeModal(),showToast("Vehículo registrado correctamente"),navigate("conserjeria")}else if(modalMode==="vehiculoRegistrado"){const e=document.getElementById("mVehRegPatente").value.trim().toUpperCase(),t=document.getElementById("mVehRegDepto").value.trim(),o=document.getElementById("mVehRegCategoria").value,a=document.getElementById("mVehRegNotas").value.trim();if(!e){showToast("Completa la patente del vehículo");return}if(vehiculosRegistrados.some(i=>i.patente===e)){showToast("Esa patente ya está en la lista de vehículos registrados");return}try{await refComunidadActual().collection("vehiculosRegistrados").add({patente:e,depto:t,categoria:o,notas:a,ts:Date.now()})}catch(i){console.error(i),showToast("No se pudo agregar el vehículo. Revisa tu conexión.");return}closeModal(),showToast(`Vehículo agregado a la lista como "${o}"`),currentPage==="admin"?renderAdmin():navigate("conserjeria")}else if(modalMode==="acceso"){const e=document.getElementById("mAccesoNombre").value.trim(),t=document.getElementById("mAccesoRut").value.trim(),o=document.getElementById("mAccesoMotivo").value.trim(),a=document.getElementById("mAccesoTipo").value;if(!e||!o){showToast("Completa el nombre y el motivo");return}if(t&&!validarRut(t)){showToast("El RUT ingresado no es válido");return}const i=a==="Entrada"?buscarRestriccionGlobal(e,t):null;try{await refComunidadActual().collection("accesos").add({nombre:e,rut:t,motivo:o,tipo:a,fecha:hoyISO(),hora:nowTime(),restringido:!!i,ts:Date.now()})}catch(r){console.error(r),showToast("No se pudo registrar el acceso. Revisa tu conexión.");return}if(i){addNovedad("🚫",`ALERTA: acceso restringido - ${e}`,`Depto ${i.depto} no autoriza su ingreso · ${i.persona.motivo||"Sin motivo especificado"} · ${nowTime()}`,"badge-red","Restringido"),crearNotificacion({icon:"🚫",titulo:`Acceso restringido: ${e} intentó ingresar`,meta:`No autorizado por depto ${i.depto}`,paraTodos:!0}),closeModal(),showToast(`${icon("ban")} Esta persona no tiene acceso autorizado. Se generó una alerta.`),navigate("conserjeria");return}addNovedad("🔑",`${a}: ${e}`,`${o} · ${nowTime()}`,"",""),closeModal(),showToast("Acceso registrado correctamente"),navigate("conserjeria")}else if(modalMode==="residente"){const e=document.getElementById("mResidenteDepto").value.trim(),t=document.getElementById("mResidenteNombre").value.trim(),o=document.getElementById("mResidenteRut").value.trim(),a=document.getElementById("mResidenteClave").value,i=document.getElementById("mResidenteTelefono").value.trim(),r=document.getElementById("mResidenteEstado").value,s=document.getElementById("mResidentePregunta").value.trim(),n=document.getElementById("mResidenteRespuesta").value.trim();if(!e||!t||!i){showToast("Completa departamento, nombre y teléfono");return}if(!o||!validarRut(o)){showToast("Ingresa un RUT válido: lo usará para iniciar sesión");return}if(!a||a.length<6){showToast("La contraseña debe tener al menos 6 caracteres");return}if(residentesDirectorio.some(w=>w.depto===e)){showToast("Ya existe un residente registrado en ese departamento");return}const c=document.getElementById("modalSaveBtn");c.disabled=!0,c.textContent="Creando cuenta...";try{await functions.httpsCallable("crearCuentaMiComunidad")({comunidadId:community.id,rol:"residente",depto:e,nombre:t,rut:o,password:a,telefono:i,estado:r,preguntaSecreta:s,respuestaSecreta:n}),closeModal(),showToast("Residente agregado correctamente. Ya puede ingresar con su RUT."),renderAdmin()}catch(w){console.error(w);let $="No se pudo crear la cuenta del residente.";w&&w.code==="already-exists"?$="Ya existe una cuenta creada con ese RUT.":w&&w.message&&($=w.message),showToast($)}finally{c&&(c.disabled=!1,c.textContent="Guardar")}}else if(modalMode==="informarPago")await guardarPagoInformado();else if(modalMode==="preguntaSecreta"){const e=modalContext.depto,t=document.getElementById("mSeguridadPregunta").value.trim(),o=document.getElementById("mSeguridadRespuesta").value.trim();if(!t||!o){showToast("Completa la pregunta y la respuesta secreta");return}const a=residentesDirectorio.find(r=>r.depto===e);if(!a){showToast("No se encontró el departamento");return}const i=document.getElementById("modalSaveBtn");i.disabled=!0;try{await functions.httpsCallable("definirPreguntaSecretaMiComunidad")({comunidadId:community.id,uid:a.uid,pregunta:t,respuesta:o})}catch(r){console.error(r),i.disabled=!1,showToast(r&&r.message?r.message:"No se pudo guardar el cambio. Revisa tu conexión.");return}i.disabled=!1,a.preguntaSecreta=t,delete a.respuestaSecreta,closeModal(),showToast("Pregunta secreta guardada correctamente"),currentPage==="perfil"&&renderPerfil()}else if(modalMode==="familiar"){const e=modalContext.depto,t=document.getElementById("mFamiliarNombre").value.trim(),o=document.getElementById("mFamiliarRut").value.trim(),a=document.getElementById("mFamiliarParentesco").value;if(!t){showToast("Completa el nombre del familiar");return}if(o&&!validarRut(o)){showToast("El RUT ingresado no es válido");return}const i=residentesDirectorio.find(r=>r.depto===e);if(!i){showToast("No se encontró el departamento");return}i.familiares||(i.familiares=[]),i.familiares.push({nombre:t,rut:o,parentesco:a}),showToast("Familiar agregado a la ficha"),currentPage==="perfil"?(closeModal(),renderPerfil()):openModal("detalleResidente",i);try{await residenteDocRef(i).update({familiares:i.familiares})}catch(r){console.error(r),showToast("No se pudo guardar el cambio. Revisa tu conexión.")}}else if(modalMode==="restringido"){const e=modalContext.depto,t=document.getElementById("mRestringidoNombre").value.trim(),o=document.getElementById("mRestringidoRut").value.trim(),a=document.getElementById("mRestringidoMotivo").value.trim();if(!t){showToast("Completa el nombre de la persona");return}if(o&&!validarRut(o)){showToast("El RUT ingresado no es válido");return}const i=residentesDirectorio.find(r=>r.depto===e);if(!i){showToast("No se encontró el departamento");return}i.restringidos||(i.restringidos=[]),i.restringidos.push({nombre:t,rut:o,motivo:a}),showToast("Persona agregada a la lista sin acceso autorizado"),currentPage==="perfil"?(closeModal(),renderPerfil()):openModal("detalleResidente",i);try{await residenteDocRef(i).update({restringidos:i.restringidos})}catch(r){console.error(r),showToast("No se pudo guardar el cambio. Revisa tu conexión.")}}else if(modalMode==="conserje"){const e=document.getElementById("mConserjeNombre").value.trim(),t=document.getElementById("mConserjeRut").value.trim(),o=document.getElementById("mConserjeClave").value,a=document.getElementById("mConserjeTurno").value.trim(),i=document.getElementById("mConserjeTelefono").value.trim(),r=document.getElementById("mConserjeEstado").value,s=parseInt(document.getElementById("mConserjeSueldo").value,10)||0;if(!e||!a||!i){showToast("Completa nombre, turno y teléfono");return}if(!t||!validarRut(t)){showToast("Ingresa un RUT válido: lo usará para iniciar sesión");return}if(!o||o.length<6){showToast("La contraseña debe tener al menos 6 caracteres");return}const n=document.getElementById("modalSaveBtn");n.disabled=!0,n.textContent="Creando cuenta...";try{await functions.httpsCallable("crearCuentaMiComunidad")({comunidadId:community.id,rol:"conserje",nombre:e,rut:t,password:o,turno:a,telefono:i,estado:r,sueldo:s}),closeModal(),showToast("Conserje agregado correctamente. Ya puede ingresar con su RUT."),renderAdmin()}catch(c){console.error(c);let w="No se pudo crear la cuenta del conserje.";c&&c.code==="already-exists"?w="Ya existe una cuenta creada con ese RUT.":c&&c.message&&(w=c.message),showToast(w)}finally{n&&(n.disabled=!1,n.textContent="Guardar")}}else if(modalMode==="nuevaComunidad"){const e=document.getElementById("mComunidadNombre").value.trim(),t=document.getElementById("mComunidadId").value.trim(),o=document.getElementById("mComunidadDireccion").value.trim(),a=parseInt(document.getElementById("mComunidadDeptos").value,10)||0,i=document.getElementById("mComunidadTelefono").value.trim(),r=document.getElementById("mComunidadPlan").value,s=document.getElementById("mComunidadAdminNombre").value.trim(),n=document.getElementById("mComunidadAdminRut").value.trim(),c=document.getElementById("mComunidadAdminClave").value;if(!e||!t){showToast("Completa el nombre y el identificador del edificio");return}if(!/^[a-z0-9-]+$/.test(t)){showToast("El identificador solo puede tener minúsculas, números y guiones");return}if(!s||!n||!validarRut(n)){showToast("Completa un RUT válido para el primer administrador");return}if(!c||c.length<6){showToast("La contraseña del administrador debe tener al menos 6 caracteres");return}const w=document.getElementById("modalSaveBtn");w.disabled=!0,w.textContent="Creando...";try{await functions.httpsCallable("crearComunidadMiComunidad")({comunidadId:t,name:e,address:o,apartments:a,telefonoAdministracion:i,plan:r,adminNombre:s,adminRut:n,adminPassword:c}),closeModal(),showToast(`Comunidad "${e}" creada. Su administrador ya puede ingresar con su RUT.`),renderComunidades()}catch($){console.error($);let N="No se pudo crear la comunidad.";$&&$.code==="already-exists"?N="Ya existe una comunidad o una cuenta con esos datos.":$&&$.message&&(N=$.message),showToast(N)}finally{w&&(w.disabled=!1,w.textContent="Crear comunidad")}}else if(modalMode==="aviso"){const e=document.getElementById("mAvisoTitulo").value.trim(),t=document.getElementById("mAvisoTipo").value,o=document.getElementById("mAvisoDescripcion").value.trim();if(!e||!o){showToast("Completa el título y la descripción");return}try{await refComunidadActual().collection("avisos").add({categoria:t,title:e,meta:"Administración",date:hoyISO(),description:o,ts:Date.now()})}catch(a){console.error(a),showToast("No se pudo publicar el aviso. Revisa tu conexión.");return}addNovedad("📢",`Aviso: ${e}`,`${t} · ${nowTime()}`,categoriaAvisoConfig[t].badge,t),crearNotificacion({icon:categoriaAvisoConfig[t].icon,titulo:`Nuevo aviso: ${e}`,meta:t,paraTodos:!0}),closeModal(),showToast("Aviso publicado correctamente"),navigate("avisos")}else if(modalMode==="documento"){const e=document.getElementById("mDocumentoIcon").value.trim()||"📄",t=document.getElementById("mDocumentoTitulo").value.trim(),o=document.getElementById("mDocumentoDescripcion").value.trim(),a=document.getElementById("mDocumentoContenido").value.trim();if(!t||!a){showToast("Completa el título y el contenido");return}try{await refComunidadActual().collection("documentos").add({icon:e,titulo:t,descripcion:o,contenido:a,ts:Date.now()})}catch(i){console.error(i),showToast("No se pudo publicar el documento. Revisa tu conexión.");return}closeModal(),showToast("Documento publicado correctamente"),navigate("documentos")}else if(modalMode==="encomienda"){const e=document.getElementById("mEncomiendaTitulo").value.trim(),t=document.getElementById("mEncomiendaDepto").value.trim(),o=document.getElementById("mEncomiendaDestinatario").value.trim(),a=document.getElementById("mEncomiendaTracking").value.trim();if(!e||!t){showToast("Completa el origen y el departamento");return}let i;try{i=await generarCodigoEncomienda()}catch(n){console.error(n),showToast("No se pudo generar el código de la encomienda. Revisa tu conexión.");return}const r=generarTokenAleatorio(),s=(conserjesDirectorio.find(n=>n.uid===currentUid)||{}).nombre||profile.nombre||"";try{await refComunidadActual().collection("encomiendas").add({title:e,depto:t,destinatario:o,tracking:a,date:hoyISO(),time:nowTime(),estado:"Recibido",codigo:i,qrToken:r,recibidoPor:s,retiradoPor:null,confirmadoPor:null,entregadoEn:null,ts:Date.now()})}catch(n){console.error(n),showToast("No se pudo registrar la encomienda. Revisa tu conexión.");return}addNovedad("📦","Encomienda recibida",`Depto ${t} · ${i}`,"badge-green","Registrada"),crearNotificacion({icon:"package",titulo:"Tienes una encomienda disponible para retirar",meta:`Depto ${t}${o?" · "+o:""} · Código ${i}`,depto:t}),closeModal(),showToast("Encomienda registrada · "+i),navigate("conserjeria")}else if(modalMode==="visita"){const e=document.getElementById("mVisitaNombre").value.trim(),t=document.getElementById("mVisitaRut").value.trim(),o=document.getElementById("mVisitaDepto").value.trim(),a=document.getElementById("mVisitaMotivo").value.trim();if(!e||!o){showToast("Completa el nombre y el departamento");return}if(t&&!validarRut(t)){showToast("El RUT ingresado no es válido");return}closeModal(),await registrarVisitaReal({nombre:e,rut:t,depto:o,motivo:a})}else if(modalMode==="visitaProgramada"){const e=document.getElementById("mVisitaProgNombre").value.trim(),t=document.getElementById("mVisitaProgRut").value.trim(),o=document.getElementById("mVisitaProgFecha").value,a=document.getElementById("mVisitaProgHora").value,i=document.getElementById("mVisitaProgMotivo").value.trim(),r=modalContext.depto;if(!e||!o){showToast("Completa el nombre y la fecha");return}if(t&&!validarRut(t)){showToast("El RUT ingresado no es válido");return}closeModal();try{await refComunidadActual().collection("visitasProgramadas").add({depto:r,nombre:e,rut:t,fecha:o,hora:a,motivo:i,estado:"Pendiente",ts:Date.now()})}catch(s){console.error(s),showToast("No se pudo guardar la visita programada. Revisa tu conexión.");return}showToast("Listo, avisamos a conserjería que esperas a "+e),currentPage==="perfil"&&renderPerfil()}else if(modalMode==="novedad"){const e=document.getElementById("mNovedadTexto").value.trim();if(!e){showToast("Escribe la novedad");return}addNovedad("📝",e,`Turno actual · ${nowTime()}`,"",""),closeModal(),showToast("Novedad registrada correctamente"),navigate("conserjeria")}else if(modalMode==="reserva"){const e=document.getElementById("mReservaFecha").value;if(!e){showToast("Selecciona una fecha");return}if(!reservaBloqueSeleccionado){showToast("Elige un bloque horario disponible");return}if(actualizarEstadosMorosidad(),tieneGastosComunesAtrasados(profile.depto)){showToast('No puedes reservar espacios comunes con gastos comunes atrasados. Ponte al día en "Gastos comunes" para reservar.');return}const t=modalContext.place,o=modalContext.icon,a=reservaBloqueSeleccionado;closeModal();try{await functions.httpsCallable("crearReservaMiComunidad")({comunidadId:community.id,lugar:t,icon:o,fecha:e,bloqueId:a})}catch(i){console.error(i),showToast(i&&i.message?i.message:"No se pudo crear la reserva. Revisa tu conexión.");return}showToast("Reserva solicitada para "+t),navigate("reservas")}else if(modalMode==="bloqueReserva"){const e=document.getElementById("mBloqueLugar").value,t=document.getElementById("mBloqueNombre").value.trim(),o=document.getElementById("mBloqueHoraInicio").value,a=document.getElementById("mBloqueHoraFin").value;if(!t||!o||!a){showToast("Completa el nombre, la hora de inicio y la hora de término");return}try{await refComunidadActual().collection("bloquesReserva").add({lugar:e,nombre:t,horaInicio:o,horaFin:a,activo:!0,ts:Date.now()})}catch(i){console.error(i),showToast("No se pudo guardar el bloque. Revisa tu conexión.");return}closeModal(),showToast("Bloque horario creado"),renderReservas()}else if(modalMode==="invitadoReserva"){const e=document.getElementById("mInvitadoNombre").value.trim(),t=document.getElementById("mInvitadoRut").value.trim();if(!e){showToast("Escribe el nombre del invitado");return}if(t&&!validarRut(t)){showToast("El RUT ingresado no es válido");return}const o=reservas.find(i=>i.id===modalContext.reservaId);if(!o){closeModal();return}const a=(o.invitados||[]).concat([{nombre:e,rut:t}]);o.invitados=a,closeModal(),openModal("invitadosReserva",o);try{await refComunidadActual().collection("reservas").doc(o.id).update({invitados:a})}catch(i){console.error(i),showToast("No se pudo guardar el invitado. Revisa tu conexión.")}}else if(modalMode==="cobroMensual"){const e=parseInt(document.getElementById("mCobroMonto").value,10),t=document.getElementById("mCobroVencimiento").value;if(!e||!t){showToast("Completa el monto y la fecha de vencimiento");return}closeModal();const o=await generarCobroMensual(e,t);showToast(o>0?`Cobro generado para ${o} departamento(s)`:"El cobro de este mes ya estaba generado")}else if(modalMode==="tipoMulta"){const e=document.getElementById("mTipoMultaNombre").value.trim(),t=parseInt(document.getElementById("mTipoMultaMonto").value,10);if(!e||!t){showToast("Completa el nombre y el monto");return}try{await refComunidadActual().collection("tiposMulta").add({nombre:e,monto:t,activo:!0,ts:Date.now()})}catch(o){console.error(o),showToast("No se pudo guardar el tipo de multa. Revisa tu conexión.");return}closeModal(),showToast("Tipo de multa creado"),renderAdmin()}else if(modalMode==="aplicarMulta"){const e=document.getElementById("mAplicarMultaDepto").value,t=document.getElementById("mAplicarMultaTipo"),o=t.value,a=t.options[t.selectedIndex]?t.options[t.selectedIndex].text:"",i=parseInt(document.getElementById("mAplicarMultaMonto").value,10),r=document.getElementById("mAplicarMultaFecha").value,s=document.getElementById("mAplicarMultaDetalle").value.trim();if(!e||!o||!i||!r){showToast("Completa el departamento, el tipo de multa, el monto y la fecha");return}closeModal();try{await refComunidadActual().collection("multas").add({depto:e,tipoMultaId:o,tipoMultaNombre:a,monto:i,detalle:s,fecha:r,estado:"Pendiente",ts:Date.now()})}catch(n){console.error(n),showToast("No se pudo aplicar la multa. Revisa tu conexión.");return}crearNotificacion({icon:"siren",titulo:"Multa aplicada",meta:`Depto ${e} · ${a} · ${formatCLP(i)}`,depto:e,paraTodos:!1}),showToast("Multa aplicada al depto "+e),renderAdmin()}else if(modalMode==="movimientoContable"){const e=document.getElementById("mMovimientoTipo").value,t=document.getElementById("mMovimientoCategoria").value,o=document.getElementById("mMovimientoDescripcion").value.trim(),a=parseInt(document.getElementById("mMovimientoMonto").value,10),i=document.getElementById("mMovimientoFecha").value;if(!o||!a||!i){showToast("Completa la descripción, el monto y la fecha");return}await registrarMovimientoContable({tipo:e,categoria:t,descripcion:o,monto:a,fecha:i,origen:"Manual"}),closeModal(),renderAdmin(),showToast("Movimiento registrado correctamente")}else if(modalMode==="proveedor"){const e=document.getElementById("mProveedorNombre").value.trim(),t=document.getElementById("mProveedorRubro").value,o=document.getElementById("mProveedorTelefono").value.trim(),a=document.getElementById("mProveedorEstado").value;if(!e||!o){showToast("Completa el nombre y el teléfono");return}try{await refComunidadActual().collection("proveedoresDirectorio").add({nombre:e,rubro:t,telefono:o,estado:a,ts:Date.now()})}catch(i){console.error(i),showToast("No se pudo agregar el proveedor. Revisa tu conexión.");return}closeModal(),showToast("Proveedor agregado correctamente"),renderAdmin()}else if(modalMode==="mantencion"){const e=document.getElementById("mMantencionProveedor").value,t=document.getElementById("mMantencionTipo").value.trim(),o=document.getElementById("mMantencionDescripcion").value.trim(),a=parseInt(document.getElementById("mMantencionMonto").value,10),i=document.getElementById("mMantencionFecha").value;if(!t||!a||!i){showToast("Completa el tipo, el monto y la fecha");return}try{await refComunidadActual().collection("mantenciones").add({proveedor:e,tipo:t,descripcion:o,monto:a,fecha:i,estado:"Programada",fechaRealizada:null,ts:Date.now()})}catch(r){console.error(r),showToast("No se pudo programar la mantención. Revisa tu conexión.");return}closeModal(),showToast("Mantención programada correctamente"),renderAdmin()}}function showToast(e){const t=document.querySelector(".toast");t&&t.remove();const o=document.createElement("div");o.className="toast",o.textContent=e,document.body.appendChild(o),setTimeout(()=>{o.remove()},3e3)}function paginaInicioActual(){return currentRole&&rolesConfig[currentRole]?rolesConfig[currentRole].paginaInicial:null}window.addEventListener("popstate",function(e){if(!!document.getElementById("app").classList.contains("hidden")){e.state&&e.state.mcPage&&history.replaceState({mcSelector:!0},"",location.pathname);return}if(modalMode){closeModal(),history.pushState({mcPage:currentPage},"","#"+currentPage);return}const o=e.state,a=paginaInicioActual();if(!o||o.mcSelector||!o.mcPage||o.mcRole&&o.mcRole!==currentRole){logout(!0),history.replaceState({mcSelector:!0},"",location.pathname);return}o&&o.mcPage?navigate(o.mcPage,!0):window.confirm("¿Quieres cerrar sesión y volver a la pantalla de ingreso?")?logout():history.pushState({mcPage:currentPage},"","#"+currentPage)}),history.replaceState({mcSelector:!0},"",location.pathname);
