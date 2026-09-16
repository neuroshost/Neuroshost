"use client";
import { useState } from "react";
export default function CopyReferralButton({value}:{value:string}){const [copied,setCopied]=useState(false);return <button className="client-primary-btn" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(value);setCopied(true);setTimeout(()=>setCopied(false),1600)}catch{}}}>{copied?"Copié !":"Copier"}</button>}
