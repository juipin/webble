const kSvc = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
const kRx = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
const kTx = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'
let device
let server
let rx
let tx
let allBeds = {}
function pad3(n){return n.toString().padStart(3,'0')}
function showStatus(s){document.getElementById('status').textContent=s}
function renderAllBeds(){
  const el = document.getElementById('allBeds')
  const entries = Object.entries(allBeds).sort((a,b)=>a[0]-b[0])
  el.innerHTML = entries.map(([id,st])=>`<div>Bed ${pad3(id)}: ${st}</div>`).join('')
}
function handleMsg(s){
  if(s.startsWith('#BEDS###')){
    const id = parseInt(s.slice(8,11))
    allBeds[id]='Connected'
    renderAllBeds()
  } else if(s.startsWith('#MPR')){
    renderAllBeds()
  } else if(s.startsWith('#POSE###')){
    renderAllBeds()
  }
}
async function connect(){
  showStatus('Requesting device')
  device = await navigator.bluetooth.requestDevice({filters:[{name:'Smartbed_Hub'}],optionalServices:[kSvc]})
  server = await device.gatt.connect()
  const svc = await server.getPrimaryService(kSvc)
  rx = await svc.getCharacteristic(kRx)
  tx = await svc.getCharacteristic(kTx)
  await tx.startNotifications()
  tx.addEventListener('characteristicvaluechanged',e=>{
    const v = new TextDecoder().decode(e.target.value)
    handleMsg(v)
  })
  showStatus('Connected')
  await rx.writeValue(new TextEncoder().encode('#SCANBED'))
}
document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.getElementById('connectBtn')
  btn.addEventListener('click',()=>{connect().catch(e=>showStatus(String(e)))})
})
