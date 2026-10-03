(() => {
  const $ = id => document.getElementById(id);
  const state = { mode: "image", files: [], outputUrl: null, outputName: "pajix-document.pdf" };
  const imageInput = $("image-input"), pdfInput = $("pdf-input"), dropzone = $("dropzone"), workspace = $("workspace");
  $("year").textContent = new Date().getFullYear();
  const prettySize = bytes => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  const safeName = name => name.replace(/[\\/:*?"<>|]+/g, "_").replace(/\.[^.]+$/, "") || "document";
  function clearOutput(){ if(state.outputUrl) URL.revokeObjectURL(state.outputUrl); state.outputUrl=null; $("success-message").hidden=true; $("error-message").textContent=""; }
  function setMode(mode){
    state.mode=mode; state.files=[]; clearOutput(); workspace.hidden=false;
    const image=mode==="image";
    $("workspace-eyebrow").textContent=image?"CONVERT / 01":"ORGANIZE / 02";
    $("workspace-title").textContent=image?"JPG to PDF":"Merge PDF";
    $("workspace-description").textContent=image?"Drop your images into the local workspace.":"Stack your PDFs in the order you want.";
    $("drop-title").textContent=image?"Drop images here":"Drop PDF files here";
    $("file-hint").textContent=image?"JPG, PNG or WEBP · multiple files supported":"PDF files · select two or more to merge";
    $("image-settings").hidden=!image; $("merge-settings").hidden=image;
    $("settings-mode").textContent=image?"PDF":"MERGE";
    $("process-button").innerHTML=image?'Create PDF <span>→</span>':'Merge PDFs <span>→</span>';
    $("process-button").disabled=true; renderFiles(); workspace.scrollIntoView({behavior:"smooth",block:"start"});
  }
  $("open-image-tool").onclick=()=>{setMode("image");imageInput.click()};
  $("start-with-file").onclick=()=>{setMode("image"); setTimeout(()=>imageInput.click(),250)};
  $("open-merge-tool").onclick=()=>{setMode("merge");pdfInput.click()};
  $("close-workspace").onclick=()=>{workspace.hidden=true;clearOutput()};
  $("margin").oninput=()=>$("margin-value").textContent=`${$("margin").value} mm`;
  dropzone.onclick=()=> (state.mode==="image"?imageInput:pdfInput).click();
  dropzone.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();dropzone.click()}};
  ["dragenter","dragover"].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.add("dragover")}));
  ["dragleave","drop"].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.remove("dragover")}));
  dropzone.ondrop=e=>addFiles(e.dataTransfer.files);
  imageInput.onchange=()=>{addFiles(imageInput.files);imageInput.value=""}; pdfInput.onchange=()=>{addFiles(pdfInput.files);pdfInput.value=""};
  $("clear-files").onclick=()=>{state.files=[];clearOutput();renderFiles()};
  function addFiles(fileList){
    const incoming=Array.from(fileList); const accepted=incoming.filter(f=>state.mode==="image"?/^image\/(jpeg|png|webp)$/i.test(f.type):(f.type==="application/pdf"||/\.pdf$/i.test(f.name)));
    const rejected=incoming.length-accepted.length;
    if(rejected)$("error-message").textContent=`${rejected} unsupported file(s) skipped.`; else $("error-message").textContent="";
    state.files.push(...accepted);clearOutput();renderFiles();
  }
  function renderFiles(){
    const list=$("file-list");list.replaceChildren(); const count=state.files.length;
    $("file-count").textContent=count?`${count} file${count===1?"":"s"} selected`:"No files selected";
    $("clear-files").hidden=!count; $("process-button").disabled=state.mode==="image"?count<1:count<2;
    state.files.forEach((file,index)=>{
      const row=document.createElement("div");row.className="file-item";const thumb=document.createElement("div");thumb.className="file-thumb";
      if(state.mode==="image"){const img=document.createElement("img");img.alt="";img.src=URL.createObjectURL(file);img.onload=()=>URL.revokeObjectURL(img.src);thumb.append(img)}else thumb.textContent="PDF";
      const meta=document.createElement("div");meta.className="file-meta";const name=document.createElement("div");name.className="file-name";name.textContent=file.name;const size=document.createElement("div");size.className="file-size";size.textContent=prettySize(file.size);meta.append(name,size);
      const actions=document.createElement("div");actions.className="file-actions";
      [["↑",-1],["↓",1]].forEach(([label,delta])=>{const btn=document.createElement("button");btn.type="button";btn.textContent=label;btn.disabled=index+delta<0||index+delta>=state.files.length;btn.title=delta<0?"Move up":"Move down";btn.onclick=()=>{const other=index+delta;[state.files[index],state.files[other]]=[state.files[other],state.files[index]];clearOutput();renderFiles()};actions.append(btn)});
      const remove=document.createElement("button");remove.type="button";remove.textContent="×";remove.title="Remove file";remove.onclick=()=>{state.files.splice(index,1);clearOutput();renderFiles()};actions.append(remove);row.append(thumb,meta,actions);list.append(row);
    });
  }
  const mmToPt=mm=>mm*72/25.4;
  async function imageToPdf(){
    if(!window.PDFLib)throw new Error("The PDF engine did not load. Connect to the internet and refresh.");
    const {PDFDocument}=PDFLib,pdf=await PDFDocument.create();const margin=mmToPt(Number($("margin").value));const size=$("page-size").value,orientation=$("orientation").value,fit=$("image-fit").value;
    for(let i=0;i<state.files.length;i++){
      const file=state.files[i];$("process-button").innerHTML=`Processing ${i+1}/${state.files.length}…`;const bytes=await file.arrayBuffer();let embedded;
      if(file.type==="image/png"||/\.png$/i.test(file.name))embedded=await pdf.embedPng(bytes);else{const bitmap=await createImageBitmap(file);const canvas=document.createElement("canvas");canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext("2d").drawImage(bitmap,0,0);const jpg=await new Promise(r=>canvas.toBlob(r,"image/jpeg",.94));if(!jpg)throw new Error(`Could not read image: ${file.name}`);embedded=await pdf.embedJpg(await jpg.arrayBuffer());bitmap.close()}
      const iw=embedded.width,ih=embedded.height;let pw,ph;if(size==="fit"){pw=iw+margin*2;ph=ih+margin*2}else{const base=size==="letter"?[612,792]:[595.28,841.89];[pw,ph]=base;const land=orientation==="landscape"||(orientation==="auto"&&iw>ih);if(orientation==="portrait"){pw=Math.min(...base);ph=Math.max(...base)}else if(land){pw=Math.max(...base);ph=Math.min(...base)}}
      const page=pdf.addPage([pw,ph]);const aw=Math.max(1,pw-margin*2),ah=Math.max(1,ph-margin*2);let dw,dh,x,y;
      if(size==="fit"){dw=iw;dh=ih;x=margin;y=margin}else if(fit==="cover"){const scale=Math.max(aw/iw,ah/ih);dw=iw*scale;dh=ih*scale;x=(pw-dw)/2;y=(ph-dh)/2;page.pushOperators(PDFLib.pushGraphicsState(),PDFLib.rectangle(0,0,pw,ph),PDFLib.clip(),PDFLib.endPath());page.drawImage(embedded,{x,y,width:dw,height:dh});page.pushOperators(PDFLib.popGraphicsState());continue}else{const scale=Math.min(aw/iw,ah/ih);dw=iw*scale;dh=ih*scale;x=(pw-dw)/2;y=(ph-dh)/2}page.drawImage(embedded,{x,y,width:dw,height:dh});
    }return await pdf.save();
  }
  async function mergePdfs(){if(!window.PDFLib)throw new Error("The PDF engine did not load. Connect to the internet and refresh.");const {PDFDocument}=PDFLib,merged=await PDFDocument.create();for(let i=0;i<state.files.length;i++){const file=state.files[i];$("process-button").innerHTML=`Merging ${i+1}/${state.files.length}…`;const source=await PDFDocument.load(await file.arrayBuffer());const pages=await merged.copyPages(source,source.getPageIndices());pages.forEach(p=>merged.addPage(p))}return await merged.save()}
  $("process-button").onclick=async()=>{clearOutput();const btn=$("process-button");btn.disabled=true;try{const bytes=state.mode==="image"?await imageToPdf():await mergePdfs();state.outputUrl=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));state.outputName=state.mode==="image"?`${safeName(state.files[0]?.name||"images")}-pajix.pdf`:"pajix-merged.pdf";$("success-message").hidden=false;$("error-message").textContent=""}catch(err){console.error(err);$("error-message").textContent=err?.message||"Something went wrong."}finally{btn.disabled=state.mode==="image"?state.files.length<1:state.files.length<2;btn.innerHTML=state.mode==="image"?'Create PDF <span>→</span>':'Merge PDFs <span>→</span>'}};
  $("download-button").onclick=()=>{if(!state.outputUrl)return;const a=document.createElement("a");a.href=state.outputUrl;a.download=state.outputName;document.body.append(a);a.click();a.remove()};
})();
