import type { DrawingManager, DrawingKind } from "lightweight-charts-drawing";
import { TOOL_GROUPS, TOOL_COUNT } from "./tool-groups";
const glyphs: Record<string,string> = {
  "Trend tools":"╱","Gann and Fibonacci tools":"ƒ","Patterns":"⌁",
  "Forecasting and measurement tools":"↕","Geometric shapes":"◇","Annotation tools":"T"
};
export function initializeToolbar(dm: DrawingManager) {
  const rail=document.getElementById("rail")!, fly=document.getElementById("flyout")!;
  const status=document.getElementById("status-text")!, count=document.getElementById("drawing-count")!;
  const toolMap=new Map<string,{title:string;group:string;placement:string}>();
  for(const group of TOOL_GROUPS) for(const section of group.sections) for(const tool of section.tools)
    toolMap.set(tool.kind,{...tool,group:group.title});
  const makeButton=(label:string,title:string)=>{
    const button=document.createElement("button"); button.className="tool"; button.textContent=label; button.title=title; return button;
  };
  const cursor=makeButton("↖","Cursor"); rail.append(cursor);
  cursor.onclick=()=>{dm.setTool(null);refresh();};
  for(const group of TOOL_GROUPS) {
    const button=makeButton(glyphs[group.title]??"＋",group.title); rail.append(button);
    button.onclick=()=>{
      fly.replaceChildren();
      for(const section of group.sections) {
        const heading=document.createElement("div"); heading.className="fly-head"; heading.textContent=section.header??group.title; fly.append(heading);
        for(const tool of section.tools) {
          const item=document.createElement("button"); item.className="fly-item";
          const name=document.createElement("span"); name.textContent=tool.title;
          const placement=document.createElement("small"); placement.textContent=tool.placement;
          item.append(name,placement); item.onclick=()=>{dm.setTool(tool.kind as DrawingKind);fly.hidden=true;refresh();}; fly.append(item);
        }
      }
      fly.hidden=false;
    };
  }
  const separator=document.createElement("div"); separator.className="separator"; rail.append(separator);
  const magnet=makeButton("⌖","Toggle weak magnet"); rail.append(magnet);
  let magnetOn=true; magnet.onclick=()=>{magnetOn=!magnetOn;dm.setMagnet(magnetOn?"weak":"off");magnet.classList.toggle("active",magnetOn);};
  const hide=makeButton("◉","Hide / show all drawings"); rail.append(hide);
  hide.onclick=()=>dm.setDrawingsVisible(!dm.drawingsVisible());
  const clear=makeButton("⌫","Clear drawings"); rail.append(clear);
  clear.onclick=()=>{if(confirm("Delete all drawings?"))dm.clear();};
  function refresh() {
    const active=dm.tool(); cursor.classList.toggle("active",!active);
    status.textContent=active?(toolMap.get(active)?.title??active):"Select a drawing tool, then click or drag on the chart.";
    count.textContent=dm.drawings().length+" drawings · "+TOOL_COUNT+" tools";
  }
  dm.on("tool",refresh); dm.on("change",refresh); dm.on("selection",refresh); refresh();
  document.addEventListener("pointerdown",event=>{
    if(!fly.contains(event.target as Node)&&!(event.target as Element).closest("#rail button")) fly.hidden=true;
  });
}
