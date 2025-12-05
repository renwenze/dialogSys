;(()=>{
  const API_BASE = 'http://localhost:8000'
  async function post(path,payload){
    const url=API_BASE+path
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    if(!res.ok) throw new Error('bad')
    return await res.json()
  }
  async function streamPost(path,payload,onEvent){
    const url=API_BASE+path
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Accept':'text/event-stream'},body:JSON.stringify(payload)})
    if(!res.ok) throw new Error('bad')
    const reader=res.body.getReader()
    const decoder=new TextDecoder()
    let buffer=''
    while(true){
      const {done,value}=await reader.read()
      if(done) break
      buffer+=decoder.decode(value,{stream:true})
      const parts=buffer.split('\n\n')
      buffer=parts.pop()
      for(const p of parts){
        const lines=p.split('\n')
        const dataLine=lines.find(l=>l.startsWith('data: '))
        const eventLine=lines.find(l=>l.startsWith('event: '))
        const data=dataLine?dataLine.slice(6):''
        const event=eventLine?eventLine.slice(7):'message'
        onEvent({event,data})
      }
    }
    if(buffer.trim()){onEvent({event:'message',data:buffer.trim()})}
    onEvent({event:'done',data:'done'})
  }
  function keywords(text){return String(text).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w.length>2).slice(0,3)}
  async function simulateCitations(text){const ks=keywords(text);const list=ks.map(k=>({title:`关于 ${k} 的权威资料`,url:`https://www.bing.com/search?q=${encodeURIComponent(k)}`,snippet:`基于公开来源检索到与「${k}」相关的结果，供参考。`}));if(!list.length){list.push({title:'通用参考资料',url:'https://www.bing.com',snippet:'未检测到关键字，提供通用参考入口。'})}return list}
  async function simulateNLU(text){const hasWhy=/为什|why/i.test(text);const hasHow=/如何|怎么|how/i.test(text);const intent=hasHow?'求解步骤':hasWhy?'原因解释':'一般问答';const numbers=(String(text).match(/\d+(\.\d+)?/g)||[]).map(v=>({type:'数值',value:v}));const dates=(String(text).match(/\d{4}[-/年]\d{1,2}([-/月]\d{1,2})?/g)||[]).map(v=>({type:'日期',value:v}));const entities=[...numbers,...dates];const steps=intent==='求解步骤'?['识别问题与目标','拆解为可执行步骤','提供示例或伪代码']:intent==='原因解释'?['定位原因或机制','结合案例说明','给出建议与改进']:['理解问题','从知识库检索','生成直接回答'];const confidence=0.6+Math.random()*0.35;const lower=String(text).toLowerCase();const positive=['好','棒','赞','喜欢','支持','优秀'];const negative=['差','不好','讨厌','反对','糟糕','问题'];const sentiment=negative.some(w=>lower.includes(w))?'消极':positive.some(w=>lower.includes(w))?'积极':'中性';const stance=lower.includes('支持')||lower.includes('赞成')?'支持':lower.includes('反对')||lower.includes('不同意')?'反对':'中立';const scene=lower.includes('产品')?'产品':lower.includes('技术')?'技术':lower.includes('会议')?'会议':'通用';return {intent,entities,steps,confidence,sentiment,stance,scene}}
  function composeReply(nlu,citations,userText){const citeText=citations.slice(0,2).map(c=>`《${c.title}》`).join('，');const entityText=nlu.entities.slice(0,3).map(e=>`${e.type}${e.value}`).join('，')||'无显著实体';const stepText=nlu.steps.slice(0,2).join('，');return `已解析你的请求：意图为「${nlu.intent}」，实体：${entityText}。参考资料：${citeText}。基于上述，建议：${stepText}。如果需要，我可以继续深入处理「${userText}」。`}
  function splitChunks(text){const s=String(text);const chunks=[];let i=0;const size=14;while(i<s.length){chunks.push(s.slice(i,i+size));i+=size}return chunks}
  async function getCitationsAndNLU(text){
    try{
      const [ragRes,stanceRes,emoRes,sceneRes]=await Promise.all([
        post('/tool_call/rag',{query:text}),
        post('/tool_call/stance_cls',{query:text}),
        post('/tool_call/emo_cls',{query:text}),
        post('/tool_call/scene_cls',{query:text})
      ])
      const rag = typeof ragRes==='string' ? ragRes : (ragRes.rag||ragRes.message||ragRes.reply||'')
      const stance = typeof stanceRes==='string'?stanceRes:(stanceRes.message||'')
      const sentiment = typeof emoRes==='string'?emoRes:(emoRes.message||'')
      const scene = typeof sceneRes==='string'?sceneRes:(sceneRes.message||'')
      const nlu = {sentiment:sentiment||'未知', stance:stance||'中立', scene:scene||'通用', intent:'一般问答', entities:[], steps:[], confidence:0.8}
      return {rag,nlu}
    }catch(e){
      const [cites,nlu]=await Promise.all([simulateCitations(text),simulateNLU(text)])
      const rag=cites.map(c=>`${c.title}\n${c.snippet}\n${c.url}`).join('\n\n')
      return {rag,nlu}
    }
  }
  async function getChat(text,nlu,citations){
    try{
      const r=await post('/persu_talk/',{
        query:text,
        sentiment:nlu?.sentiment,
        stance:nlu?.stance,
        scene:nlu?.scene,
        rag:citations && typeof citations==='string' ? citations : ''
      })
      const reply=typeof r==='string'?r:(r.reply||r.message||'')
      return reply||composeReply(nlu,citations,text)
    }catch(e){
      return composeReply(nlu,citations,text)
    }
  }
  async function runFlow(text,onUpdate){
    const pRag=(async()=>{let rag='';await streamPost('/tool_call/rag_stream',{query:text},({event,data})=>{if(event==='message'){rag+=data;onUpdate({type:'rag_chunk',data});}else if(event==='done'){onUpdate({type:'rag_done'})}});return rag})()
    const pStance=post('/tool_call/stance_cls',{query:text}).then(r=>{const v=typeof r==='string'?r:(r.message||'');onUpdate({type:'stance',data:v});return v}).catch(()=>{onUpdate({type:'stance',data:'中立'});return '中立'})
    const pEmo=post('/tool_call/emo_cls',{query:text}).then(r=>{const v=typeof r==='string'?r:(r.message||'');onUpdate({type:'sentiment',data:v});return v}).catch(()=>{onUpdate({type:'sentiment',data:'中性'});return '中性'})
    const pScene=post('/tool_call/scene_cls',{query:text}).then(r=>{const v=typeof r==='string'?r:(r.message||'');onUpdate({type:'scene',data:v});return v}).catch(()=>{onUpdate({type:'scene',data:'通用'});return '通用'})
    const [rag,stance,sentiment,scene]=await Promise.all([pRag,pStance,pEmo,pScene])
    const payload={query:text,sentiment,stance,scene,rag}
    try{
      await streamPost('/persu_talk/stream',payload,({event,data})=>{if(event==='message'){onUpdate({type:'reply_chunk',data})}else if(event==='done'){onUpdate({type:'reply_done'})}})
    }catch(e){
      const fallback=composeReply({intent:'一般问答',entities:[],steps:[],confidence:0.8,sentiment,stance,scene},[],text)
      const chunks=splitChunks(fallback)
      for(const c of chunks){onUpdate({type:'reply_chunk',data:c});await new Promise(res=>setTimeout(res,30))}
      onUpdate({type:'reply_done'})
    }
  }
  window.API={getCitationsAndNLU,getChat,runFlow}
})()
