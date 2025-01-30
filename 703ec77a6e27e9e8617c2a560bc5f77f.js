import"./lw-chart.js";import{themeColors as t}from"../../../theme-colors";!function(){let e=document.createElement("template");e.innerHTML=`
    <style>
    :host {
        display: block;
    }
    :host[hidden] {
        display: none;
    }
    #example {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
    }
    #chart {
        flex-grow: 1;
    }
    #buttons {
        flex-direction: row;
    }
    button {
        border-radius: 8px;
        border: 1px solid transparent;
        padding: 0.5em 1em;
        font-size: 1em;
        font-weight: 500;
        font-family: inherit;
        background-color: var(--hero-button-background-color-active, #e9e9e9);
        color: var(--hero-button-text-color, #e9e9e9);
        cursor: pointer;
        transition: border-color 0.25s;
        margin-left: 0.5em;
      }
      button:hover {
        border-color: #3179F5;
        background-color: var(--hero-button-background-color-hover);
        color: var(--hero-button-text-color-hover-active);
      }
      button:focus,
      button:focus-visible {
        outline: 4px auto -webkit-focus-ring-color;
      }
        
      #example-chart {
        height: var(--lwchart-height, 300px);
      }
    </style>
    <div id="example">
        <div id="example-container">
            <lightweight-chart id="example-chart"
                autosize
                type="line"
            ></lightweight-chart>
        </div>
        <div id="buttons">
            <button id="change-colours-button" type="button">Set Random Colors</button>
            <button id="change-type-button" type="button">Change Chart Type</button>
            <button id="change-data-button" type="button">Change Data</button>
        </div>
    </div>
  `;let o=()=>Math.round(255*Math.random()),a=(t=1)=>`rgba(${o()}, ${o()}, ${o()}, ${t})`,n={area:[["topColor",.4],["bottomColor",0],["lineColor",1]],bar:[["upColor",1],["downColor",1]],baseline:[["topFillColor1",.28],["topFillColor2",.05],["topLineColor",1],["bottomFillColor1",.28],["bottomFillColor2",.05],["bottomLineColor",1]],candlestick:[["upColor",1],["downColor",1],["borderUpColor",1],["borderDownColor",1],["wickUpColor",1],["wickDownColor",1]],histogram:[["color",1]],line:[["color",1]]},r=()=>"dark"===document.documentElement.getAttribute("data-theme");class i extends HTMLElement{constructor(){super(),this.chartElement=void 0}connectedCallback(){this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(e.content.cloneNode(!0)),this.changeChartTheme(r()),window.MutationObserver&&(this.observer=new window.MutationObserver(t=>{this.changeChartTheme(r())}),this.observer.observe(document.documentElement,{attributes:!0})),this.chartElement=this.shadowRoot.querySelector("#example-chart"),this._changeData(),this.addButtonClickHandlers(),this.chartElement.chart.timeScale().fitContent()}addButtonClickHandlers(){this.changeColours=()=>this._changeColours(),this.changeType=()=>this._changeType(),this.changeData=()=>this._changeData(),this.shadowRoot.querySelector("#change-colours-button").addEventListener("click",this.changeColours),this.shadowRoot.querySelector("#change-type-button").addEventListener("click",this.changeType),this.shadowRoot.querySelector("#change-data-button").addEventListener("click",this.changeData)}removeButtonClickHandlers(){this.changeColours&&this.shadowRoot.querySelector("#change-colours-button").removeEventListener("click",this.changeColours),this.changeType&&this.shadowRoot.querySelector("#change-type-button").removeEventListener("click",this.changeType),this.changeData&&this.shadowRoot.querySelector("#change-data-button").removeEventListener("click",this.changeData)}_changeColours(){if(!this.chartElement)return;let t={};n[this.chartElement.type].forEach(e=>{t[e[0]]=a(e[1])}),this.chartElement.seriesOptions=t}_changeData(){if(!this.chartElement)return;let t=function(t){let e=25+25*Math.random(),o=t=>t*(.5+.2*Math.sin(t/10)+.4*Math.sin(t/20)+.8*Math.sin(t/e)+.5*Math.sin(t/500))+200,a=[],n=new Date(Date.UTC(2018,0,1,0,0,0,0)),r=t?100:500;for(let e=0;e<r;++e){let r=n.getTime()/1e3,i=o(e);if(t){let t=[-1*Math.random(),Math.random(),Math.random()].map(t=>10*t),n=Math.sin(Math.random()-.5);a.push({time:r,low:i+t[0],high:i+t[1],open:i+n*t[2],close:o(e+1)})}else a.push({time:r,value:i});n.setUTCDate(n.getUTCDate()+1)}return a}(["candlestick","bar"].includes(this.chartElement.type));if(this.chartElement.data=t,"baseline"===this.chartElement.type){let e=t.reduce((t,e)=>t+e.value,0)/t.length;this.chartElement.seriesOptions={baseValue:{type:"price",price:e}}}}_changeType(){if(!this.chartElement)return;let t=["line","area","baseline","histogram","candlestick","bar"].filter(t=>t!==this.chartElement.type),e=Math.round(Math.random()*(t.length-1));this.chartElement.type=t[e],this._changeData(),this.chartElement.chart.timeScale().fitContent()}disconnectedCallback(){}changeChartTheme(e){if(!this.chartElement)return;let o=e?t.DARK:t.LIGHT,a=e?"#424F53":"#D6DCDE";this.chartElement.options={layout:{textColor:o.CHART_TEXT_COLOR,background:{color:o.CHART_BACKGROUND_COLOR}},grid:{vertLines:{color:a},horzLines:{color:a}}}}}window.customElements.define("lightweight-chart-example",i)}();