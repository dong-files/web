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

const uint8array64 = (arru8: Uint8Array) => {
  if ("toBase64" in arru8) return arru8.toBase64();

  function _arrayBufferToBase64(bytes: Uint8Array) {
    var binary = "";
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  return _arrayBufferToBase64(arru8);
};

export const createDong = async (
  image: File,
  audio: File
): Promise<Blob | string> => {
  if (image.type === "" || audio.type === "") return "Mime types invalid";
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

// base 64 overload
export async function readDong(
  dongFile: File,
  opts?: { b64: true }
): Promise<
  | {
      image: { data: string; mime: string };
      audio: { data: string; mime: string };
    }
  | string
>;
// standard overload
export async function readDong(
  dongFile: File,
  opts?: { b64: false }
): Promise<
  | {
      image: { data: Uint8Array; mime: string };
      audio: { data: Uint8Array; mime: string };
    }
  | string
>;

export async function readDong(
  dongFile: File,
  opts?: { b64: boolean }
): Promise<
  | {
      image: { data: Uint8Array | string; mime: string };
      audio: { data: Uint8Array | string; mime: string };
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
      data: opts?.b64 ? uint8array64(imageBytes) : imageBytes,
    },
    audio: {
      mime: audMimeType,
      data: opts?.b64 ? uint8array64(audioBytes) : audioBytes,
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
