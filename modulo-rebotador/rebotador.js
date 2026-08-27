let datos=[], scanner=null, archivoOriginal=null;

function col(letra){return XLSX.utils.decode_col(letra)-0;}

function cargarExcel(){
 const f=document.getElementById('excelFile').files[0];
 if(!f)return;
 archivoOriginal=f;
 const r=new FileReader();
 r.onload=e=>{
  const wb=XLSX.read(e.target.result,{type:'array'});
  const ws=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{header:1});
  datos=rows.slice(1).map((x,i)=>({
   fila:i+2,
   chasis:String(x[col(CONFIG_EXCEL.chasis)]||''),
   playa:String(x[col(CONFIG_EXCEL.playa)]||''),
   bloque:String(x[col(CONFIG_EXCEL.bloque)]||''),
   observaciones:String(x[col(CONFIG_EXCEL.observaciones)]||'')
  })).filter(x=>x.chasis);
  cargarSelectores();
  alert("Excel cargado");
  document.getElementById("nombreArchivo").textContent = "Cargado";
 };
 r.readAsArrayBuffer(f);
}
function cargarSelectores(){
 let p=[...new Set(datos.map(x=>x.playa))], b=[...new Set(datos.map(x=>x.bloque))];
 playa.innerHTML=p.map(x=>`<option>${x}</option>`).join('');
 bloque.innerHTML=b.map(x=>`<option>${x}</option>`).join('');
}
function procesar(codigo){
 let encontrados=datos.filter(x=>x.chasis.toUpperCase()===codigo.toUpperCase() || x.chasis.toUpperCase().endsWith(codigo.toUpperCase()));
 if(!encontrados.length){mostrar("CHASIS INVALIDO");return;}
 if(encontrados.length>1){mostrar(encontrados.map((x,i)=>`${i+1}) ${x.chasis}`).join("<br>"));return;}
 mostrarVehiculo(encontrados[0]);
}
function mostrar(t){lista.innerHTML='<div class="vehiculo">'+t+'</div>';}
function mostrarVehiculo(v){
 lista.innerHTML=`<div class="vehiculo"><b>Vehículo correcto</b><br>${v.chasis}<br>Playa ${v.playa} Bloque ${v.bloque}<br>Obs: ${v.observaciones||'Sin observaciones'}<br>
<button onclick="obs('${v.chasis}')">Observación</button></div>`;
}
function obs(c){
 let v=datos.find(x=>x.chasis===c); let n=prompt("Observación",v.observaciones);
 if(n!==null){v.observaciones=n;mostrarVehiculo(v);}
}
function buscarManual(){procesar(document.getElementById('manual').value.trim());}
function iniciarScanner(){
 if(scanner)return;
 document.getElementById("reader").classList.add("activo");
 scanner=new Html5Qrcode("reader");
 scanner.start({facingMode:"environment"},{fps:10,qrbox:250},c=>{scanner.stop();procesar(c);});
}
function mostrarArchivo(input) {
    const texto = document.getElementById("nombreArchivo");

    if (input.files.length > 0) {
        texto.textContent = input.files[0].name;
    }
}
