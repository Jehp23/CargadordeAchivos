// Verificación + CRUD simple (crear desde input, editar/reemplazar, borrar)
(function () {
  const input = document.getElementById('archivos');
  const out = document.getElementById('resultados');
  const btnClear = document.getElementById('btn-limpiar');

  // Estado en memoria
  let items = []; // { id, file, url, title, issues[] }

  const MAX_MB = 5;
  const MAX_BYTES = MAX_MB * 1024 * 1024;

  // Utils -----------------------------
  const uid = () => Math.random().toString(36).slice(2, 9);
  function bytesToSize(bytes){
    const units = ['B','KB','MB','GB'];
    let i = 0, n = bytes;
    while(n >= 1024 && i < units.length-1){ n /= 1024; i++; }
    return n.toFixed(n < 10 && i > 0 ? 1 : 0) + ' ' + units[i];
  }
  function showPlaceholder(){
    out.innerHTML = '<p class="placeholder">No se seleccionaron archivos</p>';
  }

  function validateFile(file){
    const issues = [];
    const isImage = file.type.startsWith('image/');
    if (!isImage){
      issues.push({ level:'bad', text:'No es una imagen válida.' });
    }
    if (file.size > MAX_BYTES){
      issues.push({ level:'warn', text:`Excede ${MAX_MB} MB.` });
    }
    return issues;
  }

  // Render -----------------------------
  function render(){
    if (!items.length){ showPlaceholder(); return; }
    out.innerHTML = '';

    items.forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = 'item';
      card.dataset.id = it.id;

      // Imagen
      const img = document.createElement('img');
      img.className = 'thumb';
      if (it.url) img.src = it.url;
      img.alt = it.title || it.file?.name || 'Imagen';

      // Título editable
      const title = document.createElement('input');
      title.className = 'title-edit';
      title.placeholder = 'Título (editable)';
      title.value = it.title ?? (it.file ? it.file.name.replace(/\.[^.]+$/, '') : '');
      title.addEventListener('input', () => {
        it.title = title.value.trim();
      });

      // Metadatos
      const meta = document.createElement('div');
      meta.className = 'meta';
      const lines = [];
      if (it.file){
        lines.push(`<strong>${it.file.name}</strong>`);
        lines.push(`Tipo: ${it.file.type || 'desconocido'}`);
        lines.push(`Tamaño: ${bytesToSize(it.file.size)}`);
      }else{
        lines.push('<strong>(sin archivo)</strong>');
      }
      if (it.issues?.length){
        const msg = it.issues.map(m => `<div class="${m.level}">• ${m.text}</div>`).join('');
        lines.push(msg);
      }
      meta.innerHTML = lines.join('<br/>');

      // Botones
      const row = document.createElement('div');
      row.className = 'row';

      // Reemplazar (Editar)
      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn primary';
      btnEdit.textContent = 'Editar (reemplazar)';
      btnEdit.addEventListener('click', () => openReplaceDialog(it.id));

      // Borrar
      const btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.className = 'btn danger';
      btnDelete.textContent = 'Borrar';
      btnDelete.addEventListener('click', () => removeItem(it.id));

      // Descargar (opcional útil en entregas)
      const btnDownload = document.createElement('a');
      btnDownload.className = 'btn';
      btnDownload.textContent = 'Descargar';
      btnDownload.href = it.url || '#';
      btnDownload.download = it.file?.name || 'imagen';
      btnDownload.setAttribute('role','button');

      row.append(btnEdit, btnDelete, btnDownload);

      card.append(img, title, meta, row);
      out.appendChild(card);
    });
  }

  // Acciones -----------------------------
  function addFiles(fileList){
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const newItems = files.map(file => {
      const url = URL.createObjectURL(file);
      return {
        id: uid(),
        file,
        url,
        title: file.name.replace(/\.[^.]+$/, ''),
        issues: validateFile(file)
      };
    });

    items = items.concat(newItems);
    render();
  }

  function removeItem(id){
    const idx = items.findIndex(x => x.id === id);
    if (idx >= 0){
      // liberar URL de objeto
      if (items[idx].url) URL.revokeObjectURL(items[idx].url);
      items.splice(idx, 1);
      render();
    }
  }

  function openReplaceDialog(id){
    const idx = items.findIndex(x => x.id === id);
    if (idx < 0) return;

    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.className = 'hidden';
    document.body.appendChild(picker);
    picker.addEventListener('change', () => {
      const f = picker.files?.[0];
      if (!f){ picker.remove(); return; }
      // Reemplazar
      if (items[idx].url) URL.revokeObjectURL(items[idx].url);
      items[idx].file = f;
      items[idx].url = URL.createObjectURL(f);
      items[idx].issues = validateFile(f);
      // si el título estaba vacío, tomar nombre nuevo
      if (!items[idx].title) items[idx].title = f.name.replace(/\.[^.]+$/, '');
      render();
      picker.remove();
    }, { once:true });
    picker.click();
  }

  function clearAll(){
    items.forEach(it => it.url && URL.revokeObjectURL(it.url));
    items = [];
    render();
  }

  // Eventos -----------------------------
  input.addEventListener('change', () => {
    addFiles(input.files);
    // permitir volver a elegir los mismos archivos luego
    input.value = '';
  });

  btnClear.addEventListener('click', clearAll);

  // Inicio
  render();
})();
