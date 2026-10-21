// Semantic routing for presentation only: it never changes verified facts,
// access controls, or whether a question is allowed.
const presentationExamples = {
  career: [
    'What does Pavan do for work?',
    'Tell me about his professional background and career.',
    'Which companies has he worked for?',
    'What research interests him?',
    'What neural architectures does he know?',
    'Explain his work on recommendation and ranking models.',
    'How would he design and tune a machine learning model?',
    'What is his role at Robinhood?'
  ],
  text: [
    'Hello, how are you?',
    'What is his favorite movie?',
    'Does he like Rajinikanth?',
    'What cricket team does he play for?',
    'Where does he live?',
    'How can I contact Pavan?',
    'What does he like to eat and drink?',
    'Who are you?'
  ]
};
const normalizePresentationVector = vector => {
  if(!Array.isArray(vector)||!vector.length||!vector.every(Number.isFinite))return null;
  const norm=Math.hypot(...vector);
  return norm?vector.map(x=>x/norm):null;
};
export function createPresentationClassifier(){
  let examplesPromise=null;
  return async function classifyPresentation(vector,ai){
    const query=normalizePresentationVector(vector);
    if(!query||!ai)return 'text';
    let timer;
    try{
      if(!examplesPromise){
        examplesPromise=ai.run('@cf/baai/bge-small-en-v1.5',{text:[...presentationExamples.career,...presentationExamples.text]})
          .then(result=>{
            if(result?.data?.length!==16)throw Error('Invalid examples');
            const vectors=result.data.map(normalizePresentationVector);
            if(vectors.some(v=>!v||v.length!==query.length))throw Error('Invalid vectors');
            return vectors;
          }).catch(error=>{examplesPromise=null;throw error;});
      }
      const vectors=await Promise.race([examplesPromise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Classifier timeout')),1500);})]);
      const scores=vectors.map(v=>v.reduce((sum,x,i)=>sum+x*query[i],0));
      const career=Math.max(...scores.slice(0,8)),text=Math.max(...scores.slice(8));
      return career>=0.76&&career-text>=0.06?'career':'text';
    }catch{return 'text';}
    finally{clearTimeout(timer);}
  };
}
