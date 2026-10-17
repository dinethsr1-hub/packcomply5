require("dotenv").config();
const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");
const path = require("path");

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const RULES = require("./rules.json");
const DATA = require("./data.json");
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(express.json());
app.get("/", (req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.use(express.static(path.join(__dirname,"public")));

function matches(rule,x){
  const t=rule.trigger||{};
  if(t.countries && !t.countries.includes(x.country)) return false;
  if(t.products && !t.products.includes(x.product)) return false;
  if(t.food_contact && t.food_contact!==x.food_contact) return false;
  if(t.b2c && t.b2c!==x.b2c) return false;
  if(t.foreign_direct && t.foreign_direct!==x.foreign_direct) return false;
  if(t.material && !t.material.includes(x.material)) return false;
  return true;
}

app.get("/api/catalog",(req,res)=>res.json(DATA.catalog));

app.post("/api/check",(req,res)=>{
  const x=req.body||{};
  const matched=RULES.filter(r=>matches(r,x));
  const coverage=DATA.coverage[x.country]||{status:"not_loaded",label:"No verified country rules loaded"};
  const productName=(DATA.catalog.products.find(p=>p.id===x.product)||{}).name||x.product;
  const countryName=x.country;
  const issues=[];
  const evidence=[...new Set(matched.flatMap(r=>r.evidence||[]))];
  const high=matched.filter(r=>r.priority==="high").length;

  if(!x.product||!x.country||!x.material) issues.push({level:"high",text:"Complete the product, destination and packaging fields."});
  if(x.food_contact==="yes") issues.push({level:"medium",text:"Food-contact suitability must be supported by supplier technical documentation; a photograph cannot prove conformity."});
  if(["plastic","composite"].includes(x.material)) issues.push({level:"medium",text:"Exact polymer/layer structure and migration performance cannot be established from appearance alone."});
  if(x.mass==="unknown") issues.push({level:"medium",text:"Packaging mass is missing. Obtain weight by material in kg for packaging/EPR assessment."});
  if(x.b2c==="yes" && ["Germany","United Kingdom"].includes(x.country)) issues.push({level:"medium",text:`Check ${x.country} packaging producer/EPR obligations for the actual supply-chain role.`});
  if(coverage.status!=="verified") issues.push({level:"high",text:"This destination is in the workflow catalog, but verified country-specific rules are not yet loaded. Do not treat this result as a full compliance determination."});
  if(matched.length===0) issues.push({level:"high",text:"No verified rule matched this exact product/destination profile. The absence of a match does not mean the shipment is compliant."});

  let risk="LOW";
  if(coverage.status!=="verified" || matched.length===0 || issues.filter(i=>i.level==="high").length) risk="HIGH";
  else if(high>=2 || issues.length>=3) risk="MEDIUM";

  const status=risk==="HIGH"?"CHECK REQUIRED":risk==="MEDIUM"?"REVIEW REQUIRED":"PRELIMINARY SCREEN PASSED";
  res.json({status,risk,coverage,profile:{product:productName,country:countryName},matched,evidence,issues,limitations:[
    "This is a preliminary screening tool, not legal advice, certification or a binding compliance determination.",
    "Regulatory applicability can depend on HS code, formulation, origin, importer role, intended use, sales channel and current law.",
    "A rule shown as matched means the rule area is relevant for review; it does not mean the product is compliant."
  ]});
});

app.post("/api/inspect",upload.single("photo"),async(req,res)=>{
  if(!req.file) return res.status(400).json({error:"No photo uploaded"});
  if(!client) return res.json({mode:"demo",inspection:{packaging_type:"Packaging appearance detected",likely_material:"Unverified from photo",material_confidence:"low",food_contact_likelihood:"cannot establish from photo",visible_text:[],visible_symbols:[],possible_issues:["Exact material composition cannot be verified from appearance.","Legal conformity and migration compliance cannot be established from a photograph."],missing_information:["Material specification","Packaging weight","Supplier Declaration of Compliance where applicable"],cannot_determine:["Polymer/layer composition","Migration compliance","Recyclability classification"],confidence:"low"}});
  try{
    const b64=req.file.buffer.toString("base64");
    const response=await client.responses.create({model:process.env.OPENAI_MODEL||"gpt-5",input:[{role:"user",content:[{type:"input_text",text:"Inspect this packaging photo as a preliminary packaging-compliance assistant. Return JSON only with keys packaging_type, likely_material, material_confidence, food_contact_likelihood, visible_text, visible_symbols, possible_issues, missing_information, cannot_determine, confidence. Never claim legal compliance or infer exact polymer composition, migration compliance, certification validity or legal responsibility from appearance alone."},{type:"input_image",image_url:`data:${req.file.mimetype};base64,${b64}`}]}]});
    let parsed; try{parsed=JSON.parse(response.output_text||"{}")}catch{parsed={raw:response.output_text||""}}
    res.json({mode:"live",inspection:parsed});
  }catch(e){res.status(500).json({error:e.message})}
});

module.exports=app;
