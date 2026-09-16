"use client";
import { useState } from "react";
export default function HtmlEditor({name,placeholder,minHeight=220,defaultValue="",required=true}:{name:string;placeholder?:string;minHeight?:number;defaultValue?:string;required?:boolean}){
 const [value,setValue]=useState(defaultValue);
 return <div className="html-editor-wrap"><div className="html-editor-toolbar"><span><b>B</b></span><span><i>I</i></span><span><u>U</u></span><span>H₂</span><span>H₃</span><span>🔗</span><span>☷</span><span>1.</span><span>↶</span><span>↷</span><span className="html-mode">HTML</span></div><textarea className="input rich-editor html-source-editor" name={name} value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder} style={{minHeight}} required={required} /></div>
}
