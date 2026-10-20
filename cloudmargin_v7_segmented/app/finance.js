// Pure, independently testable hypothetical financial model. No Vercel internal data.
export const DEFAULTS={accounts:150,freeAccounts:350,enterpriseAccounts:8,growth:20,freeGrowth:12,enterpriseGrowth:18,freeConversion:4,proChurn:5,proUpgrade:2,enterpriseChurn:3,enterpriseFee:2500,freeTasks:30,enterpriseTasks:450,proIncludedRuns:30,enterpriseIncludedRuns:1000,tasks:125,agentMix:40,runs:2,seconds:45,costSec:.0005,fee:110,priceRun:.055,cache:10,otherCostPerAccount:8,orchestrationPerRun:.002,retryRate:8,buildCost:12000,buyCost:19000,buildEff:18,buyEff:30,buyMonthly:600,buildMonthly:250,discountRate:12};
export const SCENARIOS={cautious:{taskFactor:.85,agentDelta:-15},base:{taskFactor:1,agentDelta:0},fast:{taskFactor:1.15,agentDelta:25}};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function forecast(p,scenario='base'){
 const s=SCENARIOS[scenario]||SCENARIOS.base;
 // Annual rates are converted into monthly flows. Each segment evolves independently.
 let free=p.freeAccounts,pro=p.accounts,enterprise=p.enterpriseAccounts;
 return Array.from({length:36},(_,i)=>{
  const active=free+pro+enterprise;
  const agentShare=clamp((p.agentMix+s.agentDelta)/100,0,1);
  const freeTasks=free*p.freeTasks*s.taskFactor;
  const proTasks=pro*p.tasks*s.taskFactor;
  const enterpriseTasks=enterprise*p.enterpriseTasks*s.taskFactor;
  const tasks=freeTasks+proTasks+enterpriseTasks;
  const agentTasks=tasks*agentShare;
  const retryFactor=1+p.retryRate/100;
  const freeRuns=freeTasks*agentShare*p.runs*retryFactor;
  const proRuns=proTasks*agentShare*p.runs*retryFactor;
  const enterpriseRuns=enterpriseTasks*agentShare*p.runs*retryFactor;
  const attempts=freeRuns+proRuns+enterpriseRuns;
  const computePerRun=p.seconds*p.costSec*(1-p.cache/100);
  const unitCost=computePerRun+p.orchestrationPerRun;
  const executionCost=attempts*unitCost;
  const otherDeliveryCost=active*p.otherCostPerAccount;
  const cost=executionCost+otherDeliveryCost;
  const proSubscription=pro*p.fee;
  const enterpriseSubscription=enterprise*p.enterpriseFee;
  const billableProRuns=Math.max(0,proRuns-pro*p.proIncludedRuns);
  const billableEnterpriseRuns=Math.max(0,enterpriseRuns-enterprise*p.enterpriseIncludedRuns);
  const usageRevenue=(billableProRuns+billableEnterpriseRuns)*p.priceRun;
  const revenue=proSubscription+enterpriseSubscription+usageRevenue;
  const row={month:i+1,active,free,pro,enterprise,tasks,agentShare,agentTasks,executions:attempts,freeRuns,proRuns,enterpriseRuns,billableProRuns,billableEnterpriseRuns,proSubscription,enterpriseSubscription,usageRevenue,computePerRun,unitCost,executionCost,otherDeliveryCost,cost,revenue,contribution:revenue-cost};
  // Month-end transitions: growth = gross additions, then free conversion, churn, upgrades.
  const conversions=free*p.freeConversion/1200;
  const proLoss=pro*p.proChurn/1200;
  const upgrades=pro*p.proUpgrade/1200;
  const enterpriseLoss=enterprise*p.enterpriseChurn/1200;
  free=Math.max(0,free*(1+p.freeGrowth/1200)-conversions);
  pro=Math.max(0,pro*(1+p.growth/1200)+conversions-proLoss-upgrades);
  enterprise=Math.max(0,enterprise*(1+p.enterpriseGrowth/1200)+upgrades-enterpriseLoss);
  return row;
 });
}
export const sum=(rows,key)=>rows.reduce((a,r)=>a+r[key],0);
export function underwrite(p,rows){
 const monthlyRate=p.discountRate/1200;
 const options=[{id:'Build',upfront:p.buildCost,eff:p.buildEff/100,ongoing:p.buildMonthly},{id:'Buy',upfront:p.buyCost,eff:p.buyEff/100,ongoing:p.buyMonthly}];
 const results=options.map(o=>{
  const monthly=rows.map(r=>r.executionCost*o.eff-o.ongoing);
  const cumulative=monthly.reduce((a,v)=>a+v,0)-o.upfront;
  const npv=monthly.reduce((a,v,i)=>a+v/Math.pow(1+monthlyRate,i+1),-o.upfront);
  let payback=null,acc=-o.upfront;
  monthly.forEach((v,i)=>{acc+=v;if(payback===null&&acc>=0)payback=i+1});
  return {...o,monthly,net3:cumulative,npv,payback,savings36:monthly.reduce((a,b)=>a+b,0),yr1:monthly.slice(0,12).reduce((a,b)=>a+b,0)};
 });
 const best=results.reduce((a,b)=>a.npv>b.npv?a:b);
 const choice=best.npv>0?best.id:'Defer';
 return {results,choice,best,doNothingNPV:0};
}
