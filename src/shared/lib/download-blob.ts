// Forza descarga de un Blob recibido del backend creando un <a> efimero.
// Lo extraemos a helper porque tanto la plantilla de import como los reportes
// de error siguen el mismo patron y no queremos duplicar la logica de cleanup.
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Liberamos el objectURL un poco despues del click para asegurarnos que el
  // navegador haya iniciado la descarga.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
