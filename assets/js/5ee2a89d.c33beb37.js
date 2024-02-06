"use strict";(self.webpackChunk=self.webpackChunk||[]).push([[7796],{95788:(e,t,a)=>{a.d(t,{Iu:()=>g,yg:()=>m});var i=a(11504);function n(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function r(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,i)}return a}function p(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?r(Object(a),!0).forEach((function(t){n(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):r(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function o(e,t){if(null==e)return{};var a,i,n=function(e,t){if(null==e)return{};var a,i,n={},r=Object.keys(e);for(i=0;i<r.length;i++)a=r[i],t.indexOf(a)>=0||(n[a]=e[a]);return n}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(i=0;i<r.length;i++)a=r[i],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(n[a]=e[a])}return n}var s=i.createContext({}),l=function(e){var t=i.useContext(s),a=t;return e&&(a="function"==typeof e?e(t):p(p({},t),e)),a},g=function(e){var t=l(e.components);return i.createElement(s.Provider,{value:t},e.children)},c="mdxType",y={inlineCode:"code",wrapper:function(e){var t=e.children;return i.createElement(i.Fragment,{},t)}},h=i.forwardRef((function(e,t){var a=e.components,n=e.mdxType,r=e.originalType,s=e.parentName,g=o(e,["components","mdxType","originalType","parentName"]),c=l(a),h=n,m=c["".concat(s,".").concat(h)]||c[h]||y[h]||r;return a?i.createElement(m,p(p({ref:t},g),{},{components:a})):i.createElement(m,p({ref:t},g))}));function m(e,t){var a=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var r=a.length,p=new Array(r);p[0]=h;var o={};for(var s in t)hasOwnProperty.call(t,s)&&(o[s]=t[s]);o.originalType=e,o[c]="string"==typeof e?e:n,p[1]=o;for(var l=2;l<r;l++)p[l]=a[l];return i.createElement.apply(null,p)}return i.createElement.apply(null,a)}h.displayName="MDXCreateElement"},53652:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>s,contentTitle:()=>p,default:()=>y,frontMatter:()=>r,metadata:()=>o,toc:()=>l});var i=a(45072),n=(a(11504),a(95788));const r={id:"SeriesPartialOptionsMap",title:"Interface: SeriesPartialOptionsMap",sidebar_label:"SeriesPartialOptionsMap",sidebar_position:0,custom_edit_url:null,pagination_next:null,pagination_prev:null},p=void 0,o={unversionedId:"api/interfaces/SeriesPartialOptionsMap",id:"api/interfaces/SeriesPartialOptionsMap",title:"Interface: SeriesPartialOptionsMap",description:"Represents the type of partial options for each series type.",source:"@site/docs/api/interfaces/SeriesPartialOptionsMap.md",sourceDirName:"api/interfaces",slug:"/api/interfaces/SeriesPartialOptionsMap",permalink:"/lightweight-charts/docs/next/api/interfaces/SeriesPartialOptionsMap",draft:!1,editUrl:null,tags:[],version:"current",sidebarPosition:0,frontMatter:{id:"SeriesPartialOptionsMap",title:"Interface: SeriesPartialOptionsMap",sidebar_label:"SeriesPartialOptionsMap",sidebar_position:0,custom_edit_url:null,pagination_next:null,pagination_prev:null},sidebar:"apiSidebar"},s={},l=[{value:"Properties",id:"properties",level:2},{value:"Bar",id:"bar",level:3},{value:"Candlestick",id:"candlestick",level:3},{value:"Area",id:"area",level:3},{value:"Baseline",id:"baseline",level:3},{value:"Line",id:"line",level:3},{value:"Histogram",id:"histogram",level:3},{value:"Custom",id:"custom",level:3}],g={toc:l},c="wrapper";function y(e){let{components:t,...a}=e;return(0,n.yg)(c,(0,i.c)({},g,a,{components:t,mdxType:"MDXLayout"}),(0,n.yg)("p",null,"Represents the type of partial options for each series type."),(0,n.yg)("p",null,"For example a bar series has options represented by ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/#barseriespartialoptions"},"BarSeriesPartialOptions"),"."),(0,n.yg)("h2",{id:"properties"},"Properties"),(0,n.yg)("h3",{id:"bar"},"Bar"),(0,n.yg)("p",null,"\u2022 ",(0,n.yg)("strong",{parentName:"p"},"Bar"),": ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/#deeppartial"},(0,n.yg)("inlineCode",{parentName:"a"},"DeepPartial")),"<",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/BarStyleOptions"},(0,n.yg)("inlineCode",{parentName:"a"},"BarStyleOptions"))," & ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/SeriesOptionsCommon"},(0,n.yg)("inlineCode",{parentName:"a"},"SeriesOptionsCommon")),">"),(0,n.yg)("p",null,"The type of bar series partial options."),(0,n.yg)("hr",null),(0,n.yg)("h3",{id:"candlestick"},"Candlestick"),(0,n.yg)("p",null,"\u2022 ",(0,n.yg)("strong",{parentName:"p"},"Candlestick"),": ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/#deeppartial"},(0,n.yg)("inlineCode",{parentName:"a"},"DeepPartial")),"<",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/CandlestickStyleOptions"},(0,n.yg)("inlineCode",{parentName:"a"},"CandlestickStyleOptions"))," & ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/SeriesOptionsCommon"},(0,n.yg)("inlineCode",{parentName:"a"},"SeriesOptionsCommon")),">"),(0,n.yg)("p",null,"The type of candlestick series partial options."),(0,n.yg)("hr",null),(0,n.yg)("h3",{id:"area"},"Area"),(0,n.yg)("p",null,"\u2022 ",(0,n.yg)("strong",{parentName:"p"},"Area"),": ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/#deeppartial"},(0,n.yg)("inlineCode",{parentName:"a"},"DeepPartial")),"<",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/AreaStyleOptions"},(0,n.yg)("inlineCode",{parentName:"a"},"AreaStyleOptions"))," & ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/SeriesOptionsCommon"},(0,n.yg)("inlineCode",{parentName:"a"},"SeriesOptionsCommon")),">"),(0,n.yg)("p",null,"The type of area series partial options."),(0,n.yg)("hr",null),(0,n.yg)("h3",{id:"baseline"},"Baseline"),(0,n.yg)("p",null,"\u2022 ",(0,n.yg)("strong",{parentName:"p"},"Baseline"),": ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/#deeppartial"},(0,n.yg)("inlineCode",{parentName:"a"},"DeepPartial")),"<",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/BaselineStyleOptions"},(0,n.yg)("inlineCode",{parentName:"a"},"BaselineStyleOptions"))," & ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/SeriesOptionsCommon"},(0,n.yg)("inlineCode",{parentName:"a"},"SeriesOptionsCommon")),">"),(0,n.yg)("p",null,"The type of baseline series partial options."),(0,n.yg)("hr",null),(0,n.yg)("h3",{id:"line"},"Line"),(0,n.yg)("p",null,"\u2022 ",(0,n.yg)("strong",{parentName:"p"},"Line"),": ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/#deeppartial"},(0,n.yg)("inlineCode",{parentName:"a"},"DeepPartial")),"<",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/LineStyleOptions"},(0,n.yg)("inlineCode",{parentName:"a"},"LineStyleOptions"))," & ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/SeriesOptionsCommon"},(0,n.yg)("inlineCode",{parentName:"a"},"SeriesOptionsCommon")),">"),(0,n.yg)("p",null,"The type of line series partial options."),(0,n.yg)("hr",null),(0,n.yg)("h3",{id:"histogram"},"Histogram"),(0,n.yg)("p",null,"\u2022 ",(0,n.yg)("strong",{parentName:"p"},"Histogram"),": ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/#deeppartial"},(0,n.yg)("inlineCode",{parentName:"a"},"DeepPartial")),"<",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/HistogramStyleOptions"},(0,n.yg)("inlineCode",{parentName:"a"},"HistogramStyleOptions"))," & ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/SeriesOptionsCommon"},(0,n.yg)("inlineCode",{parentName:"a"},"SeriesOptionsCommon")),">"),(0,n.yg)("p",null,"The type of histogram series partial options."),(0,n.yg)("hr",null),(0,n.yg)("h3",{id:"custom"},"Custom"),(0,n.yg)("p",null,"\u2022 ",(0,n.yg)("strong",{parentName:"p"},"Custom"),": ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/#deeppartial"},(0,n.yg)("inlineCode",{parentName:"a"},"DeepPartial")),"<",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/CustomStyleOptions"},(0,n.yg)("inlineCode",{parentName:"a"},"CustomStyleOptions"))," & ",(0,n.yg)("a",{parentName:"p",href:"/lightweight-charts/docs/next/api/interfaces/SeriesOptionsCommon"},(0,n.yg)("inlineCode",{parentName:"a"},"SeriesOptionsCommon")),">"),(0,n.yg)("p",null,"The type of a custom series partial options."))}y.isMDXComponent=!0}}]);