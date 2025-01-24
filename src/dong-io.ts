declare global {
  interface Uint8Array {
    toBase64(): string;
  }
}

const blobBytes = async (blob: Blob) => {
  if ("bytes" in blob) return blob.bytes();
  return new Response(blob).arrayBuffer().then((buffer) => {
    const uint = new Uint8Array(buffer);
    return uint;
  });
};

export const createDong = async (
  image: File,
  audio: File
): Promise<Blob | string> => {
  if (
    image.type === "" ||
    !image.type.startsWith("image/") ||
    audio.type === "" ||
    !audio.type.startsWith("audio/")
  )
    return "Mime types invalid";
  return new Blob([
    // version
    (() => {
      const version = new Int8Array(new ArrayBuffer(2));
      version[0] = 0xd0;
      version[1] = 2;
      return version;
    })(),
    // image type
    image.type,
    // 00 padding
    new ArrayBuffer(256 - image.type.length),
    // image size
    (() => {
      const value = new Uint32Array(1);
      value[0] = image.size;
      return value;
    })(),
    // audio type
    audio.type,
    // 00 padding
    new ArrayBuffer(256 - audio.type.length),
    // audio size
    (() => {
      const value = new Uint32Array(1);
      value[0] = audio.size;
      return value;
    })(),
    // image data
    await blobBytes(image),
    // audio data
    await blobBytes(audio),
  ]);
};

export async function readDong(dongFile: File): Promise<
  | {
      image: { data: Uint8Array; mime: string };
      audio: { data: Uint8Array; mime: string };
    }
  | string
> {
  // get first 2 bytes and verify
  const version = new Uint8Array(await blobBytes(dongFile.slice(0, 2)));
  if (version[0] !== 0xd0 || version[1] !== 2) return "Invalid file";

  // get next 256 bytes and get mime type
  const imgMimeType: string | undefined = (
    await dongFile.slice(2, 258).text()
  ).match(/[a-zA-Z0-9.]+\/[a-zA-Z0-9.]+/gm)?.[0];
  if (!imgMimeType) return "Image mime type parse failed";

  // get next 4 bytes and get image size
  const imgSize = new Uint32Array(
    (await blobBytes(dongFile.slice(258, 262))).buffer
  )[0];

  // get next 256 bytes and get mime type
  const audMimeType: string | undefined = (
    await dongFile.slice(262, 518).text()
  ).match(/[a-zA-Z0-9.]+\/[a-zA-Z0-9.]+/gm)?.[0];
  if (!audMimeType) return "Audio mime type parse failed";

  // get next 4 bytes and get image size
  const audSize = new Uint32Array(
    (await blobBytes(dongFile.slice(518, 522))).buffer
  )[0];

  const imageBytes = await blobBytes(dongFile.slice(522, 522 + imgSize));
  const audioBytes = await blobBytes(
    dongFile.slice(522 + imgSize, 522 + imgSize + audSize)
  );

  return {
    image: {
      mime: imgMimeType,
      data: imageBytes,
    },
    audio: {
      mime: audMimeType,
      data: audioBytes,
    },
  };
}

export const download = (file: File) => {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
