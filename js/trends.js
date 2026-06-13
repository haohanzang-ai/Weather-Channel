'use strict';

// ── Trends ────────────────────────────────────────────────────────────────────
function renderTrends(){
  document.getElementById('trendsContent').innerHTML=`
    <div class="card" style="margin-bottom:14px">
      <h3 class="section-title">30-Day Temperature Trend — Statewide Average</h3>
      <div class="chart-wrap" style="height:200px"><canvas id="tempTrend" role="img" aria-label="30-day statewide average temperature trend"></canvas></div>
    </div>
    <div class="grid-2">
      <div class="card"><h3 class="section-title">Humidity Trend</h3><div class="chart-wrap"><canvas id="humTrend" role="img" aria-label="30-day humidity trend"></canvas></div></div>
      <div class="card"><h3 class="section-title">Monthly Rainfall</h3><div class="chart-wrap"><canvas id="rainChart" role="img" aria-label="Monthly rainfall totals in inches"></canvas></div></div>
    </div>
  `;
  const days = Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-29+i);return d.toLocaleDateString('en',{month:'short',day:'numeric'})});
  const sparse = (_,i)=>i%3===0;
  const tempData = days.map((_,i)=>Math.round(82+12*Math.sin(i/5)+Math.random()*4));
  const humData  = days.map((_,i)=>Math.round(55+15*Math.sin(i/7)+Math.random()*8));

  destroyChart('tempTrend'); destroyChart('humTrend'); destroyChart('rainChart');
  whenReady('tempTrend', ctx => {
    charts.set('tempTrend', new Chart(ctx,{type:'line',data:{labels:days.filter(sparse),datasets:[{label:'Avg Temp',data:tempData.filter(sparse),borderColor:'#F5A623',backgroundColor:'rgba(245,166,35,0.1)',tension:0.4,fill:true,pointRadius:2}]},options:chartOpts(v=>v+'°F')}));
  });
  whenReady('humTrend', ctx => {
    charts.set('humTrend', new Chart(ctx,{type:'line',data:{labels:days.filter(sparse),datasets:[{label:'Humidity',data:humData.filter(sparse),borderColor:'#4A90E2',tension:0.4,fill:false,pointRadius:2}]},options:chartOpts(v=>v+'%')}));
  });
  whenReady('rainChart', ctx => {
    charts.set('rainChart', new Chart(ctx,{type:'bar',data:{labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],datasets:[{label:'Rainfall (in)',data:[2.1,1.8,2.9,3.2,4.1,3.8,1.9,1.4,2.8,3.5,2.2,1.7],backgroundColor:'rgba(74,144,226,0.6)',borderColor:'#4A90E2',borderWidth:1,borderRadius:3}]},options:chartOpts(v=>v+'"')}));
  });
}
