import assert from 'node:assert/strict';
import {DEFAULTS,forecast,sum,underwrite} from './app/finance.js';
const eq=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const base=forecast(DEFAULTS,'base');const fast=forecast(DEFAULTS,'fast');const slow=forecast(DEFAULTS,'cautious');
assert.equal(base.length,36);
assert.ok(fast[0].agentShare>base[0].agentShare);
assert.ok(slow[0].agentShare<base[0].agentShare);
assert.ok(fast[0].executions>base[0].executions);
assert.ok(fast[0].executionCost>base[0].executionCost);
eq(base[0].revenue,base[0].proSubscription+base[0].enterpriseSubscription+base[0].usageRevenue);
eq(base[0].cost,base[0].executionCost+base[0].otherDeliveryCost);
eq(base[0].executionCost,base[0].executions*(base[0].computePerRun+DEFAULTS.orchestrationPerRun));
const doubled=forecast({...DEFAULTS,seconds:90},'base');assert.ok(doubled[0].executionCost>base[0].executionCost);eq(doubled[0].revenue,base[0].revenue);
const zeroPrice=forecast({...DEFAULTS,priceRun:0},'base');eq(zeroPrice[0].revenue,zeroPrice[0].proSubscription+zeroPrice[0].enterpriseSubscription);
const conservative=underwrite(DEFAULTS,fast);assert.equal(conservative.choice,'Defer');
const rich=underwrite({...DEFAULTS,buildCost:100,buildMonthly:0,buildEff:80},forecast({...DEFAULTS,accounts:2000,tasks:500},'fast'));assert.ok(['Build','Buy'].includes(rich.choice));
for(const o of conservative.results){eq(o.net3,o.savings36-o.upfront);eq(o.npv,o.monthly.reduce((a,v,i)=>a+v/Math.pow(1+DEFAULTS.discountRate/1200,i+1),-o.upfront));}
// Segmentation and subscription accounting invariants.
for (const r of base) {
 eq(r.active,r.free+r.pro+r.enterprise);
 eq(r.executions,r.freeRuns+r.proRuns+r.enterpriseRuns);
 eq(r.revenue,r.proSubscription+r.enterpriseSubscription+r.usageRevenue);
 assert.ok(r.billableProRuns>=0&&r.billableEnterpriseRuns>=0);
}
const noPaid=forecast({...DEFAULTS,accounts:0,enterpriseAccounts:0,freeConversion:0,freeGrowth:0},'base');
eq(noPaid[0].revenue,0);
assert.ok(noPaid[0].cost>0);
const noOverages=forecast({...DEFAULTS,proIncludedRuns:1000000,enterpriseIncludedRuns:1000000},'base');
eq(noOverages[0].usageRevenue,0);
const allPro=forecast({...DEFAULTS,freeAccounts:0,enterpriseAccounts:0,freeConversion:0,proUpgrade:0},'base');
eq(allPro[0].enterpriseSubscription,0);
assert.ok(base[11].enterprise>base[0].enterprise);
console.log('PASS: cash flow, segmentation, revenue bridges, free-tier costs, included allowances, cohort movement, agent mix and investment abstention.');
console.log(JSON.stringify({baseRevenueYear1:sum(base.slice(0,12),'revenue'),baseCostYear1:sum(base.slice(0,12),'cost'),investment:conservative.results.map(x=>({option:x.id,npv:x.npv,net3:x.net3})),choice:conservative.choice},null,2));
