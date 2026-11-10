// Carga y almacén de imágenes

const images = {};

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar: " + src));
    img.src = src;
  });
}

// names: lista como "objects/bed-pink" o "tiles/floor-wood" (carpetas dentro de public/)
export async function loadAssets(names) {
  await Promise.all(
    names.map(async (name) => {
      images[name] = await loadImage(`/${name}.png`);
    })
  );
}

export function getImage(name) {
  return images[name];
}
